import fs from "fs";
import path from "path";

export function walkFiles(srcDir, { excludeSegments = [], extensions = [] } = {}) {
  const out = [];
  const banned = new Set([".git", "node_modules", ".cq"]);

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (banned.has(ent.name)) continue;
      const abs = path.join(dir, ent.name);
      const rel = path.relative(srcDir, abs);
      if (excludeSegments.some((seg) => rel.split(path.sep).includes(seg))) continue;
      if (ent.isDirectory()) {
        walk(abs);
      } else if (extensions.some((ext) => ent.name.endsWith(ext))) {
        out.push(abs);
      }
    }
  }

  walk(srcDir);
  return out.sort();
}

