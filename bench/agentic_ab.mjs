#!/usr/bin/env node
// A/B: does an AGENTS.md telling codex to use cq reduce tokens on real edit tasks?
//   A = repo as-is (no agent notes)   B = repo + AGENTS.md pointing at cq
// Usage: node bench/agentic_ab.mjs [--config=tasks.json] [--reps=3] [--tasks=t1_cvss,t2_kv] [--out=DIR]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")),
);
const cfg = JSON.parse(fs.readFileSync(path.resolve(here, args.config ?? "tasks.json"), "utf8"));
const repo = cfg.repo && resolveRepo(cfg.repo);
const metric = cfg.gate.metric ?? "uncached_plus_output";
const reps = Number(args.reps ?? 3);
const only = args.tasks ? new Set(args.tasks.split(",")) : null;
const tasks = cfg.tasks.filter((t) => !only || only.has(t.id));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve(args.out ?? path.join(here, "results", stamp));
const tools = path.join(here, ".tools");
const env = fs.existsSync(tools) ? { ...process.env, PATH: `${tools}:${process.env.PATH}` } : process.env;
const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cq-ab-"));
fs.mkdirSync(path.join(outDir, "raw"), { recursive: true });

const CQ = path.resolve(here, "..", "cq.mjs");
// What each arm sees as AGENTS.md: "none" removes it, "repo" keeps the repository's own,
// any other value is a file under bench/ written in its place. Default: A none, B cfg.agents.
const ARMS = cfg.arms ?? { A: "none", B: cfg.agents ?? "repo-claude" };
const armAgents = (spec) =>
  spec === "none" || spec === "repo" ? spec
  : spec === "repo-claude" ? fs.readFileSync(path.join(repo, "CLAUDE.md"), "utf8")
  : fs.readFileSync(path.resolve(here, spec), "utf8").replaceAll("{{CQ}}", CQ);
const AGENTS = Object.fromEntries(Object.entries(ARMS).map(([arm, spec]) => [arm, armAgents(spec)]));

function sh(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { encoding: "utf8", maxBuffer: 256 << 20, ...opts });
  if (r.error) throw r.error;
  return r;
}

// repo is a local path ("~/x") or { git, ref }: a pinned clone cached under bench/.targets/.
function resolveRepo(spec) {
  if (typeof spec === "string") return spec.replace(/^~/, os.homedir());
  const dir = path.join(here, ".targets", path.basename(spec.git, ".git"));
  if (!fs.existsSync(dir)) {
    const r = sh("git", ["clone", "-q", "--depth", "1", "--branch", spec.ref, spec.git, dir]);
    if (r.status) throw new Error(`clone failed: ${r.stderr}`);
  }
  const head = sh("git", ["describe", "--tags", "--exact-match"], { cwd: dir }).stdout.trim();
  if (head !== spec.ref) throw new Error(`${dir} is at ${head || "?"}, want ${spec.ref}`);
  return dir;
}

function prepare(task, runId, arm) {
  const dir = path.join(workRoot, runId);
  if (task.tree) {
    // A prepared tree (dependencies installed); APFS clone keeps the copy cheap.
    sh("cp", ["-cR", path.resolve(here, task.tree), dir]);
    fs.rmSync(path.join(dir, ".git"), { recursive: true, force: true });
  } else {
    sh("rsync", ["-a", "--exclude=.git", "--exclude=.cq", "--exclude=.venv", `${repo}/`, `${dir}/`]);
  }
  if (AGENTS[arm] !== "repo") {
    for (const f of ["CLAUDE.md", "AGENTS.md"]) fs.rmSync(path.join(dir, f), { force: true });
  }
  if (AGENTS[arm] !== "repo" && AGENTS[arm] !== "none") fs.writeFileSync(path.join(dir, "AGENTS.md"), AGENTS[arm]);
  sh("git", ["init", "-q"], { cwd: dir });
  sh("git", ["add", "-A"], { cwd: dir });
  sh("git", ["-c", "user.name=ab", "-c", "user.email=ab@local", "commit", "-qm", "base"], { cwd: dir });
  return dir;
}

function parseEvents(jsonl) {
  const usage = { input_tokens: 0, cached_input_tokens: 0, cache_write_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0 };
  const commands = [];
  let turns = 0;
  let finalMessage = "";
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === "turn.completed" && ev.usage) {
      turns++;
      for (const k of Object.keys(usage)) usage[k] += ev.usage[k] ?? 0;
    }
    const item = ev.item;
    if (ev.type === "item.completed" && item) {
      if (item.type === "command_execution") commands.push(item.command ?? "");
      if (item.type === "agent_message") finalMessage = item.text ?? finalMessage;
    }
  }
  return { usage, commands, turns, finalMessage };
}

function runOne(task, arm, rep) {
  const runId = `${task.id}-${arm}-${rep}`;
  const dir = prepare(task, runId, arm);
  const agentsFile = path.join(dir, "AGENTS.md");
  const agentsBytes = fs.existsSync(agentsFile) ? fs.statSync(agentsFile).size : 0;
  const started = Date.now();
  const r = sh("codex", [
    "exec", "--json", "--ephemeral", "--ignore-user-config", "--ignore-rules",
    "--skip-git-repo-check", "-s", "workspace-write",
    "-m", cfg.model, "-c", `model_reasoning_effort="${cfg.effort}"`,
    "-C", dir, task.prompt,
  ], { timeout: 15 * 60 * 1000, stdio: ["ignore", "pipe", "pipe"], env });
  fs.writeFileSync(path.join(outDir, "raw", `${runId}.jsonl`), r.stdout);
  if (r.stderr) fs.writeFileSync(path.join(outDir, "raw", `${runId}.stderr`), r.stderr);

  const ev = parseEvents(r.stdout);
  // Save the agent's diff before the check copies hidden tests into the tree.
  sh("git", ["add", "-A", "-N"], { cwd: dir });
  fs.writeFileSync(path.join(outDir, "raw", `${runId}.diff`), sh("git", ["diff"], { cwd: dir }).stdout);
  const check = sh("python3", [path.join(here, task.check), dir, ...(task.check_args ?? [])], { env });
  const lastLine = (check.stdout + check.stderr).trim().split("\n").pop();
  let detail;
  try { detail = JSON.parse(lastLine); } catch {}

  const u = ev.usage;
  return {
    run: runId, task: task.id, arm, rep,
    exit: r.status, seconds: Math.round((Date.now() - started) / 1000),
    agents_bytes: agentsBytes,
    ...u,
    uncached_plus_output: u.input_tokens - u.cached_input_tokens + u.output_tokens,
    total_plus_output: u.input_tokens + u.output_tokens,
    turns: ev.turns,
    commands: ev.commands.length,
    cq_calls: ev.commands.filter((c) => c.includes("cq.mjs")).length,
    success: check.status === 0,
    check_output: lastLine,
    ...(detail && { detail }),
  };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const rows = [];
const log = path.join(outDir, "runs.jsonl");
for (let rep = 1; rep <= reps; rep++) {
  for (const task of tasks) {
    const order = rep % 2 ? ["A", "B"] : ["B", "A"]; // alternate to spread drift
    for (const arm of order) {
      process.stderr.write(`run ${task.id} ${arm} #${rep} ... `);
      const row = runOne(task, arm, rep);
      rows.push(row);
      fs.appendFileSync(log, JSON.stringify(row) + "\n");
      process.stderr.write(`${row.success ? "ok" : "FAIL"} ${row[metric]} tok\n`);
    }
  }
}

const lines = [
  `# cq A/B — ${cfg.model} / effort ${cfg.effort}`, "",
  `repo: ${JSON.stringify(cfg.repo)} · reps: ${reps} · ${new Date().toISOString()}`, "",
  `arms: A = ${ARMS.A}, B = ${ARMS.B}`, "",
  `Primary metric: ${metric} (median per task).`, "",
  "| task | arm | median tok | min | max | success | cq call rate | median turns |",
  "|---|---|---|---|---|---|---|---|",
];
const verdicts = [];
for (const task of tasks) {
  const stat = {};
  for (const arm of ["A", "B"]) {
    const rs = rows.filter((r) => r.task === task.id && r.arm === arm);
    const tok = rs.map((r) => r[metric]);
    stat[arm] = {
      med: median(tok),
      ok: rs.filter((r) => r.success).length / rs.length,
      cq: rs.filter((r) => r.cq_calls > 0).length / rs.length,
    };
    lines.push(`| ${task.id} | ${arm} | ${stat[arm].med} | ${Math.min(...tok)} | ${Math.max(...tok)} | ` +
      `${rs.filter((r) => r.success).length}/${rs.length} | ${(stat[arm].cq * 100).toFixed(0)}% | ${median(rs.map((r) => r.turns))} |`);
  }
  const reduction = 1 - stat.B.med / stat.A.med;
  let verdict;
  if (cfg.gate.detail) {
    // Convention gate: B must win on a check-detail flag without losing quality or costing too much.
    const count = (arm) => rows.filter((r) => r.task === task.id && r.arm === arm && r.detail?.[cfg.gate.detail]).length;
    const gain = count("B") - count("A");
    if (stat.B.ok < stat.A.ok) verdict = "FAIL (quality dropped)";
    else if (gain < cfg.gate.min_detail_gain) verdict = `FAIL (${cfg.gate.detail} gain ${gain} < ${cfg.gate.min_detail_gain})`;
    else if (stat.B.med > stat.A.med * (1 + cfg.gate.max_token_increase)) verdict = "FAIL (token cost above cap)";
    else verdict = "PASS";
    verdicts.push(`- ${task.id}: ${cfg.gate.detail} B−A ${gain}, tokens B vs A ${(-reduction * 100).toFixed(1)}% → **${verdict}**`);
    continue;
  }
  if (stat.B.cq < cfg.gate.min_cq_call_rate) verdict = "INCONCLUSIVE (cq rarely called)";
  else if (stat.B.ok < stat.A.ok) verdict = "FAIL (quality dropped)";
  else if (reduction >= cfg.gate.min_token_reduction) verdict = "PASS";
  else verdict = "FAIL (reduction below threshold)";
  verdicts.push(`- ${task.id}: B vs A ${(reduction * 100).toFixed(1)}% fewer tokens → **${verdict}**`);
}
const detailKeys = [...new Set(rows.flatMap((r) => Object.keys(r.detail ?? {})))]
  .filter((k) => rows.every((r) => typeof (r.detail ?? {})[k] !== "string"));
if (detailKeys.length) {
  lines.push("", "## Check detail (count true / runs, or median)", "",
    `| task | arm | ${detailKeys.join(" | ")} |`, `|---|---|${detailKeys.map(() => "---").join("|")}|`);
  for (const task of tasks) for (const arm of ["A", "B"]) {
    const rs = rows.filter((r) => r.task === task.id && r.arm === arm && r.detail);
    const cell = (k) => typeof rs[0]?.detail[k] === "boolean"
      ? `${rs.filter((r) => r.detail[k]).length}/${rs.length}` : median(rs.map((r) => r.detail[k]));
    lines.push(`| ${task.id} | ${arm} | ${detailKeys.map(cell).join(" | ")} |`);
  }
}
lines.push("", "## Gate (fixed before running)",
  cfg.gate.detail
    ? `- B success ≥ A success, ${cfg.gate.detail} count B − A ≥ ${cfg.gate.min_detail_gain}, B median ≤ A median × ${1 + cfg.gate.max_token_increase}`
    : `- B median ≤ A median × ${1 - cfg.gate.min_token_reduction}, B success ≥ A success, B cq call rate ≥ ${cfg.gate.min_cq_call_rate * 100}%`,
  "", ...verdicts, "",
  "## Limits",
  `- n=${reps} per cell; no significance claims.`,
  ...(cfg.limits ?? []).map((l) => `- ${l}`),
  "- Raw events, stderr and diffs: `raw/`.");
fs.writeFileSync(path.join(outDir, "summary.md"), lines.join("\n") + "\n");
fs.rmSync(workRoot, { recursive: true, force: true });
console.log(path.join(outDir, "summary.md"));
