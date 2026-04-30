'use server'

import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

export async function createBoothAdmin(email: string, password: string, boothId: string) {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      role: 'booth_admin',
      booth_id: boothId,
    });

    if (profileError) throw profileError;

    const { error: boothUpdateError } = await supabaseAdmin
      .from('booths')
      .update({ owner_id: authData.user.id })
      .eq('id', boothId);
      
    if (boothUpdateError) throw boothUpdateError;

    return { success: true, user: authData.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBoothInfo(boothId: string, updates: { name?: string, description?: string, photo_url?: string, status?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('booths')
      .update(updates)
      .eq('id', boothId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
