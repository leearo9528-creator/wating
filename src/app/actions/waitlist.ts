'use server'

import { createClient } from '@supabase/supabase-js'
import { unstable_cache, revalidateTag } from 'next/cache'

type RegisterResult =
  | { success: true; data: { id: string; waiting_number: number } }
  | { success: false; data: null; error: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl.startsWith('http') && supabaseKey ? createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
) : null;

let dummyCounter = 1;

// 현재 KST 기준 분(minute) 반환
function kstMinutes(): number {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.getUTCHours() * 60 + kst.getUTCMinutes();
}

// 등록 후 인원 초과 여부 확인 → 자동 마감
async function checkCapacityAutoClose(boothId: string) {
  if (!supabaseAdmin) return;

  const { data: booth } = await supabaseAdmin
    .from('booths')
    .select('status, max_capacity')
    .eq('id', boothId)
    .single();

  if (!booth || booth.status !== 'open' || !booth.max_capacity) return;

  const { count } = await supabaseAdmin
    .from('waiting_list')
    .select('*', { count: 'exact', head: true })
    .eq('booth_id', boothId)
    .neq('status', 'cancelled');

  if ((count ?? 0) >= booth.max_capacity) {
    await supabaseAdmin.from('booths').update({ status: 'paused' }).eq('id', boothId);
    revalidateTag('booth', 'max');
  }
}

export async function registerWaitlist(boothId: string, name: string, count: number): Promise<RegisterResult> {
  try {
    if (!supabaseAdmin) {
      const currentNumber = dummyCounter++;
      return {
        success: true as const,
        data: { id: `demo-id-${Date.now()}`, waiting_number: currentNumber }
      };
    }

    const { data, error } = await supabaseAdmin.rpc('register_waitlist_v2', {
      p_booth_id: boothId,
      p_name: name,
      p_count: count
    });

    if (error) throw error;

    // 등록 성공 후 인원 초과 체크 (비동기, 응답 블로킹 없음)
    checkCapacityAutoClose(boothId).catch(() => {});

    return { success: true as const, data: data as { id: string; waiting_number: number } };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function cancelWaitlist(id: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    const { data, error } = await supabaseAdmin
      .from('waiting_list')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

const getCachedBoothData = unstable_cache(
  async (boothId: string) => {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabaseAdmin
      .from('booths')
      .select('name, description, current_number, status, photo_url, close_at, max_capacity')
      .eq('id', boothId)
      .single();
    if (error) throw error;
    return data;
  },
  ['booth-info'],
  { revalidate: 3, tags: ['booth'] }
);

export async function getBoothInfo(boothId: string) {
  try {
    const data = await getCachedBoothData(boothId);

    // 시간 자동 마감 체크 (캐시 데이터 기반 산술 연산, 추가 DB 읽기 없음)
    if (data.status === 'open' && data.close_at) {
      const [h, m] = (data.close_at as string).split(':').map(Number);
      if (kstMinutes() >= h * 60 + m) {
        // 비동기 DB 업데이트 (응답 블로킹 없음)
        supabaseAdmin?.from('booths').update({ status: 'paused' }).eq('id', boothId);
        revalidateTag('booth', 'max');
        return { success: true, data: { ...data, status: 'paused' } };
      }
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function getWaitlistStatus(boothId: string, myWaitingNumber: number) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    // 내 앞에 대기 중이거나 호출 중인 사람의 정확한 수를 계산
    const { count, error } = await supabaseAdmin
      .from('waiting_list')
      .select('*', { count: 'exact', head: true })
      .eq('booth_id', boothId)
      .in('status', ['waiting', 'calling'])
      .lt('waiting_number', myWaitingNumber);

    if (error) throw error;
    
    return { success: true, peopleAhead: count || 0 };
  } catch (error: any) {
    return { success: false as const, peopleAhead: 0 };
  }
}

// 짧은 ID(UUID 앞부분)로 전체 부스 ID를 조회
export async function resolveBoothId(shortId: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  // 이미 완전한 UUID면 그대로 반환
  if (shortId.includes('-') && shortId.length > 20) return shortId;
  
  const { data } = await supabaseAdmin
    .from('booths')
    .select('id')
    .ilike('id', `${shortId}%`)
    .limit(1)
    .single();

  return data?.id || null;
}
