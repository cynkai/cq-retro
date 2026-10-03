"""T3: CBRT(x) transpiles to T-SQL as POWER(x, 1.0 / 3); other dialects unchanged."""
import re
import sys

from _run import regress, run

repo = sys.argv[1]
out = run(repo, """
from sqlglot import transpile
print(transpile("SELECT CBRT(x)", read="postgres", write="tsql")[0])
print(transpile("SELECT CBRT(x)", read="postgres", write="duckdb")[0])
""").splitlines()
m = re.fullmatch(r"SELECT POWER\(x, (.+)\)", out[0])
exponent = m and re.sub(r"CAST\(([\d.]+) AS (?:FLOAT|REAL|DECIMAL[^)]*)\)", r"\1", m.group(1))
if not exponent or not re.fullmatch(r"[\d.\s/()]+", exponent) or abs(eval(exponent) - 1 / 3) > 1e-9:
    raise SystemExit(f"FAIL: tsql output {out[0]!r}")
if out[1] != "SELECT CBRT(x)":
    raise SystemExit(f"FAIL: duckdb output changed to {out[1]!r}")
regress(repo, "tests/dialects/test_tsql.py", "tests/dialects/test_postgres.py")
print("OK")
