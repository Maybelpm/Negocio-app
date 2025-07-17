
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ¡IMPORTANTE!
// Reemplaza los siguientes valores con los de tu propio proyecto de Supabase.
// Los encontrarás en tu dashboard de Supabase > Project Settings > API.
const supabaseUrl = 'https://pjwfqphgvwokfvgxunqj.supabase.co'; // <-- Pega tu URL aquí
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd2ZxcGhndndva2Z2Z3h1bnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzgyMDcsImV4cCI6MjA2ODM1NDIwN30.kbr0W42GZukyQHlr4TsN2RzifwG97NptA8rfq2FoIRg'; // <-- Pega tu clave 'anon' aquí

export const supabase = createClient(supabaseUrl, supabaseKey);
