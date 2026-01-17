<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { BadgeAlert, Trash2 } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

    type Props = {
		open: boolean;
		title?: string;
		description?: string;
		warningText?: string;
		itemName?: string;
		isDeleting?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
		children?: Snippet;
	};

	let {
		open = $bindable(),
		title = 'Διαγραφή',
		description = 'Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό;',
		warningText = 'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί',
		itemName,
		isDeleting = false,
		onConfirm,
		onCancel,
		children
	}: Props = $props();
</script>


<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				<Trash2 class="h-5 w-5" />
				{title}
			</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			{#if warningText}
				<div class="rounded-lg bg-destructive/10 p-4">
					<div class="flex gap-3">
						<BadgeAlert class="h-5 w-5 flex-shrink-0 text-destructive" />
						<p class="text-sm font-semibold text-destructive">{warningText}</p>
					</div>
				</div>
			{/if}

			{#if children}
				{@render children()}
			{:else if itemName}
				<p class="text-sm text-muted-foreground">
					Θα διαγραφεί: <span class="font-semibold">{itemName}</span>
				</p>
			{/if}
		</div>

		<Dialog.Footer class="gap-2">
			<Button variant="outline" onclick={onCancel} disabled={isDeleting}>
				Ακύρωση
			</Button>
			<Button variant="destructive" onclick={onConfirm} disabled={isDeleting}>
				{#if isDeleting}
					<Spinner class="mr-2 h-4 w-4" />
				{/if}
				Διαγραφή
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>