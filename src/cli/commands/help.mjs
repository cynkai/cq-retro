export function help() {
  process.stdout.write(
    [
      "cq — Context Compiler",
      "",
      "Commands:",
      "  compile <srcDir> --task=\"...\" [--out=.cq] [--budget=12000] [--exclude=tests,docs] [--level=L2]",
      "  inspect <srcDir> <file> <target|Class.method|line:NN>",
      "  index   <srcDir> [--level=L0|L2] [--exclude=tests,docs]",
      "  expand  <srcDir> <file> <ClassName>",
      "  slice   <srcDir> <file> <target|Class.method|line:NN>",
      "",
    ].join("\n"),
  );
}
