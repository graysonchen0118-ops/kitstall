export type Category =
  | "Spreadsheets"
  | "Planners"
  | "UI kits"
  | "Code kits"
  | "Prompt packs"
  | "AI agents"
  | "Photo presets"
  | "Audio"
  | "Fonts"
  | "Guides"
  | "Social templates";

export type Kind = "download" | "agent";
export type Status = "live" | "review" | "draft" | "paused";

/** what the maker states about the product, the only thing the writer and the assistant may use */
export interface Facts {
  madeFor: string;
  format: string;
  version: string;
  updated: string;
  worksWith: string[];
  notWith: string[];
  includes: string[];
  license: string;
  language: string;
}

export interface Sentence {
  text: string;
  /** the fact field this sentence was written from */
  from: FactKey;
}

export type FactKey = "title" | "madeFor" | "format" | "version" | "worksWith" | "notWith" | "includes" | "license" | "language" | "answers";

export interface Held {
  text: string;
  reason: string;
}

export interface MakerAnswer {
  q: string;
  a: string;
  at: number;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  sellerId: string;
  category: Category;
  kind: Kind;
  price: number;
  monthly: boolean;
  cover: string;
  status: Status;
  facts: Facts;
  tags: string[];
  about: string;
  description: Sentence[];
  held: Held[];
  answers: MakerAnswer[];
  views30: number;
  sales30: number;
  rating: number;
  reviews: number;
  createdAt: number;
  writtenAt: number | null;
  writeCost: number;
  readsSinceWrite: number;
}

export interface Seller {
  id: string;
  name: string;
  shop: string;
  country: string;
  avatar: string;
  since: number;
  rating: number;
}

export type Feature = "write" | "index" | "query" | "assist";

export interface Call {
  id: string;
  at: number;
  feature: Feature;
  model: string;
  listingId: string | null;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  ms: number;
  outcome: "kept" | "edited" | "rejected" | "helpful" | "unhelpful" | "clicked" | "no click" | "pending";
  note?: string;
}

export interface DayStat {
  day: number;
  visits: number;
  sales: number;
  cost: Record<Feature, number>;
  calls: Record<Feature, number>;
}

export interface Question {
  id: string;
  listingId: string;
  text: string;
  asked: number;
  firstAt: number;
  lastAt: number;
  status: "open" | "answered" | "dismissed";
  answer?: string;
}

export interface Toast {
  id: number;
  text: string;
  tone: "ok" | "error" | "info";
}
