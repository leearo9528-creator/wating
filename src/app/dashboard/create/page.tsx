'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBooth } from '@/app/actions/admin';
import { supabaseClient } from '@/lib/supabase-client';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function CreateBoothPage() {
  const router = useRouter();
  
  const [isBulk, setIsBulk] = useState(false);
  
  // Single mode state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Bulk mode state
  const [bulkNames, setBulkNames] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabaseClient) return;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSaving(true);
    
    if (isBulk) {
      const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      if (names.length === 0) {
        alert('부스 이름을 한 줄 이상 입력해주세요.');
        setIsSaving(false);
        return;
      }
      
      const { createBoothsBulk } = await import('@/app/actions/admin');
      const res = await createBoothsBulk(names, userId);
      setIsSaving(false);
      
      if (res.success) {
        alert(`${names.length}개의 부스가 생성되었습니다.`);
        router.push('/dashboard');
      } else {
        alert('오류 발생: ' + res.error);
      }
    } else {
      const res = await createBooth(name, description, photoUrl, userId);
      setIsSaving(false);
      
      if (res.success) {
        alert('부스가 성공적으로 생성되었습니다.');
        router.push('/dashboard');
      } else {
        alert('오류 발생: ' + res.error);
      }
    }
  };

  return (
    <main className="min-h-dvh bg-secondary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-md px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-black/5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">새 부스 만들기</h1>
          <p className="text-sm text-muted-foreground mt-0.5">신규 웨이팅 부스 개설</p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-6 pb-2">
        <div className="flex gap-2 p-1 bg-card rounded-xl border border-border mb-6">
          <button 
            onClick={() => setIsBulk(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isBulk ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            단일 생성
          </button>
          <button 
            onClick={() => setIsBulk(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isBulk ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            여러 개 생성
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border space-y-4">
            {!isBulk ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">부스 이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="예: 토스 라운지 · 체험 부스"
                    className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">안내 문구 (위치 등)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="예: A홀 · B-12"
                    className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">사진 URL (선택)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={e => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-secondary text-foreground pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    부스 메인에 표시될 이미지 링크를 입력해 주세요. (없으면 기본 배너 적용)
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">부스 이름 목록</label>
                <textarea
                  value={bulkNames}
                  onChange={e => setBulkNames(e.target.value)}
                  required
                  placeholder="토스 라운지&#10;플릿 체험 부스&#10;푸드트럭 A"
                  rows={8}
                  className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium resize-none leading-relaxed"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  한 줄에 하나씩 부스 이름을 입력해 주세요. 생성된 부스의 세부 정보(위치 등)는 나중에 각각 설정할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || (!isBulk && !name.trim()) || (isBulk && !bulkNames.trim())}
            className="w-full py-4 rounded-xl text-base font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '생성 중...' : (isBulk ? '한 번에 생성하기' : '부스 생성하기')}
          </button>
        </form>
      </div>
    </main>
  );
}
