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

    const fetchList = async () => {
      const { data } = await supabaseClient!
        .from('waiting_list')
        .select('*')
        .eq('booth_id', boothId)
        .in('status', ['waiting', 'calling', 'done', 'cancelled'])
        .order('waiting_number', { ascending: true });

      if (data) setList(data as WaitingListRow[]);
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
        fetchList();
      })
      .subscribe();

    return () => {
      supabaseClient!.removeChannel(channel);
    };
  }, [boothId]);

  return { list };
}
