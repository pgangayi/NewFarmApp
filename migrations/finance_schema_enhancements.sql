-- Farm Management System - Finance Module Schema Enhancements
-- Phase 1: Foundation & Core Features
-- Date: October 31, 2025

-- Enhanced finance entries with enterprise features
ALTER TABLE finance_entries ADD COLUMN project_id TEXT;
ALTER TABLE finance_entries ADD COLUMN department TEXT;
ALTER TABLE finance_entries ADD COLUMN tax_category TEXT;
ALTER TABLE finance_entries ADD COLUMN approval_status TEXT;
ALTER TABLE finance_entries ADD COLUMN receipt_number TEXT;
ALTER TABLE finance_entries ADD COLUMN recurring_pattern TEXT;
ALTER TABLE finance_entries ADD COLUMN budget_category TEXT;
ALTER TABLE finance_entries ADD COLUMN actual_vs_budgeted REAL;
ALTER TABLE finance_entries ADD COLUMN tax_deductible BOOLEAN DEFAULT 0;
ALTER TABLE finance_entries ADD COLUMN bank_account TEXT;

-- Supporting tables for comprehensive financial management

-- Budget categories and tracking
CREATE TABLE IF NOT EXISTS budget_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    budgeted_amount REAL NOT NULL,
    spent_amount REAL DEFAULT 0,
    remaining_budget REAL,
    fiscal_year INTEGER NOT NULL,
    description TEXT,
    parent_category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
);

-- Financial reports and analytics
CREATE TABLE IF NOT EXISTS financial_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    report_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual', 'custom'
    report_period TEXT NOT NULL, -- '2025-01', '2025-Q1', '2025'
    total_revenue REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    net_profit REAL DEFAULT 0,
    gross_margin REAL DEFAULT 0,
    operating_margin REAL DEFAULT 0,
    cash_flow REAL DEFAULT 0,
    report_data TEXT, -- JSON string with detailed data
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Invoice and payment tracking
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    balance_amount REAL,
    status TEXT NOT NULL, -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    client_name TEXT NOT NULL,
    client_address TEXT,
    description TEXT,
    payment_terms TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    item_description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Bank accounts and cash management
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- 'checking', 'savings', 'loan', 'credit'
    bank_name TEXT,
    account_number TEXT,
    routing_number TEXT,
    current_balance REAL DEFAULT 0,
    available_balance REAL DEFAULT 0,
    credit_limit REAL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    bank_account_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'transfer', 'payment'
    amount REAL NOT NULL,
    description TEXT,
    reference_number TEXT,
    category TEXT,
    reconciled BOOLEAN DEFAULT 0,
    reconciliation_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

-- Tax records and documentation
CREATE TABLE IF NOT EXISTS tax_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    tax_year INTEGER NOT NULL,
    record_type TEXT NOT NULL, -- 'expense', 'receipt', 'depreciation', 'deduction'
    record_date DATE NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    tax_category TEXT,
    document_path TEXT,
    verified BOOLEAN DEFAULT 0,
    verified_by TEXT,
    verified_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Investment and asset tracking
CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    investment_type TEXT NOT NULL, -- 'equipment', 'land', 'livestock', 'crop', 'research'
    investment_name TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_amount REAL NOT NULL,
    current_value REAL,
    depreciation_method TEXT, -- 'straight_line', 'declining_balance', 'units_of_production'
    depreciation_rate REAL,
    accumulated_depreciation REAL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Performance indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm_date ON finance_entries(farm_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_finance_entries_type ON finance_entries(type);
CREATE INDEX IF NOT EXISTS idx_finance_entries_category ON finance_entries(budget_category);
CREATE INDEX IF NOT EXISTS idx_budget_categories_farm_year ON budget_categories(farm_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_categories_parent ON budget_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_farm_period ON financial_reports(farm_id, report_period);
CREATE INDEX IF NOT EXISTS idx_invoices_farm_status ON invoices(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_farm ON bank_accounts(farm_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tax_records_farm_year ON tax_records(farm_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_records_type ON tax_records(record_type);
CREATE INDEX IF NOT EXISTS idx_investments_farm ON investments(farm_id);

-- Financial calculation views (handled by APIs for D1)
-- Note: Complex financial calculations are performed in the API layer

-- Business rule validation (application level for D1)
-- - Invoice number uniqueness within farm
-- - Balance calculation validation
-- - Budget vs actual validation
-- - Tax rate validation
-- - Investment depreciation calculations
-- - Bank account balance consistency

-- Pre-populate common budget categories
INSERT OR IGNORE INTO budget_categories (farm_id, category_name, budgeted_amount, fiscal_year, description) VALUES
(1, 'Animal Feed', 25000, 2025, 'Livestock feed and supplements'),
(1, 'Veterinary Expenses', 8000, 2025, 'Animal health and veterinary care'),
(1, 'Seeds and Plants', 15000, 2025, 'Crop planting materials'),
(1, 'Fertilizers', 12000, 2025, 'Soil nutrition and fertilization'),
(1, 'Equipment Maintenance', 10000, 2025, 'Equipment repair and maintenance'),
(1, 'Labor Costs', 35000, 2025, 'Employee wages and benefits'),
(1, 'Utilities', 6000, 2025, 'Electricity, water, fuel'),
(1, 'Insurance', 4000, 2025, 'Property and liability insurance'),
(1, 'Transportation', 5000, 2025, 'Fuel and vehicle costs'),
(1, 'Marketing', 3000, 2025, 'Advertising and sales expenses');

-- Integration points with other modules
-- - Link with animals for production revenue
-- - Link with crops for harvest sales
-- - Link with inventory for purchase tracking
-- - Link with tasks for labor cost allocation
-- - Link with weather for seasonal revenue planning

-- Sample bank accounts for farms
INSERT OR IGNORE INTO bank_accounts (farm_id, account_name, account_type, bank_name, current_balance) VALUES
(1, 'Farm Operating Account', 'checking', 'First National Bank', 15000.00),
(1, 'Farm Savings', 'savings', 'First National Bank', 25000.00),
(1, 'Equipment Loan', 'loan', 'Farm Credit Bank', -45000.00);

-- Sample tax records for the year
INSERT OR IGNORE INTO tax_records (farm_id, tax_year, record_type, record_date, amount, description, tax_category) VALUES
(1, 2025, 'expense', '2025-01-15', 2500.00, 'Feed purchase', 'animal_feed'),
(1, 2025, 'expense', '2025-01-20', 800.00, 'Veterinary services', 'veterinary'),
(1, 2025, 'receipt', '2025-01-25', 5200.00, 'Milk sales revenue', 'agricultural_income');

-- Sample investments
INSERT OR IGNORE INTO investments (farm_id, investment_type, investment_name, purchase_date, purchase_amount, depreciation_method, depreciation_rate) VALUES
(1, 'equipment', 'Tractor John Deere 5075E', '2024-03-15', 35000.00, 'straight_line', 0.15),
(1, 'livestock', 'Dairy Cattle Herd', '2024-01-10', 25000.00, 'declining_balance', 0.10),
(1, 'equipment', 'Milking Equipment', '2024-05-20', 18000.00, 'straight_line', 0.12);