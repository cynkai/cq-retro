#!/usr/bin/env node
import fs from "fs";
import path from "path";
import childProcess from "child_process";

function run(args, { cwd } = {}) {
  return childProcess.execFileSync(process.execPath, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function normalizeDynamic(text) {
  // Replace ISO timestamps like 2026-07-18T06:12:34.567Z
  return text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g, "<TS>");
}

function listBaselineFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name).sort();
}

function equal(a, b) {
  return a === b;
}

const repoRoot = path.resolve(process.cwd());
const baselineDir = path.resolve("/private/tmp/cq_baseline");
const outDir = path.resolve("/private/tmp/cq_after");
const fixtureDir = path.join(repoRoot, "examples", "fixture_py");
const cq = path.join(repoRoot, "cq.mjs");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Re-capture current outputs (same set as baseline capture).
fs.writeFileSync(path.join(outDir, "help.txt"), run([cq, "--help"], { cwd: repoRoot }));
fs.writeFileSync(path.join(outDir, "index_L0.txt"), run([cq, "index", fixtureDir, "--level=L0"], { cwd: repoRoot }));
fs.writeFileSync(path.join(outDir, "index_L2.txt"), run([cq, "index", fixtureDir, "--level=L2"], { cwd: repoRoot }));
fs.writeFileSync(path.join(outDir, "expand.txt"), run([cq, "expand", fixtureDir, "app.py", "Greeter"], { cwd: repoRoot }));
fs.writeFileSync(path.join(outDir, "slice_method.txt"), run([cq, "slice", fixtureDir, "app.py", "Greeter.hello"], { cwd: repoRoot }));
fs.writeFileSync(path.join(outDir, "slice_fn.txt"), run([cq, "slice", fixtureDir, "app.py", "top_level"], { cwd: repoRoot }));
fs.writeFileSync(path.join(outDir, "slice_dup_root.txt"), run([cq, "slice", fixtureDir, "b/dup.py", "Dup.b"], { cwd: repoRoot }));

let sliceDupAmbig = "";
try {
  sliceDupAmbig = run([cq, "slice", fixtureDir, "dup.py", "Dup.a"], { cwd: repoRoot });
} catch (e) {
  sliceDupAmbig = String(e.stderr ?? "");
}
fs.writeFileSync(path.join(outDir, "slice_dup_ambig_target.txt"), sliceDupAmbig);

const compileOut = run([cq, "compile", fixtureDir, "--task=baseline", "--budget=5000", "--out=.cq_baseline"], { cwd: repoRoot });
fs.writeFileSync(path.join(outDir, "compile_stdout.txt"), compileOut);
fs.writeFileSync(path.join(outDir, "context.md"), read(path.join(fixtureDir, ".cq_baseline", "context.md")));
fs.writeFileSync(path.join(outDir, "context.json"), read(path.join(fixtureDir, ".cq_baseline", "context.json")));

// Compare.
const files = listBaselineFiles(baselineDir);
let ok = true;
for (const f of files) {
  const a = normalizeDynamic(read(path.join(baselineDir, f)));
  const b = normalizeDynamic(read(path.join(outDir, f)));
  if (!equal(a, b)) {
    ok = false;
    process.stderr.write(`DIFF: ${f}\n`);
  }
}

if (!ok) process.exit(1);
process.stdout.write("OK: outputs match baseline\n");
