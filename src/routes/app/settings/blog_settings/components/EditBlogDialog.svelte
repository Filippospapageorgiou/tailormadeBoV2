<script lang="ts">
	import type { Blog } from '$lib/models/database.types';
	import { editBlog } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { X, CloudIcon } from 'lucide-svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';

	let {
		open = $bindable(),
		blog,
		onSuccess
	}: {
		open: boolean;
		blog: Blog;
		onSuccess: () => Promise<void>;
	} = $props();

	let formData = $state({
		title: blog.title,
		description: blog.description || '',
		content: blog.content,
		tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
		published: blog.published
	});

	// Reset form when blog changes
	$effect(() => {
		formData = {
			title: blog.title,
			description: blog.description || '',
			content: blog.content,
			tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
			published: blog.published
		};
	});

	let files: FileList | undefined = $state();
	let previewUrl = $state('');
	let fileInput = $state<any>();

	$effect(() => {
		if (files && files[0]) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				previewUrl = reader.result?.toString() || '';
			});
			reader.readAsDataURL(files[0]);
		} else {
			previewUrl = '';
		}
	});

	function refreshFiles() {
		files = undefined;
		previewUrl = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}

	async function handleSuccess(text: string) {
		await onSuccess();
		toast.show = true;
		toast.status = true;
		toast.title = 'Success';
		toast.text = text;
	}

	function handleError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Error';
		toast.text = text;
	}

	function getCurrentImage() {
		if (blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
			return blog.images[0];
		}
		return '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
		<Dialog.Header>
			<Dialog.Title>Edit Blog Post</Dialog.Title>
			<Dialog.Description>Update the details of your blog post</Dialog.Description>
		</Dialog.Header>
		<form
			class="space-y-4 py-4"
			enctype="multipart/form-data"
			{...editBlog.enhance(async ({ form, submit }) => {
				open = false;
				showProgress('Updating blog post...');
				await submit();

				if (editBlog.result?.success) {
					handleSuccess(editBlog.result?.message || 'Successfully updated blog post');
				} else {
					handleError(editBlog.result?.message || 'An unexpected error occurred.');
				}
				refreshFiles();
				hideProgress();
			})}
		>
			<!-- Hidden ID field -->
			<input type="hidden" name={editBlog.field('id')} value={blog.id.toString()} />

			<!-- Title -->
			<div class="space-y-2">
				<Label for="edit-title">Title *</Label>
				<Input
					id="edit-title"
					name={editBlog.field('title')}
					bind:value={formData.title}
					placeholder="Enter blog post title..."
					required
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description">Short Description</Label>
				<Textarea
					id="edit-description"
					name={editBlog.field('description')}
					bind:value={formData.description}
					placeholder="Brief description of the blog post..."
					rows={2}
					class="resize-none"
				/>
			</div>

			<!-- Content -->
			<div class="space-y-2">
				<Label for="edit-content">Content *</Label>
				<Textarea
					id="edit-content"
					name={editBlog.field('content')}
					bind:value={formData.content}
					placeholder="Write your blog content here... You can use HTML formatting."
					rows={10}
					class="resize-none font-mono text-sm"
					required
				/>
			</div>


			<!-- Tags -->
			<div class="space-y-2">
				<Label for="edit-tags">Tags</Label>
				<Input
					id="edit-tags"
					name={editBlog.field('tags')}
					bind:value={formData.tags}
					placeholder="Comma-separated tags: coffee, latte, tutorial"
				/>
			</div>

			<!-- Image Upload -->
			<div class="space-y-2">
				<Label>Featured Image</Label>
				{#if !previewUrl && getCurrentImage()}
					<!-- Show current image -->
					<div class="relative w-full overflow-hidden rounded-lg border border-gray-200">
						<img src={getCurrentImage()} alt={blog.title} class="h-64 w-full object-cover" />
						<div class="absolute right-2 top-2 flex gap-2">
							<Button
								variant="secondary"
								size="sm"
								onclick={() => {
									if (fileInput) fileInput.click();
								}}
							>
								Change Image
							</Button>
						</div>
					</div>
					<Input
						type="file"
						name={editBlog.field('images')}
						accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
						bind:files
						bind:this={fileInput}
						class="hidden"
					/>
				{:else if previewUrl}
					<!-- Show new preview -->
					<div class="relative w-full overflow-hidden rounded-lg border border-gray-200">
						<img src={previewUrl} alt="New blog" class="h-64 w-full object-cover" />
						<div class="absolute right-2 top-2 flex gap-2">
							<Button variant="secondary" onclick={refreshFiles}>
								<X class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{:else}
					<!-- No image state -->
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							<Empty.Media variant="icon">
								<CloudIcon />
							</Empty.Media>
							<Empty.Title>No image</Empty.Title>
							<Empty.Description>Upload a featured image for your blog post</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Input
								type="file"
								name={editBlog.field('images')}
								accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
								bind:files
								bind:this={fileInput}
							/>
						</Empty.Content>
					</Empty.Root>
				{/if}
			</div>

			<!-- Published Toggle -->
			<div class="flex items-center space-x-2">
				<Switch
					id="edit-published"
					bind:checked={formData.published}
					class="cursor-pointer"
				/>
				<Label for="edit-published" class="cursor-pointer">Published</Label>
				<input
					type="hidden"
					name={editBlog.field('published')}
					value={formData.published.toString()}
				/>
			</div>

			<div class="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
				<p class="font-medium">Tips:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Required fields</li>
					<li>Leave image unchanged if you don't upload a new one</li>
					<li>Tags should be comma-separated</li>
				</ul>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" class="cursor-pointer">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
