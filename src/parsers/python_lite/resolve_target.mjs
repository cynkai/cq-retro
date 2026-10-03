import { die } from "../../util/die.mjs";

function symbolLabel(symbol) {
  if (symbol.kind === "class") return `class ${symbol.name}`;
  if (symbol.kind === "method") return `${symbol.className}.${symbol.name}`;
  return `fn ${symbol.name}`;
}

function resolveUnique(kind, target, candidates) {
  if (candidates.length > 1) {
    die(
      [
        `Ambiguous ${kind}: ${target}`,
        `Candidates (${candidates.length}):`,
        ...candidates.map((symbol) => `  - ${symbolLabel(symbol)} @${symbol.line}`),
        "Provide a more specific target.",
      ].join("\n"),
      2,
    );
  }
  return candidates[0]?.line ?? null;
}

export function resolvePythonTarget(lm, target) {
  const explicitLine = target.startsWith("line:");
  if (explicitLine || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(target)) {
    const n = Number(explicitLine ? target.slice("line:".length) : target);
    if (!Number.isInteger(n) || n < 1 || n > lm.lineCount) {
      die(`Invalid line: ${target} (expected an integer from 1 to ${lm.lineCount})`, 2);
    }
    return n;
  }

  if (target.includes(".")) {
    const parts = target.split(".");
    if (parts.length !== 2 || parts.some((part) => !part)) die(`Invalid target: ${target}`, 2);
    const [cls, meth] = parts;
    return resolveUnique(
      "target",
      target,
      lm.symbols.filter((symbol) => symbol.kind === "method" && symbol.className === cls && symbol.name === meth),
    );
  }

  return resolveUnique("target", target, lm.symbols.filter((symbol) => symbol.name === target));
}

export function resolvePythonClass(lm, className) {
  return resolveUnique(
    "class",
    className,
    lm.symbols.filter((symbol) => symbol.kind === "class" && symbol.name === className),
  );
}
