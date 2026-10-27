import type { Call, DayStat, Feature, Listing } from "../types";
import { BASE_NOW, DAY, HOUR, MIN, seeded } from "../rand";
import { ASSIST_COST, INDEX_COST, QUERY_COST } from "../writer";

export const MODEL: Record<Feature, string> = {
  write: "writer, large",
  index: "embeddings, small",
  query: "embeddings, small",
  assist: "assistant, mid",
};

export const FEATURE_LABEL: Record<Feature, string> = {
  write: "Listing writer",
  index: "Search index",
  query: "Search query",
  assist: "Buyer assistant",
};

export const FEATURE_WHEN: Record<Feature, string> = {
  write: "Once, when a maker saves a listing",
  index: "Once, when a maker saves a listing",
  query: "When a buyer searches by meaning",
  assist: "When a buyer asks about a product",
};

/** what one writer call costs on average, used for the "on every page view" comparison */
export const WRITE_AVG = 0.0045;

export const TODAY = Date.UTC(2026, 9, 28);
export const VIRAL_DAY = Date.UTC(2026, 9, 17);

export function buildDays(): DayStat[] {
  const r = seeded(4021);
  const out: DayStat[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = TODAY - i * DAY;
    const dow = new Date(day).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const trend = 1 + (29 - i) * 0.006;
    let visits = Math.round((weekend ? 1560 : 2060) * trend * (0.92 + r() * 0.16));
    let sales = Math.round((weekend ? 33 : 41) * trend * (0.86 + r() * 0.28));
    let extra = 0;
    if (day === VIRAL_DAY) {
      extra = 5300;
      visits += extra;
      sales += 6;
    }
    if (i === 0) {
      // today, up to 10:20
      visits = Math.round(visits * 0.41);
      sales = Math.round(sales * 0.38);
    }
    const writes = i === 0 ? 3 : Math.round((weekend ? 6 : 11) * (0.7 + r() * 0.6));
    const queries = Math.round((visits - extra) * 0.32 + extra * 0.05);
    const asks = Math.round(sales * 3.1 * (0.85 + r() * 0.3) + extra * 0.002);
    const wc = writes * (0.0039 + r() * 0.0012);
    out.push({
      day,
      visits,
      sales,
      calls: { write: writes, index: writes, query: queries, assist: asks },
      cost: { write: wc, index: writes * INDEX_COST, query: queries * QUERY_COST, assist: asks * ASSIST_COST },
    });
  }
  return out;
}

const QUERIES = [
  "invoice template for freelancers",
  "get paid faster by my clients",
  "wedding guest list",
  "lofi drums",
  "instagram posts for my bakery",
  "starter code for a subscription app",
  "font for a kids brand",
  "budget sheet for a couple",
  "remind clients about appointments",
  "film look presets",
  "podcast intro music",
  "plan my week",
  "track stock in my shop",
  "vat for sole traders",
  "reply to google reviews",
  "landing page for my launch",
  "content calendar",
  "how to price my design work",
  "dashboard ui",
  "travel packing list",
  "sounds for my app",
  "cold emails to find clients",
  "lesson plans",
  "real estate posts",
];

export function buildCalls(listings: Listing[]): Call[] {
  const r = seeded(7781);
  const live = listings.filter((l) => l.status === "live");
  const weights = live.map((l) => l.views30 + 200);
  const total = weights.reduce((a, b) => a + b, 0);
  const pickL = () => {
    let x = r() * total;
    for (let i = 0; i < live.length; i++) {
      x -= weights[i];
      if (x <= 0) return live[i];
    }
    return live[0];
  };
  const calls: Call[] = [];
  let n = 0;
  const id = () => `c${(100000 + ++n).toString(36)}`;
  const start = BASE_NOW - 12 * HOUR;
  // hourly rhythm in UTC: quieter overnight in Europe and the Americas
  const busy = (t: number) => {
    const h = new Date(t).getUTCHours();
    return h >= 1 && h <= 5 ? 0.45 : h >= 6 && h <= 9 ? 0.8 : 1;
  };
  for (let t = start; t < BASE_NOW; t += MIN) {
    const b = busy(t);
    if (r() < 0.42 * b) {
      const sel = r() < 0.46;
      calls.push({ id: id(), at: t + Math.round(r() * 50) * 1000, feature: "query", model: MODEL.query, listingId: null, tokensIn: 6 + Math.round(r() * 8), tokensOut: 0, cost: QUERY_COST, ms: 40 + Math.round(r() * 80), outcome: sel ? "clicked" : "no click", note: QUERIES[Math.floor(r() * QUERIES.length)] });
    }
    if (r() < 0.085 * b) {
      const l = pickL();
      const o = r();
      calls.push({ id: id(), at: t + Math.round(r() * 50) * 1000, feature: "assist", model: MODEL.assist, listingId: l.id, tokensIn: 440 + Math.round(r() * 220), tokensOut: 45 + Math.round(r() * 60), cost: ASSIST_COST * (0.85 + r() * 0.3), ms: 700 + Math.round(r() * 900), outcome: o < 0.82 ? "helpful" : o < 0.88 ? "unhelpful" : "pending" });
    }
    if (r() < 0.009 * b) {
      const l = pickL();
      const o = r();
      const at = t + Math.round(r() * 50) * 1000;
      calls.push({ id: id(), at, feature: "write", model: MODEL.write, listingId: l.id, tokensIn: 560 + Math.round(r() * 180), tokensOut: 150 + Math.round(r() * 90), cost: 0.0039 + r() * 0.0012, ms: 2200 + Math.round(r() * 2600), outcome: o < 0.71 ? "kept" : o < 0.94 ? "edited" : "rejected", note: "Maker edited the listing" });
      calls.push({ id: id(), at: at + 4000, feature: "index", model: MODEL.index, listingId: l.id, tokensIn: 220 + Math.round(r() * 90), tokensOut: 0, cost: INDEX_COST, ms: 120 + Math.round(r() * 180), outcome: "kept" });
    }
  }
  return calls.sort((a, b) => b.at - a.at);
}
