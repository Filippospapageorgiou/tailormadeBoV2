<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		value = $bindable('#3b82f6'),
		onchange
	}: {
		value?: string;
		onchange?: (color: string) => void;
	} = $props();

	const colors = [
		{ name: 'Blue', hex: '#3b82f6' },
		{ name: 'Green', hex: '#10b981' },
		{ name: 'Red', hex: '#ef4444' },
		{ name: 'Yellow', hex: '#f59e0b' },
		{ name: 'Purple', hex: '#8b5cf6' },
		{ name: 'Pink', hex: '#ec4899' },
		{ name: 'Indigo', hex: '#6366f1' },
		{ name: 'Teal', hex: '#14b8a6' },
		{ name: 'Orange', hex: '#f97316' },
		{ name: 'Cyan', hex: '#06b6d4' },
		{ name: 'Lime', hex: '#84cc16' },
		{ name: 'Gray', hex: '#6b7280' }
	];

	function selectColor(color: string) {
		value = color;
		if (onchange) {
			onchange(color);
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="text-sm font-medium text-foreground">Badge Color</div>
	<div class="grid grid-cols-6 gap-2">
		{#each colors as color (color.hex)}
			<button
				type="button"
				onclick={() => selectColor(color.hex)}
				class={cn(
					'group relative size-8 cursor-pointer rounded-md border-2 transition-all hover:scale-110',
					value === color.hex ? 'border-foreground ring-2 ring-foreground ring-offset-2' : 'border-border hover:border-muted-foreground'
				)}
				style="background-color: {color.hex}"
				title={color.name}
			>
				{#if value === color.hex}
					<div class="absolute inset-0 flex items-center justify-center">
						<svg
							class="size-4 text-white drop-shadow-lg"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
					</div>
				{/if}
			</button>
		{/each}
	</div>
	<div class="flex items-center gap-2">
		<div class="text-xs text-muted-foreground">Selected:</div>
		<div class="flex items-center gap-2">
			<div class="size-4 rounded border border-border" style="background-color: {value}"></div>
			<span class="text-xs font-medium text-foreground">{value}</span>
		</div>
	</div>
</div>
