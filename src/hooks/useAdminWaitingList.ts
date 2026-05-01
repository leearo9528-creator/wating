import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export interface WaitingListRow {
  id: string;
  booth_id: string;
  name: string;
  count: number;
  waiting_number: number;
  status: 'waiting' | 'calling' | 'done' | 'cancelled';
  created_at: string;
}

export function useAdminWaitingList(boothId: string) {
  const [list, setList] = useState<WaitingListRow[]>([]);

  useEffect(() => {
    if (!boothId || !supabaseClient) return;

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let inflight = false;
    let pending = false;

    const fetchList = async () => {
      if (cancelled) return;
      if (inflight) { pending = true; return; }
      inflight = true;
      try {
        const { data } = await supabaseClient!
          .from('waiting_list')
          .select('*')
          .eq('booth_id', boothId)
          .in('status', ['waiting', 'calling', 'done', 'cancelled'])
          .order('waiting_number', { ascending: true });

        if (!cancelled && data) setList(data as WaitingListRow[]);
      } finally {
        inflight = false;
        if (pending && !cancelled) {
          pending = false;
          fetchList();
        }
      }
    };

    const scheduleFetch = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        fetchList();
      }, 200);
    };

    fetchList();

    const channel = supabaseClient
      .channel(`admin-waiting-${boothId}`)
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
  }, [boothId]);

  return { list };
}
