import type { MatchResult } from "../scraper/smoothcomp"

export interface AIProfileResult {
  summary: string
  submissionRate: number | null
  winRate: number | null
  dominantStyle: "submission-focused" | "points-based" | "defensive" | "unknown"
  notablePatterns: string[]
}

const INSUFFICIENT_DATA: AIProfileResult = {
  summary: "Insufficient match data for analysis.",
  submissionRate: null,
  winRate: null,
  dominantStyle: "unknown",
  notablePatterns: []
}

export async function generateAIProfile(
  name: string,
  matchHistory: MatchResult[]
): Promise<AIProfileResult> {
  if (matchHistory.length < 3) {
    return INSUFFICIENT_DATA
  }

  const prompt = `You are a BJJ scout analyst. Based on the following match history for ${name}, write a concise scouting report (3-5 sentences).

Identify:
- Preferred finishing method (submissions, points, etc.)
- Win rate and submission rate
- Any patterns visible in the data (quick finisher, defensive grinder, etc.)
- Note if data is insufficient for deep analysis

Match history:
${JSON.stringify(matchHistory, null, 2)}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "summary": "...",
  "submissionRate": 0.0 or null,
  "winRate": 0.0 or null,
  "dominantStyle": "submission-focused" | "points-based" | "defensive" | "unknown",
  "notablePatterns": ["...", "..."]
}`

  // Try OpenAI first, then Anthropic
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (openaiKey) {
    return callOpenAI(prompt, openaiKey)
  } else if (anthropicKey) {
    return callAnthropic(prompt, anthropicKey)
  }

  // No AI key — compute stats manually
  return computeManualStats(matchHistory)
}

async function callOpenAI(prompt: string, apiKey: string): Promise<AIProfileResult> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""
    return parseAIResponse(text)
  } catch (err) {
    console.error("OpenAI error:", err)
    return INSUFFICIENT_DATA
  }
}

async function callAnthropic(prompt: string, apiKey: string): Promise<AIProfileResult> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    })

    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
    const data = await res.json()
    const text = data.content?.[0]?.text || ""
    return parseAIResponse(text)
  } catch (err) {
    console.error("Anthropic error:", err)
    return INSUFFICIENT_DATA
  }
}

function parseAIResponse(text: string): AIProfileResult {
  try {
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return {
      summary: String(parsed.summary || ""),
      submissionRate: typeof parsed.submissionRate === "number" ? parsed.submissionRate : null,
      winRate: typeof parsed.winRate === "number" ? parsed.winRate : null,
      dominantStyle: ["submission-focused", "points-based", "defensive", "unknown"].includes(
        parsed.dominantStyle
      )
        ? parsed.dominantStyle
        : "unknown",
      notablePatterns: Array.isArray(parsed.notablePatterns)
        ? parsed.notablePatterns.slice(0, 4).map(String)
        : []
    }
  } catch {
    return INSUFFICIENT_DATA
  }
}

function computeManualStats(matchHistory: MatchResult[]): AIProfileResult {
  const total = matchHistory.length
  if (total === 0) return INSUFFICIENT_DATA

  const wins = matchHistory.filter((m) => m.result === "win").length
  const submissions = matchHistory.filter(
    (m) => m.result === "win" && m.method?.toLowerCase().includes("sub")
  ).length

  const winRate = wins / total
  const submissionRate = wins > 0 ? submissions / wins : 0

  let dominantStyle: AIProfileResult["dominantStyle"] = "unknown"
  if (submissionRate > 0.6) dominantStyle = "submission-focused"
  else if (winRate < 0.4) dominantStyle = "defensive"
  else dominantStyle = "points-based"

  return {
    summary: `Based on ${total} recorded matches, ${name} has a ${Math.round(winRate * 100)}% win rate with ${Math.round(submissionRate * 100)}% of wins by submission.`,
    submissionRate,
    winRate,
    dominantStyle,
    notablePatterns: []
  }
}
