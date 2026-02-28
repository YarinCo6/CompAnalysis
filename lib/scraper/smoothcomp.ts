import { chromium } from "playwright"

export interface EventResult {
  id: string
  name: string
  date: Date
  org: string
  location: string
  url: string
  competitorCount?: number
}

export interface Competitor {
  name: string
  team: string
  category: string
  weight?: string
  belt?: string
  profileUrl?: string
}

export interface MatchResult {
  opponent: string
  result: "win" | "loss" | "draw"
  method: string
  submissionType?: string
  event: string
  date?: string
  time?: string
}

const BJJ_KEYWORDS = [
  "bjj",
  "jiu-jitsu",
  "jiu jitsu",
  "grappling",
  "submission",
  "nogi",
  "no-gi",
  "wrestling",
  "adcc"
]

function isBJJEvent(name: string, tags: string[]): boolean {
  const text = [name, ...tags].join(" ").toLowerCase()
  return BJJ_KEYWORDS.some((kw) => text.includes(kw))
}

async function withBrowser<T>(fn: (browser: import("playwright").Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

export async function searchEvents(query: string): Promise<EventResult[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    try {
      await page.goto(
        `https://smoothcomp.com/en/event/search?q=${encodeURIComponent(query)}`,
        { waitUntil: "networkidle", timeout: 30000 }
      )

      await page.waitForTimeout(2000)

      const events = await page.evaluate(() => {
        const results: Array<{
          id: string
          name: string
          date: string
          org: string
          location: string
          url: string
          tags: string[]
        }> = []

        // Try multiple selectors for event cards
        const cards = document.querySelectorAll(
          ".event-card, [data-testid='event-card'], .EventCard, .event-list-item, .event_row, tr[data-event-id], .search-result-item"
        )

        cards.forEach((card) => {
          const link = card.querySelector("a[href*='/event/']") as HTMLAnchorElement | null
          if (!link) return

          const href = link.href
          const idMatch = href.match(/\/event\/(\d+)/)
          if (!idMatch) return

          const name = card.querySelector("h2, h3, .event-name, .title, strong")?.textContent?.trim() || link.textContent?.trim() || ""
          const dateEl = card.querySelector(".date, time, [data-date], .event-date")
          const date = dateEl?.getAttribute("datetime") || dateEl?.textContent?.trim() || ""
          const org = card.querySelector(".org, .organizer, .organization")?.textContent?.trim() || ""
          const location = card.querySelector(".location, .venue, .city")?.textContent?.trim() || ""
          const tagEls = card.querySelectorAll(".tag, .badge, .label, .sport-tag")
          const tags = Array.from(tagEls).map((t) => t.textContent?.trim() || "")

          results.push({ id: idMatch[1], name, date, org, location, url: href, tags })
        })

        return results
      })

      return events
        .filter((e) => isBJJEvent(e.name, e.tags))
        .map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date ? new Date(e.date) : new Date(),
          org: e.org,
          location: e.location,
          url: e.url
        }))
    } catch (err) {
      console.error("searchEvents error:", err)
      return []
    } finally {
      await page.close()
    }
  })
}

export async function getCompetitors(eventId: string, eventUrl?: string): Promise<Competitor[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    try {
      const baseUrl = eventUrl
        ? eventUrl.replace(/\/en\/event.*/, "")
        : "https://smoothcomp.com"
      const competitorsUrl = `${baseUrl}/en/event/${eventId}/competitors`

      await page.goto(competitorsUrl, { waitUntil: "networkidle", timeout: 30000 })

      // Check for private event redirect or error
      const pageUrl = page.url()
      if (pageUrl.includes("/login") || pageUrl.includes("/403") || pageUrl.includes("/401")) {
        throw new Error("PRIVATE_EVENT")
      }

      await page.waitForTimeout(2000)

      const allCompetitors: Competitor[] = []
      let hasNextPage = true

      while (hasNextPage) {
        const pageCompetitors = await page.evaluate(() => {
          const competitors: Competitor[] = []

          // Table rows
          const rows = document.querySelectorAll(
            "table tbody tr, .competitor-row, .CompetitorRow, [data-competitor]"
          )

          rows.forEach((row) => {
            const cells = row.querySelectorAll("td")
            if (cells.length < 2) return

            const nameEl = row.querySelector("a[href*='/user/'], .competitor-name, td:first-child")
            const name = nameEl?.textContent?.trim() || cells[0]?.textContent?.trim() || ""
            if (!name) return

            const profileUrl = (nameEl as HTMLAnchorElement)?.href || undefined
            const team = cells[1]?.textContent?.trim() || ""
            const category = cells[2]?.textContent?.trim() || cells[3]?.textContent?.trim() || ""
            const weight = cells[3]?.textContent?.trim() || cells[4]?.textContent?.trim() || ""
            const belt = cells[4]?.textContent?.trim() || cells[5]?.textContent?.trim() || ""

            competitors.push({ name, team, category, weight, belt, profileUrl })
          })

          return competitors
        })

        allCompetitors.push(...pageCompetitors)

        // Check for next page
        const nextBtn = await page.$("a[rel='next'], .pagination-next:not(.disabled), [aria-label='Next page']")
        if (nextBtn) {
          await nextBtn.click()
          await page.waitForTimeout(2000)
        } else {
          hasNextPage = false
        }
      }

      return allCompetitors
    } catch (err) {
      if ((err as Error).message === "PRIVATE_EVENT") throw err
      console.error("getCompetitors error:", err)
      return []
    } finally {
      await page.close()
    }
  })
}

export async function getMatchHistory(profileUrl: string): Promise<MatchResult[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    try {
      await page.goto(profileUrl, { waitUntil: "networkidle", timeout: 30000 })
      await page.waitForTimeout(2000)

      const matches = await page.evaluate(() => {
        const results: MatchResult[] = []

        const rows = document.querySelectorAll(
          ".match-row, .result-row, table.matches tbody tr, [data-match]"
        )

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td")
          if (cells.length < 2) return

          const resultText = cells[0]?.textContent?.trim().toLowerCase() || ""
          const result: "win" | "loss" | "draw" = resultText.includes("win") || resultText.includes("w")
            ? "win"
            : resultText.includes("loss") || resultText.includes("l")
            ? "loss"
            : "draw"

          const opponent = cells[1]?.textContent?.trim() || ""
          const method = cells[2]?.textContent?.trim() || ""
          const event = cells[3]?.textContent?.trim() || ""
          const date = cells[4]?.textContent?.trim() || ""

          if (opponent) {
            results.push({ opponent, result, method, event, date })
          }
        })

        return results
      })

      return matches
    } catch (err) {
      console.error("getMatchHistory error:", err)
      return []
    } finally {
      await page.close()
    }
  })
}

export async function getUpcomingEvents(): Promise<EventResult[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    try {
      await page.goto(
        "https://smoothcomp.com/en/event/list",
        { waitUntil: "networkidle", timeout: 30000 }
      )
      await page.waitForTimeout(2000)

      const events = await page.evaluate(() => {
        const results: Array<{
          id: string
          name: string
          date: string
          org: string
          location: string
          url: string
          tags: string[]
          competitorCount?: number
        }> = []

        const cards = document.querySelectorAll(
          ".event-card, [data-testid='event-card'], .EventCard, .event-list-item, .event_row"
        )

        cards.forEach((card) => {
          const link = card.querySelector("a[href*='/event/']") as HTMLAnchorElement | null
          if (!link) return

          const href = link.href
          const idMatch = href.match(/\/event\/(\d+)/)
          if (!idMatch) return

          const name = card.querySelector("h2, h3, .event-name, .title, strong")?.textContent?.trim() || link.textContent?.trim() || ""
          const dateEl = card.querySelector(".date, time, [data-date], .event-date")
          const date = dateEl?.getAttribute("datetime") || dateEl?.textContent?.trim() || ""
          const org = card.querySelector(".org, .organizer, .organization")?.textContent?.trim() || ""
          const location = card.querySelector(".location, .venue, .city")?.textContent?.trim() || ""
          const tagEls = card.querySelectorAll(".tag, .badge, .label, .sport-tag")
          const tags = Array.from(tagEls).map((t) => t.textContent?.trim() || "")
          const countEl = card.querySelector(".competitor-count, .athletes-count, .count")
          const competitorCount = countEl ? parseInt(countEl.textContent?.replace(/\D/g, "") || "0") : undefined

          results.push({ id: idMatch[1], name, date, org, location, url: href, tags, competitorCount })
        })

        return results
      })

      const now = new Date()
      return events
        .filter((e) => isBJJEvent(e.name, e.tags))
        .filter((e) => !e.date || new Date(e.date) >= now)
        .map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date ? new Date(e.date) : new Date(),
          org: e.org,
          location: e.location,
          url: e.url,
          competitorCount: e.competitorCount
        }))
    } catch (err) {
      console.error("getUpcomingEvents error:", err)
      return []
    } finally {
      await page.close()
    }
  })
}
