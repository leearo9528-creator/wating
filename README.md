# 축제 현장 대기 시스템

부스 7개를 운영하는 축제 현장에서 굴리는 대기열 시스템.
부스마다 독립된 큐, 손님은 부스 QR 찍어서 닉네임+인원 등록.

**스택:** Vercel (API Routes + 정적 호스팅) + Supabase (Postgres)

## 동작 방식

1. 손님이 부스 앞 QR을 찍음 → `/?booth=3` 같은 페이지로 진입
2. 닉네임 + 인원수 입력 → 대기번호 발급
3. 자기 폰 화면에 자기 번호 + 앞에 남은 팀/인원 자동 표시 (5초마다 갱신)
4. 차례 가까워지면 부스에 와서 번호를 직원에게 보여줌
5. 직원은 부스 화면(`/booth.html?id=3`)에서 "완료" 탭하면 큐 진행

## 프로젝트 구조

```
api/                Vercel API Routes
  register.js       POST /api/register
  status.js         GET  /api/status?booth=&number=
  list.js           GET  /api/list?booth=
  done.js           POST /api/done   (body: { booth, number })
  booths.js         GET  /api/booths
lib/
  supabase.js       Supabase 클라이언트 (service role)
public/
  index.html        손님 페이지
  booth.html        부스 직원 화면
supabase/
  schema.sql        Supabase에 한 번만 실행
```

## 셋업 (한 번만)

### 1. Supabase

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. Dashboard > SQL Editor 열고 `supabase/schema.sql` 내용 붙여넣고 실행
3. Dashboard > Settings > API에서 다음 두 값 복사:
   - **Project URL** (`https://xxx.supabase.co`)
   - **service_role key** (절대 클라이언트에 노출 X)

### 2. Vercel

1. 이 레포를 GitHub에 푸시 (이미 되어있음)
2. [vercel.com](https://vercel.com) > Add New Project > 이 레포 import
3. Environment Variables에 두 개 추가:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

자동으로 `https://wating.vercel.app` 같은 도메인이 생김.

### 3. QR 코드 만들기

배포 끝나면 브라우저에서 `https://<도메인>/qr.html` 열기.
부스 1~7 QR 7개가 한 화면에 뜸. 상단 **인쇄** 버튼으로 종이 출력하거나 스크린샷.

(다른 도메인으로 바꿔 만들고 싶으면 상단 입력칸에 URL 넣고 **적용**)

부스 직원용 화면:
- `https://<도메인>/booth.html?id=1` ~ `?id=7`

## 로컬 개발

```bash
npm install
cp .env.example .env.local   # 값 채우기
npx vercel dev               # 또는: npm run dev
```

## 운영 팁

- 행사 끝나고 다음에 다시 쓰려면 Supabase SQL Editor에서:
  ```sql
  truncate wating_queue;
  update wating_booth_counters set next_number = 1;
  ```
- 메모리/파일 기반이 아니라 DB 기반이므로 200명 동시 접속 무난
