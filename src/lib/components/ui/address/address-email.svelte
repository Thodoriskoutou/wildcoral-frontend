<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	import InputText from '../input-text/input-text.svelte'
	import { getAddressContext } from './ctx.svelte.js'
	let { label = t('Email address'), class: className = '', ...rest }: { label?: string; class?: string; [k: string]: unknown } = $props()
	const ctx = getAddressContext()
</script>

<InputText field={ctx.form.fields.email} type="email" {label} autocomplete="email" onchange={ctx.onchange} class={className} {...rest} />
