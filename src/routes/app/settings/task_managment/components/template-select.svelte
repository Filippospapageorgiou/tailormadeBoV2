<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

	let { taskTemplates, value = $bindable() }: { taskTemplates: any[]; value: string } = $props();

	const triggerContent = $derived(
		taskTemplates.find((f) => f.name === value)?.name ?? 'Select a fruit'
	);
</script>

<Select.Root type="single" name="favoriteFruit" bind:value>
	<Select.Trigger class="w-[180px]">
		{triggerContent}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.Label>Fruits</Select.Label>
			{#each taskTemplates as tm (tm.id)}
				<Select.Item value={tm.name} label={tm.name}>
					{tm.name}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
