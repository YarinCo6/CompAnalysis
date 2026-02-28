interface ProfileAnalyticsProps {
  winRate: number | null
  submissionRate: number | null
  dominantStyle: "submission-focused" | "points-based" | "defensive" | "unknown"
}

const STYLE_LABELS: Record<string, { label: string; color: string }> = {
  "submission-focused": { label: "Submission Focused", color: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20" },
  "points-based": { label: "Points Based", color: "text-[#60a5fa] bg-[#60a5fa]/10 border-[#60a5fa]/20" },
  defensive: { label: "Defensive", color: "text-[#a0a0a0] bg-[#222] border-[#2a2a2a]" },
  unknown: { label: "Unknown Style", color: "text-[#666] bg-[#141414] border-[#2a2a2a]" }
}

function StatBar({
  label,
  value,
  color
}: {
  label: string
  value: number | null
  color: string
}) {
  if (value === null) return null

  const pct = Math.round(value * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#a0a0a0]">{label}</span>
        <span className="text-xs font-medium text-[#f0f0f0]">{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ProfileAnalytics({
  winRate,
  submissionRate,
  dominantStyle
}: ProfileAnalyticsProps) {
  const styleInfo = STYLE_LABELS[dominantStyle] || STYLE_LABELS.unknown

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
      <h2 className="text-xs uppercase tracking-wider font-medium text-[#a0a0a0] mb-4">
        Match Analytics
      </h2>

      <div className="space-y-3">
        <StatBar label="Win Rate" value={winRate} color="bg-[#22c55e]" />
        <StatBar label="Submission Rate (of wins)" value={submissionRate} color="bg-[#f59e0b]" />
      </div>

      {winRate === null && submissionRate === null && (
        <p className="text-sm text-[#666]">No analytics data available.</p>
      )}

      <div className="mt-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-medium ${styleInfo.color}`}
        >
          {styleInfo.label}
        </span>
      </div>
    </div>
  )
}
