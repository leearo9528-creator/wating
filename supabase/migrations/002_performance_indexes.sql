-- 1000명 동시 접속 대비 성능 인덱스
-- Supabase SQL Editor 는 트랜잭션으로 감싸므로 CONCURRENTLY 사용 불가.
-- 일반 CREATE INDEX 로 적용 (대기 데이터 규모상 락 시간 무시할 수준).
-- 기능 변경 없음 — 기존 쿼리의 실행 계획만 개선.

-- waiting_list: 가장 빈번한 조회 패턴
--  - useWaitingStatus: booth_id + status IN(...) + waiting_number <
--  - useAdminWaitingList: booth_id + status IN(...) ORDER BY waiting_number
--  - register_waitlist_v2: booth_id 로 MAX(waiting_number)
--  - checkCapacityAutoClose: booth_id + status != cancelled COUNT
CREATE INDEX IF NOT EXISTS idx_waiting_list_booth_number
  ON waiting_list (booth_id, waiting_number);

CREATE INDEX IF NOT EXISTS idx_waiting_list_booth_status_number
  ON waiting_list (booth_id, status, waiting_number);

-- booths: owner_id 기반 RLS / 관리자 조회
CREATE INDEX IF NOT EXISTS idx_booths_owner
  ON booths (owner_id);

-- profiles: booth_id 역참조 (관리자 조회)
CREATE INDEX IF NOT EXISTS idx_profiles_booth
  ON profiles (booth_id);

-- 통계 갱신
ANALYZE waiting_list;
ANALYZE booths;
ANALYZE profiles;
