import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client safely
const supabase = supabaseUrl.startsWith('http') ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!boothId || !supabase) {
      setIsLoading(false);
      return;
    }

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('booth_id', boothId)
        .in('status', ['waiting', 'calling'])
        .order('waiting_number', { ascending: true });

      if (!error && data) {
        setList(data as WaitingListRow[]);
      }
      setIsLoading(false);
    };

    fetchInitial();

    const channel = supabase.channel(`admin-waiting-${boothId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_list',
        filter: `booth_id=eq.${boothId}`
      }, () => {
        fetchInitial();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boothId]);

  return { list, isLoading };
}
