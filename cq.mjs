#!/usr/bin/env node
/**
 * cq — Context Compiler (Build Week MVP)
 *
 * Commands:
 *   node cq.mjs compile <srcDir> --task="..." [--out=.cq] [--budget=12000] [--exclude=tests,docs] [--level=L2]
 *   node cq.mjs index   <srcDir> [--level=L0|L2] [--exclude=tests,docs]
 *   node cq.mjs expand  <srcDir> <file> <ClassName>
 *   node cq.mjs slice   <srcDir> <file> <target|Class.method|line>
 */
import { parseArgs } from "./src/cli/parse_args.mjs";
import { die } from "./src/util/die.mjs";
import { help } from "./src/cli/commands/help.mjs";
import { compileCommand } from "./src/cli/commands/compile.mjs";
import { inspectCommand } from "./src/cli/commands/inspect.mjs";
import { indexCommand } from "./src/cli/commands/index.mjs";
import { expandCommand } from "./src/cli/commands/expand.mjs";
import { sliceCommand } from "./src/cli/commands/slice.mjs";

const { cmd, flags, pos } = parseArgs(process.argv.slice(2));

if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
  help();
} else if (cmd === "compile") {
  compileCommand({ pos, flags });
} else if (cmd === "inspect") {
  inspectCommand({ pos, flags });
} else if (cmd === "index") {
  indexCommand({ pos, flags });
} else if (cmd === "expand") {
  expandCommand({ pos, flags });
} else if (cmd === "slice") {
  sliceCommand({ pos, flags });
} else {
  die(`Unknown command: ${cmd}\n\nRun: node cq.mjs --help`, 2);
}
