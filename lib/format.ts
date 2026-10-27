const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** a shop price: $19, or $12.50 when it has cents */
export const price = (n: number) => (Number.isInteger(n) ? usd0.format(n) : usd2.format(n));
export const money = (n: number) => usd2.format(n);

/** AI costs are tiny, so they keep their real precision: $0.0042, $0.00002 */
export function cost(n: number) {
  if (n === 0) return "$0";
  if (n >= 10) return usd2.format(n);
  if (n >= 0.1) return "$" + n.toFixed(2);
  if (n >= 0.001) return "$" + n.toFixed(4);
  return "$" + n.toFixed(5);
}

export const num = (n: number) => Math.round(n).toLocaleString("en-US");
export const compact = (n: number) => (n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : num(n));

const dt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const d = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const dm = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const wd = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const t = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export const when = (ms: number) => dt.format(ms);
export const day = (ms: number) => d.format(ms);
export const dayMonth = (ms: number) => dm.format(ms);
export const weekday = (ms: number) => wd.format(ms);
export const clock = (ms: number) => t.format(ms);

export function ago(ms: number, now: number) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 50) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const dd = Math.round(h / 24);
  return dd === 1 ? "yesterday" : `${dd} days ago`;
}

export const plural = (n: number, one: string, many?: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many ?? one + "s"}`;

export function list(items: string[]) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
