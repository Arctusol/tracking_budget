-- Insertion des catégories par défaut
INSERT INTO categories (name, description, icon, color, is_default) VALUES
  ('Alimentation', 'Courses et restaurants', '🍽️', '#4CAF50', true),
  ('Transport', 'Transport en commun et carburant', '🚗', '#2196F3', true),
  ('Logement', 'Loyer et charges', '🏠', '#9C27B0', true),
  ('Loisirs', 'Sorties et divertissements', '🎮', '#FF9800', true),
  ('Santé', 'Frais médicaux et pharmacie', '🏥', '#F44336', true),
  ('Shopping', 'Vêtements et accessoires', '🛍️', '#E91E63', true),
  ('Services', 'Abonnements et services', '📱', '#3F51B5', true),
  ('Revenus', 'Salaires et autres revenus', '💰', '#4CAF50', true),
  ('Transferts', 'Virements entre comptes', '🔄', '#607D8B', true),
  ('Autres', 'Dépenses diverses', '📦', '#9E9E9E', true)
ON CONFLICT (name) DO NOTHING;

-- Ajout d'un index sur le champ merchant pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);

-- Ajout d'un index sur le champ date pour optimiser les filtres par date
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Ajout d'un index sur le type de transaction
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Mise à jour de la politique RLS pour les transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
