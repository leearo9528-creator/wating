'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getBoothSettings } from '@/app/actions/admin';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

interface BoothData {
  name: string;
  description: string | null;
  photo_url: string | null;
}

export default function PrintPage() {
  const params = useParams();
  const boothId = params.boothId as string;
  const [booth, setBooth] = useState<BoothData | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    getBoothSettings(boothId).then(res => {
      if (res.success && res.data) setBooth(res.data);
    });
  }, [boothId]);

  if (!booth) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-muted-foreground font-medium">
        로딩 중...
      </div>
    );
  }

  const shortId = boothId.split('-')[0];
  const boothUrl = `${origin}/${shortId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=0&data=${encodeURIComponent(boothUrl)}`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; background: white; }
          .print-page { box-shadow: none !important; }
        }
      `}</style>

      {/* 화면용 컨트롤 */}
      <div className="no-print sticky top-0 z-10 flex items-center gap-3 px-5 py-3 bg-secondary/90 backdrop-blur-md border-b border-border">
        <Link
          href={`/admin/${boothId}`}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 관리 페이지
        </Link>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" /> 인쇄하기
        </button>
      </div>

      {/* A4 배경 */}
      <div className="no-print min-h-screen bg-gray-200 flex justify-center py-10 px-4" />

      {/* A4 본문 */}
      <div className="flex justify-center bg-gray-200 print:bg-white print:block">
        <div
          className="print-page bg-white shadow-2xl print:shadow-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '12mm 16mm',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* 상단: 부스명 */}
          <h1 style={{
            fontSize: '34pt',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            textAlign: 'center',
            lineHeight: 1.2,
            color: '#111',
            marginBottom: '6mm',
            marginTop: '2mm',
          }}>
            {booth.name}
          </h1>

          {/* 부스 사진 */}
          {booth.photo_url && (
            <div style={{
              width: '100%',
              height: '48mm',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '8mm',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booth.photo_url}
                alt={booth.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* 위치 안내 */}
          {booth.description && (
            <p style={{
              fontSize: '13pt',
              color: '#555',
              textAlign: 'center',
              marginBottom: '6mm',
              lineHeight: 1.5,
            }}>
              📍 {booth.description}
            </p>
          )}

          {/* 구분선 */}
          <div style={{ width: '40mm', height: '1.5px', background: '#e0e0e0', marginBottom: '7mm' }} />

          {/* 안내 문구 */}
          <p style={{
            fontSize: '14pt',
            fontWeight: 700,
            color: '#222',
            textAlign: 'center',
            marginBottom: '8mm',
          }}>
            QR 코드를 스캔하여 대기를 등록하세요
          </p>

          {/* QR 코드 - 크게 정 가운데 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
            <div style={{
              padding: '6mm',
              border: '2px solid #e0e0e0',
              borderRadius: '16px',
              background: '#fff',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="웨이팅 QR 코드"
                style={{ width: '100mm', height: '100mm', display: 'block' }}
              />
            </div>
          </div>

          {/* 하단 안내 */}
          <div style={{
            width: '100%',
            borderTop: '1px solid #ebebeb',
            paddingTop: '6mm',
            marginTop: '6mm',
          }}>
            <p style={{ fontSize: '10pt', fontWeight: 700, color: '#444', textAlign: 'center', marginBottom: '4mm' }}>
              💡 웨이팅 이용 안내
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
              {[
                '현장 상황에 따라 대기 접수가 조기 마감될 수 있습니다.',
                '실제 입장 시간은 상황에 따라 앞당겨지거나 지연될 수 있습니다.',
                '모든 방문자가 체험할 수 있도록 너그러운 양해 부탁드립니다.',
              ].map((text, i) => (
                <p key={i} style={{ fontSize: '9pt', color: '#888', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                  · {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
