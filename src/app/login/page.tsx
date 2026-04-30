'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) {
      alert('Supabase 연동이 필요합니다.');
      return;
    }

    setIsLoading(true);
    
    // Supabase Auth requires an email, so we append a dummy domain to the ID
    const dummyEmail = `${userId}@flit.admin`;
    
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: dummyEmail,
      password,
    });

    if (error) {
      alert('로그인 실패: ' + error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-dvh bg-secondary flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-sm border border-border">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="text-sm text-muted-foreground mt-1">부스 관리를 위해 로그인해주세요.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">아이디</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
              className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
              placeholder="관리자 아이디"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 rounded-xl text-base font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
