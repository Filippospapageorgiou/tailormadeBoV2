<script lang="ts">
	import type { Blog } from '$lib/models/database.types';
	import { deleteBlog } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { AlertOctagonIcon, AlertTriangle, AlertTriangleIcon } from 'lucide-svelte';

	let {
		open = $bindable(),
		blog,
		onSuccess
	}: {
		open: boolean;
		blog: Blog;
		onSuccess: () => Promise<void>;
	} = $props();

	let deleting = $state(false);

	async function handleDelete() {
		deleting = true;
		showProgress('Deleting blog post...');

		try {
			const result = await deleteBlog({ blogId: blog.id.toString() });

			if (result.success) {
				await onSuccess();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message || 'Blog post deleted successfully';
				open = false;
			} else {
				toast.show = true;
				toast.status = false;
				toast.title = 'Error';
				toast.text = result.message || 'Failed to delete blog post';
			}
		} catch (error: any) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = error.message || 'An unexpected error occurred';
		} finally {
			deleting = false;
			hideProgress();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Delete Blog Post</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this blog post? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Blog Info -->
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="space-y-2">
					<div class="flex items-start gap-2">
						<h4 class="line-clamp-2 font-semibold text-neutral-800">{blog.title}</h4>
					</div>
					{#if blog.description}
						<p class="line-clamp-2 text-sm text-neutral-600">{blog.description}</p>
					{/if}
					<div class="flex items-center gap-2 text-xs text-neutral-500">
						<span>By {blog.profile.username}</span>
						{#if blog.id}
							<span>•</span>
							<span>{blog.id}</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Warning Alert -->
			<Alert.Root variant="destructive">
				<AlertTriangleIcon class="h-4 w-4" />
				<Alert.Title>Warning</Alert.Title>
				<Alert.Description>
					This will permanently delete the blog post and all associated images from storage. This
					action cannot be undone.
				</Alert.Description>
			</Alert.Root>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)} disabled={deleting}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={deleting} class="cursor-pointer">
				{deleting ? 'Deleting...' : 'Delete Blog Post'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
