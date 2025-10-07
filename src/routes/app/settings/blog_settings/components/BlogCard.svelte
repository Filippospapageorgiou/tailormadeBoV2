<script lang="ts">
	import { togglePublishStatus } from '../data.remote';
	import type { Blog } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		X,
		RefreshCcw,
		Plus,
		Search,
		Pencil,
		Trash2,
		Eye,
		EyeOff,
		Calendar,
		User
	} from 'lucide-svelte';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import EditBlogDialog from './EditBlogDialog.svelte';
	import DeleteBlogDialog from './DeleteBlogDialog.svelte';

    let {
		blog,
		onUpdate
	}: {
		blog: any;
		onUpdate: () => Promise<void>;
	} = $props();

	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch (error) {
			return '';
		}
	}

	function truncateHtml(html: string, maxLength: number = 100): string {
		const div = document.createElement('div');
		div.innerHTML = html;
		const text = div.textContent || div.innerText || '';
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	async function handleTogglePublish(blog_id: number, blog_published: boolean) {
		showProgress(blog_published ? 'Unpublishing...' : 'Publishing...');

		try {
			const result = await togglePublishStatus({
				blogId: blog_id.toString(),
				published: !blog_published
			});

			if (result.success) {
                await onUpdate();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message;
			} else {
				toast.show = true;
				toast.status = false;
				toast.title = 'Error';
				toast.text = result.message || 'Failed to update publish status';
			}
		} catch (error: any) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = error.message || 'An unexpected error occurred';
		} finally {
			hideProgress();
		}
	}
</script>

<div
	class="group rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#8B6B4A]/20 hover:shadow-md"
>
	<div class="flex items-start justify-between gap-4">
		<!-- Content Section -->
		<div class="flex-1">
			<div class="flex items-start gap-3">
				<!-- Thumbnail -->
				{#if blog.images && blog.images.length > 0}
					<div class="h-20 w-32 flex-shrink-0 overflow-hidden rounded border border-gray-200">
						<img
							src={typeof blog?.images[0] === 'string' ? blog.images[0] : ''}
							alt={blog.title}
							class="h-full w-full object-cover"
						/>
					</div>
				{:else}
					<div
						class="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100"
					>
						<span class="text-xs text-gray-400">No image</span>
					</div>
				{/if}

				<!-- Blog Info -->
				<div class="flex-1 space-y-2">
					<div>
						<div class="flex items-start gap-2">
							<h3 class="line-clamp-1 text-lg font-semibold text-neutral-800">
								{blog.title}
							</h3>
							<span class="flex-shrink-0 text-xs text-[#8B6B4A]">#{blog.id}</span>
						</div>
						{#if blog.description}
							<p class="mt-1 line-clamp-2 text-sm text-neutral-600">
								{blog.description}
							</p>
						{:else if blog.content}
							<p class="mt-1 line-clamp-2 text-sm text-neutral-500">
								{truncateHtml(blog.content)}
							</p>
						{/if}
					</div>

					<!-- Meta Information -->
					<div class="flex flex-wrap items-center gap-2 text-xs">
						<!-- Published Status Badge -->
						{#if blog.published}
							<Badge class="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
								<Eye class="h-3 w-3" />
								Published
							</Badge>
						{:else}
							<Badge class="gap-1 bg-gray-100 text-gray-700 hover:bg-gray-100">
								<EyeOff class="h-3 w-3" />
								Draft
							</Badge>
						{/if}

						<!-- Author -->
						<div class="flex items-center gap-1 text-neutral-500">
							<User class="h-3 w-3" />
							<span>{blog.profile.username}</span>
						</div>

						<!-- Date -->
						<div class="flex items-center gap-1 text-neutral-500">
							<Calendar class="h-3 w-3" />
							<span>{formatDate(blog.created_at)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-shrink-0 flex-col gap-1 md:flex-row">
			<div class="flex items-center space-x-2">
				<Label for="toggle-status-{blog.id}" class="hidden sm:inline">Toggle Publish status</Label>
				<Switch
					id="toggle-status-{blog.id}"
					class="cursor-pointer"
					checked={blog.published}
					onCheckedChange={() => handleTogglePublish(blog.id, blog.published)}
				/>
			</div>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8 cursor-pointer hover:bg-[#8B6B4A]/10 hover:text-[#8B6B4A]"
							onclick={() => (editDialogOpen = true)}
						>
							<Pencil class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Edit Post</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8 cursor-pointer hover:bg-red-50 hover:text-red-600"
							onclick={() => (deleteDialogOpen = true)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Delete Post</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	</div>
</div>

<!-- Dialogs -->
<EditBlogDialog bind:open={editDialogOpen} {blog} onSuccess={onUpdate} />
<DeleteBlogDialog bind:open={deleteDialogOpen} {blog} onSuccess={onUpdate} />
