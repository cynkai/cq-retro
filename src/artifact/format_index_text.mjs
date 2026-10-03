export function formatIndexText(index, { level = "L2" } = {}) {
  const lines = [];
  const filePaths = Object.keys(index.files).sort();
  for (const rel of filePaths) {
    const f = index.files[rel];
    lines.push(rel);
    if (level === "L2") {
      for (const cls of Object.keys(f.classes).sort()) {
        const c = f.classes[cls];
        lines.push(`  class ${cls} @${c.line} (${c.methods.length} methods)`);
      }
      if (f.topFns.length) lines.push(`  fn: ${f.topFns.length} functions`);
    } else {
      for (const cls of Object.keys(f.classes).sort()) {
        const c = f.classes[cls];
        lines.push(`  class ${cls} @${c.line}`);
        if (c.methods.length) lines.push(`    fn: ${c.methods.map((m) => `${m.name}@${m.line}`).join(", ")}`);
      }
      if (f.topFns.length) lines.push(`  fn: ${f.topFns.map((m) => `${m.name}@${m.line}`).join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

