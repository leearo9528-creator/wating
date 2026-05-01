interface BoothHeaderProps {
  boothName: string
  location: string
}

export function BoothHeader({ boothName }: BoothHeaderProps) {
  return (
    <header className="bg-background">
      <div className="mx-auto max-w-md px-5 pt-8 pb-2 text-center">
        <h1 className="text-2xl font-black tracking-tight">{boothName}</h1>
      </div>
    </header>
  )
}
