import fs from "fs";
import path from "path";
import { die } from "../util/die.mjs";
import { isPathInside } from "../util/fs.mjs";

export function resolveFile(srcDir, given, filesByRelPath) {
  const direct = path.join(srcDir, given);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    if (!isPathInside(srcDir, direct)) die(`File outside repository: ${given}`, 2);
    return direct;
  }

  const norm = given.replace(/^\.?\//, "");
  const candidates = [];

  if (filesByRelPath.has(norm)) {
    candidates.push(path.join(srcDir, norm));
  }

  for (const rel of filesByRelPath.keys()) {
    if (rel.endsWith(path.posix.sep + norm) || rel.endsWith(path.sep + norm)) candidates.push(path.join(srcDir, rel));
  }

  const base = path.basename(norm);
  for (const rel of filesByRelPath.keys()) {
    if (path.basename(rel) === base) candidates.push(path.join(srcDir, rel));
  }

  const uniq = [...new Set(candidates)];
  if (uniq.length === 1) {
    if (!isPathInside(srcDir, uniq[0])) die(`File outside repository: ${given}`, 2);
    return uniq[0];
  }
  if (uniq.length === 0) return null;

  const rels = uniq.map((abs) => path.relative(srcDir, abs)).slice(0, 12);
  die(
    [
      `Ambiguous file: ${given}`,
      `Candidates (${uniq.length}):`,
      ...rels.map((r) => `  - ${r}`),
      uniq.length > rels.length ? "  - ..." : "",
      "Provide a more specific path.",
    ]
      .filter(Boolean)
      .join("\n"),
    2,
  );
}
