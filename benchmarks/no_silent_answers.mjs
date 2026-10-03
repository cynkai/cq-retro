#!/usr/bin/env node
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cq = path.resolve("cq.mjs");
const repo = fs.mkdtempSync(path.join(os.tmpdir(), "cq-symbols-"));

function run(...args) {
  return childProcess.spawnSync(process.execPath, [cq, ...args], { encoding: "utf8" });
}

function expectError(result, pattern) {
  assert.equal(result.status, 2, `expected exit 2, received ${result.status}\n${result.stderr}`);
  assert.match(result.stderr, pattern);
  assert.equal(result.stdout, "");
}

try {
  fs.writeFileSync(
    path.join(repo, "duplicates.py"),
    [
      "class A:",
      "    def run(self):",
      "        return 1",
      "",
      "class B:",
      "    def run(self):",
      "        return 2",
      "",
      "def same():",
      "    return 1",
      "",
      "def same():",
      "    return 2",
      "",
      "class Twice:",
      "    def value(self):",
      "        return 1",
      "",
      "class Twice:",
      "    def value(self):",
      "        return 2",
      "",
      "class Repeat:",
      "    def twice(self):",
      "        return 1",
      "    def twice(self):",
      "        return 2",
      "",
      "class Clash:",
      "    pass",
      "",
      "def Clash():",
      "    return 1",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(path.join(repo, "broken.py"), "def broken(\n    value\n");

  expectError(run("inspect", repo, "duplicates.py", "run"), /^Ambiguous target: run\nCandidates \(2\):/);
  expectError(run("inspect", repo, "duplicates.py", "same"), /^Ambiguous target: same\nCandidates \(2\):/);
  expectError(run("inspect", repo, "duplicates.py", "Twice.value"), /^Ambiguous target: Twice\.value\nCandidates \(2\):/);
  expectError(run("inspect", repo, "duplicates.py", "Repeat.twice"), /^Ambiguous target: Repeat\.twice\nCandidates \(2\):/);
  expectError(run("inspect", repo, "duplicates.py", "Clash"), /^Ambiguous target: Clash\nCandidates \(2\):/);
  expectError(run("expand", repo, "duplicates.py", "Twice"), /^Ambiguous class: Twice\nCandidates \(2\):/);

  for (const target of ["0", "999", "line:-1", "line:1.5", "line:abc", "line:999"]) {
    expectError(run("inspect", repo, "duplicates.py", target), new RegExp(`^Invalid line: ${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} `));
  }

  expectError(run("inspect", repo, "duplicates.py", "line:4"), /^Invalid span: line 4 produced no source\n$/);
  expectError(run("inspect", repo, "broken.py", "broken"), /^Invalid span: unterminated declaration at line 1\n$/);

  const valid = run("inspect", repo, "duplicates.py", "A.run");
  assert.equal(valid.status, 0);
  assert.match(valid.stdout, /# target: A\.run\n# line: 2\n# ---\n    def run\(self\):\n        return 1\n$/);

  process.stdout.write("OK: ambiguous symbols, invalid lines, and invalid spans fail loudly\n");
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
}
