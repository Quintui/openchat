# Plan: Update all dependencies to latest, fix lint/type errors, pin nitro

## Repository
`Quintui/openchat` (checkout `/workspace/openchat`, branch `factory/item-47dfa65c-b44f-4950-a789-5319503c0d26`, single commit `78f7645` on main).

## Goal
Every entry in `package.json` `dependencies`/`devDependencies` is at its current npm `latest`, `bun.lock` is regenerated to match, `nitro` is declared with an exact version (no `^`, `~`, `latest`, or tag), and on that dependency set: `biome lint` and `biome check` exit 0, `tsc --noEmit` exits 0, `vitest run` passes (or reports no tests, without error), `vite build` succeeds, and the dev server (and built preview) serve the chat UI at `/` without runtime errors.

## Scope
**In:** `package.json`, `bun.lock`, `biome.json` (schema/version migration), `tsconfig.json` (if TS 7 needs it), `vite.config.ts`, and any `src/**` code needed to fix lint/type/runtime breakage from the upgrades. Fixing the lint errors that already exist on main (lint currently fails with 28 errors / 20 warnings) is in scope, since "lint passes" is a done criterion. Adding a `typecheck` script.
**Out:** feature changes, refactors unrelated to upgrade breakage, regenerating shadcn/ai-elements components wholesale, switching package manager, CI setup. Slack screenshot is posted by the builder/orchestrator after the app runs, not part of the code change.

## Baseline facts (verified 2026-11-22)
- Package manager: **bun** (`bun.lock`, `.cta.json` `"packageManager": "bun"`). `bun` is not on PATH and global npm install fails (permissions), but `npx -y bun@latest` works (bun 1.4.5). Use `npx -y bun@latest <cmd>` everywhere below.
- `node_modules` is not installed.
- `nitro` is currently `"npm:nitro-nightly@latest"` (lock resolves `nitro-nightly@3.0.1-20260206-093501-a25fb9ef`). Official `nitro` package `latest` = `3.0.261103-rc` (published 2026-11-03).
- No `typecheck` script exists; no test files exist under `src`.
- Latest versions (npm `latest` tag), current → target. Major bumps marked **M**:
  - @ai-sdk/react ^3.0.79 → 4.0.183 **M**; ai ^6.0.77 → 7.0.179 **M**
  - @mastra/core ^1.2.0 → 1.85.0; @mastra/ai-sdk → 1.12.0; @mastra/libsql → 1.31.1; @mastra/loggers → 1.3.11; @mastra/memory → 1.41.2; @mastra/observability → 1.24.2; mastra → 1.40.1
  - @base-ui/react → 1.9.0; @fontsource-variable/geist → 5.3.0; @hugeicons/core-free-icons 3.1.1 → 4.4.0 **M**; @hugeicons/react → 1.1.10
  - @radix-ui/react-use-controllable-state → 1.3.0
  - @streamdown/cjk → 1.0.5; @streamdown/code 1.0.1 → 2.0.1 **M**; @streamdown/math → 1.0.4; @streamdown/mermaid → 1.0.4; streamdown → 2.8.0
  - @tailwindcss/vite, tailwindcss → 4.3.5
  - @tanstack/react-devtools 0.7 → 0.10.15; @tanstack/devtools-vite 0.3 → 0.8.7 (0.x minor = breaking)
  - @tanstack/react-query(+devtools) → 5.108.2; react-router → 1.170.46; react-router-devtools → 1.167.4; react-router-ssr-query → 1.167.3; react-start → 1.169.7 (**peer `vite >=8`**); router-plugin → 1.169.0
  - exa-js → 2.29.0; lucide-react 0.563 → 1.77.0 **M**; motion 12 → 14.14.0 **M**; nanoid 5 → 6.0.2 **M**; shadcn 3 → 4.23.0 **M**
  - react, react-dom → 19.3.1; @types/react, @types/react-dom → 19.3.0
  - sonner → 2.0.8; tailwind-merge → 3.7.1; use-stick-to-bottom → 1.1.6; vite-tsconfig-paths → 6.1.1; zod → 4.6.7
  - unchanged: class-variance-authority 0.7.1, clsx 2.1.1, cmdk 1.1.1, next-themes 0.4.6, tw-animate-css 1.4.0, babel-plugin-react-compiler 1.0.0
  - dev: @biomejs/biome 2.2.4 → 2.6.8; @testing-library/dom → 10.4.2; @testing-library/react → 16.3.3; @types/node 22 → 26.6.6 **M**; @vitejs/plugin-react 5 → 6.3.0 **M** (peer `vite ^8`); jsdom 27 → 31.0.1 **M**; typescript 5.7 → 7.0.2 **M** (native port); vite 7 → 8.3.8 **M**; vitest 3 → 5.1.1 **M**; web-vitals 5 → 6.2.3 **M**
- Peer constraints are mutually satisfiable at latest (vite 8 is accepted by every vite plugin; @mastra/* require core ≥1.83; @ai-sdk/react accepts react ^19.2.1).

## Phases

### Phase 1 — Bump versions, pin nitro, install
1. Edit `package.json`: set every dependency to `^<latest>` per the table above (keep caret style the repo uses; keep `@biomejs/biome` exact, as today, at `2.6.8`). Set `"zod": "^4.6.7"`.
2. Pin nitro exactly: `"nitro": "3.0.261103-rc"` (official package, no `npm:` alias, no range). Re-run `npm view <pkg> version` for every package right before editing in case `latest` moved; use whatever is latest at that moment.
3. Add script `"typecheck": "tsc --noEmit"`.
4. `rm -rf node_modules bun.lock && npx -y bun@latest install` (regenerate lock from scratch so no stale transitive pins, e.g. the old nitro-nightly). Resolve any peer warnings that indicate a real mismatch.
**Verify:** `grep '"nitro"' package.json` shows `"3.0.261103-rc"` exactly; `grep -c nitro-nightly bun.lock` is 0; `node -e` loop comparing `require('./node_modules/<pkg>/package.json').version` with `npm view <pkg> version` reports no mismatches.

### Phase 2 — Tooling config migrations
1. Biome: `npx biome migrate --write` (updates `$schema` to 2.6.8 and any renamed options in `biome.json`).
2. TypeScript 7: run `npx tsc --noEmit`. TS 7 removes deprecated options; expect to delete `"baseUrl": "."` from `tsconfig.json` (`paths` with `./src/*` resolves relative to the tsconfig without it). Fix any other removed/renamed options it reports. `types: ["vite/client"]` must still resolve with vite 8.
3. Vite 8 / plugin-react 6: `@vitejs/plugin-react` 6 dropped the built-in `babel` option. Keep the React Compiler working using the mechanism its README documents (expected: add `@rolldown/plugin-babel` at latest as a devDependency and pass `babel-plugin-react-compiler` through it, or the `reactCompilerPreset` helper if exported). Check the plugin's README in `node_modules/@vitejs/plugin-react/README.md` and follow it exactly.
4. `vite.config.ts`: apply lint fix `"url"` → `"node:url"`; confirm `nitro/vite` export still exists in nitro 3.0.261103-rc and that `@tanstack/devtools-vite`'s `devtools()` and `tanstackStart()` signatures are unchanged (check their type defs); keep plugin order unless docs require otherwise.
**Verify:** `npx -y bun@latest run typecheck` runs (errors in `src` are OK at this point, config errors are not); `npx biome check` runs without config errors.

### Phase 3 — Fix type errors from library upgrades
Run `npx -y bun@latest run typecheck` and fix every error, likely areas:
- **ai v7 / @ai-sdk/react v4**: imports in `src/components/chat-interface.tsx` (`useChat`, `DefaultChatTransport`), `src/types/ui-message.ts` (`UIMessage`), `src/components/ai-elements/{attachments,message,prompt-input}.tsx` (`FileUIPart`, `SourceDocumentUIPart`, `ChatStatus`), `src/lib/chat-utils.ts`, `src/components/chat-prompt-composer.tsx`, `src/lib/chat-helpers.ts` (`UIMessageStreamWriter`), `src/routes/api/chat.ts` (`createUIMessageStream`, `createUIMessageStreamResponse`, `handleChatStream` from `@mastra/ai-sdk`). Consult the ai v7 migration guide (ai-sdk.dev docs) and the installed `.d.ts` for renamed types/options. Ensure `@mastra/ai-sdk`'s stream type matches `ai` v7's writer (`writer.merge`); @mastra/ai-sdk 1.12 ships provider-v7 deps, so v7 is supported.
- **@mastra/core 1.85**: `src/mastra/**`, `src/server/{threads,messages,memory}.ts`, `src/lib/chat-helpers.ts` (`MastraMemory`, `StorageThreadType`, `getThreadById`, `createThread`), observability config in `src/mastra/index.ts`. Use the `mastra` skill / embedded docs in `node_modules/@mastra/*/dist/docs` to confirm current APIs.
- **lucide-react 1.x**: icon renames/removals (imports in app-sidebar, chat-interface, ai-elements/*, copy-button, regenerate-button, chat-prompt-composer). Replace removed names with their documented successors.
- **motion 14**: `motion/react` imports in `chat-interface.tsx` and `ai-elements/shimmer.tsx` (`motion.create`, `MotionProps`, `AnimatePresence`).
- **@hugeicons/core-free-icons 4, @streamdown/code 2, streamdown 2.8, nanoid 6, @tanstack/*** : fix whatever typecheck reports. `src/routeTree.gen.ts` is regenerated by the router plugin on dev/build — regenerate rather than hand-edit.
- `src/components/ui/**` (shadcn) — fix minimally; do not re-scaffold.
Fix properly (no `any`, `@ts-ignore`, or casts to hide errors).
**Verify:** `npx -y bun@latest run typecheck` exits 0.

### Phase 4 — Lint/format clean
1. `npx biome check --write` (safe fixes: import protocol, unused imports, `import type`, formatting, organize imports).
2. Manually fix the remaining non-autofixable diagnostics. Known pre-existing ones: `src/hooks/use-theme.tsx` (`useExhaustiveDependencies` at ~67/138/150, `noDangerouslySetInnerHtml` at ~212, `noExplicitAny` at ~256), `noNonNullAssertion` in `src/lib/date-utils.ts:49,54` and `src/lib/chat-helpers.ts:42`. Fix the code properly (e.g. narrow instead of `!`; correct hook deps). For `noDangerouslySetInnerHtml` on the theme anti-FOUC inline script (intentional, static content), use a targeted `// biome-ignore lint/security/noDangerouslySetInnerHtml: <reason>` comment — that is the documented pattern for an intentional inline script. Also fix any new rules introduced by biome 2.6.
3. Re-run typecheck after lint fixes.
**Verify:** `npx -y bun@latest run lint` and `npx -y bun@latest run check` exit 0 with 0 errors; typecheck still exits 0.

### Phase 5 — Build, test, run
1. `npx -y bun@latest run build` — must succeed (vite 8 + nitro output in `.output/`).
2. `npx -y bun@latest run test` — vitest 5 with no test files exits non-zero by default; if so, add `--passWithNoTests` to the `test` script (do not invent tests).
3. Runtime: copy `.env.example` → `.env` (placeholder keys are fine for page load), start `npx -y bun@latest run dev` in background on port 3000, confirm `curl`/node fetch of `http://localhost:3000/` returns 200 with the app HTML and the dev server log shows no errors; open it in a browser (use `factory_sandbox_port_url` for port 3000) and confirm the chat UI renders (sidebar, composer) with no console errors; take the preview screenshot for the Slack thread. Also run the built server (`node .output/server/index.mjs`) and confirm `/` returns 200. If a real `ANTHROPIC_API_KEY` is available, send one message to confirm streaming works; otherwise verify `/api/chat` responds (auth error from provider is acceptable, a crash/500 from our code is not).
4. Do not commit `.env`, `mastra.db`, `.output/`.
**Verify:** all of the above pass; `git status` shows only intended files changed.

## Risks
- **ai v7 / @ai-sdk/react v4 breaking changes** — largest code-impact risk (stream/transport/type renames). Mitigation: rely on typecheck + migration guide; manually exercise chat in Phase 5.
- **@mastra/ai-sdk ↔ ai v7 compatibility** — if `handleChatStream` output doesn't type-check with ai v7's writer, check @mastra/ai-sdk docs for a v7-specific export/option before any workaround. If genuinely incompatible, record it and stay on the newest `ai` major that @mastra/ai-sdk supports (document in PR).
- **Vite 8 (rolldown) + React Compiler** — plugin-react 6 changed how babel plugins are wired; verify the compiler is actually active (e.g. build output or React DevTools "Memo ✨" badge) rather than silently dropped.
- **TypeScript 7 (native)** — removed options (`baseUrl`) and possibly different `tsc` behavior; if TS 7 can't typecheck due to a tool limitation (not a code error), document it.
- **nitro rc vs nightly** — switching from `nitro-nightly` to the official `3.0.261103-rc` could regress something the nightly had. If build/runtime fails specifically due to nitro, fall back to pinning `"nitro": "npm:nitro-nightly@3.0.1-20261120-203731-571aade6"` (exact) and record why.
- **lucide-react 1.0 icon removals** (brand icons removed) — `GitBranch*` etc. should exist; replace any removed ones.
- **vitest 5 / jsdom 31** — no tests exist, so only the script exit code matters.

## Assumptions
- "Latest" = npm `latest` dist-tag at build time, including major bumps (not just in-range updates). Caret ranges are kept for everything except nitro (exact) and biome (already exact).
- nitro is pinned to the official `nitro` package's `latest` (`3.0.261103-rc`) rather than an exact nightly — it is the "latest" stable channel, matches what TanStack Start docs use, and avoids a moving nightly alias. Fallback described in Risks.
- Package manager stays bun (lockfile + `.cta.json`); run via `npx -y bun@latest` since bun isn't installed globally. AGENTS.md's `npm install` text is generic Mastra boilerplate and is not changed.
- Pre-existing lint errors on main are fixed as part of this card because "lint passes" is a done criterion.
- A `typecheck` script (`tsc --noEmit`) is added so the done criterion is runnable; `test` gets `--passWithNoTests` only if vitest fails on zero tests.
- Targeted `biome-ignore` is acceptable only for the intentional inline theme script; all other diagnostics are fixed in code.
- `.agents/skills` content and `src/routeTree.gen.ts` hand edits are out of scope (routeTree is regenerated).

## Open questions
None.
