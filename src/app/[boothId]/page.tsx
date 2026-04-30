'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useWaitingStatus } from '@/hooks/useWaitingStatus';
import { registerWaitlist, cancelWaitlist, getBoothInfo } from '@/app/actions/waitlist';
import { supabaseClient } from '@/lib/supabase-client';

// V0 Components
import { BoothHeader } from "@/components/booth-header"
import { WaitingHero } from "@/components/waiting-hero"
import { ActionBar } from "@/components/action-bar"
import { UserRound, Users, ChevronRight, Store, Sparkles } from 'lucide-react';

type ViewState = 'register' | 'confirmed';

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
  const [boothInfo, setBoothInfo] = useState<{name: string, description: string, status?: string, photo_url?: string} | null>(null);

  const { currentCallingNumber, peopleAhead } = useWaitingStatus(boothId, myNumber);

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
    setMounted(true);
  }, [boothId]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const res = await registerWaitlist(boothId, name, partySize);
    if (res.success && res.data) {
      setMyNumber(res.data.waiting_number);
      setMyWaitlistId(res.data.id);
      setViewState('confirmed');
    } else {
      alert('등록에 실패했습니다: ' + res.error);
    }
    
    setIsSubmitting(false);
  }, [name, partySize, boothId, isSubmitting]);

  if (!mounted) return null;

  if (viewState === 'register') {
    return (
      <main className="min-h-dvh bg-secondary">
        <BoothHeader boothName={boothInfo?.name || "로딩중..."} location={boothInfo?.description || ""} />
        
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-2 pb-4">
          {/* 부스 사진 & 위치 정보 */}
          {(boothInfo?.photo_url || boothInfo?.description) && (
            <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
              {boothInfo.photo_url && (
                <div className="aspect-video w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={boothInfo.photo_url} alt={boothInfo.name} className="w-full h-full object-cover" />
                </div>
              )}
              {boothInfo.description && (
                <div className="px-5 py-3 flex items-center gap-2">
                  <span className="text-sm">📍</span>
                  <span className="text-sm text-muted-foreground font-medium">{boothInfo.description}</span>
                </div>
              )}
            </div>
          )}
          {boothInfo?.status && boothInfo.status !== 'open' ? (
            /* 운영 중이 아닐 때: 등록 차단 */
            <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">
                  {boothInfo.status === 'closed' ? '웨이팅 준비 중입니다' : '웨이팅 접수가 마감되었습니다'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {boothInfo.status === 'closed' ? '아직 웨이팅 접수가 시작되지 않았습니다. \n잠시 후 다시 확인해주세요.' : '오늘의 웨이팅 접수가 마감되었습니다.'}
                </p>
              </div>
            </div>
          ) : (
          /* 운영 중일 때: 등록 폼 */
          <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
            <div className="px-5 pt-6 pb-2">
              <h2 className="text-xl font-bold tracking-tight">웨이팅 등록</h2>
              <p className="text-sm text-muted-foreground mt-1">정보를 입력하고 대기표를 발급받으세요.</p>
            </div>
            
            <form onSubmit={handleRegister} className="px-5 pb-6 pt-4 space-y-6">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-2">
                  <UserRound className="w-4 h-4" /> 이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 입력"
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
        </div>
      </main>
    )
  }

  // Confirmed View (V0 Code)

  return (
    <main className="min-h-dvh bg-secondary pb-24">
      <BoothHeader boothName={boothInfo?.name || "로딩중..."} location={boothInfo?.description || ""} />

      <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-2 pb-2">
        {/* 부스 사진 & 위치 정보 */}
        {(boothInfo?.photo_url || boothInfo?.description) && (
          <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
            {boothInfo.photo_url && (
              <div className="aspect-video w-full bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={boothInfo.photo_url} alt={boothInfo.name} className="w-full h-full object-cover" />
              </div>
            )}
            {boothInfo.description && (
              <div className="px-5 py-3 flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-sm text-muted-foreground font-medium">{boothInfo.description}</span>
              </div>
            )}
          </div>
        )}

        <WaitingHero
          myNumber={myNumber!}
          teamsAhead={peopleAhead}
          status={peopleAhead <= 0 ? 'called' : peopleAhead <= 3 ? 'soon' : 'waiting'}
        />

        <p className="px-2 pt-2 pb-1 text-center text-[11px] text-muted-foreground">
          마지막 업데이트 · 방금 전
        </p>
      </div>

      <ActionBar
        onCancel={async () => {
          if (myWaitlistId) {
            await cancelWaitlist(myWaitlistId);
          }
          setViewState('register');
          setMyNumber(null);
          setMyWaitlistId(null);
        }}
      />
    </main>
  )
}
