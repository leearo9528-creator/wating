"use client"

interface ActionBarProps {
  onCancel: () => void
}

export function ActionBar({ onCancel }: ActionBarProps) {
  return (
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-secondary via-secondary/95 to-transparent pt-6 pb-4">
      <div className="mx-auto flex max-w-md gap-2 px-5">
        <button
          type="button"
          onClick={onCancel}
          className="h-14 w-full rounded-2xl bg-card text-[16px] font-bold text-foreground/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary"
        >
          대기 취소
        </button>
      </div>
    </div>
  )
}
