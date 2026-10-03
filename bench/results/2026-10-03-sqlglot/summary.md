# cq A/B — gpt-5.6-luna / effort low

repo: {"git":"https://github.com/tobymao/sqlglot.git","ref":"v27.0.0"} · reps: 3 · 2026-10-02T22:53:43.719Z

Primary metric: total_plus_output (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t3_cbrt | A | 379674 | 305987 | 389938 | 3/3 | 0% | 1 |
| t3_cbrt | B | 373200 | 349923 | 438923 | 3/3 | 100% | 1 |
| t4_bitcount | A | 293926 | 293393 | 440402 | 3/3 | 0% | 1 |
| t4_bitcount | B | 436589 | 283290 | 486757 | 3/3 | 100% | 1 |
| t5_splitpart | A | 249425 | 232844 | 293589 | 3/3 | 0% | 1 |
| t5_splitpart | B | 331340 | 195915 | 395264 | 3/3 | 100% | 1 |

## Gate (fixed before running)
- B median ≤ A median × 0.8, B success ≥ A success, B cq call rate ≥ 70%

- t3_cbrt: B vs A 1.7% fewer tokens → **FAIL (reduction below threshold)**
- t4_bitcount: B vs A -48.5% fewer tokens → **FAIL (reduction below threshold)**
- t5_splitpart: B vs A -32.8% fewer tokens → **FAIL (reduction below threshold)**

## Limits
- n=3 per cell; no significance claims.
- One repository (sqlglot v27.0.0), well known to the model; prompts name behaviour, not files or symbols.
- No control task.
- Raw events, stderr and diffs: `raw/`.
