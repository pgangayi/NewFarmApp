// Livestock Health Management API - MIGRATED to DatabaseOperations
// Handles health records, vaccinations, and medical tracking with security hardening

import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../_auth.js";
import { DatabaseOperations, DB_ERROR_CODES } from "../_database.js";

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // Initialize database operations
  const db = new DatabaseOperations(env);

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      return await handleGetHealthRecords(request, user, env, db);
    } else if (method === "POST") {
      return await handleCreateHealthRecord(request, user, env, db);
    } else if (method === "PUT") {
      return await handleUpdateHealthRecord(request, user, env, db); // NEW
    } else if (method === "DELETE") {
      return await handleDeleteHealthRecord(request, user, env, db); // NEW
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Livestock health API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// --- GET (Fetch Records) ---

async function handleGetHealthRecords(request, user, env, db) {
  const url = new URL(request.url);
  const animalId = url.searchParams.get("animal_id");
  const farmId = url.searchParams.get("farm_id");
  const recordType = url.searchParams.get("record_type");
  const status = url.searchParams.get("status");
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "20"));
  const offset = (page - 1) * limit;

  try {
    // Build complex query using DatabaseOperations' executeQuery method
    // This maintains the complex JOIN logic while adding security features
    let query = `
      SELECT
        hr.*,
        a.name as animal_name,
        a.species,
        a.identification_tag,
        u.name as recorded_by_name
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      LEFT JOIN users u ON hr.created_by = u.id
      WHERE fm.user_id = ?
    `;

    const params = [user.id];

    // Apply filters
    if (animalId) {
      query += " AND hr.animal_id = ?";
      params.push(animalId);
    }
    if (farmId) {
      query += " AND a.farm_id = ?";
      params.push(farmId);
    }
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

    // Add ordering and pagination
    query += " ORDER BY hr.record_date DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const healthRecordsResult = await db.executeQuery(query, params, {
      operation: "query",
      table: "animal_health_records",
      userId: user.id,
    });

    if (!healthRecordsResult || healthRecordsResult.error) {
      console.error("Database error:", healthRecordsResult?.error);
      return createErrorResponse("Database error", 500);
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(hr.id) as total
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;

    const countParams = [user.id];

    // Apply same filters for count
    if (animalId) {
      countQuery += " AND hr.animal_id = ?";
      countParams.push(animalId);
    }
    if (farmId) {
      countQuery += " AND a.farm_id = ?";
      countParams.push(farmId);
    }
    if (recordType) {
      countQuery += " AND hr.record_type = ?";
      countParams.push(recordType);
    }

    if (status === "overdue") {
      countQuery +=
        " AND hr.next_due_date < date('now') AND hr.next_due_date IS NOT NULL";
    } else if (status === "upcoming") {
      countQuery +=
        " AND hr.next_due_date BETWEEN date('now') AND date('now', '+7 days') AND hr.next_due_date IS NOT NULL";
    }

    if (dateFrom) {
      countQuery += " AND hr.record_date >= ?";
      countParams.push(dateFrom);
    }
    if (dateTo) {
      countQuery += " AND hr.record_date <= ?";
      countParams.push(dateTo);
    }

    const countResult = await db.executeQuery(countQuery, countParams, {
      operation: "query",
      table: "animal_health_records",
      userId: user.id,
    });

    const total = countResult?.data?.[0]?.total || 0;

    return createSuccessResponse({
      health_records: healthRecordsResult.data || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in handleGetHealthRecords:", error);
    return createErrorResponse("Database error", 500);
  }
}

// --- POST (Create Record) ---

async function handleCreateHealthRecord(request, user, env, db) {
  const body = await request.json();
  const {
    animal_id,
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

  // Validation
  if (!animal_id || !record_date || !record_type) {
    return createErrorResponse(
      "Animal ID, record date, and record type are required",
      400
    );
  }

  try {
    // First check access using DatabaseOperations
    const accessCheck = await db.executeQuery(
      `
      SELECT a.farm_id
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ?
    `,
      [animal_id, user.id],
      {
        operation: "query",
        table: "animals",
        userId: user.id,
      }
    );

    if (!accessCheck || !accessCheck.data || accessCheck.data.length === 0) {
      return createErrorResponse("Animal not found or access denied", 404);
    }

    // Create health record
    const healthRecordData = {
      animal_id,
      record_date,
      record_type,
      vet_name: vet_name || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      medication: medication || null,
      dosage: dosage || null,
      cost: cost || null,
      next_due_date: next_due_date || null,
      vet_contact: vet_contact || null,
      notes: notes || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    const result = await db.create("animal_health_records", healthRecordData, {
      userId: user.id,
    });

    if (!result || !result.data) {
      return createErrorResponse("Failed to create health record", 500);
    }

    return createSuccessResponse({ success: true, id: result.data[0].id }, 201);
  } catch (error) {
    console.error("Error in handleCreateHealthRecord:", error);
    return createErrorResponse("Failed to create health record", 500);
  }
}

// --- PUT (Update Record) ---

async function handleUpdateHealthRecord(request, user, env, db) {
  const url = new URL(request.url);
  const recordId = url.searchParams.get("id");

  if (!recordId) {
    return createErrorResponse("Record ID is required for update", 400);
  }

  try {
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

    // Check if record exists and user has permission
    const accessCheck = await db.executeQuery(
      `
      SELECT hr.id, hr.animal_id
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE hr.id = ? AND fm.user_id = ?
    `,
      [recordId, user.id],
      {
        operation: "query",
        table: "animal_health_records",
        userId: user.id,
      }
    );

    if (!accessCheck || !accessCheck.data || accessCheck.data.length === 0) {
      return createErrorResponse(
        "Health record not found or access denied",
        404
      );
    }

    // Build dynamic update data
    const updateData = {};

    const fields = {
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
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse("No fields provided for update", 400);
    }

    updateData.updated_at = new Date().toISOString();

    // Update using DatabaseOperations
    const result = await db.updateById(
      "animal_health_records",
      recordId,
      updateData,
      {
        userId: user.id,
      }
    );

    if (!result || !result.data) {
      return createErrorResponse("Failed to update health record", 500);
    }

    return createSuccessResponse({ success: true, message: "Record updated" });
  } catch (error) {
    console.error("Error in handleUpdateHealthRecord:", error);
    return createErrorResponse("Database error", 500);
  }
}

// --- DELETE (Delete Record) ---

async function handleDeleteHealthRecord(request, user, env, db) {
  const url = new URL(request.url);
  const recordId = url.searchParams.get("id");

  if (!recordId) {
    return createErrorResponse("Record ID is required for deletion", 400);
  }

  try {
    // Check access first
    const accessCheck = await db.executeQuery(
      `
      SELECT hr.id
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE hr.id = ? AND fm.user_id = ?
    `,
      [recordId, user.id],
      {
        operation: "query",
        table: "animal_health_records",
        userId: user.id,
      }
    );

    if (!accessCheck || !accessCheck.data || accessCheck.data.length === 0) {
      return createErrorResponse(
        "Health record not found or access denied",
        404
      );
    }

    // Delete using DatabaseOperations
    const result = await db.deleteById("animal_health_records", recordId, {
      userId: user.id,
    });

    if (!result) {
      return createErrorResponse("Failed to delete health record", 500);
    }

    return createSuccessResponse(
      { success: true, message: "Record deleted" },
      200
    );
  } catch (error) {
    console.error("Error in handleDeleteHealthRecord:", error);
    return createErrorResponse("Database error", 500);
  }
}
