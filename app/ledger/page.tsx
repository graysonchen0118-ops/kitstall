"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, BarChart3, Eye, ReceiptText, Search, ShoppingBag, Table2, TrendingDown, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { FEATURE_LABEL, FEATURE_WHEN, VIRAL_DAY, WRITE_AVG } from "@/lib/mock/ledger";
import { clock, cost, dayMonth, num, weekday } from "@/lib/format";
import type { Call, DayStat, Feature } from "@/lib/types";
import { Empty, Pager } from "@/components/ui";

// validated with the dataviz palette check: visits, sales, AI spend
const C = { visits: "#4f86c6", sales: "#d6561c", spend: "#5b3fd9" };
const FEAT_C: Record<Feature, string> = { write: "#5b3fd9", index: "#9b8fe8", query: "#4f86c6", assist: "#d6561c" };
const FEATS: Feature[] = ["write", "index", "query", "assist"];
const spendOf = (d: DayStat) => d.cost.write + d.cost.index + d.cost.query + d.cost.assist;
const PER = 15;

export default function LedgerPage() {
  const { days, calls, listings } = useStore();

  const tot = useMemo(() => {
    const visits = days.reduce((n, d) => n + d.visits, 0);
    const sales = days.reduce((n, d) => n + d.sales, 0);
    const spend = days.reduce((n, d) => n + spendOf(d), 0);
    const perView = visits * WRITE_AVG;
    return { visits, sales, spend, perView, perSale: spend / Math.max(1, sales) };
  }, [days]);

  const feats = useMemo(() => {
    return FEATS.map((f) => {
      const c = days.reduce((n, d) => n + d.calls[f], 0);
      const k = days.reduce((n, d) => n + d.cost[f], 0);
      const recent = calls.filter((x) => x.feature === f && x.outcome !== "pending");
      const good = recent.filter((x) => x.outcome === "kept" || x.outcome === "helpful" || x.outcome === "clicked").length;
      return { f, calls: c, cost: k, per: k / Math.max(1, c), rate: recent.length ? good / recent.length : 0 };
    });
  }, [days, calls]);

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">
          <ReceiptText size={15} /> AI ledger, last 30 days
        </span>
        <h1>Every model call, what it cost and whether it helped.</h1>
        <p className="lead">The model provider sends one total at the end of the month. This is the same spend, split by the feature that made each call, next to the visits and sales it served.</p>
      </div>

      <div className="kpis">
        <div className="kpi glass">
          <span className="kpi-top">
            Visits <span className="kpi-ic">
              <Eye size={16} />
            </span>
          </span>
          <strong>{num(tot.visits)}</strong>
          <span className="sub">browsing costs nothing</span>
        </div>
        <div className="kpi glass">
          <span className="kpi-top">
            Sales <span className="kpi-ic green">
              <ShoppingBag size={16} />
            </span>
          </span>
          <strong>{num(tot.sales)}</strong>
          <span className="sub">downloads and agents</span>
        </div>
        <div className="kpi glass">
          <span className="kpi-top">
            AI spend <span className="kpi-ic violet">
              <Wallet size={16} />
            </span>
          </span>
          <strong>{cost(tot.spend)}</strong>
          <span className="sub">{cost(tot.perSale)} per sale</span>
        </div>
        <div className="kpi glass" style={{ background: "var(--support-soft)" }}>
          <span className="kpi-top">
            If listings were written on every view <span className="kpi-ic amber">
              <TrendingDown size={16} />
            </span>
          </span>
          <strong>{cost(tot.perView)}</strong>
          <span className="sub">{Math.round(tot.perView / Math.max(0.01, tot.spend))}× the real AI bill for these 30 days</span>
        </div>
      </div>

      <Multiples days={days} />

      <section className="card glass" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <h2>By feature</h2>
            <p>What runs once, what runs per buyer, and what each call costs.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Feature</th>
                <th>When it runs</th>
                <th className="num">Calls, 30d</th>
                <th className="num">Cost, 30d</th>
                <th className="num">Per call</th>
                <th>Share of spend</th>
                <th className="num">Worked</th>
              </tr>
            </thead>
            <tbody>
              {feats.map((x) => (
                <tr key={x.f}>
                  <td>
                    <span className="feat-name">
                      <span className="feat-dot" style={{ background: FEAT_C[x.f] }} />
                      <strong>{FEATURE_LABEL[x.f]}</strong>
                    </span>
                  </td>
                  <td className="muted">{FEATURE_WHEN[x.f]}</td>
                  <td className="num">{num(x.calls)}</td>
                  <td className="num">{cost(x.cost)}</td>
                  <td className="num">{cost(x.per)}</td>
                  <td style={{ minWidth: 140 }}>
                    <div className="bar" aria-label={`${Math.round((x.cost / tot.spend) * 100)} percent`}>
                      <i style={{ width: `${Math.max(1.5, (x.cost / tot.spend) * 100)}%`, background: FEAT_C[x.f] }} />
                    </div>
                    <span className="small muted">{Math.round((x.cost / tot.spend) * 100)}%</span>
                  </td>
                  <td className="num">
                    {Math.round(x.rate * 100)}% <span className="muted small">{x.f === "query" ? "clicked" : x.f === "assist" ? "helpful" : "kept"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CallLog calls={calls} titleOf={(id) => listings.find((l) => l.id === id)} />
    </>
  );
}

function Multiples({ days }: { days: DayStat[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(240, el.clientWidth)));
    ro.observe(el);
    setW(Math.max(240, el.clientWidth));
    return () => ro.disconnect();
  }, [table]);

  const viral = days.findIndex((d) => d.day === VIRAL_DAY);
  const rows = [
    { key: "visits", label: "Visits", color: C.visits, val: (d: DayStat) => d.visits, fmt: (n: number) => num(n), total: num(days.reduce((n, d) => n + d.visits, 0)) },
    { key: "sales", label: "Sales", color: C.sales, val: (d: DayStat) => d.sales, fmt: (n: number) => num(n), total: num(days.reduce((n, d) => n + d.sales, 0)) },
    { key: "spend", label: "AI spend", color: C.spend, val: spendOf, fmt: (n: number) => cost(n), total: cost(days.reduce((n, d) => n + spendOf(d), 0)) },
  ];
  const i = hover ?? viral;
  const d = days[i];
  const base = days.slice(0, -1).filter((x) => x.day !== VIRAL_DAY);
  const avg = (f: (x: DayStat) => number) => base.reduce((n, x) => n + f(x), 0) / Math.max(1, base.length);

  return (
    <section className="chart-card glass" style={{ marginTop: 18 }} aria-label="Visits, sales and AI spend by day">
      <div className="chart-head">
        <div>
          <h2>AI spend follows sales, not visits</h2>
          <p>Same 30 days, one row each, so each keeps its own scale. Hover a day to compare.</p>
        </div>
        <div className="seg-ctl" role="group" aria-label="View">
          <button className={!table ? "on" : ""} onClick={() => setTable(false)}>
            <BarChart3 size={14} /> Chart
          </button>
          <button className={table ? "on" : ""} onClick={() => setTable(true)}>
            <Table2 size={14} /> Table
          </button>
        </div>
      </div>

      {table ? (
        <div className="table-wrap" style={{ maxHeight: 420, overflowY: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Visits</th>
                <th className="num">Sales</th>
                <th className="num">AI spend</th>
                <th className="num">Per sale</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((x, k) => (
                <tr key={x.day}>
                  <td>
                    {weekday(x.day)}
                    {k === 0 ? <span className="muted small"> so far</span> : x.day === VIRAL_DAY ? <span className="badge amber" style={{ marginLeft: 8 }}>post went viral</span> : null}
                  </td>
                  <td className="num">{num(x.visits)}</td>
                  <td className="num">{num(x.sales)}</td>
                  <td className="num">{cost(spendOf(x))}</td>
                  <td className="num">{cost(spendOf(x) / Math.max(1, x.sales))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="multiples" onMouseLeave={() => setHover(null)}>
            {rows.map((r) => {
              const lab = 124;
              const plotW = Math.max(120, w < 560 ? w : w - lab - 12);
              const H = 74;
              const max = Math.max(...days.map(r.val)) || 1;
              const bw = plotW / days.length;
              return (
                <div key={r.key} className="mult" ref={r.key === "visits" ? wrap : undefined}>
                  <div className="lab">
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: r.color, marginRight: 6 }} />
                    {r.label}
                    <b>{r.total}</b>
                  </div>
                  <svg viewBox={`0 0 ${plotW} ${H}`} width={plotW} height={H} role="img" aria-label={`${r.label} per day`}>
                    <line x1={0} x2={plotW} y1={H - 0.5} y2={H - 0.5} stroke="var(--line-2)" />
                    {days.map((x, k) => {
                      const v = r.val(x);
                      const h = Math.max(2, (v / max) * (H - 14));
                      const bx = k * bw + 1;
                      const bwi = Math.max(2, bw - 2);
                      const y = H - h;
                      const rr = Math.min(4, bwi / 2, h);
                      const today = k === days.length - 1;
                      const path = `M${bx},${H} V${y + rr} Q${bx},${y} ${bx + rr},${y} H${bx + bwi - rr} Q${bx + bwi},${y} ${bx + bwi},${y + rr} V${H} Z`;
                      return (
                        <g key={x.day}>
                          <path className="b" d={path} fill={r.color} opacity={hover === null ? (today ? 0.45 : 1) : hover === k ? 1 : 0.3} />
                          <rect x={k * bw} y={0} width={bw} height={H} fill="transparent" onMouseEnter={() => setHover(k)} onClick={() => setHover(k)} />
                        </g>
                      );
                    })}
                    {r.key === "visits" && viral >= 0 && (
                      <text x={Math.min(plotW - 4, viral * bw + bw + 4)} y={12} fontSize={11.5} fontWeight={700} fill="var(--ink-2)">
                        post went viral
                      </text>
                    )}
                  </svg>
                </div>
              );
            })}
            <div className="axis-days">
              <span />
              <div>
                <span>{dayMonth(days[0].day)}</span>
                <span>{dayMonth(days[Math.floor(days.length / 2)].day)}</span>
                <span>today</span>
              </div>
            </div>
          </div>
          <div className="chart-tip" aria-live="polite">
            {d && (
              <>
                <b>{weekday(d.day)}</b>
                {i === days.length - 1 ? " so far" : ""}: {num(d.visits)} visits, {num(d.sales)} sales, AI spend <b>{cost(spendOf(d))}</b>.{" "}
                {d.day === VIRAL_DAY ? (
                  <span>
                    A post about the drum loop kit went viral. Visits were {(d.visits / avg((x) => x.visits)).toFixed(1)}× a normal day, yet AI spend {Math.abs(spendOf(d) / avg(spendOf) - 1) < 0.05 ? "stayed about where it is any other day" : `moved only ${Math.round((spendOf(d) / avg(spendOf) - 1) * 100)}%`}, because the new visitors read listings that were already written.
                  </span>
                ) : (
                  <span className="muted">{cost(spendOf(d) / Math.max(1, d.sales))} of AI per sale.</span>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

type Sort = "time" | "cost";

function CallLog({ calls, titleOf }: { calls: Call[]; titleOf: (id: string) => { title: string; slug: string } | undefined }) {
  const [feat, setFeat] = useState<Feature | "all">("all");
  const [out, setOut] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("time");
  const [page, setPage] = useState(1);
  const firstId = useRef(calls[0]?.id);
  const [fresh] = useState(() => new Set<string>());
  if (calls[0] && calls[0].id !== firstId.current) {
    calls.slice(0, 5).forEach((c) => {
      if (c.id.startsWith("s")) fresh.add(c.id);
    });
    firstId.current = calls[0].id;
  }

  const rows = useMemo(() => {
    let r = calls;
    if (feat !== "all") r = r.filter((c) => c.feature === feat);
    if (out !== "all") r = r.filter((c) => c.outcome === out);
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((c) => (c.note ?? "").toLowerCase().includes(t) || (c.listingId ? titleOf(c.listingId)?.title.toLowerCase().includes(t) : false));
    if (sort === "cost") r = [...r].sort((a, b) => b.cost - a.cost);
    return r;
  }, [calls, feat, out, q, sort, titleOf]);

  useEffect(() => setPage(1), [feat, out, q, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const show = rows.slice((page - 1) * PER, page * PER);
  const n = (f: Feature | "all") => (f === "all" ? calls.length : calls.filter((c) => c.feature === f).length);

  return (
    <section className="card glass" style={{ marginTop: 18 }}>
      <div className="card-head">
        <div>
          <h2>Recent calls</h2>
          <p>The last 12 hours, newest first. Your own searches, questions and listings appear here as you make them.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Feature">
          {(["all", ...FEATS] as const).map((f) => (
            <button key={f} className={`chip ${feat === f ? "on" : ""}`} onClick={() => setFeat(f)}>
              {f === "all" ? "All" : FEATURE_LABEL[f]} <em>{num(n(f))}</em>
            </button>
          ))}
        </div>
        <select className="select" value={out} onChange={(e) => setOut(e.target.value)} aria-label="Outcome" style={{ width: "auto" }}>
          <option value="all">Any outcome</option>
          <option value="kept">Kept</option>
          <option value="edited">Edited</option>
          <option value="rejected">Rejected</option>
          <option value="helpful">Helpful</option>
          <option value="unhelpful">Not helpful</option>
          <option value="clicked">Clicked</option>
          <option value="no click">No click</option>
          <option value="pending">Not rated yet</option>
        </select>
        <label className="search">
          <Search size={17} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a listing or a query" aria-label="Search calls" />
        </label>
        <button className="btn btn-ghost btn-sm" onClick={() => setSort((s) => (s === "time" ? "cost" : "time"))}>
          <ArrowDownUp size={15} /> {sort === "time" ? "Newest first" : "Most expensive first"}
        </button>
      </div>
      {show.length === 0 ? (
        <Empty icon={<Search size={22} />} title="No calls match" text="Try another feature or clear the search." />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Feature</th>
                <th>For</th>
                <th>Model</th>
                <th className="num">Tokens</th>
                <th className="num">Cost</th>
                <th className="num">Took</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {show.map((c) => {
                const l = c.listingId ? titleOf(c.listingId) : undefined;
                return (
                  <tr key={c.id} className={fresh.has(c.id) ? "fresh" : ""}>
                    <td className="nowrap">{clock(c.at)}</td>
                    <td className="nowrap">
                      <span className="feat-name">
                        <span className="feat-dot" style={{ background: FEAT_C[c.feature] }} />
                        {FEATURE_LABEL[c.feature]}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      {l ? (
                        <Link href={`/item/${l.slug}`} style={{ fontWeight: 700 }}>
                          {l.title}
                        </Link>
                      ) : c.note ? (
                        <span>&ldquo;{c.note}&rdquo;</span>
                      ) : (
                        <span className="muted">Draft</span>
                      )}
                      {l && c.note && c.feature !== "write" && <span className="muted small"> &ldquo;{c.note}&rdquo;</span>}
                      {c.feature === "write" && c.note && l && <div className="muted small">{c.note}</div>}
                    </td>
                    <td className="muted nowrap">{c.model}</td>
                    <td className="num">{num(c.tokensIn + c.tokensOut)}</td>
                    <td className="num">{cost(c.cost)}</td>
                    <td className="num">{c.ms >= 1000 ? `${(c.ms / 1000).toFixed(1)} s` : `${c.ms} ms`}</td>
                    <td>
                      <span className={`out ${c.outcome === "kept" || c.outcome === "helpful" || c.outcome === "clicked" ? "good" : c.outcome === "rejected" || c.outcome === "unhelpful" ? "bad" : c.outcome === "edited" ? "mid" : ""}`}>
                        {c.outcome === "unhelpful" ? "not helpful" : c.outcome === "pending" ? "not rated" : c.outcome}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Pager page={page} pages={pages} onPage={setPage} total={rows.length} label="calls" />
      </div>
    </section>
  );
}
