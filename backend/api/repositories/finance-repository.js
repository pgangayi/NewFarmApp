/**
 * Finance Repository - Handles all finance-related database operations
 * Phase 4 Migration: Financial Data Security & Audit Enhancement
 * Provides comprehensive financial transaction management with audit trails
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Finance Repository - Handles all finance-related database operations
 * Phase 4 Migration: Financial Data Security & Audit Enhancement
 */
export class FinanceRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "finance_entries");
  }

  /**
   * Get financial entries for user's farms with enhanced security
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        fe.*,
        fa.name as farm_name,
        creator.name as created_by_name,
        CASE 
          WHEN fe.type = 'income' THEN fe.amount
          ELSE -fe.amount 
        END as net_amount
      FROM finance_entries fe
      JOIN farm_members fm ON fe.farm_id = fm.farm_id
      JOIN farms fa ON fe.farm_id = fa.id
      LEFT JOIN users creator ON fe.created_by = creator.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters with security validation
    if (filters.farm_id) {
      query += " AND fe.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.type) {
      query += " AND fe.type = ?";
      params.push(filters.type);
    }
    if (filters.budget_category) {
      query += " AND fe.budget_category = ?";
      params.push(filters.budget_category);
    }
    if (filters.entry_date_from) {
      query += " AND date(fe.entry_date) >= ?";
      params.push(filters.entry_date_from);
    }
    if (filters.entry_date_to) {
      query += " AND date(fe.entry_date) <= ?";
      params.push(filters.entry_date_to);
    }
    if (filters.search) {
      query += " AND (fe.description LIKE ? OR fe.account LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY fe.${options.sortBy} ${
        options.sortDirection?.toUpperCase() || "DESC"
      }`;
    } else {
      query += " ORDER BY fe.entry_date DESC";
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "finance_entries",
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
        `Database error in FinanceRepository.findByUserAccess: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Count financial entries for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT fe.id) as total
      FROM finance_entries fe
      JOIN farm_members fm ON fe.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    if (filters.farm_id) {
      query += " AND fe.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.type) {
      query += " AND fe.type = ?";
      params.push(filters.type);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "finance_entries",
      context: { countByUserAccess: true, userId, filters },
    });

    if (error) {
      throw new Error(
        `Database error in FinanceRepository.countByUserAccess: ${error.message}`
      );
    }

    return results[0]?.total || 0;
  }

  /**
   * Create financial transaction with comprehensive audit trail
   */
  async createTransaction(entryData, userId) {
    // Validate required fields
    if (!entryData.farm_id || !entryData.type || !entryData.amount) {
      throw new Error("Farm ID, type, and amount are required");
    }

    // Validate transaction type
    if (!["income", "expense", "investment"].includes(entryData.type)) {
      throw new Error(
        "Transaction type must be income, expense, or investment"
      );
    }

    // Validate amount (prevent negative amounts, enforce precision)
    if (typeof entryData.amount !== "number" || entryData.amount <= 0) {
      throw new Error("Amount must be a positive number");
    }

    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(entryData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // Prepare transaction data with defaults
    const transactionData = {
      farm_id: entryData.farm_id,
      entry_date:
        entryData.entry_date || new Date().toISOString().split("T")[0],
      type: entryData.type,
      amount: parseFloat(entryData.amount.toFixed(2)), // Ensure precision
      currency: entryData.currency || "USD",
      account: entryData.account || null,
      description: entryData.description || null,
      reference_type: entryData.reference_type || null,
      reference_id: entryData.reference_id || null,
      project_id: entryData.project_id || null,
      department: entryData.department || null,
      tax_category: entryData.tax_category || null,
      approval_status: entryData.approval_status || "pending",
      receipt_number: entryData.receipt_number || null,
      recurring_pattern: entryData.recurring_pattern || null,
      budget_category: entryData.budget_category || null,
      tax_deductible: entryData.tax_deductible || 0,
      bank_account: entryData.bank_account || null,
      created_by: userId,
    };

    const transaction = [
      {
        query: `
          INSERT INTO finance_entries (
            farm_id, entry_date, type, amount, currency, account, description,
            reference_type, reference_id, project_id, department, tax_category,
            approval_status, receipt_number, recurring_pattern, budget_category,
            tax_deductible, bank_account, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(transactionData),
        operation: "run",
        table: "finance_entries",
        context: {
          createTransaction: true,
          audit_level: "comprehensive",
          data_integrity: "enforced",
        },
      },
    ];

    try {
      const result = await this.db.executeTransaction(transaction);
      const newTransactionId = result.results[0].lastRowId;

      // Log financial operation in audit trail
      await this.logFinancialOperation(
        "create",
        newTransactionId,
        transactionData,
        userId
      );

      return await this.findById(newTransactionId);
    } catch (error) {
      throw new Error(`Transaction creation failed: ${error.message}`);
    }
  }

  /**
   * Update financial transaction with audit trail
   */
  async updateTransaction(id, updateData, userId) {
    // Validate record access
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Transaction not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToTransaction(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this transaction");
    }

    // Validate update data
    if (updateData.amount !== undefined) {
      if (typeof updateData.amount !== "number" || updateData.amount <= 0) {
        throw new Error("Amount must be a positive number");
      }
      updateData.amount = parseFloat(updateData.amount.toFixed(2));
    }

    if (
      updateData.type &&
      !["income", "expense", "investment"].includes(updateData.type)
    ) {
      throw new Error(
        "Transaction type must be income, expense, or investment"
      );
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform update
    const updated = await this.updateById(id, updateData);

    // Log update in audit trail
    await this.logFinancialOperation(
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
   * Delete financial transaction with dependency checking
   */
  async deleteTransaction(id, userId) {
    // Validate record access
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Transaction not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToTransaction(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this transaction");
    }

    // Check for dependencies (referenced by other records)
    const dependencies = await this.checkTransactionDependencies(id);
    if (dependencies.hasReferences) {
      throw new Error(
        "Cannot delete transaction with existing references. Consider archiving instead."
      );
    }

    // Perform deletion
    await this.deleteById(id);

    // Log deletion in audit trail
    await this.logFinancialOperation(
      "delete",
      id,
      {
        deleted_record: existing,
      },
      userId
    );

    return { success: true, deletedId: id };
  }

  /**
   * Get real-time balance for farm account
   */
  async getBalance(farmId, accountType = "all", userId) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    let query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as total_investments,
        COUNT(*) as transaction_count
      FROM finance_entries 
      WHERE farm_id = ?
    `;
    const params = [farmId];

    if (accountType !== "all") {
      query += " AND account = ?";
      params.push(accountType);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "finance_entries",
      context: { getBalance: true, farmId, accountType },
    });

    if (error) {
      throw new Error(`Balance calculation failed: ${error.message}`);
    }

    const data = results[0];
    return {
      farm_id: farmId,
      account_type: accountType,
      total_revenue: data?.total_revenue || 0,
      total_expenses: data?.total_expenses || 0,
      total_investments: data?.total_investments || 0,
      net_profit: (data?.total_revenue || 0) - (data?.total_expenses || 0),
      transaction_count: data?.transaction_count || 0,
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate financial report with security validation
   */
  async generateReport(type, params, userId) {
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
      case "monthly_summary":
        return await this.generateMonthlySummary(params, userId);
      case "cash_flow":
        return await this.generateCashFlowReport(params, userId);
      case "category_analysis":
        return await this.generateCategoryAnalysis(params, userId);
      case "profit_loss":
        return await this.generateProfitLossReport(params, userId);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  /**
   * Bulk create financial transactions with atomic operations
   */
  async bulkCreateTransactions(entries, userId) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error("Entries array is required");
    }

    const transactions = [];
    const auditLogs = [];

    // Process each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        // Validate entry
        if (!entry.farm_id || !entry.type || !entry.amount) {
          throw new Error(`Entry ${i + 1}: Missing required fields`);
        }

        // Check farm access
        const farmRepo = new FarmRepository(this.db);
        const hasAccess = await farmRepo.hasUserAccess(entry.farm_id, userId);
        if (!hasAccess) {
          throw new Error(`Entry ${i + 1}: Farm access denied`);
        }

        const transactionData = {
          farm_id: entry.farm_id,
          entry_date:
            entry.entry_date || new Date().toISOString().split("T")[0],
          type: entry.type,
          amount: parseFloat(entry.amount.toFixed(2)),
          currency: entry.currency || "USD",
          account: entry.account || null,
          description: entry.description || null,
          reference_type: entry.reference_type || null,
          reference_id: entry.reference_id || null,
          project_id: entry.project_id || null,
          department: entry.department || null,
          tax_category: entry.tax_category || null,
          approval_status: entry.approval_status || "pending",
          receipt_number: entry.receipt_number || null,
          recurring_pattern: entry.recurring_pattern || null,
          budget_category: entry.budget_category || null,
          tax_deductible: entry.tax_deductible || 0,
          bank_account: entry.bank_account || null,
          created_by: userId,
        };

        transactions.push({
          query: `
            INSERT INTO finance_entries (
              farm_id, entry_date, type, amount, currency, account, description,
              reference_type, reference_id, project_id, department, tax_category,
              approval_status, receipt_number, recurring_pattern, budget_category,
              tax_deductible, bank_account, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: Object.values(transactionData),
          operation: "run",
          table: "finance_entries",
          context: { bulkCreate: true, entry_index: i },
        });
      } catch (error) {
        throw new Error(
          `Bulk create failed at entry ${i + 1}: ${error.message}`
        );
      }
    }

    try {
      // Execute all transactions atomically
      const result = await this.db.executeTransaction(transactions);

      // Log bulk operation
      await this.logFinancialOperation(
        "bulk_create",
        null,
        {
          total_entries: entries.length,
          created_ids: result.results.map((r) => r.lastRowId),
        },
        userId
      );

      return {
        success: true,
        created_count: entries.length,
        created_ids: result.results.map((r) => r.lastRowId),
      };
    } catch (error) {
      throw new Error(`Bulk transaction failed: ${error.message}`);
    }
  }

  // === PRIVATE HELPER METHODS ===

  async hasUserAccessToTransaction(transactionId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM finance_entries fe
      JOIN farm_members fm ON fe.farm_id = fm.farm_id
      WHERE fe.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [transactionId, userId],
      {
        operation: "query",
        table: "finance_entries",
        context: { hasUserAccessToTransaction: true },
      }
    );

    return results.length > 0;
  }

  async checkTransactionDependencies(transactionId) {
    // Check if transaction is referenced by other records
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        (SELECT COUNT(*) FROM invoices WHERE total_amount IN (
          SELECT amount FROM finance_entries WHERE id = ?
        )) as invoice_references,
        (SELECT COUNT(*) FROM purchase_orders WHERE total_amount IN (
          SELECT amount FROM finance_entries WHERE id = ?
        )) as po_references
    `,
      [transactionId, transactionId],
      {
        operation: "query",
        table: "finance_entries",
        context: { checkTransactionDependencies: true },
      }
    );

    const deps = results[0];
    return {
      hasReferences: deps.invoice_references > 0 || deps.po_references > 0,
      invoice_references: deps.invoice_references,
      po_references: deps.po_references,
    };
  }

  async logFinancialOperation(operation, transactionId, data, userId) {
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
          `finance.${operation}`,
          "finance_entries",
          transactionId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          new Date().toISOString(),
          "system",
          "FinanceRepository",
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logFinancialOperation: true },
        }
      );
    } catch (error) {
      console.error("Failed to log financial operation:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  async generateMonthlySummary(params, userId) {
    const { farm_id, year, month } = params;
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`;

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM finance_entries 
      WHERE farm_id = ? 
        AND strftime('%Y-%m', entry_date) = ?
      GROUP BY type
    `,
      [farm_id, monthStr],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateMonthlySummary: true },
      }
    );

    const summary = {
      farm_id,
      report_type: "monthly_summary",
      period: monthStr,
      breakdown: results,
      generated_at: new Date().toISOString(),
    };

    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "monthly_summary",
        period: monthStr,
        summary_data: summary,
      },
      userId
    );

    return summary;
  }

  async generateCashFlowReport(params, userId) {
    const { farm_id, date_from, date_to } = params;

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        strftime('%Y-%m', entry_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inflow,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as outflow,
        SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net_flow
      FROM finance_entries 
      WHERE farm_id = ?
        AND date(entry_date) >= ?
        AND date(entry_date) <= ?
      GROUP BY strftime('%Y-%m', entry_date)
      ORDER BY month
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateCashFlowReport: true },
      }
    );

    const report = {
      farm_id,
      report_type: "cash_flow",
      period: { from: date_from, to: date_to },
      monthly_flows: results,
      generated_at: new Date().toISOString(),
    };

    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "cash_flow",
        period: report.period,
        summary: report,
      },
      userId
    );

    return report;
  }

  async generateCategoryAnalysis(params, userId) {
    const { farm_id, date_from, date_to } = params;

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        COALESCE(budget_category, 'Uncategorized') as category,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount
      FROM finance_entries 
      WHERE farm_id = ?
        AND date(entry_date) >= ?
        AND date(entry_date) <= ?
      GROUP BY budget_category, type
      ORDER BY total_amount DESC
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateCategoryAnalysis: true },
      }
    );

    const report = {
      farm_id,
      report_type: "category_analysis",
      period: { from: date_from, to: date_to },
      category_breakdown: results,
      generated_at: new Date().toISOString(),
    };

    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "category_analysis",
        period: report.period,
        summary: report,
      },
      userId
    );

    return report;
  }

  async generateProfitLossReport(params, userId) {
    const { farm_id, date_from, date_to } = params;

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount
      FROM finance_entries 
      WHERE farm_id = ?
        AND date(entry_date) >= ?
        AND date(entry_date) <= ?
        AND type IN ('income', 'expense')
      GROUP BY type
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateProfitLossReport: true },
      }
    );

    const income = results.find((r) => r.type === "income")?.total_amount || 0;
    const expenses =
      results.find((r) => r.type === "expense")?.total_amount || 0;
    const profit = income - expenses;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    const report = {
      farm_id,
      report_type: "profit_loss",
      period: { from: date_from, to: date_to },
      revenue: income,
      expenses: expenses,
      profit: profit,
      profit_margin: Math.round(margin * 100) / 100,
      transaction_summary: results,
      generated_at: new Date().toISOString(),
    };

    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "profit_loss",
        period: report.period,
        summary: report,
      },
      userId
    );

    return report;
  }
}
