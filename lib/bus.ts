// The page talks to the 3D market hall through window events, so the scene never re-renders React.
export type Pulse = "visit" | "sale" | "write" | "query" | "ask" | "publish" | "error";
export type View = "market" | "item" | "studio" | "ledger";

export function pulse(kind: Pulse, n = 1) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kit:pulse", { detail: { kind, n } }));
}

/** which listings glow on the stall: search results, or the product being looked at */
export function highlight(ids: string[]) {
  if (typeof window === "undefined") return;
  (window as unknown as { __kitHi?: string[] }).__kitHi = ids;
  window.dispatchEvent(new CustomEvent("kit:hi", { detail: ids }));
}

export function view(v: View) {
  if (typeof window === "undefined") return;
  (window as unknown as { __kitView?: View }).__kitView = v;
  window.dispatchEvent(new CustomEvent("kit:view", { detail: v }));
}

export function currentView(): View {
  if (typeof window === "undefined") return "market";
  return (window as unknown as { __kitView?: View }).__kitView ?? "market";
}

export function currentHighlight(): string[] {
  if (typeof window === "undefined") return [];
  return (window as unknown as { __kitHi?: string[] }).__kitHi ?? [];
}
