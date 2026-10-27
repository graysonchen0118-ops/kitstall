import type { Category, Facts, Kind, Listing, MakerAnswer, Status } from "../types";
import { writeListing } from "../writer";
import { slugify } from "../format";
import { BASE_NOW, DAY, HOUR, seeded } from "../rand";

interface Seed {
  id: string;
  title: string;
  seller: string;
  cat: Category;
  kind?: Kind;
  price: number;
  monthly?: boolean;
  cover: string;
  status?: Status;
  f: Facts;
  tags: string[];
  about: string;
  views: number;
  sales: number;
  rating: number;
  reviews: number;
  age: number;
  answers?: MakerAnswer[];
}

const F = (madeFor: string, format: string, version: string, updated: string, worksWith: string[], notWith: string[], includes: string[], license: string, language = "English"): Facts => ({
  madeFor,
  format,
  version,
  updated,
  worksWith,
  notWith,
  includes,
  license,
  language,
});

const SEEDS: Seed[] = [
  // Spreadsheets
  { id: "L01", title: "Freelance Invoice Tracker", seller: "s1", cat: "Spreadsheets", price: 19, cover: "spreadsheet-1", f: F("Freelancers who bill clients by the project or by the hour", "Excel workbook (.xlsx)", "3.2", "12 Oct 2026", ["Microsoft Excel 2019 and later", "Excel for Mac 2021"], [], ["Invoice log with overdue alerts", "Client sheet with payment terms", "Monthly income dashboard"], "Personal and business use, no resale", "English and French"), tags: ["invoices", "freelance", "excel", "income"], about: "get paid on time, track overdue invoices, chase clients, freelance income", views: 2140, sales: 96, rating: 4.8, reviews: 61, age: 380 },
  { id: "L02", title: "Household Budget Planner", seller: "s1", cat: "Spreadsheets", price: 12, cover: "spreadsheet-2", f: F("Couples and families planning their monthly spending", "Excel workbook (.xlsx)", "2.0", "2 Sep 2026", ["Microsoft Excel 2016 and later", "Google Sheets"], [], ["12 monthly budget tabs", "Savings goals tracker", "Debt payoff sheet"], "Personal use"), tags: ["budget", "family", "savings"], about: "household budget, family money, monthly spending, savings, debt", views: 1680, sales: 74, rating: 4.7, reviews: 48, age: 520, answers: [{ q: "Does it work in euros?", a: "Yes, any currency. You set it once on the settings tab.", at: BASE_NOW - 40 * DAY }] },
  { id: "L03", title: "Small Shop Inventory Sheet", seller: "s1", cat: "Spreadsheets", price: 24, cover: "spreadsheet-3", f: F("Small shops that sell physical products", "Excel workbook (.xlsx)", "1.4", "21 Sep 2026", ["Microsoft Excel 2019 and later"], ["Google Sheets"], ["Stock levels with reorder alerts", "Supplier list", "Sales by product"], "Business use for one shop"), tags: ["inventory", "stock", "shop"], about: "inventory, stock levels, reorder, small shop, retail products, suppliers", views: 960, sales: 31, rating: 4.6, reviews: 19, age: 300 },
  { id: "L04", title: "VAT and Expense Log", seller: "s12", cat: "Spreadsheets", price: 15, cover: "spreadsheet-4", f: F("Sole traders who file VAT every quarter", "Google Sheets template", "2.1", "30 Sep 2026", ["Google Sheets", "Microsoft Excel 2019 and later"], [], ["Receipt log", "Quarterly VAT summary", "Mileage tracker"], "Personal and business use"), tags: ["vat", "taxes", "expenses"], about: "vat, tax, receipts, expenses, sole trader, bookkeeping, quarter", views: 1210, sales: 58, rating: 4.8, reviews: 33, age: 410 },
  { id: "L05", title: "Studio Cashflow Forecast", seller: "s12", cat: "Spreadsheets", price: 29, cover: "spreadsheet-5", f: F("Small studios and agencies planning twelve months ahead", "Excel workbook (.xlsx)", "1.2", "8 Oct 2026", ["Microsoft Excel 2021", "Google Sheets"], [], ["12 month cashflow forecast", "Best and worst case switch", "Hiring plan tab"], "Business use for one company"), tags: ["cashflow", "forecast", "agency"], about: "cashflow forecast, studio finance, agency money, hiring plan", views: 740, sales: 22, rating: 4.9, reviews: 14, age: 200 },
  { id: "L47", title: "Freelance Time Tracker", seller: "s1", cat: "Spreadsheets", price: 14, cover: "spreadsheet-6", status: "review", f: F("Freelancers who bill by the hour", "Excel workbook (.xlsx)", "1.0", "27 Oct 2026", ["Microsoft Excel 2019 and later"], [], ["Timesheet by client", "Weekly hours summary", "Billable rate calculator"], "Personal and business use, no resale", "English and French"), tags: ["time", "freelance", "hours"], about: "time tracking, billable hours, timesheet, freelance clients", views: 0, sales: 0, rating: 0, reviews: 0, age: 1 },
  { id: "L48", title: "Client Proposal Builder", seller: "s1", cat: "Spreadsheets", price: 17, cover: "spreadsheet-7", status: "draft", f: F("Freelancers who send quotes to new clients", "Excel workbook (.xlsx)", "0.9", "25 Oct 2026", [], [], ["Quote builder"], ""), tags: ["proposal", "quotes"], about: "client proposals, quotes, freelance pricing", views: 0, sales: 0, rating: 0, reviews: 0, age: 3 },
  { id: "L49", title: "Christmas Gift Budget", seller: "s1", cat: "Spreadsheets", price: 6, cover: "spreadsheet-8", status: "paused", f: F("Families keeping holiday spending in check", "Excel workbook (.xlsx)", "1.1", "2 Dec 2025", ["Microsoft Excel 2016 and later", "Google Sheets"], [], ["Gift list by person", "Budget per person", "Order tracker"], "Personal use"), tags: ["christmas", "gifts", "budget"], about: "christmas gift budget, family spending, holiday", views: 40, sales: 1, rating: 4.5, reviews: 6, age: 330 },

  // Planners
  { id: "L06", title: "Weekly Focus Planner", seller: "s3", cat: "Planners", price: 9, cover: "planner-1", f: F("People who plan their week on Sunday evening", "Printable PDF in A4 and US Letter", "4.0", "15 Aug 2026", ["Any PDF reader", "GoodNotes", "Notability"], [], ["52 weekly spreads", "Habit tracker", "Monthly review pages"], "Personal use"), tags: ["planner", "weekly", "focus"], about: "weekly planner, focus, goals, habits, routine, printable", views: 1890, sales: 112, rating: 4.9, reviews: 88, age: 700 },
  { id: "L07", title: "Content Calendar Workspace", seller: "s3", cat: "Planners", price: 14, cover: "planner-2", f: F("Solo creators who post on more than one channel", "Notion template, duplicated with one link", "2.3", "1 Oct 2026", ["Notion free and paid plans"], [], ["Calendar view by channel", "Idea bank", "Publishing checklist"], "Personal and business use"), tags: ["content", "calendar", "notion"], about: "content calendar, social posts schedule, creator planning, ideas", views: 1320, sales: 64, rating: 4.7, reviews: 37, age: 260 },
  { id: "L08", title: "Wedding Planning Binder", seller: "s13", cat: "Planners", price: 18, cover: "planner-3", f: F("Couples planning a wedding without a planner", "Printable PDF plus editable Canva files", "3.1", "19 Sep 2026", ["Canva free plan", "Any PDF reader"], [], ["Guest list and RSVP tracker", "Budget pages", "Day-of timeline"], "Personal use"), tags: ["wedding", "rsvp", "guests"], about: "wedding planning, guests, rsvp, budget, venue, ceremony day", views: 1450, sales: 70, rating: 4.9, reviews: 52, age: 900 },
  { id: "L09", title: "Trip Itinerary Kit", seller: "s13", cat: "Planners", price: 8, cover: "planner-4", f: F("Travellers planning trips with several stops", "Printable PDF plus a Google Sheets copy", "1.6", "4 Jul 2026", ["Google Sheets", "Any PDF reader"], [], ["Day by day itinerary", "Packing list", "Budget per city"], "Personal use"), tags: ["travel", "itinerary", "packing"], about: "travel itinerary, trip planning, packing list, vacation budget", views: 880, sales: 41, rating: 4.8, reviews: 22, age: 340 },
  { id: "L10", title: "Habit and Goal Tracker", seller: "s3", cat: "Planners", price: 7, cover: "planner-5", f: F("Anyone building a daily routine", "Google Sheets template", "2.0", "28 Aug 2026", ["Google Sheets"], ["Microsoft Excel"], ["Habit grid with streaks", "Quarterly goals", "Mood log"], "Personal use"), tags: ["habits", "goals", "routine"], about: "habit tracker, daily routine, goals, streaks", views: 1030, sales: 57, rating: 4.6, reviews: 30, age: 450 },

  // UI kits
  { id: "L11", title: "Banking App Interface Kit", seller: "s4", cat: "UI kits", price: 49, cover: "ui-1", f: F("Product teams designing a mobile banking app", "Figma file", "2.4", "9 Oct 2026", ["Figma"], ["Sketch", "Adobe XD"], ["86 screens", "Light and dark mode", "Component library with variants"], "Unlimited client projects"), tags: ["banking", "fintech", "mobile app"], about: "mobile banking app design, fintech screens, ui components", views: 1240, sales: 38, rating: 4.8, reviews: 26, age: 420 },
  { id: "L12", title: "Dashboard Components", seller: "s4", cat: "UI kits", price: 39, cover: "ui-2", f: F("Designers building admin dashboards for subscription products", "Figma file", "3.0", "26 Sep 2026", ["Figma"], [], ["240 components", "12 dashboard layouts", "Chart styles"], "Unlimited client projects"), tags: ["dashboard", "saas", "components"], about: "dashboard design, admin screens, saas interface, charts", views: 980, sales: 29, rating: 4.7, reviews: 18, age: 360 },
  { id: "L13", title: "Mobile Onboarding Screens", seller: "s4", cat: "UI kits", price: 19, cover: "ui-3", f: F("Teams launching a new mobile app", "Figma file", "1.5", "3 Aug 2026", ["Figma"], [], ["34 onboarding screens", "Illustration slots", "Copy guidelines"], "Unlimited client projects"), tags: ["onboarding", "mobile app"], about: "mobile app onboarding, sign up screens, first launch", views: 610, sales: 24, rating: 4.6, reviews: 12, age: 230 },
  { id: "L14", title: "Food Ordering App Kit", seller: "s4", cat: "UI kits", price: 29, cover: "ui-4", f: F("Restaurants and agencies designing an ordering app", "Figma file", "1.9", "17 Sep 2026", ["Figma"], [], ["48 screens", "Menu and cart flows", "Courier tracking screens"], "Unlimited client projects"), tags: ["restaurant", "delivery", "mobile app"], about: "restaurant food ordering app, menu, delivery, cart", views: 720, sales: 21, rating: 4.7, reviews: 11, age: 280 },

  // Code kits
  { id: "L15", title: "Subscription Starter Kit", seller: "s14", cat: "Code kits", price: 79, cover: "code-1", f: F("Developers launching a subscription product", "Source code in TypeScript", "4.1", "20 Oct 2026", ["Node 20 and later", "PostgreSQL 15"], ["MySQL"], ["Sign-up and login", "Subscription billing pages", "Admin dashboard"], "One product per license"), tags: ["saas", "starter", "subscriptions"], about: "saas starter code, subscription billing, login, admin dashboard, developer", views: 1530, sales: 33, rating: 4.7, reviews: 21, age: 610 },
  { id: "L16", title: "Landing Page Starter Pack", seller: "s6", cat: "Code kits", price: 25, cover: "code-2", f: F("Makers who need a launch page this week", "HTML and CSS source", "2.2", "11 Sep 2026", ["Any static host"], [], ["9 landing pages", "Contact form", "Search visibility checklist"], "Unlimited personal and client sites"), tags: ["landing page", "website", "launch"], about: "landing page website code, launch page, portfolio site", views: 1100, sales: 47, rating: 4.6, reviews: 25, age: 390 },
  { id: "L17", title: "Booking Calendar Widget", seller: "s6", cat: "Code kits", price: 35, cover: "code-3", f: F("Salons, tutors and clinics that take bookings on their site", "JavaScript source", "3.3", "5 Oct 2026", ["Any website that accepts a script tag"], [], ["Calendar widget", "Email confirmations", "Time zone handling"], "One website per license"), tags: ["booking", "appointments", "widget"], about: "booking calendar, appointments, salon, clinic, website widget, reminders", views: 830, sales: 26, rating: 4.5, reviews: 15, age: 330 },
  { id: "L18", title: "Shop Order Scripts", seller: "s14", cat: "Code kits", price: 22, cover: "code-4", f: F("Shop owners who want orders copied and counted automatically", "Python scripts", "1.3", "14 Oct 2026", ["Python 3.11 and later", "Shopify order webhooks", "WooCommerce order webhooks"], [], ["Order to spreadsheet script", "Low stock alert", "Daily sales email"], "Business use for one shop"), tags: ["shop", "orders", "automation"], about: "shop orders automation, script, low stock alert, daily sales email", views: 540, sales: 19, rating: 4.6, reviews: 9, age: 170 },

  // Prompt packs
  { id: "L19", title: "Product Description Prompts", seller: "s11", cat: "Prompt packs", price: 12, cover: "prompt-1", f: F("Shop owners writing product pages", "PDF plus a plain text file", "2.0", "22 Sep 2026", ["Any chat assistant"], [], ["120 prompts", "Tone of voice guide", "Before and after examples"], "Personal and business use"), tags: ["writing", "product pages", "copy"], about: "product description writing, shop copy, ecommerce pages", views: 990, sales: 52, rating: 4.5, reviews: 27, age: 140 },
  { id: "L20", title: "Cold Email Prompt Pack", seller: "s11", cat: "Prompt packs", price: 10, cover: "prompt-2", f: F("Freelancers and agencies looking for new clients", "PDF plus a plain text file", "1.4", "29 Aug 2026", ["Any chat assistant"], [], ["60 prompts", "Follow-up sequences", "Subject line formulas"], "Personal and business use"), tags: ["email", "outreach", "clients"], about: "cold email outreach, find new clients, freelance sales, follow up", views: 870, sales: 39, rating: 4.4, reviews: 20, age: 120 },
  { id: "L21", title: "Lesson Plan Prompts", seller: "s11", cat: "Prompt packs", price: 9, cover: "prompt-3", f: F("Teachers planning lessons and parent updates", "PDF plus a plain text file", "1.1", "6 Oct 2026", ["Any chat assistant"], [], ["90 prompts", "Rubric builder", "Parent email templates"], "Personal use"), tags: ["teachers", "lessons", "school"], about: "teacher lesson plans, classroom, students, rubric, parents", views: 640, sales: 33, rating: 4.7, reviews: 15, age: 90 },
  { id: "L22", title: "Podcast Show Notes Prompts", seller: "s11", cat: "Prompt packs", price: 8, cover: "prompt-4", f: F("Podcasters who publish weekly", "PDF plus a plain text file", "1.0", "12 Sep 2026", ["Any chat assistant"], [], ["40 prompts", "Episode summary format", "Social clip captions"], "Personal and business use"), tags: ["podcast", "show notes", "captions"], about: "podcast show notes, episode summary, captions for clips", views: 410, sales: 18, rating: 4.5, reviews: 8, age: 75 },

  // AI agents
  { id: "L23", title: "Invoice Chaser Agent", seller: "s2", cat: "AI agents", kind: "agent", price: 29, monthly: true, cover: "agent-1", f: F("Freelancers and small firms tired of chasing late payments", "Hosted agent, set up in ten minutes", "1.6", "18 Oct 2026", ["Gmail", "Outlook", "Xero"], ["QuickBooks Desktop"], ["Polite reminder sequence", "Stops as soon as an invoice is paid", "Weekly summary email"], "One business per subscription"), tags: ["invoices", "late payments", "email"], about: "chase late invoices automatically, get paid, payment reminders, clients", views: 1760, sales: 44, rating: 4.7, reviews: 23, age: 160 },
  { id: "L24", title: "Inbox Triage Agent", seller: "s2", cat: "AI agents", kind: "agent", price: 19, monthly: true, cover: "agent-2", f: F("Owners who start every day buried in email", "Hosted agent", "2.0", "7 Oct 2026", ["Gmail", "Outlook"], [], ["Sorts mail into five folders", "Drafts replies for your approval", "Daily digest"], "One mailbox per subscription"), tags: ["email", "inbox", "automation"], about: "email inbox triage, sort mail, draft replies, automation", views: 1390, sales: 37, rating: 4.6, reviews: 19, age: 190 },
  { id: "L25", title: "Review Reply Agent", seller: "s2", cat: "AI agents", kind: "agent", price: 15, monthly: true, cover: "agent-3", f: F("Local businesses with reviews piling up", "Hosted agent", "1.2", "2 Oct 2026", ["Google Business Profile"], [], ["Drafts replies to new reviews", "Flags one and two star reviews", "Tone settings"], "One location per subscription"), tags: ["reviews", "local business"], about: "reply to customer reviews, local business, complaints", views: 760, sales: 20, rating: 4.4, reviews: 9, age: 110 },
  { id: "L26", title: "Appointment Reminder Agent", seller: "s12", cat: "AI agents", kind: "agent", price: 12, monthly: true, cover: "agent-4", f: F("Salons, clinics and tutors losing money to no-shows", "Hosted agent", "2.3", "15 Oct 2026", ["Google Calendar", "Outlook Calendar", "WhatsApp Business"], [], ["SMS and WhatsApp reminders", "Reschedule link", "No-show report"], "One business per subscription"), tags: ["appointments", "reminders", "no-shows"], about: "appointment reminders, no-show, salon clinic booking, reschedule", views: 1120, sales: 41, rating: 4.8, reviews: 26, age: 240 },
  { id: "L27", title: "Shop Questions Agent", seller: "s2", cat: "AI agents", kind: "agent", price: 24, monthly: true, cover: "agent-5", f: F("Online shops answering the same questions every day", "Hosted agent", "1.1", "21 Oct 2026", ["Shopify", "WooCommerce"], [], ["Answers only from your own help page", "Hands over to a person when unsure", "Weekly list of unanswered questions"], "One shop per subscription"), tags: ["customer questions", "shop", "support"], about: "answer customer questions, shop support, faq, help page", views: 920, sales: 25, rating: 4.7, reviews: 12, age: 70 },

  // Photo presets
  { id: "L28", title: "Soft Film Presets", seller: "s7", cat: "Photo presets", price: 16, cover: "photo-1", f: F("Photographers who want a quiet film look", "XMP and DNG presets", "2.0", "30 Jul 2026", ["Lightroom Classic", "Lightroom mobile, free version"], ["Capture One"], ["18 presets", "Install guide", "Before and after samples"], "Personal and client work"), tags: ["presets", "film look", "lightroom"], about: "photo presets film look, lightroom, editing photos", views: 1270, sales: 66, rating: 4.8, reviews: 40, age: 640 },
  { id: "L29", title: "Food Photography Presets", seller: "s7", cat: "Photo presets", price: 14, cover: "photo-2", f: F("Cafes, bakers and food bloggers", "XMP and DNG presets", "1.3", "9 Sep 2026", ["Lightroom Classic", "Lightroom mobile, free version"], [], ["12 presets", "White balance guide"], "Personal and client work"), tags: ["food photos", "presets"], about: "food photography presets, cafe, bakery, recipes photos", views: 690, sales: 30, rating: 4.7, reviews: 17, age: 290 },
  { id: "L30", title: "Portrait Skin Tone Presets", seller: "s7", cat: "Photo presets", price: 18, cover: "photo-3", f: F("Portrait photographers working with every skin tone", "XMP and DNG presets", "3.0", "1 Oct 2026", ["Lightroom Classic", "Lightroom mobile, free version"], [], ["20 presets", "Skin tone guide for six tone groups"], "Personal and client work"), tags: ["portraits", "skin tones"], about: "portrait photo presets, skin tones, editing portraits", views: 840, sales: 35, rating: 4.9, reviews: 21, age: 410 },
  { id: "L31", title: "Golden Hour Travel Presets", seller: "s7", cat: "Photo presets", price: 12, cover: "photo-4", f: F("Travellers editing photos on their phone", "DNG presets", "1.2", "20 Jun 2026", ["Lightroom mobile, free version"], [], ["14 presets", "Phone install video"], "Personal use"), tags: ["travel photos", "presets"], about: "travel photo presets, golden hour, phone editing", views: 560, sales: 27, rating: 4.5, reviews: 13, age: 330 },

  // Audio
  { id: "L32", title: "Lo-fi Drum Loop Kit", seller: "s8", cat: "Audio", price: 19, cover: "audio-1", f: F("Beatmakers and video creators", "WAV loops, 24-bit", "2.1", "16 Oct 2026", ["Any music app that opens WAV files"], [], ["140 loops", "Tempo labels from 70 to 95 BPM", "One-shot drum samples"], "Royalty free for releases and streams"), tags: ["lo-fi", "drums", "loops"], about: "lofi drum loops, beats, music samples, chill", views: 4310, sales: 88, rating: 4.8, reviews: 54, age: 480 },
  { id: "L33", title: "Podcast Intro Jingles", seller: "s8", cat: "Audio", price: 24, cover: "audio-2", f: F("Podcasters who want a sound that is theirs", "WAV and MP3 files", "1.4", "3 Oct 2026", ["Any editing app that opens WAV or MP3"], [], ["12 intros in three lengths", "Stingers for segment breaks", "Separate stems"], "Royalty free for podcasts and online video"), tags: ["podcast", "intro", "jingles"], about: "podcast intro music, jingle, show sound, stinger", views: 780, sales: 29, rating: 4.7, reviews: 16, age: 260 },
  { id: "L34", title: "Interface Sound Effects", seller: "s8", cat: "Audio", price: 15, cover: "audio-3", f: F("App and game designers", "WAV and OGG files", "1.0", "22 Aug 2026", ["Any app or game engine that plays WAV or OGG"], [], ["220 interface sounds", "Taps, toggles, alerts and success tones"], "Royalty free in apps and games"), tags: ["sound effects", "app sounds"], about: "ui sound effects for apps and games, taps, alerts", views: 520, sales: 23, rating: 4.6, reviews: 10, age: 200 },
  { id: "L35", title: "Brazilian Percussion Samples", seller: "s8", cat: "Audio", price: 21, cover: "audio-4", f: F("Producers who want real hand percussion", "WAV samples, 24-bit", "1.5", "11 Oct 2026", ["Any music app that opens WAV files"], [], ["310 samples", "Pandeiro, surdo and agogô", "Tempo-labelled grooves"], "Royalty free for releases and streams"), tags: ["percussion", "samples", "brazil"], about: "brazilian percussion samples, drum loops, samba groove music", views: 630, sales: 24, rating: 4.9, reviews: 14, age: 350 },

  // Fonts
  { id: "L36", title: "Harbor Serif", seller: "s5", cat: "Fonts", price: 35, cover: "font-1", f: F("Brands and editors who want a calm, readable serif", "OTF, TTF and WOFF2 files", "1.3", "25 Sep 2026", ["Desktop apps", "Websites"], ["Cyrillic text", "Greek text"], ["Eight weights", "Matching italics", "Latin Extended character set"], "Desktop use and websites up to 50,000 views a month", "Latin Extended, covering most European languages"), tags: ["serif", "typeface", "branding"], about: "serif font for brands, editorial typeface, display type", views: 860, sales: 21, rating: 4.9, reviews: 12, age: 720 },
  { id: "L37", title: "Brushline Script", seller: "s5", cat: "Fonts", price: 18, cover: "font-2", f: F("Packaging, cards and social posts with a hand-made feel", "OTF and TTF files", "1.1", "14 Jul 2026", ["Desktop apps", "Canva uploads"], [], ["One weight", "Alternate letters and swashes"], "Personal and commercial use, no app embedding"), tags: ["script font", "lettering"], about: "brush script lettering font, handwritten, packaging, cards", views: 690, sales: 34, rating: 4.7, reviews: 19, age: 530 },
  { id: "L38", title: "Mono Grid", seller: "s5", cat: "Fonts", price: 28, cover: "font-3", f: F("Developers and designers who like a tidy monospace", "OTF, TTF and WOFF2 files", "2.0", "29 Sep 2026", ["Code editors", "Desktop apps", "Websites"], [], ["Five weights", "Programming ligatures", "Box drawing characters"], "Desktop use and websites up to 50,000 views a month"), tags: ["monospace", "coding font"], about: "monospace font for code, developer typeface", views: 480, sales: 15, rating: 4.8, reviews: 7, age: 300 },
  { id: "L39", title: "Pebble Rounded Display", seller: "s5", cat: "Fonts", price: 15, cover: "font-4", f: F("Brands for children and families", "OTF and TTF files", "1.0", "18 Aug 2026", ["Desktop apps", "Canva uploads"], [], ["Three weights", "Rounded numerals"], "Personal and commercial use"), tags: ["display font", "kids brands"], about: "rounded display font, kids brand, children, playful type", views: 350, sales: 13, rating: 4.6, reviews: 5, age: 180 },

  // Guides
  { id: "L40", title: "Pricing Your Freelance Work", seller: "s9", cat: "Guides", price: 12, cover: "guide-1", f: F("Freelancers who suspect they charge too little", "PDF and EPUB", "2.0", "4 Oct 2026", ["Any e-reader", "Any PDF reader"], [], ["94 pages", "Rate calculator sheet", "Proposal template"], "Personal use"), tags: ["pricing", "freelance", "ebook"], about: "freelance pricing guide, rates, proposals, clients, ebook", views: 1410, sales: 81, rating: 4.9, reviews: 46, age: 290 },
  { id: "L41", title: "Your First Online Course", seller: "s9", cat: "Guides", price: 29, cover: "guide-2", f: F("Experts turning what they know into a short course", "Video lessons plus a workbook", "1.2", "10 Sep 2026", ["Any browser"], [], ["14 video lessons", "Workbook PDF", "Launch checklist"], "Personal use"), tags: ["online course", "launch", "teaching"], about: "create an online course, teach, launch, video lessons", views: 920, sales: 28, rating: 4.7, reviews: 15, age: 250 },
  { id: "L42", title: "Bookkeeping Basics for Makers", seller: "s9", cat: "Guides", price: 15, cover: "guide-3", f: F("Makers selling at markets and online", "PDF and EPUB", "1.0", "27 Aug 2026", ["Any e-reader", "Any PDF reader"], [], ["68 pages", "Monthly close checklist", "Expense categories sheet"], "Personal use"), tags: ["bookkeeping", "taxes", "makers"], about: "bookkeeping basics, taxes, expenses, makers selling, learn", views: 610, sales: 26, rating: 4.8, reviews: 12, age: 150 },

  // Social templates
  { id: "L43", title: "Carousel Post Templates", seller: "s10", cat: "Social templates", price: 17, cover: "social-1", f: F("Creators and small brands posting tips in slides", "Canva templates", "2.5", "13 Oct 2026", ["Canva free plan"], [], ["60 carousel layouts", "Brand colour guide", "Caption starters"], "Personal and client work"), tags: ["instagram", "carousel", "canva"], about: "instagram carousel posts, social media content, creator templates", views: 1580, sales: 73, rating: 4.7, reviews: 39, age: 310 },
  { id: "L44", title: "Short Video Caption Styles", seller: "s10", cat: "Social templates", price: 13, cover: "social-2", f: F("Creators who edit short videos on their phone", "Canva and CapCut templates", "1.3", "6 Oct 2026", ["Canva free plan", "CapCut"], [], ["30 caption styles", "Safe zone guides"], "Personal and client work"), tags: ["video captions", "reels"], about: "short video captions, reels, tiktok, creator video editing", views: 890, sales: 40, rating: 4.6, reviews: 18, age: 140 },
  { id: "L45", title: "Small Bakery Social Kit", seller: "s10", cat: "Social templates", price: 15, cover: "social-3", f: F("Bakeries and cafes posting their daily bakes", "Canva templates", "1.1", "24 Sep 2026", ["Canva free plan"], [], ["45 post templates", "Menu board story", "Seasonal promotions"], "One business"), tags: ["bakery", "cafe", "social posts"], about: "bakery cafe social media posts, menu, food promotions", views: 470, sales: 19, rating: 4.8, reviews: 9, age: 200 },
  { id: "L46", title: "Property Listing Posts", seller: "s10", cat: "Social templates", price: 19, cover: "social-4", f: F("Estate agents and landlords", "Canva templates", "1.4", "30 Aug 2026", ["Canva free plan"], [], ["40 listing posts", "Open house stories", "Just sold badges"], "One agency"), tags: ["real estate", "property", "social posts"], about: "real estate property listing posts, open house, realtor social media", views: 520, sales: 17, rating: 4.5, reviews: 8, age: 230 },
];

export function buildListing(sd: Seed): Listing {
  const status = sd.status ?? "live";
  const written = status === "live" || status === "paused" || status === "review";
  const d = writeListing(sd.title, sd.cat, sd.kind ?? "download", sd.f);
  const r = seeded(sd.id.charCodeAt(1) * 31 + sd.id.charCodeAt(2));
  const writtenAt = written ? BASE_NOW - Math.min(sd.age, 60) * DAY + Math.round(r() * 20) * HOUR : null;
  return {
    id: sd.id,
    slug: slugify(sd.title),
    title: sd.title,
    sellerId: sd.seller,
    category: sd.cat,
    kind: sd.kind ?? "download",
    price: sd.price,
    monthly: !!sd.monthly,
    cover: sd.cover,
    status,
    facts: sd.f,
    tags: sd.tags,
    about: sd.about,
    description: written ? d.sentences : [],
    held: written ? d.held : [],
    answers: sd.answers ?? [],
    views30: sd.views,
    sales30: sd.sales,
    rating: sd.rating,
    reviews: sd.reviews,
    createdAt: BASE_NOW - sd.age * DAY,
    writtenAt,
    writeCost: written ? d.cost : 0,
    readsSinceWrite: written ? Math.round(sd.views * (Math.min(sd.age, 60) / 30) * (0.9 + r() * 0.2)) : 0,
  };
}

export const LISTINGS: Listing[] = SEEDS.map(buildListing);
