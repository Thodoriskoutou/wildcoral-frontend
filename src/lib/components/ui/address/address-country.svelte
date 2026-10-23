<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	import InputSelectCountry from '../input-select-country/input-select-country.svelte'
	import { getAddressContext } from './ctx.svelte.js'
	let {
		label = t('Country'),
		prefix = '',
		placeholder = t('Select a country…'),
		class: className = '',
		...rest
	}: {
		label?: string
		prefix?: '' | 'billing_'
		placeholder?: string
		class?: string
		[k: string]: unknown
	} = $props()
	const ctx = getAddressContext()
</script>

<InputSelectCountry
	field={ctx.form.fields[`${prefix}country_code`]}
	countries={ctx.countries}
	{label}
	{placeholder}
	autocomplete="country"
	onchange={ctx.onchange}
	class={className}
	{...rest}
/>
