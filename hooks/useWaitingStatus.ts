import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WaitingStatus {
  currentCallingNumber: number;
  myWaitingNumber: number | null;
  peopleAhead: number;
}

export function useWaitingStatus(boothId: string, initialWaitingNumber: number | null = null) {
  const [status, setStatus] = useState<WaitingStatus>({
    currentCallingNumber: 0,
    myWaitingNumber: initialWaitingNumber,
    peopleAhead: 0,
  });

  useEffect(() => {
    if (!boothId) return;

    const fetchInitialStatus = async () => {
      const { data: boothData } = await supabase
        .from('booths')
        .select('current_number')
        .eq('id', boothId)
        .single();
        
      if (boothData) {
        setStatus(prev => ({
          ...prev,
          currentCallingNumber: boothData.current_number
        }));
      }

      if (status.myWaitingNumber) {
        const { count } = await supabase
          .from('waiting_list')
          .select('*', { count: 'exact', head: true })
          .eq('booth_id', boothId)
          .eq('status', 'waiting')
          .lt('waiting_number', status.myWaitingNumber);
          
        if (count !== null) {
          setStatus(prev => ({ ...prev, peopleAhead: count }));
        }
      }
    };

    fetchInitialStatus();

    const boothChannel = supabase
      .channel(`booth-updates-${boothId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'booths', filter: `id=eq.${boothId}` },
        (payload) => {
          const newCurrentNumber = payload.new.current_number;
          setStatus(prev => {
            const newPeopleAhead = prev.myWaitingNumber && prev.myWaitingNumber > newCurrentNumber
              ? prev.myWaitingNumber - newCurrentNumber - 1 
              : 0;
              
            return {
              ...prev,
              currentCallingNumber: newCurrentNumber,
              peopleAhead: Math.max(0, newPeopleAhead)
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiting_list', filter: `booth_id=eq.${boothId}` },
        () => {
          fetchInitialStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(boothChannel);
    };
  }, [boothId, status.myWaitingNumber]);

  return status;
}
