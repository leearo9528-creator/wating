# 행사 체험 부스 대기 시스템

행사/축제 현장의 체험 부스 대기열을 관리하는 웹 서비스입니다.

## 🔗 주요 페이지

| 페이지 | URL | 설명 |
|---|---|---|
| 메인 | `/` | 관리자 로그인 / 테스트 부스 진입 |
| 로그인 | `/login` | 관리자(super_admin) 및 스태프(booth_admin) 로그인 |
| 대시보드 | `/dashboard` | 전체 부스 목록 및 관리 |
| 부스 생성 | `/dashboard/create` | 새 부스 생성 (super_admin 전용) |
| 어드민 | `/admin/[boothId]` | 부스별 대기열 관리, 번호 진행, 설정 |
| QR 출력 | `/admin/[boothId]/print` | 부스 QR코드 인쇄용 페이지 |
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

자동 마감 컬럼 추가:
```sql
ALTER TABLE booths
  ADD COLUMN IF NOT EXISTS close_at TIME,
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
```

Realtime 활성화:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_list;
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
└── lib/                  # Supabase 클라이언트
```
