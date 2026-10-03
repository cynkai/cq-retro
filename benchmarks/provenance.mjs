#!/usr/bin/env node
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cq = path.resolve("cq.mjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "cq-provenance-"));

function inspect(repo) {
  const out = childProcess.execFileSync(process.execPath, [cq, "inspect", repo, "app.py", "hello"], {
    encoding: "utf8",
  });
  return out.match(/^# repo: (.+)$/m)?.[1];
}

function writeRepo(repo, value) {
  fs.mkdirSync(repo, { recursive: true });
  fs.writeFileSync(path.join(repo, "app.py"), `def hello():\n    return ${value}\n`);
}

try {
  const first = path.join(root, "first");
  const second = path.join(root, "second");
  writeRepo(first, 1);
  writeRepo(second, 1);

  assert.equal(inspect(first), inspect(second), "identical repository contents must have identical fingerprints");
  const before = inspect(first);
  writeRepo(first, 2);
  const changed = inspect(first);
  assert.notEqual(changed, before, "changing repository contents must change the fingerprint");

  fs.mkdirSync(path.join(first, ".cq_demo"));
  fs.writeFileSync(path.join(first, ".cq_demo", "context.md"), "generated\n");
  assert.equal(inspect(first), changed, "generated cq artifacts must not destabilize provenance");

  const gitRepo = path.join(root, "git-repo");
  writeRepo(gitRepo, 1);
  fs.writeFileSync(path.join(gitRepo, ".gitignore"), ".cq*\n");
  childProcess.execFileSync("git", ["init", "-q"], { cwd: gitRepo });
  childProcess.execFileSync("git", ["config", "user.email", "cq@example.invalid"], { cwd: gitRepo });
  childProcess.execFileSync("git", ["config", "user.name", "cq regression"], { cwd: gitRepo });
  childProcess.execFileSync("git", ["add", "."], { cwd: gitRepo });
  childProcess.execFileSync("git", ["commit", "-qm", "fixture"], { cwd: gitRepo });

  const head = childProcess.execFileSync("git", ["rev-parse", "HEAD"], { cwd: gitRepo, encoding: "utf8" }).trim();
  assert.equal(inspect(gitRepo), `git:${head}`, "clean Git repositories must retain HEAD provenance");
  writeRepo(gitRepo, 2);
  const dirty = inspect(gitRepo);
  assert.match(dirty, new RegExp(`^git\\+dirty:${head}:[0-9a-f]{64}$`));

  process.stdout.write("OK: provenance identifies contents and dirty Git state\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
