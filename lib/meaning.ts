// Search by meaning. Every listing is turned into a vector of concepts once, when it is written,
// and stored. A buyer's words go through the same map at search time, so "get paid faster by my
// clients" finds the invoice kits even though none of them uses those words.

export const CONCEPTS: Record<string, string[]> = {
  invoicing: ["invoic", "bill", "paid", "pay", "payment", "overdue", "late", "chase", "chasing", "collect", "receivable", "remind"],
  freelance: ["freelanc", "self-employ", "contractor", "solo", "independent", "consultant", "gig", "sole"],
  clients: ["client", "customer", "buyer", "lead", "prospect", "crm", "proposal", "quot", "estimate"],
  budget: ["budget", "expense", "spend", "saving", "money", "finance", "cashflow", "cash", "debt", "income", "forecast"],
  tax: ["tax", "vat", "receipt", "deduct", "accountant", "bookkeep", "mileage", "quarter"],
  planning: ["plan", "planner", "schedul", "calendar", "week", "daily", "habit", "goal", "routine", "organi", "productiv", "todo", "task", "focus", "journal"],
  wedding: ["wedding", "bride", "groom", "guest", "venue", "ceremony", "rsvp", "marry", "engag"],
  travel: ["travel", "trip", "itinerar", "vacation", "holiday", "packing", "journey", "city", "golden"],
  design: ["design", "=ui", "=ux", "figma", "wirefram", "mockup", "prototyp", "component", "interface", "screen", "onboard"],
  mobile: ["mobile", "=app", "=apps", "=ios", "android", "phone"],
  web: ["website", "landing", "web", "site", "portfolio", "seo", "widget"],
  code: ["code", "developer", "starter", "boilerplate", "=api", "backend", "frontend", "=script", "=scripts", "source", "typescript", "python", "webhook", "mono", "programm"],
  saas: ["saas", "subscription", "login", "signup", "sign-up", "dashboard", "admin", "billing", "startup"],
  automation: ["automat", "agent", "=bot", "=bots", "workflow", "repetitive", "chore", "autopilot", "assistant", "hands-off"],
  email: ["email", "inbox", "newsletter", "mail", "reply", "replies", "outreach", "cold"],
  support: ["support", "ticket", "helpdesk", "faq", "question", "review", "complain"],
  shop: ["shop", "store", "ecommerce", "e-commerce", "product", "inventory", "stock", "order", "sell", "seller", "retail", "warehouse"],
  writing: ["writ", "copy", "blog", "article", "story", "prompt", "caption", "description", "notes", "words"],
  marketing: ["market", "launch", "brand", "campaign", "=ads", "growth", "audience", "promo", "sales"],
  social: ["social", "instagram", "tiktok", "reel", "=post", "=posts", "carousel", "content", "creator", "youtube", "followers"],
  photo: ["photo", "preset", "lightroom", "portrait", "camera", "picture", "skin", "film", "edit"],
  video: ["video", "youtube", "reel", "motion", "clip", "caption", "short"],
  audio: ["audio", "sound", "music", "beat", "sample", "loop", "drum", "jingle", "sfx", "percussion", "lo-fi", "lofi", "intro", "stinger"],
  podcast: ["podcast", "episode", "interview", "=show", "intro", "=host"],
  fonts: ["font", "typeface", "=type", "lettering", "serif", "=script", "display", "handwrit", "brush"],
  learning: ["learn", "course", "guide", "ebook", "e-book", "lesson", "tutorial", "beginner", "basics", "teach", "workbook", "study"],
  school: ["teacher", "classroom", "student", "school", "kid", "children", "parent", "rubric"],
  food: ["recipe", "restaurant", "menu", "cafe", "café", "food", "kitchen", "bakery", "bake", "meal", "delivery", "order"],
  booking: ["booking", "appointment", "reminder", "no-show", "reschedul", "salon", "clinic"],
  realestate: ["real estate", "realtor", "property", "=house", "=houses", "apartment", "=rent", "rental"],
  family: ["family", "household", "couple", "=home", "kids", "gift", "christmas"],
  time: ["=time", "hour", "timesheet", "tracker", "track", "minutes", "faster", "quick", "fast"],
};

const STOP = new Set(["the", "and", "for", "with", "my", "our", "your", "you", "can", "get", "how", "what", "that", "this", "from", "into", "some", "something", "need", "want", "help", "make", "a", "an", "to", "of", "in", "on", "by", "is", "it", "me", "i", "we", "do", "does", "are", "be", "all", "more", "less", "like", "just", "so", "about"]);

export type Vec = Record<string, number>;

export function words(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\- ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** the concepts a piece of text touches, with how strongly */
export function vectorize(text: string): Vec {
  const v: Vec = {};
  const ws = words(text);
  const joined = " " + ws.join(" ") + " ";
  for (const [concept, stems] of Object.entries(CONCEPTS)) {
    let hits = 0;
    for (const stem of stems) {
      if (stem.includes(" ")) {
        if (joined.includes(" " + stem)) hits++;
        continue;
      }
      if (stem.startsWith("=")) {
        const exact = stem.slice(1);
        for (const w of ws) if (w === exact) hits++;
        continue;
      }
      for (const w of ws) if (w.startsWith(stem)) hits++;
    }
    if (hits) v[concept] = Math.min(3, hits);
  }
  return v;
}

export function cosine(a: Vec, b: Vec) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k in a) {
    na += a[k] * a[k];
    if (b[k]) dot += a[k] * b[k];
  }
  for (const k in b) nb += b[k] * b[k];
  if (!na || !nb) return 0;
  return dot / Math.sqrt(na * nb);
}

/** concept names shown to the buyer as "matched on" chips */
export const CONCEPT_LABEL: Record<string, string> = {
  invoicing: "getting paid",
  freelance: "freelancers",
  clients: "clients",
  budget: "money",
  tax: "taxes",
  planning: "planning",
  wedding: "weddings",
  travel: "travel",
  design: "design",
  mobile: "mobile apps",
  web: "websites",
  code: "code",
  saas: "subscriptions",
  automation: "automation",
  email: "email",
  support: "customer questions",
  shop: "selling products",
  writing: "writing",
  marketing: "marketing",
  social: "social media",
  photo: "photos",
  video: "video",
  audio: "sound",
  podcast: "podcasts",
  fonts: "type",
  learning: "learning",
  school: "teaching",
  food: "food",
  booking: "appointments",
  realestate: "real estate",
  family: "home",
  time: "time",
};

/** the shared concepts between a query and a listing, strongest first */
export function overlap(q: Vec, l: Vec) {
  return Object.keys(q)
    .filter((k) => l[k])
    .sort((a, b) => q[b] * l[b] - q[a] * l[a])
    .map((k) => CONCEPT_LABEL[k] ?? k);
}

/** the old way: every word of the query has to appear in the listing text */
export function keywordMatch(query: string, text: string) {
  const ws = words(query).filter((w) => w.length > 2);
  if (!ws.length) return false;
  const hay = " " + words(text).join(" ") + " ";
  return ws.every((w) => hay.includes(" " + w) || hay.includes(w));
}
