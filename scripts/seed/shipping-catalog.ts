/**
 * What the shipping seed tool sets up in Medusa: a stock location in Athens, the places you ship to
 * ("service zones") and the delivery options a customer picks at checkout.
 *
 * The prices and delivery times below are STARTER VALUES, typical for a small Greek online shop
 * shipping with a courier. They are not quotes from any courier: check them against what your courier
 * actually charges you, edit anything here before running, or change them later in the Medusa admin
 * (Settings → Locations & Shipping). Prices are in the currency of your region (EUR), VAT included.
 */

export interface OptionSpec {
	/** Shown to the customer at checkout. */
	name: string;
	/** Short label and the text under the name at checkout (delivery time). */
	label: string;
	description: string;
	/** Internal code, lowercase. */
	code: string;
	/** Price in euros. 0 = free. */
	price: number;
}

export interface ZoneSpec {
	name: string;
	/** Two-letter country codes this zone delivers to. */
	countries: string[];
	options: OptionSpec[];
}

const EU_WITHOUT_GREECE = [
	'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'hu', 'ie',
	'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se'
];

export const shipping = {
	/**
	 * Where your orders are packed and sent from. The street address below is a PLACEHOLDER in central
	 * Athens: put your real address here (it is what couriers and returns use).
	 */
	location: {
		name: 'Wild Coral Athens',
		address: {
			address_1: 'Ermou 12',
			city: 'Athens',
			postal_code: '105 63',
			country_code: 'GR',
			phone: ''
		}
	},

	/** The sales channel the location is linked to (the same one the product seed uses). */
	salesChannel: 'Default Sales Channel',

	/**
	 * Medusa's built-in "manual" fulfillment provider: you pack and post orders yourself and record the
	 * shipment in the admin. It needs no courier integration.
	 */
	providerId: 'manual_manual',

	/** Name of the fulfillment set (a group of zones) created at the location. */
	fulfillmentSetName: 'Wild Coral Athens delivery',

	zones: [
		{
			name: 'Greece',
			countries: ['gr'],
			options: [
				{
					name: 'Standard delivery',
					label: 'Standard',
					description: '2–4 working days across Greece. Islands can take a little longer.',
					code: 'standard',
					price: 4.5
				},
				{
					name: 'Express delivery',
					label: 'Express',
					description: 'Next working day to Athens and Thessaloniki, 1–2 working days elsewhere on the mainland.',
					code: 'express',
					price: 8
				}
			]
		},
		{
			name: 'European Union',
			countries: EU_WITHOUT_GREECE,
			options: [
				{
					name: 'Standard delivery (EU)',
					label: 'EU standard',
					description: '5–8 working days to other EU countries.',
					code: 'eu-standard',
					price: 12
				}
			]
		}
	] as ZoneSpec[]
};
