'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateBoothInfo, getBoothSettings, uploadBoothPhoto } from '@/app/actions/admin';
import { ArrowLeft, Save, Copy, KeyRound, UserRound, ImagePlus } from 'lucide-react';
import Link from 'next/link';

export default function BoothSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const boothId = params.boothId as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState('closed');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');

  useEffect(() => {
    const fetchBooth = async () => {
      const res = await getBoothSettings(boothId);
      if (res.success && res.data) {
        setName(res.data.name);
        setDescription(res.data.description || '');
        setPhotoUrl(res.data.photo_url || '');
        setStatus(res.data.status);
        setAdminId(res.data.admin_login_id || '');
        setAdminPw(res.data.admin_login_pw || '');
      }
      setIsLoading(false);
    };
    fetchBooth();
  }, [boothId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateBoothInfo(boothId, { name, description, photo_url: photoUrl, status });
    setIsSaving(false);
    if (res.success) {
      alert('저장되었습니다.');
      router.push(`/admin/${boothId}`);
    } else {
      alert('오류 발생: ' + res.error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadBoothPhoto(boothId, formData);
    setIsUploading(false);

    if (res.success && res.url) {
      setPhotoUrl(res.url);
    } else {
      alert('이미지 업로드에 실패했습니다. (Supabase Storage 설정을 확인해주세요)');
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground font-medium">로딩 중...</div>;
  }

  return (
    <main className="min-h-dvh bg-secondary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-md px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <Link href={`/admin/${boothId}`} className="p-2 -ml-2 rounded-full hover:bg-black/5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">부스 설정</h1>
          <p className="text-sm text-muted-foreground mt-0.5">기본 정보 및 운영 상태 관리</p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-6 pb-2">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">부스 이름</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">안내 문구 (위치 등)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">사진 업로드 (또는 URL 입력)</label>
              
              {photoUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border border-border aspect-video bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Booth Preview" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-sm"
                />
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-3 bg-card border border-border rounded-xl font-bold flex items-center gap-2 hover:bg-secondary/80 active:scale-95 transition-all text-sm shrink-0 whitespace-nowrap"
                >
                  <ImagePlus className="w-4 h-4" />
                  {isUploading ? '업로드 중...' : '사진 선택'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">운영 상태</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium appearance-none"
              >
                <option value="closed">준비 중</option>
                <option value="open">운영 중 (웨이팅 접수 가능)</option>
                <option value="paused">접수 마감</option>
              </select>
            </div>
          </div>

          {adminId && adminPw && (
            <div className="rounded-2xl bg-primary/5 p-5 shadow-sm border border-primary/20 space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2">
                <KeyRound className="w-4 h-4" /> 현장 스태프 전용 로그인 정보
              </h3>
              
              <div className="flex items-center justify-between bg-card px-4 py-3 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <UserRound className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-[15px]">{adminId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`아이디: ${adminId} / 비밀번호: ${adminPw}`);
                    alert('복사되었습니다. 현장 스태프에게 전달해주세요.');
                  }}
                  className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 inline mr-1" /> 복사
                </button>
              </div>

              <div className="flex items-center justify-between bg-card px-4 py-3 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-[15px]">{adminPw}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                위 계정으로 로그인하면 다른 부스 목록은 보이지 않고 이 부스의 대기 현황판만 관리할 수 있습니다.
              </p>
            </div>
          )}
        
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-xl text-base font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
