#!/usr/bin/env node
import fs from "fs";
import path from "path";
import childProcess from "child_process";

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function run(args, { cwd } = {}) {
  return childProcess.execFileSync(process.execPath, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function write(filePath, contents) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
}

const repoRoot = path.resolve(process.cwd());
const outDir = path.resolve("/private/tmp/cq_baseline");
const fixtureDir = path.join(repoRoot, "examples", "fixture_py");
const cq = path.join(repoRoot, "cq.mjs");

fs.rmSync(outDir, { recursive: true, force: true });
mkdirp(outDir);

write(path.join(outDir, "help.txt"), run([cq, "--help"], { cwd: repoRoot }));
write(path.join(outDir, "index_L0.txt"), run([cq, "index", fixtureDir, "--level=L0"], { cwd: repoRoot }));
write(path.join(outDir, "index_L2.txt"), run([cq, "index", fixtureDir, "--level=L2"], { cwd: repoRoot }));
write(path.join(outDir, "expand.txt"), run([cq, "expand", fixtureDir, "app.py", "Greeter"], { cwd: repoRoot }));
write(path.join(outDir, "slice_method.txt"), run([cq, "slice", fixtureDir, "app.py", "Greeter.hello"], { cwd: repoRoot }));
write(path.join(outDir, "slice_fn.txt"), run([cq, "slice", fixtureDir, "app.py", "top_level"], { cwd: repoRoot }));
write(path.join(outDir, "slice_dup_root.txt"), run([cq, "slice", fixtureDir, "b/dup.py", "Dup.b"], { cwd: repoRoot }));

let sliceDupAmbig = "";
try {
  sliceDupAmbig = run([cq, "slice", fixtureDir, "dup.py", "Dup.a"], { cwd: repoRoot });
} catch (e) {
  sliceDupAmbig = String(e.stderr ?? "");
}
write(path.join(outDir, "slice_dup_ambig_target.txt"), sliceDupAmbig);

const compileOut = run(
  [cq, "compile", fixtureDir, "--task=baseline", "--budget=5000", "--out=.cq_baseline"],
  { cwd: repoRoot },
);
write(path.join(outDir, "compile_stdout.txt"), compileOut);
write(path.join(outDir, "context.md"), fs.readFileSync(path.join(fixtureDir, ".cq_baseline", "context.md"), "utf8"));
write(path.join(outDir, "context.json"), fs.readFileSync(path.join(fixtureDir, ".cq_baseline", "context.json"), "utf8"));

process.stdout.write(`Captured baseline to ${outDir}\n`);
