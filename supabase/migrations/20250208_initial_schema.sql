-- Create enum types
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
CREATE TYPE period_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE split_type AS ENUM ('equal', 'percentage', 'amount');

-- Enable Row Level Security
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES profiles(id),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE
);

-- Create budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    period period_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(12,2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    merchant TEXT,
    location JSONB,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transaction_shares table
CREATE TABLE transaction_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    split_type split_type NOT NULL,
    amount DECIMAL(12,2),
    percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(transaction_id, user_id)
);

-- Create recurring_transactions table
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type transaction_type NOT NULL,
    period period_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    merchant TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Create savings_goals table
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    deadline DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Add indexes
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transaction_shares_transaction_id ON transaction_shares(transaction_id);
CREATE INDEX idx_transaction_shares_user_id ON transaction_shares(user_id);
CREATE INDEX idx_categories_created_by ON categories(created_by);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);
CREATE INDEX idx_recurring_transactions_created_by ON recurring_transactions(created_by);
CREATE INDEX idx_savings_goals_created_by ON savings_goals(created_by);

-- Add RLS Policies

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut voir les catégories par défaut"
    ON categories FOR SELECT
    USING (is_default = true OR auth.uid() = created_by);
CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = created_by AND NOT is_default);
CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = created_by AND NOT is_default)
    WITH CHECK (auth.uid() = created_by AND NOT is_default);
CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (auth.uid() = created_by AND NOT is_default);

-- Budgets RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own budgets"
    ON budgets FOR SELECT
    USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own budgets"
    ON budgets FOR INSERT
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own budgets"
    ON budgets FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete their own budgets"
    ON budgets FOR DELETE
    USING (auth.uid() = created_by);

-- Transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete their own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = created_by);

-- Transaction Shares RLS
ALTER TABLE transaction_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transactions shared with them"
    ON transaction_shares FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT created_by FROM transactions WHERE id = transaction_id
    ));
CREATE POLICY "Users can share their own transactions"
    ON transaction_shares FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT created_by FROM transactions WHERE id = transaction_id
    ));
CREATE POLICY "Users can update their transaction shares"
    ON transaction_shares FOR UPDATE
    USING (auth.uid() IN (
        SELECT created_by FROM transactions WHERE id = transaction_id
    ));
CREATE POLICY "Users can delete their transaction shares"
    ON transaction_shares FOR DELETE
    USING (auth.uid() IN (
        SELECT created_by FROM transactions WHERE id = transaction_id
    ));

-- Recurring Transactions RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recurring transactions"
    ON recurring_transactions FOR SELECT
    USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own recurring transactions"
    ON recurring_transactions FOR INSERT
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own recurring transactions"
    ON recurring_transactions FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete their own recurring transactions"
    ON recurring_transactions FOR DELETE
    USING (auth.uid() = created_by);

-- Savings Goals RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own savings goals"
    ON savings_goals FOR SELECT
    USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own savings goals"
    ON savings_goals FOR INSERT
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own savings goals"
    ON savings_goals FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete their own savings goals"
    ON savings_goals FOR DELETE
    USING (auth.uid() = created_by);

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_shares_updated_at
    BEFORE UPDATE ON transaction_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, icon, color, is_default) 
VALUES
    -- Dépenses
    ('food', 'utensils', '#FF6B6B', true),
    ('restaurant', 'restaurant', '#FF9F9F', true),
    ('groceries', 'shopping-cart', '#FFB4B4', true),
    ('transport', 'car', '#4ECDC4', true),
    ('parking', 'parking', '#45B7D1', true),
    ('fuel', 'gas-pump', '#3DA3BC', true),
    ('leisure', 'music', '#45B7D1', true),
    ('entertainment', 'film', '#3D9EBC', true),
    ('sports', 'running', '#358AA8', true),
    ('housing', 'home', '#96CEB4', true),
    ('rent', 'key', '#88BFA6', true),
    ('utilities', 'plug', '#7AB098', true),
    ('internet', 'wifi', '#6CA18A', true),
    ('health', 'heart', '#D4A5A5', true),
    ('pharmacy', 'prescription', '#C69797', true),
    ('doctor', 'user-md', '#B88989', true),
    ('shopping', 'shopping-bag', '#9B5DE5', true),
    ('clothes', 'tshirt', '#8D4FD7', true),
    ('electronics', 'laptop', '#7F41C9', true),
    ('pets', 'paw', '#D6B85A', true),
    ('vet', 'clinic-medical', '#C8AA4C', true),
    ('pet-food', 'bone', '#BAA33E', true),
    ('education', 'graduation-cap', '#5B8C5A', true),
    ('books', 'book', '#4D7E4C', true),
    ('subscriptions', 'repeat', '#F76707', true),
    
    -- Revenus
    ('salary', 'briefcase', '#00B4D8', true),
    ('bonus', 'gift', '#00A3C7', true),
    ('transfer-received', 'arrow-down', '#0092B6', true),
    ('investment-return', 'chart-line', '#2EC4B6', true),
    ('rental-income', 'building', '#29B0A3', true),
    ('freelance', 'laptop-code', '#248F90', true),
    ('side-business', 'store', '#1F7E7D', true),
    
    -- Épargne et Investissements
    ('investment', 'trending-up', '#2EC4B6', true),
    ('savings', 'piggy-bank', '#29B0A3', true),
    ('retirement', 'shield', '#248F90', true),
    ('emergency-fund', 'life-ring', '#1F7E7D', true),
    
    -- Autres
    ('gifts-given', 'gift', '#E63946', true),
    ('donations', 'hand-holding-heart', '#D62839', true),
    ('taxes', 'file-invoice-dollar', '#C6172B', true),
    ('insurance', 'umbrella', '#B5061D', true),
    ('other', 'more-horizontal', '#6C757D', true);
