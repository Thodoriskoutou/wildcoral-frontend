<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import * as Dialog from '$lib/components/ui/dialog/index.js'
	import LoginForm from './login-form.svelte'
	import RegisterForm from './register-form.svelte'
	import ForgotForm from './forgot-form.svelte'
	import ResetForm from './reset-form.svelte'
	import Field from './field.svelte'
	import Label from './label.svelte'
	import Input from './input.svelte'
	import ErrorPart from './error.svelte'
	import Submit from './submit.svelte'

	type Classes = Partial<Record<'content' | 'header' | 'title' | 'form' | 'field' | 'label' | 'input' | 'submit', string>>
	const MODES = ['login', 'register', 'forgot', 'reset'] as const
	type Mode = (typeof MODES)[number]

	let {
		classes = {},
		titles = {}
	}: {
		classes?: Classes
		titles?: Partial<Record<Mode, string>>
	} = $props()

	const defaultTitles: Record<Mode, string> = {
		login: t('Sign in to your account'),
		register: t('Create an account'),
		forgot: t('Reset your password'),
		reset: t('Choose a new password')
	}
	const descriptions: Record<Mode, string> = {
		login: t('Enter your email and password to sign in.'),
		register: t('Create an account with your email and a password.'),
		forgot: t('Enter your email and we will send you a link to reset your password.'),
		reset: t('Choose a new password for your account.')
	}

	const isMode = (m: string | null): m is Mode => !!m && (MODES as readonly string[]).includes(m)
	const mode = $derived(page.url.searchParams.get('auth'))
	const open = $derived(isMode(mode))
	const token = $derived(page.url.searchParams.get('token') ?? '')

	// Per-mode success state, cleared on any navigation so reopening a mode starts fresh.
	let sent = $state(false)
	let resetDone = $state(false)

	function navigate(next: Mode | null) {
		sent = false
		resetDone = false
		const params = new URLSearchParams(page.url.searchParams.toString())
		if (next) {
			params.set('auth', next)
		} else {
			params.delete('auth')
		}
		if (next !== 'reset') params.delete('token')
		goto(`?${params.toString()}`, { replace: true, reset: false })
	}
	const switchMode = (m: string) => navigate(m as Mode)
	const close = () => navigate(null)
</script>

<Dialog.Root
	bind:open={
		() => open,
		v => {
			if (!v) close()
		}
	}
>
	<Dialog.Content class={classes.content ?? 'sm:max-w-md'}>
		<Dialog.Header class={classes.header}>
			<Dialog.Title class={classes.header}>{isMode(mode) ? (titles[mode] ?? defaultTitles[mode]) : ''}</Dialog.Title>
			<Dialog.Description>{isMode(mode) ? descriptions[mode] : ''}</Dialog.Description>
		</Dialog.Header>

		{#if mode === 'login'}
			<LoginForm class={classes.form} onsuccess={close} onswitch={switchMode}>
				<Field name="email" class={classes.field}>
					<Label class={classes.label}>{t('Email')}</Label>
					<Input type="email" autocomplete="email" class={classes.input} />
					<ErrorPart />
				</Field>
				<Field name="password" class={classes.field}>
					<Label class={classes.label}>{t('Password')}</Label>
					<Input type="password" autocomplete="current-password" class={classes.input} />
					<ErrorPart />
				</Field>
				<ErrorPart />
				<Submit class={classes.submit}>{t('Sign in')}</Submit>
				<button type="button" class="text-muted-foreground text-sm underline" onclick={() => switchMode('register')}> {t('Create an account')} </button>
				<button type="button" class="text-muted-foreground text-sm underline" onclick={() => switchMode('forgot')}> {t('Forgot your password?')} </button>
			</LoginForm>
		{:else if mode === 'register'}
			<RegisterForm class={classes.form} onsuccess={close} onswitch={switchMode}>
				<Field name="email" class={classes.field}>
					<Label class={classes.label}>{t('Email')}</Label>
					<Input type="email" autocomplete="email" class={classes.input} />
					<ErrorPart />
				</Field>
				<Field name="password" class={classes.field}>
					<Label class={classes.label}>{t('Password')}</Label>
					<Input type="password" autocomplete="new-password" class={classes.input} />
					<ErrorPart />
				</Field>
				<ErrorPart />
				<Submit class={classes.submit}>{t('Create account')}</Submit>
				<button type="button" class="text-muted-foreground text-sm underline" onclick={() => switchMode('login')}>
					{t('Already have an account? Sign in')}
				</button>
			</RegisterForm>
		{:else if mode === 'forgot'}
			{#if sent}
				<p class="text-muted-foreground text-sm">{t('If an account exists for that email, we\'ve sent a link to reset your password.')}</p>
				<button type="button" class="text-muted-foreground text-sm underline" onclick={() => switchMode('login')}> {t('Back to sign in')} </button>
			{:else}
				<ForgotForm class={classes.form} onsuccess={() => (sent = true)} onswitch={switchMode}>
					<Field name="email" class={classes.field}>
						<Label class={classes.label}>{t('Email')}</Label>
						<Input type="email" autocomplete="email" class={classes.input} />
						<ErrorPart />
					</Field>
					<ErrorPart />
					<Submit class={classes.submit}>{t('Send reset link')}</Submit>
					<button type="button" class="text-muted-foreground text-sm underline" onclick={() => switchMode('login')}> {t('Back to sign in')} </button>
				</ForgotForm>
			{/if}
		{:else if mode === 'reset'}
			{#if resetDone}
				<p class="text-muted-foreground text-sm">{t('Your password has been updated.')}</p>
				<button type="button" class="text-muted-foreground text-sm underline" onclick={() => switchMode('login')}> {t('Sign in')} </button>
			{:else}
				<ResetForm class={classes.form} {token} onsuccess={() => (resetDone = true)} onswitch={switchMode}>
					<Field name="password" class={classes.field}>
						<Label class={classes.label}>{t('New password')}</Label>
						<Input type="password" autocomplete="new-password" class={classes.input} />
						<ErrorPart />
					</Field>
					<ErrorPart />
					<Submit class={classes.submit}>{t('Set password')}</Submit>
				</ResetForm>
			{/if}
		{/if}
	</Dialog.Content>
</Dialog.Root>
