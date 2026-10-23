/**
 * Sample orders for /account/preview (development only). They are shaped like Medusa's Store API
 * responses and go through the same `toOrderView` as real orders, so what you see there is what a
 * customer sees, minus the network. Nothing here is sent to or read from Medusa.
 */
import { toOrderView, type OrderView, type RawOrder } from './order-tracking';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const photo = (name: string) => `/photos/${name}`;

const address = {
	first_name: 'Maria',
	last_name: 'Papadopoulou',
	address_1: '12 Ermou Street',
	address_2: 'Floor 3',
	postal_code: '10563',
	city: 'Athens',
	country_code: 'gr',
	province: null
};

const line = (id: string, title: string, variant: string, price: number, qty: number, thumb: string, handle: string) => ({
	id,
	title,
	product_title: title,
	variant_title: variant,
	product_handle: handle,
	quantity: qty,
	unit_price: price,
	total: price * qty,
	thumbnail: photo(thumb)
});

const sequin = line('it_1', 'Sequin Ring Bikini', 'Gold / S', 120, 1, 'IMG_1637.jpeg', 'sequin-ring-bikini');
const copper = line('it_2', 'Copper Chain Bikini', 'Copper / M', 98, 1, 'IMG_0317.jpeg', 'copper-chain-bikini');
const onePiece = line('it_3', 'Black Ring One Piece', 'Black / M', 168, 2, 'IMG_1763.jpeg', 'black-ring-one-piece');

const base = { currency_code: 'eur', email: 'maria@example.com', shipping_address: address, shipping_methods: [{ name: 'Standard shipping' }] };

export const sampleOrders: RawOrder[] = [
	{
		...base,
		id: 'sample_processing',
		display_id: 1043,
		created_at: daysAgo(0),
		status: 'pending',
		payment_status: 'captured',
		fulfillment_status: 'not_fulfilled',
		items: [sequin, copper],
		item_subtotal: 218,
		shipping_total: 5,
		discount_total: 0,
		tax_total: 0,
		total: 223,
		metadata: { gift_message: 'Happy birthday! Have a wonderful summer.', eco_packaging: true },
		fulfillments: []
	},
	{
		...base,
		id: 'sample_shipped',
		display_id: 1041,
		created_at: daysAgo(3),
		status: 'pending',
		payment_status: 'captured',
		fulfillment_status: 'shipped',
		items: [onePiece],
		item_subtotal: 336,
		shipping_total: 0,
		discount_total: 33.6,
		tax_total: 0,
		total: 302.4,
		// How the store owner adds tracking in practice: three metadata keys on the order in Medusa's admin.
		metadata: { tracking_number: 'GR123456789EL', tracking_url: 'https://example.com/track/GR123456789EL', carrier: 'ELTA Courier' },
		fulfillments: [{ shipped_at: daysAgo(1), delivered_at: null }]
	},
	{
		...base,
		id: 'sample_delivered',
		display_id: 1032,
		created_at: daysAgo(12),
		status: 'completed',
		payment_status: 'captured',
		fulfillment_status: 'delivered',
		items: [copper, sequin],
		item_subtotal: 218,
		shipping_total: 5,
		discount_total: 0,
		tax_total: 0,
		total: 223,
		metadata: null,
		fulfillments: [
			{
				shipped_at: daysAgo(10),
				delivered_at: daysAgo(7),
				labels: [{ tracking_number: 'GR987654321EL', tracking_url: 'https://example.com/track/GR987654321EL' }]
			}
		]
	},
	{
		...base,
		id: 'sample_canceled',
		display_id: 1029,
		created_at: daysAgo(20),
		status: 'canceled',
		payment_status: 'canceled',
		fulfillment_status: 'canceled',
		items: [copper],
		item_subtotal: 98,
		shipping_total: 5,
		discount_total: 0,
		tax_total: 0,
		total: 103,
		metadata: null,
		fulfillments: []
	}
];

export const sampleViews: OrderView[] = sampleOrders.map(toOrderView);
