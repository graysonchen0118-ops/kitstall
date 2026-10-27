"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, ReceiptText, Store, Sparkles, X, LayoutGrid } from "lucide-react";
import { useStore } from "@/lib/store";
import { view, type View } from "@/lib/bus";
import { ME } from "@/lib/mock/sellers";
import { cost, num } from "@/lib/format";
import { Toasts } from "./ui";

const Backdrop = dynamic(() => import("./three/Backdrop"), {
  ssr: false,
  loading: () => <div className="backdrop-ph" aria-hidden="true" />,
});

const NAV: { href: string; label: string; v: View; icon: React.ReactNode }[] = [
  { href: "/", label: "Market", v: "market", icon: <LayoutGrid size={17} /> },
  { href: "/studio", label: "Seller studio", v: "studio", icon: <Store size={17} /> },
  { href: "/ledger", label: "AI ledger", v: "ledger", icon: <ReceiptText size={17} /> },
];

function Meter({ className }: { className?: string }) {
  const { today } = useStore();
  return (
    <div className={`meter ${className ?? ""}`} title="Today, live">
      <span className="live-dot" />
      <span>
        <b key={today.visits} className="tick">
          {num(today.visits)}
        </b>{" "}
        visits
      </span>
      <span className="sep" />
      <span className="hide-md">
        <b>{num(today.sales)}</b> sales
      </span>
      <span className="sep hide-md" />
      <span className="ai">
        AI spend <b>{cost(today.spend)}</b>
      </span>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { questions, listings } = useStore();
  const [open, setOpen] = useState(false);

  const current = useMemo<View>(() => {
    if (path.startsWith("/item")) return "item";
    if (path.startsWith("/studio")) return "studio";
    if (path.startsWith("/ledger")) return "ledger";
    return "market";
  }, [path]);

  useEffect(() => {
    document.documentElement.dataset.view = current;
    view(current);
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [current, path]);

  // each layer drifts at its own speed while the page scrolls
  useEffect(() => {
    const on = () => document.documentElement.style.setProperty("--scroll", String(Math.round(window.scrollY)));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const mine = new Set(listings.filter((l) => l.sellerId === ME).map((l) => l.id));
  const waiting = questions.filter((q) => q.status === "open" && mine.has(q.listingId)).length + listings.filter((l) => l.sellerId === ME && l.status === "review").length;

  const links = (
    <>
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={current === n.v || (n.v === "market" && current === "item") ? "active" : ""} aria-current={current === n.v ? "page" : undefined}>
          {n.icon}
          <span>{n.label}</span>
          {n.v === "studio" && waiting > 0 && <em>{waiting}</em>}
        </Link>
      ))}
    </>
  );

  return (
    <div className="app">
      <Backdrop />
      <header className="topnav">
        <button className="icon-btn only-mobile" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Link href="/" className="brand" aria-label="Kitstall home">
          <span className="brand-mark">
            <Sparkles size={19} strokeWidth={2.4} />
          </span>
          <span>Kitstall</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {links}
        </nav>
        <div className="top-right">
          <Meter />
        </div>
      </header>

      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`mnav ${open ? "open" : ""}`} aria-label="Menu" aria-hidden={!open}>
        <div className="brand">
          <span className="brand-mark">
            <Sparkles size={19} strokeWidth={2.4} />
          </span>
          <span>Kitstall</span>
          <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        {links}
        <Meter />
      </aside>

      <main className="content">{children}</main>
      <footer className="foot">
        <span>
          <strong>Kitstall</strong>, digital goods from independent makers
        </span>
        <nav aria-label="Footer">
          <Link href="/">Market</Link>
          <Link href="/studio">Sell on Kitstall</Link>
          <Link href="/ledger">AI ledger</Link>
        </nav>
        <span>© 2026 Kitstall. Photos from Unsplash.</span>
      </footer>
      <Toasts />
    </div>
  );
}
