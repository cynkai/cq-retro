"""T4: BIT_COUNT parses to exp.BitCount; ClickHouse spells it bitCount."""
import sys

from _run import regress, run

repo = sys.argv[1]
run(repo, """
from sqlglot import exp, parse_one, transpile
for d in ("mysql", "duckdb", "postgres", "tsql"):
    node = parse_one("SELECT BIT_COUNT(x)", read=d).expressions[0]
    assert type(node) is exp.BitCount, (d, type(node).__name__)
    assert node.this.name == "x", d
node = parse_one("SELECT bitCount(x)", read="clickhouse").expressions[0]
assert type(node) is exp.BitCount, ("clickhouse", type(node).__name__)
cases = [
    ("mysql", "duckdb", "SELECT BIT_COUNT(x)", "SELECT BIT_COUNT(x)"),
    ("mysql", "clickhouse", "SELECT BIT_COUNT(x)", "SELECT bitCount(x)"),
    ("clickhouse", "mysql", "SELECT bitCount(x)", "SELECT BIT_COUNT(x)"),
]
for r, w, q, want in cases:
    got = transpile(q, read=r, write=w)[0]
    assert got == want, (r, w, got)
""")
regress(repo, "tests/dialects/test_clickhouse.py", "tests/dialects/test_mysql.py", "tests/dialects/test_duckdb.py")
print("OK")
