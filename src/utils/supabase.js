import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;

// Só cria o cliente se as variáveis estiverem configuradas
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'undefined' && SUPABASE_ANON_KEY !== 'undefined') {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('â\u009c\u0085 Cliente Supabase inicializado');
  } catch (error) {
    console.error('â\u009d\u0082 Erro ao criar cliente Supabase:', error);
  }
} else {
  console.log('ð\u009f\u0093\u0081 Supabase não configurado, usando apenas localStorage');
}

export const supabase = supabaseClient;
