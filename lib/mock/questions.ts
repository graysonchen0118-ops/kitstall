import type { Question } from "../types";
import { BASE_NOW, DAY, HOUR } from "../rand";

// Questions buyers asked that the assistant could not answer from the facts. They land with the
// maker, and one answer becomes a fact the assistant can use for every buyer after that.
export const QUESTIONS: Question[] = [
  { id: "q1", listingId: "L01", text: "Does it work with Google Sheets?", asked: 7, firstAt: BASE_NOW - 4 * DAY, lastAt: BASE_NOW - 2 * HOUR, status: "open" },
  { id: "q2", listingId: "L02", text: "Can it import a bank export file?", asked: 4, firstAt: BASE_NOW - 6 * DAY, lastAt: BASE_NOW - 19 * HOUR, status: "open" },
  { id: "q3", listingId: "L01", text: "Can I put my own logo on the invoices?", asked: 3, firstAt: BASE_NOW - 9 * DAY, lastAt: BASE_NOW - 1 * DAY, status: "open" },
  { id: "q4", listingId: "L03", text: "Can it track stock across two locations?", asked: 2, firstAt: BASE_NOW - 3 * DAY, lastAt: BASE_NOW - 30 * HOUR, status: "open" },
  { id: "q5", listingId: "L01", text: "Does it calculate late payment fees?", asked: 2, firstAt: BASE_NOW - 12 * DAY, lastAt: BASE_NOW - 5 * DAY, status: "open" },
  { id: "q6", listingId: "L02", text: "Does it work in euros?", asked: 5, firstAt: BASE_NOW - 44 * DAY, lastAt: BASE_NOW - 40 * DAY, status: "answered", answer: "Yes, any currency. You set it once on the settings tab." },
  { id: "q7", listingId: "L49", text: "Will there be a 2026 version?", asked: 1, firstAt: BASE_NOW - 20 * DAY, lastAt: BASE_NOW - 20 * DAY, status: "dismissed" },
];
