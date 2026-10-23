/**
 * Creates two customers on a test store, each in the middle of a request that staff have to handle,
 * so the account pages and the Medusa admin have something real to show:
 *
 *   1. A customer who wants their data deleted: has a delivered order and has asked to be
 *      forgotten (through the backend's deletion-request API). The request waits under Data
 *      requests in the admin, where staff approve or reject it.
 *   2. A customer who wants to return an item: has a delivered order of two items and has filed a
 *      return for one (right of withdrawal, refund). It shows on that order in the admin, under
 *      "Customer return requests".
 *
 *   pnpm run seed:customers:dry    # shows the plan, sends nothing, needs no login
 *   pnpm run seed:customers        # asks you to type YES, then creates everything
 *
 * Safe to run again: the customers, their orders, the deletion request and the return are only
 * created when they do not exist yet. The backend must run on this computer: Medusa can't delete
 * an order, only cancel it, so a real store would keep the test orders for good (pass
 * --allow-remote to override, then SEED_CUSTOMER_PASSWORD is required too).
 *
 * Needs, in your own terminal (never in a file):
 *   MEDUSA_ADMIN_API_KEY     a Secret API key (or MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD), to
 *                            ship and deliver the orders: only delivered orders can be returned
 *   SEED_CUSTOMER_PASSWORD   optional on a local backend (see LOCAL_PASSWORD below), required with
 *                            --allow-remote. 8+ characters, the password of both customers
 * The backend URL and publishable key are read from the project's .env.
 *
 * Needs the Wild Coral backend's returns and data-request features (the storefront has no screens
 * for them yet: the state shows in the Medusa admin and through the backend's Store API), and a
 * region with the manual payment provider (see scripts/seed/README.md).
 */
import readline from 'node:readline/promises';
import Medusa from '@medusajs/js-sdk';
import { say, fail, explain, envValue, backendUrl, isLocalBackend, hasAdminLogin, connect } from './common.ts';
import { pickRegionAndVariants, placeOrder, ship, type Address, type Variant } from './orders-common.ts';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const YES = argv.includes('--yes');
const ALLOW_REMOTE = argv.includes('--allow-remote');

/** The password of both customers on a local backend, so you can sign in as them right away. Never used elsewhere. */
const LOCAL_PASSWORD = 'wildcoral-local-1';
const password = process.env.SEED_CUSTOMER_PASSWORD || (isLocalBackend() ? LOCAL_PASSWORD : '');

const MARKER = { seed_customer: 'true' };

type Story = 'deletion' | 'return';

type Customer = {
	story: Story;
	email: string;
	first_name: string;
	last_name: string;
	address: Address;
	/** Items in the order. */
	lines: number;
	title: string;
	summary: string;
};

const customers: Customer[] = [
	{
		story: 'deletion',
		email: 'deletion.customer@example.com',
		first_name: 'Ελένη',
		last_name: 'Γεωργίου',
		address: { first_name: 'Ελένη', last_name: 'Γεωργίου', address_1: 'Ερμού 12', city: 'Αθήνα', postal_code: '10563', phone: '+302100000001' },
		lines: 1,
		title: 'Wants her data deleted',
		summary: 'one delivered order, and a pending request to delete her personal data'
	},
	{
		story: 'return',
		email: 'return.customer@example.com',
		first_name: 'Nikos',
		last_name: 'Dimitriou',
		address: { first_name: 'Nikos', last_name: 'Dimitriou', address_1: 'Tsimiski 45', city: 'Thessaloniki', postal_code: '54623', phone: '+302310000002' },
		lines: 2,
		title: 'Wants to return an item',
		summary: 'one delivered order of two items, and a filed return of the first one (withdrawal, refund)'
	}
];

/** What each customer writes in their request. */
const DELETION_NOTE = 'Θέλω να διαγραφούν τα προσωπικά μου στοιχεία, δεν θα ξαναψωνίσω από το κατάστημα.';
const RETURN_NOTE = 'The size is too small. I would like to send it back and get a refund.';

function printPlan() {
	const url = backendUrl();
	say(`Backend: ${url}${isLocalBackend() ? ' (this computer)' : '  (NOT local: a real run needs --allow-remote)'}`);
	say('Customers to create (same password for both):');
	for (const c of customers) say(`  ${c.email}\n    ${c.title}: ${c.summary}`);
	say('\nPayment: manual. Nothing is charged. Needs an admin login to ship and deliver the orders.\n');
}

async function confirm() {
	if (YES) return;
	if (!process.stdin.isTTY) fail('Add --yes to confirm (this creates orders that can only be canceled, not deleted).');
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const answer = await rl.question('Medusa cannot delete orders, only cancel them. Type YES to create these customers: ');
	rl.close();
	if (answer.trim() !== 'YES') {
		say('Cancelled. Nothing was created.');
		process.exit(0);
	}
}

// ---------------------------------------------------------------------------------------------
// One customer
// ---------------------------------------------------------------------------------------------

type Shop = { region: { id: string }; country: string; picks: Variant[] };

async function signIn(store: Medusa, c: Customer) {
	let created = false;
	try {
		const token = await store.auth.register('customer', 'emailpass', { email: c.email, password });
		if (typeof token !== 'string') throw new Error('Registration needs an extra step this script cannot do.');
		// A fresh identity has no customer yet: create it, exactly as the storefront's sign-up does.
		await store.store.customer.create({ email: c.email, first_name: c.first_name, last_name: c.last_name }, {}, { Authorization: `Bearer ${token}` });
		created = true;
	} catch (e) {
		// "Identity already exists" is the normal re-run case; anything else surfaces at login below.
		say(`  (sign-up skipped: ${explain(e)})`);
	}
	try {
		const token = await store.auth.login('customer', 'emailpass', { email: c.email, password });
		if (typeof token !== 'string') throw new Error('Login needs an extra step this script cannot do.');
	} catch (e) {
		throw new Error(`Could not sign ${c.email} in: ${explain(e)}\nIf the customer already exists with another password, set SEED_CUSTOMER_PASSWORD to it.`);
	}
	say(`  Customer ${created ? 'created' : 'already existed'}, signed in`);
}

/** The customer's order, delivered; placed (and shipped and delivered by an admin) when they have none. */
async function ensureDeliveredOrder(store: Medusa, admin: Medusa, shop: Shop, c: Customer, cursor: { next: number }) {
	const { orders } = await store.store.order.list({ limit: 1, fields: 'id,display_id,fulfillment_status' });
	let order = orders[0];
	if (order) {
		say(`  Order #${order.display_id} already existed (${order.fulfillment_status})`);
		return order;
	}

	const variants = Array.from({ length: c.lines }, () => shop.picks[cursor.next++ % shop.picks.length]);
	const placed = await placeOrder(store, shop.region, shop.country, variants.map((v) => v.id), { email: c.email, address: c.address, metadata: MARKER });
	say(`  Order #${placed.display_id} placed: ${variants.map((v) => v.label).join(' + ')}`);
	await ship(admin, placed.id, placed.display_id, true, { trackingPrefix: 'SEED', carrier: 'Demo Courier', metadata: MARKER });
	say('  → shipped and delivered');
	order = { ...placed, fulfillment_status: 'delivered' } as typeof order;
	return order;
}

type Request = { id: string; type: string; status: string };

async function requestDeletion(store: Medusa) {
	const res = await store.client.fetch<{ request: Request; already_requested: boolean }>('/store/customers/me/deletion-request', {
		method: 'POST',
		body: { note: DELETION_NOTE }
	});
	say(res.already_requested ? `  Deletion request already open (${res.request.status})` : `  Deletion request filed (${res.request.status})`);
}

type Eligibility = { eligibility: { can_return: boolean; items: { line_item_id: string; title: string; returnable_quantity: number }[] } };

async function fileReturn(store: Medusa, orderId: string) {
	const filed = await store.client.fetch<{ returns: unknown[] }>('/store/customer-returns', { query: { order_id: orderId } });
	if (filed.returns.length) {
		say(`  Return already filed (${filed.returns.length})`);
		return;
	}
	const { eligibility } = await store.client.fetch<Eligibility>(`/store/customer-returns/orders/${orderId}`);
	const item = eligibility.items.find((i) => i.returnable_quantity > 0);
	if (!eligibility.can_return || !item) throw new Error('Nothing in the order can be returned (is it delivered, and are the return reasons and the return shipping option set up?).');

	await store.client.fetch('/store/customer-returns', {
		method: 'POST',
		body: { order_id: orderId, remedy: 'refund', note: RETURN_NOTE, items: [{ line_item_id: item.line_item_id, quantity: 1, reason: 'withdrawal', note: RETURN_NOTE }] }
	});
	say(`  Return filed for "${item.title}" (withdrawal, refund)`);
}

// ---------------------------------------------------------------------------------------------

printPlan();

if (DRY_RUN) {
	say('Dry run: nothing was sent to Medusa.');
	process.exit(0);
}
if (!isLocalBackend() && !ALLOW_REMOTE) {
	fail(`${backendUrl()} is not a local backend. These test customers and their orders can't be removed again, so this tool refuses (--allow-remote overrides it).`);
}
if (password.length < 8) fail('Set SEED_CUSTOMER_PASSWORD (8+ characters, your choice) in this terminal first. See scripts/seed/README.md.');
if (!hasAdminLogin()) fail('Set MEDUSA_ADMIN_API_KEY (or MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD) in this terminal: orders must be shipped and delivered before they can be returned.');

const publishableKey = envValue('MEDUSA_PUBLISHABLE_KEY');
if (!publishableKey) fail('MEDUSA_PUBLISHABLE_KEY is not set (it is normally in the project .env).');

await confirm();

const admin = await connect();

// From here on the script has open connections, so it finishes by setting `process.exitCode` and
// returning (not `process.exit()`, which can crash Node on Windows while sockets are still closing).
async function run() {
	const baseUrl = backendUrl();
	const first = new Medusa({ baseUrl, publishableKey, auth: { type: 'jwt', jwtTokenStorageMethod: 'memory' } });
	const shop: Shop = await pickRegionAndVariants(first);
	const cursor = { next: 0 };
	const outcomes: string[] = [];

	for (const c of customers) {
		say(`${c.email}: ${c.title}`);
		try {
			// One client per customer, so each one's token stays apart.
			const store = new Medusa({ baseUrl, publishableKey, auth: { type: 'jwt', jwtTokenStorageMethod: 'memory' } });
			await signIn(store, c);
			const order = await ensureDeliveredOrder(store, admin, shop, c, cursor);
			if (c.story === 'deletion') await requestDeletion(store);
			else await fileReturn(store, order.id);
			outcomes.push(`${c.email}: ${c.title}, ready`);
		} catch (e) {
			say(`  ✗ ${explain(e)}`);
			outcomes.push(`${c.email}: not finished`);
		}
	}

	say('\n──────── Done ────────');
	for (const o of outcomes) say(`  ${o}`);
	say('\nSign in on the site as either customer to see their order (Account → Orders). In the Medusa admin:');
	say('  Data requests → the deletion request waits for approval or rejection;');
	say('  Orders → the order of the customer who returns → "Customer return requests" shows the return.');
	say('To tidy up: cancel the orders in the admin (Orders → open one → ⋯ → Cancel order).');
	if (outcomes.some((o) => o.includes('not finished'))) process.exitCode = 1;
}

try {
	await run();
} catch (e) {
	console.error(`\n✗ Could not finish: ${explain(e)}\n`);
	process.exitCode = 1;
}
