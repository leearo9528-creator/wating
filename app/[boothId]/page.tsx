'use client'

import { useState } from 'react';
import { useWaitingStatus } from '@/hooks/useWaitingStatus';
import { Users, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function UserWaitingPage() {
  const params = useParams();
  const boothId = params.boothId as string;
  
  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState<number>(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const [myNumber, setMyNumber] = useState<number | null>(null);

  const { currentCallingNumber, peopleAhead } = useWaitingStatus(boothId, myNumber);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // (이 곳에 Supabase Insert 로직 추가: API Route 또는 Supabase Client 호출)
    // 임시 모의 데이터
    const mockAssignedNumber = currentCallingNumber + 5; 
    setMyNumber(mockAssignedNumber);
    setIsRegistered(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white px-6 py-5 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">슈퍼 인기 푸드트럭</h1>
        <p className="text-sm text-gray-500 mt-1">현재 <span className="font-semibold text-blue-600">{currentCallingNumber}번</span> 입장 중</p>
      </header>

      <main className="flex-1 px-6 py-8 max-w-md w-full mx-auto">
        {!isRegistered ? (
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">웨이팅 등록하기</h2>
            
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  대표자 이름
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력해주세요"
                  className="w-full bg-gray-50 text-gray-900 px-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-shadow text-lg outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  입장 인원
                </label>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white text-gray-900 font-medium shadow-sm active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-lg font-semibold text-gray-900">
                    {partySize}명
                  </span>
                  <button 
                    type="button"
                    onClick={() => setPartySize(partySize + 1)}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white text-gray-900 font-medium shadow-sm active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 bg-[#3182F6] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                등록 완료하기 <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#3182F6] rounded-2xl p-8 text-white text-center shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <CheckCircle2 className="w-24 h-24" />
              </div>
              <p className="text-blue-100 font-medium text-sm mb-1 relative z-10">나의 대기 번호</p>
              <h2 className="text-6xl font-extrabold tracking-tighter mb-6 relative z-10">{myNumber}</h2>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex justify-between items-center relative z-10">
                <span className="text-blue-50 font-medium">내 앞 대기</span>
                <span className="text-2xl font-bold bg-white text-[#3182F6] px-3 py-1 rounded-lg">
                  {peopleAhead}팀
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-0.5">현재 입장 번호</p>
                <p className="text-2xl font-bold text-gray-900">{currentCallingNumber}번</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
