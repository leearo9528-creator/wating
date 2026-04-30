import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-dvh bg-secondary flex flex-col items-center justify-center p-5 text-center">
      <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">FLIT Union Wait</h1>
      <p className="text-muted-foreground text-base max-w-[280px] mb-10 leading-relaxed">
        초경량/고효율 행사 부스 웨이팅 서비스. 복잡한 절차 없이 QR코드 하나로 대기열을 관리하세요.
      </p>

      <div className="flex flex-col w-full max-w-sm gap-3">
        <Link 
          href="/login"
          className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          관리자 대시보드 <ArrowRight className="w-5 h-5" />
        </Link>
        <Link 
          href="/123e4567-e89b-12d3-a456-426614174000"
          className="w-full h-14 bg-card text-foreground font-bold text-lg rounded-2xl flex items-center justify-center hover:bg-card/80 transition-colors shadow-sm border border-border"
        >
          테스트 부스 구경하기
        </Link>
      </div>
    </main>
  );
}
