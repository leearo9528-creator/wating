-- 1000명 동시 접속 대비 성능 인덱스
-- 모두 CONCURRENTLY 로 무중단 생성 (운영 중 적용 가능)
-- 기능 변경 없음 — 기존 쿼리의 실행 계획만 개선

-- waiting_list: 가장 빈번한 조회 패턴
--  - useWaitingStatus: booth_id + status IN(...) + waiting_number <
--  - useAdminWaitingList: booth_id + status IN(...) ORDER BY waiting_number
--  - register_waitlist_v2: booth_id 로 MAX(waiting_number)
--  - checkCapacityAutoClose: booth_id + status != cancelled COUNT
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waiting_list_booth_number
  ON waiting_list (booth_id, waiting_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waiting_list_booth_status_number
  ON waiting_list (booth_id, status, waiting_number);

-- booths: owner_id 기반 RLS / 관리자 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_owner
  ON booths (owner_id);

-- profiles: RLS 서브쿼리 (id = auth.uid()) 는 PK 사용으로 이미 최적
-- booth_id 역참조는 관리자 조회에서 사용
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_booth
  ON profiles (booth_id);

-- 통계 갱신
ANALYZE waiting_list;
ANALYZE booths;
ANALYZE profiles;
