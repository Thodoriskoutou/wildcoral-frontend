<script lang="ts">
	import { t } from '$lib/i18n'
	import InputText from '../input-text/input-text.svelte'
	import { getAddressContext } from './ctx.svelte.js'
	let {
		label = t('Phone number'),
		prefix = '',
		class: className = '',
		...rest
	}: { label?: string; prefix?: '' | 'billing_'; class?: string; [k: string]: unknown } = $props()
	const ctx = getAddressContext()
</script>

<InputText field={ctx.form.fields[`${prefix}phone`]} type="tel" {label} autocomplete="tel" onchange={ctx.onchange} class={className} {...rest} />
