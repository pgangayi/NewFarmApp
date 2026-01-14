export interface FinanceEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  farm_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  category: string;
  budget_limit: number;
  spent: number;
  fiscal_year: number;
  farm_id: string;
}

export interface FinanceFormData {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  farm_id: string;
  status?: 'pending' | 'completed';
}

export interface FinancialReport {
  id: string;
  title: string;
  generated_date: string;
  url: string;
  type: 'monthly' | 'annual' | 'custom';
}
