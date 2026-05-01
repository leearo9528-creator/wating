# FLIT Union Wait

행사 부스용 초경량/고효율 웨이팅 서비스. 방문자는 QR 코드로 접속해 대기표를 발급받고, 부스 관리자는 실시간으로 대기열을 관리합니다.

## 주요 기능

- **방문자**: QR/링크 접속 → 이름·인원 입력 → 대기번호 발급 → 실시간 대기 현황 확인
- **부스 관리자**: 현재 진행 번호 ±1 조작, 운영 상태 토글(준비중/운영중/접수마감), 부스 정보·사진 수정, 대기 현황판 실시간 조회
- **최고 관리자**: 부스 단일/일괄 생성, 부스 삭제, 부스별 스태프 계정 자동 발급
- **동시성 안전**: Postgres RPC + `FOR UPDATE` 행 잠금으로 동시 등록 시 대기번호 중복 방지

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, Turbopack, Server Actions)
- **DB/Auth/Storage**: Supabase (Postgres, RLS, Realtime, Storage)
- **스타일**: Tailwind CSS v4
- **언어**: TypeScript (strict)

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/login` | 관리자 로그인 |
| `/[boothId]` | 방문자 웨이팅 등록·현황 |
| `/dashboard` | 관리자 대시보드 (담당 부스 목록) |
| `/dashboard/create` | 부스 생성 (super_admin 전용) |
| `/admin/[boothId]` | 부스 관리 페이지 (대기열·번호·설정) |

## 환경 변수

Vercel/`.env.local` 양쪽 모두 다음 키가 필요합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # 클라이언트용 anon 키
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # 서버 액션용 service_role 키 (반드시 비공개)
```

값이 없으면 데모 모드로 폴백합니다 (DB 미연결, 인메모리 카운터).

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run lint
```

## DB 셋업

Supabase 프로젝트 생성 후 SQL Editor에서 순서대로 실행:

1. `supabase/schema.sql` — 테이블·RLS·실시간 발행·`register_waitlist_v2` RPC
2. `supabase/rpc_optimizations.sql` — 추가 인덱스/RPC (있는 경우)
3. `supabase/seed_admin.sql` — 최초 super_admin 계정

Storage 버킷도 필요합니다.
- 버킷명: `booths`
- public read 허용 (부스 사진 노출용)

## 디렉터리 구조

```
src/
├─ app/
│  ├─ page.tsx                    # 랜딩
│  ├─ login/page.tsx              # 로그인
│  ├─ [boothId]/page.tsx          # 방문자 웨이팅
│  ├─ dashboard/
│  │  ├─ page.tsx                 # 대시보드
│  │  └─ create/page.tsx          # 부스 생성
│  ├─ admin/[boothId]/page.tsx    # 부스 관리 (올인원)
│  └─ actions/
│     ├─ waitlist.ts              # 등록·취소·부스조회 (캐시)
│     ├─ admin.ts                 # 부스/계정 CRUD, 사진 업로드
│     └─ dashboard.ts             # 부스 목록 조회 (RLS 우회)
├─ components/
│  ├─ booth-header.tsx
│  ├─ booth-info-card.tsx
│  ├─ waiting-hero.tsx
│  └─ action-bar.tsx
├─ hooks/
│  ├─ useWaitingStatus.ts         # 방문자 대기 현황 폴링
│  └─ useAdminWaitingList.ts      # 관리자 대기열 실시간 구독
└─ lib/
   └─ supabase-client.ts          # 클라이언트용 anon 클라이언트

supabase/
├─ schema.sql
├─ rpc_optimizations.sql
└─ seed_admin.sql
```

## 성능 메모

- 부스 정보 조회는 `unstable_cache`로 3초 캐시 (Vercel 엣지에서 DB 부하 감소)
- 방문자 화면은 3초 폴링, 관리자 화면은 Supabase Realtime 구독
- 동시 등록은 Postgres RPC 한 번에 처리 (네트워크 왕복·경합 최소화)

## 배포

Vercel 권장. 환경 변수 설정 후 `main` 브랜치 푸시 시 자동 배포됩니다.
