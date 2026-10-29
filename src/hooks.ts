import type { Reroute } from '@sveltejs/kit/hooks';
import { stripLocale } from '#lib/i18n/path.js';

/**
 * `/el/shop` is the same page as `/shop`, just in Greek: the route files stay where they are and the
 * language prefix is removed before a route is looked up. The address in the browser keeps its prefix.
 */
export const reroute: Reroute = ({ url }) => stripLocale(url.pathname);
