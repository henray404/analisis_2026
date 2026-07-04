# Robot Match Practice Logger — Design Spec

**Date:** 2026-07-05
**Status:** Approved (pending final user review of this doc)

## Purpose

Log robot practice-match results right at the venue, on phone, fast enough
to keep up with a live 3-minute match, and produce a text block matching
the existing template for pasting into the team chat. One-shot use — no
match history is stored.

## Template being matched

```
Hasil Latihan Match _
Tanggal: Minggu, 4 Juli 2026

RICHIE: Tim (merah or biru)
Skor Akhir: Tim Biru (..) - Tim Merah (..)
Hasil: Menang or Kalah
Waktu pertandingan: Game 3 menit

statistik Robot 1 (R1)
kotak: (banyak kotak yang diambil)
tongkat: (waktu ambil tongkat dalam detik)
assembly: (dalam detik)
retry: (bayak retry)

Statistik Robot 2 (R2)
Kotak: (banyak kotak yang diambil)
Spearhead: (waktu ambil spearhead dalam detik)
Retry: (banyak retry)

Catatan: robotnya gimana
```

## Decisions from brainstorming

- **Platform:** phone/tablet at venue, used live during the match.
- **Storage:** none. Output is a formatted text block only, no database,
  no spreadsheet, no saved history of past matches.
- **Timing fields** (tongkat, assembly, spearhead): captured live via
  built-in stopwatches, not typed in after the fact.
- **Count fields** (kotak, retry): captured live via tap-counters, not
  typed in after the fact.
- **R1 and R2 run simultaneously** during the match → UI must expose both
  robots' controls on screen at once, not as sequential steps.
- **Correction support:** every counter and stopwatch is editable/undoable
  in place, because live input happens under time pressure and mis-taps
  will happen.

## Architecture

Single self-contained static file: `index.html` with inline `<style>` and
`<script>`. No build step, no server, no framework, no external
dependency. Opened directly in the phone's browser (double-tap the file,
or serve via any static host later if wanted). This fits the "one-shot,
no persistence" requirement — there is nothing here that needs a backend.

Skipped: PWA manifest/service worker (installable icon, offline caching
beyond what a plain file already gives). Add later only if home-screen
install becomes a real want.

## Components / screen layout

**1. Match info bar** (top, always visible)
- Tanggal — date input, defaults to today
- Tim — Merah/Biru toggle
- Waktu pertandingan — text field, defaults to "3 menit"

**2. Live tracking area** (main, two columns rendered side by side: R1 | R2)
- R1 column:
  - Kotak — counter with large `+1` and `-1` buttons, large number display
  - Tongkat — stopwatch: Start/Stop toggle button, live elapsed seconds,
    Reset button, manual numeric override field
  - Assembly — stopwatch, same control pattern as Tongkat
  - Retry — counter, same pattern as Kotak
- R2 column:
  - Kotak — counter, same pattern
  - Spearhead — stopwatch, same control pattern
  - Retry — counter, same pattern
- All tap targets sized for one-thumb use during a fast, chaotic match.
- Stopwatches are independent of each other — any combination can be
  running at the same time.

**3. Post-match section** (below live area)
- Skor Akhir — two number inputs, Tim Biru / Tim Merah
- Hasil — Menang/Kalah, auto-computed from the user's chosen Tim color
  vs. the two scores, with a manual override toggle in case the
  auto-compute is wrong (e.g. draw rules, disqualification)
- Catatan — free-text textarea ("robotnya gimana")

**4. Output**
- "Generate" button renders the template text (field order and wording
  matching the template above) into a read-only `<textarea>` — this
  guarantees the text is copyable by tap-hold-select even if the
  Clipboard API is unavailable in the current browser context.
- "Copy" button — `navigator.clipboard.writeText`, falling back to
  `document.execCommand('copy')` on the textarea if the Clipboard API
  throws or isn't present.
- "Share" button — `navigator.share` where supported, so the text goes
  straight to the phone's share sheet (e.g. into a WhatsApp group) without
  a manual copy/paste step. Hidden if `navigator.share` isn't available.

## Data flow

1. User fills match info bar.
2. During the match, taps counters/stopwatches live on both columns.
3. After the match, fills post-match section.
4. Taps Generate → in-memory state is formatted into the template string.
5. Taps Copy or Share to get it into the team chat.

State lives only in page memory plus one `localStorage` key for
crash/refresh recovery (see below). Nothing is sent over a network.

## Error handling / edge cases

- **Counters:** floor at 0, `-1` disabled at 0.
- **Stopwatches:** Start/Stop button label reflects current state so a
  double-tap can't start a timer twice; elapsed time is timestamp-based
  (`Date.now()` diff), not a naive interval counter, so backgrounding the
  browser tab doesn't desync the displayed seconds.
- **Manual override:** typing directly into a stopwatch's numeric field
  pauses it (if running) and takes the typed value as the new elapsed
  time.
- **Accidental refresh/rotation mid-match:** every state change is
  debounced-saved to a single `localStorage` key (e.g.
  `robot-match-draft`). On page load, if that key exists, state is
  restored and a small banner confirms a draft was recovered. The key is
  cleared once Generate is tapped successfully. This is crash recovery
  for the one match in progress, not persistent match history.
- **Hasil auto-compute:** if scores tie, auto-compute shows neither
  Menang/Kalah pre-selected and requires manual pick (no silent wrong
  default).

## Testing

No test framework — this is a static, no-backend, single-file tool. Manual
verification checklist (used during implementation, not automated):
- Both stopwatches can run concurrently without drifting into each
  other's state.
- Counters/stopwatches survive a page reload via the localStorage draft.
- Generated text matches the template's field names, order, and casing
  exactly, with real values substituted.
- Copy and Share buttons both produce the same text as the on-screen
  textarea.
- Layout usable one-handed on a phone screen (no columns needing pinch
  zoom).

## Out of scope

- Match history / progress-over-time views.
- Any account system, cloud sync, or spreadsheet export.
- Editing or reopening a previously generated (and shared) match.
