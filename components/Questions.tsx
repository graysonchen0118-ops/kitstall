"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, CircleSlash, Inbox, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { answer as detect } from "@/lib/assistant";
import { coverId } from "@/lib/photos";
import { ago } from "@/lib/format";
import type { Listing, Question } from "@/lib/types";
import { Empty, Photo, Spinner } from "./ui";

type F = "open" | "answered" | "dismissed";

export function Questions({ mine }: { mine: Listing[] }) {
  const { questions } = useStore();
  const [f, setF] = useState<F>("open");
  const ids = new Set(mine.map((l) => l.id));
  const all = questions.filter((q) => ids.has(q.listingId));
  const rows = useMemo(() => all.filter((q) => q.status === f).sort((a, b) => b.asked - a.asked || b.lastAt - a.lastAt), [all, f]);
  const n = (s: F) => all.filter((q) => q.status === s).length;

  return (
    <>
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <div className="seg-ctl" role="group" aria-label="Show">
          {(["open", "answered", "dismissed"] as F[]).map((s) => (
            <button key={s} className={f === s ? "on" : ""} onClick={() => setF(s)}>
              {s === "open" ? "Waiting" : s === "answered" ? "Answered" : "Dismissed"} ({n(s)})
            </button>
          ))}
        </div>
        <span className="muted small">Questions the assistant couldn&apos;t answer from your facts. One answer here reaches every buyer who asks after it.</span>
      </div>
      {rows.length === 0 ? (
        <Empty icon={<Inbox size={22} />} title={f === "open" ? "No questions waiting" : "Nothing here yet"} text={f === "open" ? "When a buyer asks something your facts don't cover, it lands here." : "Questions move here once you deal with them."} />
      ) : (
        <div className="qlist">
          {rows.map((q, i) => (
            <QCard key={q.id} q={q} l={mine.find((l) => l.id === q.listingId)!} i={i} />
          ))}
        </div>
      )}
    </>
  );
}

function QCard({ q, l, i }: { q: Question; l: Listing; i: number }) {
  const { answerQuestion, dismissQuestion, reopenQuestion, now } = useStore();
  const tool = useMemo(() => detect({ ...l, answers: [] }, q.text).tool, [l, q.text]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"yes" | "no" | "text" | null>(null);
  const [err, setErr] = useState("");

  const save = async (kind: "yes" | "no" | "text") => {
    if (kind === "text" && text.trim().length < 3) {
      setErr("Write a short answer first.");
      return;
    }
    setErr("");
    setBusy(kind);
    await answerQuestion(q.id, kind, text.trim());
    setBusy(null);
  };

  return (
    <article className="qcard glass" style={{ animationDelay: `${i * 60}ms` }}>
      <div className="qtop">
        <div className="thumb">
          <Photo id={coverId(l.cover)} w={120} h={90} alt="" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="q">&ldquo;{q.text}&rdquo;</div>
          <div className="meta">
            On <Link href={`/item/${l.slug}`} style={{ color: "var(--accent)", fontWeight: 700 }}>{l.title}</Link>, first asked {ago(q.firstAt, now)}, last {ago(q.lastAt, now)}
          </div>
        </div>
        <span className="qcount">Asked {q.asked}×</span>
      </div>

      {q.status === "open" && (
        <>
          <div className="qanswer">
            {tool ? (
              <>
                <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => save("yes")}>
                  {busy === "yes" ? <Spinner /> : <ThumbsUp size={15} />} Yes, it works with {tool}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => save("no")}>
                  {busy === "no" ? <Spinner /> : <ThumbsDown size={15} />} No, it doesn&apos;t
                </button>
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note for buyers (optional)" aria-label="Note for buyers" maxLength={160} />
              </>
            ) : (
              <>
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer, the way you'd tell a buyer" aria-label="Your answer" maxLength={200} />
                <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => save("text")}>
                  {busy === "text" ? <Spinner /> : <BadgeCheck size={15} />} Save answer
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => dismissQuestion(q.id)}>
              <CircleSlash size={15} /> Dismiss
            </button>
          </div>
          {err && <span className="err small">{err}</span>}
          {busy && <span className="muted small">Saving it as a fact and rewriting the listing once</span>}
        </>
      )}
      {q.status === "answered" && (
        <div className="qdone">
          <strong>Your answer:</strong> {q.answer}
        </div>
      )}
      {q.status === "dismissed" && (
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => reopenQuestion(q.id)}>
            <RotateCcw size={15} /> Move back to waiting
          </button>
        </div>
      )}
    </article>
  );
}
