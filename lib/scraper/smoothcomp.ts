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
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1280,720"
    ]
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

async function newPage(browser: import("playwright").Browser) {
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: "en-US"
  })
  return ctx.newPage()
}

export async function searchEvents(query: string): Promise<EventResult[]> {
  return withBrowser(async (browser) => {
    const page = await newPage(browser)
    try {
      await page.goto(
        "https://smoothcomp.com/en/events/upcoming",
        { waitUntil: "networkidle", timeout: 30000 }
      )
      await page.waitForTimeout(1500)

      // Type query into the search box and wait for client-side filtering
      const searchInput = await page.$('input[placeholder*="Search event"]')
      if (searchInput) {
        await searchInput.fill(query)
        await page.waitForTimeout(1500)
      }

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

        const cards = document.querySelectorAll(".event-card")

        cards.forEach((card) => {
          const link = card.querySelector("a[href*='/event/']") as HTMLAnchorElement | null
          if (!link) return

          const href = link.href
          const idMatch = href.match(/\/event\/(\d+)/)
          if (!idMatch) return

          const name = card.querySelector("h3 a, .event-title a")?.textContent?.trim() || ""
          if (!name) return

          const dateEl = card.querySelector(".date")
          const date = dateEl?.textContent?.trim() || ""
          const location = card.querySelector(".location")?.textContent?.replace(/\s+/g, " ").trim() || ""

          results.push({ id: idMatch[1], name, date, org: "", location, url: href, tags: [] })
        })

        return results
      })

      // No isBJJEvent filter here — user is explicitly searching, return all matching results
      return events
        .map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date ? new Date(`${e.date} ${new Date().getFullYear()}`) : new Date(),
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
    const page = await newPage(browser)
    try {
      // Smoothcomp uses /participants (not /competitors)
      const participantsUrl = `https://smoothcomp.com/en/event/${eventId}/participants`
      console.log("[scraper] getCompetitors:", participantsUrl)

      await page.goto(participantsUrl, { waitUntil: "networkidle", timeout: 30000 })

      // Check for private event redirect or error
      const pageUrl = page.url()
      console.log("[scraper] landed on:", pageUrl)
      if (pageUrl.includes("/login") || pageUrl.includes("/403") || pageUrl.includes("/401")) {
        throw new Error("PRIVATE_EVENT")
      }

      // Smoothcomp uses div-based layout (.participant-group, .profile-card), NOT tables.
      // Wait for the first batch to load via JS.
      try {
        await page.waitForSelector(".participant-group, .profile-card, table", { timeout: 15000 })
      } catch {
        const sample = await page.evaluate(() => document.body.innerText.substring(0, 800))
        console.log("[scraper] no participants found, page text:", sample)
      }

      // Smoothcomp uses intersection-observer lazy loading — groups only render
      // when they scroll into view. Scroll the whole page until group count stabilises.
      let prevGroupCount = -1
      let groupCount = 0
      let scrollPass = 0
      while (groupCount > prevGroupCount && scrollPass < 15) {
        prevGroupCount = groupCount
        const bodyHeight: number = await page.evaluate(() => document.body.scrollHeight)
        for (let y = 0; y <= bodyHeight; y += 400) {
          await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y)
          await page.waitForTimeout(80)
        }
        await page.waitForTimeout(1200) // let lazy observers fire
        groupCount = await page.evaluate(
          () => document.querySelectorAll(".participant-group").length
        )
        scrollPass++
        console.log(`[scraper] scroll pass ${scrollPass}: ${groupCount} groups`)
      }
      await page.evaluate(() => window.scrollTo(0, 0))

      const competitors = await page.evaluate(() => {
        const results: Array<{
          name: string
          team: string
          category: string
          weight: string
          belt: string
          profileUrl: string
        }> = []

        // --- Primary: div-based layout (.participant-group / .profile-card) ---
        const groups = document.querySelectorAll(".participant-group")

        if (groups.length > 0) {
          groups.forEach((group) => {
            // Group name is the division/category (e.g. "Adult / Male / Blue Belt / Light")
            const category = group.querySelector(".group-name")?.textContent?.trim() || ""

            const cards = group.querySelectorAll(".profile-card")
            cards.forEach((card) => {
              // Athlete name link (href = /en/profile/{id})
              const nameLink = card.querySelector(
                ".participant-td-athlete a[href*='/profile/'], .participant-td-athlete a[href*='/user/']"
              ) as HTMLAnchorElement | null
              const name = nameLink?.textContent?.trim() || ""
              if (!name || name.length < 2) return

              const profileUrl = nameLink?.href || ""

              // Team = the warning-colored badge under the name (gym name)
              const teamBadge = card.querySelector(".participant-td-athlete .text-warning")?.textContent?.trim() || ""
              // Club/affiliation fallback
              const clubLink = card.querySelector(".participant-td-club a")?.textContent?.trim() || ""
              const team = teamBadge || clubLink

              // Weight class from the registration column
              const weight =
                card.querySelector(".participant-td-registration .truncate-2-rows")?.textContent?.trim() || ""

              results.push({ name, team, category, weight, belt: "", profileUrl })
            })
          })
        } else {
          // --- Fallback: table-based layout ---
          const rows = document.querySelectorAll("table tr")
          rows.forEach((row) => {
            const cells = row.querySelectorAll("td")
            if (cells.length < 2) return

            const nameLink = row.querySelector(
              "a[href*='/profile/'], a[href*='/user/'], a[href*='/athlete/']"
            ) as HTMLAnchorElement | null
            const name = (nameLink?.textContent?.trim() || cells[0]?.textContent?.trim() || "").trim()
            if (!name || name.length < 2) return

            results.push({
              name,
              team: cells[1]?.textContent?.trim() || "",
              category: cells[2]?.textContent?.trim() || "",
              weight: cells[3]?.textContent?.trim() || "",
              belt: cells[4]?.textContent?.trim() || "",
              profileUrl: nameLink?.href || ""
            })
          })
        }

        return results
      })

      console.log(`[scraper] getCompetitors: found ${competitors.length} competitors`)
      return competitors
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
    const page = await newPage(browser)
    try {
      console.log("[scraper] getMatchHistory:", profileUrl)
      await page.goto(profileUrl, { waitUntil: "networkidle", timeout: 30000 })

      // Wait for results to load
      try {
        await page.waitForSelector(".event-result, .result-card, .profile-event, table", { timeout: 10000 })
      } catch { /* section may not exist */ }
      await page.waitForTimeout(2000)

      const matches = await page.evaluate(() => {
        const results: Array<{
          opponent: string
          result: "win" | "loss" | "draw"
          method: string
          event: string
          date: string
        }> = []

        // --- Try div-based result cards first ---
        const cards = document.querySelectorAll(
          ".event-result, .result-card, .profile-event, .match-result, [class*='result-row']"
        )

        if (cards.length > 0) {
          cards.forEach((card) => {
            const classList = Array.from(card.classList).join(" ").toLowerCase()
            const innerText = (card.textContent || "").toLowerCase()
            const result: "win" | "loss" | "draw" =
              classList.includes("win") || card.querySelector(".win, .result-win") !== null ? "win"
              : classList.includes("loss") || card.querySelector(".loss, .result-loss") !== null ? "loss"
              : innerText.includes("win") ? "win"
              : innerText.includes("loss") ? "loss"
              : "draw"

            const opponentLink = card.querySelector("a[href*='/profile/']") as HTMLAnchorElement | null
            const opponent = opponentLink?.textContent?.trim()
              || card.querySelector(".opponent, .vs-name, .athlete-name")?.textContent?.trim() || ""
            const method = card.querySelector(".method, .result-method, .submission-type")?.textContent?.trim() || ""
            const eventName = card.querySelector("a[href*='/event/'], .event-name, .competition-name")?.textContent?.trim() || ""
            const date = card.querySelector(".date, time, .result-date")?.textContent?.trim() || ""

            if (opponent && opponent.length > 1) {
              results.push({ opponent, result, method, event: eventName, date })
            }
          })
          return results
        }

        // --- Fallback: table rows ---
        document.querySelectorAll("table tr").forEach((row) => {
          const cells = row.querySelectorAll("td")
          if (cells.length < 2) return

          const resultText = (cells[0]?.textContent || "").trim().toLowerCase()
          const result: "win" | "loss" | "draw" =
            resultText.includes("win") ? "win"
            : resultText.includes("loss") ? "loss"
            : "draw"

          const opponentLink = row.querySelector("a[href*='/profile/']") as HTMLAnchorElement | null
          const opponent = opponentLink?.textContent?.trim() || cells[1]?.textContent?.trim() || ""
          const method = cells[2]?.textContent?.trim() || ""
          const eventName = cells[3]?.textContent?.trim() || ""
          const date = cells[4]?.textContent?.trim() || ""

          if (opponent && opponent.length > 1) {
            results.push({ opponent, result, method, event: eventName, date })
          }
        })

        return results
      })

      console.log(`[scraper] getMatchHistory: ${matches.length} matches`)
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
    const page = await newPage(browser)
    try {
      await page.goto(
        "https://smoothcomp.com/en/events/upcoming",
        { waitUntil: "networkidle", timeout: 30000 }
      )
      await page.waitForTimeout(2000)

      const pageUrl = page.url()
      console.log("[scraper] navigated to:", pageUrl)

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

        const cards = document.querySelectorAll(".event-card")

        cards.forEach((card) => {
          const link = card.querySelector("a[href*='/event/']") as HTMLAnchorElement | null
          if (!link) return

          const href = link.href
          const idMatch = href.match(/\/event\/(\d+)/)
          if (!idMatch) return

          const name = card.querySelector("h3 a, .event-title a")?.textContent?.trim() || ""
          if (!name) return

          const dateEl = card.querySelector(".date")
          const date = dateEl?.textContent?.trim() || ""
          const location = card.querySelector(".location")?.textContent?.replace(/\s+/g, " ").trim() || ""

          results.push({ id: idMatch[1], name, date, org: "", location, url: href, tags: [] })
        })

        return results
      })

      console.log("[scraper] raw events found:", events.length)
      const bjjEvents = events.filter((e) => isBJJEvent(e.name, e.tags))
      console.log("[scraper] BJJ events after filter:", bjjEvents.length, bjjEvents.slice(0, 3).map(e => e.name))
      return bjjEvents
        .map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date ? new Date(`${e.date} ${new Date().getFullYear()}`) : new Date(),
          org: e.org,
          location: e.location,
          url: e.url
        }))
    } catch (err) {
      console.error("getUpcomingEvents error:", err)
      return []
    } finally {
      await page.close()
    }
  })
}
