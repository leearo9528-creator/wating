-- 축제 대기 시스템용 Supabase 스키마
-- 기존 프로젝트와 충돌 방지를 위해 모든 객체에 wating_ 프리픽스 사용
-- Supabase Dashboard > SQL Editor에 붙여넣고 실행

create table if not exists wating_booth_counters (
  booth text primary key,
  next_number int not null default 1
);

create table if not exists wating_queue (
  id bigserial primary key,
  booth text not null,
  number int not null,
  name text not null,
  people int not null check (people between 1 and 50),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  unique (booth, number)
);

create index if not exists wating_queue_booth_done_number_idx
  on wating_queue (booth, done, number);

-- 부스 1~7 카운터 시드
insert into wating_booth_counters (booth, next_number) values
  ('1', 1), ('2', 1), ('3', 1), ('4', 1), ('5', 1), ('6', 1), ('7', 1)
on conflict (booth) do nothing;

-- 부스별 다음 번호를 원자적으로 발급하는 함수
create or replace function wating_next_queue_number(p_booth text)
returns int
language plpgsql
as $$
declare
  n int;
begin
  update wating_booth_counters
    set next_number = next_number + 1
    where booth = p_booth
    returning next_number - 1 into n;
  if n is null then
    raise exception '존재하지 않는 부스: %', p_booth;
  end if;
  return n;
end;
$$;

-- 클라이언트에서 직접 접근하지 않으므로 RLS는 사용하지 않음
-- (서버 API에서 service_role 키로만 호출)
alter table wating_queue disable row level security;
alter table wating_booth_counters disable row level security;
