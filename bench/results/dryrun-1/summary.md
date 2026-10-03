# cq A/B — gpt-5.6-luna / effort low

repo: ~/GuardianAI · reps: 1 · 2026-09-24T05:00:34.294Z

Primary metric: uncached input + output tokens (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t1_cvss | A | 15758 | 15758 | 15758 | 1/1 | 0% | 1 |
| t1_cvss | B | 15451 | 15451 | 15451 | 1/1 | 100% | 1 |

## Gate (fixed before running)
- B median ≤ A median × 0.8, B success ≥ A success, B cq call rate ≥ 70%

- t1_cvss: B vs A 1.9% fewer tokens → **FAIL (reduction below threshold)**

## Limits
- n=1 per cell; no significance claims.
- Tasks were chosen to favour cq (one large file) and there is no control task.
- Raw events, stderr and diffs are omitted from the public copy (the target repository was private when this copy was made, 2026-10-03).
