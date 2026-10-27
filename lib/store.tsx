"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Call, Category, DayStat, Facts, Feature, Kind, Listing, Question, Sentence, Status, Toast } from "./types";
import { LISTINGS } from "./mock/listings";
import { QUESTIONS } from "./mock/questions";
import { buildCalls, buildDays, MODEL } from "./mock/ledger";
import { ME } from "./mock/sellers";
import { vectorize, type Vec } from "./meaning";
import { ASSIST_COST, INDEX_COST, QUERY_COST, writeListing, type Draft } from "./writer";
import { answer as answerFrom, type Answer } from "./assistant";
import { BASE_NOW, seeded } from "./rand";
import { slugify } from "./format";
import { pulse } from "./bus";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const indexText = (l: Pick<Listing, "title" | "tags" | "about" | "facts" | "category">) => [l.title, l.category, l.tags.join(" "), l.about, l.facts.madeFor, l.facts.includes.join(" ")].join(" ");

export interface ListingInput {
  title: string;
  category: Category;
  kind: Kind;
  price: number;
  monthly: boolean;
  cover: string;
  facts: Facts;
  tags: string[];
  about: string;
}

interface Store {
  listings: Listing[];
  vectors: Record<string, Vec>;
  questions: Question[];
  calls: Call[];
  days: DayStat[];
  now: number;
  today: { visits: number; sales: number; spend: number; aiCalls: number };
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  logQuery: (q: string) => void;
  ask: (listingId: string, q: string) => Promise<{ answer: Answer; callId: string }>;
  rate: (callId: string, helpful: boolean) => void;
  askMaker: (listingId: string, q: string) => void;
  draft: (input: ListingInput) => Promise<{ draft: Draft; callId: string }>;
  publish: (input: ListingInput, sentences: Sentence[], draft: Draft, callId: string, editingId?: string | null) => Promise<Listing>;
  saveDraft: (input: ListingInput, editingId?: string | null) => Listing;
  confirmReview: (id: string) => Promise<void>;
  setStatus: (id: string, status: Status) => void;
  remove: (id: string) => void;
  answerQuestion: (qid: string, kind: "yes" | "no" | "text", text: string) => Promise<void>;
  dismissQuestion: (qid: string) => void;
  reopenQuestion: (qid: string) => void;
  buy: (listingId: string, email: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(LISTINGS);
  const [vectors, setVectors] = useState<Record<string, Vec>>(() => Object.fromEntries(LISTINGS.filter((l) => l.status !== "draft").map((l) => [l.id, vectorize(indexText(l))])));
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [calls, setCalls] = useState<Call[]>(() => buildCalls(LISTINGS));
  const [days, setDays] = useState<DayStat[]>(buildDays);
  const [now, setNow] = useState(BASE_NOW);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nRef = useRef(0);
  const listRef = useRef(listings);
  listRef.current = listings;

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++nRef.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const clock = useRef(BASE_NOW);
  const t0 = useRef(0);
  const at = () => clock.current;

  /** adds a call to the ledger and to today's totals */
  const log = useCallback((c: Omit<Call, "id" | "at">) => {
    const id = `s${(++nRef.current).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
    const call: Call = { ...c, id, at: at() };
    setCalls((cs) => [call, ...cs]);
    setDays((ds) => {
      const last = ds[ds.length - 1];
      const f: Feature = c.feature;
      const upd: DayStat = { ...last, cost: { ...last.cost, [f]: last.cost[f] + c.cost }, calls: { ...last.calls, [f]: last.calls[f] + 1 } };
      return [...ds.slice(0, -1), upd];
    });
    return id;
  }, []);

  // the shop keeps living while you look at it: visitors walk past, now and then someone buys.
  // Visits never call a model, which is the whole point of writing listings once.
  useEffect(() => {
    t0.current = performance.now();
    const r = seeded(99);
    let visitT = 0;
    let saleT = 0;
    const iv = setInterval(() => {
      clock.current = BASE_NOW + Math.round(performance.now() - t0.current);
      setNow(clock.current);
      visitT += 1;
      saleT += 1;
      if (visitT >= 2) {
        visitT = 0;
        const n = 1 + (r() < 0.3 ? 1 : 0);
        setDays((ds) => {
          const last = ds[ds.length - 1];
          return [...ds.slice(0, -1), { ...last, visits: last.visits + n }];
        });
        const live = listRef.current.filter((l) => l.status === "live");
        const l = live[Math.floor(r() * live.length)];
        if (l) setListings((ls) => ls.map((x) => (x.id === l.id ? { ...x, views30: x.views30 + 1, readsSinceWrite: x.readsSinceWrite + 1 } : x)));
        pulse("visit", n);
      }
      if (saleT >= 34) {
        saleT = 0;
        const live = listRef.current.filter((l) => l.status === "live");
        const l = live[Math.floor(r() * live.length)];
        if (l) {
          setListings((ls) => ls.map((x) => (x.id === l.id ? { ...x, sales30: x.sales30 + 1 } : x)));
          setDays((ds) => {
            const last = ds[ds.length - 1];
            return [...ds.slice(0, -1), { ...last, sales: last.sales + 1 }];
          });
          pulse("sale");
        }
      }
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  const lastQuery = useRef("");
  const logQuery = useCallback(
    (q: string) => {
      const t = q.trim().toLowerCase();
      if (!t || t === lastQuery.current) return;
      lastQuery.current = t;
      log({ feature: "query", model: MODEL.query, listingId: null, tokensIn: Math.max(4, Math.round(t.length / 4)), tokensOut: 0, cost: QUERY_COST, ms: 60 + Math.round(Math.random() * 50), outcome: "no click", note: q.trim() });
      pulse("query");
    },
    [log],
  );

  const ask = useCallback(
    async (listingId: string, q: string) => {
      pulse("ask");
      await wait(900 + Math.random() * 500);
      const l = listRef.current.find((x) => x.id === listingId)!;
      const a = answerFrom(l, q);
      const callId = log({ feature: "assist", model: MODEL.assist, listingId, tokensIn: 420 + Math.round(JSON.stringify(l.facts).length / 4), tokensOut: Math.round(a.text.length / 4) + 12, cost: ASSIST_COST, ms: 900 + Math.round(Math.random() * 500), outcome: "pending", note: q });
      return { answer: a, callId };
    },
    [log],
  );

  const rate = useCallback((callId: string, helpful: boolean) => {
    setCalls((cs) => cs.map((c) => (c.id === callId ? { ...c, outcome: helpful ? "helpful" : "unhelpful" } : c)));
  }, []);

  const askMaker = useCallback(
    (listingId: string, q: string) => {
      setQuestions((qs) => {
        const key = q.trim().toLowerCase();
        const same = qs.find((x) => x.listingId === listingId && x.status === "open" && x.text.toLowerCase() === key);
        if (same) return qs.map((x) => (x === same ? { ...x, asked: x.asked + 1, lastAt: at() } : x));
        return [{ id: `q${Date.now().toString(36)}`, listingId, text: q.trim(), asked: 1, firstAt: at(), lastAt: at(), status: "open" }, ...qs];
      });
      toast("Sent to the maker. The answer will show here for every buyer.");
    },
    [toast],
  );

  const draft = useCallback(
    async (input: ListingInput) => {
      pulse("write");
      await wait(1500 + Math.random() * 600);
      const d = writeListing(input.title, input.category, input.kind, input.facts);
      const callId = log({ feature: "write", model: MODEL.write, listingId: null, tokensIn: d.tokensIn, tokensOut: d.tokensOut, cost: d.cost, ms: 2400 + Math.round(Math.random() * 1600), outcome: "pending", note: input.title });
      return { draft: d, callId };
    },
    [log],
  );

  const publish = useCallback(
    async (input: ListingInput, sentences: Sentence[], d: Draft, callId: string, editingId?: string | null) => {
      await wait(900);
      const edited = sentences.some((s, i) => s.text !== d.sentences[i]?.text);
      const existing = editingId ? listRef.current.find((x) => x.id === editingId) : undefined;
      const id = existing?.id ?? `N${Date.now().toString(36).toUpperCase()}`;
      const base = existing ?? null;
      const listing: Listing = {
        id,
        slug: base?.slug ?? slugify(input.title) + "-" + id.slice(-4).toLowerCase(),
        title: input.title,
        sellerId: ME,
        category: input.category,
        kind: input.kind,
        price: input.price,
        monthly: input.monthly,
        cover: input.cover,
        status: "live",
        facts: input.facts,
        tags: input.tags.length ? input.tags : d.tags,
        about: input.about,
        description: sentences,
        held: d.held,
        answers: base?.answers ?? [],
        views30: base?.views30 ?? 0,
        sales30: base?.sales30 ?? 0,
        rating: base?.rating ?? 0,
        reviews: base?.reviews ?? 0,
        createdAt: base?.createdAt ?? at(),
        writtenAt: at(),
        writeCost: d.cost,
        readsSinceWrite: 0,
      };
      setListings((ls) => (existing ? ls.map((x) => (x.id === id ? listing : x)) : [listing, ...ls]));
      setVectors((v) => ({ ...v, [id]: vectorize(indexText(listing)) }));
      setCalls((cs) => cs.map((c) => (c.id === callId ? { ...c, outcome: edited ? "edited" : "kept", listingId: id } : c)));
      log({ feature: "index", model: MODEL.index, listingId: id, tokensIn: Math.round(indexText(listing).length / 4), tokensOut: 0, cost: INDEX_COST, ms: 160, outcome: "kept" });
      pulse("publish");
      toast(existing ? `"${input.title}" is updated and live again.` : `"${input.title}" is live in the market.`);
      return listing;
    },
    [log, toast],
  );

  const saveDraft = useCallback(
    (input: ListingInput, editingId?: string | null) => {
      const existing = editingId ? listRef.current.find((x) => x.id === editingId) : undefined;
      const id = existing?.id ?? `N${Date.now().toString(36).toUpperCase()}`;
      const listing: Listing = {
        ...(existing ?? ({} as Listing)),
        id,
        slug: existing?.slug ?? slugify(input.title || "untitled") + "-" + id.slice(-4).toLowerCase(),
        title: input.title || "Untitled listing",
        sellerId: ME,
        category: input.category,
        kind: input.kind,
        price: input.price,
        monthly: input.monthly,
        cover: input.cover,
        status: "draft",
        facts: input.facts,
        tags: input.tags,
        about: input.about,
        description: existing?.description ?? [],
        held: existing?.held ?? [],
        answers: existing?.answers ?? [],
        views30: existing?.views30 ?? 0,
        sales30: existing?.sales30 ?? 0,
        rating: existing?.rating ?? 0,
        reviews: existing?.reviews ?? 0,
        createdAt: existing?.createdAt ?? at(),
        writtenAt: existing?.writtenAt ?? null,
        writeCost: existing?.writeCost ?? 0,
        readsSinceWrite: existing?.readsSinceWrite ?? 0,
      };
      setListings((ls) => (existing ? ls.map((x) => (x.id === id ? listing : x)) : [listing, ...ls]));
      toast("Draft saved. Nothing was written yet, so nothing was spent.", "info");
      return listing;
    },
    [toast],
  );

  const confirmReview = useCallback(
    async (id: string) => {
      await wait(700);
      setListings((ls) => ls.map((x) => (x.id === id ? { ...x, status: "live" } : x)));
      const l = listRef.current.find((x) => x.id === id);
      if (l) setVectors((v) => ({ ...v, [id]: vectorize(indexText(l)) }));
      log({ feature: "index", model: MODEL.index, listingId: id, tokensIn: 240, tokensOut: 0, cost: INDEX_COST, ms: 150, outcome: "kept" });
      pulse("publish");
      toast(`"${l?.title}" is live in the market.`);
    },
    [log, toast],
  );

  const setStatus = useCallback(
    (id: string, status: Status) => {
      setListings((ls) => ls.map((x) => (x.id === id ? { ...x, status } : x)));
      const l = listRef.current.find((x) => x.id === id);
      toast(status === "paused" ? `"${l?.title}" is paused and hidden from buyers.` : `"${l?.title}" is back in the market.`, "info");
    },
    [toast],
  );

  const remove = useCallback(
    (id: string) => {
      const l = listRef.current.find((x) => x.id === id);
      setListings((ls) => ls.filter((x) => x.id !== id));
      setQuestions((qs) => qs.filter((q) => q.listingId !== id));
      toast(`"${l?.title}" was deleted.`, "info");
    },
    [toast],
  );

  const answerQuestion = useCallback(
    async (qid: string, kind: "yes" | "no" | "text", text: string) => {
      const q = questions.find((x) => x.id === qid);
      if (!q) return;
      const l = listRef.current.find((x) => x.id === q.listingId);
      if (!l) return;
      await wait(1100);
      const tool = answerFrom({ ...l, answers: [] }, q.text).tool;
      const facts: Facts = { ...l.facts, worksWith: [...l.facts.worksWith], notWith: [...l.facts.notWith] };
      if (tool && kind === "yes") facts.worksWith.push(tool);
      if (tool && kind === "no") facts.notWith.push(tool);
      const reply = kind === "yes" ? `Yes. ${text}`.trim() : kind === "no" ? `No. ${text}`.trim() : text.trim();
      const answers = [...l.answers, { q: q.text, a: reply.replace(/\.\s*$/, "") + ".", at: at() }];
      // a new fact means the listing is written again, once, from the updated facts
      const d = writeListing(l.title, l.category, l.kind, facts);
      setListings((ls) => ls.map((x) => (x.id === l.id ? { ...x, facts, answers, description: d.sentences, held: d.held, writtenAt: at(), writeCost: d.cost, readsSinceWrite: 0 } : x)));
      setQuestions((qs) => qs.map((x) => (x.id === qid ? { ...x, status: "answered", answer: reply } : x)));
      log({ feature: "write", model: MODEL.write, listingId: l.id, tokensIn: d.tokensIn, tokensOut: d.tokensOut, cost: d.cost, ms: 2600, outcome: "kept", note: "Rewritten after the maker's answer" });
      pulse("write");
      toast(`Answer saved. Buyers asking about "${l.title}" now get it.`);
    },
    [questions, log, toast],
  );

  const dismissQuestion = useCallback(
    (qid: string) => {
      setQuestions((qs) => qs.map((x) => (x.id === qid ? { ...x, status: "dismissed" } : x)));
      toast("Question dismissed.", "info");
    },
    [toast],
  );

  const reopenQuestion = useCallback((qid: string) => {
    setQuestions((qs) => qs.map((x) => (x.id === qid ? { ...x, status: "open", answer: undefined } : x)));
  }, []);

  const buy = useCallback(
    async (listingId: string, email: string) => {
      await wait(1300);
      if (/fail|declin/i.test(email)) throw new Error("The card was declined. No money was taken.");
      setListings((ls) => ls.map((x) => (x.id === listingId ? { ...x, sales30: x.sales30 + 1 } : x)));
      setDays((ds) => {
        const last = ds[ds.length - 1];
        return [...ds.slice(0, -1), { ...last, sales: last.sales + 1 }];
      });
      pulse("sale");
      const l = listRef.current.find((x) => x.id === listingId);
      toast(`Thanks! ${l?.kind === "agent" ? "Setup steps" : "The download link"} went to ${email}.`);
    },
    [toast],
  );

  const today = useMemo(() => {
    const d = days[days.length - 1];
    const spend = d.cost.write + d.cost.index + d.cost.query + d.cost.assist;
    return { visits: d.visits, sales: d.sales, spend, aiCalls: d.calls.write + d.calls.index + d.calls.query + d.calls.assist };
  }, [days]);

  const value = useMemo<Store>(
    () => ({ listings, vectors, questions, calls, days, now, today, toasts, toast, logQuery, ask, rate, askMaker, draft, publish, saveDraft, confirmReview, setStatus, remove, answerQuestion, dismissQuestion, reopenQuestion, buy }),
    [listings, vectors, questions, calls, days, now, today, toasts, toast, logQuery, ask, rate, askMaker, draft, publish, saveDraft, confirmReview, setStatus, remove, answerQuestion, dismissQuestion, reopenQuestion, buy],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}
