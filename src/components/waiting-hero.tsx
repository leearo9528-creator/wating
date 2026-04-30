import { Bell } from "lucide-react"

interface WaitingHeroProps {
  myNumber: number
  teamsAhead: number
  status: "waiting" | "soon" | "called"
}

export function WaitingHero({ myNumber, teamsAhead, status }: WaitingHeroProps) {
  let statusLabel = "대기 중이에요";
  let statusTone = "bg-secondary text-secondary-foreground";
  let statusMessage = "";

  if (status === "called") {
    statusLabel = "입장 차례입니다!";
    statusTone = "bg-primary text-primary-foreground";
    statusMessage = "지금 바로 부스로 와주세요!";
  } else if (status === "soon") {
    statusLabel = "곧 입장이에요!";
    statusTone = "bg-blue-500 text-white";
    statusMessage = "부스 앞으로 와서 대기해주세요.";
  }

  return (
    <section className="rounded-3xl bg-card px-6 pt-7 pb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full ${status === 'waiting' ? 'bg-primary' : 'bg-current'} animate-soft-pulse`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${status === 'waiting' ? 'bg-primary' : 'bg-current'}`} />
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone}`}>
            {statusLabel}
          </span>
        </div>
        {statusMessage && (
          <p className={`text-sm font-bold ${status === 'called' ? 'text-primary' : 'text-blue-500'} ml-1`}>
            {statusMessage}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-[15px] font-medium text-muted-foreground">내 대기번호</p>
      </div>

      <div className="mt-1 flex items-end gap-2">
        <span className="text-[88px] font-bold leading-none tracking-tight tabular-nums">
          {String(myNumber).padStart(3, "0")}
        </span>
        <span className="mb-3 text-xl font-semibold text-muted-foreground">번</span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3.5">
        <div className="flex flex-col">
          <span className="text-[12px] text-muted-foreground">앞에</span>
          <span className="text-[17px] font-semibold">
            <span className="tabular-nums">{teamsAhead}</span>
            <span className="ml-0.5 text-foreground/70">팀</span>
            <span className="ml-1.5 font-medium text-muted-foreground">남았어요</span>
          </span>
        </div>
      </div>
    </section>
  )
}
