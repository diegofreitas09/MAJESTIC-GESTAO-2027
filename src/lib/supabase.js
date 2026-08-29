import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase ainda não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify.');
}

// Os dois aplicativos vivem no mesmo domínio, mas precisam manter logins independentes.
// Sem storageKey separado, entrar no Atendimento troca a sessão da Direção (e vice-versa)
// em todas as abas do navegador.
const isEquipe = typeof window !== 'undefined' && /\/equipe(?:\.html)?(?:$|[?#])/.test(window.location.pathname + window.location.search + window.location.hash);
const storageKey = isEquipe ? 'majestic-atendimento-auth-v1' : 'majestic-direcao-auth-v1';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
