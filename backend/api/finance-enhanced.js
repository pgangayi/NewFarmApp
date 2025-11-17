import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { FinanceRepository } from "./repositories/finance-repository.js";

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

    // Initialize DatabaseOperations and FinanceRepository
    const db = new DatabaseOperations(env);
    const financeRepo = new FinanceRepository(db);

    // Enhanced finance entries with comprehensive data
    if (method === "GET") {
      const entryId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const type = url.searchParams.get("type");
      const category = url.searchParams.get("category");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const farmId = url.searchParams.get("farm_id");

      if (entryId) {
        // Get specific entry with detailed data
        try {
          const entry = await financeRepo.findById(entryId);
          if (!entry) {
            return createErrorResponse("Entry not found or access denied", 404);
          }
          return createSuccessResponse(entry);
        } catch (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }
      } else if (analytics === "true") {
        // Get entries with analytics data
        const filters = {};
        if (type) filters.type = type;
        if (category) filters.budget_category = category;
        if (farmId) filters.farm_id = farmId;
        if (dateFrom) filters.entry_date_from = dateFrom;
        if (dateTo) filters.entry_date_to = dateTo;

        try {
          const entries = await financeRepo.findByUserAccess(user.id, filters, {
            sortBy: "entry_date",
            sortDirection: "DESC",
          });
          return createSuccessResponse(entries || []);
        } catch (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }
      } else {
        // Standard entries list with enhanced data
        const filters = {};
        if (type) filters.type = type;
        if (category) filters.budget_category = category;
        if (farmId) filters.farm_id = farmId;

        try {
          const entries = await financeRepo.findByUserAccess(user.id, filters, {
            sortBy: "entry_date",
            sortDirection: "DESC",
            limit: 100,
          });
          return createSuccessResponse(entries || []);
        } catch (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }
      }
    } else if (method === "POST") {
      // Create finance entry with enhanced data
      const body = await request.json();

      try {
        const newEntry = await financeRepo.createTransaction(body, user.id);
        return createSuccessResponse(newEntry);
      } catch (error) {
        console.error("Create transaction error:", error);
        return createErrorResponse(error.message, 500);
      }
    } else if (method === "PUT") {
      // Update finance entry with enhanced data
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse("Entry ID required", 400);
      }

      try {
        const updatedEntry = await financeRepo.updateTransaction(
          id,
          updateData,
          user.id
        );
        return createSuccessResponse(updatedEntry);
      } catch (error) {
        console.error("Update transaction error:", error);
        return createErrorResponse(error.message, 500);
      }
    } else if (method === "DELETE") {
      // Enhanced delete with validation. Accept id via query param or RESTful path segment.
      let entryId = url.searchParams.get("id");

      // Fallback: try to parse last path segment as id (supports RESTful client calls)
      if (!entryId) {
        const parts = url.pathname.split("/").filter(Boolean);
        entryId = parts.length ? parts[parts.length - 1] : null;
      }

      if (!entryId) {
        return createErrorResponse("Entry ID required", 400);
      }

      try {
        const result = await financeRepo.deleteTransaction(entryId, user.id);
        return createSuccessResponse(result);
      } catch (error) {
        console.error("Delete transaction error:", error);
        return createErrorResponse(error.message, 500);
      }
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Finance API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Budget Categories Management
export async function onRequestBudgets(context) {
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
      const categoryId = url.searchParams.get("id");
      const fiscalYear = url.searchParams.get("fiscal_year");
      const farmId = url.searchParams.get("farm_id");

      if (categoryId) {
        // Get specific budget category
        const { results, error } = await env.DB.prepare(
          `
          SELECT 
            bc.*,
            fa.name as farm_name,
            parent.name as parent_category_name
          FROM budget_categories bc
          JOIN farms fa ON bc.farm_id = fa.id
          LEFT JOIN budget_categories parent ON bc.parent_category_id = parent.id
          WHERE bc.id = ? AND fa.owner_id = ?
        `
        )
          .bind(categoryId, user.id)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        const category = results[0];
        if (!category) {
          return createErrorResponse(
            "Category not found or access denied",
            404
          );
        }

        return createSuccessResponse(category);
      } else {
        // Get budget categories list
        let query = `
          SELECT 
            bc.*,
            fa.name as farm_name,
            parent.name as parent_category_name
          FROM budget_categories bc
          JOIN farms fa ON bc.farm_id = fa.id
          LEFT JOIN budget_categories parent ON bc.parent_category_id = parent.id
          WHERE fa.owner_id = ?
        `;
        const params = [user.id];

        if (fiscalYear) {
          query += " AND bc.fiscal_year = ?";
          params.push(fiscalYear);
        }
        if (farmId) {
          query += " AND bc.farm_id = ?";
          params.push(farmId);
        }

        query += " ORDER BY bc.category_name";

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
        category_name,
        budgeted_amount,
        fiscal_year,
        description,
        parent_category_id,
      } = body;

      if (!farm_id || !category_name || !budgeted_amount || !fiscal_year) {
        return createErrorResponse(
          "Farm ID, category name, budgeted amount, and fiscal year are required",
          400
        );
      }

      // Check if user has access to this farm
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Farm not found or access denied", 404);
      }

      const remainingBudget = budgeted_amount; // Initially full budget is remaining

      const { error } = await env.DB.prepare(
        `
        INSERT INTO budget_categories (
          farm_id, category_name, budgeted_amount, remaining_budget,
          fiscal_year, description, parent_category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          category_name,
          budgeted_amount,
          remainingBudget,
          fiscal_year,
          description || null,
          parent_category_id || null
        )
        .run();

      if (error) {
        console.error("Budget category insert error:", error);
        return createErrorResponse("Failed to create budget category", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Budgets API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Financial Reports Generation
export async function onRequestReports(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Initialize DatabaseOperations and FinanceRepository
    const db = new DatabaseOperations(env);
    const financeRepo = new FinanceRepository(db);

    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const reportType = url.searchParams.get("type");
      const period = url.searchParams.get("period");

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      try {
        const params = {
          farm_id: farmId,
          date_from: period
            ? new Date(Date.parse(period) - 3 * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            : new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
          date_to: new Date().toISOString().split("T")[0],
        };

        const reportData = await financeRepo.generateReport(
          "profit_loss",
          params,
          user.id
        );
        reportData.report_type = reportType || "quarterly";
        reportData.report_period =
          period || new Date().toISOString().substring(0, 7);

        return createSuccessResponse(reportData);
      } catch (error) {
        console.error("Generate report error:", error);
        return createErrorResponse(error.message, 500);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        report_type,
        report_period,
        total_revenue,
        total_expenses,
        net_profit,
        gross_margin,
        operating_margin,
      } = body;

      if (!farm_id || !report_type || !report_period) {
        return createErrorResponse(
          "Farm ID, report type, and period are required",
          400
        );
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Access denied", 403);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO financial_reports (
          farm_id, report_type, report_period, total_revenue, total_expenses,
          net_profit, gross_margin, operating_margin, report_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          report_type,
          report_period,
          total_revenue || 0,
          total_expenses || 0,
          net_profit || 0,
          gross_margin || 0,
          operating_margin || 0,
          JSON.stringify(body)
        )
        .run();

      if (error) {
        console.error("Report insert error:", error);
        return createErrorResponse("Failed to create financial report", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Reports API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Analytics and Dashboard Data
export async function onRequestAnalytics(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Initialize DatabaseOperations and FinanceRepository
    const db = new DatabaseOperations(env);
    const financeRepo = new FinanceRepository(db);

    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const period = url.searchParams.get("period") || "12months";

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      try {
        const dateFrom =
          period === "12months"
            ? new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            : new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];
        const dateTo = new Date().toISOString().split("T")[0];

        // Get balance for summary
        const balance = await financeRepo.getBalance(farmId, "all", user.id);

        // Get transaction history for monthly trends
        const monthlyTransactions = await financeRepo.findByUserAccess(
          user.id,
          {
            farm_id: farmId,
            entry_date_from: dateFrom,
            entry_date_to: dateTo,
          },
          { limit: 1000 }
        );

        // Group by month for trends
        const monthlyTrends = {};
        monthlyTransactions.forEach((entry) => {
          const month = entry.entry_date.substring(0, 7);
          if (!monthlyTrends[month]) {
            monthlyTrends[month] = { revenue: 0, expenses: 0, net: 0 };
          }
          if (entry.type === "income") {
            monthlyTrends[month].revenue += entry.amount;
            monthlyTrends[month].net += entry.amount;
          } else if (entry.type === "expense") {
            monthlyTrends[month].expenses += entry.amount;
            monthlyTrends[month].net -= entry.amount;
          }
        });

        const monthly_trends = Object.entries(monthlyTrends)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => b.month.localeCompare(a.month));

        const analytics = {
          summary: {
            total_entries: monthlyTransactions.length,
            total_revenue: balance.total_revenue,
            total_expenses: balance.total_expenses,
            total_investments: balance.total_investments,
            transaction_count: balance.transaction_count,
          },
          monthly_trends,
          category_breakdown: [], // Would need additional repository method
          cash_flow: {
            total_in: balance.total_revenue,
            total_out: balance.total_expenses,
            net_flow: balance.net_profit,
          },
          profitability: {
            gross_profit: balance.net_profit,
            profit_margin:
              balance.total_revenue > 0
                ? (balance.net_profit / balance.total_revenue) * 100
                : 0,
          },
        };

        return createSuccessResponse(analytics);
      } catch (error) {
        console.error("Analytics error:", error);
        return createErrorResponse(error.message, 500);
      }
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
