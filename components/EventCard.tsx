import { Calendar, MapPin, ChevronRight } from "lucide-react"

interface EventCardProps {
  event: {
    id: string
    name: string
    date: string
    org: string
    location: string
    url?: string
    competitorCount?: number
  }
  onClick: () => void
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  } catch {
    return dateStr
  }
}

function getOrgColor(org: string): string {
  if (!org) return "from-[#3b82f6] to-[#6366f1]"
  const o = org.toLowerCase()
  if (o.includes("ibjjf")) return "from-[#10b981] to-[#3b82f6]"
  if (o.includes("adcc")) return "from-[#f59e0b] to-[#ef4444]"
  if (o.includes("uaejjf") || o.includes("uae")) return "from-[#6366f1] to-[#8b5cf6]"
  if (o.includes("cbjj") || o.includes("fjjd")) return "from-[#3b82f6] to-[#06b6d4]"
  if (o.includes("nogi") || o.includes("no-gi")) return "from-[#f59e0b] to-[#f97316]"
  return "from-[#3b82f6] to-[#6366f1]"
}

export function EventCard({ event, onClick }: EventCardProps) {
  const gradientClass = getOrgColor(event.org)
  const dateStr = formatDate(event.date)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#141414] border border-[#222] rounded-xl overflow-hidden hover:border-[#3b3b3b] hover:bg-[#181818] transition-all group shadow-sm hover:shadow-md"
    >
      {/* Gradient top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[#f0f0f0] text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
            {event.name || `Event ${event.id}`}
          </h3>
          <ChevronRight className="w-4 h-4 text-[#555] shrink-0 mt-0.5 group-hover:text-[#888] group-hover:translate-x-0.5 transition-all" />
        </div>

        {event.org && (
          <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
            {event.org}
          </span>
        )}

        <div className="mt-3 space-y-1.5">
          {dateStr && (
            <div className="flex items-center gap-1.5 text-xs text-[#888]">
              <Calendar className="w-3 h-3 text-[#555] shrink-0" />
              <span>{dateStr}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-[#888]">
              <MapPin className="w-3 h-3 text-[#555] shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
