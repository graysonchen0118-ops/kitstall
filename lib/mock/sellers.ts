import type { Seller } from "../types";
import { BASE_NOW, DAY } from "../rand";

export const ME = "s1";

export const SELLERS: Seller[] = [
  { id: "s1", name: "Inès Morel", shop: "Morel Sheets", country: "France", avatar: "av1", since: BASE_NOW - 640 * DAY, rating: 4.8 },
  { id: "s2", name: "Kwame Asante", shop: "Asante Agents", country: "Ghana", avatar: "av2", since: BASE_NOW - 210 * DAY, rating: 4.7 },
  { id: "s3", name: "Lucía Herrera", shop: "Papel y Plan", country: "Mexico", avatar: "av3", since: BASE_NOW - 820 * DAY, rating: 4.9 },
  { id: "s4", name: "Arjun Mehta", shop: "Gridline UI", country: "India", avatar: "av4", since: BASE_NOW - 500 * DAY, rating: 4.8 },
  { id: "s5", name: "Yuki Tanaka", shop: "Tanaka Type", country: "Japan", avatar: "av5", since: BASE_NOW - 1100 * DAY, rating: 4.9 },
  { id: "s6", name: "Omar Haddad", shop: "Cedar Code", country: "Canada", avatar: "av6", since: BASE_NOW - 380 * DAY, rating: 4.6 },
  { id: "s7", name: "Sophie Laurent", shop: "Lumen Presets", country: "Belgium", avatar: "av7", since: BASE_NOW - 700 * DAY, rating: 4.8 },
  { id: "s8", name: "Diego Fernandes", shop: "Batida Sound", country: "Brazil", avatar: "av8", since: BASE_NOW - 450 * DAY, rating: 4.7 },
  { id: "s9", name: "Amara Okafor", shop: "Okafor Learning", country: "Nigeria", avatar: "av9", since: BASE_NOW - 300 * DAY, rating: 4.9 },
  { id: "s10", name: "Emma Lindqvist", shop: "Fjord Social", country: "Sweden", avatar: "av10", since: BASE_NOW - 260 * DAY, rating: 4.6 },
  { id: "s11", name: "Rafael Torres", shop: "Prompt Taller", country: "Colombia", avatar: "av11", since: BASE_NOW - 150 * DAY, rating: 4.5 },
  { id: "s12", name: "Mei Chen", shop: "Ledger Lane", country: "Singapore", avatar: "av12", since: BASE_NOW - 560 * DAY, rating: 4.8 },
  { id: "s13", name: "Priya Raman", shop: "Wildflower Plans", country: "Canada", avatar: "av13", since: BASE_NOW - 930 * DAY, rating: 4.9 },
  { id: "s14", name: "Daniel Kim", shop: "Atlas Kits", country: "South Korea", avatar: "av14", since: BASE_NOW - 410 * DAY, rating: 4.7 },
];

export const sellerById = (id: string) => SELLERS.find((s) => s.id === id) ?? SELLERS[0];
