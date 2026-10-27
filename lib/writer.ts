import type { Category, Facts, Held, Kind, Sentence } from "./types";
import { list } from "./format";

// The listing writer runs ONCE, when a maker saves a listing, and only from the maker's own facts.
// Every sentence carries the field it came from. What a model likes to add on its own
// ("works in Google Sheets too", "50+ templates") is held back unless a fact supports it.

const NOUN: Record<Category, string> = {
  Spreadsheets: "spreadsheet template",
  Planners: "planner",
  "UI kits": "design kit",
  "Code kits": "code kit",
  "Prompt packs": "prompt pack",
  "AI agents": "small business agent",
  "Photo presets": "preset collection",
  Audio: "sound pack",
  Fonts: "typeface",
  Guides: "guide",
  "Social templates": "template set",
};

const PROPER = new Set(["Excel", "Microsoft", "Google", "Notion", "Canva", "Figma", "Lightroom", "Python", "JavaScript", "TypeScript", "HTML", "Node", "Shopify", "WooCommerce", "Gmail", "Outlook", "Xero", "WhatsApp", "GoodNotes", "Notability", "CapCut", "Kitstall"]);
const lower = (s: string) => {
  if (!s) return s;
  const w = s.split(/[\s,(]/)[0];
  if (PROPER.has(w) || (w.length > 1 && w === w.toUpperCase())) return s;
  return s[0].toLowerCase() + s.slice(1);
};
const has = (arr: string[], word: string) => arr.some((x) => x.toLowerCase().includes(word.toLowerCase()));

/** the claims a writer model tends to add on its own, by category, with the fact that would allow each */
const TEMPTING: Record<Category, { text: string; allowed: (f: Facts) => boolean; reason: string }[]> = {
  Spreadsheets: [
    { text: "Works just as well in Google Sheets and Apple Numbers.", allowed: (f) => has(f.worksWith, "google sheets") && has(f.worksWith, "numbers"), reason: "Not in your Works with list. Add it there if it is true." },
    { text: "Includes 50+ ready-made templates.", allowed: (f) => f.includes.length >= 50, reason: `Your Includes list has fewer items than that.` },
    { text: "Saves you hours every week.", allowed: () => false, reason: "No fact supports a time saving." },
  ],
  Planners: [
    { text: "Syncs automatically with your phone calendar.", allowed: (f) => has(f.worksWith, "calendar"), reason: "Not in your Works with list." },
    { text: "Loved by thousands of planners worldwide.", allowed: () => false, reason: "Popularity claims are not part of your facts." },
  ],
  "UI kits": [
    { text: "Fully compatible with every design tool.", allowed: () => false, reason: "Your facts name specific tools only." },
    { text: "Includes 500+ components.", allowed: (f) => f.includes.some((x) => /\b([5-9]\d\d|\d{4,})\b/.test(x)), reason: "Your Includes list states a smaller number." },
  ],
  "Code kits": [
    { text: "Production ready with zero configuration.", allowed: () => false, reason: "Setup effort is not stated in your facts." },
    { text: "Works with any database.", allowed: (f) => has(f.worksWith, "any database"), reason: "Your Works with list names one database." },
  ],
  "Prompt packs": [
    { text: "Guaranteed to double your conversions.", allowed: () => false, reason: "Results are not something the facts can state." },
  ],
  "AI agents": [
    { text: "Replies to every customer instantly, 24/7.", allowed: () => false, reason: "Response time is not in your facts." },
    { text: "Connects to any email provider.", allowed: (f) => has(f.worksWith, "any email"), reason: "Your Works with list names specific providers." },
  ],
  "Photo presets": [
    { text: "Works in every photo editor.", allowed: () => false, reason: "Your Works with list names specific apps." },
  ],
  Audio: [
    { text: "Cleared for film and TV broadcast.", allowed: (f) => /broadcast|film|tv/i.test(f.license), reason: "Your license does not mention broadcast." },
  ],
  Fonts: [
    { text: "Supports every language.", allowed: () => false, reason: "Your Language field lists specific scripts." },
  ],
  Guides: [
    { text: "Written by a top industry expert.", allowed: () => false, reason: "Credentials are not part of your facts." },
  ],
  "Social templates": [
    { text: "Proven to grow your followers fast.", allowed: () => false, reason: "Results are not something the facts can state." },
  ],
};

export interface Draft {
  sentences: Sentence[];
  held: Held[];
  tags: string[];
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export function writeListing(title: string, category: Category, kind: Kind, f: Facts): Draft {
  const s: Sentence[] = [];
  const noun = kind === "agent" ? "agent that runs for you" : NOUN[category];
  s.push({ text: `${title} is a ${noun} made for ${lower(f.madeFor)}.`, from: "madeFor" });
  if (f.includes.length) s.push({ text: `It comes with ${list(f.includes.map(lower))}.`, from: "includes" });
  if (f.worksWith.length) s.push({ text: `It works with ${list(f.worksWith)}.`, from: "worksWith" });
  if (f.notWith.length) s.push({ text: `It does not work with ${list(f.notWith)}.`, from: "notWith" });
  if (f.format) s.push({ text: `You get ${lower(f.format)}, version ${f.version || "1.0"}, last updated ${f.updated}.`, from: "format" });
  if (f.license) s.push({ text: `The license covers ${lower(f.license)}.`, from: "license" });
  if (f.language) s.push({ text: `Language: ${f.language}.`, from: "language" });

  const held = (TEMPTING[category] ?? []).filter((t) => !t.allowed(f)).map((t) => ({ text: t.text, reason: t.reason }));

  const tags = Array.from(
    new Set(
      [category.toLowerCase(), ...f.worksWith.slice(0, 2).map((w) => w.split(" ")[0].toLowerCase())]
        .concat(title.toLowerCase().split(/\s+/).filter((w) => w.length > 4))
        .slice(0, 6),
    ),
  );

  const factChars = JSON.stringify(f).length + title.length;
  const outChars = s.reduce((n, x) => n + x.text.length, 0) + held.reduce((n, x) => n + x.text.length, 0);
  const tokensIn = Math.round(420 + factChars / 3.6);
  const tokensOut = Math.round(outChars / 3.8 + 40);
  // writer, large model: $2.50 per million in, $10 per million out
  const cost = Math.round(((tokensIn * 2.5 + tokensOut * 10) / 1_000_000) * 1e5) / 1e5;
  return { sentences: s, held, tags, tokensIn, tokensOut, cost };
}

export const INDEX_COST = 0.00018;
export const QUERY_COST = 0.00002;
export const ASSIST_COST = 0.0021;

export const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  madeFor: "Made for",
  format: "Format",
  version: "Version",
  worksWith: "Works with",
  notWith: "Does not work with",
  includes: "Includes",
  license: "License",
  language: "Language",
  answers: "Maker's answers",
};
