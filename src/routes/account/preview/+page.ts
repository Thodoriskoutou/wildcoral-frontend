import { error } from '@sveltejs/kit';
import { dev } from '$app/env';

// A design aid with made-up orders: it only exists while developing.
export const load = () => {
	if (!dev) error(404, 'Not found');
};
