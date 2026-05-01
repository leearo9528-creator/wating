'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useWaitingStatus } from '@/hooks/useWaitingStatus';
import { registerWaitlist, cancelWaitlist, getBoothInfo } from '@/app/actions/waitlist';
import { WaitingHero } from "@/components/waiting-hero"
import { ActionBar } from "@/components/action-bar"
import { UserRound, Users, Store } from 'lucide-react';

type ViewState = 'register' | 'confirmed';

function NoticeSection({ showCaptureWarning = false }: { showCaptureWarning?: boolean }) {
  return (
    <div className="mt-2 px-4 py-5 bg-card/50 rounded-2xl border border-border/50 text-[13px] text-muted-foreground leading-relaxed space-y-3 break-keep">
      <p>
        <strong className="text-foreground block mb-1">함께 만드는 안전한 축제!</strong>
        이 번호표는 안전사고 예방을 위한 장치로, 상황에 따라 입장이 조금 늦어지거나 앞당겨질 수 있습니다.
      </p>
      <p>
        원활한 운영을 위해 호출 시 자리에 계시지 않으면 예약이 취소될 수 있는 점 양해 부탁드립니다.
      </p>
      <p>
        모두가 행복한 체험을 즐길 수 있도록 조금씩 양보하며 스태프의 안내를 따라주세요. 여러분의 배려가 더 즐거운 행사를 만듭니다.
      </p>
      {showCaptureWarning && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-primary font-bold">
            ※ 화면 새로고침 시 대기표가 사라질 수 있으니 발급 후 꼭 화면을 캡처해 주세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default function UserWaitingPage() {
  const params = useParams();
  const boothId = params.boothId as string;

  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [viewState, setViewState] = useState<ViewState>('register');
  const [myNumber, setMyNumber] = useState<number | null>(null);
  const [myWaitlistId, setMyWaitlistId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [boothInfo, setBoothInfo] = useState<{name: string, description: string, status?: string, photo_url?: string, open_time?: string, close_time?: string, max_capacity?: number} | null>(null);

  const { peopleAhead } = useWaitingStatus(boothId, myNumber);

  useEffect(() => {
    const fetchBoothInfo = async () => {
      const res = await getBoothInfo(boothId);
        
      if (res.success && res.data) {
        setBoothInfo(res.data);
      } else {
        setBoothInfo({ name: '알 수 없는 부스', description: '' });
      }
    };
    
    fetchBoothInfo();

    const saved = localStorage.getItem(`waitlist_${boothId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.number) {
          setMyWaitlistId(parsed.id);
          setMyNumber(parsed.number);
          setViewState('confirmed');
        }
      } catch (e) {}
    }
    
    setMounted(true);
  }, [boothId]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const res = await registerWaitlist(boothId, name, partySize);
    if (res.success) {
      if (res.data) {
        setMyNumber(res.data.waiting_number);
        setMyWaitlistId(res.data.id);
        setViewState('confirmed');
        localStorage.setItem(`waitlist_${boothId}`, JSON.stringify({
          id: res.data.id,
          number: res.data.waiting_number
        }));
      }
    } else {
      alert('등록에 실패했습니다: ' + ('error' in res ? res.error : '알 수 없는 오류'));
    }
    
    setIsSubmitting(false);
  }, [name, partySize, boothId, isSubmitting]);

  if (!mounted) return null;

  if (viewState === 'register') {
    return (
      <main className="min-h-dvh bg-secondary pb-10">
        <div className="mx-auto flex max-w-md flex-col gap-4 px-5 pt-10 pb-4">
          {/* 부스 상단 정보: 이름, 사진, 위치 */}
          <div className="flex flex-col gap-5 mb-4 text-center">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {boothInfo?.name || "로딩중..."}
            </h1>
            
            {boothInfo?.photo_url && (
              <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
                <div className="aspect-[4/3] w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={boothInfo.photo_url} alt={boothInfo.name} className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {boothInfo?.description && (
              <div className="rounded-2xl bg-card shadow-sm border border-border px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-lg">
                  📍
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">위치 안내</p>
                  <p className="text-[15px] text-foreground font-bold">{boothInfo.description}</p>
                </div>
              </div>
            )}
          </div>
          {boothInfo?.status && boothInfo.status !== 'open' ? (
            /* 운영 중이 아닐 때: 등록 차단 */
            <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">
                  {boothInfo.status === 'closed' ? '대기 접수 준비 중입니다' : '대기 접수가 마감되었습니다'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {boothInfo.status === 'closed' 
                    ? '아직 대기 접수가 시작되지 않았습니다. \n잠시 후 다시 확인해주세요.' 
                    : '오늘의 대기 접수가 마감되었습니다.'}
                </p>
                {boothInfo.status === 'closed' && boothInfo.open_time && (
                  <p className="text-sm font-bold text-foreground mt-3">
                    부스 운영 시작 시간 : {boothInfo.open_time}
                  </p>
                )}
              </div>
            </div>
          ) : (
          /* 운영 중일 때: 등록 폼 */
          <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
            <div className="px-5 pt-6 pb-2">
              <h2 className="text-xl font-bold tracking-tight">대기 등록</h2>
              <p className="text-sm text-muted-foreground mt-1">정보를 입력하고 대기표를 발급받으세요.</p>
            </div>
            
            <form onSubmit={handleRegister} className="px-5 pb-6 pt-4 space-y-6">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-2">
                  <UserRound className="w-4 h-4" /> 성함
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성함 입력"
                  required
                  className="w-full bg-secondary text-foreground px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-2">
                  <Users className="w-4 h-4" /> 인원
                </label>
                <div className="flex items-center bg-secondary rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-card shadow-sm active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-bold text-xl tabular-nums">{partySize}명</div>
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.min(20, partySize + 1))}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-card shadow-sm active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full py-4 rounded-xl text-base font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? '등록 중...' : '등록하기'}
              </button>
            </form>
          </div>
          )}
          <NoticeSection />
        </div>
      </main>
    )
  }

  // Confirmed View (V0 Code)

  return (
    <main className="min-h-dvh bg-secondary pb-24">
      {/* 캡처 안내 - 최상단 고정 배너 */}
      <div className="bg-primary text-primary-foreground py-4 px-5 text-center">
        <p className="text-base font-black tracking-tight">📸 지금 바로 이 화면을 캡처해 주세요!</p>
        <p className="text-sm mt-1 opacity-90">새로고침 시 대기표가 사라질 수 있습니다</p>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-5 px-5 pt-8 pb-4">
        {/* 부스 상단 정보 */}
        <div className="flex flex-col gap-5 mb-4 text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {boothInfo?.name || "로딩중..."}
          </h1>
        </div>

        <WaitingHero
          myNumber={myNumber!}
          teamsAhead={peopleAhead}
          status={peopleAhead <= 0 ? 'called' : peopleAhead <= 3 ? 'soon' : 'waiting'}
        />

        <NoticeSection />
      </div>

      <ActionBar
        onCancel={async () => {
          if (myWaitlistId) {
            await cancelWaitlist(myWaitlistId);
          }
          setViewState('register');
          setMyNumber(null);
          setMyWaitlistId(null);
          localStorage.removeItem(`waitlist_${boothId}`);
        }}
      />
    </main>
  )
}
