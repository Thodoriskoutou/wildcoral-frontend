import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			// `experimental.async` lets components `await` inside `$derived` (the SDK's
			// query functions are used that way throughout). Required by the UI registry.
			compilerOptions: {
				experimental: {
					async: true
				}
			},
			// Swap for the adapter that matches your host (node / cloudflare / vercel / …).
			adapter: adapter(),
			// The SDK ships its data layer as remote functions.
			experimental: {
				remoteFunctions: true
			},
			// `$lib` is not built into SvelteKit 3 — it only exists because of this alias.
			// Registry-installed components reference `$lib/components/ui/*`, so keep it.
			alias: {
				$lib: 'src/lib'
			},
			prerender: {
				handleHttpError: 'warn'
			}
		})
	],
	optimizeDeps: {
		include: ['qs'], // needed for shadcn-svelte
		// Don't prebundle the SDK. Its `.remote.js` files are imported as bare subpaths
		// (`sveltekit-medusa-sdk/auth`, …) and SvelteKit externalizes remote files during
		// prebundling, which fails with "Entry module … cannot be external".
		exclude: ['sveltekit-medusa-sdk']
	},
	ssr: {
		// Treat the SDK as internal to the app so `$app/server` resolves inside it, and
		// bundle CJS-only `cookie` so its named exports resolve during prerender.
		noExternal: ['sveltekit-medusa-sdk', 'cookie']
	}
})
