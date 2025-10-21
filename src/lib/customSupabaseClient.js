import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzqkekerxondjuxggrvu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cWtla2VyeG9uZGp1eGdncnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzMyNzgsImV4cCI6MjA3NTY0OTI3OH0.tgUciGriy989nm8ORSPJeFxnnj_vjfX0vuRzAfA7z2c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);