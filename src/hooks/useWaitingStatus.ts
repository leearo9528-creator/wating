import { useEffect, useState } from 'react';
import { getWaitlistStatus } from '@/app/actions/waitlist';

export function useWaitingStatus(boothId: string, myWaitingNumber: number | null) {
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    if (!boothId) return;

    const fetchStatus = async () => {
      if (myWaitingNumber) {
        const res = await getWaitlistStatus(boothId, myWaitingNumber);
        if (res.success) {
          setPeopleAhead(res.peopleAhead);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [boothId, myWaitingNumber]);

  return { peopleAhead };
}
