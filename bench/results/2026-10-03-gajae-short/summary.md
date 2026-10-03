# cq A/B — gpt-5.6-luna / effort low

repo: undefined · reps: 3 · 2026-10-03T12:31:34.142Z

arms: A = repo, B = agents/gajae-short.md

Primary metric: total_plus_output (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t6_intargs | A | 359054 | 304684 | 775274 | 3/3 | 0% | 1 |
| t6_intargs | B | 529766 | 501004 | 866293 | 3/3 | 0% | 1 |
| t7_watchdog | A | 733990 | 658253 | 1024413 | 3/3 | 0% | 1 |
| t7_watchdog | B | 753824 | 510976 | 868373 | 3/3 | 0% | 1 |
| t8_deadline | A | 541555 | 420073 | 598037 | 3/3 | 0% | 1 |
| t8_deadline | B | 440083 | 263967 | 604741 | 3/3 | 0% | 1 |

## Check detail (count true / runs, or median)

| task | arm | changelog_fragment | changelog_md_untouched | added_test | no_console | src_files | hidden_tests |
|---|---|---|---|---|---|---|---|
| t6_intargs | A | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t6_intargs | B | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t7_watchdog | A | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t7_watchdog | B | 3/3 | 3/3 | 3/3 | 3/3 | 2 | 3/3 |
| t8_deadline | A | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |
| t8_deadline | B | 3/3 | 3/3 | 3/3 | 3/3 | 1 | 3/3 |

## Gate (fixed before running)
- B success ≥ A success, changelog_fragment count B − A ≥ -1, B median ≤ A median × 0.8

- t6_intargs: changelog_fragment B−A 0, tokens B vs A 47.5% → **FAIL (token cost above cap)**
- t7_watchdog: changelog_fragment B−A 0, tokens B vs A 2.7% → **FAIL (token cost above cap)**
- t8_deadline: changelog_fragment B−A 0, tokens B vs A -18.7% → **FAIL (token cost above cap)**

## Limits
- n=3 per cell; no significance claims.
- Same tasks and trees as tasks.gajae.json.
- A keeps the repository's full AGENTS.md (12.5KB); B replaces it with agents/gajae-short.md (1.1KB), whose sections are copied verbatim from the full file.
- Raw events, stderr and diffs: `raw/`.
