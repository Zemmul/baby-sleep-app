-- Create a table for points on the map
CREATE TABLE points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('toilet', 'parent_facility', 'event', 'park', 'playground')),
  title TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  facilities TEXT[],
  images TEXT[],
  cost DECIMAL(10, 2),
  age_group TEXT,
  contact_info TEXT,
  website_url TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  submission_status TEXT NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected')),
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the type field for faster filtering
CREATE INDEX idx_points_type ON points(type);

-- Create an index on the location for faster spatial queries
CREATE INDEX idx_points_location ON points(latitude, longitude);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_points_updated_at
BEFORE UPDATE ON points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE points ENABLE ROW LEVEL SECURITY;

-- Policy for reading points (anyone can read)
CREATE POLICY "Anyone can read points" 
ON points FOR SELECT 
USING (true);

-- Policy for inserting points (authenticated users can insert)
CREATE POLICY "Authenticated users can insert points" 
ON points FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy for updating points (users can only update their own submissions)
CREATE POLICY "Users can update their own points" 
ON points FOR UPDATE 
TO authenticated 
USING (submitted_by = auth.uid())
WITH CHECK (submitted_by = auth.uid());

-- Policy for deleting points (users can only delete their own submissions)
CREATE POLICY "Users can delete their own points" 
ON points FOR DELETE 
TO authenticated 
USING (submitted_by = auth.uid()); 