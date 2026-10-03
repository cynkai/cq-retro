import path from "path";
import { die } from "../../util/die.mjs";
import { isDir } from "../../util/fs.mjs";
import { walkFiles } from "../../fs/walk_files.mjs";
import { resolveFile } from "../../resolver/resolve_file.mjs";
import { parsePythonFile } from "../../parsers/python_lite/parse_python.mjs";
import { resolvePythonClass } from "../../parsers/python_lite/resolve_target.mjs";

export function expandCommand({ pos, flags }) {
  const [srcDir, rel, cls] = pos;
  if (!srcDir || !rel || !cls) die("Usage: cq expand <srcDir> <file> <ClassName>", 2);
  if (!isDir(srcDir)) die(`Not a directory: ${srcDir}`, 2);

  const excludeSegments = String(flags.exclude ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pyFiles = walkFiles(srcDir, { excludeSegments, extensions: [".py"] });
  const filesByRelPath = new Map(pyFiles.map((abs) => [path.relative(srcDir, abs), true]));
  const abs = resolveFile(srcDir, rel, filesByRelPath);
  if (!abs) die(`File not found: ${rel}`, 2);

  const parsed = parsePythonFile(abs);
  const { classes } = parsed;
  resolvePythonClass(parsed, cls);
  const c = classes[cls];
  if (!c) die(`Class not found: ${cls} (in ${path.relative(srcDir, abs)})`, 2);
  process.stdout.write(`# ${path.relative(srcDir, abs)}\nclass ${cls} @${c.line}\n  fn: ${c.methods.map((m) => `${m.name}@${m.line}`).join(", ")}\n`);
}
