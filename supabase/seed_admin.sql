DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- 1. auth.users 테이블에 유저 생성 (비밀번호는 pgcrypto를 사용해 해싱)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'leearo@flit.admin',
    crypt('1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. identities 테이블 데이터 추가 (Supabase 최신버전 필수: provider_id 추가)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(), -- identity의 고유 ID
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, 'leearo@flit.admin')::jsonb,
    'email',
    new_user_id::text, -- provider_id (이메일의 경우 보통 user_id 문자열을 씀)
    now(),
    now(),
    now()
  );

  -- 3. public.profiles 테이블에 최고 관리자(super_admin)로 권한 부여
  INSERT INTO public.profiles (
    id,
    role
  ) VALUES (
    new_user_id,
    'super_admin'
  );
END $$;
