# VI Stock Count

Physical inventory count system for **Victoria's Intimates, Jamaica**.
Branches: Montego Bay · Kingston · Off site storage.

---

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + RLS)
- React Hook Form + Zod
- Papaparse (CSV import/export)

---

## Setup

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase dashboard → **SQL Editor**, run the migration:

   ```
   supabase/migrations/001_initial.sql
   ```

3. Optionally load test data:

   ```
   supabase/seed.sql
   ```

4. From **Project Settings → API**, copy:
   - Project URL
   - Anon public key

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Master Data
1. Go to **Master Data** → upload a CSV from SharePoint.
2. CSV columns (order flexible): `SKU`, `SKU: Description`, `QTY Count`, `In store location`, `Branch`, `Size`, `Color`
3. Existing SKUs are upserted (no duplicates).

### Count Sessions
1. **Count Sessions → New Session** — pick branch, date, entered-by.
2. On session detail page: scan/type SKU, enter qty. SKU auto-fills from master.
3. If SKU not found, click **New** to add it to the master catalog on the fly.
4. Or use **Bulk CSV Import** (same format as master data CSV).
5. Close or mark Reconciled when done.

### Variance Report
- Per-session: **Session → Variance Report**
- Global: **Variance Report** in nav — filter by session and/or branch
- Export to CSV with **Export CSV** button
- Color coding: green=over, red=short/missing, purple=unrecognized

---

## CSV Date Format

Date columns use Jamaican format: `DD/MM/YYYY` (e.g., `10/5/2026` = 10 May 2026).

---

## GitHub Setup

```bash
git init
git add -A
git commit -m "Initial commit — VI Stock Count"
git remote add origin https://github.com/YOUR_ORG/vi-stock-count.git
git push -u origin main
```

---

## Deploy to Vercel

1. Push to GitHub.
2. Import repo at [vercel.com/new](https://vercel.com/new).
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

---

## Project Structure

```
app/
  page.tsx                   Dashboard
  master-data/page.tsx       Master item catalog + CSV upload
  sessions/page.tsx          Session list
  sessions/new/page.tsx      Create session
  sessions/[id]/page.tsx     Session detail — enter counts
  sessions/[id]/variance/    Per-session variance report
  variance/page.tsx          Global variance report
components/
  nav.tsx
  toast.tsx
  add-item-modal.tsx
  count-entry.tsx
  master-upload.tsx
  actuals-upload.tsx
  variance-table.tsx
lib/
  supabase.ts
  csv-parsers.ts
  variance.ts
  utils.ts
types/index.ts
supabase/
  migrations/001_initial.sql
  seed.sql
```
