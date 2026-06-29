import type { Boutique } from "@/types";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
].sort((a, b) => b.length - a.length);

/** ISO-style state codes → canonical state names. */
const STATE_ABBREVIATIONS: Record<string, string> = {
  an: "Andaman and Nicobar Islands",
  ap: "Andhra Pradesh",
  ar: "Arunachal Pradesh",
  as: "Assam",
  br: "Bihar",
  cg: "Chhattisgarh",
  ch: "Chandigarh",
  dl: "Delhi",
  ga: "Goa",
  gj: "Gujarat",
  hp: "Himachal Pradesh",
  hr: "Haryana",
  jh: "Jharkhand",
  jk: "Jammu and Kashmir",
  ka: "Karnataka",
  kl: "Kerala",
  la: "Ladakh",
  ld: "Lakshadweep",
  mh: "Maharashtra",
  ml: "Meghalaya",
  mn: "Manipur",
  mp: "Madhya Pradesh",
  mz: "Mizoram",
  nl: "Nagaland",
  od: "Odisha",
  or: "Odisha",
  pb: "Punjab",
  py: "Puducherry",
  rj: "Rajasthan",
  sk: "Sikkim",
  tg: "Telangana",
  tn: "Tamil Nadu",
  tr: "Tripura",
  ts: "Telangana",
  uk: "Uttarakhand",
  up: "Uttar Pradesh",
  wb: "West Bengal",
};

/** Major cities / aliases → state (when address has no explicit state). */
const CITY_TO_STATE: Record<string, string> = {
  mumbai: "Maharashtra",
  bombay: "Maharashtra",
  pune: "Maharashtra",
  nagpur: "Maharashtra",
  thane: "Maharashtra",
  "navi mumbai": "Maharashtra",
  kolkata: "West Bengal",
  calcutta: "West Bengal",
  howrah: "West Bengal",
  bengaluru: "Karnataka",
  bangalore: "Karnataka",
  chennai: "Tamil Nadu",
  madras: "Tamil Nadu",
  hyderabad: "Telangana",
  secunderabad: "Telangana",
  ahmedabad: "Gujarat",
  surat: "Gujarat",
  vadodara: "Gujarat",
  jaipur: "Rajasthan",
  lucknow: "Uttar Pradesh",
  noida: "Uttar Pradesh",
  ghaziabad: "Uttar Pradesh",
  gurugram: "Haryana",
  gurgaon: "Haryana",
  faridabad: "Haryana",
  chandigarh: "Chandigarh",
  bhopal: "Madhya Pradesh",
  indore: "Madhya Pradesh",
  patna: "Bihar",
  kochi: "Kerala",
  cochin: "Kerala",
  thiruvananthapuram: "Kerala",
  visakhapatnam: "Andhra Pradesh",
  vijayawada: "Andhra Pradesh",
  guwahati: "Assam",
  ranchi: "Jharkhand",
  dehradun: "Uttarakhand",
};

const PINCODE_RE = /\b\d{6}\b/g;

function cleanPart(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function stripPincode(text: string): string {
  return text.replace(PINCODE_RE, "").replace(/\s+/g, " ").replace(/,\s*/g, ", ").replace(/,\s*$/g, "").trim();
}

function isPincodeOnly(text: string): boolean {
  return /^\d{6}$/.test(text.trim());
}

/** Match a segment to a canonical Indian state/UT name (never includes pincode). */
function matchIndianState(text: string): string | null {
  const cleaned = stripPincode(text.trim());
  if (!cleaned || isPincodeOnly(cleaned)) return null;

  const lower = cleaned.toLowerCase();
  for (const stateName of INDIAN_STATES) {
    if (lower === stateName.toLowerCase()) return stateName;
  }

  for (const stateName of INDIAN_STATES) {
    const suffix = stateName.toLowerCase();
    if (lower === suffix || lower.endsWith(` ${suffix}`)) {
      return stateName;
    }
  }

  return null;
}

function inferStateFromPlaceName(text: string): string | null {
  const cleaned = stripPincode(text.trim());
  if (!cleaned) return null;

  const candidates = new Set<string>([
    cleaned,
    cleaned.split(" - ")[0]?.trim() ?? "",
    cleaned.split(",")[0]?.trim() ?? "",
  ]);
  for (const part of cleaned.split(/\s+/)) {
    if (part.length >= 2) candidates.add(part);
  }

  for (const candidate of candidates) {
    if (!candidate) continue;

    const directState = matchIndianState(candidate);
    if (directState) return directState;

    const lower = candidate.toLowerCase();
    if (/^[a-z]{2}$/i.test(candidate)) {
      const fromAbbr = STATE_ABBREVIATIONS[lower];
      if (fromAbbr) return fromAbbr;
    }

    const fromCity = CITY_TO_STATE[lower];
    if (fromCity) return fromCity;
  }

  return null;
}

function extractStateFromSegments(segments: string[]): string | null {
  for (let i = segments.length - 1; i >= 0; i--) {
    const direct = matchIndianState(segments[i]);
    if (direct) return direct;

    const tail = segments.slice(i).join(" ");
    const tailMatch = matchIndianState(tail);
    if (tailMatch) return tailMatch;
  }
  return null;
}

function parseUnstructuredLine(text: string): {
  area?: string;
  city?: string;
  state?: string;
} {
  const trimmed = stripPincode(text.trim());
  if (!trimmed) return {};

  if (trimmed.includes(",")) {
    const parts = trimmed
      .split(",")
      .map((p) => stripPincode(p.trim()))
      .filter(Boolean);

    const state = extractStateFromSegments(parts);
    if (!state) {
      if (parts.length === 1) return { city: parts[0] };
      return { city: parts[parts.length - 1] };
    }

    let stateIdx = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (matchIndianState(parts[i])) {
        stateIdx = i;
        break;
      }
    }

    if (stateIdx <= 0) return { state };

    const cityCandidate = parts[stateIdx - 1];
    if (matchIndianState(cityCandidate)) {
      return { state, area: parts[0] };
    }

    if (stateIdx >= 2) {
      return { area: parts[0], city: cityCandidate, state };
    }

    return { city: cityCandidate, state };
  }

  const lower = trimmed.toLowerCase();
  for (const stateName of INDIAN_STATES) {
    const suffix = stateName.toLowerCase();
    if (lower === suffix) return { state: stateName };
    if (lower.endsWith(` ${suffix}`)) {
      const before = stripPincode(trimmed.slice(0, trimmed.length - stateName.length));
      const words = before.split(/\s+/).filter((w) => !isPincodeOnly(w));
      if (words.length >= 2) {
        return {
          area: words.slice(0, -1).join(" "),
          city: words[words.length - 1],
          state: stateName,
        };
      }
      if (words.length === 1) {
        return { city: words[0], state: stateName };
      }
      return { state: stateName };
    }
  }

  const words = trimmed.split(/\s+/).filter((w) => !isPincodeOnly(w));
  if (words.length >= 2) {
    const lastState = matchIndianState(words[words.length - 1]);
    if (lastState) {
      return {
        city: words[words.length - 2],
        state: lastState,
        area: words.length > 2 ? words.slice(0, -2).join(" ") : undefined,
      };
    }
  }

  if (words.length === 1) {
    const onlyState = matchIndianState(words[0]);
    if (onlyState) return { state: onlyState };
    return { city: words[0] };
  }

  return { city: trimmed };
}

function isShortLocality(value: string): boolean {
  const v = stripPincode(value);
  if (!v || v.includes(",")) return false;
  if (matchIndianState(v)) return false;
  if (isPincodeOnly(v)) return false;
  return true;
}

function resolveLocationParts(boutique: Boutique): {
  area: string | null;
  city: string | null;
  state: string | null;
} {
  const sources = [
    boutique.full_address,
    boutique.address,
    boutique.location,
  ]
    .map(cleanPart)
    .filter(Boolean) as string[];

  if (sources.length === 0) {
    return { area: null, city: null, state: null };
  }

  let area: string | null = null;
  let city: string | null = null;
  let state: string | null = null;

  for (const raw of sources) {
    const parsed = parseUnstructuredLine(raw);
    area = area ?? cleanPart(parsed.area);
    city = city ?? cleanPart(parsed.city);
    state = state ?? (parsed.state ? matchIndianState(parsed.state) : null);
    if (state) break;
  }

  if (!state) {
    for (const raw of sources) {
      const matched = matchIndianState(raw);
      if (matched) {
        state = matched;
        break;
      }
    }
  }

  if (!state) {
    for (const raw of sources) {
      const inferred = inferStateFromPlaceName(raw);
      if (inferred) {
        state = inferred;
        break;
      }
    }
  }

  return { area, city, state };
}

export function getBoutiqueCity(boutique: Boutique): string | null {
  const loc = cleanPart(boutique.location);
  if (loc && isShortLocality(loc) && !matchIndianState(loc)) {
    return stripPincode(loc);
  }

  const { city, area } = resolveLocationParts(boutique);
  return city ?? area ?? (loc ? stripPincode(loc) : null);
}

export function getBoutiqueState(boutique: Boutique): string | null {
  return resolveLocationParts(boutique).state;
}
