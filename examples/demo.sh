#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="$ROOT/examples/fixture_py"

echo "== cq demo =="
echo

echo "1) compile"
node "$ROOT/cq.mjs" compile "$FIXTURE" --task="Demo: slice Greeter.hello" --budget=5000 --out=.cq_demo
echo

echo "Wrote:"
ls -la "$FIXTURE/.cq_demo" | sed -n '1,10p'
echo

echo "2) inspect exact method slice (with provenance header)"
node "$ROOT/cq.mjs" inspect "$FIXTURE" app.py Greeter.hello
echo

echo "3) demonstrate 'no silent wrong answers' (ambiguous file name)"
set +e
node "$ROOT/cq.mjs" inspect "$FIXTURE" dup.py Dup.a 2>&1
STATUS=$?
set -e
if [ "$STATUS" -eq 0 ]; then
  echo "ERROR: expected failure"
  exit 1
fi
echo

echo "Demo complete."
