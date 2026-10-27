"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Info, Search, SearchX, Sparkles, Star, Type, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { highlight } from "@/lib/bus";
import { cosine, keywordMatch, overlap, vectorize } from "@/lib/meaning";
import { indexText } from "@/lib/store";
import { SELLERS } from "@/lib/mock/sellers";
import { BANNER, faceId } from "@/lib/photos";
import { cost, num } from "@/lib/format";
import type { Category, Listing } from "@/lib/types";
import { ListingCard } from "@/components/ListingCard";
import { Avatar, Empty, Pager, Photo, Skel } from "@/components/ui";

const CATS: Category[] = ["Spreadsheets", "Planners", "UI kits", "Code kits", "Prompt packs", "AI agents", "Photo presets", "Audio", "Fonts", "Guides", "Social templates"];
const TRY = ["get paid faster by my clients", "plan a small wedding", "sound for a podcast intro", "posts for my bakery"];
type Sort = "popular" | "new" | "low" | "high" | "rated";
type Mode = "meaning" | "exact";
const PER = 12;

export default function MarketPage() {
  const { listings, vectors, today, logQuery } = useStore();
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("meaning");
  const [cat, setCat] = useState<Category | "All">("All");
  const [sort, setSort] = useState<Sort>("popular");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const live = useMemo(() => listings.filter((l) => l.status === "live"), [listings]);

  const results = useMemo(() => {
    if (!q) return null;
    const qv = vectorize(q);
    const byMeaning = live
      .map((l) => ({ l, score: cosine(qv, vectors[l.id] ?? {}), matched: overlap(qv, vectors[l.id] ?? {}) }))
      .filter((x) => x.score >= 0.2)
      .sort((a, b) => b.score - a.score);
    const exact = live.filter((l) => keywordMatch(q, indexText(l) + " " + l.description.map((s) => s.text).join(" ")));
    return { byMeaning, exact };
  }, [q, live, vectors]);

  const shown = useMemo(() => {
    let rows: { l: Listing; score?: number; matched?: string[] }[];
    if (results) rows = mode === "meaning" ? results.byMeaning : results.exact.map((l) => ({ l }));
    else rows = live.map((l) => ({ l }));
    if (cat !== "All") rows = rows.filter((r) => r.l.category === cat);
    if (!results || sort !== "popular") {
      const k = (l: Listing) => (sort === "new" ? -l.createdAt : sort === "low" ? l.price : sort === "high" ? -l.price : sort === "rated" ? -l.rating : -l.sales30);
      rows = [...rows].sort((a, b) => k(a.l) - k(b.l));
    }
    return rows;
  }, [results, mode, live, cat, sort]);

  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const pageRows = shown.slice((page - 1) * PER, page * PER);

  useEffect(() => setPage(1), [q, mode, cat, sort]);

  // the stall in the background lights up what the search found
  useEffect(() => {
    highlight(results ? shown.slice(0, 6).map((r) => r.l.id) : []);
  }, [results, shown]);
  useEffect(() => () => highlight([]), []);

  const run = (text: string, m: Mode = mode) => {
    const t = text.trim();
    setDraft(text);
    if (!t) {
      setQ("");
      return;
    }
    setBusy(true);
    if (m === "meaning") logQuery(t);
    setTimeout(() => {
      setQ(t);
      setBusy(false);
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: live.length };
    for (const l of live) c[l.category] = (c[l.category] ?? 0) + 1;
    return c;
  }, [live]);

  const topMakers = useMemo(() => {
    return SELLERS.map((s) => ({ s, sales: live.filter((l) => l.sellerId === s.id).reduce((n, l) => n + l.sales30, 0) }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [live]);

  return (
    <>
      <section className="hero-market">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> Templates, kits, sounds and small business agents
          </span>
          <h1>
            Find the kit that fits <span>what you meant</span>, not just what you typed.
          </h1>
          <p className="lead">Search in your own words. Every listing here was written once from the maker&apos;s own facts and confirmed by them, so what you read is what you get.</p>

          <form
            className="bigsearch glass"
            onSubmit={(e) => {
              e.preventDefault();
              run(draft);
            }}
            role="search"
          >
            <label className="search">
              <Search size={18} />
              <span className="sr-only">Describe what you need</span>
              <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Describe what you need, in your own words" name="q" autoComplete="off" />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Searching" : "Search"} <ArrowRight size={16} />
            </button>
          </form>
          <div className="search-modes">
            <div className="seg-ctl" role="group" aria-label="Search mode">
              <button
                type="button"
                className={mode === "meaning" ? "on" : ""}
                onClick={() => {
                  setMode("meaning");
                  if (q) logQuery(q);
                }}
              >
                <Wand2 size={14} /> By meaning
              </button>
              <button type="button" className={mode === "exact" ? "on" : ""} onClick={() => setMode("exact")}>
                <Type size={14} /> Exact words
              </button>
            </div>
            <span className="muted small">{mode === "meaning" ? "Finds listings about the same thing, even in other words." : "Only listings that contain every word you typed."}</span>
          </div>
          <div className="try">
            <span>Try:</span>
            {TRY.map((t) => (
              <button key={t} type="button" onClick={() => run(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="board">
            <div className="tile glass">
              <span>Visits today</span>
              <strong key={today.visits} className="tick">
                {num(today.visits)}
              </strong>
              <em>people browsing</em>
            </div>
            <div className="tile glass">
              <span>Sales today</span>
              <strong>{num(today.sales)}</strong>
              <em>downloads and agents</em>
            </div>
            <div className="tile glass ai">
              <span>AI spend today</span>
              <strong>{cost(today.spend)}</strong>
              <em>{num(today.aiCalls)} model calls</em>
            </div>
          </div>
          <p className="board-note">
            <Info size={15} />
            <span>Browsing reads listings that were already written, so it costs nothing. Only searches by meaning and questions to the assistant call a model, which keeps the AI bill in step with buyers, not window-shoppers.</span>
          </p>
        </div>
      </section>

      <div ref={gridRef} style={{ scrollMarginTop: 84 }} />
      <div className="market-bar">
        <div className="cats chips" role="group" aria-label="Category">
          {(["All", ...CATS] as const).map((c) => (
            <button key={c} type="button" className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
              {c} <em>{counts[c] ?? 0}</em>
            </button>
          ))}
        </div>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" style={{ width: "auto" }}>
          <option value="popular">{q ? "Best match" : "Most popular"}</option>
          <option value="new">Newest</option>
          <option value="rated">Best rated</option>
          <option value="low">Price, low to high</option>
          <option value="high">Price, high to low</option>
        </select>
      </div>

      {results && (
        <div className="result-note glass">
          <span>
            <strong>{plural(mode === "meaning" ? results.byMeaning.length : results.exact.length)}</strong> for &ldquo;{q}&rdquo; {mode === "meaning" ? "by meaning" : "with every word"}.{" "}
            <span className="muted">
              {mode === "meaning" ? `Exact words would find ${results.exact.length}.` : `By meaning would find ${results.byMeaning.length}.`}
            </span>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setQ("");
              setDraft("");
            }}
          >
            Clear search
          </button>
        </div>
      )}

      {busy ? (
        <div className="cards">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="lcard" style={{ padding: 0 }}>
              <div className="lc-img">
                <Skel h={999} r={0} />
              </div>
              <div className="lc-body">
                <Skel h={16} w="80%" />
                <Skel h={12} w="50%" />
                <Skel h={18} w="30%" />
              </div>
            </div>
          ))}
        </div>
      ) : pageRows.length === 0 ? (
        <Empty
          icon={<SearchX size={22} />}
          title="Nothing matches that yet"
          text={mode === "exact" && results && results.byMeaning.length ? "No listing uses every one of those words. Searching by meaning finds the ones about the same thing." : "Try describing the job you want done, or pick another category."}
          action={
            mode === "exact" && results && results.byMeaning.length ? (
              <button className="btn btn-primary btn-sm" onClick={() => setMode("meaning")}>
                <Wand2 size={15} /> Search by meaning
              </button>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setQ("");
                  setDraft("");
                  setCat("All");
                }}
              >
                Show everything
              </button>
            )
          }
        />
      ) : (
        <div className={`cards ${pageRows.length < 4 ? "few" : ""}`}>
          {pageRows.map((r, i) => (
            <ListingCard key={r.l.id} l={r.l} matched={r.matched} score={mode === "meaning" && results ? r.score : undefined} i={i} />
          ))}
        </div>
      )}
      {!busy && pageRows.length > 0 && <Pager page={page} pages={pages} onPage={(n) => { setPage(n); gridRef.current?.scrollIntoView({ behavior: "smooth" }); }} total={shown.length} label="listings" />}

      <section className="how">
        <div className="step glass">
          <div className="num">1</div>
          <h3>Makers state the facts</h3>
          <p>What it is for, the format, what it works with and what it doesn&apos;t, what&apos;s inside, and the license. Nothing else goes into a listing.</p>
        </div>
        <div className="step glass key">
          <div className="num">2</div>
          <h3>Written once, confirmed by the maker</h3>
          <p>The listing is written from those facts a single time, and nothing goes live until the maker approves every sentence. Each visit after that reads it at no cost.</p>
        </div>
        <div className="step glass">
          <div className="num">3</div>
          <h3>Answers that never guess</h3>
          <p>Ask about any product and the assistant answers from the maker&apos;s facts. If the maker hasn&apos;t said, it tells you so and passes the question on.</p>
        </div>
      </section>

      <section className="makers">
        <div className="banner">
          <Photo id={BANNER.desk} w={900} h={620} alt="A maker working at a wooden desk with a laptop" />
          <div className="cap glass">
            <strong>Sell what you make</strong>
            <p className="small muted" style={{ margin: "4px 0 10px" }}>
              Fill in the facts once. Kitstall writes the listing, you approve it, and buyers&apos; questions come straight to you.
            </p>
            <Link href="/studio" className="btn btn-primary btn-sm">
              Open the seller studio <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="maker-list glass">
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Makers selling the most this month</h3>
          {topMakers.map(({ s, sales }) => (
            <div key={s.id} className="maker-row">
              <Avatar id={faceId(s.avatar)} name={s.name} size={42} />
              <div>
                <strong>{s.shop}</strong>
                <span>
                  {s.name}, {s.country}. {num(sales)} sales in 30 days
                </span>
              </div>
              <span className="stars">
                <Star size={14} /> {s.rating.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function plural(n: number) {
  return n === 1 ? "1 listing" : `${n} listings`;
}
