# Running Test Page + UI Overhaul — Design Spec

**Date:** 2026-07-08
**Status:** Draft (pending user review)

## Purpose

Two changes to the existing single-file Robot Match Logger:

1. **Visual overhaul** of the existing Match page — current UI is flat
   black/white, buttons are cramped (no breathing room between tap
   targets). Add spacing and a colorful accent palette without losing the
   phone-first, high-contrast, one-thumb-usable design.
2. **New "Running Test" page** — a practice-log page for recording
   individual test runs (percobaan) against the competition's chat-report
   template, with a navbar to switch between "Match" and "Running Test"
   modes. Unlike the Match page (deliberately one-shot, no history —
   see `2026-07-05-robot-match-logger-design.md`), Running Test
   accumulates stats **across** runs (KFM percentage, total permainan)
   because the template itself asks for cumulative numbers.

## Template being matched (Running Test)

```
[NAMA UNIVERSITAS], [NAMA TIM]
Persentase KFM: [KFM] / [total permainan]
Dominan di lapangan: Merah or Biru
R1:
keberhasilan ambil staf: [terambil] / [total percobaan]
waktu ambil staf: [menit] : [detik]
waktu assembly: [menit] : [detik]

storage spear: _ spear
storage kfs: _ kotak
waktu masuk arena: [menit] : [detik]
kesusahan ambil kfs di index:

waktu perjalanan forest-arena: [menit] : [detik]
urutan taruh kfs di rak: [tengah, kanan, kiri]
waktu taruh kfs di rak: [menit] : [detik]
waktu perjalanan retry zona 3 ke rak: [menit] : [detik]
bisa tusuk row apa saja:
delta waktu angkat R2:

R2:
keberhasilan ambil spearhead: [terambil] / [total percobaan]
sering ambil spearhead di index:
waktu ambil spearhead: [menit] : [detik]

storage KFS: _ kotak
waktu melewati forest: [menit] : [detik]
delta waktu melewati forest: [menit] : [detik]
sering error di index:

waktu masuk ke arena: [menit] : [detik]
urutan taruh kfs: [tengah, kanan, kiri, atas]
waktu taruh kfs di rak: [menit] : [detik]
```

## Decisions from brainstorming

- **Reset All** wipes the *entire* active page — current form inputs
  **and** cumulative history (total permainan, KFM count). It is
  destructive, so it goes behind a `confirm()` dialog. Match page and
  Running Test page each get their own Reset All scoped to that page
  (resetting Match doesn't touch Running Test's history and vice versa).
- **Urutan (order) fields** (`urutan taruh kfs di rak`) use a tap-sequence
  builder: buttons for each slot (Tengah / Kanan / Kiri, plus Atas for
  R2) append to a running sequence chip-list in tap order, with an Undo
  (remove last) and Clear button. Matches the existing counter/stopwatch
  interaction style — no free-typing during a live test run.
- **Index / free-text fields** (`kesusahan ambil kfs di index`, `sering
  ambil spearhead di index`, `sering error di index`, `bisa tusuk row apa
  saja`) are plain short text inputs — no fixed set of values was given,
  and forcing a fixed picker would guess at a taxonomy that doesn't
  exist yet.
- **Delta waktu fields** (`delta waktu angkat R2`, `delta waktu melewati
  forest`) are manual numeric seconds inputs, not auto-derived. A "delta"
  here spans two different actors' timing (R1 handoff → R2 pickup) which
  the existing single-stopwatch-per-field model can't compute safely
  without guessing which two timestamps to diff.
- **Percentage/ratio fields** (`keberhasilan ambil staf`,
  `keberhasilan ambil spearhead`, `Persentase KFM`) are never typed
  directly — each is two counters (numerator, denominator) driven by
  paired buttons so the ratio is always internally consistent:
  - "Berhasil" → numerator +1, denominator +1
  - "Gagal" → denominator +1 only
  - Same pattern for KFM: "Log Run (KFM)" vs "Log Run (biasa)" against
    `total permainan`.
- **Dominan di lapangan** (Merah/Biru) is a manual toggle, not
  auto-computed from run history — "dominance" isn't defined precisely
  enough from the template alone to derive it safely.
- **NAMA UNIVERSITAS / NAMA TIM** are text inputs, persisted with the
  rest of Running Test state, cleared only by that page's Reset All.

## Architecture

Still one static `index.html` + `app.js`, no build step, no framework —
matches the existing project's constraints. Two structural additions:

1. **Navbar** — sticky top bar with two tab buttons, "Match" and
   "Running Test". Clicking a tab toggles which of two top-level `<div>`
   containers is visible (`display: none`/`block`); no page reload, no
   router. Active tab is visually distinct (filled accent background).
2. **Running Test view** — new markup block mirroring the Match page's
   `.robot-card` / `.stat-row` structure, extended with:
   - sequence-builder rows (chip list + tap buttons + Undo/Clear)
   - paired success/fail buttons for ratio stats
   - plain text inputs for index/notes fields
   - a "Log Run" button that: (a) bumps `totalPermainan`, (b) bumps
     `kfmCount` if the run was marked KFM, (c) appends the formatted
     per-run template block to the output textarea's history, (d) resets
     the *per-run* fields (times, counters, sequences) but **not** the
     cumulative totals or the university/team name — so the next run
     starts clean without re-typing team info.

State and persistence:
- `app.js` gains a `createRunningTestState()` alongside the existing
  `createInitialState()`, plus pure helper functions (sequence builder,
  ratio formatting, template formatter) — same functional, testable style
  as the current module.
- Running Test state is saved to its own `localStorage` key
  (`robot-running-test-draft`), separate from the Match page's
  `robot-match-draft` key, restored on load the same way the Match
  draft already is.

## Visual overhaul (both pages)

- **Spacing:** `.bar` gap increases from `8px` to `12px`; button
  `padding` increases from `10px 14px` to `12px 16px`; `.robot-card`
  padding increases from `8px` to `12px` with `16px` gap between
  `.stat-row`s (was `8px`). Section headers (`h2`) get a top border /
  divider so groups read as visually separate cards instead of a flat
  list.
- **Color:** background moves from flat `#111` to a dark navy
  (`#10141c`) so accent colors pop without going full white-theme.
  Accent palette:
  - Tim Biru controls/buttons: blue accent (`#3b82f6`)
  - Tim Merah controls/buttons: red accent (`#ef4444`)
  - Counter `+1`: green accent (`#22c55e`); counter `-1`: amber/orange
    (`#f59e0b`) — replaces today's uniform gray so +/- are distinguishable
    at a glance under time pressure.
  - R1 card gets a teal-tinted border, R2 card a purple-tinted border, so
    the two columns are distinguishable by color, not just position.
  - KFM button gets a gold/amber accent to mark it as the "big" action.
  - Navbar active-tab uses the same teal accent as R1 for consistency.
  - Focus/hover states get a visible accent outline (contrast/accessibility,
    was previously just a border color shift barely visible on dark gray).
- Kept: dark base theme (venue may be sunny/glary, high contrast still
  matters), large tap targets (44px min, unchanged), same font stack.

## Data flow (Running Test)

1. User fills NAMA UNIVERSITAS / NAMA TIM once (persisted).
2. During a test run: taps counters, stopwatches, sequence builders,
   success/fail pairs, fills index/notes text fields — same live-tracking
   pattern as Match page.
3. Taps **Log Run** → cumulative totals update, per-run template block
   generated and appended to output, per-run fields reset for the next
   attempt.
4. **Generate/Copy/Share** buttons work on the accumulated output text,
   same as the Match page's existing Output section.
5. **Reset All** (Running Test's own button, next to Log Run) → confirm
   dialog → wipes cumulative totals, university/team name, and any
   in-progress per-run fields; clears the `robot-running-test-draft`
   localStorage key.

## Testing

Extend `tests/app.test.js` (existing plain-function unit tests, no
framework beyond what's already there) with cases for:
- Sequence builder: append/undo/clear, formats as `tengah, kanan, kiri`.
- Ratio counters: Berhasil/Gagal pairs keep denominator ≥ numerator.
- Running Test template formatter matches the exact template field
  names/order/casing above.
- Log Run resets per-run fields but preserves cumulative totals and team
  info.
- Reset All zeroes cumulative totals and clears team info.

Manual checklist (phone-usable, one-thumb, tap targets ≥44px) reused
from the existing Match page spec.

## Out of scope

- Auto-computing "Dominan di lapangan" or "delta waktu" fields from
  other logged data.
- Editing/deleting a single past run from the accumulated output once
  logged (only whole-page Reset All).
- Any account system, cloud sync, or export beyond copy/share text.
