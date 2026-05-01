'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAdminWaitingList } from '@/hooks/useAdminWaitingList';
import { updateBoothInfo, getBoothSettings, uploadBoothPhoto, generateBoothAdmin } from '@/app/actions/admin';
import { Plus, Minus, Megaphone, ArrowLeft, Save, Copy, KeyRound, UserRound, ImagePlus, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const params = useParams();
  const boothId = params.boothId as string;

  const { list } = useAdminWaitingList(boothId);
  
  // Booth info (realtime number)
  const [currentNumber, setCurrentNumber] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Settings state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState('closed');
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [closeAt, setCloseAt] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBooth = async () => {
      const res = await getBoothSettings(boothId);
      if (res.success && res.data) {
        setName(res.data.name);
        setDescription(res.data.description || '');
        setPhotoUrl(res.data.photo_url || '');
        setStatus(res.data.status);
        setCurrentNumber(res.data.current_number || 0);
        setAdminId(res.data.admin_login_id || '');
        setAdminPw(res.data.admin_login_pw || '');
        setCloseAt(res.data.close_at ? (res.data.close_at as string).slice(0, 5) : '');
        setMaxCapacity(res.data.max_capacity ? String(res.data.max_capacity) : '');
      }
      setIsLoading(false);
    };
    fetchBooth();
  }, [boothId]);

  // 번호 변경: 낙관적 업데이트 (UI 먼저, DB는 백그라운드)
  const handleUpdateNumber = (newNumber: number) => {
    if (newNumber < 0 || isUpdating) return;
    setCurrentNumber(newNumber);
    updateBoothInfo(boothId, { current_number: newNumber });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateBoothInfo(boothId, {
      name,
      description,
      photo_url: photoUrl,
      status,
      close_at: closeAt || null,
      max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
    });
    setIsSaving(false);
    if (res.success) {
      alert('저장되었습니다.');
    } else {
      alert('오류 발생: ' + res.error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      alert('이미지 업로드에 실패했습니다.' + (res.error ? `\n(${res.error})` : ''));
    }
  };

  if (isLoading) {
    return <div className="min-h-dvh bg-secondary flex items-center justify-center text-muted-foreground font-medium">로딩 중...</div>;
  }

  return (
    <main className="min-h-dvh bg-secondary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-md px-5 py-4 border-b border-border/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{name || "부스 관리"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{description || "대기열 현황 관리"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/${boothId}/print`}
            className="p-2 rounded-full hover:bg-black/5 text-muted-foreground"
            title="출력 페이지"
          >
            <Printer className="w-5 h-5" />
          </Link>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status === 'open' ? 'bg-green-100 text-green-700' : status === 'paused' ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
            {status === 'open' ? '운영중' : status === 'paused' ? '접수마감' : '준비중'}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-6 pb-2">
        
        {/* ===== 운영 상태 빠른 전환 ===== */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'closed', label: '준비중', color: 'bg-muted text-muted-foreground border-border' },
            { value: 'open', label: '운영중', color: 'bg-green-100 text-green-700 border-green-200' },
            { value: 'paused', label: '접수마감', color: 'bg-red-100 text-red-600 border-red-200' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={async () => {
                setStatus(opt.value);
                await updateBoothInfo(boothId, { status: opt.value });
              }}
              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                status === opt.value
                  ? `${opt.color} ring-2 ring-offset-1 ring-current`
                  : 'bg-card text-muted-foreground border-border opacity-60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="rounded-3xl bg-card p-8 shadow-sm border border-border text-center flex flex-col items-center justify-center">
          <p className="text-muted-foreground font-bold mb-6 flex items-center justify-center gap-1.5">
            <Megaphone className="w-5 h-5 text-primary" /> 현재 진행 중인 번호
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-8 w-full">
            <button 
              onClick={() => handleUpdateNumber(currentNumber - 1)}
              disabled={isUpdating || currentNumber <= 0}
              className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 active:scale-95 transition-all disabled:opacity-50"
            >
              <Minus className="w-8 h-8" />
            </button>
            
            <div className="w-32 text-center">
              <span className="text-7xl font-black tracking-tighter tabular-nums text-foreground">
                {currentNumber}
              </span>
            </div>
            
            <button 
              onClick={() => handleUpdateNumber(currentNumber + 1)}
              disabled={isUpdating}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
          
          <button 
            onClick={() => handleUpdateNumber(currentNumber + 1)}
            disabled={isUpdating}
            className="w-full py-4 rounded-xl bg-primary/10 text-primary font-bold text-lg hover:bg-primary/20 transition-colors"
          >
            다음 번호 진행 (+1)
          </button>
        </div>

        {/* ===== 대기 현황 ===== */}
        <div className="flex items-center justify-between mb-2 mt-4">
          <h2 className="text-[18px] font-bold">대기 현황 <span className="text-primary">{list.length}</span>팀</h2>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm border border-border">
            <p className="text-muted-foreground text-[15px] font-medium">발급된 대기표가 없습니다.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((item) => (
              <li key={item.id} className={`rounded-2xl bg-card p-4 shadow-sm border border-border ${item.status === 'cancelled' ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.status === 'cancelled' ? 'bg-muted' : 'bg-secondary'} text-[17px] font-bold tabular-nums text-foreground`}>
                      {item.waiting_number}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[22px] tracking-tight">{item.name}</span>
                      <div className="bg-primary/10 px-3 py-1 rounded-lg">
                        <span className="text-primary font-bold text-[16px]">{item.count}명</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                      {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 접수
                    </span>
                    <div className="flex items-center gap-1">
                      {item.status === 'cancelled' ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          대기 취소
                        </span>
                      ) : (
                        <>
                          {item.waiting_number === currentNumber && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                              현재 차례
                            </span>
                          )}
                          {item.waiting_number < currentNumber && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              입장 완료
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ===== QR코드 & 웨이팅 링크 ===== */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border text-center">
          <p className="text-sm font-bold text-muted-foreground mb-3">📎 방문자 웨이팅 링크</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${typeof window !== 'undefined' ? window.location.origin : ''}/${boothId.split('-')[0]}`} 
            alt="QR Code"
            className="mx-auto w-48 h-48 rounded-xl border border-border mb-3"
          />
          <p className="text-xs text-muted-foreground mb-3 break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/${boothId.split('-')[0]}` : ''}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/${boothId.split('-')[0]}`;
                navigator.clipboard.writeText(url);
                alert('링크가 복사되었습니다!');
              }}
              className="flex-1 py-2.5 bg-secondary text-foreground font-bold text-sm rounded-xl border border-border active:scale-[0.98] transition-all"
            >
              링크 복사
            </button>
            <button
              type="button"
              onClick={() => window.open(`/${boothId.split('-')[0]}`, '_blank')}
              className="flex-1 py-2.5 bg-primary/10 text-primary font-bold text-sm rounded-xl active:scale-[0.98] transition-all"
            >
              미리보기
            </button>
          </div>
        </div>

        {/* ===== 현장 스태프 로그인 정보 ===== */}
        {adminId && adminPw ? (
          <div className="rounded-2xl bg-primary/5 p-5 shadow-sm border border-primary/20 space-y-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2">
              <KeyRound className="w-4 h-4" /> 현장 스태프 로그인 정보
            </h3>
            <div className="flex items-center justify-between bg-card px-4 py-3 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <UserRound className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-[15px]">{adminId}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const loginUrl = `${window.location.origin}/login`;
                  const guideText = `[${name}] 부스 관리자 계정

▶ 로그인 정보
아이디: ${adminId}
비밀번호: ${adminPw}
접속링크: ${loginUrl}

▶ 사용법
1. 위 링크로 접속 → 아이디/비밀번호 입력 → 로그인
2. 대시보드에서 부스 선택
3. 운영 상태를 \'운영중\'으로 변경해야 대기 접수가 시작됩니다
4. +/- 버튼으로 현재 진행 번호를 조절하세요
5. 대기 현황에서 실시간으로 대기자 목록을 확인할 수 있습니다

▶ 부스 설정 (하단 ⚙️ 부스 설정 클릭)
- 부스 이름/안내문구/사진 변경 가능
- 마감 시각/최대 인원 설정으로 자동 마감 가능`;
                  navigator.clipboard.writeText(guideText);
                  alert('복사되었습니다. 현장 스태프에게 전달해주세요.');
                }}
                className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5 inline mr-1" /> 복사
              </button>
            </div>
            <div className="flex items-center bg-card px-4 py-3 rounded-xl border border-border gap-3">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-[15px]">{adminPw}</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={async () => {
              const res = await generateBoothAdmin(boothId);
              if (res.success && res.data) {
                setAdminId(res.data.loginId);
                setAdminPw(res.data.password);
                alert(`스태프 계정이 생성되었습니다!\n아이디: ${res.data.loginId}\n비밀번호: ${res.data.password}`);
              } else {
                alert('계정 생성 실패: ' + (res.error || '알 수 없는 오류'));
              }
            }}
            className="w-full py-4 rounded-2xl bg-primary/10 text-primary font-bold text-[15px] border-2 border-dashed border-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <KeyRound className="w-5 h-5" /> 스태프 계정 생성하기
          </button>
        )}

        {/* ===== 부스 설정 (접이식) ===== */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm border border-border font-bold text-[15px]"
          >
            <span>⚙️ 부스 설정</span>
            {showSettings ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showSettings && (
            <form onSubmit={handleSave} className="mt-3 space-y-4">
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
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">사진</label>
                  {photoUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-border aspect-video bg-muted relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoUrl} alt="Booth" className="w-full h-full object-cover" />
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
                      {isUploading ? '업로드 중...' : '선택'}
                    </button>
                  </div>
                </div>
              </div>
            
              {/* 자동 마감 설정 */}
              <div className="rounded-xl bg-secondary p-4 space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">자동 마감 설정</p>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">마감 시각 (KST)</label>
                  <input
                    type="time"
                    value={closeAt}
                    onChange={e => setCloseAt(e.target.value)}
                    className="w-full bg-card text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">입력 시각이 되면 접수가 자동 마감됩니다. 비워두면 비활성화.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">최대 인원</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={e => setMaxCapacity(e.target.value)}
                    min={1}
                    placeholder="무제한"
                    className="w-full bg-card text-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">해당 인원 등록 시 접수가 자동 마감됩니다. 비워두면 무제한.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 rounded-xl text-base font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
