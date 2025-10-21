import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jntdxdlqultjevklkfls.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudGR4ZGxxdWx0amV2a2xrZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0ODQxNjksImV4cCI6MjAzNzA2MDE2OX0.J8YnO6_s3QzVbN3tS_3A_L0E7iFz_i5A9x0E6iHkEaQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);