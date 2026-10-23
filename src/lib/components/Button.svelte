<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		fullWidth?: boolean;
		disabled?: boolean;
		onclick?: () => void;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
	}

	let {
		children,
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		disabled = false,
		onclick,
		type = 'button',
		class: className = ''
	}: Props = $props();

	const baseStyles = 'tracking-[0.2em] uppercase font-medium transition-opacity duration-300';

	const variantStyles = {
		primary: 'btn-primary-cta shadow-card',
		secondary: 'bg-transparent border border-stone-900 text-stone-900 hover:opacity-85',
		ghost: 'bg-transparent text-stone-900 hover:opacity-70'
	};

	const sizeStyles = {
		sm: 'py-3 px-6 text-xs',
		md: 'py-4 px-8 text-sm',
		lg: 'py-5 px-12 text-sm'
	};
</script>

<button
	{type}
	{onclick}
	{disabled}
	class="{baseStyles} {variantStyles[variant]} {sizeStyles[size]} {fullWidth ? 'w-full' : ''} {disabled
		? 'opacity-40 cursor-not-allowed pointer-events-none'
		: ''} {className}"
>
	{@render children()}
</button>
