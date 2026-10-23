import { error } from '@sveltejs/kit';
import { dev } from '$app/env';

// A design-system showcase with sample content: it only exists while developing.
export const load = () => {
	if (!dev) error(404, 'Not found');
};
