# cq A/B — gpt-5.6-luna / effort low

repo: ~/GuardianAI · reps: 3 · 2026-09-24T05:05:26.329Z

Primary metric: uncached input + output tokens (median per task).

| task | arm | median tok | min | max | success | cq call rate | median turns |
|---|---|---|---|---|---|---|---|
| t1_cvss | A | 15815 | 15499 | 16199 | 3/3 | 0% | 1 |
| t1_cvss | B | 15214 | 14705 | 15231 | 3/3 | 100% | 1 |
| t2_kv | A | 15418 | 15271 | 17745 | 3/3 | 0% | 1 |
| t2_kv | B | 17785 | 16940 | 19782 | 3/3 | 100% | 1 |

## Gate (fixed before running)
- B median ≤ A median × 0.8, B success ≥ A success, B cq call rate ≥ 70%

- t1_cvss: B vs A 3.8% fewer tokens → **FAIL (reduction below threshold)**
- t2_kv: B vs A -15.4% fewer tokens → **FAIL (reduction below threshold)**

## Limits
- n=3 per cell; no significance claims.
- Tasks were chosen to favour cq (one large file) and there is no control task.
- Raw events, stderr and diffs are omitted from the public copy (private target repository).
