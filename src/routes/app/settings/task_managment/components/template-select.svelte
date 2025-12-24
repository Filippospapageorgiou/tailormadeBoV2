<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import type { TaskTemplateWithTasks } from '$lib/models/tasks.types';

	let {
		taskTemplatesWithTasks,
		value = $bindable()
	}: { taskTemplatesWithTasks: TaskTemplateWithTasks[]; value: string } = $props();

	const triggerContent = $derived(
		taskTemplatesWithTasks.find((f) => f.name === value)?.name ?? 'Διαλέξε ένα σετ εργασιών'
	);
</script>

<Select.Root type="single" name="templateTasks" bind:value>
	<Select.Trigger class="w-[240px]">
		{triggerContent}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.Label>Διάλεξε προτύπω tasks</Select.Label>
			{#each taskTemplatesWithTasks as tm (tm.id)}
				<Select.Item value={tm.id} label={tm.name!}>
					{tm.name}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
