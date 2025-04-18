-- Function to enable RLS on the points table
CREATE OR REPLACE FUNCTION enable_rls_on_points()
RETURNS void AS $$
BEGIN
  ALTER TABLE points ENABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to drop existing policies
CREATE OR REPLACE FUNCTION drop_existing_policies()
RETURNS void AS $$
BEGIN
  DROP POLICY IF EXISTS "Allow anonymous read access" ON points;
  DROP POLICY IF EXISTS "Allow anonymous insert" ON points;
  DROP POLICY IF EXISTS "Allow authenticated users to update their own points" ON points;
  DROP POLICY IF EXISTS "Allow authenticated users to delete their own points" ON points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new policies
CREATE OR REPLACE FUNCTION create_rls_policies()
RETURNS void AS $$
BEGIN
  -- Create policy for anonymous read access
  CREATE POLICY "Allow anonymous read access" 
  ON points FOR SELECT 
  USING (true);

  -- Create policy for anonymous insert
  CREATE POLICY "Allow anonymous insert" 
  ON points FOR INSERT 
  WITH CHECK (true);

  -- Create policy for authenticated users to update their own points
  CREATE POLICY "Allow authenticated users to update their own points" 
  ON points FOR UPDATE 
  USING (auth.uid() = submitted_by)
  WITH CHECK (auth.uid() = submitted_by);

  -- Create policy for authenticated users to delete their own points
  CREATE POLICY "Allow authenticated users to delete their own points" 
  ON points FOR DELETE 
  USING (auth.uid() = submitted_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 