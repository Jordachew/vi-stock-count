'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Database, ClipboardList, BarChart3, Settings, Upload,
  Search, CheckCircle, AlertTriangle, Lock, RefreshCw,
  ChevronDown, ChevronRight
} from 'lucide-react'

interface Section {
  id: string
  icon: React.ElementType
  title: string
  color: string
  content: React.ReactNode
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 text-left hover:bg-slate-800 transition-colors"
      >
        <span className="text-white text-sm font-medium">{title}</span>
        {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 py-4 bg-slate-900/40 text-sm text-slate-300 space-y-2">{children}</div>}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div className="text-slate-300 text-sm">{children}</div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-xs text-amber-300">
      <AlertTriangle size={13} className="shrink-0 mt-0.5" /> <span>{children}</span>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2 text-xs text-emerald-300">
      <CheckCircle size={13} className="shrink-0 mt-0.5" /> <span>{children}</span>
    </div>
  )
}

export default function HelpPage() {
  const [active, setActive] = useState('overview')

  const sections: Section[] = [
    {
      id: 'overview',
      icon: CheckCircle,
      title: 'Overview',
      color: 'text-pink-400',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            The <strong className="text-white">VI Stock Count</strong> system is Victoria&apos;s Intimates&apos; internal inventory
            management tool. It manages the full physical count cycle: load master data from QuickBooks,
            run count sessions across branches, and generate variance reports comparing physical counts against system quantities.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Database, label: 'Master Data', desc: 'Upload QB export, manage SKU catalog' },
              { icon: ClipboardList, label: 'Count Sessions', desc: 'Create sessions, scan/enter SKUs' },
              { icon: BarChart3, label: 'Variance Report', desc: 'Compare counted vs system qty' },
              { icon: Settings, label: 'Admin', desc: 'Manage dropdowns, view audit log' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-3 bg-slate-800 rounded-lg p-3">
                <Icon size={16} className="text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-slate-400 text-xs">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <h3 className="text-white text-sm font-semibold">Typical Workflow</h3>
            <div className="space-y-2">
              <Step n={1}>Export Products &amp; Services from QuickBooks Online → upload to Master Data</Step>
              <Step n={2}>Create a Count Session for the branch and date</Step>
              <Step n={3}>Enter counts by scanning/typing each SKU — size, color, category auto-fill</Step>
              <Step n={4}>Close the session when counting is done</Step>
              <Step n={5}>Review the Variance Report — investigate shorts and overs</Step>
              <Step n={6}>Mark session Reconciled once differences are explained</Step>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-xs text-blue-300">
            <strong className="text-blue-200">Branches supported:</strong> Montego Bay · Kingston · Off site storage
          </div>
        </div>
      ),
    },
    {
      id: 'master-data',
      icon: Database,
      title: 'Master Data',
      color: 'text-blue-400',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            Master Data is the SKU catalog — every item the business carries. It is the reference against which physical counts are compared.
          </p>

          <Collapsible title="Uploading from QuickBooks (recommended)" defaultOpen>
            <div className="space-y-3">
              <Step n={1}>In QuickBooks Online, go to <strong>Products &amp; Services → Export</strong></Step>
              <Step n={2}>Save the <code className="bg-slate-800 px-1 rounded">.xls</code> file (typically named <code className="bg-slate-800 px-1 rounded">ProductServiceList_…xls</code>)</Step>
              <Step n={3}>Go to <strong>Master Data</strong> and drag the file onto the upload zone</Step>
              <Step n={4}>The system auto-detects QuickBooks format and extracts:
                <ul className="mt-1 ml-4 space-y-0.5 list-disc text-slate-400">
                  <li><strong className="text-slate-200">SKU</strong> from the SKU column</li>
                  <li><strong className="text-slate-200">Description</strong> from Sales Description</li>
                  <li><strong className="text-slate-200">Size</strong> — parsed from description (e.g. "38E", "XL", "50")</li>
                  <li><strong className="text-slate-200">Color</strong> — parsed after " / " separator in description</li>
                  <li><strong className="text-slate-200">Category</strong> — from Income Account sub-category (e.g. "Panties", "Bras")</li>
                  <li><strong className="text-slate-200">System Qty</strong> from Quantity On Hand</li>
                  <li><strong className="text-slate-200">Qty Date</strong> from Quantity as-of Date</li>
                </ul>
              </Step>
              <Note>Duplicate SKUs in the QB export are automatically deduplicated — the row with the most specific account and highest QoH is kept.</Note>
              <Tip>Re-upload the QB export at any time — existing records are upserted by SKU, not duplicated.</Tip>
            </div>
          </Collapsible>

          <Collapsible title="Uploading from SharePoint CSV">
            <div className="space-y-3">
              <p>If uploading from the legacy SharePoint format, the CSV must have these columns:</p>
              <div className="font-mono text-xs bg-slate-800 rounded p-3 text-slate-300">
                SKU · SKU: Description · QTY Count · In store location · Branch · Size · Color
              </div>
              <Note>The SharePoint format does not include Category. Set it manually after upload via the edit (pencil) button.</Note>
            </div>
          </Collapsible>

          <Collapsible title="Editing individual items">
            <div className="space-y-3">
              <Step n={1}>Find the item using the search bar (by SKU or description)</Step>
              <Step n={2}>Click the pencil icon on the right</Step>
              <Step n={3}>Edit description, size, color, category, branch, system qty, or qty date</Step>
              <Step n={4}>Click Save — all changes are logged to the Audit Trail</Step>
              <Note>You cannot hard-delete items that have count entries. Use the toggle to deactivate them instead.</Note>
            </div>
          </Collapsible>

          <Collapsible title="Activating / Deactivating items">
            <p>Click the toggle icon in the Active column to hide an item from counts without deleting it.
               Inactive items do not appear in the count entry SKU search.</p>
            <Tip>Show inactive items by toggling "Show inactive" in the filter bar.</Tip>
          </Collapsible>
        </div>
      ),
    },
    {
      id: 'sessions',
      icon: ClipboardList,
      title: 'Count Sessions',
      color: 'text-emerald-400',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            A Count Session represents one physical stock count event — a specific branch, date, and team.
            All count entries belong to a session.
          </p>

          <Collapsible title="Creating a session" defaultOpen>
            <div className="space-y-3">
              <Step n={1}>Go to <strong>Count Sessions → New Session</strong></Step>
              <Step n={2}>Enter a session name (e.g. "MoBay Full Count May 2026")</Step>
              <Step n={3}>Select the branch being counted</Step>
              <Step n={4}>Set the count date</Step>
              <Step n={5}>Enter who is conducting the count (Entered By)</Step>
              <Step n={6}>Click Create Session</Step>
            </div>
          </Collapsible>

          <Collapsible title="Entering counts manually" defaultOpen>
            <div className="space-y-3">
              <Step n={1}>Open the session and type or scan a SKU in the <strong>SKU</strong> field</Step>
              <Step n={2}>A dropdown appears as you type — showing matching SKUs, descriptions, and attributes. Click to select.</Step>
              <Step n={3}>Size, Color, and Category are <strong>auto-filled</strong> from master data. They are locked by default.</Step>
              <Step n={4}>Enter the <strong>Qty Counted</strong> — how many units physically found</Step>
              <Step n={5}>Select the <strong>Location</strong> where you found the item</Step>
              <Step n={6}>Click <strong>Add Count Entry</strong></Step>
              <Tip>Press Enter in the SKU field to trigger the lookup without clicking away.</Tip>
              <Note>If a SKU is not in the master catalog, an amber "New" button appears. Click it to add the item to master data first, then the count is recorded automatically.</Note>
            </div>
          </Collapsible>

          <Collapsible title="Correcting size / color / category">
            <div className="space-y-3">
              <p>If the auto-populated values are incorrect for this specific item:</p>
              <Step n={1}>Click <strong>Edit</strong> in the Item Details box</Step>
              <Step n={2}>Change the dropdowns as needed</Step>
              <Step n={3}>If you want to fix the master catalog too, click <strong>Save to master</strong> — this updates master data and logs the change to the audit trail</Step>
              <Step n={4}>Click <strong>Reset</strong> to revert to master values without saving</Step>
            </div>
          </Collapsible>

          <Collapsible title="Bulk CSV import">
            <div className="space-y-3">
              <p>To import counts from a pre-prepared spreadsheet, expand <strong>Bulk CSV Import</strong> and upload a CSV with columns:</p>
              <div className="font-mono text-xs bg-slate-800 rounded p-3 text-slate-300">
                SKU · SKU: Description · QTY Count · In store location · Size · Color · Date of count · Entered by:
              </div>
              <Note>Bulk import only works when the session is Open.</Note>
            </div>
          </Collapsible>

          <Collapsible title="Session statuses">
            <div className="space-y-2">
              {[
                { status: 'Open', color: 'text-emerald-400', desc: 'Counting in progress. Entries can be added and removed.' },
                { status: 'Closed', color: 'text-slate-300', desc: 'Counting finished. No new entries. Can be reopened if needed.' },
                { status: 'Reconciled', color: 'text-blue-400', desc: 'Variance reviewed and signed off. Locked — entries cannot be added, edited, or deleted.' },
              ].map(({ status, color, desc }) => (
                <div key={status} className="flex gap-3 items-start">
                  <span className={cn('font-semibold text-sm w-24 shrink-0', color)}>{status}</span>
                  <span className="text-slate-400 text-sm">{desc}</span>
                </div>
              ))}
              <Note>Session locking is enforced at the database level — not just the UI. Attempts to modify entries on a closed/reconciled session will be rejected even via direct API calls.</Note>
            </div>
          </Collapsible>

          <Collapsible title="Deleting entries">
            <p>While a session is Open, use the trash icon on any entry to remove it.
               Deletions are confirmed with a prompt. Entries cannot be deleted once the session is Closed or Reconciled.</p>
          </Collapsible>
        </div>
      ),
    },
    {
      id: 'variance',
      icon: BarChart3,
      title: 'Variance Reports',
      color: 'text-yellow-400',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            A Variance Report compares physical count quantities against the system (QuickBooks) quantities to identify discrepancies.
          </p>

          <Collapsible title="Reading the report" defaultOpen>
            <div className="space-y-3">
              <p>Each row shows one SKU. The columns are:</p>
              <div className="space-y-2 text-sm">
                {[
                  ['SKU / Description', 'Item identifier and name from master catalog'],
                  ['Branch / Location', 'Where the item belongs'],
                  ['Size / Color / Category', 'Item attributes'],
                  ['Sys Qty', 'System quantity from QuickBooks at last upload'],
                  ['Counted', 'Total units physically counted in this session'],
                  ['Variance', 'Counted minus System (negative = short)'],
                  ['Var %', 'Variance as a percentage of system quantity'],
                  ['Status', 'Matched / Short / Over / Missing / Unrecognized'],
                ].map(([col, desc]) => (
                  <div key={col} className="flex gap-3">
                    <span className="text-white font-medium w-40 shrink-0">{col}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Collapsible>

          <Collapsible title="Status definitions">
            <div className="space-y-2">
              {[
                { s: 'Matched', c: 'text-emerald-400', d: 'Counted qty equals system qty' },
                { s: 'Short', c: 'text-red-400', d: 'Counted less than system — potential loss, misplacement, or data error' },
                { s: 'Over', c: 'text-blue-400', d: 'Counted more than system — unlisted stock or data entry error' },
                { s: 'Missing', c: 'text-amber-400', d: 'Item in master catalog but not counted at all (zero count)' },
                { s: 'Unrecognized', c: 'text-purple-400', d: 'SKU counted but not in master catalog — was added as a New item' },
              ].map(({ s, c, d }) => (
                <div key={s} className="flex gap-3 items-start">
                  <span className={cn('font-semibold text-sm w-28 shrink-0', c)}>{s}</span>
                  <span className="text-slate-400 text-sm">{d}</span>
                </div>
              ))}
            </div>
          </Collapsible>

          <Collapsible title="Filtering and exporting">
            <div className="space-y-2">
              <p>Use the filter bar to show only specific statuses (e.g. Short + Missing for investigation).</p>
              <Tip>Click <strong>Export CSV</strong> to download the full variance report for management review or filing.</Tip>
            </div>
          </Collapsible>

          <Collapsible title="Global Variance Report">
            <p>The <strong>Variance Report</strong> page in the main nav shows variance across all sessions or filtered by branch.
               Use it for a consolidated view across multiple count events.</p>
          </Collapsible>
        </div>
      ),
    },
    {
      id: 'admin',
      icon: Settings,
      title: 'Admin',
      color: 'text-purple-400',
      content: (
        <div className="space-y-4">
          <Collapsible title="Managing dropdowns" defaultOpen>
            <div className="space-y-3">
              <p>All dropdown values throughout the app are managed here. Four lists:</p>
              <div className="space-y-1.5 text-sm">
                {[
                  ['Sizes', 'Bra sizes (38E, 42DD), apparel (XS–4XL), numeric (50, 52)'],
                  ['Colors', 'Black, White, Nude, etc.'],
                  ['Categories', 'Panties, Bras, Shapewear, Lingerie, etc.'],
                  ['Locations', 'Draw 1–7, Bra Column 1–9, Storage shelves, Rack 1'],
                ].map(([list, desc]) => (
                  <div key={list} className="flex gap-3">
                    <span className="text-white font-medium w-24 shrink-0">{list}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
              <Step n={1}>Select the tab for the list you want to edit</Step>
              <Step n={2}>Type a new value in the input box and click Add (or press Enter)</Step>
              <Step n={3}>Use ↑ ↓ arrows to reorder — order controls dropdown display order</Step>
              <Step n={4}>Click Active/Hidden to show or hide an option without deleting it</Step>
              <Note>Deleting a dropdown option does not affect existing items that already have that value — it only removes it from future dropdowns.</Note>
            </div>
          </Collapsible>

          <Collapsible title="Audit Log">
            <div className="space-y-3">
              <p>The Audit Log records every change made to master item fields (description, size, color, category, system qty, etc.).</p>
              <div className="space-y-1.5 text-sm">
                {[
                  ['SKU', 'Which item was changed'],
                  ['Field', 'Which field was modified'],
                  ['Old → New', 'Before and after values (red = old, green = new)'],
                  ['By', 'Who made the change (from Entered By on the session)'],
                  ['Source', 'count_entry (from count screen) or master_data_edit (from master data page)'],
                  ['When', 'Date and time of change'],
                ].map(([col, desc]) => (
                  <div key={col} className="flex gap-3">
                    <span className="text-white font-medium w-24 shrink-0">{col}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
              <Tip>Filter by SKU to see the full history of changes for a specific item.</Tip>
            </div>
          </Collapsible>
        </div>
      ),
    },
    {
      id: 'tips',
      icon: CheckCircle,
      title: 'Tips & Shortcuts',
      color: 'text-cyan-400',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Search, tip: 'Type at least 1 character in SKU to see matching items instantly. Works by SKU number or description text.' },
              { icon: CheckCircle, tip: 'Press Enter in the SKU field to confirm selection without using the mouse.' },
              { icon: Upload, tip: 'Re-upload the QB export any time to refresh system quantities. Existing master records are updated, not duplicated.' },
              { icon: Lock, tip: 'Reconciled sessions are locked at the database level — no edits possible even via API. Safe for audit purposes.' },
              { icon: RefreshCw, tip: '"Save to master" from the count screen updates both the count entry AND the master catalog, and logs the change to the audit trail.' },
              { icon: BarChart3, tip: 'Export any variance report to CSV for management reporting, filing, or further analysis in Excel.' },
            ].map(({ icon: Icon, tip }, i) => (
              <div key={i} className="flex gap-3 bg-slate-800 rounded-lg p-3">
                <Icon size={15} className="text-pink-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" /> Common Issues
            </h3>
            <div className="space-y-3 text-sm">
              {[
                ['SKU not found in search', 'The item may be inactive. Go to Master Data and toggle "Show inactive" to find and reactivate it.'],
                ['Cannot add entry — session locked', 'The session is Closed or Reconciled. Use the Reopen button to unlock it.'],
                ['Size/color not showing after QB upload', 'Check the QB description format. Size must be the last word before " / " (e.g. "0024 Padded Bra 42E / Black"). Items with no color separator will have size only.'],
                ['Category shows blank after upload', 'The QB Income Account may not have a sub-account (e.g. "Sales of Product Income" with no ":Panties"). Set category manually in Master Data.'],
                ['Variance shows unexpected results', 'System Qty reflects the last QB upload date. If stock was received after the last upload, re-upload the QB export first.'],
              ].map(([issue, fix]) => (
                <div key={issue as string} className="border-t border-slate-700 pt-3 first:border-0 first:pt-0">
                  <p className="text-amber-300 text-xs font-medium">{issue}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{fix}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ]

  const activeSection = sections.find((s) => s.id === active)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Help & User Guide</h1>
        <p className="text-sm text-slate-400 mt-0.5">Victoria&apos;s Intimates — Stock Count System</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 lg:sticky lg:top-20">
            {sections.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                    active === s.id
                      ? 'bg-pink-600/20 border border-pink-500/30 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon size={15} className={active === s.id ? s.color : 'text-slate-500'} />
                  {s.title}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              {<activeSection.icon size={20} className={activeSection.color} />}
              <h2 className="text-lg font-semibold text-white">{activeSection.title}</h2>
            </div>
            {activeSection.content}
          </div>
        </div>
      </div>
    </div>
  )
}
