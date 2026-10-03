#!/usr/bin/env node
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cq = path.resolve("cq.mjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "cq-trust-"));
const repo = path.join(root, "repo");

try {
  fs.mkdirSync(repo);
  fs.writeFileSync(path.join(repo, "app.py"), "def inside():\n    return 1\n");
  fs.writeFileSync(path.join(root, "outside.py"), "def outside():\n    return 2\n");
  fs.symlinkSync(path.join(root, "outside.py"), path.join(repo, "linked.py"));

  const read = childProcess.spawnSync(process.execPath, [cq, "inspect", repo, "../outside.py", "outside"], {
    encoding: "utf8",
  });
  assert.equal(read.status, 2, "inspect must reject files outside the repository");

  const linkedRead = childProcess.spawnSync(process.execPath, [cq, "inspect", repo, "linked.py", "outside"], {
    encoding: "utf8",
  });
  assert.equal(linkedRead.status, 2, "inspect must reject symlinks that point outside the repository");

  const write = childProcess.spawnSync(process.execPath, [cq, "compile", repo, "--task=trust", "--out=../escaped"], {
    encoding: "utf8",
  });
  assert.equal(write.status, 2, "compile must reject output paths outside the repository");
  assert.equal(fs.existsSync(path.join(root, "escaped")), false, "compile must not create output outside the repository");

  const linkedOutput = path.join(root, "linked-output");
  fs.mkdirSync(linkedOutput);
  fs.symlinkSync(linkedOutput, path.join(repo, ".cq"));
  const linkedWrite = childProcess.spawnSync(process.execPath, [cq, "compile", repo, "--task=trust"], {
    encoding: "utf8",
  });
  assert.equal(linkedWrite.status, 2, "compile must reject output symlinks that point outside the repository");
  assert.equal(fs.existsSync(path.join(linkedOutput, "context.md")), false, "compile must not follow output symlinks");

  process.stdout.write("OK: repository trust boundaries enforced\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
