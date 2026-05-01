import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined' && supabaseUrl && !supabaseAnonKey) {
  console.error("Supabase URL exists but ANON KEY is missing. Check .env.local!");
}

// We use the anon key on the client for public queries.
// 1000명 동시 접속 시 Realtime 이벤트 폭주를 보호하기 위해
// eventsPerSecond 를 낮게 잡고, persistSession 은 비활성화하여
// 불필요한 토큰 갱신/스토리지 I/O 를 줄인다. (게스트 대기표는 익명 사용)
export const supabaseClient = supabaseUrl.startsWith('http') && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    })
  : null;
