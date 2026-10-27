"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Bot, ChevronRight, CircleCheck, Download, MessageCircleQuestion, PackageSearch, RefreshCcw, Send, ShieldCheck, ThumbsDown, ThumbsUp, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { highlight } from "@/lib/bus";
import { sellerById } from "@/lib/mock/sellers";
import { coverId, faceId } from "@/lib/photos";
import { cosine } from "@/lib/meaning";
import { suggestions, type Answer } from "@/lib/assistant";
import { FIELD_LABEL } from "@/lib/writer";
import { cost, day, num, price } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { Avatar, Empty, Modal, Photo, Spinner, Switch, Tilt } from "./ui";

interface Msg {
  id: number;
  who: "me" | "bot";
  text: string;
  answer?: Answer;
  callId?: string;
  rated?: "up" | "down";
  sent?: boolean;
  q?: string;
}

export function ItemView({ slug }: { slug: string }) {
  const { listings, vectors } = useStore();
  const l = listings.find((x) => x.slug === slug);

  useEffect(() => {
    highlight(l ? [l.id] : []);
    return () => highlight([]);
  }, [l?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => {
    if (!l) return [];
    const v = vectors[l.id] ?? {};
    return listings
      .filter((x) => x.status === "live" && x.id !== l.id)
      .map((x) => ({ x, s: cosine(v, vectors[x.id] ?? {}) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((r) => r.x);
  }, [l, listings, vectors]);

  if (!l) {
    return (
      <div style={{ paddingTop: 60 }}>
        <Empty
          icon={<PackageSearch size={22} />}
          title="This listing isn't available"
          text="It may have been paused or removed by its maker."
          action={
            <Link href="/" className="btn btn-primary btn-sm">
              Back to the market
            </Link>
          }
        />
      </div>
    );
  }
  return <Item key={l.id} l={l} related={related} />;
}

function Item({ l, related }: { l: Listing; related: Listing[] }) {
  const s = sellerById(l.sellerId);
  const first = s.name.split(" ")[0];
  const [sources, setSources] = useState(false);
  const [buying, setBuying] = useState(false);
  const f = l.facts;
  const live = l.status === "live";

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Market</Link>
        <ChevronRight size={14} />
        <span>{l.category}</span>
        <ChevronRight size={14} />
        <span style={{ color: "var(--ink)" }}>{l.title}</span>
      </nav>

      <div className="item-grid">
        <div className="item-main">
          <Tilt max={4}>
            <div className="cover-big">
              <Photo id={coverId(l.cover)} w={1200} h={750} alt={l.title} eager />
            </div>
          </Tilt>
          <div className="item-title">
            <h1>{l.title}</h1>
            <div className="row">
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Avatar id={faceId(s.avatar)} name={s.name} size={28} />
                <strong>{s.shop}</strong> <span className="muted">by {s.name}</span>
              </span>
              {l.reviews > 0 && (
                <span className="stars">
                  ★ {l.rating.toFixed(1)} <span className="muted">({l.reviews} reviews)</span>
                </span>
              )}
              <span className="muted">{num(l.sales30)} sold in 30 days</span>
            </div>
          </div>

          <section className="desc glass" aria-label="Description">
            <div className="desc-head">
              <h2>About this {l.kind === "agent" ? "agent" : "product"}</h2>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>
                Show where each sentence comes from
                <Switch on={sources} onChange={() => setSources((v) => !v)} label="Show sources" />
              </label>
            </div>
            <div className={`desc-text ${sources ? "show" : ""}`}>
              {l.description.map((sen, i) => (
                <span key={i} className="s">
                  {sen.text}
                  {sources && <span className="src">{FIELD_LABEL[sen.from]}</span>}{" "}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <span className="confirmed">
                <BadgeCheck size={15} /> Every sentence confirmed by {first}
                {l.writtenAt ? ` on ${day(l.writtenAt)}` : ""}
              </span>
            </div>
            {l.writtenAt && (
              <div className="once">
                <Zap size={18} />
                <span>
                  Written once, for <b>{cost(l.writeCost)}</b>. Read <b>{num(l.readsSinceWrite)}</b> times since then, and none of those reads called a model.
                </span>
              </div>
            )}
          </section>

          <section className="facts glass" aria-label="The maker's facts">
            <dl>
              <dt>Made for</dt>
              <dd>{f.madeFor}</dd>
              <dt>Format</dt>
              <dd>{f.format}</dd>
              <dt>Version</dt>
              <dd>
                {f.version}, updated {f.updated}
              </dd>
              <dt>Works with</dt>
              <dd>{f.worksWith.length ? f.worksWith.join(", ") : <span className="muted">Not stated</span>}</dd>
              <dt>Does not work with</dt>
              <dd>{f.notWith.length ? f.notWith.join(", ") : <span className="muted">Nothing stated</span>}</dd>
              <dt>Includes</dt>
              <dd>
                <ul>
                  {f.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </dd>
              <dt>License</dt>
              <dd>{f.license}</dd>
              <dt>Language</dt>
              <dd>{f.language}</dd>
              {l.answers.length > 0 && (
                <>
                  <dt>{first}&apos;s answers</dt>
                  <dd>
                    {l.answers.map((a) => (
                      <div key={a.q + a.at} style={{ marginBottom: 6 }}>
                        <strong>{a.q}</strong>
                        <br />
                        {a.a}
                      </div>
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </section>
        </div>

        <aside className="item-side">
          <div className="buy glass">
            <div className="price">
              {price(l.price)}
              {l.monthly && <small> / month</small>}
            </div>
            <button className="btn btn-primary" onClick={() => setBuying(true)} disabled={!live}>
              {l.kind === "agent" ? <Zap size={17} /> : <Download size={17} />} {live ? (l.kind === "agent" ? "Start this agent" : "Buy and download") : "Not available right now"}
            </button>
            <ul>
              <li>
                <CircleCheck size={16} /> {l.kind === "agent" ? "Running in minutes, cancel any month" : "Instant download after payment"}
              </li>
              <li>
                <ShieldCheck size={16} /> Refund within 14 days if it doesn&apos;t match its listing
              </li>
              <li>
                <RefreshCcw size={16} /> Free updates from {first}
              </li>
            </ul>
          </div>
          <Assistant l={l} first={first} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="related">
          <div className="sec-title">
            <h2>Close in meaning</h2>
            <p>Found through the same stored index the search uses, no extra model call.</p>
          </div>
          <div className="cards">
            {related.map((r, i) => (
              <ListingCard key={r.id} l={r} i={i} />
            ))}
          </div>
        </section>
      )}

      <BuyModal open={buying} onClose={() => setBuying(false)} l={l} />
    </>
  );
}

function Assistant({ l, first }: { l: Listing; first: string }) {
  const { ask, rate, askMaker } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, who: "bot", text: `Hi! Ask me anything about ${l.title}. I only answer from what ${first} has stated, and I'll tell you when something isn't covered.` }]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const n = useRef(1);
  const sugg = useMemo(() => suggestions(l), [l]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const send = async (q: string) => {
    const t = q.trim();
    if (!t || thinking) return;
    setText("");
    setMsgs((m) => [...m, { id: n.current++, who: "me", text: t }]);
    setThinking(true);
    const { answer, callId } = await ask(l.id, t);
    setThinking(false);
    setMsgs((m) => [...m, { id: n.current++, who: "bot", text: answer.text, answer, callId, q: t }]);
  };

  return (
    <section className="assist glass" aria-label="Ask about this product">
      <div className="assist-head">
        <span className="ic">
          <Bot size={20} />
        </span>
        <div>
          <strong>Ask about this product</strong>
          <span>Answers come only from {first}&apos;s facts</span>
        </div>
      </div>
      <div className="msgs" ref={box} aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.who} ${m.answer && !m.answer.stated ? "unstated" : ""}`}>
            {m.text}
            {m.answer && m.answer.stated && (
              <div className="meta">
                {m.answer.from && <span className={`src ${m.answer.from === "policy" ? "policy" : ""}`}>From: {m.answer.from === "policy" ? "Kitstall policy" : FIELD_LABEL[m.answer.from]}</span>}
                <button className={m.rated === "up" ? "on" : ""} onClick={() => { rate(m.callId!, true); setMsgs((ms) => ms.map((x) => (x.id === m.id ? { ...x, rated: "up" } : x))); }} aria-label="Helpful">
                  <ThumbsUp size={13} /> Helpful
                </button>
                <button className={m.rated === "down" ? "on" : ""} onClick={() => { rate(m.callId!, false); setMsgs((ms) => ms.map((x) => (x.id === m.id ? { ...x, rated: "down" } : x))); }} aria-label="Not helpful">
                  <ThumbsDown size={13} />
                </button>
              </div>
            )}
            {m.answer && !m.answer.stated && (
              <div className="ask-maker">
                {m.sent ? (
                  <span className="confirmed">
                    <BadgeCheck size={15} /> Sent to {first}. Once answered, every buyer gets it.
                  </span>
                ) : (
                  <button
                    className="btn btn-support btn-sm"
                    onClick={() => {
                      askMaker(l.id, m.q ?? "");
                      setMsgs((ms) => ms.map((x) => (x.id === m.id ? { ...x, sent: true } : x)));
                    }}
                  >
                    <MessageCircleQuestion size={15} /> Ask {first}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="msg bot typing" aria-label="Checking the facts">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <div className="suggest">
        {sugg.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} disabled={thinking}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a question" aria-label="Your question" maxLength={200} />
        <button className="btn btn-primary" type="submit" disabled={!text.trim() || thinking} aria-label="Send">
          <Send size={16} />
        </button>
      </form>
      <p className="assist-foot">Each answer is one small model call, and it shows up in the AI ledger.</p>
    </section>
  );
}

function BuyModal({ open, onClose, l }: { open: boolean; onClose: () => void; l: Listing }) {
  const { buy } = useStore();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const pay = async () => {
    if (!ok) {
      setErr("Enter the email the file should go to.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      await buy(l.id, email.trim());
      setBusy(false);
      setEmail("");
      onClose();
    } catch (e) {
      setBusy(false);
      setErr((e as Error).message);
    }
  };

  return (
    <Modal
      open={open}
      title={l.kind === "agent" ? "Start this agent" : "Buy and download"}
      onClose={() => !busy && onClose()}
      width={480}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={pay} disabled={busy}>
            {busy ? <Spinner /> : null} {busy ? "Paying" : `Pay ${price(l.price)}`}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="lrow">
          <div className="thumb">
            <Photo id={coverId(l.cover)} w={120} h={90} alt="" />
          </div>
          <div>
            <strong>{l.title}</strong>
            <span>
              {price(l.price)}
              {l.monthly ? " a month" : ", one payment"}
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="buy-email">Email</label>
          <input id="buy-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          {err && <span className="err">{err}</span>}
        </div>
        <p className="small muted">{l.kind === "agent" ? "Setup steps arrive by email." : "The download link arrives by email and stays in your account."}</p>
      </div>
    </Modal>
  );
}
