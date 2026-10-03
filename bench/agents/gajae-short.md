# Gajae-Code Agent Contract (short)

Bun-workspace TypeScript monorepo. Packages live in `packages/<pkg>` (`coding-agent` is the main CLI; also `ai`, `agent`, `tui`, `utils`).

## Verification

Never run `tsc`/`npx tsc` directly at repo root.

```sh
bun test packages/<pkg>/test/<file>.test.ts   # targeted tests — prefer this first
bun --cwd=packages/<pkg> run check            # targeted package typecheck
```

## Testing rules

Test externally observable contracts: behavior, output shape, state transitions, error mapping, regression-prone parsing boundaries.

Avoid placeholder tests, tautologies, broad `not.toThrow()` assertions, duplicated coverage, long-lived global mutations, and `mock.module()`. Prefer `vi.spyOn(...)` with cleanup.

## Changelog

Release notes are per-change fragments: add `packages/<pkg>/changelog.d/<slug>.md` with `### <Section>` blocks whose entries are `- ` bullets. Never edit `## [Unreleased]` in `packages/*/CHANGELOG.md` directly.

No `console.log`/`console.warn`/`console.error` in `packages/coding-agent/`; use the logger from `@gajae-code/pi-utils`.
