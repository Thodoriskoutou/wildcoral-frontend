# AGENTS.md (wildcoral-frontend)

SvelteKit storefront for the Wild Coral Medusa backend (package `@dtc/storefront`; the backend is a separate project, `wildcoral-backend`): SvelteKit 3 (pre-release), Svelte 5, Tailwind v4, shadcn-svelte registry components.

## Commands

The package manager is pnpm (`pnpm-lock.yaml`).

```bash
<pm> run dev                  # dev server, http://localhost:5173
<pm> run check                # svelte-kit sync + svelte-check (this app's "lint")
<pm> run build                # vite build; needs the MEDUSA_* env vars, see below
```

The app has no test suite and no lint script.

## Configuration

- The SvelteKit config is inline in `vite.config.ts` (there is no `svelte.config.js`): adapter, `compilerOptions.experimental.async`, `kit.experimental.remoteFunctions` and the `#lib` alias.
- The adapter is `@sveltejs/adapter-auto`, which only detects a few hosts. For a Docker or Node host switch to `adapter-node`; its output goes to `build/`.
- Environment variables are declared and validated in `src/env.ts`. There is no `PUBLIC_` prefix: a variable is public because it has `public: true`. A new variable means editing `src/env.ts` and `.env.example`.
- `MEDUSA_BACKEND_URL` and `MEDUSA_PUBLISHABLE_KEY` are required, and validation also runs during `vite build`, so a build without them fails. The build also prerenders a remote function against the backend; with the backend down it logs a non-fatal "Failed to prerender" error.
- Put values in `.env` (copy `.env.example`).

## Conventions

- Data loading uses remote functions from `sveltekit-medusa-sdk`, called directly in components (`await getProductQuery(...)` inside `$derived`). There are no `+page.server.ts` load functions. The Medusa client is configured only in `src/hooks.server.ts`.
- Use the `*Query` variants (`getProductQuery`, `getProductsQuery`, `getProductCategoryQuery`, `getCollectionQuery`) for anything that has translated text. The `prerender` variants (`getProduct`, `getCollection`, ...) are cached by their arguments alone, so a visitor would get the other language's text.
- `src/lib/components/ui/` holds this project's own copies of registry components. Edit them freely. Theming goes through the tokens in `src/routes/layout.css`.
- Style: tabs and single quotes. Match the file you are editing.

## Languages (English and Greek)

- English is the default and has no URL prefix; Greek lives under `/el`. `src/hooks.ts` (`reroute`) strips the prefix, so every route file exists once. The language comes from the prefix, else the `locale` cookie, and `?lang=el` switches it.
- All of it is in `src/lib/i18n/`. Write page text in English inside `t('...')` and internal links as `l('/path')`; `src/lib/i18n/el.ts` holds the Greek, keyed by the English text. `t('Context::text')` separates two meanings of one English text, and `t('{count} item|{count} items', { count })` is a plural. Never call `t()` or `l()` at module level (outside a function): on the server it would run once, for no particular visitor. Mark such texts with `msg('...')` and translate them where they are drawn.
- `pnpm run check:i18n` lists the English texts that have no Greek and the Greek that is no longer used. Run it after changing any visible text.
- The locale of a request reaches the Medusa client through the `x-medusa-locale` header (set in `src/hooks.server.ts`), so Medusa returns translated products, categories and options. Medusa metadata is not translated: a product page reads `<key>_el` before `<key>`. Settings in `src/lib/site.ts` typed `Localized` take `{ en, el }`.
- Journal posts (content plugin, no languages) live in one collection per language: Greek posts are in `journal-el` with the original slug plus `-el` (`src/lib/medusa/journal.ts`, `site.journalCollections`).
- Seeds: `seed:translations` (catalog texts), `seed:journal` (also the Greek posts). Backend side (in the `wildcoral-backend` project): the `translation` feature flag and module in `apps/backend/medusa-config.ts`, described in `apps/backend/docs/languages.md`.

## Dependencies

- pnpm's `node_modules` is strict: every package a file imports must be declared in `package.json`. npm's hoisting used to hide missing declarations here: `@medusajs/types`, `embla-carousel`, `medusa-js-sdk` and `qs` were undeclared and are now `devDependencies` (the first three are only imported with `import type`; `qs` is named in `optimizeDeps.include` in `vite.config.ts`).
- Add packages with `<pm> add <pkg>`. Never run `npm install` here: it would create a second lockfile.
- `pnpm-workspace.yaml` only holds pnpm settings (which dependencies may run install scripts); this folder is a single project.
- Registry components added with `npx shadcn-svelte@latest add ...` can import more undeclared packages. Run `check` afterwards and declare whatever it reports as missing.

## Seed scripts

`scripts/seed/*.ts` create data in the connected Medusa backend (catalog, translations, shipping, journal, demo orders, test customers) and need admin credentials for a real run. `seed:customers` refuses a backend that is not on this computer. They are documented in `scripts/seed/README.md`, which writes `npm run seed:...`; use `<pm> run seed:...` instead. Always run the `:dry` variant first, and treat a real run as a data-changing operation on the user's backend.

## Off-Limits

- `.svelte-kit/` and `build/` are generated output.
- `.env` holds secrets: never commit, print or copy values out of it. Document variables in `.env.example`.
