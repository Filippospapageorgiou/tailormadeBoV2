<script lang="ts">
	import { togglePublishStatus } from '../../../../lib/api/blog/data.remote';
	import type { Blog } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		Pencil,
		Trash2,
		Eye,
		EyeOff,
		Calendar,
		User,
		ImageOff
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
			return new Date(dateString).toLocaleDateString('el-GR', {
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
	class="group rounded-xl border border-border/50 dark:border-white/10 bg-card p-4 
		   shadow-sm transition-all duration-300 
		   hover:border-primary/30 hover:shadow-md"
>
	<div class="flex items-start justify-between gap-4">
		<!-- Content Section -->
		<div class="flex-1 min-w-0">
			<div class="flex items-start gap-4">
				<!-- Thumbnail -->
				{#if blog.images && blog.images.length > 0}
					<div class="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
						<img
							src={typeof blog?.images[0] === 'string' ? blog.images[0] : ''}
							alt={blog.title}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					</div>
				{:else}
					<div
						class="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded-lg 
							   bg-muted text-muted-foreground"
					>
						<div class="flex flex-col items-center gap-1">
							<ImageOff class="h-5 w-5" />
							<span class="text-[10px]">No image</span>
						</div>
					</div>
				{/if}

				<!-- Blog Info -->
				<div class="flex-1 min-w-0 space-y-2">
					<div>
						<div class="flex items-start gap-2">
							<h3 class="line-clamp-1 text-base font-semibold text-foreground sm:text-lg">
								{blog.title}
							</h3>
							<span class="flex-shrink-0 text-xs font-medium text-primary">#{blog.id}</span>
						</div>
						{#if blog.description}
							<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
								{blog.description}
							</p>
						{:else if blog.content}
							<p class="mt-1 line-clamp-2 text-sm text-muted-foreground/80">
								{truncateHtml(blog.content)}
							</p>
						{/if}
					</div>

					<!-- Meta Information -->
					<div class="flex flex-wrap items-center gap-2 text-xs">
						<!-- Published Status Badge -->
						{#if blog.published}
							<Badge class="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-0">
								<Eye class="h-3 w-3" />
								Published
							</Badge>
						{:else}
							<Badge class="gap-1 bg-muted text-muted-foreground hover:bg-muted border-0">
								<EyeOff class="h-3 w-3" />
								Draft
							</Badge>
						{/if}

						<!-- Author -->
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<User class="h-3 w-3" />
							<span>{blog.profile.username}</span>
						</div>

						<!-- Date -->
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<Calendar class="h-3 w-3" />
							<span>{formatDate(blog.created_at)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-shrink-0 items-center gap-1">
			<!-- Publish Toggle -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<div class="pr-2">
							<Switch
								id="toggle-status-{blog.id}"
								class="cursor-pointer"
								checked={blog.published}
								onCheckedChange={() => handleTogglePublish(blog.id, blog.published)}
							/>
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{blog.published ? 'Unpublish' : 'Publish'}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<!-- Edit Button -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary"
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

			<!-- Delete Button -->
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8 cursor-pointer hover:bg-red-500/10 hover:text-red-500"
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