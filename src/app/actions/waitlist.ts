'use server'

import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'


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

export async function registerWaitlist(boothId: string, name: string, count: number) {
  try {
    if (!supabaseAdmin) {
      // Demo fallback if supabase is not initialized
      const currentNumber = dummyCounter++;
      return { 
        success: true, 
        data: { id: `demo-id-${Date.now()}`, waiting_number: currentNumber } 
      };
    }

    // Call the Postgres RPC function which handles table locks and safe insertion
    const { data, error } = await supabaseAdmin.rpc('register_waitlist_v2', {
      p_booth_id: boothId,
      p_name: name,
      p_count: count
    });

    if (error) {
      // If RPC doesn't exist yet, fallback to original logic for backwards compatibility
      if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
        console.warn('RPC not found, falling back to JS-based insertion.');
        return await registerWaitlistFallback(boothId, name, count);
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Original unsafe logic as fallback just in case SQL is not run yet
async function registerWaitlistFallback(boothId: string, name: string, count: number) {
  const { data: maxData } = await supabaseAdmin!
    .from('waiting_list')
    .select('waiting_number')
    .eq('booth_id', boothId)
    .order('waiting_number', { ascending: false })
    .limit(1);

  const nextNumber = maxData && maxData.length > 0 ? maxData[0].waiting_number + 1 : 1;

  const { data, error } = await supabaseAdmin!.from('waiting_list').insert({
    booth_id: boothId,
    name,
    count,
    waiting_number: nextNumber,
    status: 'waiting'
  }).select().single();

  if (error) throw error;
  return { success: true, data };
}

export async function callWaitlist(id: string, boothId: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    // Get the current item to check its waiting_number
    const { data: targetItem, error: fetchError } = await supabaseAdmin
      .from('waiting_list')
      .select('waiting_number')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update the item to 'calling'
    const { data, error } = await supabaseAdmin
      .from('waiting_list')
      .update({ status: 'calling' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update booth's current_number to match the called user
    const { error: boothError } = await supabaseAdmin
      .from('booths')
      .update({ current_number: targetItem.waiting_number })
      .eq('id', boothId);

    if (boothError) throw boothError;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeWaitlist(id: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    const { data, error } = await supabaseAdmin
      .from('waiting_list')
      .update({ status: 'done' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
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
    // This will hit the Vercel cache and only query DB once every 3 seconds max
    const data = await getCachedBoothData(boothId);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
