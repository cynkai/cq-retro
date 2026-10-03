# cq A/B — gpt-5.6-luna / effort low

repo: undefined · reps: 3 · 2026-10-03T11:27:39.241Z

Primary metric: total_plus_output (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t6_intargs | A | 474578 | 321009 | 494513 | 3/3 | 0% | 1 |
| t6_intargs | B | 828287 | 568608 | 886068 | 3/3 | 0% | 1 |
| t7_watchdog | A | 801480 | 364428 | 969711 | 3/3 | 0% | 1 |
| t7_watchdog | B | 608176 | 599547 | 700235 | 3/3 | 0% | 1 |
| t8_deadline | A | 471593 | 256281 | 492691 | 3/3 | 0% | 1 |
| t8_deadline | B | 609841 | 591528 | 710869 | 3/3 | 0% | 1 |

## Check detail (count true / runs, or median)

| task | arm | changelog_fragment | changelog_md_untouched | added_test | no_console | src_files | hidden_tests |
|---|---|---|---|---|---|---|---|
| t6_intargs | A | 0/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t6_intargs | B | 2/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t7_watchdog | A | 0/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t7_watchdog | B | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t8_deadline | A | 0/3 | 2/3 | 1/3 | 3/3 | 1 | 3/3 |
| t8_deadline | B | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |

## Gate (fixed before running)
- B success ≥ A success, changelog_fragment count B − A ≥ 2, B median ≤ A median × 1.2

- t6_intargs: changelog_fragment B−A 2, tokens B vs A 74.5% → **FAIL (token cost above cap)**
- t7_watchdog: changelog_fragment B−A 3, tokens B vs A -24.1% → **PASS**
- t8_deadline: changelog_fragment B−A 3, tokens B vs A 29.3% → **FAIL (token cost above cap)**

## Limits
- n=3 per cell; no significance claims.
- Tasks replay the user's own merged PRs (#6242, #6246, #6252); all are small single-file fixes.
- B keeps the repository's AGENTS.md (12.5KB); A has it removed. Everything else in the repo, including docs/, is identical.
- Bases are prepared trees under bench/.targets (git archive + bun install + prebuilt natives 0.18.5).
- Raw events, stderr and diffs: `raw/`.
