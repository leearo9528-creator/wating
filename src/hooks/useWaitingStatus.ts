import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export function useWaitingStatus(boothId: string, myWaitingNumber: number | null) {
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    if (!boothId || !myWaitingNumber || !supabaseClient) return;

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let inflight = false;
    let pending = false;

    const fetchAhead = async () => {
      if (cancelled) return;
      if (inflight) { pending = true; return; }
      inflight = true;
      try {
        const { count } = await supabaseClient!
          .from('waiting_list')
          .select('*', { count: 'exact', head: true })
          .eq('booth_id', boothId)
          .in('status', ['waiting', 'calling'])
          .lt('waiting_number', myWaitingNumber);

        if (!cancelled) setPeopleAhead(count ?? 0);
      } finally {
        inflight = false;
        if (pending && !cancelled) {
          pending = false;
          fetchAhead();
        }
      }
    };

    // 변경 burst를 합쳐서 짧은 윈도우 내에 한 번만 재조회
    // (200ms 이내 사용자에게는 사실상 즉시 반영되어 보임)
    const scheduleFetch = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        fetchAhead();
      }, 200);
    };

    // 초기 로딩
    fetchAhead();

    // Supabase Realtime: DB 변경 시 즉시 반영 (debounced)
    const channel = supabaseClient
      .channel(`user-waiting-${boothId}-${myWaitingNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_list',
        filter: `booth_id=eq.${boothId}`
      }, () => {
        scheduleFetch();
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabaseClient!.removeChannel(channel);
    };
  }, [boothId, myWaitingNumber]);

  return { peopleAhead };
}
