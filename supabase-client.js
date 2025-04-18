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
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching points:', error);
    return [];
  }
}

// Function to fetch points by type
export async function fetchPointsByType(type) {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching points of type ${type}:`, error);
    return [];
  }
}

// Function to fetch points within a bounding box
export async function fetchPointsInBounds(minLat, maxLat, minLng, maxLng) {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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

// Export the supabase client for direct use if needed
export { supabase }; 