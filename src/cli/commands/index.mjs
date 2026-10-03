import { die } from "../../util/die.mjs";
import { isDir } from "../../util/fs.mjs";
import { buildPythonIndex } from "../../compiler/python_index.mjs";
import { formatIndexText } from "../../artifact/format_index_text.mjs";

export function indexCommand({ pos, flags }) {
  const srcDir = pos[0];
  if (!srcDir) die("Usage: cq index <srcDir> [--level=L0|L2] [--exclude=tests,docs]", 2);
  if (!isDir(srcDir)) die(`Not a directory: ${srcDir}`, 2);
  const level = String(flags.level ?? "L0");
  const excludeSegments = String(flags.exclude ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const index = buildPythonIndex(srcDir, { excludeSegments });
  const hdr = [
    `# cq index (${level})`,
    level === "L2" ? "# Expand methods via: cq expand <file> <Class>" : "# Slice bodies via: cq slice <file> <Class.method>",
    "# Tip: only slice symbols you intend to change.",
    "",
  ].join("\n");
  process.stdout.write(hdr + formatIndexText(index, { level }));
}

