# cq A/B — gpt-5.6-luna / effort low

repo: {"git":"https://github.com/tobymao/sqlglot.git","ref":"v27.0.0"} · reps: 1 · 2026-10-02T22:33:14.650Z

Primary metric: total_plus_output (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t5_splitpart | A | 272429 | 272429 | 272429 | 1/1 | 0% | 1 |
| t5_splitpart | B | 412143 | 412143 | 412143 | 1/1 | 100% | 1 |

## Gate (fixed before running)
- B median ≤ A median × 0.8, B success ≥ A success, B cq call rate ≥ 70%

- t5_splitpart: B vs A -51.3% fewer tokens → **FAIL (reduction below threshold)**

## Limits
- n=1 per cell; no significance claims.
- One repository (sqlglot v27.0.0), well known to the model; prompts name behaviour, not files or symbols.
- No control task.
- Raw events, stderr and diffs: `raw/`.
