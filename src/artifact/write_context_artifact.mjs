import fs from "fs";
import path from "path";
import { safeMkdirp } from "../util/fs.mjs";

export function writeContextArtifact({ srcDir, outDir, contextMd, artifactJson }) {
  safeMkdirp(outDir);
  fs.writeFileSync(path.join(outDir, "context.md"), contextMd, "utf8");
  fs.writeFileSync(path.join(outDir, "context.json"), JSON.stringify(artifactJson, null, 2) + "\n", "utf8");

  process.stdout.write(`Wrote ${path.relative(process.cwd(), path.join(outDir, "context.md"))}\n`);
  process.stdout.write(`Wrote ${path.relative(process.cwd(), path.join(outDir, "context.json"))}\n`);
}

