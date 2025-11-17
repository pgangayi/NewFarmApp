// Main Livestock API - Consolidated and Upgraded
// Features: Core CRUD, Health/Production Records, Movement Tracking, Intake/Pedigree Validation, Stats.

import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../_auth.js";
import { DatabaseOperations, DB_ERROR_CODES } from "../_database.js";
import { AnimalRepository } from "../repositories/index.js";
import { DatabaseError } from "../_errors.js";

// --- New Constants for Validation ---
const NESTED_ENTITIES = new Set([
  "health-records",
  "production",
  "breeding",
  "feeding",
  "movements", // Fully implemented
]);

const INTAKE_TYPES = new Set(["Birth", "Purchase", "Transfer"]);

/**
 * Extracts the relevant path segments after "/livestock".
 */
function getLivestockPathSegments(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const livestockIndex = segments.indexOf("livestock");
  if (livestockIndex === -1) {
    return [];
  }
  return segments.slice(livestockIndex + 1);
}

/**
 * Checks if a user has access to a specific animal and returns the farm_id.
 */
async function checkAnimalAccess(db, userId, animalId, requiredRoles = null) {
  try {
    const query = `
      SELECT a.farm_id, fm.role
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ?
      LIMIT 1
    `;
    const { data } = await db.executeQuery(query, [animalId, userId], {
      operation: "first",
    });

    if (!data) {
      return null;
    }

    if (requiredRoles && !requiredRoles.includes(data.role)) {
      return null;
    }

    return data.farm_id;
  } catch (error) {
    console.error("Error checking animal access:", error);
    return null;
  }
}

/**
 * Handles database errors and returns an appropriate response.
 */
function handleDbError(error, context) {
  console.error(`Error in ${context}:`, error);
  if (error instanceof DatabaseError) {
    switch (error.code) {
      case DB_ERROR_CODES.NOT_FOUND:
        return createErrorResponse("Resource not found", 404);
      case DB_ERROR_CODES.DEPENDENCY_VIOLATION:
        return createErrorResponse(
          "Cannot delete resource due to existing dependencies",
          409
        );
      case DB_ERROR_CODES.INVALID_PARAMETER:
        return createErrorResponse(`Invalid data: ${error.message}`, 400);
      case DB_ERROR_CODES.SUSPICIOUS_ACTIVITY:
        return createErrorResponse("Invalid request", 400);
    }
  }
  return createErrorResponse("Internal server error", 500);
}

// --- Main Request Handler ---

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  const db = new DatabaseOperations(env);
  const animalRepo = new AnimalRepository(db);

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    const routeSegments = getLivestockPathSegments(pathname);

    if (routeSegments.length === 0) {
      if (method === "GET") {
        return await handleGetLivestock(context, user, animalRepo);
      }
      if (method === "POST") {
        return await handleCreateAnimal(context, user, db, animalRepo);
      }
      return createErrorResponse("Method not allowed", 405);
    }

    const firstSegment = routeSegments[0];

    // Handle /livestock/stats
    if (firstSegment === "stats" && routeSegments.length === 1) {
      if (method === "GET") {
        return await handleLivestockStats(context, user, db);
      }
      return createErrorResponse("Method not allowed", 405);
    }

    const animalId = firstSegment;

    // Handle /livestock/:animalId
    if (routeSegments.length === 1) {
      if (method === "GET") {
        return await getAnimalById(context, user, animalId, animalRepo);
      }
      if (method === "PUT") {
        return await updateAnimal(context, user, animalId, db, animalRepo);
      }
      if (method === "DELETE") {
        return await deleteAnimal(context, user, animalId, db);
      }
      return createErrorResponse("Method not allowed", 405);
    }

    const nestedResource = routeSegments[1];
    const recordId = routeSegments[2] || null;

    // Handle /livestock/:animalId/pedigree (NEW ROUTE)
    if (routeSegments.length === 2 && nestedResource === "pedigree") {
      if (method === "GET") {
        const farmId = await checkAnimalAccess(db, user.id, animalId);
        if (!farmId) {
          return createErrorResponse("Animal not found or access denied", 404);
        }
        return await handleGetPedigree(context, user, animalId, db);
      }
      return createErrorResponse("Method not allowed", 405);
    }

    // Handle /livestock/:animalId/:nestedResource[/:recordId]
    if (NESTED_ENTITIES.has(nestedResource)) {
      const farmId = await checkAnimalAccess(db, user.id, animalId);
      if (!farmId) {
        return createErrorResponse("Animal not found or access denied", 404);
      }

      const nestedContext = { ...context, recordId, farmId };

      switch (nestedResource) {
        case "health-records":
          return handleHealthRecords(nestedContext, user, animalId, db);
        case "production":
          return handleProductionRecords(nestedContext, user, animalId, db);
        case "breeding":
          return handleBreedingRecords(nestedContext, user, animalId, db);
        case "feeding":
          return handleFeedingRecords(nestedContext, user, animalId, db);
        case "movements":
          return handleMovementRecords(nestedContext, user, animalId, db); // IMPLEMENTED
      }
    }

    return createErrorResponse("Invalid endpoint", 404);
  } catch (error) {
    return handleDbError(error, "onRequest");
  }
}

// --- Animal Core Handlers ---

async function handleGetLivestock(context, user, animalRepo) {
  const url = new URL(context.request.url);
  const {
    species,
    breed,
    health_status,
    sex,
    farm_id,
    search,
    current_location_id, // Added filter
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc",
  } = Object.fromEntries(url.searchParams);

  try {
    const filters = {
      species,
      breed,
      health_status,
      sex,
      farm_id,
      search,
      current_location_id,
    };
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sort_by,
      sortDirection: sort_order,
    };

    const animals = await animalRepo.findByUserAccess(
      user.id,
      filters,
      options
    );
    const total = await animalRepo.countByUserAccess(user.id, filters);

    return createSuccessResponse({
      animals: animals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return handleDbError(error, "handleGetLivestock");
  }
}

async function getAnimalById(context, user, animalId, animalRepo) {
  try {
    const animal = await animalRepo.findWithDetails(animalId, user.id);
    if (!animal) {
      return createErrorResponse("Animal not found or access denied", 404);
    }
    return createSuccessResponse(animal);
  } catch (error) {
    return handleDbError(error, "getAnimalById");
  }
}

/**
 * POST /livestock
 * @upgrade Added intake type validation, purchase/birth specific fields, and location checks.
 */
async function handleCreateAnimal(context, user, db, animalRepo) {
  try {
    const body = await context.request.json();
    const {
      farm_id,
      name,
      species,
      breed,
      sex,
      identification_tag,
      intake_type,
      intake_date,
      purchase_price,
      seller_details, // Intake Fields
      father_id,
      mother_id,
      current_location_id, // Location Field
      // ... other optional fields like birth_date, health_status
    } = body;

    // 1. Basic & Intake Type Validation
    if (!farm_id || !name || !species || !intake_type || !intake_date) {
      return createErrorResponse(
        "Farm ID, name, species, intake type, and intake date are required",
        400
      );
    }
    if (!INTAKE_TYPES.has(intake_type)) {
      return createErrorResponse(
        "Invalid intake_type. Must be Birth, Purchase, or Transfer.",
        400
      );
    }

    // 2. Intake-Specific Validation
    if (
      intake_type === "Purchase" &&
      (!purchase_price ||
        isNaN(parseFloat(purchase_price)) ||
        parseFloat(purchase_price) <= 0)
    ) {
      return createErrorResponse(
        "Purchase intake requires a valid positive purchase_price.",
        400
      );
    }
    if (intake_type === "Birth" && !mother_id) {
      return createErrorResponse("Birth intake requires a mother_id.", 400);
    }

    // 3. Location Validation (Check if location exists on this farm)
    if (current_location_id) {
      const locationCheck = await db.findById(
        "locations",
        current_location_id,
        "farm_id",
        { userId: user.id }
      );
      if (!locationCheck || locationCheck.farm_id !== farm_id) {
        return createErrorResponse(
          "Invalid or inaccessible current_location_id.",
          400
        );
      }
    }

    // 4. Pedigree Validation (Check if parents exist, same species, correct sex, same farm)
    if (father_id || mother_id) {
      const parentIds = [father_id, mother_id].filter((id) => id);
      const parentRecords = await db.findMany(
        "animals",
        { id: parentIds },
        { userId: user.id, columns: "id, farm_id, species, sex" }
      );

      if (parentRecords.data.length !== parentIds.length) {
        return createErrorResponse(
          "One or more parent IDs were not found.",
          404
        );
      }

      for (const parent of parentRecords.data) {
        if (parent.farm_id !== farm_id || parent.species !== species) {
          return createErrorResponse(
            `Parent animal (ID: ${parent.id}) failed farm/species validation.`,
            400
          );
        }
        if (father_id && parent.id === father_id && parent.sex !== "male") {
          return createErrorResponse(
            "Father ID must refer to a male animal.",
            400
          );
        }
        if (mother_id && parent.id === mother_id && parent.sex !== "female") {
          return createErrorResponse(
            "Mother ID must refer to a female animal.",
            400
          );
        }
      }
    }
    // --- END BREEDING VALIDATION ---

    const animalData = {
      farm_id,
      name,
      species,
      breed: breed || null,
      sex,
      identification_tag,
      intake_type,
      intake_date,
      purchase_price: purchase_price || null,
      seller_details: seller_details || null,
      father_id: father_id || null,
      mother_id: mother_id || null,
      current_location_id: current_location_id || null,
      health_status: body.health_status || "healthy",
      // If intake_type is Birth, use intake_date as birth_date
      birth_date:
        body.birth_date || (intake_type === "Birth" ? intake_date : null),
    };

    const newAnimal = await animalRepo.createWithValidation(
      animalData,
      user.id
    );
    const detailedAnimal = await animalRepo.findWithDetails(
      newAnimal.id,
      user.id
    );

    return createSuccessResponse(detailedAnimal, 201);
  } catch (error) {
    if (
      error.message.includes("Farm not found") ||
      error.message.includes("Breed not found")
    ) {
      return createErrorResponse(error.message, 400);
    }
    return handleDbError(error, "handleCreateAnimal");
  }
}

async function updateAnimal(context, user, animalId, db, animalRepo) {
  try {
    const body = await context.request.json();
    // Fields that should NOT be updated directly via PUT
    delete body.farm_id;
    delete body.intake_type;
    // Location update logic handled below
    const { current_location_id, ...updateData } = body;

    const farmId = await checkAnimalAccess(db, user.id, animalId);
    if (!farmId) {
      return createErrorResponse("Animal not found or access denied", 404);
    }

    if (current_location_id) {
      // Validate new location ID before updating
      const locationCheck = await db.findById(
        "locations",
        current_location_id,
        "farm_id",
        { userId: user.id }
      );
      if (!locationCheck || locationCheck.farm_id !== farmId) {
        return createErrorResponse(
          "Invalid or inaccessible current_location_id for update.",
          400
        );
      }
      updateData.current_location_id = current_location_id;
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    await db.updateById("animals", animalId, updateData, { userId: user.id });
    const updatedAnimal = await animalRepo.findWithDetails(animalId, user.id);

    return createSuccessResponse(updatedAnimal);
  } catch (error) {
    return handleDbError(error, "updateAnimal");
  }
}

async function deleteAnimal(context, user, animalId, db) {
  try {
    const farmId = await checkAnimalAccess(db, user.id, animalId, [
      "owner",
      "manager",
      "admin",
    ]);
    if (!farmId) {
      return createErrorResponse(
        "Animal not found or insufficient permissions",
        404
      );
    }

    await db.deleteById("animals", animalId, { userId: user.id });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleDbError(error, "deleteAnimal");
  }
}

// --- Nested Resource Handlers ---

// (Health Records and Production Records handlers remain as in the previous step)

async function handleHealthRecords(context, user, animalId, db) {
  const { request, recordId } = context;
  const method = request.method;
  const numericAnimalId = Number(animalId);

  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchHealthRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Health record not found", 404);
        }
        return createSuccessResponse(record);
      }

      const url = new URL(request.url);
      const recordType = url.searchParams.get("record_type");
      const status = url.searchParams.get("status");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");

      let query = `
        SELECT hr.*, a.name as animal_name, u.name as recorded_by_name
        FROM animal_health_records hr
        JOIN animals a ON hr.animal_id = a.id
        LEFT JOIN users u ON hr.created_by = u.id
        WHERE hr.animal_id = ?
      `;
      const params = [numericAnimalId];

      if (recordType) {
        query += " AND hr.record_type = ?";
        params.push(recordType);
      }

      if (status === "overdue") {
        query +=
          " AND hr.next_due_date < date('now') AND hr.next_due_date IS NOT NULL";
      } else if (status === "upcoming") {
        query +=
          " AND hr.next_due_date BETWEEN date('now') AND date('now', '+7 days') AND hr.next_due_date IS NOT NULL";
      }

      if (dateFrom) {
        query += " AND hr.record_date >= ?";
        params.push(dateFrom);
      }

      if (dateTo) {
        query += " AND hr.record_date <= ?";
        params.push(dateTo);
      }

      query += " ORDER BY hr.record_date DESC, hr.created_at DESC";

      const { data } = await db.executeQuery(query, params, {
        operation: "all",
        table: "animal_health_records",
        userId: user.id,
      });

      return createSuccessResponse(data || []);
    }

    if (method === "POST") {
      const body = await request.json();
      const {
        record_date,
        record_type,
        vet_name,
        diagnosis,
        treatment,
        medication,
        dosage,
        cost,
        next_due_date,
        vet_contact,
        notes,
      } = body;

      if (!record_date || !record_type) {
        return createErrorResponse(
          "Record date and record type are required",
          400
        );
      }

      const recordData = {
        animal_id: numericAnimalId,
        record_date,
        record_type,
        vet_name: toNullableString(vet_name),
        diagnosis: toNullableString(diagnosis),
        treatment: toNullableString(treatment),
        medication: toNullableString(medication),
        dosage: toNullableString(dosage),
        cost: toNullableNumber(cost),
        next_due_date: toNullableString(next_due_date),
        vet_contact: toNullableString(vet_contact),
        notes: toNullableString(notes),
        created_by: user.id,
      };

      const created = await db.create("animal_health_records", recordData, {
        userId: user.id,
      });

      const enriched =
        (await fetchHealthRecordById(db, user.id, created?.id)) || created;

      return createSuccessResponse(enriched, 201);
    }

    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById(
        "animal_health_records",
        recordId,
        "*",
        { userId: user.id }
      );

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Health record not found", 404);
      }

      const body = await request.json();
      const updateData = {};

      const fieldMap = {
        record_date: body.record_date,
        record_type: body.record_type,
        vet_name: body.vet_name,
        diagnosis: body.diagnosis,
        treatment: body.treatment,
        medication: body.medication,
        dosage: body.dosage,
        cost: body.cost,
        next_due_date: body.next_due_date,
        vet_contact: body.vet_contact,
        notes: body.notes,
      };

      for (const [key, value] of Object.entries(fieldMap)) {
        if (value !== undefined) {
          updateData[key] =
            key === "cost"
              ? toNullableNumber(value)
              : sanitizeNullableValue(value);
        }
      }

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }

      updateData.updated_at = new Date().toISOString();

      const updated = await db.updateById(
        "animal_health_records",
        recordId,
        updateData,
        { userId: user.id }
      );

      const enriched =
        (await fetchHealthRecordById(db, user.id, updated?.id)) || updated;

      return createSuccessResponse(enriched);
    }

    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById(
        "animal_health_records",
        recordId,
        "animal_id",
        { userId: user.id }
      );

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Health record not found", 404);
      }

      await db.deleteById("animal_health_records", recordId, {
        userId: user.id,
      });

      return createSuccessResponse({ success: true });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    return handleDbError(error, "handleHealthRecords");
  }
}

async function handleProductionRecords(context, user, animalId, db) {
  const { request, recordId } = context;
  const method = request.method;
  const numericAnimalId = Number(animalId);

  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchProductionRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Production record not found", 404);
        }
        return createSuccessResponse(record);
      }

      const url = new URL(request.url);
      const date = url.searchParams.get("date");

      let query = `
        SELECT pr.*, a.name as animal_name, u.name as recorded_by_name
        FROM animal_production pr
        JOIN animals a ON pr.animal_id = a.id
        LEFT JOIN users u ON pr.recorded_by = u.id
        WHERE pr.animal_id = ?
      `;
      const params = [numericAnimalId];

      if (date) {
        query += " AND pr.production_date = ?";
        params.push(date);
      }

      query +=
        " ORDER BY pr.production_date DESC, pr.created_at DESC, pr.id DESC";

      const { data } = await db.executeQuery(query, params, {
        operation: "all",
        table: "animal_production",
        userId: user.id,
      });

      return createSuccessResponse(data || []);
    }

    if (method === "POST") {
      const body = await request.json();
      const {
        production_date,
        production_type,
        quantity,
        unit,
        quality_grade,
        price_per_unit,
        total_value,
        market_destination,
        storage_location,
        notes,
      } = body;

      if (!production_date || !production_type) {
        return createErrorResponse(
          "Production date and type are required",
          400
        );
      }

      const normalizedQuantity = Number(quantity);
      if (Number.isNaN(normalizedQuantity)) {
        return createErrorResponse("Quantity must be a number", 400);
      }

      const pricePerUnit = toNullableNumber(price_per_unit);
      const computedTotal =
        total_value !== undefined && total_value !== null
          ? toNullableNumber(total_value)
          : pricePerUnit !== null
          ? Number((normalizedQuantity * pricePerUnit).toFixed(2))
          : null;

      const recordData = {
        animal_id: numericAnimalId,
        production_date,
        production_type,
        quantity: normalizedQuantity,
        unit: toNullableString(unit),
        quality_grade: toNullableString(quality_grade),
        price_per_unit: pricePerUnit,
        total_value: computedTotal,
        market_destination: toNullableString(market_destination),
        storage_location: toNullableString(storage_location),
        notes: toNullableString(notes),
        recorded_by: user.id,
      };

      const created = await db.create("animal_production", recordData, {
        userId: user.id,
      });

      const enriched =
        (await fetchProductionRecordById(db, user.id, created?.id)) || created;

      return createSuccessResponse(enriched, 201);
    }

    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById("animal_production", recordId, "*", {
        userId: user.id,
      });

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Production record not found", 404);
      }

      const body = await request.json();
      const updateData = {};

      if (body.production_date !== undefined) {
        updateData.production_date = sanitizeNullableValue(
          body.production_date
        );
      }
      if (body.production_type !== undefined) {
        updateData.production_type = sanitizeNullableValue(
          body.production_type
        );
      }
      if (body.quantity !== undefined) {
        const normalizedQuantity = Number(body.quantity);
        if (Number.isNaN(normalizedQuantity)) {
          return createErrorResponse("Quantity must be a number", 400);
        }
        updateData.quantity = normalizedQuantity;
      }
      if (body.unit !== undefined) {
        updateData.unit = toNullableString(body.unit);
      }
      if (body.quality_grade !== undefined) {
        updateData.quality_grade = toNullableString(body.quality_grade);
      }
      if (body.price_per_unit !== undefined) {
        updateData.price_per_unit = toNullableNumber(body.price_per_unit);
      }
      if (body.total_value !== undefined) {
        updateData.total_value = toNullableNumber(body.total_value);
      }
      if (body.market_destination !== undefined) {
        updateData.market_destination = toNullableString(
          body.market_destination
        );
      }
      if (body.storage_location !== undefined) {
        updateData.storage_location = toNullableString(body.storage_location);
      }
      if (body.notes !== undefined) {
        updateData.notes = toNullableString(body.notes);
      }

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }

      updateData.updated_at = new Date().toISOString();

      const updated = await db.updateById(
        "animal_production",
        recordId,
        updateData,
        { userId: user.id }
      );

      const enriched =
        (await fetchProductionRecordById(db, user.id, updated?.id)) || updated;

      return createSuccessResponse(enriched);
    }

    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById(
        "animal_production",
        recordId,
        "animal_id",
        { userId: user.id }
      );

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Production record not found", 404);
      }

      await db.deleteById("animal_production", recordId, {
        userId: user.id,
      });

      return createSuccessResponse({ success: true });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    return handleDbError(error, "handleProductionRecords");
  }
}

async function handleBreedingRecords(context, user, animalId, db) {
  const { request, recordId, farmId } = context;
  const method = request.method;
  const numericAnimalId = Number(animalId);

  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchBreedingRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Breeding record not found", 404);
        }
        return createSuccessResponse(record);
      }

      let query = `
        SELECT br.*, sire.name as sire_name, u.name as created_by_name
        FROM animal_breeding br
        LEFT JOIN animals sire ON br.partner_id = sire.id
        LEFT JOIN users u ON br.created_by = u.id
        WHERE br.animal_id = ?
        ORDER BY br.breeding_date DESC, br.created_at DESC, br.id DESC
      `;

      const { data } = await db.executeQuery(query, [numericAnimalId], {
        operation: "all",
        table: "animal_breeding",
        userId: user.id,
      });

      const normalized = (data || []).map((record) =>
        normalizeBreedingRecord(record)
      );

      return createSuccessResponse(normalized);
    }

    if (method === "POST") {
      const body = await request.json();
      const {
        breeding_date,
        breeding_type,
        sire_id,
        breeding_fee,
        expected_calving_date,
        actual_calving_date,
        breeding_result,
        offspring_count,
        breeding_notes,
        vet_supervision,
      } = body;

      if (!breeding_date || !breeding_type) {
        return createErrorResponse("Breeding date and type are required", 400);
      }

      if (sire_id) {
        const sireFarmId = await checkAnimalAccess(db, user.id, sire_id);
        if (!sireFarmId || (farmId && sireFarmId !== farmId)) {
          return createErrorResponse("Invalid sire selection", 400);
        }
      }

      const recordData = {
        animal_id: numericAnimalId,
        breeding_date,
        breeding_type,
        partner_id: sire_id || null,
        breeding_fee: toNullableNumber(breeding_fee),
        expected_birth_date: toNullableString(expected_calving_date),
        actual_birth_date: toNullableString(actual_calving_date),
        breeding_result: toNullableString(breeding_result),
        offspring_count: toNullableInt(offspring_count),
        notes: toNullableString(breeding_notes),
        vet_supervision: vet_supervision ? 1 : 0,
        created_by: user.id,
      };

      const created = await db.create("animal_breeding", recordData, {
        userId: user.id,
      });

      const enriched =
        (await fetchBreedingRecordById(db, user.id, created?.id)) || created;

      return createSuccessResponse(enriched, 201);
    }

    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById("animal_breeding", recordId, "*", {
        userId: user.id,
      });

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Breeding record not found", 404);
      }

      const body = await request.json();
      const updateData = {};

      if (body.breeding_date !== undefined) {
        updateData.breeding_date = sanitizeNullableValue(body.breeding_date);
      }
      if (body.breeding_type !== undefined) {
        updateData.breeding_type = sanitizeNullableValue(body.breeding_type);
      }
      if (body.sire_id !== undefined) {
        if (body.sire_id) {
          const sireFarmId = await checkAnimalAccess(db, user.id, body.sire_id);
          if (!sireFarmId || (farmId && sireFarmId !== farmId)) {
            return createErrorResponse("Invalid sire selection", 400);
          }
        }
        updateData.partner_id = body.sire_id || null;
      }
      if (body.breeding_fee !== undefined) {
        updateData.breeding_fee = toNullableNumber(body.breeding_fee);
      }
      if (body.expected_calving_date !== undefined) {
        updateData.expected_birth_date = toNullableString(
          body.expected_calving_date
        );
      }
      if (body.actual_calving_date !== undefined) {
        updateData.actual_birth_date = toNullableString(
          body.actual_calving_date
        );
      }
      if (body.breeding_result !== undefined) {
        updateData.breeding_result = toNullableString(body.breeding_result);
      }
      if (body.offspring_count !== undefined) {
        updateData.offspring_count = toNullableInt(body.offspring_count);
      }
      if (body.breeding_notes !== undefined) {
        updateData.notes = toNullableString(body.breeding_notes);
      }
      if (body.vet_supervision !== undefined) {
        updateData.vet_supervision = body.vet_supervision ? 1 : 0;
      }

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }

      updateData.updated_at = new Date().toISOString();

      const updated = await db.updateById(
        "animal_breeding",
        recordId,
        updateData,
        { userId: user.id }
      );

      const enriched =
        (await fetchBreedingRecordById(db, user.id, updated?.id)) || updated;

      return createSuccessResponse(enriched);
    }

    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById(
        "animal_breeding",
        recordId,
        "animal_id",
        { userId: user.id }
      );

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Breeding record not found", 404);
      }

      await db.deleteById("animal_breeding", recordId, { userId: user.id });

      return createSuccessResponse({ success: true });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    return handleDbError(error, "handleBreedingRecords");
  }
}

async function handleFeedingRecords(context, user, animalId, db) {
  const { request, recordId } = context;
  const method = request.method;
  const numericAnimalId = Number(animalId);

  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchFeedingRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Feeding record not found", 404);
        }
        return createSuccessResponse(record);
      }

      const url = new URL(request.url);
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");

      let query = `
        SELECT fr.*, a.name as animal_name, u.name as recorded_by_name
        FROM animal_feeding_records fr
        JOIN animals a ON fr.animal_id = a.id
        LEFT JOIN users u ON fr.recorded_by = u.id
        WHERE fr.animal_id = ?
      `;
      const params = [numericAnimalId];

      if (dateFrom) {
        query += " AND fr.feeding_date >= ?";
        params.push(dateFrom);
      }

      if (dateTo) {
        query += " AND fr.feeding_date <= ?";
        params.push(dateTo);
      }

      query += " ORDER BY fr.feeding_date DESC, fr.created_at DESC";

      const { data } = await db.executeQuery(query, params, {
        operation: "all",
        table: "animal_feeding_records",
        userId: user.id,
      });

      return createSuccessResponse(data || []);
    }

    if (method === "POST") {
      const body = await request.json();
      const {
        feeding_date,
        feed_type,
        quantity,
        unit,
        feeding_method,
        ration_details,
        nutrition_notes,
        cost,
        notes,
      } = body;

      if (!feeding_date || !feed_type) {
        return createErrorResponse(
          "Feeding date and feed type are required",
          400
        );
      }

      const normalizedQuantity = Number(quantity);
      if (Number.isNaN(normalizedQuantity)) {
        return createErrorResponse("Quantity must be a number", 400);
      }

      const recordData = {
        animal_id: numericAnimalId,
        feeding_date,
        feed_type,
        quantity: normalizedQuantity,
        unit: toNullableString(unit),
        feeding_method: toNullableString(feeding_method),
        ration_details: toNullableString(ration_details),
        nutrition_notes: toNullableString(nutrition_notes),
        cost: toNullableNumber(cost),
        notes: toNullableString(notes),
        recorded_by: user.id,
      };

      const created = await db.create("animal_feeding_records", recordData, {
        userId: user.id,
      });

      const enriched =
        (await fetchFeedingRecordById(db, user.id, created?.id)) || created;

      return createSuccessResponse(enriched, 201);
    }

    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById(
        "animal_feeding_records",
        recordId,
        "*",
        { userId: user.id }
      );

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Feeding record not found", 404);
      }

      const body = await request.json();
      const updateData = {};

      if (body.feeding_date !== undefined) {
        updateData.feeding_date = sanitizeNullableValue(body.feeding_date);
      }
      if (body.feed_type !== undefined) {
        updateData.feed_type = sanitizeNullableValue(body.feed_type);
      }
      if (body.quantity !== undefined) {
        const normalizedQuantity = Number(body.quantity);
        if (Number.isNaN(normalizedQuantity)) {
          return createErrorResponse("Quantity must be a number", 400);
        }
        updateData.quantity = normalizedQuantity;
      }
      if (body.unit !== undefined) {
        updateData.unit = toNullableString(body.unit);
      }
      if (body.feeding_method !== undefined) {
        updateData.feeding_method = toNullableString(body.feeding_method);
      }
      if (body.ration_details !== undefined) {
        updateData.ration_details = toNullableString(body.ration_details);
      }
      if (body.nutrition_notes !== undefined) {
        updateData.nutrition_notes = toNullableString(body.nutrition_notes);
      }
      if (body.cost !== undefined) {
        updateData.cost = toNullableNumber(body.cost);
      }
      if (body.notes !== undefined) {
        updateData.notes = toNullableString(body.notes);
      }

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }

      updateData.updated_at = new Date().toISOString();

      const updated = await db.updateById(
        "animal_feeding_records",
        recordId,
        updateData,
        { userId: user.id }
      );

      const enriched =
        (await fetchFeedingRecordById(db, user.id, updated?.id)) || updated;

      return createSuccessResponse(enriched);
    }

    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }

      const existing = await db.findById(
        "animal_feeding_records",
        recordId,
        "animal_id",
        { userId: user.id }
      );

      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Feeding record not found", 404);
      }

      await db.deleteById("animal_feeding_records", recordId, {
        userId: user.id,
      });

      return createSuccessResponse({ success: true });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    return handleDbError(error, "handleFeedingRecords");
  }
}

/**
 * Handles /livestock/:animalId/movements
 * @upgrade FULL CRUD for movements, and updates animals.current_location_id.
 */
async function handleMovementRecords(context, user, animalId, db) {
  const { request, recordId } = context;
  const method = request.method;

  try {
    if (method === "GET") {
      // GET /.../movements (Get all)
      const { data } = await db.findMany(
        "animal_movements",
        { animal_id: animalId },
        { orderBy: "movement_date DESC", userId: user.id, operation: "all" }
      );
      return createSuccessResponse(data || []);
    }

    if (method === "POST") {
      // POST /.../movements (Move Animal)
      const body = await request.json();
      const { destination_location_id, movement_date, notes } = body;

      if (!destination_location_id || !movement_date) {
        return createErrorResponse(
          "Destination location ID and movement date are required.",
          400
        );
      }

      // 1. Get current animal data (to find old location and farm_id)
      const animal = await db.findById(
        "animals",
        animalId,
        "current_location_id, farm_id",
        { userId: user.id }
      );

      // 2. Validate destination location (ensure it exists on the farm)
      const destination = await db.findById(
        "locations",
        destination_location_id,
        "farm_id",
        { userId: user.id }
      );
      if (!destination || destination.farm_id !== animal.farm_id) {
        return createErrorResponse(
          "Destination location not found or inaccessible.",
          400
        );
      }

      // 3. Record Movement
      const movementData = {
        animal_id: animalId,
        source_location_id: animal.current_location_id,
        destination_location_id: destination_location_id,
        movement_date,
        recorded_by: user.id,
        notes: notes || null,
      };

      const result = await db.create("animal_movements", movementData, {
        userId: user.id,
      });

      // 4. Update Animal's current state (CRITICAL STEP)
      await db.updateById(
        "animals",
        animalId,
        { current_location_id: destination_location_id },
        { userId: user.id }
      );

      const createdRecord = await db.findById("animal_movements", result.id);
      return createSuccessResponse(createdRecord, 201);
    }

    // No PUT/DELETE for history records to maintain data integrity
    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    return handleDbError(error, "handleMovementRecords");
  }
}

// --- Specialized Handlers ---

/**
 * Helper function to recursively build the pedigree tree
 */
async function buildPedigreeTree(
  db,
  animalId,
  userId,
  depth = 0,
  maxDepth = 3
) {
  if (!animalId || depth >= maxDepth) {
    return null;
  }

  // Only select essential fields to keep the payload clean
  const animal = await db.findById(
    "animals",
    animalId,
    "id, name, sex, species, father_id, mother_id",
    { userId: userId }
  );
  if (!animal) {
    return null;
  }

  // Recursive calls to fetch parents
  const father = await buildPedigreeTree(
    db,
    animal.father_id,
    userId,
    depth + 1,
    maxDepth
  );
  const mother = await buildPedigreeTree(
    db,
    animal.mother_id,
    userId,
    depth + 1,
    maxDepth
  );

  return {
    id: animal.id,
    name: animal.name,
    sex: animal.sex,
    generation: depth,
    // Only include parents if one or both exist
    parents: father || mother ? { father: father, mother: mother } : null,
  };
}

/**
 * GET /livestock/:animalId/pedigree - Get full lineage
 */
async function handleGetPedigree(context, user, animalId, db) {
  try {
    // Max depth is set to 3 generations (animal + 3 levels of ancestors)
    const pedigree = await buildPedigreeTree(db, animalId, user.id, 0, 3);

    if (!pedigree) {
      return createErrorResponse(
        "Animal not found or no pedigree data available.",
        404
      );
    }

    return createSuccessResponse(pedigree);
  } catch (error) {
    return handleDbError(error, "handleGetPedigree");
  }
}

async function handleLivestockStats(context, user, db) {
  try {
    // Stats by Species
    const speciesQuery = `
          SELECT a.species, COUNT(a.id) as count
          FROM animals a
          JOIN farm_members fm ON a.farm_id = fm.farm_id
          WHERE fm.user_id = ?
          GROUP BY a.species
        `;
    const { data: speciesStats } = await db.executeQuery(
      speciesQuery,
      [user.id],
      { operation: "all" }
    );

    // Stats by Health Status
    const healthQuery = `
          SELECT a.health_status, COUNT(a.id) as count
          FROM animals a
          JOIN farm_members fm ON a.farm_id = fm.farm_id
          WHERE fm.user_id = ?
          GROUP BY a.health_status
        `;
    const { data: healthStats } = await db.executeQuery(
      healthQuery,
      [user.id],
      { operation: "all" }
    );

    // Stats by Location (NEW)
    const locationQuery = `
            SELECT l.name as location_name, COUNT(a.id) as count
            FROM animals a
            JOIN locations l ON a.current_location_id = l.id
            JOIN farm_members fm ON a.farm_id = fm.farm_id
            WHERE fm.user_id = ?
            GROUP BY l.name
        `;
    const { data: locationStats } = await db.executeQuery(
      locationQuery,
      [user.id],
      { operation: "all" }
    );

    const total = speciesStats.reduce((acc, cur) => acc + cur.count, 0);

    return createSuccessResponse({
      total_animals: total,
      by_species: speciesStats,
      by_health_status: healthStats,
      by_location: locationStats,
    });
  } catch (error) {
    return handleDbError(error, "handleLivestockStats");
  }
}

// --- Shared Helpers -------------------------------------------------------

async function fetchHealthRecordById(db, userId, recordId) {
  if (!recordId) return null;

  const { data } = await db.executeQuery(
    `
      SELECT hr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      LEFT JOIN users u ON hr.created_by = u.id
      WHERE hr.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_health_records", userId }
  );

  return data || null;
}

async function fetchProductionRecordById(db, userId, recordId) {
  if (!recordId) return null;

  const { data } = await db.executeQuery(
    `
      SELECT pr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_production pr
      JOIN animals a ON pr.animal_id = a.id
      LEFT JOIN users u ON pr.recorded_by = u.id
      WHERE pr.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_production", userId }
  );

  return data || null;
}

async function fetchBreedingRecordById(db, userId, recordId) {
  if (!recordId) return null;

  const { data } = await db.executeQuery(
    `
      SELECT br.*, sire.name as sire_name, u.name as created_by_name
      FROM animal_breeding br
      LEFT JOIN animals sire ON br.partner_id = sire.id
      LEFT JOIN users u ON br.created_by = u.id
      WHERE br.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_breeding", userId }
  );

  return data ? normalizeBreedingRecord(data) : null;
}

async function fetchFeedingRecordById(db, userId, recordId) {
  if (!recordId) return null;

  const { data } = await db.executeQuery(
    `
      SELECT fr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_feeding_records fr
      JOIN animals a ON fr.animal_id = a.id
      LEFT JOIN users u ON fr.recorded_by = u.id
      WHERE fr.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_feeding_records", userId }
  );

  return data || null;
}

function normalizeBreedingRecord(record) {
  if (!record) return null;

  const {
    partner_id,
    expected_birth_date,
    actual_birth_date,
    notes,
    vet_supervision,
    ...rest
  } = record;

  return {
    ...rest,
    notes,
    sire_id: partner_id,
    expected_calving_date: expected_birth_date,
    actual_calving_date: actual_birth_date,
    breeding_notes: notes,
    vet_supervision: Boolean(vet_supervision),
  };
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function toNullableInt(value) {
  const numeric = toNullableNumber(value);
  return numeric === null ? null : Math.trunc(numeric);
}

function sanitizeNullableValue(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
}

function toNullableString(value) {
  const sanitized = sanitizeNullableValue(value);
  if (sanitized === undefined) {
    return undefined;
  }
  if (sanitized === null) {
    return null;
  }
  return String(sanitized);
}
