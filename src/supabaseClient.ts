import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sonclubhpzygnocwbsyg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbmNsdWJocHp5Z25vY3dic3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDY4NjIsImV4cCI6MjA4ODg4Mjg2Mn0.p8sMgSzcmrTSOdE4HyqEFE7fbroio6NnI0zjO2zz8ho';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
