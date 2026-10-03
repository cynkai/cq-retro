# cq A/B — gpt-5.6-luna / effort low

repo: undefined · reps: 1 · 2026-10-03T10:59:12.610Z

Primary metric: total_plus_output (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t7_watchdog | A | 481040 | 481040 | 481040 | 1/1 | 0% | 1 |
| t7_watchdog | B | 1008064 | 1008064 | 1008064 | 1/1 | 0% | 1 |

## Check detail (count true / runs, or median)

| task | arm | changelog_fragment | changelog_md_untouched | added_test | no_console | src_files | hidden_tests |
|---|---|---|---|---|---|---|---|
| t7_watchdog | A | 0/1 | 1/1 | 1/1 | 1/1 | 1 | 1/1 |
| t7_watchdog | B | 1/1 | 1/1 | 1/1 | 1/1 | 1 | 1/1 |

## Gate (fixed before running)
- B success ≥ A success, changelog_fragment count B − A ≥ 2, B median ≤ A median × 1.2

- t7_watchdog: changelog_fragment B−A 1, tokens B vs A 109.6% → **FAIL (changelog_fragment gain 1 < 2)**

## Limits
- n=1 per cell; no significance claims.
- Tasks replay the user's own merged PRs (#6242, #6246, #6252); all are small single-file fixes.
- B keeps the repository's AGENTS.md (12.5KB); A has it removed. Everything else in the repo, including docs/, is identical.
- Bases are prepared trees under bench/.targets (git archive + bun install + prebuilt natives 0.18.5).
- Raw events, stderr and diffs: `raw/`.
