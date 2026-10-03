import path from "path";
import { die } from "../../util/die.mjs";
import { isDir, isPathInside } from "../../util/fs.mjs";
import { repoFingerprint } from "../../util/repo_fingerprint.mjs";
import { buildPythonIndex } from "../../compiler/python_index.mjs";
import { formatIndexText } from "../../artifact/format_index_text.mjs";
import { writeContextArtifact } from "../../artifact/write_context_artifact.mjs";

export function compileCommand({ pos, flags }) {
  const srcDir = pos[0];
  if (!srcDir) die("Usage: cq compile <srcDir> --task=\"...\" [--out=.cq] [--budget=12000] [--exclude=tests,docs] [--level=L2]", 2);
  if (!isDir(srcDir)) die(`Not a directory: ${srcDir}`, 2);

  const task = typeof flags.task === "string" ? flags.task : "";
  if (!task.trim()) die("Missing required flag: --task=\"...\"", 2);

  const budget = Number(flags.budget ?? 12000);
  if (!Number.isFinite(budget) || budget <= 1000) die("Invalid --budget (must be a number >= 1000)", 2);

  const outDir = path.join(srcDir, String(flags.out ?? ".cq"));
  if (!isPathInside(srcDir, outDir)) die(`Output path outside repository: ${flags.out}`, 2);
  const excludeSegments = String(flags.exclude ?? "tests,docs")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const level = String(flags.level ?? "L2");

  const fp = repoFingerprint(srcDir);
  const index = buildPythonIndex(srcDir, { excludeSegments });

  const indexText = formatIndexText(index, { level });
  const header = [
    `# cq context`,
    ``,
    `task: ${task}`,
    `repo: ${fp.type}:${fp.value}`,
    `budget_chars: ${budget}`,
    `exclude: ${excludeSegments.join(",") || "(none)"}`,
    `generated_at: ${new Date().toISOString()}`,
    ``,
    `## How to use`,
    `- Start your agent with the index below.`,
    `- When the agent needs code, fetch only the exact symbol via:`,
    `  - node cq.mjs expand "${srcDir}" <file> <ClassName>`,
    `  - node cq.mjs slice  "${srcDir}" <file> <Class.method|symbol|line:NN>`,
    ``,
    `## Index`,
    ``,
  ].join("\n");

  const bodyBudget = Math.max(0, budget - header.length);
  const trimmedIndexText =
    indexText.length <= bodyBudget
      ? indexText
      : indexText.slice(0, bodyBudget - 200).trimEnd() + "\n\n# (truncated to budget)\n";
  const contextMd = header + trimmedIndexText;

  const artifact = {
    cq_format: "v1",
    generated_at: new Date().toISOString(),
    task,
    repo: fp,
    budget_chars: budget,
    exclude: excludeSegments,
    language: index.language,
    files: Object.keys(index.files)
      .sort()
      .map((rel) => {
        const f = index.files[rel];
        return {
          path: rel,
          classes: Object.keys(f.classes)
            .sort()
            .map((name) => ({
              name,
              line: f.classes[name].line,
              methods: f.classes[name].methods.map((m) => ({ name: m.name, line: m.line })),
            })),
          top_fns: f.topFns.map((fn) => ({ name: fn.name, line: fn.line })),
        };
      }),
  };

  writeContextArtifact({ srcDir, outDir, contextMd, artifactJson: artifact });
}
