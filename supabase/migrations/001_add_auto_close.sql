-- 자동 마감 기능 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE booths
  ADD COLUMN IF NOT EXISTS close_at TIME,          -- 마감 시각 (HH:MM, KST 기준)
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER;   -- 최대 등록 인원 (NULL = 무제한)
