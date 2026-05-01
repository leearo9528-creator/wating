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

export async function createBoothAdmin(email: string, password: string, boothId: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

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
    return { success: false as const, data: null, error: error.message };
  }
}

export async function updateBoothInfo(boothId: string, updates: { name?: string, description?: string, photo_url?: string, status?: string, current_number?: number, close_at?: string | null, max_capacity?: number | null }) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    const { data, error } = await supabaseAdmin
      .from('booths')
      .update(updates)
      .eq('id', boothId)
      .select()
      .single();

    if (error) throw error;

    // 번호 진행 시 대기자 상태도 함께 업데이트 (Realtime 트리거용)
    if (updates.current_number !== undefined) {
      const num = updates.current_number;

      // 현재 번호보다 앞 = 완료 처리
      await supabaseAdmin
        .from('waiting_list')
        .update({ status: 'done' })
        .eq('booth_id', boothId)
        .lt('waiting_number', num)
        .in('status', ['waiting', 'calling']);

      // 현재 번호 = 호출 중
      await supabaseAdmin
        .from('waiting_list')
        .update({ status: 'calling' })
        .eq('booth_id', boothId)
        .eq('waiting_number', num)
        .eq('status', 'waiting');
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function createBooth(name: string, description: string, photo_url: string, super_owner_id: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    // 1. Create the booth first
    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .insert({
        name,
        description,
        photo_url,
        owner_id: super_owner_id, // temporarily super admin
        status: 'closed'
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Generate Booth Admin Account
    const shortId = booth.id.split('-')[0];
    const loginId = `booth_${shortId}`;
    const password = `123456`;
    const email = `${loginId}@flit.admin`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 3. Create Profile
    await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      role: 'booth_admin',
      booth_id: booth.id,
    });

    // 4. Update booth with credentials and new owner
    const { data: finalBooth, error: updateError } = await supabaseAdmin
      .from('booths')
      .update({
        owner_id: authData.user.id,
        admin_login_id: loginId,
        admin_login_pw: password
      })
      .eq('id', booth.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return { success: true, data: finalBooth };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function getBoothSettings(boothId: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    const { data, error } = await supabaseAdmin
      .from('booths')
      .select('*')
      .eq('id', boothId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function createBoothsBulk(names: string[], super_owner_id: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    const inserts = names.map(name => ({
      name,
      owner_id: super_owner_id,
      status: 'closed'
    }));

    // 1. Insert booths
    const { data: booths, error } = await supabaseAdmin
      .from('booths')
      .insert(inserts)
      .select();

    if (error) throw error;

    // 2. Generate accounts for each booth
    for (const booth of booths) {
      const shortId = booth.id.split('-')[0];
      const loginId = `booth_${shortId}`;
      const password = `123456`;
      const email = `${loginId}@flit.admin`;

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (!authError && authData.user) {
        await supabaseAdmin.from('profiles').insert({
          id: authData.user.id,
          role: 'booth_admin',
          booth_id: booth.id,
        });

        await supabaseAdmin
          .from('booths')
          .update({
            owner_id: authData.user.id,
            admin_login_id: loginId,
            admin_login_pw: password
          })
          .eq('id', booth.id);
      }
    }

    return { success: true, data: booths };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function uploadBoothPhoto(boothId: string, formData: FormData) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');
    
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');

    const fileExt = file.name.split('.').pop();
    const fileName = `${boothId}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseAdmin
      .storage
      .from('booths')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('booths')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function deleteBooth(boothId: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    // 1. Get the booth's owner_id and admin auth user to clean up
    const { data: booth } = await supabaseAdmin
      .from('booths')
      .select('owner_id')
      .eq('id', boothId)
      .single();

    // 2. Delete the booth (waiting_list will be cascaded via FK)
    const { error: deleteError } = await supabaseAdmin
      .from('booths')
      .delete()
      .eq('id', boothId);

    if (deleteError) throw deleteError;

    // 3. Clean up: delete the associated profile and auth user if they exist
    if (booth?.owner_id) {
      await supabaseAdmin.from('profiles').delete().eq('id', booth.owner_id);
      await supabaseAdmin.auth.admin.deleteUser(booth.owner_id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}

export async function generateBoothAdmin(boothId: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase client is not initialized');

    // Check if already has credentials
    const { data: existing } = await supabaseAdmin
      .from('booths')
      .select('admin_login_id')
      .eq('id', boothId)
      .single();

    if (existing?.admin_login_id) {
      return { success: false as const, data: null, error: '이미 스태프 계정이 존재합니다.' };
    }

    const shortId = boothId.split('-')[0];
    const loginId = `booth_${shortId}`;
    const password = '123456';
    const email = `${loginId}@flit.admin`;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create profile
    await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      role: 'booth_admin',
      booth_id: boothId,
    });

    // Update booth with credentials and owner
    await supabaseAdmin
      .from('booths')
      .update({
        owner_id: authData.user.id,
        admin_login_id: loginId,
        admin_login_pw: password,
      })
      .eq('id', boothId);

    return { success: true, data: { loginId, password } };
  } catch (error: any) {
    return { success: false as const, data: null, error: error.message };
  }
}
