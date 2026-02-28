import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// TTL constants in milliseconds
const TTL = {
  EVENT: 6 * 60 * 60 * 1000,       // 6 hours
  COMPETITOR: 1 * 60 * 60 * 1000,  // 1 hour
  PROFILE: 7 * 24 * 60 * 60 * 1000 // 7 days
}

function isStale(cachedAt: Date, ttl: number): boolean {
  return Date.now() - cachedAt.getTime() > ttl
}

// ─── Event Cache ────────────────────────────────────────────────────────────

export async function getCachedEvent(smoothcompId: string) {
  const cached = await prisma.eventCache.findUnique({ where: { smoothcompId } })
  if (!cached) return null
  if (isStale(cached.cachedAt, TTL.EVENT)) return null
  return cached
}

export async function setCachedEvent(data: {
  smoothcompId: string
  name: string
  date: Date
  org: string
  location: string
  data: object
}) {
  return prisma.eventCache.upsert({
    where: { smoothcompId: data.smoothcompId },
    update: { ...data, cachedAt: new Date() },
    create: data
  })
}

export async function searchCachedEvents(query: string) {
  const normalised = query.toLowerCase()
  const all = await prisma.eventCache.findMany()
  return all.filter(
    (e) =>
      e.name.toLowerCase().includes(normalised) &&
      !isStale(e.cachedAt, TTL.EVENT)
  )
}

// ─── Competitor Cache ────────────────────────────────────────────────────────

export async function getCachedCompetitors(smoothcompId: string) {
  const records = await prisma.competitorCache.findMany({
    where: { smoothcompId }
  })
  if (!records.length) return null
  if (isStale(records[0].cachedAt, TTL.COMPETITOR)) return null
  return records
}

export async function setCachedCompetitors(
  smoothcompId: string,
  competitors: Array<{
    name: string
    category: string
    team: string
    matchHistory: object
  }>
) {
  await prisma.competitorCache.deleteMany({ where: { smoothcompId } })
  return prisma.competitorCache.createMany({
    data: competitors.map((c) => ({ smoothcompId, ...c }))
  })
}

// ─── Profile Cache ───────────────────────────────────────────────────────────

export async function getCachedProfile(competitorName: string) {
  const cached = await prisma.profileCache.findUnique({
    where: { competitorName }
  })
  if (!cached) return null
  if (isStale(cached.cachedAt, TTL.PROFILE)) return null
  return cached
}

export async function setCachedProfile(data: {
  competitorName: string
  instagramUrl?: string | null
  youtubeUrl?: string | null
  notableVideoUrl?: string | null
  styleProfile: string
  submissionRate?: number | null
  winRate?: number | null
}) {
  return prisma.profileCache.upsert({
    where: { competitorName: data.competitorName },
    update: { ...data, cachedAt: new Date() },
    create: data
  })
}
