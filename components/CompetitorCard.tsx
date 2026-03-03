import { ChevronRight, Sparkles } from "lucide-react"

interface CompetitorCardProps {
  competitor: {
    name: string
    team: string
    category: string
    weight?: string
    belt?: string
    hasAnalysis?: boolean
  }
  onClick: () => void
}

const BELT_COLORS: Record<string, string> = {
  white: "bg-white text-gray-800",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-600 text-white",
  brown: "bg-amber-800 text-white",
  black: "bg-gray-900 text-white border border-[#333]",
  red: "bg-red-600 text-white",
}

function getBeltStyle(belt: string | undefined): string {
  if (!belt) return ""
  const b = belt.toLowerCase()
  for (const [key, cls] of Object.entries(BELT_COLORS)) {
    if (b.includes(key)) return cls
  }
  return "bg-[#2a2a2a] text-[#a0a0a0]"
}

/** "Adult / Male / Blue Belt / Light" → "Blue Belt · Light" (last 2 parts) */
function compactCategory(cat: string): string {
  if (!cat) return ""
  const parts = cat.split("/").map(p => p.trim()).filter(Boolean)
  if (parts.length <= 2) return cat
  return parts.slice(-2).join(" · ")
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

export function CompetitorCard({ competitor, onClick }: CompetitorCardProps) {
  const beltStyle = getBeltStyle(competitor.belt)
  const initials = getInitials(competitor.name)

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 bg-[#141414] border border-[#222] rounded-lg hover:border-[#333] hover:bg-[#181818] transition-all group"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[#f0f0f0] group-hover:text-white transition-colors truncate">
            {competitor.name}
          </span>
          {competitor.belt && beltStyle && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${beltStyle}`}>
              {competitor.belt}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {competitor.team && (
            <span className="text-xs text-[#888] truncate max-w-[140px]">{competitor.team}</span>
          )}
          {competitor.team && competitor.category && (
            <span className="text-[#3a3a3a]">·</span>
          )}
          {competitor.category && (
            <span className="text-xs text-[#666] truncate" title={competitor.category}>
              {compactCategory(competitor.category)}
            </span>
          )}
          {competitor.weight && (
            <>
              <span className="text-[#3a3a3a]">·</span>
              <span className="text-xs text-[#555]">{competitor.weight}</span>
            </>
          )}
        </div>
      </div>

      {/* Analytics indicator */}
      {competitor.hasAnalysis ? (
        <div
          className="shrink-0 flex items-center gap-1 bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[#3b82f6] px-2 py-1 rounded-md"
          title="Analytics profile available"
        >
          <Sparkles className="w-3 h-3" />
          <span className="text-[10px] font-semibold">AI</span>
        </div>
      ) : (
        <ChevronRight className="w-4 h-4 text-[#444] shrink-0 group-hover:text-[#666] group-hover:translate-x-0.5 transition-all" />
      )}
    </button>
  )
}
