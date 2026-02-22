<script lang="ts">
	import { Ellipsis, Eye, FilePenLine } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { goto } from '$app/navigation';

	let { id, status }: { id: number; status: string } = $props();

	let canEdit = $derived(status === 'draft' || status === 'reopened');
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props }: {props:any})}
			<Button {...props} variant="ghost" size="icon" class="relative h-8 w-8 p-0">
				<span class="sr-only">Ενέργειες</span>
				<Ellipsis class="h-4 w-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Group>
			<DropdownMenu.Label>Ενέργειες</DropdownMenu.Label>
			<DropdownMenu.Item onclick={() => goto(`/trainer/evaluations/${id}`)} class="gap-2">
				<Eye class="h-4 w-4" />
				Προβολή
			</DropdownMenu.Item>
			{#if canEdit}
				<DropdownMenu.Item onclick={() => goto(`/trainer/evaluations/${id}/edit`)} class="gap-2">
					<FilePenLine class="h-4 w-4" />
					Συνέχεια Συμπλήρωσης
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>