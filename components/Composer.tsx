"use client";

import { useMemo, useState } from "react";
import { Ban, Check, Lightbulb, PenLine, RotateCcw, Save, Sparkles, Wand2, X } from "lucide-react";
import { useStore, type ListingInput } from "@/lib/store";
import { FIELD_LABEL, type Draft } from "@/lib/writer";
import { WRITE_AVG } from "@/lib/mock/ledger";
import { COVER_CHOICES, coverId } from "@/lib/photos";
import { cost, num } from "@/lib/format";
import type { Category, Kind, Sentence } from "@/lib/types";
import { Photo, Skel, Spinner } from "./ui";

const CATS: Category[] = ["Spreadsheets", "Planners", "UI kits", "Code kits", "Prompt packs", "AI agents", "Photo presets", "Audio", "Fonts", "Guides", "Social templates"];

interface Form {
  title: string;
  category: Category;
  kind: Kind;
  price: string;
  monthly: boolean;
  cover: string;
  madeFor: string;
  format: string;
  version: string;
  worksWith: string[];
  notWith: string[];
  includes: string[];
  license: string;
  language: string;
}

const EMPTY: Form = { title: "", category: "Spreadsheets", kind: "download", price: "", monthly: false, cover: COVER_CHOICES[0], madeFor: "", format: "", version: "1.0", worksWith: [], notWith: [], includes: [], license: "", language: "English" };

const EXAMPLE: Form = {
  title: "Freelance Quote Builder",
  category: "Spreadsheets",
  kind: "download",
  price: "16",
  monthly: false,
  cover: "spreadsheet-7",
  madeFor: "Freelancers who send quotes before every new project",
  format: "Excel workbook (.xlsx)",
  version: "1.0",
  worksWith: ["Microsoft Excel 2019 and later", "Excel for Mac 2021"],
  notWith: [],
  includes: ["Quote builder with line items", "Hourly and fixed price modes", "Printable quote page"],
  license: "Personal and business use, no resale",
  language: "English and French",
};

function fromListing(id: string | null, listings: ReturnType<typeof useStore>["listings"]): Form {
  const l = id ? listings.find((x) => x.id === id) : null;
  if (!l) return EMPTY;
  return { title: l.title, category: l.category, kind: l.kind, price: String(l.price), monthly: l.monthly, cover: l.cover, madeFor: l.facts.madeFor, format: l.facts.format, version: l.facts.version, worksWith: [...l.facts.worksWith], notWith: [...l.facts.notWith], includes: [...l.facts.includes], license: l.facts.license, language: l.facts.language };
}

export function Composer({ editingId, onDone }: { editingId: string | null; onDone: () => void }) {
  const { listings, draft: write, publish, saveDraft } = useStore();
  const editing = editingId ? listings.find((x) => x.id === editingId) : null;
  const [f, setF] = useState<Form>(() => fromListing(editingId, listings));
  const [tried, setTried] = useState(false);
  const [writing, setWriting] = useState(false);
  const [result, setResult] = useState<{ draft: Draft; callId: string } | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [edit, setEdit] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [writes, setWrites] = useState(0);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (result) setResult(null);
  };

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (f.title.trim().length < 4) e.title = "Give it a title of at least 4 characters.";
    const p = Number(f.price);
    if (!f.price || !Number.isFinite(p) || p <= 0) e.price = "Set a price above zero.";
    else if (p > 999) e.price = "Prices go up to $999.";
    if (f.madeFor.trim().length < 8) e.madeFor = "Say who it is for, in a few words.";
    if (!f.format.trim()) e.format = "Say what the buyer receives.";
    if (!f.includes.length) e.includes = "Add at least one thing that is inside.";
    if (!f.license.trim()) e.license = "Say what the license allows.";
    return e;
  }, [f]);
  const valid = Object.keys(errors).length === 0;

  const input = (): ListingInput => ({
    title: f.title.trim(),
    category: f.category,
    kind: f.kind,
    price: Math.round(Number(f.price) * 100) / 100 || 0,
    monthly: f.kind === "agent" && f.monthly,
    cover: f.cover,
    facts: { madeFor: f.madeFor.trim(), format: f.format.trim(), version: f.version.trim() || "1.0", updated: "28 Oct 2026", worksWith: f.worksWith, notWith: f.notWith, includes: f.includes, license: f.license.trim(), language: f.language.trim() || "English" },
    tags: editing?.tags ?? [],
    about: editing?.about ?? `${f.title} ${f.madeFor} ${f.includes.join(" ")}`,
  });

  const runWrite = async () => {
    setTried(true);
    if (!valid) return;
    setWriting(true);
    setResult(null);
    const r = await write(input());
    setResult(r);
    setSentences(r.draft.sentences);
    setWrites((n) => n + 1);
    setWriting(false);
  };

  const factCount = [f.madeFor, f.format, f.version, f.license, f.language].filter((x) => x.trim()).length + f.worksWith.length + f.notWith.length + f.includes.length;
  const peers = listings.filter((l) => l.category === f.category && l.status === "live");
  const avgViews = peers.length ? Math.round(peers.reduce((n, l) => n + l.views30, 0) / peers.length) : 900;

  return (
    <div className="composer">
      <section className="panel glass" aria-label="Your facts">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <h2>{editing ? `Editing ${editing.title}` : "Your facts"}</h2>
            <p className="panel-sub">This is the only thing the writer and the buyer assistant will ever use. Anything you leave out, they won&apos;t claim.</p>
          </div>
          {!editing && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setF(EXAMPLE);
                setResult(null);
                setTried(false);
              }}
            >
              <Lightbulb size={15} /> Fill in an example
            </button>
          )}
        </div>

        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="f-title">Title</label>
            <input id="f-title" className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Freelance Quote Builder" />
            {tried && errors.title && <span className="err">{errors.title}</span>}
          </div>
          <div className="field">
            <label htmlFor="f-cat">Category</label>
            <select id="f-cat" className="select" value={f.category} onChange={(e) => set("category", e.target.value as Category)}>
              {CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-price">Price in USD</label>
            <input id="f-price" className="input" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="16" />
            {tried && errors.price && <span className="err">{errors.price}</span>}
          </div>
          <div className="field">
            <label>Type</label>
            <div className="seg-ctl" role="group" aria-label="Type">
              <button type="button" className={f.kind === "download" ? "on" : ""} onClick={() => set("kind", "download")}>
                Download
              </button>
              <button type="button" className={f.kind === "agent" ? "on" : ""} onClick={() => set("kind", "agent")}>
                Agent
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-ver">Version</label>
            <input id="f-ver" className="input" value={f.version} onChange={(e) => set("version", e.target.value)} placeholder="1.0" />
          </div>
          {f.kind === "agent" && (
            <label className="field wide" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={f.monthly} onChange={(e) => set("monthly", e.target.checked)} /> Charged every month
            </label>
          )}
          <div className="field wide">
            <label htmlFor="f-for">Made for</label>
            <input id="f-for" className="input" value={f.madeFor} onChange={(e) => set("madeFor", e.target.value)} placeholder="Freelancers who send quotes before every new project" />
            {tried && errors.madeFor && <span className="err">{errors.madeFor}</span>}
          </div>
          <div className="field wide">
            <label htmlFor="f-format">What the buyer receives</label>
            <input id="f-format" className="input" value={f.format} onChange={(e) => set("format", e.target.value)} placeholder="Excel workbook (.xlsx)" />
            {tried && errors.format && <span className="err">{errors.format}</span>}
          </div>
          <TagField id="f-works" label="Works with" items={f.worksWith} onChange={(v) => set("worksWith", v)} placeholder="Microsoft Excel 2019 and later" />
          <TagField id="f-not" label="Does not work with" items={f.notWith} onChange={(v) => set("notWith", v)} placeholder="Google Sheets" no />
          <TagField id="f-inc" label="What's inside" items={f.includes} onChange={(v) => set("includes", v)} placeholder="Printable quote page" error={tried ? errors.includes : undefined} />
          <div className="field wide">
            <label htmlFor="f-lic">License</label>
            <input id="f-lic" className="input" value={f.license} onChange={(e) => set("license", e.target.value)} placeholder="Personal and business use, no resale" />
            {tried && errors.license && <span className="err">{errors.license}</span>}
          </div>
          <div className="field wide">
            <label htmlFor="f-lang">Language</label>
            <input id="f-lang" className="input" value={f.language} onChange={(e) => set("language", e.target.value)} />
          </div>
          <div className="field wide">
            <label>Cover photo</label>
            <div className="covers-pick" role="radiogroup" aria-label="Cover photo">
              {COVER_CHOICES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={f.cover === c} className={f.cover === c ? "on" : ""} onClick={() => set("cover", c)}>
                  <Photo id={coverId(c)} w={120} h={90} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel glass" aria-label="Listing writer">
        <h2>Listing writer</h2>
        <p className="panel-sub">Runs once when you save. Every sentence shows the fact it came from, and you approve it before buyers see it.</p>

        {!result && !writing && (
          <div className="writer-idle">
            <span className="ic">
              <Wand2 size={26} />
            </span>
            <strong>{factCount} facts ready</strong>
            <p>The writer turns them into a listing and a search entry in one go. After you approve, every visit reads that stored version.</p>
            {tried && !valid && <span className="err small">Fill in the fields marked on the left first.</span>}
            <button className="btn btn-primary" onClick={runWrite}>
              <Sparkles size={16} /> Write the listing
            </button>
          </div>
        )}

        {writing && (
          <div className="stack" aria-label="Writing">
            <span className="muted small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <Spinner /> Writing from {factCount} facts, once
            </span>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skel key={i} h={14} w={`${92 - i * 9}%`} />
            ))}
          </div>
        )}

        {result && !writing && (
          <>
            <div>
              {sentences.map((s, i) => (
                <div key={i} className="draft-s" style={{ animationDelay: `${i * 70}ms` }}>
                  {edit === i ? (
                    <div className="stack" style={{ flex: 1 }}>
                      <textarea className="textarea" value={editText} onChange={(e) => setEditText(e.target.value)} aria-label="Edit sentence" />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!editText.trim()}
                          onClick={() => {
                            setSentences((ss) => ss.map((x, k) => (k === i ? { ...x, text: editText.trim() } : x)));
                            setEdit(null);
                          }}
                        >
                          <Check size={15} /> Keep
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="txt">
                        {s.text}
                        <span className="src">{FIELD_LABEL[s.from]}</span>
                      </span>
                      <button
                        className="icon-btn"
                        aria-label="Edit this sentence"
                        onClick={() => {
                          setEdit(i);
                          setEditText(s.text);
                        }}
                      >
                        <PenLine size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {result.draft.held.length > 0 && (
              <div className="held">
                <h3>
                  <Ban size={16} /> Held back, because your facts don&apos;t say so
                </h3>
                <ul>
                  {result.draft.held.map((h) => (
                    <li key={h.text}>
                      <s>{h.text}</s>
                      <span>{h.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="costbox">
              <div>
                <span>This write</span>
                <strong>{cost(result.draft.cost)}</strong>
                <em>
                  {writes} {writes === 1 ? "call" : "calls"}, {num(result.draft.tokensIn + result.draft.tokensOut)} tokens
                </em>
              </div>
              <div>
                <span>Each visit after you publish</span>
                <strong>$0</strong>
                <em>reads the stored listing</em>
              </div>
              <div className="bad">
                <span>Written on every page view</span>
                <strong>{cost(avgViews * WRITE_AVG)}/mo</strong>
                <em>at about {num(avgViews)} visits a month, like similar listings</em>
              </div>
            </div>

            <div className="compose-actions">
              <button
                className="btn btn-primary"
                disabled={publishing || edit !== null}
                onClick={async () => {
                  setPublishing(true);
                  await publish(input(), sentences, result.draft, result.callId, editingId);
                  setPublishing(false);
                  onDone();
                }}
              >
                {publishing ? <Spinner /> : <Check size={16} />} Approve and publish
              </button>
              <button className="btn btn-ghost" onClick={runWrite} disabled={publishing}>
                <RotateCcw size={16} /> Write again
              </button>
              <button
                className="btn btn-ghost"
                disabled={publishing}
                onClick={() => {
                  saveDraft(input(), editingId);
                  onDone();
                }}
              >
                <Save size={16} /> Save as draft
              </button>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              Writing again is another call. Editing a sentence yourself is free.
            </p>
          </>
        )}
        {!result && !writing && (
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!f.title.trim()) {
                  setTried(true);
                  return;
                }
                saveDraft(input(), editingId);
                onDone();
              }}
            >
              <Save size={15} /> Save as draft without writing
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function TagField({ id, label, items, onChange, placeholder, no, error }: { id: string; label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string; no?: boolean; error?: string }) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (!t || items.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setV("");
      return;
    }
    onChange([...items, t]);
    setV("");
  };
  return (
    <div className="field wide">
      <label htmlFor={id}>{label}</label>
      <div className="add-row">
        <input
          id={id}
          className="input"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-ghost" onClick={add} disabled={!v.trim()}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="taglist">
          {items.map((x) => (
            <span key={x} className={no ? "no" : ""}>
              {x}
              <button type="button" aria-label={`Remove ${x}`} onClick={() => onChange(items.filter((y) => y !== x))}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
