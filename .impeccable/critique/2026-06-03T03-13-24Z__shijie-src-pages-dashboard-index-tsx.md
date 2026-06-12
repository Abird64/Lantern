---
target: 看板
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-06-03T03-13-24Z
slug: shijie-src-pages-dashboard-index-tsx
---
## Design Critique: 看板 (Dashboard)

**Target:** `shijie/src/pages/Dashboard/index.tsx` + 8 summary card components

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading skeletons or error feedback; data failures silently swallowed |
| 2 | Match Between System and Real World | 3 | Natural Chinese labels and icons; "番茄钟" may need explanation for new users |
| 3 | User Control and Freedom | 3 | Clear navigation with back button; no card reorder/hide customization |
| 4 | Consistency and Standards | 2 | Two pairs of cards share accent colors; overdue badge uses hardcoded #fff0f0 outside theme; Pomodoro navigates via custom event vs store actions |
| 5 | Error Prevention | 2 | Every `.catch(() => {})` silently discards failures; users act on potentially stale data |
| 6 | Recognition Rather Than Recall | 3 | Icons + labels make cards scannable; counts need context to be meaningful |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; no card customization; read-only fixed layout |
| 8 | Aesthetic and Minimalist Design | 2 | 8-card uniform grid with identical number+label pattern creates visual monotony; no hierarchy |
| 9 | Error Recovery | 1 | Zero error communication; all fetch failures are invisible to users |
| 10 | Help and Documentation | 2 | Labels are clear but no tooltips; first-timers won't understand XP or pomodoro without exploring |
| **Total** | | **22/40** | **Acceptable** — solid foundation, significant monotony and resilience gaps |

### Anti-Patterns Verdict

**LLM assessment:** This does not scream "AI made this." The night-firefly design system (dark green-black canvas, firefly-green accent, glass layering) is distinctive and committed to its brand. The aesthetic avoids every major slop tell: no gradient text, no glassmorphism-as-default, no side-stripe borders, no tiny tracked eyebrows, no numbered section markers. The card system is clean and internally consistent.

The category-reflex test passes too: a "life management dashboard" that isn't SaaS-cream, isn't navy-and-gold fintech, isn't brutalist-dev-tool. The night-firefly identity is genuine.

**What fails:** The dashboard crosses into the "hero-metric template" territory — big number, small label, supporting stat — but repeated 8 times. The first 3 cards feel like useful at-a-glance data; by card 8, the pattern is exhausted. The identical 2-column grid of same-sized cards creates a monotony that undermines the otherwise strong visual identity.

**Deterministic scan:** The detector found zero issues. Clean output.

### Overall Impression

The dashboard has a strong foundation — the Lantern design language is cohesive and distinctive, the dark mode is genuinely atmospheric, and each card serves a clear purpose. But it reads as a data dump rather than a curated view. Eight equally-weighted cards in identical wrappers is a missed opportunity for hierarchy, rhythm, and personality. The biggest opportunity: break the grid monotony and let the dashboard breathe.

### What's Working

1. **Distinctive, committed dark theme.** `#0F1412` canvas with `#4CAF76` firefly green is memorable and on-brand. The glass layering (transparency-based depth instead of shadows) suits the "night fog" metaphor perfectly.

2. **Consistent card system.** `DashboardCard` enforces uniform padding, border, icon treatment, and navigation affordance. Adding a ninth card would be trivial, and the system won't break.

3. **Color-coded domains.** Purple=tasks, green=habits, orange=schedule, pink=diary — the intent to differentiate by color is correct, even if execution has collisions (see below).

### Priority Issues

**[P1] Identical card grid with zero visual hierarchy.** Eight cards in `grid-cols-2 gap-3`, all the same size, all using the same number+label template. Task count (a time-sensitive metric) has the same visual weight as birthday countdowns (a social nicety). Users can't tell at a glance what needs attention.
- **Why it matters:** The dashboard's job is to help users prioritize. Equal weight = nothing is important.
- **Fix:** Break the rigid 2-column grid. Give today's tasks and habits more visual prominence (span 2 columns, or use a larger card variant). Group lower-priority cards (birthdays, countdowns, pomodoro) into a denser row or smaller cards. Consider a "hero" card for whatever needs immediate attention.
- **Suggested command:** `/impeccable layout 看板`

**[P1] Duplicate accent colors across domains.** Diary and Birthday both use `#ff2d55`. Schedule and Skill both use `#ff9500`. In a dashboard that relies on color for quick card identification, this breaks scannability.
- **Why it matters:** Users learn "pink = diary" unconsciously, then see another pink card and get confused. The color system's value is in distinctiveness.
- **Fix:** Assign unique accent colors. Calendar could be amber `#D4A843`, Skills could be gold `#E8B959`, Diary keeps pink `#ff2d55`, Birthday gets a different warm tone like coral `#E8734A`.
- **Suggested command:** `/impeccable colorize 看板卡片`

**[P1] Silent error swallowing on every data fetch.** All 8 summary components use `.catch(() => {})` with no fallback UI. If the database is locked, a fetch fails, or the store is uninitialized, the user sees stale zeroes or empty states with no indication anything is wrong.
- **Why it matters:** User makes decisions on wrong data. "No tasks today" could mean zero tasks, or could mean the fetch failed.
- **Fix:** Add error state to DashboardCard (an optional `error` prop that shows a subtle indicator). Or wrap data fetching at the page level with a single error boundary.
- **Suggested command:** `/impeccable harden 看板`

**[P2] Hardcoded light-mode overdue badge in dark theme.** `TaskSummary` uses `backgroundColor: '#fff0f0'` and `color: '#ff3b30'` for the overdue badge — values that work in light mode but clash in the dark default. The light pink background glows harshly against `#0F1412`.
- **Why it matters:** Directly violates the "低压力自然主义" principle. A jarring red badge on a calming dark interface breaks the atmosphere.
- **Fix:** Use `appTheme.danger` (`#C97070` in dark) with a low-opacity background derived from the same hue: `withAlpha(appTheme.danger, 0.15)`.
- **Suggested command:** `/impeccable polish 看板逾期标签`

**[P2] Numbers lack context.** "3 今日待办" — is 3 a heavy day or a light one? "247 字" — is that a typical entry or unusually short? The raw counts are data, not insight.
- **Why it matters:** The dashboard crosses from "glanceable overview" into "just show me the list page." The value-add of a dashboard is synthesis, not raw counts.
- **Fix:** Add subtle context. For tasks: compare to weekly average ("比平常少"). For diary: compare to average entry length. For habits: show completion rate (3/5). Small, quiet comparisons that reward the glance.
- **Suggested command:** `/impeccable delight 看板`

**[P3] PomodoroCard navigates via CustomEvent while all other cards use store actions.** Inconsistent navigation mechanism. Every other card calls `setActiveSubPage()` or `setActiveTab()`; the Pomodoro card dispatches a `CustomEvent`.
- **Why it matters:** If the event listener isn't mounted, the card silently does nothing. Breaks the established pattern.
- **Fix:** Either add pomodoro as a UI store sub-page, or create a consistent modal trigger mechanism.
- **Suggested command:** `/impeccable polish 番茄钟导航`

### Persona Red Flags

**Alex (Power User):** No keyboard shortcuts for any card. Can't navigate the dashboard by keyboard alone. Can't reorder or hide irrelevant cards. Can't customize which metrics appear. The 8-card grid is a fixed, unpersonalizable view — Alex would request card customization within the first week.

**Sam (Accessibility-Dependent):** All cards are `<button>` elements wrapping complex content — screen readers will announce the entire card content as the button label, creating a wall of text. Icon colors convey domain identity but have no text alternative. The overdue badge relies on color alone to convey urgency (no icon, no ARIA label). Focus indicators may be invisible against the dark `#0F1412` background.

**夜旅人 "Night Traveler" (Project-Specific):** The dashboard feels like a data console, not a companion. Where's the lantern? Where are the fireflies? The design language promises "被陪伴着走过夜路" (accompanied through the night), but the dashboard delivers metrics. An empty state across all cards shows nothing poetic — just zeroes and "还没有" labels. The emotional warmth of the brand lives in DESIGN.md but hasn't reached this surface.

### Minor Observations

- The `PageContainer` applies `px-4 md:px-6 lg:px-8` AND the dashboard content area also applies `px-4 sm:px-8`, creating double horizontal padding.
- `ScheduleSummary` calls `useUIStore((s) => s.setActiveTab)` but `TaskSummary` calls `useUIStore((s) => s.setActiveSubPage)` — different navigation methods for the same pattern (card click → go somewhere).
- The "字" label on DiarySummary shows `content.length` (character count), which is correct for Chinese but would be misleading for mixed-language entries.
- `BirthdaySummary` sorts by `days_remaining` but the overflow "更多" count references unsorted `upcoming`, creating a potential mismatch.
- No `prefers-reduced-motion` handling for the `btn-press` scale animation on cards.
- The `grid-cols-2` layout at narrow mobile widths (~320px) creates cards under 150px wide — the birthday name + "3天后 · 25岁" line will overflow or truncate aggressively.

### Questions to Consider

- What if the dashboard had a "primary moment" — a single card or area that draws the eye first, with the rest as supporting context?
- What if the firefly/lantern visual language appeared here, not just in the AI chat page? A subtle glow animation when you've written your diary, a dim card when you haven't?
- Does this need 8 cards? What if 3 merged or moved to a secondary view?
