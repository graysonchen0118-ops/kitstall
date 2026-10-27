import type { FactKey, Listing } from "./types";
import { list } from "./format";

// The buyer assistant answers ONLY from the confirmed listing: the maker's facts and the maker's own
// answers. When the facts are silent it says so and offers to ask the maker, instead of guessing.

export interface Answer {
  text: string;
  stated: boolean;
  from: FactKey | "policy" | null;
  /** the tool the buyer asked about, when the question was about compatibility */
  tool?: string;
}

const TOOLS: { name: string; alias: string[] }[] = [
  { name: "Google Sheets", alias: ["google sheets", "gsheets", "sheets"] },
  { name: "Microsoft Excel", alias: ["excel"] },
  { name: "Apple Numbers", alias: ["numbers", "apple numbers"] },
  { name: "LibreOffice", alias: ["libreoffice", "open office", "openoffice"] },
  { name: "Notion", alias: ["notion"] },
  { name: "Canva", alias: ["canva"] },
  { name: "Figma", alias: ["figma"] },
  { name: "Sketch", alias: ["sketch"] },
  { name: "Adobe XD", alias: ["adobe xd", "xd"] },
  { name: "Lightroom", alias: ["lightroom"] },
  { name: "Capture One", alias: ["capture one"] },
  { name: "Photoshop", alias: ["photoshop"] },
  { name: "Gmail", alias: ["gmail"] },
  { name: "Outlook", alias: ["outlook"] },
  { name: "Xero", alias: ["xero"] },
  { name: "QuickBooks", alias: ["quickbooks"] },
  { name: "Shopify", alias: ["shopify"] },
  { name: "WooCommerce", alias: ["woocommerce", "woo"] },
  { name: "GoodNotes", alias: ["goodnotes"] },
  { name: "Notability", alias: ["notability"] },
  { name: "iPad", alias: ["ipad"] },
  { name: "Mac", alias: ["mac", "macbook"] },
  { name: "Windows", alias: ["windows", "pc"] },
  { name: "WhatsApp", alias: ["whatsapp"] },
  { name: "PostgreSQL", alias: ["postgres", "postgresql"] },
  { name: "MySQL", alias: ["mysql"] },
  { name: "Kindle", alias: ["kindle"] },
  { name: "CapCut", alias: ["capcut"] },
  { name: "GarageBand", alias: ["garageband"] },
  { name: "Ableton", alias: ["ableton"] },
  { name: "FL Studio", alias: ["fl studio"] },
  { name: "Google Calendar", alias: ["google calendar"] },
  { name: "Instagram", alias: ["instagram"] },
  { name: "TikTok", alias: ["tiktok"] },
  { name: "WordPress", alias: ["wordpress"] },
];

const LANGS = ["english", "french", "spanish", "portuguese", "german", "italian", "dutch", "arabic", "japanese", "chinese", "korean", "hindi", "russian", "greek", "cyrillic"];

const norm = (s: string) => " " + s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ") + " ";

function findTool(q: string) {
  const n = norm(q);
  // longest alias first, so "google calendar" wins over "google sheets" style partials
  const all = TOOLS.flatMap((t) => t.alias.map((a) => ({ t, a }))).sort((x, y) => y.a.length - x.a.length);
  for (const { t, a } of all) if (n.includes(" " + a + " ")) return t;
  return null;
}

const mentions = (arr: string[], tool: { name: string; alias: string[] }) => arr.find((x) => tool.alias.some((a) => norm(x).includes(" " + a + " ")) || norm(x).includes(" " + tool.name.toLowerCase() + " "));

export function answer(l: Listing, question: string): Answer {
  const q = norm(question);
  const f = l.facts;
  const tool = findTool(question);

  // the maker already answered something close to this
  const prior = l.answers.find((a) => {
    const aq = norm(a.q);
    if (tool) return tool.alias.some((x) => aq.includes(" " + x + " "));
    const words = q.split(" ").filter((w) => w.length > 4);
    return words.length > 0 && words.filter((w) => aq.includes(w)).length >= Math.min(2, words.length);
  });
  if (prior) return { text: `The maker answered this: "${prior.a}"`, stated: true, from: "answers", tool: tool?.name };

  const compat = /\b(work|works|working|run|runs|open|opens|compatible|support|supports|use it|import|connect|connects|sync|syncs|in|with|on)\b/.test(q);
  if (tool && compat) {
    const yes = mentions(f.worksWith, tool);
    if (yes) return { text: `Yes. The maker lists it as working with ${yes}.`, stated: true, from: "worksWith", tool: tool.name };
    const no = mentions(f.notWith, tool);
    if (no) return { text: `No. The maker states it does not work with ${no}.`, stated: true, from: "notWith", tool: tool.name };
    const listed = f.worksWith.length ? ` It is listed for ${list(f.worksWith)}.` : "";
    return { text: `The maker hasn't said whether it works with ${tool.name}, so I won't guess.${listed}`, stated: false, from: null, tool: tool.name };
  }

  if (/\b(include|includes|included|come with|comes with|contain|contains|what s in|whats in|how many|what do i get|inside)\b/.test(q)) {
    if (f.includes.length) return { text: `It includes ${list(f.includes.map((x) => x[0].toLowerCase() + x.slice(1)))}.`, stated: true, from: "includes" };
  }
  if (/\b(licen[cs]e|commercial|client work|clients|resell|resale|sell it|business use|business)\b/.test(q)) {
    if (f.license) return { text: `The license covers ${f.license[0].toLowerCase() + f.license.slice(1)}.`, stated: true, from: "license" };
  }
  const lang = LANGS.find((x) => q.includes(" " + x + " "));
  if (lang || /\b(language|languages|translated|translation)\b/.test(q)) {
    if (lang && !f.language.toLowerCase().includes(lang)) return { text: `The maker hasn't mentioned ${lang[0].toUpperCase() + lang.slice(1)}. The listing says: ${f.language}.`, stated: false, from: null };
    return { text: `Language: ${f.language}.`, stated: true, from: "language" };
  }
  if (/\b(version|updated|update|updates|latest|new|recent)\b/.test(q)) {
    return { text: `It's version ${f.version}, last updated on ${f.updated}.`, stated: true, from: "version" };
  }
  if (/\b(format|file|files|download|type of file|xlsx|pdf)\b/.test(q)) {
    return { text: `You get ${f.format[0].toLowerCase() + f.format.slice(1)}.`, stated: true, from: "format" };
  }
  if (/\b(who|for me|beginner|suitable|right for)\b/.test(q)) {
    return { text: `The maker made it for ${f.madeFor[0].toLowerCase() + f.madeFor.slice(1)}.`, stated: true, from: "madeFor" };
  }
  if (/\b(refund|money back|return)\b/.test(q)) {
    return { text: "Kitstall refunds any file that doesn't match its listing within 14 days.", stated: true, from: "policy" };
  }
  if (tool) {
    return { text: `The maker hasn't said anything about ${tool.name}, so I won't guess.`, stated: false, from: null, tool: tool.name };
  }
  return { text: "The maker hasn't covered that in the listing, so I won't guess.", stated: false, from: null };
}

/** suggested questions under the assistant, including one the facts can't answer */
export function suggestions(l: Listing): string[] {
  const f = l.facts;
  const out: string[] = [];
  const probe: Record<string, string> = {
    Spreadsheets: "Google Sheets",
    Planners: "iPad",
    "UI kits": "Sketch",
    "Code kits": "MySQL",
    "Prompt packs": "Notion",
    "AI agents": "QuickBooks",
    "Photo presets": "Capture One",
    Audio: "GarageBand",
    Fonts: "Canva",
    Guides: "Kindle",
    "Social templates": "Instagram",
  };
  const p = probe[l.category];
  const tryTools = [p, "Google Sheets", "Apple Numbers", "WordPress"].filter(Boolean);
  for (const t of tryTools) {
    const listed = [...f.worksWith, ...f.notWith].some((x) => x.toLowerCase().includes(t.toLowerCase()));
    if (!listed) {
      out.push(`Does it work with ${t}?`);
      break;
    }
  }
  if (f.notWith.length) out.push(`Does it work with ${f.notWith[0].split(" ")[0] === "Microsoft" ? "Excel" : f.notWith[0]}?`);
  out.push("What's included?");
  out.push("Can I use it for client work?");
  out.push("When was it last updated?");
  return Array.from(new Set(out)).slice(0, 4);
}
