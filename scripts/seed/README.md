# Seed Medusa with the Wild Coral catalog

Creates the categories, tags, products, variants (color × size), prices and photos from
`catalog.ts` in your Medusa store. Needs Node 22.18 or newer (you have it).

## 1. Look before you leap (no login, sends nothing)

```powershell
npm run seed:dry -- --price=120
```

Shows every product and variant it would create, and checks all the photo files exist.

## 2. Set your prices

Open `scripts/seed/catalog.ts` and set `defaultPrice` (or a `price` per product). The script
refuses to run without one, because I don't know your prices. To track stock, set `stock` to a
number per variant; `null` means Medusa doesn't track stock (everything shows "in stock").

## 3. Run it for real

Your login stays in your own terminal window; it is never written to a file.

**Best: a Secret API key** (revocable, so delete it when you're done).
In the Medusa admin: Settings → Secret API Keys → Create. Then:

```powershell
$env:MEDUSA_ADMIN_API_KEY = "paste-the-key-here"
npm run seed
Remove-Item Env:MEDUSA_ADMIN_API_KEY
```

**Or your admin email and password:**

```powershell
$env:MEDUSA_ADMIN_EMAIL = "you@example.com"
$env:MEDUSA_ADMIN_PASSWORD = "your-password"
npm run seed
Remove-Item Env:MEDUSA_ADMIN_PASSWORD
```

The backend URL is read from the project's `.env` (`MEDUSA_BACKEND_URL`).

## Photos for each color (variants)

Each color's photos are attached to that color's variants in Medusa (Products → the product → a variant →
Media). The site uses this: choosing a color shows that color's photos, and a card in the shop switches to
the color you hover or click, and the product page shows only the chosen color's photos. This needs **Medusa 2.11.2 or newer**; on an older one the script says so
and carries on (the products themselves are still created).

- In `catalog.ts`, `colorPhotos` says which photos show which color (see Sequin Ring Bikini and Rose Bikini).
  A product with a single color needs nothing: all its photos go to that color. The color assignments
  for the two multi-color products are my reading of the pictures, so check them.
- **Products you already created** don't need deleting. Run `npm run seed` again: existing products are
  not duplicated, their photos are not uploaded again, but each color's photos are attached to its
  variants. Running it again changes nothing more.
- **Two separate things get set.** Medusa keeps a variant's *photos* (Media section of the variant) and its
  *thumbnail* (the small picture in the variant list of the admin, and what the site falls back on) apart,
  and attaching photos does not set the thumbnail. The script does both.
- **How it finds your photos among a product's images:** first by the file name inside the image's
  address, and if the storage renamed the uploads, by comparing the picture itself with the file on disk.
- **How it finds a color's variants:** by their SKU, and also by their color value (so it still works if
  you edited SKUs, or the option is called "Colors" instead of "Color").
- **Anything it can't do is listed at the end** ("Photos that need attention") and the run exits with an
  error, instead of passing quietly. Typical cases: a photo that isn't among the product's images, or a
  color that exists in Medusa but not in `catalog.ts` (for example one you added by hand in the admin).
  For that last one, add it to the product's `colors` (with the SKU code you used) and to `colorPhotos`,
  then run again; what is already attached is left alone.
- `npm run seed:dry` shows how many photos each color gets.

## Options

| Flag | Effect |
| --- | --- |
| `--price=120` | Use this EUR price for every product this run |
| `--stock=5` | Track stock and set 5 units per variant (needs a stock location) |
| `--only=rose-bikini,copper-chain-bikini` | Only these products (by handle) |
| `--dry-run` | Same as `npm run seed:dry` |
| `--no-variant-images` | Create products only; don't attach photos to variants |

## Good to know

- **Safe to run again.** A product whose handle already exists is not created again (existing categories and
  tags are reused), but its color photos are attached to its variants if they aren't yet. To redo a product
  completely, delete it in the admin first.
- Products go into the **Default Sales Channel** (change `settings.salesChannel` if yours differs)
  and the default shipping profile.
- Missing categories are created. The catalog uses **Bikinis** and **One Pieces**; edit the
  `category` of each product if you'd rather use your existing ones.
- If you set stock, the script tells you when your stock location isn't linked to the sales channel
  (Settings → Locations & Shipping → the location → Sales channels). Stock won't show on the site
  until it is.
- `videos` in the catalog uploads video files and stores them in the product's metadata for the
  site to play. Uploading video through Medusa hasn't been tested; if it fails, the script says so
  and carries on.
- After it finishes, reload the site: products appear on `/shop` and the home page immediately.

---

# Shipping: a stock location in Athens and delivery options

Checkout can't offer delivery until Medusa has a stock location, a place you ship to (a "service zone")
and at least one shipping option. This creates them, with starter values for a small shop in Athens.

## Run it

Same login as above (`MEDUSA_ADMIN_API_KEY` in your terminal), then:

```powershell
npm run seed:shipping:dry
```

Shows what it would create and sends nothing. Then:

```powershell
npm run seed:shipping
```

Safe to run again: anything that already exists (matched by name) is left alone. Everything it creates
can be edited or deleted in the admin under **Settings → Locations & Shipping**.

## What it creates

| What | Details |
| --- | --- |
| **Location** "Wild Coral Athens" | Linked to the Default Sales Channel and the manual fulfillment provider (you pack and post orders yourself and record the shipment in the admin) |
| **Zone "Greece"** | **Standard delivery** €4.50 (2–4 working days) and **Express delivery** €8.00 (next working day to Athens and Thessaloniki, 1–2 elsewhere on the mainland) |
| **Zone "European Union"** | The other 26 EU countries: **Standard delivery (EU)** €12.00 (5–8 working days) |

**Check these before you go live:** the prices and delivery times are typical starter values, not quotes
from any courier, and the location's street address (`Ermou 12`) is a placeholder. Edit them in
`shipping-catalog.ts` before running, or later in the admin. They are VAT-inclusive euro amounts.

## Good to know

- **EU zone only works for countries in your region.** Checkout offers a zone's options only to
  countries that are in your Medusa region. If your region has just Greece, add the other countries at
  Settings → Regions (the script tells you how many are missing).
- **Free shipping over an amount** isn't set up. Add it in the admin on the shipping option's prices, or tell
  me the amount and I'll add it once it's confirmed to work on your Medusa version.
- Stock is separate: the location exists now, so you can set stock per variant in the admin (Inventory)
  or start tracking it in `catalog.ts` for new products.

---

# Journal (blog posts) with the content plugin

Your Medusa has `medusa-plugin-content`. This sets up the Journal in it and adds five starter posts.
The site's `/journal` pages read from it (collection slug: `journal`, set in `src/lib/site.ts`).

## Run it

Same login as above (`MEDUSA_ADMIN_API_KEY` in your terminal), then:

```powershell
npm run seed:journal:dry
```

Shows the collection, fields, author and posts, and checks the cover photos exist (sends nothing).

```powershell
npm run seed:journal
```

Creates the posts as **drafts**. Open **Content → Journal** in the Medusa admin, read them over
(they are general style notes and guides, not claims about your products), edit anything, and set
each one to **Published**. Or create them already published:

```powershell
npm run seed:journal -- --publish
```

Safe to run again: an existing collection, field, author or post is left alone.

## What it creates

- **Collection** `journal` (Markdown) with these fields, which appear when you edit a post:
  `excerpt`, `cover_image` (a URL, e.g. `/photos/IMG_0421.jpeg` for a file in `static/photos`),
  `category`, `featured` (tick one post to make it the big hero), `products` (product handles,
  comma-separated, for the "Shop the Story" strip; empty = newest products).
- **Author** "Wild Coral" (shown under each article; add more in Content → Creators).
- **Posts** from `journal-catalog.ts`, each with tags.

## Adding posts yourself

In the admin: Content → Journal → create an item. Write the body in Markdown (headings with `##`,
quotes with `>`, lists with `-`, images with `![](url)`). Set the status to Published. If you leave
`excerpt` or `cover_image` empty the site uses the first paragraph and the first image in the post.

## Greek posts

The content plugin has no languages, so the Greek posts live in a second collection, `journal-el`
(`journalCollections` in `src/lib/site.ts`). `npm run seed:journal` creates both: the English posts in
`journal`, and their Greek versions from `journal-catalog-el.ts` in `journal-el`.

A Greek post has the slug of the English one plus `-el` (`finding-your-fit` becomes
`finding-your-fit-el`), because the plugin looks a post up by its slug alone and two collections
can't share one. The site's addresses don't change (`/el/journal/finding-your-fit`), the language
switch lands on the translation, and a post without a Greek version shows in English. To translate a
post yourself: Content → Journal (Ελληνικά) → create an item with the English slug plus `-el` and the
same custom fields.

---

# Greek and English: the shop's own texts

The site is in English and Greek (Greek addresses start with `/el`). The texts of the pages
themselves are in `src/lib/i18n/el.ts`; `npm run check:i18n` lists any that are missing. What lives in
Medusa (categories, products, options, colors, tags, delivery options, return reasons) is translated
with Medusa's Translation module, which needs the backend's `translation` feature flag and module
(`apps/backend/medusa-config.ts`, then `db:migrate`) and Medusa 2.12 or newer.

```powershell
npm run seed:translations:dry
```

Shows what it would translate (no login, sends nothing).

```powershell
npm run seed:translations
```

Same login as above. Adds Greek to the store's languages and fills in the Greek texts from
`translations-catalog.ts` (products and categories are found by handle and name, so edit the English
side only if you renamed them). Safe to run again: translations that match are left alone, changed ones
are updated. Edit or add more later in the admin under Settings → Translations; anything missing
simply shows in English.

Text that Medusa can't translate (a product's `metadata`, like the "Story" or "Care Instructions" text) is
written once per language: add the same key with a `_el` ending (`care_el`) and the Greek page
uses it, falling back to the English key.

---

# Customer accounts and order tracking

Nothing to install: the pages are already wired to Medusa's customers.

- **Sign up** (`/account` → "Create an Account") creates the customer in Medusa. It shows up in the
  admin under **Customers**, with the first and last name typed on the form. Passwords need 8+ characters.
- **Sign in / sign out / forgot password** all run against Medusa.
- **Orders** (`/account#orders`) lists the signed-in customer's orders. The site-menu **Track Order** link
  opens `/order-track` for guest tracking; signed-in visitors are redirected back to this account list.
  Each opens `/account/orders/<id>`: a progress line, tracking number, items, totals and delivery address.
  Customers only ever see their own orders.

## What the customer sees, and what moves it

| In the Medusa admin (Orders → open the order) | On the site |
| --- | --- |
| Order placed and paid | **Being prepared** |
| **Create fulfillment** (items packed) | **Packed, leaving soon** |
| **Mark as shipped** (Create shipment) | **On its way** |
| **Mark as delivered** | **Delivered** |
| **Cancel order** | **Canceled** |

## Tracking numbers: one extra step

Medusa's public Store API does not hand out the tracking number you type into "Create shipment", so the
site can't read it from there. Instead, add it to the order's **Metadata** (the Metadata box on the order
page in the admin):

| Key | Value | Required |
| --- | --- | --- |
| `tracking_number` | e.g. `GR123456789EL` | yes |
| `tracking_url` | the courier's tracking link (`https://…`) | optional (adds a "Track parcel" button) |
| `carrier` | e.g. `ELTA Courier` | optional (shown as a label) |

If a customer adds a gift message or picks eco packaging in the cart, the site saves them as `gift_message`
and `eco_packaging`; when Medusa carries those over to the order they show under "Extras" on the tracking page.

## Seeing it without any orders

- **`/account/preview`** (only while developing; it 404s on the live site) draws the order list and
  tracking page from four made-up orders: being prepared, on its way, delivered and canceled.
- **Real demo data in Medusa**, a demo customer with three orders at different stages:

  ```powershell
  npm run seed:demo-orders:dry          # shows the plan, sends nothing
  $env:DEMO_CUSTOMER_PASSWORD = "choose-a-password"   # 8+ characters, your choice
  $env:MEDUSA_ADMIN_API_KEY = "paste-the-key-here"    # optional: lets it ship and deliver orders 2 and 3
  npm run seed:demo-orders              # asks you to type YES first
  Remove-Item Env:DEMO_CUSTOMER_PASSWORD, Env:MEDUSA_ADMIN_API_KEY
  ```

  Then sign in on the site as `demo.customer@example.com` (or set `DEMO_CUSTOMER_EMAIL`).
  **Medusa can't delete orders, only cancel them**, so run this on a test store or plan to cancel the
  three orders afterwards (Orders → open one → ⋯ → Cancel order). They are marked `demo_order` in
  their metadata. Run `npm run seed:shipping` first: the orders need a delivery option and a stock
  location. It buys real in-stock variants with the manual payment provider, so stock drops a
  little and nothing is charged. Without the admin key only the first order is created; ship the others
  by hand using the table above.

- **Two customers with something for staff to do** (data deletion and a return):

  ```powershell
  npm run seed:customers:dry            # shows the plan, sends nothing
  $env:MEDUSA_ADMIN_API_KEY = "paste-the-key-here"    # needed: orders must be delivered before they can be returned
  npm run seed:customers                # asks you to type YES first
  Remove-Item Env:MEDUSA_ADMIN_API_KEY
  ```

  `deletion.customer@example.com` has a delivered order and a pending request to delete their personal
  data (admin → **Data requests**: approve or reject it). `return.customer@example.com` has a delivered
  order of two items and a filed return of the first (open that order in the admin: **Customer return
  requests**). Both are made through the backend's Store API, as a storefront page would; the site
  itself has no screens for them yet.

  It only runs against a backend on your own computer (the orders can't be deleted again), and uses
  `SEED_CUSTOMER_PASSWORD` as the customers' password, or a fixed local one (`LOCAL_PASSWORD` in
  `customers.ts`) when you don't set it. Safe to run again: nothing that exists is created twice.

## Reviews and wishlist (Medusa plugins)

The site uses two plugins that are already installed in your Medusa:

- **`@lambdacurry/medusa-product-reviews`** for reviews.
- **`@rsc-labs/medusa-wishlist`** for the wishlist.

### Reviews

- Each product page has a **Reviews** section: average rating, how many reviews per star, the reviews
  (sortable, filter by clicking a star row), your reply if you wrote one, and the star rating under the
  product name. The star rating is also added to the page's search-engine data, but only when real
  approved reviews exist.
- **Who can review:** only a signed-in customer who bought the piece and whose order has been
  **shipped or delivered**. (The plugin ties a review to an order item.) They can edit their review later.
  From an order's page, "Review this piece" jumps to the form.
- **Moderation is your choice.** By default the plugin publishes reviews immediately. To approve each one
  first, set `defaultReviewStatus: 'pending'` in the plugin's options in your Medusa `medusa-config.ts`
  and restart Medusa. The plugin's admin page then lets you approve, flag or reply to reviews. The site
  tells the customer which of the two happened.
- The site has its own review code because the SDK's built-in review functions talk to a *different*
  plugin's routes and don't work with this one.
- **Not built:** photos in reviews (the plugin's upload route has no sign-in check, so anyone could upload
  files to your storage) and star ratings on the product cards in the shop.

### Wishlist

- The heart / "Save for Later" button on a product page saves it to the customer's wishlist in Medusa.
  A signed-out visitor who taps it is taken to the sign-in window. Saved pieces are listed under
  **Wishlist** on the account page, where they can be removed.
- **A bug in the wishlist plugin (version 0.0.6), and how the site avoids it.** When adding an item, the
  plugin looks for an existing item with the same "variant id" across *all customers'* wishlists, not
  just the current customer's. With real variant ids, the second customer to save the same piece would
  silently change the first customer's item and get nothing saved. So the site stores its own key,
  `wl:<customer id>:<product id>`, in that field (the real product id is stored as usual). If you look at
  the wishlist table in the database you will see those keys; that is why. It is worth reporting to the
  plugin's authors.
- **Sharing a wishlist by link is not built.** The plugin can create share links, but it decodes them
  without checking a signature, so anyone could forge a link for any customer id. Better fixed in the
  plugin first.

## Good to know

- **Guest orders aren't linked to accounts.** An order placed without signing in stays a guest order,
  even if the same email signs up later, so it won't appear in that account.
- **Forgot password needs email.** Medusa only emits a "password reset" event; your backend needs its SMTP
  notification provider and a small subscriber that emails the customer a link like
  `https://your-site/?auth=reset&token=<token>`. Until then the form works but no email arrives.
- **Checkout can't place real orders yet.** Only the manual payment provider is enabled on your Medusa
  region, so the storefront checkout says "We can't take payments on the website just yet". Enable Stripe on the region (and set
  `STRIPE_KEY` in `.env`) and orders placed at checkout will appear here automatically.

---

# Product page text (what you write in Medusa)

The wireframe came with sample paragraphs about fabrics, craftsmanship and sustainability. None of it was
about your products, so it is gone. Product pages now show **only what you enter in Medusa**, and a section
with nothing entered is simply not shown.

In the Medusa admin, open **Products → the product → Metadata** and add any of these keys (all optional):

| Key | Where it shows | Example |
| --- | --- | --- |
| `story` | "In the Details" photo band: a few sentences about the piece | *(your words)* |
| `coverage`, `support`, `best_for`, `style_note` | "Perfect Fit Concierge" → The Silhouette (each one that is filled in) | *(your words)* |
| `fit_note` | Under the Add to Bag button, and in the Fit Guide | *(your words)* |
| `composition` | "Materials & Care" → Composition. If empty, the product's **Material** field (Attributes box) is used | *(your words)* |
| `sustainability` | "Materials & Care" → Sustainability | *(your words)* |
| `care` | "Materials & Care" → Care Instructions (a new line per instruction) | *(your words)* |

Only write what is true for that piece. Claims such as recycled materials, where something is made, or
UV protection need to be accurate for the specific product.

**Size chart.** Fill in `sizeChart` in `src/lib/site.ts` (one row per size, your own body measurements, in
`sizeChartUnit`). It appears in the size guide pop-up and under "The Fit Guide". While it is empty, no table is
shown and customers are asked to write to you.

**Shop page.** The line under the heading is `shopIntro` in `site.ts`, or the category's own **Description**
(Products → Categories) when you have written one. The "Delivery" note at the bottom is `deliveryNote` in `site.ts`.

**Photos on the site.** The editorial photo on /shop, the "In the Details" fallback photo and the other photos
are set in the `photos` list in `site.ts` (files live in `static/photos`). The "In the Details" band uses the
product's own second photo when it has one.

The `/system` and `/components` pages (design-system samples) now only exist while developing.

---

# Shop filters

The filter panel on /shop is built from your actual catalogue, so nothing is hard-coded: the **sizes**, **colors**
and **styles** (your product tags) it offers are the ones your products have, each with a count of how many
pieces you'd get, and a choice that would leave nothing is greyed out. The **price** slider spans your lowest
to highest price (it isn't shown while every product costs the same). **In stock only** checks the exact
color and size combination, so "Gold, size M, in stock" only matches a piece that really has a Gold M you can buy.

- **Sort:** Featured, Newest, Price low to high / high to low, Name A–Z.
- Chosen filters appear as removable chips under the toolbar, with "Clear all".
- Everything is kept in the address (for example `/shop?size=S,M&color=Gold&style=sequin&max=150&instock=1&sort=price-asc`),
  so a filtered view can be shared and the back button works.
- Cards show the photo of the color you filtered on or hovered, and open the product page on that color.
- **Style** uses the tags on your products (Products → the product → Tags); add or rename tags in the admin
  and the filter follows.

---

# Contact page

`/contact` has a message form and your contact details. Every "Contact Us" link on the site opens it, and some
open it ready to fill in: from an order ("Contact us about this order") the topic is "My order" with the order
number filled in, and "Ask us about sizing" on a product page picks "Sizing & fit" and names the piece. A
signed-in customer's name and email are filled in for them.

## Your details

In `src/lib/site.ts`: `contactEmail`, `phone`, `address`, `supportHours` and the `social` links. Whatever is
empty is simply not shown.

## Making the contact form and guest tracking send email

Email delivery is configured entirely in the Medusa backend's SMTP Notification Module. The storefront has no
mail-provider credentials. Add these public Store API routes in the backend, validate every request again there,
and rate-limit them by IP and recipient:

| Route | Request body | Required backend behavior |
| --- | --- | --- |
| `POST /store/contact` | `name`, `email`, `topic`, `order`, `message` | Send the `contact-message` notification to the configured support recipient. Set the visitor email as `reply_to`. |
| `POST /store/guest-order-tracking/lookup` | `email`, `order_number` | Find orders server-side using normalized email and Medusa's displayed order number. Return `{ order_id }` only on a match; return `email_has_no_orders` when the email has none and `order_not_owned` when the number is not one of its orders. |
| `POST /store/guest-order-tracking/send-code` | `email`, `order_number`, `code` | Repeat the ownership check, then send the `guest-order-tracking-code` notification. Do not create or validate OTP state in Medusa. |

The `contact-message` template receives the contact fields and should use `email` as reply-to. The
`guest-order-tracking-code` template receives `code`, `order_number`, and an expiry of ten minutes (or the value of
`GUEST_ORDER_TRACKING_OTP_TTL_SECONDS`). Configure the sender and support recipient in the backend SMTP provider.

The storefront creates a six-digit code, stores only its hash, permits five attempts and up to three sends per
email/IP window, and asks Medusa only to deliver it. Its challenges and verified guest sessions are process-local:
they expire after `GUEST_ORDER_TRACKING_OTP_TTL_SECONDS` (default `600`), are lost after a restart, and require a
single storefront replica. A verified guest session is represented by an opaque HttpOnly cookie; no order id is put
in the cookie.

The contact form retains a honeypot and a small storefront rate limit, but the backend limits are mandatory because
the Store API routes are public. If Medusa cannot deliver a message, the visitor keeps their form data and sees an
error.
