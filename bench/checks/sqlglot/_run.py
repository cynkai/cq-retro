"""Run a snippet against the sqlglot checkout at argv[1] in a clean subprocess."""
import os
import subprocess
import sys


def run(repo, code):
    env = {**os.environ, "PYTHONPATH": repo, "PYTHONWARNINGS": "ignore"}
    r = subprocess.run([sys.executable, "-c", code], env=env, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("FAIL: " + (r.stdout + r.stderr).strip().splitlines()[-1])
    return r.stdout


def regress(repo, *tests):
    env = {**os.environ, "PYTHONPATH": repo, "PYTHONWARNINGS": "ignore"}
    r = subprocess.run([sys.executable, "-m", "pytest", "-q", "-x", "-p", "no:cacheprovider", *tests],
                       cwd=repo, env=env, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("FAIL: regression " + (r.stdout.strip().splitlines() or ["?"])[-1])
