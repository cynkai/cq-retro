import { readUtf8 } from "../../util/fs.mjs";

export const PY_DECL = /^(\s*)(?:async\s+)?(def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/;

export function parsePythonFile(absPath) {
  const lines = readUtf8(absPath).split("\n");
  const decls = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PY_DECL);
    if (!m) continue;
    decls.push({ indent: m[1].length, kind: m[2], name: m[3], line: i + 1 });
  }

  const classes = {};
  const topFns = [];
  const symbols = [];

  for (let i = 0; i < decls.length; i++) {
    const d = decls[i];
    if (d.kind === "class") {
      const methods = [];
      symbols.push({ kind: "class", name: d.name, line: d.line });
      for (let j = i + 1; j < decls.length; j++) {
        if (decls[j].indent <= d.indent) break;
        if (decls[j].kind === "def") {
          methods.push({ name: decls[j].name, line: decls[j].line });
          symbols.push({ kind: "method", className: d.name, name: decls[j].name, line: decls[j].line });
        }
      }
      if (!(d.name in classes)) classes[d.name] = { line: d.line, methods };
    } else if (d.indent === 0) {
      symbols.push({ kind: "function", name: d.name, line: d.line });
      if (!topFns.some((t) => t.name === d.name)) topFns.push({ name: d.name, line: d.line });
    }
  }

  const lineCount = lines.length - (lines.at(-1) === "" ? 1 : 0);
  return { classes, topFns, symbols, lineCount };
}
