import { query } from '$app/server';
import * as v from 'valibot';
import { getMedusaContext } from 'sveltekit-medusa-sdk/server';
import { fetchOrders } from './orders.server';
import { toOrderView, type OrderView } from './order-tracking';

/** The signed-in customer's orders, shaped for the account pages (see `orders.server.ts`). */

/** All of the customer's orders, newest first. Fails (401) when nobody is signed in. */
export const getMyOrders = query(async (): Promise<OrderView[]> => {
	const orders = await fetchOrders(getMedusaContext());
	return orders.map(toOrderView).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

/** One of the customer's orders, or `null` when it doesn't exist or belongs to someone else. */
export const getMyOrder = query(v.pipe(v.string(), v.nonEmpty()), async (id): Promise<OrderView | null> => {
	const order = (await fetchOrders(getMedusaContext(), id)).find((o) => o.id === id);
	return order ? toOrderView(order) : null;
});
