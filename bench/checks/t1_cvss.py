"""T1: cvss_label raises ValueError outside [0, 10]; labels inside are unchanged."""
import sys

from _extract import function, load

src, tree = load(sys.argv[1])
ns = {}
exec(function(tree, src, "cvss_label"), ns)
label = ns["cvss_label"]

expected = {0.0: "NONE", 0.1: "LOW", 3.9: "LOW", 4.0: "MEDIUM", 6.9: "MEDIUM",
            7.0: "HIGH", 8.9: "HIGH", 9.0: "CRITICAL", 10.0: "CRITICAL"}
for score, want in expected.items():
    got = label(score)
    if got != want:
        raise SystemExit(f"FAIL: cvss_label({score}) = {got!r}, want {want!r}")
for bad in (-0.1, -5, 10.1, 11):
    try:
        label(bad)
    except ValueError:
        continue
    raise SystemExit(f"FAIL: cvss_label({bad}) did not raise ValueError")
print("OK")
