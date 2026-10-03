import path from "path";
import { walkFiles } from "../fs/walk_files.mjs";
import { parsePythonFile } from "../parsers/python_lite/parse_python.mjs";

export function buildPythonIndex(srcDir, { excludeSegments = [] } = {}) {
  const pyFiles = walkFiles(srcDir, { excludeSegments, extensions: [".py"] });
  const files = {};
  for (const abs of pyFiles) {
    const rel = path.relative(srcDir, abs);
    const parsed = parsePythonFile(abs);
    if (Object.keys(parsed.classes).length === 0 && parsed.topFns.length === 0) continue;
    files[rel] = parsed;
  }
  return { language: "python", files };
}

