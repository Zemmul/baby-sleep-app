// Script to apply RLS policies to the Supabase database
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://pmtuktwdohxbkpphaakz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdHVrdHdkb2h4YmtwcGhhYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyODAxNDQsImV4cCI6MjA1OTg1NjE0NH0.WNQ0I2wCbHJDFGLwLYjMCAo-w82gpMlPq0lfTpRJGL8';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to apply RLS policies
async function applyRLSPolicies() {
  try {
    // Enable RLS on the points table
    const { error: enableError } = await supabase.rpc('enable_rls_on_points');
    if (enableError) {
      console.error('Error enabling RLS:', enableError);
      return;
    }
    console.log('RLS enabled on points table');

    // Drop existing policies
    const { error: dropError } = await supabase.rpc('drop_existing_policies');
    if (dropError) {
      console.error('Error dropping existing policies:', dropError);
      return;
    }
    console.log('Existing policies dropped');

    // Create new policies
    const { error: createError } = await supabase.rpc('create_rls_policies');
    if (createError) {
      console.error('Error creating policies:', createError);
      return;
    }
    console.log('New policies created successfully');
    
    console.log('RLS policies applied successfully');
  } catch (error) {
    console.error('Error applying RLS policies:', error);
  }
}

// Run the function
applyRLSPolicies(); 