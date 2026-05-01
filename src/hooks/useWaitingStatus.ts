import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export function useWaitingStatus(boothId: string, myWaitingNumber: number | null) {
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    if (!boothId || !myWaitingNumber || !supabaseClient) return;

    const fetchAhead = async () => {
      const { count } = await supabaseClient!
        .from('waiting_list')
        .select('*', { count: 'exact', head: true })
        .eq('booth_id', boothId)
        .in('status', ['waiting', 'calling'])
        .lt('waiting_number', myWaitingNumber);

      setPeopleAhead(count ?? 0);
    };

    // 초기 로딩
    fetchAhead();

    // Supabase Realtime: DB 변경 시 즉시 반영
    const channel = supabaseClient
      .channel(`user-waiting-${boothId}-${myWaitingNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_list',
        filter: `booth_id=eq.${boothId}`
      }, () => {
        fetchAhead();
      })
      .subscribe();

    return () => {
      supabaseClient!.removeChannel(channel);
    };
  }, [boothId, myWaitingNumber]);

  return { peopleAhead };
}
