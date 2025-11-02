import { AuthUtils, createUnauthorizedResponse, createErrorResponse, createSuccessResponse } from './_auth.js';

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

    // Enhanced finance entries with comprehensive data
    if (method === 'GET') {
      const entryId = url.searchParams.get('id');
      const analytics = url.searchParams.get('analytics');
      const type = url.searchParams.get('type');
      const category = url.searchParams.get('category');
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');
      const farmId = url.searchParams.get('farm_id');

      if (entryId) {
        // Get specific entry with detailed data
        const { results: entryResults, error } = await env.DB.prepare(`
          SELECT 
            fe.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM finance_entries fe
          JOIN farm_members fm ON fe.farm_id = fm.farm_id
          JOIN farms fa ON fe.farm_id = fa.id
          LEFT JOIN users creator ON fe.created_by = creator.id
          WHERE fe.id = ? AND fm.user_id = ?
        `).bind(entryId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const entry = entryResults[0];
        if (!entry) {
          return createErrorResponse('Entry not found or access denied', 404);
        }

        return createSuccessResponse(entry);

      } else if (analytics === 'true') {
        // Get entries with analytics data
        let query = `
          SELECT 
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
        const params = [user.id];

        // Add filters
        if (type) {
          query += ' AND fe.type = ?';
          params.push(type);
        }
        if (category) {
          query += ' AND fe.budget_category = ?';
          params.push(category);
        }
        if (farmId) {
          query += ' AND fe.farm_id = ?';
          params.push(farmId);
        }
        if (dateFrom) {
          query += ' AND date(fe.entry_date) >= ?';
          params.push(dateFrom);
        }
        if (dateTo) {
          query += ' AND date(fe.entry_date) <= ?';
          params.push(dateTo);
        }

        query += ' ORDER BY fe.entry_date DESC';

        const { results: entries, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(entries || []);

      } else {
        // Standard entries list with enhanced data
        let query = `
          SELECT 
            fe.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM finance_entries fe
          JOIN farm_members fm ON fe.farm_id = fm.farm_id
          JOIN farms fa ON fe.farm_id = fa.id
          LEFT JOIN users creator ON fe.created_by = creator.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        // Add filters
        if (type) {
          query += ' AND fe.type = ?';
          params.push(type);
        }
        if (category) {
          query += ' AND fe.budget_category = ?';
          params.push(category);
        }
        if (farmId) {
          query += ' AND fe.farm_id = ?';
          params.push(farmId);
        }

        query += ' ORDER BY fe.entry_date DESC LIMIT 100';

        const { results: entries, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(entries || []);
      }

    } else if (method === 'POST') {
      // Create finance entry with enhanced data
      const body = await request.json();
      const { 
        farm_id,
        entry_date,
        type,
        amount,
        currency,
        account,
        description,
        reference_type,
        reference_id,
        project_id,
        department,
        tax_category,
        approval_status,
        receipt_number,
        recurring_pattern,
        budget_category,
        tax_deductible,
        bank_account
      } = body;

      if (!farm_id || !type || !amount || !entry_date) {
        return createErrorResponse('Farm ID, entry date, type, and amount are required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO finance_entries (
          farm_id, entry_date, type, amount, currency, account, description,
          reference_type, reference_id, project_id, department, tax_category,
          approval_status, receipt_number, recurring_pattern, budget_category,
          tax_deductible, bank_account, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, entry_date, type, amount, currency || 'USD', account || null,
        description || null, reference_type || null, reference_id || null,
        project_id || null, department || null, tax_category || null,
        approval_status || 'pending', receipt_number || null, recurring_pattern || null,
        budget_category || null, tax_deductible || 0, bank_account || null, user.id
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create finance entry', 500);
      }

      // Get the created entry
      const { results: entryResults } = await env.DB.prepare(`
        SELECT 
          fe.*,
          fa.name as farm_name,
          creator.name as created_by_name
        FROM finance_entries fe
        JOIN farms fa ON fe.farm_id = fa.id
        LEFT JOIN users creator ON fe.created_by = creator.id
        WHERE fe.rowid = last_insert_rowid()
      `).all();

      const newEntry = entryResults[0];

      return createSuccessResponse(newEntry);

    } else if (method === 'PUT') {
      // Update finance entry with enhanced data
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse('Entry ID required', 400);
      }

      // Get the entry and check farm access
      const { results: existingEntries } = await env.DB.prepare(`
        SELECT fe.farm_id, fe.title
        FROM finance_entries fe
        JOIN farm_members fm ON fe.farm_id = fm.farm_id
        WHERE fe.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();

      if (existingEntries.length === 0) {
        return createErrorResponse('Entry not found or access denied', 404);
      }

      const updateFields = [];
      const updateValues = [];

      // Handle all possible update fields
      const allowedFields = [
        'entry_date', 'type', 'amount', 'currency', 'account', 'description',
        'reference_type', 'reference_id', 'project_id', 'department', 'tax_category',
        'approval_status', 'receipt_number', 'recurring_pattern', 'budget_category',
        'tax_deductible', 'bank_account'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });

      if (updateFields.length === 0) {
        return createErrorResponse('No fields to update', 400);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      const { error: updateError } = await env.DB.prepare(`
        UPDATE finance_entries 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...updateValues).run();

      if (updateError) {
        console.error('Update error:', updateError);
        return createErrorResponse('Failed to update finance entry', 500);
      }

      // Get updated entry
      const { results: entryResults } = await env.DB.prepare(`
        SELECT 
          fe.*,
          fa.name as farm_name,
          creator.name as created_by_name
        FROM finance_entries fe
        JOIN farms fa ON fe.farm_id = fa.id
        LEFT JOIN users creator ON fe.created_by = creator.id
        WHERE fe.id = ?
      `).bind(id).all();

      return createSuccessResponse(entryResults[0]);

    } else if (method === 'DELETE') {
      // Enhanced delete with validation
      const entryId = url.searchParams.get('id');

      if (!entryId) {
        return createErrorResponse('Entry ID required', 400);
      }

      // Get the entry and check farm access
      const { results: existingEntries } = await env.DB.prepare(`
        SELECT fe.farm_id, fe.type, fe.amount
        FROM finance_entries fe
        JOIN farm_members fm ON fe.farm_id = fm.farm_id
        WHERE fe.id = ? AND fm.user_id = ?
      `).bind(entryId, user.id).all();

      if (existingEntries.length === 0) {
        return createErrorResponse('Entry not found or access denied', 404);
      }

      // Check if entry is referenced by other records
      const { results: references } = await env.DB.prepare(`
        SELECT COUNT(*) as ref_count FROM invoices WHERE total_amount = ?
      `).bind(existingEntries[0].amount).all();

      if (references[0].ref_count > 0) {
        return createErrorResponse(
          'Cannot delete entry with existing references. Please archive instead.', 
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(`
        DELETE FROM finance_entries WHERE id = ?
      `).bind(entryId).run();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return createErrorResponse('Failed to delete finance entry', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Finance API error:', error);
    return createErrorResponse('Internal server error', 500);
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

    if (method === 'GET') {
      const categoryId = url.searchParams.get('id');
      const fiscalYear = url.searchParams.get('fiscal_year');
      const farmId = url.searchParams.get('farm_id');

      if (categoryId) {
        // Get specific budget category
        const { results, error } = await env.DB.prepare(`
          SELECT 
            bc.*,
            fa.name as farm_name,
            parent.name as parent_category_name
          FROM budget_categories bc
          JOIN farms fa ON bc.farm_id = fa.id
          LEFT JOIN budget_categories parent ON bc.parent_category_id = parent.id
          WHERE bc.id = ? AND fa.owner_id = ?
        `).bind(categoryId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const category = results[0];
        if (!category) {
          return createErrorResponse('Category not found or access denied', 404);
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
          query += ' AND bc.fiscal_year = ?';
          params.push(fiscalYear);
        }
        if (farmId) {
          query += ' AND bc.farm_id = ?';
          params.push(farmId);
        }

        query += ' ORDER BY bc.category_name';

        const { results, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(results);
      }

    } else if (method === 'POST') {
      const body = await request.json();
      const { 
        farm_id,
        category_name,
        budgeted_amount,
        fiscal_year,
        description,
        parent_category_id
      } = body;

      if (!farm_id || !category_name || !budgeted_amount || !fiscal_year) {
        return createErrorResponse('Farm ID, category name, budgeted amount, and fiscal year are required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const remainingBudget = budgeted_amount; // Initially full budget is remaining

      const { error } = await env.DB.prepare(`
        INSERT INTO budget_categories (
          farm_id, category_name, budgeted_amount, remaining_budget,
          fiscal_year, description, parent_category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, category_name, budgeted_amount, remainingBudget,
        fiscal_year, description || null, parent_category_id || null
      ).run();

      if (error) {
        console.error('Budget category insert error:', error);
        return createErrorResponse('Failed to create budget category', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Budgets API error:', error);
    return createErrorResponse('Internal server error', 500);
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

    if (method === 'GET') {
      const farmId = url.searchParams.get('farm_id');
      const reportType = url.searchParams.get('type');
      const period = url.searchParams.get('period');

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Access denied', 403);
      }

      // Generate financial report data
      const { results: entries } = await env.DB.prepare(`
        SELECT 
          type,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as total_investments
        FROM finance_entries
        WHERE farm_id = ? 
          AND date(entry_date) >= date(?, '-3 months')
      `).bind(farmId, period || new Date().toISOString()).all();

      const revenue = entries[0]?.total_revenue || 0;
      const expenses = entries[0]?.total_expenses || 0;
      const investments = entries[0]?.total_investments || 0;
      
      const netProfit = revenue - expenses;
      const grossMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      const operatingMargin = revenue > 0 ? ((revenue - expenses - investments) / revenue) * 100 : 0;

      const reportData = {
        farm_id: farmId,
        report_type: reportType || 'quarterly',
        report_period: period || new Date().toISOString().substring(0, 7),
        total_revenue: revenue,
        total_expenses: expenses,
        net_profit: netProfit,
        gross_margin: Math.round(grossMargin * 100) / 100,
        operating_margin: Math.round(operatingMargin * 100) / 100,
        generated_at: new Date().toISOString()
      };

      return createSuccessResponse(reportData);

    } else if (method === 'POST') {
      const body = await request.json();
      const { farm_id, report_type, report_period, total_revenue, total_expenses, net_profit, gross_margin, operating_margin } = body;

      if (!farm_id || !report_type || !report_period) {
        return createErrorResponse('Farm ID, report type, and period are required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO financial_reports (
          farm_id, report_type, report_period, total_revenue, total_expenses,
          net_profit, gross_margin, operating_margin, report_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, report_type, report_period,
        total_revenue || 0, total_expenses || 0,
        net_profit || 0, gross_margin || 0, operating_margin || 0,
        JSON.stringify(body)
      ).run();

      if (error) {
        console.error('Report insert error:', error);
        return createErrorResponse('Failed to create financial report', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Reports API error:', error);
    return createErrorResponse('Internal server error', 500);
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

    if (method === 'GET') {
      const farmId = url.searchParams.get('farm_id');
      const period = url.searchParams.get('period') || '12months';

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Access denied', 403);
      }

      // Get comprehensive financial analytics
      const { results: summary } = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_entries,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as total_investments,
          AVG(CASE WHEN type = 'income' THEN amount ELSE NULL END) as avg_revenue,
          AVG(CASE WHEN type = 'expense' THEN amount ELSE NULL END) as avg_expense
        FROM finance_entries
        WHERE farm_id = ? 
          AND date(entry_date) >= date(?, ?)
      `).bind(
        farmId, 
        new Date().toISOString(), 
        period === '12months' ? '-12 months' : '-6 months'
      ).all();

      // Get monthly breakdown
      const { results: monthly } = await env.DB.prepare(`
        SELECT 
          strftime('%Y-%m', entry_date) as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
          SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net
        FROM finance_entries
        WHERE farm_id = ? 
          AND date(entry_date) >= date(?, ?)
        GROUP BY strftime('%Y-%m', entry_date)
        ORDER BY month DESC
      `).bind(
        farmId,
        new Date().toISOString(),
        period === '12months' ? '-12 months' : '-6 months'
      ).all();

      // Get category breakdown
      const { results: categories } = await env.DB.prepare(`
        SELECT 
          budget_category as category,
          type,
          SUM(amount) as total_amount,
          COUNT(*) as entry_count
        FROM finance_entries
        WHERE farm_id = ? 
          AND date(entry_date) >= date(?, ?)
          AND budget_category IS NOT NULL
        GROUP BY budget_category, type
        ORDER BY total_amount DESC
      `).bind(
        farmId,
        new Date().toISOString(),
        period === '12months' ? '-12 months' : '-6 months'
      ).all();

      const analytics = {
        summary: summary[0] || {},
        monthly_trends: monthly || [],
        category_breakdown: categories || [],
        cash_flow: {
          total_in: summary[0]?.total_revenue || 0,
          total_out: summary[0]?.total_expenses || 0,
          net_flow: (summary[0]?.total_revenue || 0) - (summary[0]?.total_expenses || 0)
        },
        profitability: {
          gross_profit: (summary[0]?.total_revenue || 0) - (summary[0]?.total_expenses || 0),
          profit_margin: summary[0]?.total_revenue > 0 
            ? ((summary[0]?.total_revenue || 0) - (summary[0]?.total_expenses || 0)) / (summary[0]?.total_revenue || 1) * 100
            : 0
        }
      };

      return createSuccessResponse(analytics);

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}