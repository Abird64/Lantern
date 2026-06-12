---
target: 日历
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-06-03T02-24-38Z
slug: shijie-src-pages-schedule-index-tsx
---
## Design Critique: 日历 (Schedule Page)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | No loading indicators; modals close before API confirms success |
| 2 | Match Between System and Real World | 3/4 | Chinese locale, poetic empty states, humanized RRULE |
| 3 | User Control and Freedom | 2/4 | Escape works but blocked in countdown mode; no undo |
| 4 | Consistency and Standards | 2/4 | WeekView uses Mon-start, DayView/AgendaView use Sun-start |
| 5 | Error Prevention | 3/4 | Time validation, disabled submit, delete confirmation |
| 6 | Recognition Rather Than Recall | 3/4 | Labeled pills, tooltips; but keyboard shortcuts invisible |
| 7 | Flexibility and Efficiency of Use | 3/4 | Arrow/T/Ctrl+N shortcuts; no drag-drop, no search |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean but toolbar dense; fixed 1200px grid height |
| 9 | Error Recovery | 1/4 | API errors swallowed; import errors shown in green |
| 10 | Help and Documentation | 0/4 | Zero onboarding, zero tooltips, zero docs |
| **Total** | | **22/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM assessment: CLEAN with one near-miss.** No banned patterns detected (no side-stripes, no gradient text, no glassmorphism overload, no hero-metric template, no numbered section markers, no uppercase eyebrows). The implementation feels human-made: Chinese locale, authored empty-state copy, shipping recurring-event logic.

**Category-reflex note:** Dark theme + green accent is the "calm productivity" path. #4CAF76 is the literal brand color, not arbitrary, but the schedule page over-applies it — event blocks default to green, creating a monochromatic sea. The 6 distinct SKILL_COLORS from the design system are never leveraged.

**Deterministic scan:** Clean across all 12 files. Zero findings from detect.mjs.

### Overall Impression

The calendar page is competent but emotionally flat. It works as a calendar but doesn't feel like 提灯. The firefly glow on CurrentTimeLine and the crafted empty-state copy are the only moments where the brand breathes. The toolbar is a dense control panel that belongs in a productivity tool, not a companion app. The biggest single opportunity: cut the toolbar density by 40% and let the content surface carry more emotional weight.

### What's Working

1. **Coherent empty-state language.** "种下一颗种子，让它慢慢长大" (AgendaView) and "标记一个值得等待的日子，让每一天都有盼头" (CountdownList) are pure brand voice — low-pressure, poetic, inviting.

2. **Thorough recurring event handling.** The parseRecurringInstanceId / exdate model and the "edit this instance vs all" scope dialog are genuinely well-architected calendar logic with clear explanatory subtext.

3. **The firefly design elements.** CurrentTimeLine's green glow pulse and the FAB's firefly-breath animation are the only places where the 夜萤 metaphor lives in the interaction layer.

### Priority Issues

**P1 — No loading states; API errors silently swallowed**
- **Why it matters:** When a user clicks "保存", the modal closes immediately. They have no way to know if their data persisted. For a local-first app this is a fundamental trust violation.
- **Fix:** Add loading indicator during fetches. Wrap CRUD in try/catch, surface errors through the notification banner. Disable submit buttons while in-flight.
- **Suggested command:** /impeccable harden 日历

**P1 — Countdown view is inaccessible and broken on Escape**
- **Why it matters:** (a) Hidden behind "..." with zero discoverability. (b) Toolbar vanishes when activated — jarring context switch. (c) Escape explicitly blocked (line 255: if (viewMode === 'countdown') return;) — CountdownForm modal cannot be dismissed with keyboard.
- **Fix:** Make countdown a first-class view pill, or add a hint in the toolbar. Restore Escape handling. Keep toolbar visible with active pill highlighted.
- **Suggested command:** /impeccable harden 日历

**P1 — Inconsistent week start days across views**
- **Why it matters:** WeekView starts Monday (Chinese convention). DayView and AgendaView start Sunday. The same weekday label maps to different days depending on which view you're in.
- **Fix:** Unify to Monday-start across all views.
- **Suggested command:** /impeccable polish 日历

**P2 — Dense toolbar collapses poorly**
- **Why it matters:** 10+ controls in one row with flex-wrap. With 3-4 calendar pills, content wraps uncontrolled. Calendar scroll is invisible (scrollbar-width: none).
- **Fix:** Collapse view pills into dropdown on narrow screens, or make calendar filters collapsible.
- **Suggested command:** /impeccable adapt 日历

**P2 — Event detail modal stack creates disorientation**
- **Why it matters:** Recurring event edit/delete can reach 4 z-stacked layers. User loses visual context of the underlying calendar.
- **Fix:** Use inline content replacement instead of stacked modals. Make scope choice a horizontal picker within the same card.
- **Suggested command:** /impeccable distill 日历

**P2 — Inaccessible event text colors**
- **Why it matters:** All-day events use appTheme.onPrimary (white) on green — contrast ~1.77:1, failing WCAG AA. Countdown buttons use white on light colors (#D4A843 gold).
- **Fix:** Replace with getContrastColor() for dynamic contrast.
- **Suggested command:** /impeccable audit 日历

**P3 — Import errors shown in green (success) color**
- **Why it matters:** ICS import failures ("解析失败") display with appTheme.primary (green) background — visually signaling success. Only store-level error state gets the red treatment.
- **Fix:** Distinguish message types or use a neutral notification color.
- **Suggested command:** /impeccable polish 日历

### Minor Observations

- Hardcoded bg-red-500 on delete button (EventDetail.tsx:428) bypasses the brand's muted danger token (#C97070) — violates the "no urgency-inducing red" anti-reference
- Hours array includes 00:00 and 24:00 — edge cases consuming vertical space for zero value
- previousView initialized to 'week' — navigating to day from agenda mode loses agenda context on back
- The location emoji (EventDetail.tsx:329) breaks the design system's custom-icon approach
- Past/future countdowns have no visual separator in CountdownList

### Questions to Consider

1. What would this page look like if the toolbar were designed by a poet instead of an engineer? The brand promises 静谧 (tranquility) but the navigation delivers a control panel.
2. Why does delete get a raw red button when the entire brand promise is "no urgency-inducing red warnings"?
3. Is countdown hiding because it doesn't fit the calendar metaphor — or is the calendar metaphor wrong for the brand?
