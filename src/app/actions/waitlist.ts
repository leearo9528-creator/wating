'use server'

import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

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
      .select('name, description, current_number, status, photo_url')
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
    return { success: true, data };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}
