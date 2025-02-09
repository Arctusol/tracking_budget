-- Ajout du type de catégorie
ALTER TABLE categories ADD COLUMN type transaction_type NOT NULL DEFAULT 'expense';

-- Création de la table des groupes
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Table de liaison entre groupes et membres
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Ajout d'une référence de groupe optionnelle aux transactions
ALTER TABLE transactions ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Index pour les nouvelles tables
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_categories_type ON categories(type);

-- RLS pour les groupes
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of"
    ON groups FOR SELECT
    USING (
        auth.uid() = created_by 
        OR 
        auth.uid() IN (
            SELECT user_id FROM group_members WHERE group_id = groups.id
        )
    );

CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update their groups"
    ON groups FOR UPDATE
    USING (
        auth.uid() = created_by 
        OR 
        auth.uid() IN (
            SELECT user_id 
            FROM group_members 
            WHERE group_id = groups.id AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = created_by 
        OR 
        auth.uid() IN (
            SELECT user_id 
            FROM group_members 
            WHERE group_id = groups.id AND role = 'admin'
        )
    );

CREATE POLICY "Group admins can delete their groups"
    ON groups FOR DELETE
    USING (
        auth.uid() = created_by 
        OR 
        auth.uid() IN (
            SELECT user_id 
            FROM group_members 
            WHERE group_id = groups.id AND role = 'admin'
        )
    );

-- RLS pour les membres des groupes
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members of their groups"
    ON group_members FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM group_members WHERE group_id = group_members.group_id
        )
        OR
        auth.uid() IN (
            SELECT created_by FROM groups WHERE id = group_members.group_id
        )
    );

CREATE POLICY "Group admins can manage members"
    ON group_members FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM group_members 
            WHERE group_id = group_members.group_id AND role = 'admin'
        )
        OR
        auth.uid() IN (
            SELECT created_by FROM groups WHERE id = group_members.group_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM group_members 
            WHERE group_id = group_members.group_id AND role = 'admin'
        )
        OR
        auth.uid() IN (
            SELECT created_by FROM groups WHERE id = group_members.group_id
        )
    );

-- Mise à jour des politiques de transactions pour inclure les groupes
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own and group transactions"
    ON transactions FOR SELECT
    USING (
        auth.uid() = created_by
        OR
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );
