# sveltekit-medusa-starter

A minimal [SvelteKit](https://svelte.dev/docs/kit) storefront for [Medusa v2](https://medusajs.com), built on [`sveltekit-medusa-sdk`](https://www.npmjs.com/package/sveltekit-medusa-sdk) and the [`sveltekit-medusa-ui`](https://pevey.com/sveltekit-medusa-ui) component registry.

Fork or clone it as the starting point for your own store. It is deliberately small — enough to show the full path from browsing to a completed order, and not much else.

> Looking for the Medusa v1 version? It is on the [`v1`](https://github.com/pevey/sveltekit-medusa-starter/tree/v1) branch.

## What's included

This copy of the starter carries the **Wild Coral** front end (ported from the `wireframe-sveltekit`
design): its header, mega menu, footer, typography and pages, running on live Medusa data. The
registry components in `src/lib/components/ui` still do the heavy lifting for checkout and sign-in;
they are re-themed through the design tokens in `src/routes/layout.css` (square corners, near-black
primary), so they match the rest of the site.

| Route                | What it does                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `/`                  | Home: hero, featured styles, "shop the look", new arrivals (newest Medusa products)             |
| `/shop`              | Product grid for all products; categories use `/category/<handle>` (menu links come from Medusa) |
| `/product/[handle]`  | Gallery, color/size options, live stock, add to cart, SEO metadata + JSON-LD                    |
| `/search`            | Full-page search using the Store API's `q` filter (no search plugin needed)                     |
| `/cart`              | Cart with quantity, remove and coupon codes                                                     |
| `/checkout`          | Region-driven checkout (Stripe or Braintree) inside the Wild Coral page chrome                  |
| `/checkout/return`   | Stripe redirect target; completes the order                                                     |
| `/success`           | Order confirmation, shown after checkout with the order that was just placed                    |
| `/account`           | Sign in / register, order history, profile, saved addresses                                     |
| `/journal`, `/customer-care`, `/components`, `/system` | Editorial and design-system pages from the wireframe (static content)         |
| `/category/[slug]`, `/collection/[slug]` | The starter's registry listings (unchanged)                                 |

Sign-in is also available as a dialog driven by `?auth=login`. Cart lives on its own `/cart` page; the header shows the item count.

**Medusa setup the storefront expects** — the publishable key needs a sales channel; products need
options titled `Color` and `Size` (swatch colors are looked up by name in `src/lib/medusa/catalog.ts`),
EUR prices, images, and stock at a location linked to the sales channel; the region needs Stripe (or
Braintree) enabled for `/checkout` to appear. Checkout shows a "payment is being set up" message
until then.

**Product videos** — Medusa's admin uploads images only, so videos are attached in the product's
*Metadata* (Products → product → Metadata): a `video` key holding an MP4/WebM URL, `video_2`,
`video_3`, … for more (or one `videos` key with several URLs separated by commas). URLs can be
absolute (a CDN) or site-relative (`/videos/clip.mp4`, from `static/videos/`). Videos come first in
the gallery and on shop/home cards, play muted and looping while on screen, and use the product's
photo as the poster. Always keep one still image as the product's *Thumbnail* — the cart, checkout
and search/social previews need it. Video URLs among a product's media are also detected
automatically (`src/lib/medusa/catalog.ts`).

## Requirements

- Node 20+
- A running Medusa v2 server with a publishable API key
- Optional: [`medusa-plugin-search`](https://pevey.com/medusa-plugin-search) for `/search`
- Optional: a Stripe account, and the Stripe provider enabled on your Medusa region, for `/checkout`

## Quick start

This is the storefront on its own; the Medusa backend is the separate `wildcoral-backend` project. Run everything with pnpm (never `npm install` here, it would create a second lockfile):

```bash
pnpm install
cp .env.example .env     # then fill in MEDUSA_BACKEND_URL and MEDUSA_PUBLISHABLE_KEY
pnpm run dev             # http://localhost:5173
```

## Environment variables

SvelteKit 3 replaced `$env/*` with explicit environment variables, so every var is declared and validated in [`src/env.ts`](src/env.ts). There is no `PUBLIC_` prefix — a var is public because it is marked `public: true` there. Private vars are imported from `$app/env/private`, public ones from `$app/env/public`.

Adding a new variable means adding it to `src/env.ts` as well as your `.env`.

| Variable                      | Required | Notes                                                    |
| ----------------------------- | -------- | -------------------------------------------------------- |
| `MEDUSA_BACKEND_URL`          | yes      | e.g. `http://localhost:9000`                             |
| `MEDUSA_PUBLISHABLE_KEY`      | yes      | Medusa admin → Settings → Publishable API keys           |
| `JOURNAL_CACHE_TTL_SECONDS`   | no       | Public journal cache lifetime; empty, `null`, or `0` disables it |
| `PRODUCT_CACHE_TTL_SECONDS`   | no       | Public catalog cache lifetime; empty, `null`, or `0` disables it |
| `CACHE_PURGE_TOKEN`           | no       | Bearer token for the cache-purge webhook endpoints        |
| `MEDUSA_DEFAULT_REGION_ID`    | no       | Pin a region instead of resolving one per visitor        |
| `MEDUSA_DEFAULT_COUNTRY_CODE` | no       | Used to pick the default region                          |
| `STRIPE_KEY`                  | no       | `pk_...`; `/checkout` shows a placeholder without it     |
| `STRIPE_REDIRECT_URL`         | no       | Absolute URL of your `/checkout/return` route            |
| `SITE_NAME`, `SITE_URL`       | no       | Used in the navbar, `<title>`, and Open Graph tags       |

The two Medusa vars are validated at boot — the app will refuse to start without them.

## Project layout

```
src/
├─ env.ts                  environment variable declarations
├─ hooks.server.ts         createMedusaHandle — the only Medusa config
├─ app.d.ts                App.Locals.medusa
├─ routes/
│  ├─ layout.css           Tailwind v4 entry + shadcn design tokens
│  ├─ +layout.svelte       ModeWatcher, MetaProvider, Navbar, Footer, Auth.Dialog
│  └─ …                    the pages listed above
└─ lib/
   ├─ utils.ts             cn() and shadcn helper types
   └─ components/
      ├─ Navbar.svelte     logo, search, theme, account, cart — yours to edit
      ├─ Footer.svelte     placeholder
      └─ ui/               registry components (see below)
```

`src/lib/components/ui/` holds **your copies** of registry components. They were installed by the shadcn-svelte CLI and are not a dependency — edit them freely. Nothing updates them behind your back.

## Data loading

There are no `+page.server.ts` load functions. The SDK exports [remote functions](https://svelte.dev/docs/kit/remote-functions) that components call directly:

```svelte
const product = $derived(await getProduct({ slug: page.params.slug }))
```

This works because `compilerOptions.experimental.async` and `kit.experimental.remoteFunctions` are enabled in [`vite.config.ts`](vite.config.ts). Wrap awaited data in `<svelte:boundary>` to control the loading and error states — every page here does.

`src/hooks.server.ts` configures the client once. Session, cart, region, and country resolution are handled by the SDK; see its docs for cookie names and other options.

## Adding more components

The registry has more than is installed here — FAQ accordions, review widgets, Braintree checkout, address autocomplete, alternate theme switchers, and so on:

```bash
npx shadcn-svelte@latest add https://pevey.com/r/faq.json
```

Browse the full list at [pevey.com/r/index.json](https://pevey.com/r/index.json).

Two notes:

- Run `npx svelte-kit sync` first if you have just run an install. Package managers prune the `node_modules/$app` directory that SvelteKit generates, and the CLI needs it to resolve `$app/tsconfig`.
- The `checkout` item ships Stripe **and** Braintree bodies together, which is why `sveltekit-braintree` is a dependency. Using only Stripe? Delete the `checkout-braintree-*.svelte` and `checkout-auto*.svelte` files, drop their exports from `src/lib/components/ui/checkout/index.ts`, and uninstall the package.

## Deployment

The app uses `@sveltejs/adapter-auto`, which detects a handful of hosts. For anything else, swap it in `vite.config.ts` for the adapter you need — `adapter-node`, `adapter-cloudflare`, `adapter-vercel`, etc.

### Docker

The Docker build prerenders `/customer-care`, so it must receive the Medusa configuration during the builder stage. Supply it as build arguments, then provide the same values (plus any runtime-only cache configuration) when starting the container:

```bash
docker build \
  --build-arg MEDUSA_BACKEND_URL="https://medusa.example.com" \
  --build-arg MEDUSA_PUBLISHABLE_KEY="pk_..." \
  -t wildcoral-storefront .

docker run --rm -p 3000:3000 \
  -e MEDUSA_BACKEND_URL="https://medusa.example.com" \
  -e MEDUSA_PUBLISHABLE_KEY="pk_..." \
  -e JOURNAL_CACHE_TTL_SECONDS=60 \
  -e PRODUCT_CACHE_TTL_SECONDS=60 \
  -e CACHE_PURGE_TOKEN="replace-with-a-long-random-token" \
  wildcoral-storefront
```

The in-process caches are single-replica only. Configure Medusa/content-plugin webhooks to `POST` to `/api/cache/purge/journal` for journal changes and `/api/cache/purge/products` for product, price, inventory, category, or collection changes, with `Authorization: Bearer <CACHE_PURGE_TOKEN>`.

## License

MIT
