// Supabase client setup
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://pmtuktwdohxbkpphaakz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdHVrdHdkb2h4YmtwcGhhYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyODAxNDQsImV4cCI6MjA1OTg1NjE0NH0.WNQ0I2wCbHJDFGLwLYjMCAo-w82gpMlPq0lfTpRJGL8';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch all points
export async function fetchAllPoints() {
  try {
    console.log('Fetching all points from Supabase...');
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error in fetchAllPoints:', error);
      throw error;
    }
    
    console.log(`Fetched ${data ? data.length : 0} points from Supabase`);
    return data;
  } catch (error) {
    console.error('Error fetching points:', error);
    return [];
  }
}

// Function to fetch points by type
export async function fetchPointsByType(type) {
  try {
    console.log(`Fetching points of type ${type} from Supabase...`);
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error in fetchPointsByType(${type}):`, error);
      throw error;
    }
    
    console.log(`Fetched ${data ? data.length : 0} points of type ${type} from Supabase`);
    return data;
  } catch (error) {
    console.error(`Error fetching points of type ${type}:`, error);
    return [];
  }
}

// Function to fetch points within a bounding box
export async function fetchPointsInBounds(minLat, maxLat, minLng, maxLng) {
  try {
    console.log(`Fetching points in bounds: lat(${minLat} to ${maxLat}), lng(${minLng} to ${maxLng})`);
    
    // First, check the table structure to determine the correct column names
    const { data: sampleData, error: sampleError } = await supabase
      .from('points')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
      throw sampleError;
    }
    
    if (!sampleData || sampleData.length === 0) {
      console.log('No data in the points table');
      return [];
    }
    
    // Determine the correct column names
    const sample = sampleData[0];
    const latColumn = sample.hasOwnProperty('latitude') ? 'latitude' : 
                      sample.hasOwnProperty('lat') ? 'lat' : null;
    const lngColumn = sample.hasOwnProperty('longitude') ? 'longitude' : 
                      sample.hasOwnProperty('lng') ? 'lng' : null;
    
    console.log(`Using column names: ${latColumn} for latitude, ${lngColumn} for longitude`);
    
    if (!latColumn || !lngColumn) {
      console.error('Could not determine latitude and longitude column names');
      return [];
    }
    
    // Now fetch the data with the correct column names
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .gte(latColumn, minLat)
      .lte(latColumn, maxLat)
      .gte(lngColumn, minLng)
      .lte(lngColumn, maxLng)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error in fetchPointsInBounds:', error);
      throw error;
    }
    
    console.log(`Fetched ${data ? data.length : 0} points in bounds from Supabase`);
    return data;
  } catch (error) {
    console.error('Error fetching points in bounds:', error);
    return [];
  }
}

// Function to add a new point
export async function addPoint(pointData) {
  try {
    // Ensure we're not sending submitted_by if it's not a valid UUID
    if (pointData.submitted_by === 'user_id' || !pointData.submitted_by) {
      delete pointData.submitted_by;
    }
    
    const { data, error } = await supabase
      .from('points')
      .insert([pointData])
      .select();
    
    if (error) {
      console.error('Error adding point:', error);
      return { data: null, error };
    }
    
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error adding point:', error);
    return { data: null, error };
  }
}

// Function to update a point
export async function updatePoint(id, updates) {
  try {
    const { data, error } = await supabase
      .from('points')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Error updating point ${id}:`, error);
    throw error;
  }
}

// Function to delete a point
export async function deletePoint(id) {
  try {
    const { error } = await supabase
      .from('points')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting point ${id}:`, error);
    throw error;
  }
}

// Function to fetch points by user
export async function fetchUserPoints(userId) {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching points for user ${userId}:`, error);
    return [];
  }
}

// Function to fetch points by submission status
export async function fetchPointsByStatus(status) {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('submission_status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching points with status ${status}:`, error);
    return [];
  }
}

// Function to search points by title or description
export async function searchPoints(query) {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error searching points with query "${query}":`, error);
    return [];
  }
}

// Function to upload a single image
export async function uploadImage(file, folder = 'point-images') {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('points')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('points')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Function to upload multiple images
export async function uploadImages(files, folder = 'point-images') {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

// Delete images from Supabase storage
async function deleteImages(imageUrls) {
    for (const url of imageUrls) {
        const filePath = url.split('/').pop();
        const { error } = await supabase.storage
            .from('points')
            .remove([`points/${filePath}`]);
            
        if (error) {
            console.error(`Error deleting image: ${error.message}`);
        }
    }
}

// Function to check the table structure
export async function checkTableStructure() {
  try {
    console.log('Checking points table structure...');
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error checking table structure:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log('Table structure:', Object.keys(data[0]));
      return Object.keys(data[0]);
    } else {
      console.log('No data in the points table');
      return [];
    }
  } catch (error) {
    console.error('Error checking table structure:', error);
    return null;
  }
}

// Function to add a test point
export async function addTestPoint() {
  try {
    console.log('Adding test point to Supabase...');
    
    // Create a test point
    const testPoint = {
      title: 'Test Point',
      description: 'This is a test point added for debugging',
      type: 'parent_facility',
      latitude: -37.8136,
      longitude: 144.9631,
      address: 'Melbourne CBD',
      facilities: ['Baby Change', 'Nursing Room'],
      cost: 0,
      age_group: 'All ages',
      contact_info: 'N/A',
      website_url: 'https://example.com',
      start_time: new Date().toISOString().split('T')[0] + 'T09:00:00+10:00',
      end_time: new Date().toISOString().split('T')[0] + 'T17:00:00+10:00',
      submission_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add the test point to the database
    const { data, error } = await supabase
      .from('points')
      .insert([testPoint])
      .select();
    
    if (error) {
      console.error('Error adding test point:', error);
      return { success: false, error };
    }
    
    console.log('Test point added successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error adding test point:', error);
    return { success: false, error };
  }
}

// Export the supabase client for direct use if needed
export { supabase }; 