import { useEffect, useState } from 'react';
import { getBoothInfo } from '@/app/actions/waitlist';

export function useWaitingStatus(boothId: string, myWaitingNumber: number | null) {
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    if (!boothId) return;

    const fetchStatus = async () => {
      const res = await getBoothInfo(boothId);
      if (!res.success || !res.data) return;

      const currentNumber = res.data.current_number ?? 0;
      const ahead = myWaitingNumber && myWaitingNumber > currentNumber
        ? myWaitingNumber - currentNumber - 1
        : 0;
      setPeopleAhead(Math.max(0, ahead));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [boothId, myWaitingNumber]);

  return { peopleAhead };
}
