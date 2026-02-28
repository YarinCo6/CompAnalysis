"use client"

interface FilterBarProps {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
}

export function FilterBar({ categories, selected, onSelect }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <button
        onClick={() => onSelect("")}
        className={`px-3 py-1 rounded-full text-xs transition-colors ${
          selected === ""
            ? "bg-[#e8e8e8] text-[#0a0a0a] font-medium"
            : "bg-[#222] text-[#a0a0a0] hover:bg-[#2a2a2a]"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            selected === cat
              ? "bg-[#e8e8e8] text-[#0a0a0a] font-medium"
              : "bg-[#222] text-[#a0a0a0] hover:bg-[#2a2a2a]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
