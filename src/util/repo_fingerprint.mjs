import crypto from "crypto";
import fs from "fs";
import path from "path";
import childProcess from "child_process";

function contentFingerprint(srcDir) {
  const hash = crypto.createHash("sha256");

  function walk(dir) {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name === b.name ? 0 : a.name < b.name ? -1 : 1));
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name.startsWith(".cq")) continue;
      const abs = path.join(dir, entry.name);
      const rel = path.relative(srcDir, abs).split(path.sep).join("/");
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile()) {
        const contents = fs.readFileSync(abs);
        hash.update(`file\0${rel.length}\0${rel}\0${contents.length}\0`).update(contents);
      }
      else if (entry.isSymbolicLink()) hash.update(`link\0${rel}\0${fs.readlinkSync(abs)}\0`);
    }
  }

  walk(srcDir);
  return hash.digest("hex");
}

export function repoFingerprint(srcDir) {
  try {
    const out = childProcess.execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: srcDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const sha = String(out).trim();
    const dirty = childProcess.execFileSync("git", ["status", "--porcelain", "--untracked-files=all", "--", "."], {
      cwd: srcDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    if (sha && !String(dirty).trim()) return { type: "git", value: sha };
    if (sha) return { type: "git+dirty", value: `${sha}:${contentFingerprint(srcDir)}` };
  } catch {
    // ignore
  }
  return { type: "sha256", value: contentFingerprint(srcDir) };
}
