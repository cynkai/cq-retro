"""T5: unsupported SPLIT_PART to T-SQL keeps the call instead of emitting nothing."""
import sys

from _run import regress, run

repo = sys.argv[1]
run(repo, """
from sqlglot import transpile
from sqlglot.errors import ErrorLevel, UnsupportedError
got = transpile("SELECT SPLIT_PART(a, ',', 2)", read="postgres", write="tsql")[0]
assert got == "SELECT SPLIT_PART(a, ',', 2)", got
got = transpile("SELECT SPLIT_PART('a.b.c', '.', 2)", read="postgres", write="tsql")[0]
assert got == "SELECT PARSENAME('a.b.c', 2)", got
try:
    transpile("SELECT SPLIT_PART(a, ',', 2)", read="postgres", write="tsql", unsupported_level=ErrorLevel.RAISE)
except UnsupportedError:
    pass
else:
    raise AssertionError("no UnsupportedError with ErrorLevel.RAISE")
""")
regress(repo, "tests/dialects/test_tsql.py")
print("OK")
