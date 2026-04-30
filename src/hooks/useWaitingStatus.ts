import { useEffect, useState } from 'react';
import { getBoothInfo } from '@/app/actions/waitlist';

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

  // Update state if the prop changes (e.g. user registers and gets a number)
  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      myWaitingNumber: initialWaitingNumber
    }));
  }, [initialWaitingNumber]);

  useEffect(() => {
    if (!boothId) return;

    const fetchStatus = async () => {
      const res = await getBoothInfo(boothId);
      
      if (res.success && res.data) {
        const currentNumber = res.data.current_number;
        
        setStatus(prev => {
          const myNum = initialWaitingNumber || prev.myWaitingNumber;
          const newPeopleAhead = myNum && myNum > currentNumber
            ? myNum - currentNumber - 1 
            : 0;
            
          return {
            ...prev,
            currentCallingNumber: currentNumber,
            peopleAhead: Math.max(0, newPeopleAhead)
          };
        });
      }
    };

    fetchStatus();

    // Poll every 3 seconds to bypass RLS and Realtime setup issues
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [boothId, initialWaitingNumber]);

  return status;
}
