<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { ArrowUpDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		label = '',
		variant = 'ghost',
		...restProps
	}: ComponentProps<typeof Button> & { label?: string } = $props();
</script>

<Button {variant} {...restProps} class="-ml-4 h-8 px-3 font-medium text-muted-foreground hover:text-foreground">
	{label}
	<ArrowUpDown class="ml-1.5 h-3.5 w-3.5" />
</Button>