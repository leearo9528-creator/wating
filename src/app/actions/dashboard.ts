'use server'

import { createClient } from '@supabase/supabase-js'

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

export async function fetchAdminBooths(userRole: string, userId: string, boothId?: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    let query = supabaseAdmin.from('booths').select('*').order('created_at', { ascending: false });

    if (userRole !== 'super_admin') {
      if (boothId) {
        query = query.eq('id', boothId);
      } else {
        query = query.eq('owner_id', userId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}
