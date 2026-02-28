"use client"

import { useEffect } from "react"
import { X, ExternalLink, Shield } from "lucide-react"
import { getRulesetForOrg } from "@/lib/scraper/rulesets"

interface RulesetModalProps {
  org: string
  onClose: () => void
}

export function RulesetModal({ org, onClose }: RulesetModalProps) {
  const ruleset = getRulesetForOrg(org)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-6 max-w-sm w-full shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#a0a0a0]" />
            <h2 className="font-semibold text-[#f0f0f0] text-sm">{ruleset.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#a0a0a0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#666] mb-4">
          Organization: <span className="text-[#a0a0a0]">{org}</span>
        </p>

        <a
          href={ruleset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#e8e8e8] text-[#0a0a0a] font-medium px-4 py-2 rounded-md hover:bg-white transition-colors text-sm w-full"
        >
          View Ruleset
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
