/**
 * Creates a demo customer and three demo orders in Medusa, so the account page and order tracking
 * have something real to show:
 *
 *   1. "Being prepared"  – just placed, nothing sent yet
 *   2. "On its way"      – shipped, with a demo tracking number
 *   3. "Delivered"       – shipped and delivered
 *
 *   npm run seed:demo-orders:dry    # shows the plan, sends nothing, needs no login
 *   npm run seed:demo-orders        # asks you to type YES, then creates everything
 *
 * IMPORTANT: Medusa can't delete an order, only cancel it. These orders will show in your admin,
 * your order counts and your stock until you cancel them, so run this against a test store or be
 * ready to tidy up. Each one is marked `demo_order: true` in its metadata so it's easy to spot.
 *
 * Needs, in your own terminal (never in a file):
 *   DEMO_CUSTOMER_PASSWORD   password for the demo customer (8+ characters, you choose it)
 *   DEMO_CUSTOMER_EMAIL      optional, default demo.customer@example.com
 *   MEDUSA_ADMIN_API_KEY     optional. With it the script also ships and delivers orders 2 and 3.
 *                            Without it, only order 1 is created and the README says how to do the
 *                            rest in the admin. (MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD also work.)
 * The backend URL and publishable key are read from the project's .env.
 *
 * The orders are placed the way the storefront does it (cart → shipping → manual payment →
 * complete), so the region must have the "System (manual) payment" provider enabled.
 */
import readline from 'node:readline/promises';
import Medusa from '@medusajs/js-sdk';
import { say, fail, explain, envValue, backendUrl, hasAdminLogin, connect } from './common.ts';
import { PROVIDER, pickRegionAndVariants, placeOrder, ship } from './orders-common.ts';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const YES = argv.includes('--yes');
const MORE = argv.includes('--more');

const email = process.env.DEMO_CUSTOMER_EMAIL || 'demo.customer@example.com';
const password = process.env.DEMO_CUSTOMER_PASSWORD ?? '';

type Stage = 'processing' | 'shipped' | 'delivered';
const plan: { stage: Stage; title: string; lines: number; note: string }[] = [
	{ stage: 'processing', title: 'Being prepared', lines: 2, note: 'placed, nothing sent yet' },
	{ stage: 'shipped', title: 'On its way', lines: 1, note: 'shipped, with a demo tracking number' },
	{ stage: 'delivered', title: 'Delivered', lines: 1, note: 'shipped and delivered' }
];

const ADDRESS = { first_name: 'Demo', last_name: 'Customer', address_1: '12 Ermou Street', city: 'Athens', postal_code: '10563', phone: '+302100000000' };
const MARKER = { demo_order: 'true' };

function printPlan(adminAvailable: boolean) {
	say(`Demo customer: ${email}`);
	say('Orders to create:');
	for (const [i, p] of plan.entries()) {
		const needsAdmin = p.stage !== 'processing';
		say(`  ${i + 1}. ${p.title}: ${p.lines} item${p.lines > 1 ? 's' : ''}, ${p.note}${needsAdmin && !adminAvailable ? '  (needs an admin login; otherwise stays "being prepared")' : ''}`);
	}
	say(`Payment: manual (${PROVIDER}). Nothing is charged.\n`);
}

async function confirm() {
	if (YES) return;
	if (!process.stdin.isTTY) fail('Add --yes to confirm (this creates orders that can only be canceled, not deleted).');
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const answer = await rl.question('Medusa cannot delete orders, only cancel them. Type YES to create these demo orders: ');
	rl.close();
	if (answer.trim() !== 'YES') {
		say('Cancelled. Nothing was created.');
		process.exit(0);
	}
}

// ---------------------------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------------------------

async function signInDemoCustomer(store: Medusa) {
	let registered = false;
	try {
		const token = await store.auth.register('customer', 'emailpass', { email, password });
		if (typeof token !== 'string') throw new Error('Registration needs an extra step this script cannot do.');
		// A fresh identity has no customer yet: create it, exactly as the storefront's sign-up does.
		await store.store.customer.create({ email }, {}, { Authorization: `Bearer ${token}` });
		registered = true;
	} catch (e) {
		// "Identity already exists" is the normal re-run case; anything else surfaces at login below.
		say(`(sign-up skipped: ${explain(e)})`);
	}
	try {
		const token = await store.auth.login('customer', 'emailpass', { email, password });
		if (typeof token !== 'string') throw new Error('Login needs an extra step this script cannot do.');
	} catch (e) {
		throw new Error(`Could not sign the demo customer in: ${explain(e)}\nIf ${email} already exists with a different password, set DEMO_CUSTOMER_EMAIL to another address.`);
	}
	say(`Demo customer ${email}: ${registered ? 'created' : 'already existed'}, signed in`);
}

// ---------------------------------------------------------------------------------------------

const adminAvailable = hasAdminLogin();
printPlan(adminAvailable);

if (DRY_RUN) {
	say('Dry run: nothing was sent to Medusa.');
	process.exit(0);
}
if (password.length < 8) fail('Set DEMO_CUSTOMER_PASSWORD (8+ characters, your choice) in this terminal first. See scripts/seed/README.md.');

const publishableKey = envValue('MEDUSA_PUBLISHABLE_KEY');
if (!publishableKey) fail('MEDUSA_PUBLISHABLE_KEY is not set (it is normally in the project .env).');

await confirm();

const baseUrl = backendUrl();
const store = new Medusa({ baseUrl, publishableKey, auth: { type: 'jwt', jwtTokenStorageMethod: 'memory' } });
const admin = adminAvailable ? await connect() : null;

// From here on the script has open connections, so it finishes by setting `process.exitCode` and
// returning (not `process.exit()`, which can crash Node on Windows while sockets are still closing).
async function run() {
	await signInDemoCustomer(store);

	const existing = await store.store.order.list({ limit: 1 });
	if (existing.count > 0 && !MORE) {
		say(`\n${email} already has ${existing.count} order${existing.count > 1 ? 's' : ''}, so nothing new was created. Sign in to the site as that customer to see them.`);
		say('Run with --more to add another set anyway.');
		return;
	}

	const { region, country, picks } = await pickRegionAndVariants(store);
	const outcomes: string[] = [];
	let cursor = 0;

	for (const p of plan) {
		const variants = Array.from({ length: p.lines }, () => picks[cursor++ % picks.length]);
		try {
			const order = await placeOrder(store, region, country, variants.map((v) => v.id), { email, address: ADDRESS, metadata: MARKER });
			say(`Order #${order.display_id} placed: ${variants.map((v) => v.label).join(' + ')}`);
			let result = 'Being prepared';

			if (p.stage !== 'processing') {
				if (!admin) {
					outcomes.push(`#${order.display_id}: ${result} (no admin login, so it wasn't shipped)`);
					continue;
				}
				try {
					await ship(admin, order.id, order.display_id, p.stage === 'delivered', { trackingPrefix: 'DEMO', carrier: 'Demo Courier', metadata: MARKER });
					result = p.stage === 'delivered' ? 'Delivered' : 'On its way';
					say(`  → ${result}, tracking DEMO-${order.display_id}`);
				} catch (e) {
					say(`  ✗ placed, but couldn't ship it: ${explain(e)}`);
					result = 'Being prepared (shipping failed; do it in the admin)';
				}
			}
			outcomes.push(`#${order.display_id}: ${result}`);
		} catch (e) {
			say(`✗ ${p.title}: ${explain(e)}`);
			outcomes.push(`${p.title}: not created`);
		}
	}

	say('\n──────── Done ────────');
	for (const o of outcomes) say(`  ${o}`);
	say(`\nSign in on the site as ${email} (with the password you set) and open Account → Orders.`);
	say('To remove the demo orders later: Medusa admin → Orders → open one → ⋯ → Cancel order.');
	if (outcomes.some((o) => o.includes('not created'))) process.exitCode = 1;
}

try {
	await run();
} catch (e) {
	console.error(`\n✗ Could not finish: ${explain(e)}\n`);
	process.exitCode = 1;
}
