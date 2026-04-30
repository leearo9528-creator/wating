-- 1. UUID 확장을 위한 pgcrypto 활성화 (기본적으로 켜져있음)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. profiles 테이블 생성
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role TEXT CHECK (role IN ('super_admin', 'booth_admin')) NOT NULL DEFAULT 'booth_admin',
    booth_id UUID, -- booths 테이블 참조는 나중에 추가 (순환 참조 방지)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. booths 테이블 생성
CREATE TABLE booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    current_number INTEGER DEFAULT 0 NOT NULL,
    status TEXT CHECK (status IN ('open', 'paused', 'closed')) DEFAULT 'closed' NOT NULL,
    owner_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- profiles 테이블에 booths 외래키 제약조건 추가
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_booth 
FOREIGN KEY (booth_id) REFERENCES booths(id) ON DELETE SET NULL;

-- 4. waiting_list 테이블 생성
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    count INTEGER NOT NULL CHECK (count > 0),
    waiting_number INTEGER NOT NULL,
    status TEXT CHECK (status IN ('waiting', 'calling', 'done', 'cancelled')) DEFAULT 'waiting' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 (Policies)

-- Profiles: 누구나 읽을 수 있지만, 수정/생성은 Super Admin만 가능하도록 기본 설정
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Super admins can insert/update profiles." ON profiles FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Booths: 
-- 1) 모두가 부스 정보를 볼 수 있음 (방문자)
CREATE POLICY "Booths are viewable by everyone." ON booths FOR SELECT USING (true);
-- 2) 부스 관리자는 자신의 부스만 업데이트 가능
CREATE POLICY "Booth admins can update their own booth." ON booths FOR UPDATE USING (
    owner_id = auth.uid()
);
-- 3) Super Admin은 모든 권한
CREATE POLICY "Super admins can manage all booths." ON booths FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Waiting List:
-- 1) 모두가 대기열을 생성(Insert)하고 볼(Select) 수 있음 (방문자 등록 및 상태 확인용)
CREATE POLICY "Anyone can insert waiting list." ON waiting_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view waiting list." ON waiting_list FOR SELECT USING (true);
-- 2) 부스 관리자는 자신의 부스에 속한 대기열만 업데이트(상태 변경 등) 가능
CREATE POLICY "Booth admins can update their booth's waiting list." ON waiting_list FOR UPDATE USING (
    booth_id IN (SELECT booth_id FROM profiles WHERE id = auth.uid())
);

-- 7. Realtime 활성화 (Broadcast 용도)
ALTER PUBLICATION supabase_realtime ADD TABLE booths;
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_list;
-- 1000�??�시 ?�속 ?��? ?��?번호 ?�전 발급 RPC (Race Condition 방�?)
CREATE OR REPLACE FUNCTION register_waitlist_v2(
  p_booth_id UUID,
  p_name TEXT,
  p_count INTEGER
) RETURNS jsonb AS $$
DECLARE
  v_next_number INTEGER;
  v_inserted_id UUID;
  v_result jsonb;
BEGIN
  -- ?�시 ?�발?�인 ?�청???�어?????�당 부?�의 번호??발급???�차?�으�?처리?�기 ?�해 Lock(?�금)??�?  PERFORM id FROM booths WHERE id = p_booth_id FOR UPDATE;

  -- 가??마�?�??��?번호�?조회?�서 +1
  SELECT COALESCE(MAX(waiting_number), 0) + 1 INTO v_next_number
  FROM waiting_list
  WHERE booth_id = p_booth_id;

  -- ?�기표 ?�입
  INSERT INTO waiting_list (booth_id, name, count, waiting_number, status)
  VALUES (p_booth_id, p_name, p_count, v_next_number, 'waiting')
  RETURNING id INTO v_inserted_id;

  -- ?�입???�이??반환
  v_result := jsonb_build_object(
    'id', v_inserted_id,
    'waiting_number', v_next_number
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

