import path from "path";
import { die } from "../../util/die.mjs";
import { isDir } from "../../util/fs.mjs";
import { walkFiles } from "../../fs/walk_files.mjs";
import { resolveFile } from "../../resolver/resolve_file.mjs";
import { parsePythonFile } from "../../parsers/python_lite/parse_python.mjs";
import { resolvePythonTarget } from "../../parsers/python_lite/resolve_target.mjs";
import { slicePython } from "../../parsers/python_lite/slice_python.mjs";

export function sliceCommand({ pos, flags }) {
  const [srcDir, rel, target] = pos;
  if (!srcDir || !rel || !target) die("Usage: cq slice <srcDir> <file> <target|Class.method|line:NN>", 2);
  if (!isDir(srcDir)) die(`Not a directory: ${srcDir}`, 2);

  const excludeSegments = String(flags.exclude ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pyFiles = walkFiles(srcDir, { excludeSegments, extensions: [".py"] });
  const filesByRelPath = new Map(pyFiles.map((abs) => [path.relative(srcDir, abs), true]));
  const abs = resolveFile(srcDir, rel, filesByRelPath);
  if (!abs) die(`File not found: ${rel}`, 2);

  const lm = parsePythonFile(abs);
  const line = resolvePythonTarget(lm, target);
  if (!line) die(`Target not found: ${target} (in ${path.relative(srcDir, abs)})`, 2);
  const out = slicePython(abs, line);
  process.stdout.write(out + (out.endsWith("\n") ? "" : "\n"));
}

