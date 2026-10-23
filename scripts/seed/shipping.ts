/**
 * Sets up shipping in Medusa so checkout can offer delivery: a stock location in Athens, the zones
 * you ship to, and the delivery options from ./shipping-catalog.ts.
 *
 *   npm run seed:shipping:dry     # shows the plan, sends nothing, needs no login
 *   npm run seed:shipping         # creates it
 *
 * Safe to re-run: a location, fulfillment set, zone or option that already exists (matched by name)
 * is left alone, so you can also use a re-run to fill in something a first run couldn't finish.
 * Everything it creates can be edited or deleted in the admin (Settings → Locations & Shipping).
 * Your login comes from environment variables in your own terminal, never from a file.
 */
import type Medusa from '@medusajs/js-sdk';
import { shipping } from './shipping-catalog.ts';
import { say, explain, connect } from './common.ts';

const DRY_RUN = process.argv.includes('--dry-run');

type Row = Record<string, any>;

// ---------------------------------------------------------------------------------------------
// Plan + validation (no network)
// ---------------------------------------------------------------------------------------------

function validate(): string[] {
	const problems: string[] = [];
	const { location, zones } = shipping;
	if (!location.name.trim()) problems.push('The location needs a name.');
	if (!/^[A-Za-z]{2}$/.test(location.address.country_code)) problems.push('The location address needs a two-letter country_code (e.g. GR).');
	if (!location.address.address_1.trim() || !location.address.city.trim()) problems.push('The location address needs address_1 and city.');
	const zoneNames = new Set<string>();
	for (const z of zones) {
		if (zoneNames.has(z.name)) problems.push(`Zone "${z.name}" is listed twice.`);
		zoneNames.add(z.name);
		if (!z.countries.length) problems.push(`Zone "${z.name}" has no countries.`);
		for (const c of z.countries) if (!/^[a-z]{2}$/.test(c)) problems.push(`Zone "${z.name}": "${c}" is not a lowercase two-letter country code.`);
		if (!z.options.length) problems.push(`Zone "${z.name}" has no delivery options.`);
		const optionNames = new Set<string>();
		for (const o of z.options) {
			if (optionNames.has(o.name)) problems.push(`Zone "${z.name}": option "${o.name}" is listed twice.`);
			optionNames.add(o.name);
			if (!(o.price >= 0)) problems.push(`"${o.name}": price must be 0 or more.`);
			if (!/^[a-z0-9-]+$/.test(o.code)) problems.push(`"${o.name}": code must be lowercase letters, numbers and hyphens.`);
		}
	}
	return problems;
}

const euro = (n: number) => (n === 0 ? 'free' : `€${n.toFixed(2)}`);

function printPlan() {
	const { location, zones } = shipping;
	const a = location.address;
	say(`Location: ${location.name} — ${a.address_1}, ${a.postal_code} ${a.city}, ${a.country_code.toUpperCase()}  (placeholder address: edit in shipping-catalog.ts)`);
	say(`Linked to sales channel "${shipping.salesChannel}", fulfillment: ${shipping.providerId} (you pack and post orders yourself)\n`);
	for (const z of zones) {
		say(`Zone "${z.name}" (${z.countries.length === 1 ? z.countries[0].toUpperCase() : `${z.countries.length} countries`})`);
		for (const o of z.options) say(`   • ${o.name}: ${euro(o.price)}, ${o.description}`);
	}
	say();
}

// ---------------------------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------------------------

const LOCATION_FIELDS = 'id,name,*fulfillment_sets,*fulfillment_sets.service_zones,*sales_channels,*fulfillment_providers';

async function seed(sdk: Medusa) {
	// --- what already exists in the store ----------------------------------------------------
	const { regions } = await sdk.admin.region.list({ limit: 100, fields: 'id,name,currency_code,*countries' });
	const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === 'gr')) ?? regions[0];
	if (!region) throw new Error('The store has no region. Create one in Settings → Regions (currency EUR, country Greece) and run this again.');
	const currency = region.currency_code;
	const regionCountries = new Set((region.countries ?? []).map((c) => String(c.iso_2)));
	say(`Region: ${region.name} (${currency.toUpperCase()}), ${regionCountries.size} countr${regionCountries.size === 1 ? 'y' : 'ies'}`);

	const { sales_channels } = await sdk.admin.salesChannel.list({ limit: 100 });
	const channel =
		sales_channels.find((c) => c.name.toLowerCase() === shipping.salesChannel.toLowerCase()) ?? (sales_channels.length === 1 ? sales_channels[0] : undefined);
	if (!channel) {
		throw new Error(`No sales channel named "${shipping.salesChannel}". Found: ${sales_channels.map((c) => c.name).join(', ') || '(none)'}. Set salesChannel in scripts/seed/shipping-catalog.ts.`);
	}

	const { shipping_profiles } = await sdk.admin.shippingProfile.list({ limit: 100 });
	let profile = shipping_profiles.find((p) => p.type === 'default') ?? shipping_profiles[0];
	if (!profile) {
		profile = (await sdk.admin.shippingProfile.create({ name: 'Default Shipping Profile', type: 'default' })).shipping_profile;
		say('Shipping profile "Default Shipping Profile": created');
	}

	const { fulfillment_providers } = await sdk.admin.fulfillmentProvider.list({ limit: 50 });
	if (!fulfillment_providers.some((p) => p.id === shipping.providerId)) {
		throw new Error(
			`The fulfillment provider "${shipping.providerId}" isn't available on your Medusa. Available: ${fulfillment_providers.map((p) => p.id).join(', ') || '(none)'}. ` +
				'Set providerId in scripts/seed/shipping-catalog.ts.'
		);
	}

	// --- location ----------------------------------------------------------------------------
	const listLocations = async () => (await sdk.admin.stockLocation.list({ limit: 100, fields: LOCATION_FIELDS })).stock_locations as Row[];
	const findLocation = async () => (await listLocations()).find((l) => l.name === shipping.location.name);

	let location = await findLocation();
	if (location) {
		say(`Location "${shipping.location.name}": exists`);
	} else {
		const others = await listLocations();
		if (others.length) say(`(You already have ${others.length} location${others.length > 1 ? 's' : ''}: ${others.map((l) => l.name).join(', ')}. Adding "${shipping.location.name}" as well.)`);
		const a = shipping.location.address;
		await sdk.admin.stockLocation.create({
			name: shipping.location.name,
			address: { address_1: a.address_1, city: a.city, postal_code: a.postal_code, country_code: a.country_code, ...(a.phone ? { phone: a.phone } : {}) }
		});
		location = await findLocation();
		if (!location) throw new Error('The location was created but could not be found again.');
		say(`Location "${shipping.location.name}": created`);
	}
	const locationId = String(location.id);
	const refresh = async () => (await sdk.admin.stockLocation.retrieve(locationId, { fields: LOCATION_FIELDS })).stock_location as Row;

	// --- links: sales channel + fulfillment provider ------------------------------------------
	if (!(location.sales_channels ?? []).some((c: Row) => c.id === channel.id)) {
		await sdk.admin.stockLocation.updateSalesChannels(locationId, { add: [channel.id] });
		say(`Linked to sales channel "${channel.name}"`);
	}
	if (!(location.fulfillment_providers ?? []).some((p: Row) => p.id === shipping.providerId)) {
		await sdk.admin.stockLocation.updateFulfillmentProviders(locationId, { add: [shipping.providerId] });
		say(`Linked fulfillment provider ${shipping.providerId}`);
	}

	// --- fulfillment set ---------------------------------------------------------------------
	let current = await refresh();
	let set = (current.fulfillment_sets ?? []).find((s: Row) => s.name === shipping.fulfillmentSetName);
	if (!set) {
		await sdk.admin.stockLocation.createFulfillmentSet(locationId, { name: shipping.fulfillmentSetName, type: 'shipping' });
		current = await refresh();
		set = (current.fulfillment_sets ?? []).find((s: Row) => s.name === shipping.fulfillmentSetName);
		if (!set) throw new Error('The fulfillment set was created but could not be found again.');
		say(`Fulfillment set "${shipping.fulfillmentSetName}": created`);
	}
	say();

	// --- zones + options ---------------------------------------------------------------------
	const { shipping_options: existingOptions } = await sdk.admin.shippingOption.list({ limit: 200, fields: 'id,name,service_zone_id' });

	const created: string[] = [];
	const skipped: string[] = [];
	const failed: { name: string; error: string }[] = [];

	for (const z of shipping.zones) {
		let zone = (set.service_zones ?? []).find((s: Row) => s.name === z.name);
		if (!zone) {
			await sdk.admin.fulfillmentSet.createServiceZone(String(set.id), {
				name: z.name,
				geo_zones: z.countries.map((country_code) => ({ type: 'country' as const, country_code }))
			});
			current = await refresh();
			set = (current.fulfillment_sets ?? []).find((s: Row) => s.name === shipping.fulfillmentSetName)!;
			zone = (set.service_zones ?? []).find((s: Row) => s.name === z.name);
			if (!zone) throw new Error(`Zone "${z.name}" was created but could not be found again.`);
			say(`Zone "${z.name}": created (${z.countries.length} countr${z.countries.length === 1 ? 'y' : 'ies'})`);
		} else {
			say(`Zone "${z.name}": exists`);
		}

		for (const o of z.options) {
			const label = `${o.name} (${z.name})`;
			if (existingOptions.some((e) => e.name === o.name && (!e.service_zone_id || e.service_zone_id === zone.id))) {
				say(`   - ${o.name}: already exists, skipped`);
				skipped.push(label);
				continue;
			}
			try {
				await sdk.admin.shippingOption.create({
					name: o.name,
					service_zone_id: String(zone.id),
					shipping_profile_id: profile.id,
					provider_id: shipping.providerId,
					price_type: 'flat',
					type: { label: o.label, description: o.description, code: o.code },
					// Priced for the currency and for the region, as Medusa's own admin does.
					prices: [
						{ currency_code: currency, amount: o.price },
						{ region_id: region.id, amount: o.price }
					],
					// Show it in the storefront, and not as a return option.
					rules: [
						{ attribute: 'enabled_in_store', operator: 'eq', value: 'true' },
						{ attribute: 'is_return', operator: 'eq', value: 'false' }
					]
				});
				say(`   - ${o.name}: created (${euro(o.price)})`);
				created.push(label);
			} catch (e) {
				say(`   - ${o.name}: ✗ failed: ${explain(e)}`);
				failed.push({ name: label, error: explain(e) });
			}
		}
	}

	// --- report ------------------------------------------------------------------------------
	say('\n──────── Done ────────');
	say(`Created: ${created.length}${created.length ? ' — ' + created.join(', ') : ''}`);
	if (skipped.length) say(`Skipped (already there): ${skipped.join(', ')}`);
	if (failed.length) {
		say(`Failed: ${failed.length}`);
		for (const f of failed) say(`  • ${f.name}: ${f.error}`);
	}

	for (const z of shipping.zones) {
		const inRegion = z.countries.filter((c) => regionCountries.has(c)).length;
		if (inRegion === z.countries.length) continue;
		const which = z.countries.length === 1 ? `its country (${z.countries[0].toUpperCase()}) is` : `${inRegion === 0 ? 'none' : `only ${inRegion}`} of its ${z.countries.length} countries ${inRegion === 1 ? 'is' : 'are'}`;
		say(
			`\nNote: for the "${z.name}" zone, ${which} in your region "${region.name}", so ` +
				`${inRegion === 0 ? `"${z.name}" delivery won't appear at checkout yet` : `"${z.name}" delivery is only offered to those`}. ` +
				'To sell to the rest, add the countries at Settings → Regions.'
		);
	}
	if (!failed.length) {
		say('\nTry it: add a product to the cart, go to checkout and enter an address in Athens. Standard and Express delivery should appear.');
		say('Replace the placeholder street address of the location (Settings → Locations & Shipping) with your own.');
	}
	if (failed.length) process.exitCode = 1;
}

// ---------------------------------------------------------------------------------------------

printPlan();

const problems = validate();
if (problems.length) {
	console.error('Fix these first:');
	for (const p of problems) console.error(`  ✗ ${p}`);
	process.exit(1);
}

if (DRY_RUN) {
	say('Dry run: the shipping catalog looks good and nothing was sent to Medusa.');
} else {
	const sdk = await connect();
	// Finish by setting `process.exitCode` (not `process.exit()`), which can crash Node on Windows while connections close.
	try {
		await seed(sdk);
	} catch (e) {
		console.error(`\n✗ Could not finish: ${explain(e)}\n`);
		process.exitCode = 1;
	}
}
