import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase ainda não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de deploy.');
}

// Os dois aplicativos vivem no mesmo domínio, mas precisam manter logins independentes.
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
      // O projeto usa login por e-mail/senha, não OAuth/magic-link. Evita processar tokens
      // acidentalmente presentes na URL e reduz exposição de credenciais em histórico/referrer.
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
