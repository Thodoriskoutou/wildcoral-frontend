import { browser } from '$app/env';
import { loadWishlist, setWishlisted, type WishlistSnapshot } from './wishlist.remote';

/**
 * The visitor's saved products, shared by every heart button and the account page so they agree.
 *
 * Browser only. This object lives at module level, so on the server it would be shared by every
 * visitor; nothing here runs during server rendering (the methods return early unless in the browser).
 * The hearts simply appear filled a moment after the page loads.
 */
class Wishlist {
	signedIn = $state(false);
	ids = $state<string[]>([]);
	loaded = $state(false);
	/** Product currently being saved/removed, to disable its button meanwhile. */
	busy = $state<string | null>(null);

	private apply(s: WishlistSnapshot) {
		this.signedIn = s.signedIn;
		this.ids = s.productIds;
		this.loaded = true;
	}

	has(productId: string) {
		return this.ids.includes(productId);
	}

	private inflight: Promise<void> | null = null;

	/**
	 * Reads the wishlist from Medusa. Several hearts asking at once share one request.
	 * Call with `force` after signing in or out.
	 */
	load(force = false): Promise<void> {
		if (!browser) return Promise.resolve();
		if (this.loaded && !force && this.signedIn) return Promise.resolve();
		this.inflight ??= (async () => {
			try {
				this.apply(await loadWishlist());
			} catch {
				// Medusa unreachable or the plugin isn't installed: hearts stay empty, saving reports the error.
				this.loaded = true;
			} finally {
				this.inflight = null;
			}
		})();
		return this.inflight;
	}

	/** Toggles a product. Resolves to what happened so the caller can react (e.g. ask the visitor to sign in). */
	toggle(productId: string) {
		return this.set(productId, !this.has(productId));
	}

	/** Saves (`true`) or removes (`false`) a product. */
	async set(productId: string, saved: boolean): Promise<'saved' | 'removed' | 'needs-login' | 'error'> {
		if (!browser || this.busy) return 'error';
		this.busy = productId;
		try {
			const snapshot = await setWishlisted({ productId, saved });
			this.apply(snapshot);
			if (!snapshot.signedIn) return 'needs-login';
			return snapshot.productIds.includes(productId) ? 'saved' : 'removed';
		} catch {
			return 'error';
		} finally {
			this.busy = null;
		}
	}
}

export const wishlist = new Wishlist();
