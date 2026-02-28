import { Calendar, MapPin, Users, ChevronRight } from "lucide-react"

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

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4 hover:border-[#3a3a3a] hover:bg-[#1e1e1e] transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-[#f0f0f0] text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
          {event.name || `Event ${event.id}`}
        </h3>
        <ChevronRight className="w-4 h-4 text-[#666] shrink-0 mt-0.5 group-hover:text-[#a0a0a0] transition-colors" />
      </div>

      {event.org && (
        <p className="text-xs text-[#666] mt-1 uppercase tracking-wider font-medium">
          {event.org}
        </p>
      )}

      <div className="mt-3 space-y-1">
        {event.date && (
          <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0]">
            <Calendar className="w-3 h-3 text-[#666]" />
            {formatDate(event.date)}
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0]">
            <MapPin className="w-3 h-3 text-[#666]" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {event.competitorCount !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0]">
            <Users className="w-3 h-3 text-[#666]" />
            {event.competitorCount} competitors
          </div>
        )}
      </div>
    </button>
  )
}
