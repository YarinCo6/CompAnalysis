"use client"

import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface FilterBarProps {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
  totalCount: number
  filteredCount: number
}

export function FilterBar({ categories, selected, onSelect, totalCount, filteredCount }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const label = selected || "All categories"

  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
            selected
              ? "border-[#3b82f6]/60 bg-[#3b82f6]/10 text-[#3b82f6]"
              : "border-[#222] bg-[#111] text-[#888] hover:border-[#333] hover:text-[#f0f0f0]"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-[220px] truncate">{label}</span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-[#111] border border-[#222] rounded-xl shadow-xl z-20 overflow-hidden">
            {/* All */}
            <button
              onClick={() => { onSelect(""); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                !selected
                  ? "bg-[#3b82f6]/15 text-[#3b82f6] font-medium"
                  : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
              }`}
            >
              <span>All categories</span>
              <span className="text-xs text-[#555]">{totalCount}</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-[#1e1e1e] mx-3" />

            {/* Scrollable category list */}
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {categories.map((cat) => {
                const count = cat === selected ? filteredCount : undefined
                return (
                  <button
                    key={cat}
                    onClick={() => { onSelect(cat); setOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between gap-2 ${
                      selected === cat
                        ? "bg-[#3b82f6]/15 text-[#3b82f6] font-medium"
                        : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {count !== undefined && (
                      <span className="text-[10px] text-[#555] shrink-0">{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active filter badge */}
      {selected && (
        <button
          onClick={() => onSelect("")}
          className="text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          ✕ Clear filter
        </button>
      )}

      {/* Count */}
      <span className="text-xs text-[#555] ml-auto">
        {selected
          ? `${filteredCount} of ${totalCount} competitor${totalCount !== 1 ? "s" : ""}`
          : `${totalCount} competitor${totalCount !== 1 ? "s" : ""}`}
      </span>
    </div>
  )
}
