import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined' && supabaseUrl && !supabaseAnonKey) {
  console.error("Supabase URL exists but ANON KEY is missing. Check .env.local!");
}

// We use the anon key on the client for public queries.
// 1000명 동시 접속 시 Realtime 이벤트 폭주를 막기 위해 eventsPerSecond 를 낮춘다.
// auth 세션은 그대로 유지해야 관리자 로그인 상태가 보존됨.
export const supabaseClient = supabaseUrl.startsWith('http') && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    })
  : null;
