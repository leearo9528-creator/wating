interface BoothInfoCardProps {
  name: string
  description?: string
  photoUrl?: string
}

export function BoothInfoCard({ name, description, photoUrl }: BoothInfoCardProps) {
  if (!photoUrl && !description) return null

  return (
    <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
      {photoUrl && (
        <div className="aspect-video w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      {description && (
        <div className="px-5 py-3 flex items-center gap-2">
          <span className="text-sm">📍</span>
          <span className="text-sm text-muted-foreground font-medium">{description}</span>
        </div>
      )}
    </div>
  )
}
