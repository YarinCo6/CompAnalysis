import { ChevronRight } from "lucide-react"

interface CompetitorCardProps {
  competitor: {
    name: string
    team: string
    category: string
    weight?: string
    belt?: string
  }
  onClick: () => void
}

export function CompetitorCard({ competitor, onClick }: CompetitorCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-md hover:border-[#3a3a3a] hover:bg-[#1a1a1a] transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[#f0f0f0] group-hover:text-white transition-colors truncate">
            {competitor.name}
          </span>
          {competitor.belt && competitor.belt !== "" && (
            <span className="text-xs text-[#666] shrink-0">{competitor.belt}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {competitor.team && (
            <span className="text-xs text-[#a0a0a0] truncate">{competitor.team}</span>
          )}
          {competitor.team && competitor.category && (
            <span className="text-[#444]">·</span>
          )}
          {competitor.category && (
            <span className="text-xs text-[#666] truncate">{competitor.category}</span>
          )}
          {competitor.weight && (
            <>
              <span className="text-[#444]">·</span>
              <span className="text-xs text-[#666]">{competitor.weight}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#444] shrink-0 group-hover:text-[#666] transition-colors" />
    </button>
  )
}
