-- Fix RLS Policies for Usuarios table
-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Qualquer pessoa pode ver lista de usuários" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can read usuarios" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can insert usuarios" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can update usuarios" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can delete usuarios" ON usuarios;

-- Create new policies
-- Allow authenticated users to view all users
CREATE POLICY "Authenticated users can read usuarios" ON usuarios
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to manage users (insert/update/delete)
-- This assumes all authenticated users can manage users. 
-- You might want to restrict this to 'Administrador' or 'Gestor' based on your logic later.
CREATE POLICY "Authenticated users can insert usuarios" ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update usuarios" ON usuarios
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete usuarios" ON usuarios
FOR DELETE
TO authenticated
USING (true);
