"use client"

import { useState, useEffect, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, Calendar, MapPin, Users, Trophy } from "lucide-react"
import { signOut } from "next-auth/react"
import { EventCard } from "@/components/EventCard"

interface EventResult {
  id: string
  name: string
  date: string
  org: string
  location: string
  url: string
  competitorCount?: number
}

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<EventResult[]>([])
  const [searchError, setSearchError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const [upcomingEvents, setUpcomingEvents] = useState<EventResult[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [upcomingError, setUpcomingError] = useState("")

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch("/api/upcoming-events")
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setUpcomingEvents(data.events || [])
      } catch {
        setUpcomingError("Could not load upcoming events.")
      } finally {
        setLoadingUpcoming(false)
      }
    }
    fetchUpcoming()
  }, [])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setSearchError("")
    setHasSearched(true)

    try {
      const res = await fetch("/api/search-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setSearchResults(data.events || [])
    } catch (err) {
      setSearchError((err as Error).message || "Search failed.")
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setQuery("")
    setHasSearched(false)
    setSearchResults([])
    setSearchError("")
  }

  const displayEvents = hasSearched ? searchResults : upcomingEvents

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={clearSearch}
            className="text-lg font-semibold text-[#f0f0f0] shrink-0 hover:text-white transition-colors"
          >
            BJJ Scout
          </button>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search BJJ/Grappling events..."
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-md pl-9 pr-3 py-2 text-sm text-[#f0f0f0] placeholder-[#666] outline-none focus:border-[#444] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="bg-[#e8e8e8] text-[#0a0a0a] font-medium px-4 py-2 rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shrink-0"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-[#666] hover:text-[#a0a0a0] transition-colors shrink-0"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Section title */}
        <div className="mb-4 flex items-center gap-2">
          {hasSearched ? (
            <>
              <span className="text-sm text-[#a0a0a0]">
                {searching ? "Searching..." : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${query}"`}
              </span>
              <button
                onClick={clearSearch}
                className="text-xs text-[#666] hover:text-[#a0a0a0] underline transition-colors"
              >
                Clear
              </button>
            </>
          ) : (
            <h2 className="text-sm font-medium text-[#a0a0a0] uppercase tracking-wider">
              Upcoming Events
            </h2>
          )}
        </div>

        {/* Error states */}
        {searchError && (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-md px-4 py-3 mb-4">
            {searchError}
          </div>
        )}
        {upcomingError && !hasSearched && (
          <div className="text-sm text-[#666] bg-[#141414] border border-[#2a2a2a] rounded-md px-4 py-3 mb-4">
            {upcomingError}
          </div>
        )}

        {/* Loading */}
        {(loadingUpcoming && !hasSearched) || (searching) ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-16 text-[#666] text-sm">
            {hasSearched ? "No BJJ/Grappling events found for that search." : "No upcoming events found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => router.push(`/event/${event.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
