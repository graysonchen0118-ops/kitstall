"use client";

import Link from "next/link";
import { Bot, Star } from "lucide-react";
import type { Listing } from "@/lib/types";
import { sellerById } from "@/lib/mock/sellers";
import { coverId, faceId } from "@/lib/photos";
import { price } from "@/lib/format";
import { Avatar, Photo, Tilt } from "./ui";

export function ListingCard({ l, matched, score, i = 0 }: { l: Listing; matched?: string[]; score?: number; i?: number }) {
  const s = sellerById(l.sellerId);
  return (
    <Tilt max={5}>
      <Link href={`/item/${l.slug}`} className="lcard" style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }} data-id={l.id}>
        <div className="lc-img">
          <Photo id={coverId(l.cover)} w={480} h={360} alt={l.title} />
          {l.kind === "agent" ? (
            <span className="lc-badge agent">
              <Bot size={13} /> Agent
            </span>
          ) : (
            <span className="lc-badge">{l.category}</span>
          )}
          {score !== undefined && <span className="lc-score">{Math.round(score * 100)}% match</span>}
        </div>
        <div className="lc-body">
          <h3>{l.title}</h3>
          <div className="lc-seller">
            <Avatar id={faceId(s.avatar)} name={s.name} size={22} />
            <span>{s.shop}</span>
          </div>
          {matched && matched.length > 0 && (
            <div className="matched" aria-label="Matched on">
              {matched.slice(0, 3).map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          )}
          <div className="lc-foot">
            <span className="lc-price">
              {price(l.price)}
              {l.monthly && <small> / month</small>}
            </span>
            {l.reviews > 0 && (
              <span className="stars">
                <Star size={14} /> {l.rating.toFixed(1)} <span className="muted">({l.reviews})</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </Tilt>
  );
}
