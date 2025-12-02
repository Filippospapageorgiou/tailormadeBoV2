<script lang="ts">
	import { goto } from '$app/navigation';

	let { href = '/', label = 'προβολή' } = $props();
</script>

<button
	onclick={() => {
		if (href.startsWith('http')) window.open(href, '_blank');
		else goto(href);
	}}
	class="group inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors duration-300 ease-in-out hover:text-primary"
>
	{label}
	<svg
		viewBox="0 0 24 24"
		class="size-4 fill-none stroke-current stroke-2 opacity-50 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
	>
		<line
			x1="5"
			y1="12"
			x2="19"
			y2="12"
			class="translate-x-[10px] scale-x-0 transition-transform duration-300 ease-in-out group-hover:translate-x-0 group-hover:scale-x-100"
		/>
		<polyline
			points="12 5 19 12 12 19"
			class="-translate-x-2 transition-transform duration-300 ease-in-out group-hover:translate-x-0"
		/>
	</svg>
</button>
