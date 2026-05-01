# 행사 체험 부스 대기 시스템

행사/축제 현장의 체험 부스 대기열을 관리하는 웹 서비스입니다.

## 🔗 주요 페이지

| 페이지 | URL | 설명 |
|---|---|---|
| 메인 | `/` | 관리자 로그인 / 테스트 부스 진입 |
| 로그인 | `/login` | 관리자(super_admin) 및 스태프(booth_admin) 로그인 |
| 대시보드 | `/dashboard` | 전체 부스 목록 및 관리 |
| 부스 생성 | `/dashboard/create` | 새 부스 생성 (super_admin 전용) |
| 어드민 | `/admin/[boothId]` | 부스별 대기열 관리, 번호 진행, 설정, 사진 업로드(자동 리사이즈) |
| QR 출력 | `/admin/[boothId]/print` | 부스 QR코드 인쇄용 페이지 |
| 전체 QR 일괄 출력 | `/dashboard/print-all` | 모든 부스 QR을 한 번에 인쇄 (super_admin 전용) |
| 사용자 대기 | `/[boothId]` | 방문자 대기표 발급 페이지 (짧은 ID 지원) |

## ⚡ 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Storage)
- **Styling**: Tailwind CSS 4
- **배포**: Vercel

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

`.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 📋 Supabase 초기 설정

SQL Editor에서 순서대로 실행:

1. `supabase/schema.sql` — 테이블 생성
2. `supabase/rpc_optimizations.sql` — 대기 번호 안전 발급 함수
3. `supabase/seed_admin.sql` — 최고 관리자 계정 생성
4. `supabase/migrations/001_add_auto_close.sql` — 자동 마감 컬럼 (close_at, max_capacity)
5. `supabase/migrations/002_performance_indexes.sql` — 1000명 동시 접속 대비 인덱스
6. `supabase/migrations/003_booths_storage_bucket.sql` — 부스 사진 Storage 버킷

Realtime 활성화 (schema.sql 에 포함되어 있음):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_list;
ALTER PUBLICATION supabase_realtime ADD TABLE booths;
```

## 👤 기본 관리자 계정

- **아이디**: `leearo`
- **비밀번호**: `1234`

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── [boothId]/        # 사용자 대기 페이지
│   ├── admin/[boothId]/  # 어드민 관리 페이지 + QR 출력
│   ├── dashboard/        # 대시보드 + 부스 생성
│   ├── login/            # 로그인
│   ├── actions/          # Server Actions (waitlist, admin, dashboard)
│   └── layout.tsx        # 루트 레이아웃
├── components/           # UI 컴포넌트 (WaitingHero, ActionBar)
├── hooks/                # 커스텀 훅 (useWaitingStatus, useAdminWaitingList)
└── lib/                  # Supabase 클라이언트, 이미지 리사이즈 유틸
```

## ⚙️ 성능 / 부하 대응

1000명 동시 접속을 가정하고 다음 최적화가 적용되어 있습니다.

- **DB 인덱스**: `waiting_list(booth_id, waiting_number)`, `(booth_id, status, waiting_number)`, `booths(owner_id)`, `profiles(booth_id)` 복합 인덱스 (`002_performance_indexes.sql`)
- **대기 번호 발급 동시성**: `register_waitlist_v2` RPC 가 `FOR UPDATE` 락으로 race condition 방지
- **Realtime 부하 완화**: 변경 이벤트 200ms 디바운스 + 인플라이트 코얼레싱, 클라이언트 `eventsPerSecond=5` 스로틀
- **이미지 자동 리사이즈**: 부스 사진 업로드 시 클라이언트에서 긴 변 1600px / 900KB 이하로 자동 압축 (`src/lib/image-resize.ts`)
- **부스 정보 캐싱**: `getBoothInfo` 3초 ISR 캐시로 DB 부하 분산

운영 측 권장사항:
- Supabase **Connection Pooler (Transaction mode)** 활성화
- `003_booths_storage_bucket.sql` 적용으로 Storage 버킷 / 공개 read 정책 보장
