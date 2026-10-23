/**
 * Lists the texts of the site that have no Greek translation yet.
 *
 *   pnpm run check:i18n            exit code 1 when something is missing or a {placeholder} is lost
 *   pnpm run check:i18n -- --list  print every text the site uses, one per line (to start a new language)
 *
 * It reads every `t('…')` and `msg('…')` in src/ (see src/lib/i18n/format.ts) and compares them with
 * src/lib/i18n/el.ts. Notes meant for developers (they show only in development) are not translated.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

/** Texts that only developers see (or pieces of such sentences). They stay in English. */
const DEVELOPER_ONLY = /^(Dev note|Developer note)|^(set|in|, and|to enable this form\.|\(publishable key\) and|\. Checkout supports Stripe \(|\) and Braintree)/;

function files(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files(full, out);
		else if (/\.(svelte|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
	}
	return out;
}

/** The value of a JS string literal's contents (what is between the quotes). */
function unescape(raw, quote) {
	return raw.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, c) => {
		if (c[0] === 'u' || c[0] === 'x') return String.fromCharCode(parseInt(c.slice(1), 16));
		return { n: '\n', t: '\t', r: '\r' }[c] ?? c;
	});
}

const CALL = /(?<![\w$.])(?:t|msg)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

const used = new Map(); // text -> first place it is used
for (const file of files(SRC)) {
	if (file.includes(path.join('src', 'lib', 'i18n') + path.sep)) continue; // the system itself (its comments show examples)
	const source = fs.readFileSync(file, 'utf8');
	for (const match of source.matchAll(CALL)) {
		if (match[1] === '`' && match[2].includes('${')) continue; // a template with values: not a fixed text
		const text = unescape(match[2], match[1]);
		if (!used.has(text)) used.set(text, `${path.relative(ROOT, file).replaceAll('\\', '/')}:${source.slice(0, match.index).split('\n').length}`);
	}
}

if (process.argv.includes('--list')) {
	console.log([...used.keys()].sort().join('\n'));
	process.exit(0);
}

const { el } = await import(pathToFileURL(path.join(SRC, 'lib', 'i18n', 'el.ts')).href);

const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort().join(',');
const missing = [];
const broken = [];
for (const [text, where] of used) {
	if (DEVELOPER_ONLY.test(text)) continue;
	const greek = el[text];
	if (greek === undefined || greek === '') missing.push([text, where]);
	else if (placeholders(text) !== placeholders(greek)) broken.push([text, greek, where]);
}
const unused = Object.keys(el).filter((text) => !used.has(text) && !/^[^:|{}]*::/.test(text));

console.log(`${used.size} texts in use, ${Object.keys(el).length} Greek translations.`);
if (missing.length) {
	console.log(`\nMissing a Greek translation (${missing.length}):`);
	for (const [text, where] of missing) console.log(`  ${where}\n    ${JSON.stringify(text)}`);
}
if (broken.length) {
	console.log(`\nThe Greek text lost or changed a {placeholder} (${broken.length}):`);
	for (const [text, greek, where] of broken) console.log(`  ${where}\n    ${JSON.stringify(text)}\n    ${JSON.stringify(greek)}`);
}
if (unused.length) {
	console.log(`\nGreek texts no longer used by the code (${unused.length}) — safe to delete:`);
	for (const text of unused) console.log(`  ${JSON.stringify(text)}`);
}
process.exit(missing.length || broken.length ? 1 : 0);
