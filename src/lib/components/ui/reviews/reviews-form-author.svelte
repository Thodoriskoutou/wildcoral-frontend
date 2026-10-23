<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import InputText from '../input-text/input-text.svelte'
	import { getReviewFormContext } from './review-form-ctx.svelte.js'
	let { class: className = '' }: { class?: string } = $props()
	const ctx = getReviewFormContext()
</script>

<InputText field={ctx.form.fields.author_name} label={t('Name')} class={className} />
