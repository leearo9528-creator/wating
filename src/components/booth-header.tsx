import { ChevronLeft, MoreHorizontal } from "lucide-react"

interface BoothHeaderProps {
  boothName: string
  location: string
}

export function BoothHeader({ boothName, location }: BoothHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <button
          type="button"
          aria-label="뒤로가기"
          className="-ml-2 rounded-full p-2 text-foreground/80 hover:bg-secondary"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[15px] font-semibold leading-tight">{boothName}</span>
          <span className="text-[11px] leading-tight text-muted-foreground">{location}</span>
        </div>
        <button
          type="button"
          aria-label="더보기"
          className="-mr-2 rounded-full p-2 text-foreground/80 hover:bg-secondary"
        >
          <MoreHorizontal className="h-6 w-6" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  )
}
