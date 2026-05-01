'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { fetchAdminBooths } from '@/app/actions/dashboard';
import { deleteBooth } from '@/app/actions/admin';
import { Plus, Store, Settings, QrCode, LogOut, Trash2, Printer } from 'lucide-react';

interface Booth {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    const fetchAuthAndBooths = async () => {
      if (!supabaseClient) {
        setIsLoading(false);
        return;
      }
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role, booth_id')
        .eq('id', user.id)
        .single();
        
      // Fallback: If profile fetch fails but email is the admin email, treat as super_admin
      const isHardcodedAdmin = user.email === 'leearo@flit.admin';
      const userRole = isHardcodedAdmin ? 'super_admin' : (profile?.role || 'booth_admin');
      setRole(userRole);

      // Fetch booths using Server Action to bypass RLS
      const res = await fetchAdminBooths(userRole, user.id, profile?.booth_id);
      
      if (!res.success) {
        console.error("Dashboard booths fetch error:", res.error);
      } else if (res.data) {
        setBooths(res.data);
      }
      
      setIsLoading(false);
    };

    fetchAuthAndBooths();
  }, [router]);

  const handleLogout = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      router.push('/login');
    }
  };

  const handleDelete = async (boothId: string, boothName: string) => {
    if (!confirm(`정말 "${boothName}" 부스를 삭제하시겠습니까?\n\n⚠️ 이 부스의 모든 대기 데이터와 담당자 계정이 함께 삭제됩니다.`)) return;
    
    const res = await deleteBooth(boothId);
    if (res.success) {
      setBooths(prev => prev.filter(b => b.id !== boothId));
    } else {
      alert('삭제 실패: ' + res.error);
    }
  };

  return (
    <main className="min-h-dvh bg-secondary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-md px-5 py-4 border-b border-border/50 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            내 부스 관리 {role === 'super_admin' && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1 align-middle">최고 관리자</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">운영 중인 부스 목록</p>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-black/5 text-muted-foreground">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 pt-6 pb-2">
        {role === 'super_admin' && (
          <div className="flex justify-end mb-2">
            <Link 
              href="/dashboard/create" 
              className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> 새 부스 생성
            </Link>
          </div>
        )}
        {isLoading ? (
          <div className="text-center text-muted-foreground mt-10 font-medium">로딩 중...</div>
        ) : booths.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm border border-border mt-4">
            <Store className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-[15px] font-medium">생성된 부스가 없습니다.</p>
            <p className="text-muted-foreground text-[13px] mt-1">Supabase에서 부스를 먼저 생성해주세요.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {booths.map(booth => (
              <li key={booth.id} className="rounded-3xl bg-card p-5 shadow-sm border border-border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{booth.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{booth.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${booth.status === 'open' ? 'bg-green-100 text-green-700' : booth.status === 'paused' ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                    {booth.status === 'open' ? '운영중' : booth.status === 'paused' ? '접수마감' : '준비중'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Link 
                    href={`/admin/${booth.id}`}
                    className="py-3 bg-primary text-primary-foreground text-center font-bold text-[13px] rounded-xl flex items-center justify-center gap-1"
                  >
                    <Settings className="w-4 h-4" /> 관리
                  </Link>
                  <Link 
                    href={`/${booth.id.split('-')[0]}`}
                    target="_blank"
                    className="py-3 bg-secondary text-foreground text-center font-bold text-[13px] rounded-xl border border-border flex items-center justify-center gap-1 hover:bg-secondary/80"
                  >
                    <QrCode className="w-4 h-4" /> 링크
                  </Link>
                  <Link 
                    href={`/admin/${booth.id}/print`}
                    target="_blank"
                    className="py-3 bg-secondary text-foreground text-center font-bold text-[13px] rounded-xl border border-border flex items-center justify-center gap-1 hover:bg-secondary/80"
                  >
                    <Printer className="w-4 h-4" /> 출력
                  </Link>
                </div>
                {role === 'super_admin' && (
                  <button
                    onClick={() => handleDelete(booth.id, booth.name)}
                    className="w-full mt-2 py-2.5 text-sm font-medium text-red-500 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 부스 삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
