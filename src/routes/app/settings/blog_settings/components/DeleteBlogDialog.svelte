<script lang="ts">
	import type { Blog } from '$lib/models/database.types';
	import { deleteBlog } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { AlertTriangleIcon } from 'lucide-svelte';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';

	let {
		open = $bindable(),
		blog,
		onSuccess
	}: {
		open: boolean;
		blog: Blog;
		onSuccess: () => Promise<void>;
	} = $props();

	let isDeleting = $state(false);

	async function handleDelete() {
		isDeleting = true;
		try {
			const result = await deleteBlog({ blogId: blog.id.toString() });
			if (result.success) {
				await onSuccess();
				toast.success('Το blog διαγράφθηκε')
				open = false;
			} else {
				toast.error('Σφάλμα κάτα την διαγράφη blog')
			}
		} catch (error: any) {
			toast.error('Σφάλμα κάτα την διαγράφη blog')
		} finally {
			isDeleting = false;
			open = false;
		}
	}
</script>


<DeleteConfirmDialog
	bind:open
	title="Διαγράφη Blog"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το blog; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
	itemName="{blog.title} (ID: {blog.id})"
	{isDeleting}
	onConfirm={handleDelete}
	onCancel={() => (open = false)}>
	{#snippet children()}
		<div class="flex items-center gap-4 rounded-lg p-4">
			{#if blog.images[0]}
				<img
					src={blog.images[0]}
					alt={blog.title}
					class="h-16 w-16 rounded-lg object-cover"
				/>
			{/if}
			<div>
				<p class="font-semibold">{blog.title}</p>
				<p class="text-xs text-muted-foreground">ID: #{blog.id}</p>
			</div>
		</div>
	{/snippet}
</DeleteConfirmDialog>