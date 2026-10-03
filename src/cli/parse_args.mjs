export function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = Object.fromEntries(
    rest
      .filter((arg) => arg.startsWith("--"))
      .map((arg) => {
        const [key, value] = arg.slice(2).split("=");
        return [key, value ?? true];
      }),
  );
  const pos = rest.filter((arg) => !arg.startsWith("--"));
  return { cmd, flags, pos };
}

