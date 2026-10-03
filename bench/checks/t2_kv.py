"""T2: RedTeamPDF.kv prints "-" for None or empty values; other values unchanged."""
import sys

from _extract import function, load, method

src, tree = load(sys.argv[1])
ns = {}
exec(function(tree, src, "_safe"), ns)
exec(method(tree, src, "RedTeamPDF", "kv"), ns)
kv = ns["kv"]


class FakePDF:
    GR = (140, 140, 140)
    LT = (220, 220, 220)

    def __init__(self):
        self.cells = []

    def set_font(self, *a, **k): pass
    def set_text_color(self, *a, **k): pass

    def cell(self, w, h, txt="", *a, **k):
        self.cells.append(txt)


def value_cell(v):
    pdf = FakePDF()
    kv(pdf, "Key", v)
    if len(pdf.cells) < 2:
        raise SystemExit(f"FAIL: kv wrote {len(pdf.cells)} cells for {v!r}")
    return pdf.cells[-1]


for v in (None, ""):
    got = value_cell(v)
    if got != "-":
        raise SystemExit(f"FAIL: kv value cell for {v!r} = {got!r}, want '-'")
for v, want in (("gpt-5", "gpt-5"), (42, "42"), (0, "0")):
    got = value_cell(v)
    if got != want:
        raise SystemExit(f"FAIL: kv value cell for {v!r} = {got!r}, want {want!r}")
print("OK")
