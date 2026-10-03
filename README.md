# cq — 회고 (2026-10-03 종료)

> 개인 실험 프로젝트로 마무리했다. 코드는 더 이상 손대지 않는다. 남길 가치가 있는 건 아래의 측정 기록이다.
>
> 이 레포는 비공개 원본 레포를 정리한 공개용 사본이다(원본의 커밋 히스토리는 가져오지 않았다). 9/24 측정의 대상인 GuardianAI 레포가 이 사본을 만든 2026-10-03 당시 비공개였기 때문에 원본 로그는 뺐고, 지표와 요약은 남겼다.

## 무엇을 시도했나
가설은 "코딩 에이전트에게 압축 인덱스 + 정확한 소스 슬라이스를 주면, 파일을 통째로 읽을 때보다 토큰이 줄어든다"였다.
2026년 7월 프로토타입(v1~v10)을 거쳐 Build Week MVP로 만들었다. 이후 실제 에이전트(codex)로 A/B를 했다.
모든 A/B는 통과 기준을 측정 전에 고정했고, 실패한 결과도 숫자 그대로 남겼다.

| 날짜 | 질문 | 결과 | 기록 |
|---|---|---|---|
| 07-02 | v1~v10 프로토타입 | 단발 8x, 자율탐색 1.6x (파일 통째 읽기 기준) | [history.md](docs/history.md) |
| 09-24 | cq가 단일 파일 레포에서 토큰을 줄이나 | 탈락: −3.8% / +15.4% | [history.md](docs/history.md) |
| 10-03 | cq가 큰 다중 파일 레포(sqlglot)에서 토큰을 줄이나 | 탈락: −1.7% / +48.5% / +32.8% | [history.md](docs/history.md) |
| 10-03 | gajae-code의 AGENTS.md가 작업을 낫게 하나 | 1 통과 / 2 탈락: 관례 준수 0/9 → 8/9, 토큰은 대체로 +30~75% | [gajae-agents-md.md](docs/gajae-agents-md.md) |
| 10-03 | 짧은 AGENTS.md(1.1KB)가 전체(12.5KB)만큼 효과적이면서 더 싼가 | 탈락(비용): 관례 준수는 9/9로 같고, 토큰 차이는 변동에 묻힘 | [gajae-agents-md.md](docs/gajae-agents-md.md) |

## 배운 것
1. **전제가 낡았었다.** 지금의 에이전트는 파일을 통째로 읽지 않는다. `rg -n`으로 줄 번호를 찾고 `sed -n`으로 필요한 범위만 읽는다.
   v1~v10의 절감 수치는 이미 존재하지 않는 기준과 비교한 결과였다.
2. **도구를 더해주면 대체가 아니라 추가가 된다.** cq를 주자 에이전트는 `rg`와 함께 썼고, 명령 수와 토큰이 늘었다.
3. **고정 비용과 변동이 크다.** 같은 조건에서도 실행당 토큰이 2~3배 흔들렸다. n=3으로는 30% 미만의 토큰 차이를 구분할 수 없다.
   반면 관례 준수처럼 0/9 대 8/9로 갈리는 이진 지표는 선명하게 보였다.
4. **AGENTS.md의 실제 가치는 관례 전달이다.** 탐색 효율이 아니다. 그리고 관례 전달에 필요한 건 규칙 몇 줄이었다.

## 남은 것
- `cq.mjs`, `src/`: Python 인덱스/슬라이스 CLI (아래 원래 README 참고)
- `bench/agentic_ab.mjs`: codex A/B 하네스. 레포·태스크·군별 AGENTS.md·판정 스크립트·통과 기준을 설정 파일로 바꾼다.
  설정 예: `bench/tasks*.json`. 과거 PR을 수정 직전 커밋에서 다시 풀게 하고, 그 PR의 테스트를 숨겨 두었다가 판정에 쓰는 방식이 가장 손이 덜 갔다.
- `bench/results/`: 모든 측정의 원자료 (이벤트 로그, diff, 요약)

---

*아래는 Build Week 당시 README 원문이다.*

# cq

independent reimplementation, inspired by quarkify

### A deterministic context compiler for AI coding agents

`cq` turns a Python repository into a compact Context Artifact, then returns exact source slices only when an agent asks for them.

Built for the **Developer Tools** track of OpenAI Build Week 2026.

## The problem: coding agents rummage

Before an agent can change code, it has to understand where the relevant code lives. The common approach is to open large files, search broadly, re-open the same files, and pull nearby code into context “just in case.”

That creates three problems:

- **Context waste:** most of what the agent reads is unrelated to the task.
- **Wrong-context edits:** similarly named files and symbols make guessing dangerous.
- **Poor reproducibility:** it is difficult to know exactly what source the agent saw before making a decision.

The issue is not that agents cannot read repositories. It is that repository context is usually delivered without a small, deterministic contract.

## Why cq exists

`cq` introduces progressive disclosure for source code:

1. **Compile** the repository into a small, deterministic index.
2. **Inspect** only the exact symbol needed for the current decision.

```text
repository ── cq compile ──> context.md + context.json
                                      │
                                      └── cq inspect ──> exact source slice
```

`cq` is deliberately not an agent, IDE, chat wrapper, vector database, or semantic search service. It does not call an LLM. It is a tiny filesystem-native tool that gives agents a trustworthy context boundary.

## Run the two-minute demo

### Prerequisites

- Node.js 26
- Bash for the bundled demo script
- Git is optional, but enables commit-aware provenance

The CLI has no package dependencies and no installation step.

### Supported platforms

- **macOS:** CLI, demo, and release regressions are verified with Node.js 26.
- **Linux:** not yet verified.
- **Windows:** not yet verified.
- **WSL:** not yet verified.

From the repository root:

```bash
node cq.mjs --help
./examples/demo.sh
```

The demo uses `examples/fixture_py` and shows the complete product story:

1. `cq compile` writes a human-readable and machine-readable Context Artifact.
2. `cq inspect` returns `Greeter.hello` with a provenance header.
3. An ambiguous `dup.py` lookup fails with both candidates instead of guessing.

Representative inspect output:

```text
# cq inspect
# repo: sha256:<content-fingerprint>
# file: app.py
# target: Greeter.hello
# line: 5
# ---
    def hello(self):
        return f"Hello, {self.name}"
```

## How `compile` works

`compile` walks the target repository, indexes Python classes and functions, sorts the result deterministically, and writes a Context Artifact inside the repository.

```bash
node cq.mjs compile <srcDir> --task="..." [--out=.cq] [--budget=12000] [--exclude=tests,docs] [--level=L2]
```

It produces:

- `context.md` — a compact index designed to be given to an agent.
- `context.json` — the same repository structure in a machine-readable format.

The artifact includes the task, repository provenance, budget, exclusions, language, file paths, classes, methods, functions, and source line numbers. If the index exceeds the requested character budget, cq marks the artifact as truncated rather than silently pretending it is complete.

Example:

```bash
node cq.mjs compile examples/fixture_py \
  --task="Update Greeter.hello" \
  --budget=5000 \
  --out=.cq
```

## How `inspect` works

`inspect` resolves a repository-relative file and symbol, validates that the result is unique and in bounds, and prints the exact source slice with provenance.

```bash
node cq.mjs inspect <srcDir> <file> <target|Class.method|line:NN>
```

Examples:

```bash
# Qualified method
node cq.mjs inspect examples/fixture_py app.py Greeter.hello

# Top-level function
node cq.mjs inspect examples/fixture_py app.py top_level

# Explicit source line
node cq.mjs inspect examples/fixture_py app.py line:5
```

When a file or symbol is ambiguous, cq prints deterministic candidates and exits with an error. It never chooses the first match.

## Trust guarantees

Trust is the product, not an implementation detail.

- **No silent guessing:** duplicate files, classes, functions, or methods produce ambiguity errors.
- **Exact slices:** invalid lines, empty spans, and malformed declaration spans fail loudly.
- **Repository boundaries:** reads and generated artifacts cannot escape the target repository, including through symlinks.
- **Content provenance:** non-Git repositories are fingerprinted from sorted relative paths and contents, not their filesystem location.
- **Dirty-tree detection:** clean Git repositories use `HEAD`; dirty repositories include `HEAD` plus a deterministic content fingerprint.
- **Deterministic ordering:** indexes, candidates, and source slices are stable for the same repository state. Explicit `generated_at` metadata is intentionally time-varying.
- **Filesystem-native operation:** there is no daemon, database, network service, or hidden remote call.

## Full CLI

The primary workflow is `compile` followed by `inspect`. Lower-level commands expose the same parser and resolver primitives:

```text
compile <srcDir> --task="..." [--out=.cq] [--budget=12000] [--exclude=tests,docs] [--level=L2]
inspect <srcDir> <file> <target|Class.method|line:NN>
index   <srcDir> [--level=L0|L2] [--exclude=tests,docs]
expand  <srcDir> <file> <ClassName>
slice   <srcDir> <file> <target|Class.method|line:NN>
```

Run `node cq.mjs --help` for the shipped command summary.

## Verify the release

The repository includes executable behavior checks with no third-party test framework:

```bash
# Correctness boundaries
node benchmarks/no_silent_answers.mjs
node benchmarks/provenance.mjs
node benchmarks/trust_boundaries.mjs

# Output regression check: capture first, then compare
node benchmarks/regress_capture.mjs
node benchmarks/regress_diff.mjs
```

Expected final messages:

```text
OK: ambiguous symbols, invalid lines, and invalid spans fail loudly
OK: provenance identifies contents and dirty Git state
OK: repository trust boundaries enforced
Captured baseline to /private/tmp/cq_baseline
OK: outputs match baseline
```

## How Codex and GPT-5.6 were used

Codex and GPT-5.6 were engineering collaborators in building cq; they are not runtime dependencies of the product.

They were used to:

- turn the original prototype into small modules organized by CLI, compiler, parser, resolver, artifact, and filesystem responsibilities;
- implement `inspect` by reusing the existing resolution and slicing primitives;
- identify and reproduce trust failures before changing behavior;
- add repository read/write boundaries, content-correct provenance, dirty-tree detection, ambiguity rejection, and line/span validation;
- build executable regressions for every trust invariant;
- exercise the real CLI after each change and preserve existing valid outputs.

The key product decision was to keep LLM behavior outside cq. Codex and GPT-5.6 helped build and verify the compiler, while the shipped tool remains deterministic, local, inspectable, and model-independent.

## Technical design

The implementation is intentionally small:

- `cq.mjs` routes commands.
- `src/cli/` parses arguments and orchestrates command behavior.
- `src/compiler/` builds the repository index.
- `src/parsers/python_lite/` identifies and slices Python declarations.
- `src/resolver/` performs deterministic file resolution.
- `src/artifact/` formats and writes Context Artifacts.
- `benchmarks/` locks trust boundaries and output behavior.

This separation keeps the trust-sensitive parser, resolver, provenance, and artifact logic independently reviewable without turning cq into a framework.

## Current scope and limitations

- Python indexing and slicing only.
- The parser is intentionally heuristic; cq does not use AST or LSP integration in this release.
- `inspect` and `slice` expect Python files and Python declaration targets.
- The bundled demo requires Bash. Linux, Windows, and WSL are not yet verified.

These constraints keep the Build Week MVP focused on one promise: **compile a repository into trustworthy context, then reveal only the exact source an agent needs.**
