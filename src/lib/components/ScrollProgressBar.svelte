<script lang="ts">
	let progress = $state(0);

	$effect(() => {
		const calculateScrollProgress = () => {
			const windowHeight = window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;
			const scrollTop = window.scrollY;

			const totalScrollableHeight = documentHeight - windowHeight;
			const currentProgress = (scrollTop / totalScrollableHeight) * 100;

			progress = Math.min(currentProgress, 100);
		};

		calculateScrollProgress();

		window.addEventListener('scroll', calculateScrollProgress);
		window.addEventListener('resize', calculateScrollProgress);

		return () => {
			window.removeEventListener('scroll', calculateScrollProgress);
			window.removeEventListener('resize', calculateScrollProgress);
		};
	});
</script>

<div class="fixed top-0 left-0 w-full h-[2px] bg-gray-200 z-[60]">
	<div class="h-full bg-gray-900 transition-all duration-150 ease-out" style="width: {progress}%"></div>
</div>
