"""Judge one gajae-code run: hidden PR tests + repo conventions from AGENTS.md.

usage: check.py <run dir> <source repo> <merge sha> <package> <test file>...
The last stdout line is a JSON detail object; exit status 0 means the hidden tests passed.
"""
import json
import os
import pathlib
import re
import subprocess
import sys

run_dir, source, sha, pkg, *tests = sys.argv[1:]
source = os.path.expanduser(source)
bun_dir = pathlib.Path(__file__).resolve().parents[2] / ".tools"
env = {**os.environ, "PATH": f"{bun_dir}:{os.environ['PATH']}"}


def git(*args):
    return subprocess.run(["git", *args], cwd=run_dir, capture_output=True, text=True).stdout


# Conventions are read from the agent's own change, before hidden tests are copied in.
git("add", "-A", "-N")
changed = git("diff", "--name-only", "HEAD").split()
added_lines = [l[1:] for l in git("diff", "-U0", "HEAD").splitlines() if l.startswith("+") and not l.startswith("+++")]
src_files = [f for f in changed if "/src/" in f]
detail = {
    "changelog_fragment": any(re.fullmatch(rf"packages/{pkg}/changelog\.d/[^/]+\.md", f) for f in changed),
    "changelog_md_untouched": not any(f.endswith("CHANGELOG.md") for f in changed),
    "added_test": any("/test/" in f for f in changed),
    "no_console": not any(re.search(r"\bconsole\.(log|warn|error)\(", l) for l in added_lines),
    "src_files": len(src_files),
}

for t in tests:
    blob = subprocess.run(["git", "-C", source, "show", f"{sha}:{t}"], capture_output=True, check=True).stdout
    pathlib.Path(run_dir, t).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(run_dir, t).write_bytes(blob)
r = subprocess.run(["bun", "test", *tests], cwd=run_dir, env=env, capture_output=True, text=True, timeout=600)
detail["hidden_tests"] = r.returncode == 0
if r.returncode:
    tail = [l for l in (r.stdout + r.stderr).splitlines() if l.strip()][-3:]
    detail["test_tail"] = " | ".join(tail)[-300:]
print(json.dumps(detail))
sys.exit(0 if r.returncode == 0 else 1)
