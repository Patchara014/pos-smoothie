/* ===== Supabase Client ===== */
const SUPABASE_URL = 'https://krgfjysvxspiiywrkihs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2ZqeXN2eHNwaWl5d3JraWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjY5MDksImV4cCI6MjA4NzYwMjkwOX0.o2ETbJn6bOI5svHyVe-AWtU_3nWFGz4VU9CwuWUh520';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
