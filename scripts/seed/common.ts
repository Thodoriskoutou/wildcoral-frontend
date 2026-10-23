/**
 * Shared plumbing for the seed tools: finding the project, connecting to Medusa with your own
 * login (read from your terminal's environment, never from a file), and uploading files.
 */
import fs from 'node:fs';
import path from 'node:path';
import Medusa from '@medusajs/js-sdk';

// The SDK's upload code checks `body instanceof FileList`, a browser-only global. Node doesn't have
// it, so give it a harmless stand-in (our uploads are plain `File` objects, which Node does have).
(globalThis as { FileList?: unknown }).FileList ??= class FileList {};

export const ROOT = path.resolve(import.meta.dirname, '..', '..');

export const say = (msg = '') => console.log(msg);

export function fail(message: string): never {
	console.error(`\n✗ ${message}\n`);
	process.exit(1);
}

export function explain(e: unknown): string {
	const err = e as { status?: number; message?: string };
	return `${err?.status ? `[${err.status}] ` : ''}${err?.message ?? String(e)}`;
}

function readEnvFile(): Record<string, string> {
	const file = path.join(ROOT, '.env');
	if (!fs.existsSync(file)) return {};
	const out: Record<string, string> = {};
	for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
		const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
		if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
	}
	return out;
}

/** A setting from the terminal's environment, or else from the project's `.env` (empty string if neither has it). */
export function envValue(name: string): string {
	return process.env[name] ?? readEnvFile()[name] ?? '';
}

export function backendUrl(): string {
	const baseUrl = envValue('MEDUSA_BACKEND_URL').replace(/\/+$/, '');
	if (!baseUrl) fail('MEDUSA_BACKEND_URL is not set (it is normally in the project .env).');
	return baseUrl;
}

/** True when the backend runs on this computer (localhost, 127.0.0.1, ::1 or a *.localhost name). */
export function isLocalBackend(): boolean {
	const host = new URL(backendUrl()).hostname.replace(/^\[|\]$/g, '');
	return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost');
}

/** True when an admin login (API key, or email + password) is set in this terminal. */
export const hasAdminLogin = () =>
	!!process.env.MEDUSA_ADMIN_API_KEY || !!(process.env.MEDUSA_ADMIN_EMAIL && process.env.MEDUSA_ADMIN_PASSWORD);

/** Makes sure the backend accepts the API key now, instead of failing with a bare 401 at the first admin call. */
async function checkApiKey(sdk: Medusa, baseUrl: string) {
	try {
		await sdk.client.fetch('/admin/stores', { query: { limit: 1, fields: 'id' } });
	} catch (e) {
		const status = (e as { status?: number }).status;
		if (status === 401 || status === 403) {
			fail(
				`${baseUrl} did not accept the secret API key in MEDUSA_ADMIN_API_KEY: it belongs to another store, or was revoked. ` +
					'Create one in Settings -> Secret API Keys of this store, or clear it to use MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD ' +
					'instead (the API key wins when both are set; in PowerShell: Remove-Item Env:MEDUSA_ADMIN_API_KEY).'
			);
		}
		fail(`Could not check the API key against ${baseUrl}: ${explain(e)}${status ? '' : ' (is the backend running there?)'}`);
	}
}

export async function connect(): Promise<Medusa> {
	const baseUrl = backendUrl();

	const apiKey = process.env.MEDUSA_ADMIN_API_KEY;
	const email = process.env.MEDUSA_ADMIN_EMAIL;
	const password = process.env.MEDUSA_ADMIN_PASSWORD;

	if (apiKey) {
		say(`Connecting to ${baseUrl} with a secret API key…`);
		const sdk = new Medusa({ baseUrl, apiKey });
		await checkApiKey(sdk, baseUrl);
		return sdk;
	}
	if (email && password) {
		say(`Connecting to ${baseUrl} as ${email}…`);
		const sdk = new Medusa({ baseUrl, auth: { type: 'jwt', jwtTokenStorageMethod: 'memory' } });
		try {
			const result = await sdk.auth.login('user', 'emailpass', { email, password });
			if (typeof result !== 'string') fail('Login needs an extra step this script cannot do. Use a secret API key instead.');
		} catch (e) {
			fail(`Login failed: ${explain(e)}`);
		}
		return sdk;
	}
	return fail(
		'No login provided. Set MEDUSA_ADMIN_API_KEY (a Secret API Key from Settings → Secret API Keys), ' +
			'or MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD, in your terminal first. See scripts/seed/README.md.'
	);
}

const MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.mov': 'video/quicktime'
};

/** Uploads a file to Medusa's file storage and returns its public URL (cached per path). */
export async function uploadFile(sdk: Medusa, cache: Map<string, string>, absPath: string): Promise<string> {
	const cached = cache.get(absPath);
	if (cached) return cached;
	const name = path.basename(absPath);
	const file = new File([fs.readFileSync(absPath)], name, { type: MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream' });
	const { files } = await sdk.admin.upload.create({ files: [file] });
	const url = files[0]?.url;
	if (!url) throw new Error(`Upload of ${name} returned no URL`);
	cache.set(absPath, url);
	return url;
}
