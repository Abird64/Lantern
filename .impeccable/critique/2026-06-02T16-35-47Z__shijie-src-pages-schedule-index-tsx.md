---
target: 日历
total_score: 22
p0_count: 2
p1_count: 3
timestamp: 2026-06-02T16-35-47Z
slug: shijie-src-pages-schedule-index-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading states good; messages auto-dismiss after 3s before user can read them |
| 2 | Match System / Real World | 3 | Familiar calendar metaphor; raw RRULE display breaks this |
| 3 | User Control and Freedom | 2 | Escape closes modals; no undo; nested modals disorienting |
| 4 | Consistency and Standards | 2 | Modal border-radius varies (16px/18px/20px); day view has filtering bug |
| 5 | Error Prevention | 2 | Delete confirmations present; no time validation; no autosave |
| 6 | Recognition Rather Than Recall | 3 | Visible actions; calendar colors lack persistent legend across views |
| 7 | Flexibility and Efficiency | 3 | 5 view modes = flexible; no keyboard shortcuts; no drag-to-create |
| 8 | Aesthetic and Minimalist Design | 2 | 4 rows of chrome stacked above content; 10px unreadable month cell text |
| 9 | Error Recovery | 1 | Raw RRULE display; no inline validation; error messages nearly absent |
| 10 | Help and Documentation | 1 | No tooltips; no onboarding; dashed-border convention unexplained |
| **Total** | | **22/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: This page is not wholesale AI slop, but it has two textbook AI-slop violations: the 4px left-border accent stripe on countdown cards and the 4px color bar in agenda view. Both are direct hits against the side-stripe ban. The page feels competent but flat — dense chrome, cramped month cells with 10px text, nothing that says "this is a gentle companion walking with you through the night."

**Deterministic scan**: Detector caught `side-tab` antipattern in CountdownList.tsx:214 (`borderLeft: '4px solid'`). The AgendaView `w-1 h-8` color bar is visually equivalent but uses different CSS structure so the detector missed it. No other findings.

**Visual overlays**: Not available (no browser automation).

## Overall Impression

A functionally complete calendar that feels halfway between a generic scheduling component and a branded app. The event overlap layout algorithm is smart and efficient, and the view mode architecture is clean. But 4 rows of chrome sit above actual content, month cells read like ant footprints, and the countdown card border stripe screams "AI made this." Biggest opportunity: bridge the gap between the brand's poetic promise and the actual interface.

## What's Working

1. **Event overlap layout** solves a genuinely hard problem — side-by-side columns for overlapping events, with task_sync grouping neatly tucked beneath regular events, keeping the time grid visually coherent.
2. **View mode architecture** is clean — DayView shares the same time-grid rendering pipeline as WeekView, and the `previousView` state pattern correctly returns users to their prior context.
3. **Calendar color horizontal scroll with mouse-wheel hijack** is a thoughtful interaction for multi-calendar users, surfacing complex filtering in a compact form.

## Priority Issues

**[P0] 4 rows of chrome stacked before calendar content** — NavBar + view switcher + calendar filter pills + date navigator consume ~160px of vertical space before content begins. On a laptop screen, users see mostly controls, not their schedule. **Fix**: Merge view switcher and date navigator into one row; collapse calendar filter pills into a dropdown; reduce to 2 rows (NavBar + unified toolbar).

**[P0] Side-stripe accent borders** — CountdownList cards with `borderLeft: 4px solid` and AgendaView's `w-1 h-8` color bar. The single strongest visual cue of AI-generated design. **Fix**: Replace with a colored dot badge or a subtle background tint on the entire row/card.

**[P1] Inconsistent modal and input border-radius** — EventForm uses `rounded-[18px]`, EventDetail uses `rounded-2xl` (16px), the design system specifies 20px but nothing hits it. The 2-4px variation reads as carelessness. **Fix**: Standardize to one value; remove `rounded-[18px]`.

**[P1] Month view 10px unreadable event pills** — Up to 3 events plus "+N more" crammed into 80px-tall cells at 10px font with break-all wrapping. 10px Chinese text is below Apple HIG minimum. Users cannot read event titles without clicking through. **Fix**: Show only color dots (no titles), or truncate to one line with hover tooltip. Increase min cell height to 100px.

**[P1] No time validation on event creation/edit** — Users can set end time before start time with no warning. Produces zero or negative height event blocks with confusing visual artifacts. **Fix**: Add inline validation — if end_at <= start_at, show error below end time input and disable save.

**[P2] Error/status messages auto-dismiss after 3 seconds** — If a user looks away, the feedback is gone. Import results are meaningful and should persist until dismissed. **Fix**: Keep status messages visible until user dismisses them or the next action replaces them.

**[P2] Raw RRULE display in EventDetail view mode** — "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR" is gibberish to non-technical users. **Fix**: Parse RRULE and render localized description (e.g., "每两周的周一、周三、周五").

**[P3] No keyboard support** — No Tab navigation, no Escape-to-close, no arrow keys for calendar nav, no shortcut for new event. Power users are locked out. **Fix**: ArrowLeft/Right for prev/next; Escape to close modals; Ctrl+N for new event; T for today.

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts for any calendar operation. Cannot create event by clicking/dragging on the time grid — must always use FAB -> form modal. No search or text filter across views. 1200px fixed grid height makes scrolling a full day tedious with no "jump to hour" shortcut.

**Jordan (First-Timer)**: 5 view modes presented without explanation of what each is best for. Dashed-border convention for task_sync events is never explained. Calendar management requires finding a small gear icon in the filter row — low discoverability. Recurring event scope choice is a conceptually hard decision without context.

**Sam (Accessibility-Dependent)**: 10px font sizes in month event pills, time axis labels, and hint text violate WCAG minimum. No visible focus indicators on any interactive elements. Color is the only differentiator for calendar categories — colorblind users cannot distinguish event sources. No aria-labels, roles, or semantic HTML. inkMuted48 at 30% opacity on dark bg yields ~3.2:1 contrast ratio, below WCAG AA.

## Bug: Day View Calendar Filtering Bypassed

DayView receives `schedules` (unfiltered) at line 339 while every other view receives `filteredSchedules`. Calendar visibility toggles are silently ignored in day view.

## Minor Observations

- Stale comments (`{/* end min-w wrapper */}`) in WeekView.tsx and MonthView.tsx refer to wrapping divs that were apparently removed
- The "Import" button lives in DateNavigator alongside nav controls, but importing is a data action, not navigation
- EventBlock's contrast-color function uses a simplified luminance formula — some mid-brightness colors may have marginal text contrast
- The "40 minutes default duration" is an arbitrary choice with no user-facing rationale
- Notification checker in index.tsx is a stub (just console.logs) — remove or implement
- MonthView 6-week fixed grid (42 cells) shows 2 empty weeks for short months like February 2021
- The green-tinted grid lines (primary color at 20% opacity) create a subtle "firefly grid" effect that aligns with the brand — more of the page should lean into this

## Questions to Consider

- Should the countdown view be a separate top-level page rather than a calendar view mode? It has fundamentally different data semantics.
- Does the calendar need all 5 view modes at launch? Could "day" be accessed only by clicking a day cell, and "agenda" live on the home dashboard?
- For an app that promises to "walk with you through the night," does a 1200px scrollable time grid with 10px text and 4 dense rows of controls feel like a gentle companion, or an efficient productivity tool?
