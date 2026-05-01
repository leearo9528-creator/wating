-- 부스 사진 업로드용 Storage 버킷 보장
-- 이미 존재하면 public 플래그만 갱신 (idempotent)

INSERT INTO storage.buckets (id, name, public)
VALUES ('booths', 'booths', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 공개 읽기 정책 (고객 대기표에서 photo_url 로 직접 접근)
DROP POLICY IF EXISTS "Public read booths bucket" ON storage.objects;
CREATE POLICY "Public read booths bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booths');

-- 업로드/수정/삭제는 service_role 키로만 (서버 액션 경유). 별도 정책 불필요.
