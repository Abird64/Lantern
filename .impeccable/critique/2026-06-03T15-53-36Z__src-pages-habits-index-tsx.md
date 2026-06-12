---
target: 习惯页面 (src/pages/Habits/index.tsx)
total_score: 23
p0_count: 1
p1_count: 2
timestamp: 2026-06-03T15-53-36Z
slug: src-pages-habits-index-tsx
---
# Design Critique: 习惯 (Habits)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Reward popup solid; no loading state during check-in; error uses raw alert() |
| 2 | Match System / Real World | 3 | Icons map to activities; "萤火" assumes lore knowledge |
| 3 | User Control and Freedom | 3 | Clear modal exits; delete confirm; no undo after delete |
| 4 | Consistency and Standards | 2 | Full-card toggle unusual; alert() breaks UI consistency |
| 5 | Error Prevention | 2 | Delete has confirm; check-in/uncheck are one-click with no safety |
| 6 | Recognition Rather Than Recall | 3 | Week dots + colors + icons aid recognition; right-click hidden |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts, batch ops, or sorting |
| 8 | Aesthetic and Minimalist Design | 2 | Side-stripe border flagged; hero-metric banner feels templated |
| 9 | Error Recovery | 2 | Specific errors but via window.alert |
| 10 | Help and Documentation | 1 | Tooltips only; no onboarding or XP/glow explanation |
| **Total** | | **23/40** | Acceptable |

## Anti-Patterns Verdict

**LLM assessment**: Two tells: (1) HabitCard borderLeft: 4px solid is the #1 AI slop signal. (2) The hero-metric progress banner. Empty state and alert() errors lack brand voice.

**Detector scan**: 1 finding - side-tab accent border at HabitCard.tsx:40 (borderLeft: 4px solid).

## What's Working

1. **Week dot visualization**: Instant pattern recognition; today ring outline is elegant.
2. **Reward popup integration**: Animated glow + XP + skill breakdown creates satisfying peak-end moment.
3. **Progressive disclosure in modal**: Collapsible advanced options keep create flow simple.

## Priority Issues

- **[P0] Side-stripe border**: Replace borderLeft: 4px solid with subtler accent.
- **[P1] Error handling breaks immersion**: Replace window.alert with gentle inline toast.
- **[P1] Empty state lacks brand voice**: Use warm, poetic copy.
- **[P2] FAB on desktop**: Mobile pattern on desktop; use header button instead.
- **[P2] No loading indicator during check-in**: Add subtle pulse/shimmer on card.

## Persona Red Flags

- **Alex (Power User)**: No keyboard shortcuts, batch ops, or inline editing.
- **Jordan (First-Timer)**: 12 icons + 6 colors is dense. "萤火" unexplained. No week dot legend.
- **桑启's Companion**: Side-stripe cards and alert() feel generic; habits page lacks the app's poetic soul.

## Minor Observations

- Modal icon grid: 12 icons breaks 4-item cognitive load rule
- Uncheck is too easy (one-click undoes progress)
- "连续 X 天" could be warmer: "已经坚持 X 天"
- Heatmap month labels use fragile position:absolute with calculated margins
- No distinction between past and future days in week dots
