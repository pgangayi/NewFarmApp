export interface FinanceEntry {
  id: number;
  farm_id: number;
  entry_date: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  currency: string;
  account?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  project_id?: string;
  department?: string;
  tax_category?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'paid';
  receipt_number?: string;
  recurring_pattern?: string;
  budget_category?: string;
  tax_deductible: boolean;
  bank_account?: string;
  farm_name?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface BudgetCategory {
  id: number;
  farm_id: number;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
  remaining_budget: number;
  fiscal_year: number;
  description?: string;
  parent_category_id?: number;
  farm_name?: string;
  parent_category_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface FinancialReport {
  id: number;
  farm_id: number;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  report_period: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  gross_margin: number;
  operating_margin: number;
  cash_flow: number;
  report_data?: string;
  generated_at: string;
}

export interface FinanceFormData {
  farm_id: number;
  entry_date: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  currency?: string;
  account?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  project_id?: string;
  department?: string;
  tax_category?: string;
  approval_status?: string;
  receipt_number?: string;
  recurring_pattern?: string;
  budget_category?: string;
  tax_deductible?: boolean;
  bank_account?: string;
}
