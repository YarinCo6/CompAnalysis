export interface RulesetInfo {
  name: string
  url: string
}

const RULESET_MAP: Record<string, RulesetInfo> = {
  IBJJF: {
    name: "IBJJF Rules",
    url: "https://ibjjf.com/rules"
  },
  ADCC: {
    name: "ADCC Rules",
    url: "https://adcombat.com/adcc-rules/"
  },
  NAGA: {
    name: "NAGA Rules",
    url: "https://www.nagafighter.com/index.php/rules"
  },
  "Abu Dhabi World Pro": {
    name: "UAEJJF Rules",
    url: "https://www.uaejjf.com/en/rules"
  },
  UAEJJF: {
    name: "UAEJJF Rules",
    url: "https://www.uaejjf.com/en/rules"
  },
  "Polaris Pro": {
    name: "Polaris Rules",
    url: "https://www.polarisbjj.com/rules"
  },
  "EBI": {
    name: "EBI Rules",
    url: "https://www.ebifc.com/rules"
  },
  "FloGrappling": {
    name: "FloGrappling Event Rules",
    url: "https://www.flograppling.com"
  },
  "F2W": {
    name: "Fight 2 Win Rules",
    url: "https://fight2winpro.com/rules"
  },
  "Fight 2 Win": {
    name: "Fight 2 Win Rules",
    url: "https://fight2winpro.com/rules"
  },
  "Israeli Grappling Federation": {
    name: "IGF Rules",
    url: "https://www.google.com/search?q=Israeli+Grappling+Federation+BJJ+grappling+rules"
  },
  "IGF": {
    name: "IGF Rules",
    url: "https://www.google.com/search?q=Israeli+Grappling+Federation+BJJ+grappling+rules"
  },
  "Israeli BJJ Federation": {
    name: "Israeli BJJ Federation Rules",
    url: "https://www.google.com/search?q=Israeli+BJJ+Federation+grappling+rules"
  }
}

export function getRulesetForOrg(org: string): RulesetInfo {
  // Direct match
  if (RULESET_MAP[org]) return RULESET_MAP[org]

  // Case-insensitive partial match
  const orgLower = org.toLowerCase()
  for (const [key, value] of Object.entries(RULESET_MAP)) {
    if (orgLower.includes(key.toLowerCase()) || key.toLowerCase().includes(orgLower)) {
      return value
    }
  }

  // Fallback: Google search
  return {
    name: `${org} Rules`,
    url: `https://www.google.com/search?q=${encodeURIComponent(org + " BJJ grappling rules")}`
  }
}
