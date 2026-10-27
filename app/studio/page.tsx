"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ban, Eye, FilePen, Inbox, ListChecks, Pause, PenLine, Play, Plus, Search, Trash2, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { ME, sellerById } from "@/lib/mock/sellers";
import { coverId, faceId } from "@/lib/photos";
import { FIELD_LABEL } from "@/lib/writer";
import { cost, day, num, price } from "@/lib/format";
import type { Listing, Status } from "@/lib/types";
import { Avatar, Drawer, Empty, Modal, Photo, Spinner } from "@/components/ui";
import { Composer } from "@/components/Composer";
import { Questions } from "@/components/Questions";

type Tab = "listings" | "new" | "questions";
type Filter = "all" | Status;
type Sort = "new" | "sales" | "views" | "price";

const STATUS_LABEL: Record<Status, string> = { live: "Live", review: "Waiting for you", draft: "Draft", paused: "Paused" };
const STATUS_CLASS: Record<Status, string> = { live: "ok", review: "warn", draft: "info", paused: "amber" };

export default function StudioPage() {
  const { listings, questions } = useStore();
  const me = sellerById(ME);
  const [tab, setTab] = useState<Tab>("listings");
  const [editing, setEditing] = useState<string | null>(null);
  const mine = useMemo(() => listings.filter((l) => l.sellerId === ME), [listings]);
  const open = questions.filter((q) => q.status === "open" && mine.some((l) => l.id === q.listingId)).length;

  const startEdit = (id: string | null) => {
    setEditing(id);
    setTab("new");
  };

  return (
    <>
      <div className="studio-head">
        <div className="studio-who">
          <Avatar id={faceId(me.avatar)} name={me.name} size={58} />
          <div>
            <h1>{me.shop}</h1>
            <p>
              {me.name}, {me.country}. Selling on Kitstall since {day(me.since)}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => startEdit(null)}>
          <Plus size={17} /> New listing
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Studio">
        <button role="tab" aria-selected={tab === "listings"} className={`tab ${tab === "listings" ? "on" : ""}`} onClick={() => setTab("listings")}>
          <ListChecks size={16} /> My listings
        </button>
        <button role="tab" aria-selected={tab === "new"} className={`tab ${tab === "new" ? "on" : ""}`} onClick={() => setTab("new")}>
          <PenLine size={16} /> {editing ? "Edit listing" : "New listing"}
        </button>
        <button role="tab" aria-selected={tab === "questions"} className={`tab ${tab === "questions" ? "on" : ""}`} onClick={() => setTab("questions")}>
          <Inbox size={16} /> Buyer questions {open > 0 && <em className="tab-n">{open}</em>}
        </button>
      </div>

      {tab === "listings" && <Listings mine={mine} onEdit={startEdit} />}
      {tab === "new" && (
        <Composer
          key={editing ?? "new"}
          editingId={editing}
          onDone={() => {
            setEditing(null);
            setTab("listings");
          }}
        />
      )}
      {tab === "questions" && <Questions mine={mine} />}
    </>
  );
}

function Listings({ mine, onEdit }: { mine: Listing[]; onEdit: (id: string) => void }) {
  const { setStatus, remove, confirmReview } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [del, setDel] = useState<Listing | null>(null);
  const [review, setReview] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    let r = mine;
    if (filter !== "all") r = r.filter((l) => l.status === filter);
    if (q.trim()) r = r.filter((l) => l.title.toLowerCase().includes(q.trim().toLowerCase()));
    const k = (l: Listing) => (sort === "sales" ? -l.sales30 : sort === "views" ? -l.views30 : sort === "price" ? -l.price : -l.createdAt);
    return [...r].sort((a, b) => k(a) - k(b));
  }, [mine, filter, q, sort]);

  const live = mine.filter((l) => l.status === "live");
  const spent = mine.reduce((n, l) => n + l.writeCost, 0);
  const reads = mine.reduce((n, l) => n + l.readsSinceWrite, 0);
  const count = (s: Filter) => (s === "all" ? mine.length : mine.filter((l) => l.status === s).length);

  return (
    <>
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi glass">
          <span className="kpi-top">Live listings</span>
          <strong>{live.length}</strong>
          <span className="sub">{count("review")} waiting for your approval</span>
        </div>
        <div className="kpi glass">
          <span className="kpi-top">Sales, 30 days</span>
          <strong>{num(mine.reduce((n, l) => n + l.sales30, 0))}</strong>
          <span className="sub">{num(mine.reduce((n, l) => n + l.views30, 0))} visits</span>
        </div>
        <div className="kpi glass">
          <span className="kpi-top">Spent writing your listings</span>
          <strong>{cost(spent)}</strong>
          <span className="sub">one write per listing version</span>
        </div>
        <div className="kpi glass">
          <span className="kpi-top">Reads since written</span>
          <strong>{num(reads)}</strong>
          <span className="sub">each one free</span>
        </div>
      </div>

      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a listing" aria-label="Find a listing" />
        </label>
        <div className="chips" role="group" aria-label="Status">
          {(["all", "live", "review", "draft", "paused"] as Filter[]).map((s) => (
            <button key={s} className={`chip ${filter === s ? "on" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? "All" : STATUS_LABEL[s]} <em>{count(s)}</em>
            </button>
          ))}
        </div>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" style={{ width: "auto" }}>
          <option value="new">Newest</option>
          <option value="sales">Most sales</option>
          <option value="views">Most visits</option>
          <option value="price">Highest price</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <Empty icon={<Search size={22} />} title="No listings here" text={q ? "Nothing matches that title." : "Nothing with this status right now."} />
      ) : (
        <div className="table-wrap glass">
          <table className="tbl">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Status</th>
                <th className="num">Price</th>
                <th className="num">Visits 30d</th>
                <th className="num">Sales 30d</th>
                <th>Written</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="lrow">
                      <div className="thumb">
                        <Photo id={coverId(l.cover)} w={120} h={90} alt="" />
                      </div>
                      <div>
                        <strong>{l.title}</strong>
                        <span>{l.category}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[l.status]}`}>{STATUS_LABEL[l.status]}</span>
                  </td>
                  <td className="num">
                    {price(l.price)}
                    {l.monthly ? "/mo" : ""}
                  </td>
                  <td className="num">{num(l.views30)}</td>
                  <td className="num">{num(l.sales30)}</td>
                  <td className="nowrap">{l.writtenAt ? <span>{day(l.writtenAt)}, {cost(l.writeCost)}</span> : <span className="muted">Not yet</span>}</td>
                  <td>
                    <div className="row-actions">
                      {l.status === "review" && (
                        <button className="btn btn-primary btn-sm" onClick={() => setReview(l)}>
                          <Eye size={15} /> Review
                        </button>
                      )}
                      {l.status === "live" && (
                        <Link className="icon-btn" href={`/item/${l.slug}`} title="See it in the market" aria-label={`See ${l.title} in the market`}>
                          <Eye size={17} />
                        </Link>
                      )}
                      <button className="icon-btn" onClick={() => onEdit(l.id)} title={l.status === "draft" ? "Continue" : "Edit"} aria-label={`Edit ${l.title}`}>
                        <FilePen size={17} />
                      </button>
                      {l.status === "live" && (
                        <button className="icon-btn" onClick={() => setStatus(l.id, "paused")} title="Pause" aria-label={`Pause ${l.title}`}>
                          <Pause size={17} />
                        </button>
                      )}
                      {l.status === "paused" && (
                        <button className="icon-btn" onClick={() => setStatus(l.id, "live")} title="Put back on sale" aria-label={`Resume ${l.title}`}>
                          <Play size={17} />
                        </button>
                      )}
                      <button className="icon-btn danger" onClick={() => setDel(l)} title="Delete" aria-label={`Delete ${l.title}`}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!del}
        title="Delete this listing?"
        onClose={() => setDel(null)}
        width={460}
        foot={
          <>
            <button className="btn btn-ghost" onClick={() => setDel(null)}>
              Keep it
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (del) remove(del.id);
                setDel(null);
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </>
        }
      >
        <p>
          <strong>{del?.title}</strong> will disappear from the market, and buyers who already bought it keep their copy. Its open questions are deleted too.
        </p>
      </Modal>

      <Drawer open={!!review} title="Review before it goes live" onClose={() => setReview(null)}>
        {review && (
          <div className="stack">
            <div className="lrow">
              <div className="thumb">
                <Photo id={coverId(review.cover)} w={120} h={90} alt="" />
              </div>
              <div>
                <strong>{review.title}</strong>
                <span>
                  Written {review.writtenAt ? day(review.writtenAt) : ""} from your facts, {cost(review.writeCost)}
                </span>
              </div>
            </div>
            <div>
              {review.description.map((s, i) => (
                <div key={i} className="draft-s">
                  <span className="txt">
                    {s.text}
                    <span className="src">{FIELD_LABEL[s.from]}</span>
                  </span>
                </div>
              ))}
            </div>
            {review.held.length > 0 && (
              <div className="held">
                <h3>
                  <Ban size={16} /> Held back, not in your facts
                </h3>
                <ul>
                  {review.held.map((h) => (
                    <li key={h.text}>
                      <s>{h.text}</s>
                      <span>{h.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="compose-actions">
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await confirmReview(review.id);
                  setBusy(false);
                  setReview(null);
                }}
              >
                {busy ? <Spinner /> : <Wand2 size={16} />} Approve and publish
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  const id = review.id;
                  setReview(null);
                  onEdit(id);
                }}
              >
                <FilePen size={16} /> Change the facts first
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
