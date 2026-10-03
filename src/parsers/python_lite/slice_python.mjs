import { readUtf8 } from "../../util/fs.mjs";
import { die } from "../../util/die.mjs";
import { PY_DECL } from "./parse_python.mjs";

function indentOf(line) {
  return (line.match(/^(\s*)/)?.[1] ?? "").length;
}

function isBlankOrPyComment(line) {
  const t = line.trim();
  return t === "" || t.startsWith("#");
}

export function slicePython(absPath, startLine) {
  const lines = readUtf8(absPath).split("\n");
  const sIdx = startLine - 1;
  if (!Number.isInteger(startLine) || sIdx < 0 || sIdx >= lines.length) die(`Invalid line: ${startLine}`, 2);
  if (!lines[sIdx].trim()) die(`Invalid span: line ${startLine} produced no source`, 2);

  const defIndent = indentOf(lines[sIdx]);
  const isDeclaration = PY_DECL.test(lines[sIdx]);

  let top = sIdx;
  while (
    top - 1 >= 0 &&
    indentOf(lines[top - 1]) === defIndent &&
    lines[top - 1].trim().startsWith("@")
  ) {
    top--;
  }

  let headerEnd = sIdx;
  let balance = 0;
  let started = false;
  if (isDeclaration) {
    for (let i = sIdx; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "(") {
          balance++;
          started = true;
        } else if (ch === ")") {
          balance--;
        }
      }
      if (balance < 0) die(`Invalid span: unbalanced declaration at line ${startLine}`, 2);
      headerEnd = i;
      if (started && balance <= 0) break;
      if (lines[i].trim().endsWith(":") && !lines[i].trim().includes("(")) break;
    }
  }

  if ((started && balance !== 0) || (isDeclaration && !lines[headerEnd].trimEnd().endsWith(":"))) {
    die(`Invalid span: unterminated declaration at line ${startLine}`, 2);
  }

  let end = headerEnd + 1;
  for (let i = headerEnd + 1; i < lines.length; i++) {
    if (isBlankOrPyComment(lines[i])) {
      end = i + 1;
      continue;
    }
    if (indentOf(lines[i]) > defIndent) end = i + 1;
    else break;
  }

  while (end - 1 > sIdx && isBlankOrPyComment(lines[end - 1])) end--;
  const out = lines.slice(top, end).join("\n");
  if (!out.trim()) die(`Invalid span: line ${startLine} produced no source`, 2);
  return out;
}
