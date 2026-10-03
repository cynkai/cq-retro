"""Pull top-level functions / class methods out of a source file without importing it."""
import ast
import pathlib


def load(repo, rel="app.py"):
    src = pathlib.Path(repo, rel).read_text(encoding="utf-8")
    return src, ast.parse(src)


def function(tree, src, name):
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == name:
            return ast.get_source_segment(src, node)
    raise SystemExit(f"FAIL: function {name} not found")


def method(tree, src, cls, name):
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == cls:
            for item in node.body:
                if isinstance(item, ast.FunctionDef) and item.name == name:
                    import textwrap
                    return textwrap.dedent(ast.get_source_segment(src, item))
    raise SystemExit(f"FAIL: method {cls}.{name} not found")
