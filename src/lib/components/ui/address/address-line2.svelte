<script lang="ts">
	import { t } from '$lib/i18n'
	import InputText from '../input-text/input-text.svelte'
	import { getAddressContext } from './ctx.svelte.js'
	let {
		label = t('Apt/Suite'),
		prefix = '',
		class: className = '',
		...rest
	}: { label?: string; prefix?: '' | 'billing_'; class?: string; [k: string]: unknown } = $props()
	const ctx = getAddressContext()
</script>

<InputText field={ctx.form.fields[`${prefix}address_2`]} {label} autocomplete="address-line2" onchange={ctx.onchange} class={className} {...rest} />
