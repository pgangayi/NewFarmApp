import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { InventoryRepository } from "./repositories/inventory-repository.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Initialize AuthUtils
    const auth = new AuthUtils(env);

    // Get user from token
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Initialize DatabaseOperations and InventoryRepository
    const db = new DatabaseOperations(env);
    const inventoryRepo = new InventoryRepository(db);

    // Enhanced inventory listing with comprehensive data
    if (method === "GET") {
      const itemId = request.params?.id || url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const alerts = url.searchParams.get("alerts");
      const suppliers = url.searchParams.get("suppliers");
      const lowStock = url.searchParams.get("low_stock");
      const category = url.searchParams.get("category");

      if (itemId) {
        // Get specific inventory item with comprehensive data
        const { results: itemResults, error } = await env.DB.prepare(
          `
          SELECT 
            ii.*,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as transaction_count,
            COALESCE((SELECT SUM(ABS(it.qty_delta)) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_movement,
            COALESCE((SELECT AVG(it.unit_cost) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id AND it.unit_cost IS NOT NULL), 0) as avg_cost_per_unit
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE ii.id = ? AND fm.user_id = ?
        `
        )
          .bind(itemId, user.id)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        const item = itemResults[0];
        if (!item) {
          return createErrorResponse(
            "Inventory item not found or access denied",
            404
          );
        }

        // Get inventory alerts if requested
        if (alerts === "true") {
          const { results: alertsResults } = await env.DB.prepare(
            `
            SELECT * FROM inventory_alerts 
            WHERE inventory_item_id = ? 
            ORDER BY alert_date DESC 
            LIMIT 10
          `
          )
            .bind(itemId)
            .all();

          item.alerts = alertsResults;
        }

        // Get cost history if requested
        const { results: costResults } = await env.DB.prepare(
          `
          SELECT * FROM inventory_cost_history 
          WHERE inventory_item_id = ? 
          ORDER BY cost_date DESC 
          LIMIT 12
        `
        )
          .bind(itemId)
          .all();

        item.cost_history = costResults;

        return createSuccessResponse(item);
      } else if (lowStock === "true") {
        // Get low stock items
        const { results: items, error } = await env.DB.prepare(
          `
          SELECT 
            ii.*,
            fa.name as farm_name,
            CASE 
              WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
              WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
              ELSE 'normal'
            END as stock_status
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE fm.user_id = ? 
            AND ii.reorder_threshold > 0 
            AND ii.qty <= ii.reorder_threshold * 1.5
          ORDER BY (ii.qty / ii.reorder_threshold) ASC
        `
        )
          .bind(user.id)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        return createSuccessResponse(items || []);
      } else if (analytics === "true") {
        // Get inventory with analytics data
        let query = `
          SELECT 
            ii.*,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as transaction_count,
            COALESCE((SELECT SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_usage,
            COALESCE((SELECT SUM(CASE WHEN it.qty_delta > 0 THEN it.qty_delta ELSE 0 END) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_additions,
            COALESCE((SELECT MAX(ch.unit_cost) FROM inventory_cost_history ch WHERE ch.inventory_item_id = ii.id), 0) as latest_cost_per_unit,
            COALESCE((SELECT AVG(ch.unit_cost) FROM inventory_cost_history ch WHERE ch.inventory_item_id = ii.id), 0) as avg_cost_per_unit,
            CASE 
              WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
              WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
              ELSE 'normal'
            END as stock_status
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        // Add category filter if provided
        if (category) {
          query += " AND ii.category = ?";
          params.push(category);
        }

        query += " ORDER BY ii.name ASC";

        const { results: items, error } = await env.DB.prepare(query)
          .bind(...params)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        return createSuccessResponse(items || []);
      } else {
        // Standard inventory list with enhanced data
        let query = `
          SELECT 
            ii.*,
            fa.name as farm_name,
            CASE 
              WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
              WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
              ELSE 'normal'
            END as stock_status
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        query += " ORDER BY ii.name ASC";

        const { results: items, error } = await env.DB.prepare(query)
          .bind(...params)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        return createSuccessResponse(items || []);
      }
    } else if (method === "POST") {
      // Create inventory item with enhanced data
      const body = await request.json();
      const {
        farm_id,
        name,
        sku,
        qty,
        unit,
        reorder_threshold,
        category,
        supplier_info,
        storage_requirements,
        expiration_date,
        quality_grade,
        minimum_order_quantity,
        maximum_order_quantity,
        current_cost_per_unit,
        preferred_supplier_id,
      } = body;

      if (!farm_id || !name) {
        return createErrorResponse("Farm ID and name are required", 400);
      }

      // Check if user has access to this farm
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Farm not found or access denied", 404);
      }

      const { results, error: insertError } = await env.DB.prepare(
        `
        INSERT INTO inventory_items (
          farm_id, name, sku, qty, unit, reorder_threshold,
          category, supplier_info, storage_requirements, expiration_date,
          quality_grade, minimum_order_quantity, maximum_order_quantity,
          current_cost_per_unit, preferred_supplier_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          name,
          sku || null,
          qty || 0,
          unit || "units",
          reorder_threshold || 0,
          category || null,
          supplier_info || null,
          storage_requirements || null,
          expiration_date || null,
          quality_grade || null,
          minimum_order_quantity || null,
          maximum_order_quantity || null,
          current_cost_per_unit || null,
          preferred_supplier_id || null
        )
        .run();

      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create inventory item", 500);
      }

      // Get the created item
      const { results: itemResults } = await env.DB.prepare(
        `
        SELECT 
          ii.*,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE ii.rowid = last_insert_rowid()
      `
      ).all();

      const newItem = itemResults[0];

      // Create initial cost history record if cost is provided
      if (current_cost_per_unit) {
        await env.DB.prepare(
          `
          INSERT INTO inventory_cost_history (
            inventory_item_id, cost_date, unit_cost, quantity_purchased, 
            total_cost, cost_reason, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        )
          .bind(
            newItem.id,
            new Date().toISOString().split("T")[0],
            current_cost_per_unit,
            qty || 0,
            current_cost_per_unit * (qty || 0),
            "initial_cost",
            "Initial cost entry"
          )
          .run();
      }

      // Check for low stock alert
      if (qty <= reorder_threshold) {
        await env.DB.prepare(
          `
          INSERT INTO inventory_alerts (
            inventory_item_id, alert_type, alert_date, current_quantity, 
            threshold_quantity, severity, notes
          ) VALUES (?, 'low_stock', ?, ?, ?, ?, ?)
        `
        )
          .bind(
            newItem.id,
            new Date().toISOString().split("T")[0],
            qty || 0,
            reorder_threshold || 0,
            qty <= reorder_threshold * 0.5 ? "critical" : "high",
            "Initial stock level is at or below reorder threshold"
          )
          .run();
      }

      return createSuccessResponse(newItem);
    } else if (method === "PUT") {
      // Update inventory item with enhanced data
      const body = await request.json();
      const id = request.params?.id || body.id;
      const { id: _bodyId, ...updateData } = body;

      if (!id) {
        return createErrorResponse("Item ID required", 400);
      }

      // Get the item and check farm access
      const { results: existingItems } = await env.DB.prepare(
        `
        SELECT ii.farm_id, ii.qty, ii.name
        FROM inventory_items ii
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        WHERE ii.id = ? AND fm.user_id = ?
      `
      )
        .bind(id, user.id)
        .all();

      if (existingItems.length === 0) {
        return createErrorResponse(
          "Inventory item not found or access denied",
          404
        );
      }

      const existingItem = existingItems[0];
      const updateFields = [];
      const updateValues = [];

      // Handle all possible update fields
      const allowedFields = [
        "name",
        "sku",
        "qty",
        "unit",
        "reorder_threshold",
        "category",
        "supplier_info",
        "storage_requirements",
        "expiration_date",
        "quality_grade",
        "minimum_order_quantity",
        "maximum_order_quantity",
        "current_cost_per_unit",
        "preferred_supplier_id",
      ];

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });

      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      const { error: updateError } = await env.DB.prepare(
        `
        UPDATE inventory_items 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `
      )
        .bind(...updateValues)
        .run();

      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update inventory item", 500);
      }

      // Check for quantity change and create alert if needed
      if (updateData.qty !== undefined && updateData.qty !== existingItem.qty) {
        // Check if quantity is now below reorder threshold
        if (updateData.qty <= (updateData.reorder_threshold || 0)) {
          await env.DB.prepare(
            `
            INSERT INTO inventory_alerts (
              inventory_item_id, alert_type, alert_date, current_quantity, 
              threshold_quantity, severity, notes
            ) VALUES (?, 'low_stock', ?, ?, ?, ?, ?)
          `
          )
            .bind(
              id,
              new Date().toISOString().split("T")[0],
              updateData.qty,
              updateData.reorder_threshold || 0,
              updateData.qty <= (updateData.reorder_threshold || 0) * 0.5
                ? "critical"
                : "high",
              `Stock level reduced to ${updateData.qty} - below reorder threshold`
            )
            .run();
        }

        // Update cost history if cost per unit changed
        if (updateData.current_cost_per_unit !== undefined) {
          await env.DB.prepare(
            `
            INSERT INTO inventory_cost_history (
              inventory_item_id, cost_date, unit_cost, quantity_purchased, 
              total_cost, cost_reason, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          )
            .bind(
              id,
              new Date().toISOString().split("T")[0],
              updateData.current_cost_per_unit,
              Math.abs(updateData.qty - existingItem.qty),
              updateData.current_cost_per_unit *
                Math.abs(updateData.qty - existingItem.qty),
              "price_update",
              "Cost per unit updated"
            )
            .run();
        }
      }

      // Get updated item
      const { results: itemResults } = await env.DB.prepare(
        `
        SELECT 
          ii.*,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE ii.id = ?
      `
      )
        .bind(id)
        .all();

      return createSuccessResponse(itemResults[0]);
    } else if (method === "DELETE") {
      // Enhanced delete with dependency checks
      const itemId = request.params?.id || url.searchParams.get("id");

      if (!itemId) {
        return createErrorResponse("Item ID required", 400);
      }

      // Get the item and check farm access
      const { results: existingItems } = await env.DB.prepare(
        `
        SELECT ii.farm_id, ii.name
        FROM inventory_items ii
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        WHERE ii.id = ? AND fm.user_id = ?
      `
      )
        .bind(itemId, user.id)
        .all();

      if (existingItems.length === 0) {
        return createErrorResponse(
          "Inventory item not found or access denied",
          404
        );
      }

      // Check for dependencies
      const { results: dependencies } = await env.DB.prepare(
        `
        SELECT 
          (SELECT COUNT(*) FROM inventory_transactions WHERE inventory_item_id = ?) as transaction_count,
          (SELECT COUNT(*) FROM purchase_order_items WHERE inventory_item_id = ?) as po_items,
          (SELECT COUNT(*) FROM inventory_cost_history WHERE inventory_item_id = ?) as cost_records
      `
      )
        .bind(itemId, itemId, itemId)
        .all();

      const dep = dependencies[0];
      if (
        dep.transaction_count > 0 ||
        dep.po_items > 0 ||
        dep.cost_records > 0
      ) {
        return createErrorResponse(
          "Cannot delete item with existing transactions, purchase orders, or cost records. Please deactivate instead.",
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(
        `
        DELETE FROM inventory_items WHERE id = ?
      `
      )
        .bind(itemId)
        .run();

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete inventory item", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Inventory API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Inventory Alerts Management
export async function onRequestAlerts(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      const resolved = url.searchParams.get("resolved");
      const severity = url.searchParams.get("severity");
      const alertType = url.searchParams.get("type");

      let query = `
        SELECT 
          ia.*,
          ii.name as item_name,
          ii.qty as current_quantity,
          fa.name as farm_name
        FROM inventory_alerts ia
        JOIN inventory_items ii ON ia.inventory_item_id = ii.id
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE fm.user_id = ?
      `;
      const params = [user.id];

      // Add filters
      if (resolved !== null && resolved !== undefined) {
        query += " AND ia.resolved = ?";
        params.push(resolved === "true" ? 1 : 0);
      }
      if (severity) {
        query += " AND ia.severity = ?";
        params.push(severity);
      }
      if (alertType) {
        query += " AND ia.alert_type = ?";
        params.push(alertType);
      }

      query += " ORDER BY ia.alert_date DESC LIMIT 50";

      const { results, error } = await env.DB.prepare(query)
        .bind(...params)
        .all();

      if (error) {
        console.error("Alerts error:", error);
        return createErrorResponse("Database error", 500);
      }

      return createSuccessResponse(results);
    } else if (method === "PUT") {
      const body = await request.json();
      const { alert_id, resolved, notes } = body;

      if (!alert_id) {
        return createErrorResponse("Alert ID required", 400);
      }

      // Check access to the alert
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT ia.id
        FROM inventory_alerts ia
        JOIN inventory_items ii ON ia.inventory_item_id = ii.id
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        WHERE ia.id = ? AND fm.user_id = ?
      `
      )
        .bind(alert_id, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }

      const updateFields = [];
      const updateValues = [];

      if (resolved !== undefined) {
        updateFields.push("resolved = ?");
        updateFields.push("resolved_date = ?");
        updateFields.push("resolved_by = ?");
        updateValues.push(resolved ? 1 : 0);
        updateValues.push(
          resolved ? new Date().toISOString().split("T")[0] : null
        );
        updateValues.push(resolved ? user.id : null);
      }

      if (notes !== undefined) {
        updateFields.push("notes = ?");
        updateValues.push(notes);
      }

      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }

      updateValues.push(alert_id);

      const { error } = await env.DB.prepare(
        `
        UPDATE inventory_alerts 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `
      )
        .bind(...updateValues)
        .run();

      if (error) {
        console.error("Alert update error:", error);
        return createErrorResponse("Failed to update alert", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Alerts API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Supplier Management
export async function onRequestSuppliers(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      const supplierId = url.searchParams.get("id");
      const active = url.searchParams.get("active");

      if (supplierId) {
        // Get specific supplier
        const { results, error } = await env.DB.prepare(
          `
          SELECT 
            s.*,
            fa.name as farm_name
          FROM inventory_suppliers s
          JOIN farms fa ON s.farm_id = fa.id
          WHERE s.id = ? AND fa.owner_id = ?
        `
        )
          .bind(supplierId, user.id)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        const supplier = results[0];
        if (!supplier) {
          return createErrorResponse(
            "Supplier not found or access denied",
            404
          );
        }

        return createSuccessResponse(supplier);
      } else {
        // Get suppliers list
        let query = `
          SELECT 
            s.*,
            fa.name as farm_name,
            COUNT(po.id) as total_orders,
            SUM(CASE WHEN po.order_status = 'delivered' THEN 1 ELSE 0 END) as completed_orders
          FROM inventory_suppliers s
          JOIN farms fa ON s.farm_id = fa.id
          LEFT JOIN purchase_orders po ON s.id = po.supplier_id
          WHERE fa.owner_id = ?
        `;
        const params = [user.id];

        if (active !== null && active !== undefined) {
          query += " AND s.active = ?";
          params.push(active === "true" ? 1 : 0);
        }

        query += " GROUP BY s.id ORDER BY s.supplier_name ASC";

        const { results, error } = await env.DB.prepare(query)
          .bind(...params)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        return createSuccessResponse(results);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        supplier_name,
        contact_person,
        contact_email,
        contact_phone,
        address,
        payment_terms,
        lead_time_days,
        reliability_rating,
        product_categories,
        pricing_structure,
        delivery_schedule,
        notes,
      } = body;

      if (!farm_id || !supplier_name) {
        return createErrorResponse("Farm ID and supplier name required", 400);
      }

      // Check if user has access to this farm
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Farm not found or access denied", 404);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO inventory_suppliers (
          farm_id, supplier_name, contact_person, contact_email, contact_phone,
          address, payment_terms, lead_time_days, reliability_rating,
          product_categories, pricing_structure, delivery_schedule, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          supplier_name,
          contact_person || null,
          contact_email || null,
          contact_phone || null,
          address || null,
          payment_terms || null,
          lead_time_days || null,
          reliability_rating || null,
          product_categories || null,
          pricing_structure || null,
          delivery_schedule || null,
          notes || null
        )
        .run();

      if (error) {
        console.error("Supplier insert error:", error);
        return createErrorResponse("Failed to create supplier", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Suppliers API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
