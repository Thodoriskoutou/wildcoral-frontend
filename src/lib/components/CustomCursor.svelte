<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	interface Props {
		mode?: 'default' | 'view' | 'zoom';
	}

	let { mode = 'default' }: Props = $props();

	let position = $state({ x: 0, y: 0 });
	let isVisible = $state(false);

	$effect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			position = { x: e.clientX, y: e.clientY };
			isVisible = mode !== 'default';
		};

		const handleMouseEnter = () => (isVisible = mode !== 'default');
		const handleMouseLeave = () => (isVisible = false);

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseenter', handleMouseEnter);
		window.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseenter', handleMouseEnter);
			window.removeEventListener('mouseleave', handleMouseLeave);
		};
	});

	let cursorText = $derived(mode === 'view' ? t('View') : t('Zoom'));
</script>

{#if isVisible && mode !== 'default'}
	<div
		class="fixed pointer-events-none z-[9999] mix-blend-difference"
		style="left: {position.x}px; top: {position.y}px; transform: translate(-50%, -50%)"
	>
		<div
			class="w-16 h-16 rounded-full border border-white bg-black/20 backdrop-blur-sm flex items-center justify-center"
		>
			<span class="text-[10px] tracking-wider uppercase text-white font-medium">
				{cursorText}
			</span>
		</div>
	</div>
{/if}
