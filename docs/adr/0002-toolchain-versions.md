# 2. Toolchain versions for the JS workspace

Date: 2026-09-26 · Status: accepted

## Context
Latest releases at scaffold time: TypeScript 7.0, ESLint 10.11, Vitest 5.0.2, pnpm 12.6.

- `typescript-eslint` 8.x supports TypeScript `<6.1`.
- `eslint-config-next` 16 depends on `eslint-plugin-react` 7.37, which crashes under ESLint 10 (`detectReactVersion` via removed context APIs).
- pnpm 12 refuses packages younger than its minimum release age (Vitest 5.0.2 was one day old) and denies dependency build scripts unless allowed.

## Decision
- TypeScript `~6.0.3`, ESLint `^9.39` (flat config), Vitest pinned to `5.0.1`.
- Keep pnpm's release-age policy on; pick an older version rather than adding exclusions.
- `allowBuilds` in `pnpm-workspace.yaml` lists every dependency build script explicitly (`unrs-resolver: false`, it ships prebuilt binaries).

## Consequences
Revisit when typescript-eslint supports TS 7 and the Next.js ESLint config supports ESLint 10. ESLint 9 prints a deprecation warning on install until then.
