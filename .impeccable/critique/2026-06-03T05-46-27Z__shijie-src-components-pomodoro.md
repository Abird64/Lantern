---
target: 番茄钟
total_score: 28
p0_count: 2
p1_count: 2
timestamp: 2026-06-03T05-46-27Z
slug: shijie-src-components-pomodoro
---
## Combined Critique: 番茄钟 (Pomodoro)

### Assessment A: Design Review
A design director-level review of all 6 pomodoro source files (components, store, service, types).

### Assessment B: Detector Scan
`detect.mjs` returned `[]` — clean. No deterministic anti-patterns found in the component tree. The detector and LLM review agree on the absence of gradient text, glassmorphism, and numbered section markers. The detector did not flag the hero-metric template or accent stripe because those are semantic/layout patterns the CLI cannot detect.

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Ring + label + timer make state clear; pause lacks visual ring distinction; loading/error well-handled in card |
| 2 | Match System / Real World | 4 | Pomodoro metaphor natural; MindfulStart copy lands poetically; firefly currency needs one-time explanation |
| 3 | User Control and Freedom | 3 | Pause/resume/stop/skip present; stop and complete have NO confirmation dialog; no undo; Esc key not wired |
| 4 | Consistency and Standards | 4 | Theme tokens consistent; rounded-3xl + pill buttons match system; DashboardCard wrapper ensures parity |
| 5 | Error Prevention | 2 | Stop is one-click destructive; complete is one-click; X closes with no confirmation; no guardrails anywhere |
| 6 | Recognition Rather Than Recall | 3 | Icon-only controls — no labels, no tooltips on main buttons; Maximize2 icon non-obvious |
| 7 | Flexibility and Efficiency | 2 | Zero keyboard shortcuts; no quick-start from bar; no session history; no swipe gestures |
| 8 | Aesthetic and Minimalist Design | 4 | ImmersiveView ring + radial glow is superb; clean color palette; 1000ms ring animation breathes; no visual noise |
| 9 | Error Recovery | 2 | All catch blocks only console.error; no toast, no retry UI; silent failure on start/complete/cancel |
| 10 | Help and Documentation | 1 | Zero contextual help; no first-run tour; no tooltips; "0 个番茄" is not an invitation |
| **Total** | | **28/40** | **Good — solid foundation, address weak areas** |

---

## Anti-Patterns Verdict

**Does this look AI-generated?** No. The ImmersiveView ring with radial glow and the MindfulStart microcopy are genuinely distinctive. Two minor violations:

1. **Hero-metric template** (`PomodoroCard.tsx:47-56`): Large 24px count + tiny 12px "个番茄" label. The banned "big number + small label + gradient accent" pattern turns deep focus into a KPI.

2. **Accent stripe** (`PomodoroTimer.tsx:97`): `<div className="h-1" style={{ backgroundColor: color }} />` as a decorative top bar. The phase label pill already carries the color — this stripe adds visual noise.

**Deterministic scan**: Clean. `detect.mjs` found zero issues in the component tree.

---

## Overall Impression

The ImmersiveView is genuinely beautiful and on-brand. The MindfulStart wizard has perfect tone. But the NormalView and dashboard card undermine the brand — they feel more "productivity tool" than "quiet companion." The zero accessibility and zero keyboard support are gaping holes for a desktop app. The single-biggest opportunity: add a confirmation step for destructive timer actions and wire up basic keyboard shortcuts, which would fix 3 of the 5 priority issues in one pass.

---

## Priority Issues

1. **[P0] No error feedback to users**: All `catch` blocks in `pomodoroStore.ts` silently log to console. Failed start/complete/cancel give zero user feedback — the button appears dead. Fix: toast or inline error state. `pomodoroStore.ts:166,193,238,269`

2. **[P0] Destructive actions without confirmation**: Stop, complete (SkipForward), and modal X all immediately discard the session. One mis-tap loses a 20-min focus session. Fix: confirmation dialog or 2-second undo toast. `PomodoroTimer.tsx:158,165,276`

3. **[P1] Zero accessibility**: Main buttons lack `aria-label`. The SVG ring has no `role="progressbar"`. PomodoroBar uses a `div onClick` instead of `<button>`. Screen reader users cannot operate this feature. `PomodoroTimer.tsx:101-175,258-285; PomodoroBar.tsx:30-88`

4. **[P1] No keyboard shortcuts**: Space for pause, Escape for close, left/right arrows — none wired. Desktop app without keyboard support fails platform expectations. `PomodoroTimer.tsx` — no keyboard handlers.

5. **[P2] Dashboard card turns human practice into KPI**: The hero-metric template ("X 个番茄" + "+Y XP +Z 萤火") reduces deep focus to gamified stats. Replace with a poetic invitation when idle, show sessions more humbly when present. `PomodoroCard.tsx:47-70`

---

## Persona Red Flags

**Jordan (First-Timer)**: Lands on "0 个番茄" with no CTA. Three unlabeled icon buttons in the timer are intimidating. No explanation of the focus/break cycle. No empty-state guidance. MindfulStart is only reachable from task context — a user without tasks never discovers it.

**Alex (Power User)**: Zero keyboard shortcuts. Cannot adjust duration from timer — must navigate to settings. No session history visible. Bar click opens modal instead of compact control. `auto_start_break` setting has no inline toggle.

**Sam (Accessibility)**: All icon buttons lack `aria-label`. SVG ring has no accessible name/role. No visible focus indicators. PomodoroBar `div` is not focusable. Color alone conveys phase (green vs. muted-green). Tab order unclear.

**Riley (Stress Tester)**: Error states fully swallowed. Session restore has potential race condition with `startFocus`. Zero-duration settings edge case unguarded. Long text handling via CSS truncation is correct.

**Casey (Mobile)**: Bar pause button is ~28px (minimum touch target is 44px). NormalView 340px fixed width barely fits a 375px phone. No haptic feedback on session complete. Wall-clock elapsed means breaks expire while user is away — no "session expired" state.

---

## Minor Observations

- Fixed 340px width on NormalView card (`PomodoroTimer.tsx:93`) — not responsive
- `BREAK_COLOR` hardcoded in two files — should be a theme token
- Unused `_i` variable in `MindfulStart.tsx:148` map callback
- `stop()` desyncs if API call fails — store resets locally but session persists on backend
- No transition animation when entering immersive mode (sudden background cut)

---

## Questions to Consider

1. What if the timer counted UP instead of DOWN? "You have been focused for 12 minutes" aligns with 陪伴 better than "08:00 remaining."
2. Should the dashboard card exist in its current form, or become a simple "开始专注" launcher with subtle session dots?
3. Is the 3-screen MindfulStart wizard the right entry point for every session, or should there be a "quick start" path that skips it?
