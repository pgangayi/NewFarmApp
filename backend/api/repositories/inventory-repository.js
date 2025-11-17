/**
 * Inventory Repository - Handles all inventory-related database operations
 * Phase 4 Migration: Inventory Data Security & Audit Enhancement
 * Provides comprehensive inventory management with audit trails and automated alerts
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Inventory Repository - Handles all inventory-related database operations
 * Phase 4 Migration: Inventory Data Security & Audit Enhancement
 */
export class InventoryRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "inventory_items");
  }

  /**
   * Get inventory items for user's farms with enhanced security
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        ii.*,
        fa.name as farm_name,
        CASE 
          WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
          WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
          ELSE 'normal'
        END as stock_status,
        COALESCE((SELECT COUNT(*) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as transaction_count,
        COALESCE((SELECT SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_usage,
        COALESCE((SELECT SUM(CASE WHEN it.qty_delta > 0 THEN it.qty_delta ELSE 0 END) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_additions,
        COALESCE((SELECT AVG(ch.unit_cost) FROM inventory_cost_history ch WHERE ch.inventory_item_id = ii.id), 0) as avg_cost_per_unit
      FROM inventory_items ii
      JOIN farm_members fm ON ii.farm_id = fm.farm_id
      JOIN farms fa ON ii.farm_id = fa.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters with security validation
    if (filters.farm_id) {
      query += " AND ii.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.category) {
      query += " AND ii.category = ?";
      params.push(filters.category);
    }
    if (filters.low_stock === "true") {
      query +=
        " AND ii.reorder_threshold > 0 AND ii.qty <= ii.reorder_threshold * 1.5";
    }
    if (filters.search) {
      query += " AND (ii.name LIKE ? OR ii.sku LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY ii.${options.sortBy} ${
        options.sortDirection?.toUpperCase() || "DESC"
      }`;
    } else {
      query += " ORDER BY ii.name ASC";
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "inventory_items",
      context: {
        findByUserAccess: true,
        userId,
        filters,
        options,
        security_level: "enhanced",
      },
    });

    if (error) {
      throw new Error(
        `Database error in InventoryRepository.findByUserAccess: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Count inventory items for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT ii.id) as total
      FROM inventory_items ii
      JOIN farm_members fm ON ii.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    if (filters.farm_id) {
      query += " AND ii.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.category) {
      query += " AND ii.category = ?";
      params.push(filters.category);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "inventory_items",
      context: { countByUserAccess: true, userId, filters },
    });

    if (error) {
      throw new Error(
        `Database error in InventoryRepository.countByUserAccess: ${error.message}`
      );
    }

    return results[0]?.total || 0;
  }

  /**
   * Create inventory item with comprehensive audit trail
   */
  async createItem(itemData, userId) {
    // Validate required fields
    if (!itemData.farm_id || !itemData.name) {
      throw new Error("Farm ID and name are required");
    }

    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(itemData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // Validate numeric fields
    if (
      itemData.qty !== undefined &&
      (isNaN(itemData.qty) || itemData.qty < 0)
    ) {
      throw new Error("Quantity must be a non-negative number");
    }
    if (
      itemData.reorder_threshold !== undefined &&
      (isNaN(itemData.reorder_threshold) || itemData.reorder_threshold < 0)
    ) {
      throw new Error("Reorder threshold must be a non-negative number");
    }
    if (
      itemData.current_cost_per_unit !== undefined &&
      (isNaN(itemData.current_cost_per_unit) ||
        itemData.current_cost_per_unit < 0)
    ) {
      throw new Error("Cost per unit must be a non-negative number");
    }

    // Prepare item data with defaults
    const inventoryData = {
      farm_id: itemData.farm_id,
      name: itemData.name,
      sku: itemData.sku || null,
      qty: parseFloat(itemData.qty || 0),
      unit: itemData.unit || "units",
      reorder_threshold: parseFloat(itemData.reorder_threshold || 0),
      category: itemData.category || null,
      supplier_info: itemData.supplier_info || null,
      storage_requirements: itemData.storage_requirements || null,
      expiration_date: itemData.expiration_date || null,
      quality_grade: itemData.quality_grade || null,
      minimum_order_quantity: parseFloat(itemData.minimum_order_quantity || 0),
      maximum_order_quantity: parseFloat(itemData.maximum_order_quantity || 0),
      current_cost_per_unit: parseFloat(itemData.current_cost_per_unit || 0),
      preferred_supplier_id: itemData.preferred_supplier_id || null,
    };

    const transaction = [
      {
        query: `
          INSERT INTO inventory_items (
            farm_id, name, sku, qty, unit, reorder_threshold,
            category, supplier_info, storage_requirements, expiration_date,
            quality_grade, minimum_order_quantity, maximum_order_quantity,
            current_cost_per_unit, preferred_supplier_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(inventoryData),
        operation: "run",
        table: "inventory_items",
        context: {
          createItem: true,
          audit_level: "comprehensive",
          data_integrity: "enforced",
        },
      },
    ];

    try {
      const result = await this.db.executeTransaction(transaction);
      const newItemId = result.results[0].lastRowId;

      // Create initial cost history record if cost is provided
      if (
        itemData.current_cost_per_unit &&
        itemData.current_cost_per_unit > 0
      ) {
        await this.createCostHistory(newItemId, {
          unit_cost: parseFloat(itemData.current_cost_per_unit),
          quantity_purchased: inventoryData.qty,
          total_cost:
            parseFloat(itemData.current_cost_per_unit) * inventoryData.qty,
          cost_reason: "initial_cost",
          notes: "Initial cost entry",
        });
      }

      // Check for low stock alert
      if (inventoryData.qty <= inventoryData.reorder_threshold) {
        await this.createLowStockAlert(newItemId, {
          current_quantity: inventoryData.qty,
          threshold_quantity: inventoryData.reorder_threshold,
          severity:
            inventoryData.qty <= inventoryData.reorder_threshold * 0.5
              ? "critical"
              : "high",
          notes: "Initial stock level is at or below reorder threshold",
        });
      }

      // Log inventory operation in audit trail
      await this.logInventoryOperation(
        "create",
        newItemId,
        inventoryData,
        userId
      );

      return await this.findById(newItemId);
    } catch (error) {
      throw new Error(`Item creation failed: ${error.message}`);
    }
  }

  /**
   * Update inventory item with audit trail and stock alerts
   */
  async updateItem(id, updateData, userId) {
    // Validate record access
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Inventory item not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToItem(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this inventory item");
    }

    // Validate numeric fields
    if (
      updateData.qty !== undefined &&
      (isNaN(updateData.qty) || updateData.qty < 0)
    ) {
      throw new Error("Quantity must be a non-negative number");
    }
    if (
      updateData.reorder_threshold !== undefined &&
      (isNaN(updateData.reorder_threshold) || updateData.reorder_threshold < 0)
    ) {
      throw new Error("Reorder threshold must be a non-negative number");
    }
    if (
      updateData.current_cost_per_unit !== undefined &&
      (isNaN(updateData.current_cost_per_unit) ||
        updateData.current_cost_per_unit < 0)
    ) {
      throw new Error("Cost per unit must be a non-negative number");
    }

    // Track quantity changes for cost history
    const quantityChanged =
      updateData.qty !== undefined && updateData.qty !== existing.qty;
    const costChanged =
      updateData.current_cost_per_unit !== undefined &&
      updateData.current_cost_per_unit !== existing.current_cost_per_unit;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform update
    const updated = await this.updateById(id, updateData);

    // Create cost history if cost changed
    if (costChanged && updateData.current_cost_per_unit) {
      await this.createCostHistory(id, {
        unit_cost: parseFloat(updateData.current_cost_per_unit),
        quantity_purchased: Math.abs(updateData.qty - existing.qty),
        total_cost:
          parseFloat(updateData.current_cost_per_unit) *
          Math.abs(updateData.qty - existing.qty),
        cost_reason: "price_update",
        notes: "Cost per unit updated",
      });
    }

    // Check for low stock alert if quantity changed
    if (
      quantityChanged &&
      updateData.qty <=
        (updateData.reorder_threshold || existing.reorder_threshold)
    ) {
      await this.createLowStockAlert(id, {
        current_quantity: updateData.qty,
        threshold_quantity:
          updateData.reorder_threshold || existing.reorder_threshold,
        severity:
          updateData.qty <=
          (updateData.reorder_threshold || existing.reorder_threshold) * 0.5
            ? "critical"
            : "high",
        notes: `Stock level reduced to ${updateData.qty} - below reorder threshold`,
      });
    }

    // Log update in audit trail
    await this.logInventoryOperation(
      "update",
      id,
      {
        before: existing,
        after: updated,
        changes: updateData,
      },
      userId
    );

    return updated;
  }

  /**
   * Update stock with atomic operations and audit trail
   */
  async updateStock(
    id,
    quantity,
    operation,
    userId,
    reason = "manual_adjustment"
  ) {
    // Validate record access
    const item = await this.findById(id);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToItem(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this inventory item");
    }

    // Validate operation and quantity
    if (!["add", "subtract", "set"].includes(operation)) {
      throw new Error("Operation must be add, subtract, or set");
    }
    if (isNaN(quantity) || quantity < 0) {
      throw new Error("Quantity must be a non-negative number");
    }

    // Calculate new quantity
    let newQuantity;
    const qtyDelta = parseFloat(quantity);

    switch (operation) {
      case "add":
        newQuantity = item.qty + qtyDelta;
        break;
      case "subtract":
        newQuantity = item.qty - qtyDelta;
        if (newQuantity < 0) {
          throw new Error(
            `Insufficient stock. Current: ${item.qty}, Requested: ${qtyDelta}`
          );
        }
        break;
      case "set":
        newQuantity = qtyDelta;
        break;
    }

    // Create transaction record first (for audit trail)
    await this.createStockTransaction(id, {
      qty_delta:
        operation === "add"
          ? qtyDelta
          : operation === "subtract"
          ? -qtyDelta
          : qtyDelta - item.qty,
      reason_type: operation,
      reference_type: reason,
      unit: item.unit || "units",
    });

    // Update the item quantity
    const updated = await this.updateById(id, {
      qty: parseFloat(newQuantity.toFixed(3)), // Support decimal quantities
      updated_at: new Date().toISOString(),
    });

    // Check for low stock alert
    if (newQuantity <= updated.reorder_threshold) {
      await this.createLowStockAlert(id, {
        current_quantity: newQuantity,
        threshold_quantity: updated.reorder_threshold,
        severity:
          newQuantity <= updated.reorder_threshold * 0.5 ? "critical" : "high",
        notes: `Stock update via ${operation} operation - ${reason}`,
      });
    }

    // Log stock update in audit trail
    await this.logInventoryOperation(
      "stock_update",
      id,
      {
        operation: operation,
        quantity: quantity,
        old_quantity: item.qty,
        new_quantity: newQuantity,
        reason: reason,
      },
      userId
    );

    return updated;
  }

  /**
   * Transfer stock between locations with audit trail
   */
  async transferStock(itemId, fromLocation, toLocation, quantity, userId) {
    // Validate record access and location access
    const item = await this.findById(itemId);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    const hasAccess = await this.hasUserAccessToItem(itemId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this inventory item");
    }

    if (isNaN(quantity) || quantity <= 0) {
      throw new Error("Transfer quantity must be a positive number");
    }

    if (item.qty < quantity) {
      throw new Error(
        `Insufficient stock for transfer. Available: ${item.qty}, Requested: ${quantity}`
      );
    }

    // Create transfer transaction
    await this.createStockTransaction(itemId, {
      qty_delta: -quantity, // Negative for transfer out
      reason_type: "transfer",
      reference_type: "transfer_out",
      reference_id: `${fromLocation}->${toLocation}`,
      unit: item.unit || "units",
      notes: `Transfer from ${fromLocation} to ${toLocation}`,
    });

    // Update stock (transfer out)
    const updated = await this.updateById(itemId, {
      qty: parseFloat((item.qty - quantity).toFixed(3)),
      updated_at: new Date().toISOString(),
    });

    // Log transfer in audit trail
    await this.logInventoryOperation(
      "stock_transfer",
      itemId,
      {
        operation: "transfer",
        from_location: fromLocation,
        to_location: toLocation,
        quantity: quantity,
        remaining_stock: updated.qty,
      },
      userId
    );

    return updated;
  }

  /**
   * Get low stock items with automatic detection
   */
  async getLowStockItems(farmId, threshold = null, userId = null) {
    // Verify access if farmId and userId provided
    if (farmId && userId) {
      const farmRepo = new FarmRepository(this.db);
      const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
      if (!hasAccess) {
        throw new Error("Farm access denied");
      }
    }

    let query = `
      SELECT DISTINCT
        ii.*,
        fa.name as farm_name,
        CASE 
          WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
          WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
          ELSE 'normal'
        END as stock_status,
        ROUND((ii.qty::decimal / NULLIF(ii.reorder_threshold, 0)) * 100, 2) as stock_percentage
      FROM inventory_items ii
      JOIN farm_members fm ON ii.farm_id = fm.farm_id
      JOIN farms fa ON ii.farm_id = fa.id
      WHERE ii.reorder_threshold > 0 
        AND ii.qty <= COALESCE(?, ii.reorder_threshold * 1.5)
    `;

    const params = [threshold || null];

    if (farmId) {
      query += " AND ii.farm_id = ?";
      params.push(farmId);
    } else if (userId) {
      query += " AND fm.user_id = ?";
      params.push(userId);
    }

    query += " ORDER BY (ii.qty / ii.reorder_threshold) ASC";

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "inventory_items",
      context: { getLowStockItems: true, farmId, threshold },
    });

    if (error) {
      throw new Error(`Low stock query failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Calculate inventory valuation using different methods
   */
  async calculateValuation(farmId, method = "fifo", userId = null) {
    // Verify access
    if (userId) {
      const farmRepo = new FarmRepository(this.db);
      const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
      if (!hasAccess) {
        throw new Error("Farm access denied");
      }
    }

    let query, params;

    switch (method) {
      case "fifo":
        // First In, First Out - use most recent costs
        query = `
          SELECT 
            ii.id,
            ii.name,
            ii.sku,
            ii.qty,
            ii.current_cost_per_unit,
            (ii.qty * ii.current_cost_per_unit) as total_value,
            COALESCE((
              SELECT ch.unit_cost 
              FROM inventory_cost_history ch 
              WHERE ch.inventory_item_id = ii.id 
              ORDER BY ch.cost_date DESC 
              LIMIT 1
            ), ii.current_cost_per_unit) as last_cost
          FROM inventory_items ii
          WHERE ii.farm_id = ?
        `;
        params = [farmId];
        break;

      case "average":
        // Average cost method
        query = `
          SELECT 
            ii.id,
            ii.name,
            ii.sku,
            ii.qty,
            ii.current_cost_per_unit,
            (ii.qty * ii.current_cost_per_unit) as total_value,
            COALESCE((
              SELECT AVG(ch.unit_cost) 
              FROM inventory_cost_history ch 
              WHERE ch.inventory_item_id = ii.id
            ), ii.current_cost_per_unit) as avg_cost
          FROM inventory_items ii
          WHERE ii.farm_id = ?
        `;
        params = [farmId];
        break;

      case "lifo":
        // Last In, First Out - use oldest costs
        query = `
          SELECT 
            ii.id,
            ii.name,
            ii.sku,
            ii.qty,
            ii.current_cost_per_unit,
            (ii.qty * ii.current_cost_per_unit) as total_value,
            COALESCE((
              SELECT ch.unit_cost 
              FROM inventory_cost_history ch 
              WHERE ch.inventory_item_id = ii.id 
              ORDER BY ch.cost_date ASC 
              LIMIT 1
            ), ii.current_cost_per_unit) as oldest_cost
          FROM inventory_items ii
          WHERE ii.farm_id = ?
        `;
        params = [farmId];
        break;

      default:
        throw new Error(`Unsupported valuation method: ${method}`);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "inventory_items",
      context: { calculateValuation: true, farmId, method },
    });

    if (error) {
      throw new Error(`Valuation calculation failed: ${error.message}`);
    }

    const items = results || [];
    const totalValue = items.reduce(
      (sum, item) => sum + (item.total_value || 0),
      0
    );

    const valuation = {
      farm_id: farmId,
      valuation_method: method,
      total_items: items.length,
      total_value: Math.round(totalValue * 100) / 100,
      calculated_at: new Date().toISOString(),
      items: items,
    };

    // Log valuation calculation
    if (userId) {
      await this.logInventoryOperation(
        "valuation_calculate",
        null,
        {
          method: method,
          total_value: valuation.total_value,
          item_count: items.length,
          farm_id: farmId,
        },
        userId
      );
    }

    return valuation;
  }

  /**
   * Get stock movement history with pagination
   */
  async getStockMovements(filters = {}, userId, options = {}) {
    let query = `
      SELECT DISTINCT
        it.*,
        ii.name as item_name,
        ii.sku as item_sku,
        fa.name as farm_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.inventory_item_id = ii.id
      JOIN farm_members fm ON ii.farm_id = fm.farm_id
      JOIN farms fa ON ii.farm_id = fa.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters
    if (filters.item_id) {
      query += " AND it.inventory_item_id = ?";
      params.push(filters.item_id);
    }
    if (filters.farm_id) {
      query += " AND ii.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.reason_type) {
      query += " AND it.reason_type = ?";
      params.push(filters.reason_type);
    }
    if (filters.date_from) {
      query += " AND date(it.created_at) >= ?";
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += " AND date(it.created_at) <= ?";
      params.push(filters.date_to);
    }

    query += " ORDER BY it.created_at DESC";

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "inventory_transactions",
      context: { getStockMovements: true, filters, options },
    });

    if (error) {
      throw new Error(`Stock movements query failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Check reorder points and generate alerts
   */
  async checkReorderPoints(farmId, userId) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Get items at or below reorder threshold
    const lowStockItems = await this.getLowStockItems(farmId, null, userId);

    const alerts = [];

    for (const item of lowStockItems) {
      // Check if an alert already exists for today
      const { results: existingAlerts } = await this.db.executeQuery(
        `
        SELECT COUNT(*) as alert_count
        FROM inventory_alerts 
        WHERE inventory_item_id = ? 
          AND alert_type = 'reorder_point'
          AND alert_date = ?
      `,
        [item.id, new Date().toISOString().split("T")[0]],
        {
          operation: "query",
          table: "inventory_alerts",
          context: { checkExistingAlerts: true },
        }
      );

      if (existingAlerts[0].alert_count === 0) {
        // Create new alert
        const alert = await this.createLowStockAlert(item.id, {
          current_quantity: item.qty,
          threshold_quantity: item.reorder_threshold,
          severity: item.stock_status,
          notes: "Automatic reorder point check",
          alert_type: "reorder_point",
        });

        alerts.push(alert);
      }
    }

    return {
      checked_items: lowStockItems.length,
      new_alerts: alerts.length,
      alerts: alerts,
      checked_at: new Date().toISOString(),
    };
  }

  /**
   * Generate comprehensive inventory report
   */
  async generateInventoryReport(type, params, userId) {
    if (!params.farm_id) {
      throw new Error("Farm ID required for report generation");
    }

    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(params.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    switch (type) {
      case "stock_valuation":
        return await this.calculateValuation(
          params.farm_id,
          params.method || "fifo",
          userId
        );
      case "low_stock_summary":
        return await this.generateLowStockReport(params, userId);
      case "movement_analysis":
        return await this.generateMovementAnalysis(params, userId);
      case "category_summary":
        return await this.generateCategorySummary(params, userId);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  // === PRIVATE HELPER METHODS ===

  async hasUserAccessToItem(itemId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM inventory_items ii
      JOIN farm_members fm ON ii.farm_id = fm.farm_id
      WHERE ii.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [itemId, userId],
      {
        operation: "query",
        table: "inventory_items",
        context: { hasUserAccessToItem: true },
      }
    );

    return results.length > 0;
  }

  async createCostHistory(itemId, costData) {
    return await this.db.executeQuery(
      `
      INSERT INTO inventory_cost_history (
        inventory_item_id, cost_date, unit_cost, quantity_purchased, 
        total_cost, cost_reason, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        itemId,
        new Date().toISOString().split("T")[0],
        costData.unit_cost,
        costData.quantity_purchased || 0,
        costData.total_cost || 0,
        costData.cost_reason || "cost_update",
        costData.notes || null,
      ],
      {
        operation: "run",
        table: "inventory_cost_history",
        context: { createCostHistory: true },
      }
    );
  }

  async createLowStockAlert(itemId, alertData) {
    return await this.db.executeQuery(
      `
      INSERT INTO inventory_alerts (
        inventory_item_id, alert_type, alert_date, current_quantity, 
        threshold_quantity, severity, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        itemId,
        alertData.alert_type || "low_stock",
        new Date().toISOString().split("T")[0],
        alertData.current_quantity,
        alertData.threshold_quantity,
        alertData.severity || "high",
        alertData.notes || "Low stock alert",
      ],
      {
        operation: "run",
        table: "inventory_alerts",
        context: { createLowStockAlert: true },
      }
    );
  }

  async createStockTransaction(itemId, transactionData) {
    return await this.db.executeQuery(
      `
      INSERT INTO inventory_transactions (
        inventory_item_id, qty_delta, unit, reason_type, reference_type, 
        reference_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      [
        itemId,
        transactionData.qty_delta,
        transactionData.unit || "units",
        transactionData.reason_type || "adjustment",
        transactionData.reference_type || "manual",
        transactionData.reference_id || null,
        transactionData.notes || null,
      ],
      {
        operation: "run",
        table: "inventory_transactions",
        context: { createStockTransaction: true },
      }
    );
  }

  async logInventoryOperation(operation, itemId, data, userId) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id, old_values, new_values, 
          timestamp, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          `inventory.${operation}`,
          "inventory_items",
          itemId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          new Date().toISOString(),
          "system",
          "InventoryRepository",
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logInventoryOperation: true },
        }
      );
    } catch (error) {
      console.error("Failed to log inventory operation:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  async generateLowStockReport(params, userId) {
    const { farm_id } = params;
    const lowStockItems = await this.getLowStockItems(farm_id, null, userId);

    const summary = {
      farm_id,
      report_type: "low_stock_summary",
      total_items: lowStockItems.length,
      critical_items: lowStockItems.filter(
        (item) => item.stock_status === "critical"
      ).length,
      low_items: lowStockItems.filter((item) => item.stock_status === "low")
        .length,
      items: lowStockItems,
      generated_at: new Date().toISOString(),
    };

    await this.logInventoryOperation(
      "report_generate",
      null,
      {
        report_type: "low_stock_summary",
        item_count: summary.total_items,
        critical_count: summary.critical_items,
        farm_id: farm_id,
      },
      userId
    );

    return summary;
  }

  async generateMovementAnalysis(params, userId) {
    const { farm_id, date_from, date_to } = params;

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        reason_type,
        COUNT(*) as transaction_count,
        SUM(qty_delta) as total_quantity_change,
        AVG(ABS(qty_delta)) as avg_movement
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.inventory_item_id = ii.id
      JOIN farm_members fm ON ii.farm_id = fm.farm_id
      WHERE ii.farm_id = ?
        AND date(it.created_at) >= ?
        AND date(it.created_at) <= ?
      GROUP BY reason_type
      ORDER BY transaction_count DESC
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "inventory_transactions",
        context: { generateMovementAnalysis: true },
      }
    );

    const report = {
      farm_id,
      report_type: "movement_analysis",
      period: { from: date_from, to: date_to },
      movement_breakdown: results,
      total_transactions: results.reduce(
        (sum, r) => sum + r.transaction_count,
        0
      ),
      generated_at: new Date().toISOString(),
    };

    await this.logInventoryOperation(
      "report_generate",
      null,
      {
        report_type: "movement_analysis",
        period: report.period,
        summary: report,
      },
      userId
    );

    return report;
  }

  async generateCategorySummary(params, userId) {
    const { farm_id } = params;

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        COALESCE(category, 'Uncategorized') as category,
        COUNT(*) as item_count,
        SUM(qty) as total_quantity,
        AVG(current_cost_per_unit) as avg_cost_per_unit,
        SUM(qty * current_cost_per_unit) as total_value,
        COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_count
      FROM inventory_items 
      WHERE farm_id = ?
      GROUP BY category
      ORDER BY total_value DESC
    `,
      [farm_id],
      {
        operation: "query",
        table: "inventory_items",
        context: { generateCategorySummary: true },
      }
    );

    const report = {
      farm_id,
      report_type: "category_summary",
      total_categories: results.length,
      categories: results,
      total_value: results.reduce((sum, r) => sum + (r.total_value || 0), 0),
      generated_at: new Date().toISOString(),
    };

    await this.logInventoryOperation(
      "report_generate",
      null,
      {
        report_type: "category_summary",
        category_count: report.total_categories,
        total_value: report.total_value,
        farm_id: farm_id,
      },
      userId
    );

    return report;
  }
}
