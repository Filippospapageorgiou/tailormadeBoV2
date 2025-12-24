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
	import { X, CloudIcon, ImagePlus } from 'lucide-svelte';
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

	// Track existing images (URLs to keep)
	let existingImages = $state<string[]>([...blog.images]);
	
	// Track new files to upload
	let newFiles: FileList | undefined = $state();
	let fileInput: HTMLInputElement;

	// Derive preview URLs for new files
	let newPreviewUrls = $derived(
		newFiles ? Array.from(newFiles).map((file) => ({
			file,
			url: URL.createObjectURL(file)
		})) : []
	);

	// Combine existing images + new file previews for display
	let allPreviews = $derived([
		...existingImages.map(url => ({ type: 'existing' as const, url })),
		...newPreviewUrls.map(({ file, url }) => ({ type: 'new' as const, url, file }))
	]);

	// Sync formData when blog prop changes
	$effect(() => {
		formData = {
			title: blog.title,
			description: blog.description || '',
			content: blog.content,
			tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
			published: blog.published
		};
		existingImages = [...blog.images];
		newFiles = undefined;
		if (fileInput) {
			fileInput.value = '';
		}
	});

	function removeImage(index: number) {
		const existingCount = existingImages.length;
		
		if (index < existingCount) {
			// Remove from existing images array
			existingImages = existingImages.filter((_, i) => i !== index);
		} else {
			// Remove from new files
			const newFileIndex = index - existingCount;
			if (!newFiles) return;

			const dt = new DataTransfer();
			Array.from(newFiles).forEach((file, i) => {
				if (i !== newFileIndex) dt.items.add(file);
			});

			fileInput.files = dt.files;
			newFiles = dt.files.length > 0 ? dt.files : undefined;
		}
	}

	function triggerFileInput() {
		fileInput?.click();
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
				hideProgress();
				form.reset();
			})}
		>
			<!-- Hidden ID field -->
			<input type="hidden" {...editBlog.fields.id.as('text')} value={blog.id.toString()} />

			<!-- Hidden field for existing images -->
			<input 
				type="hidden" 
				{...editBlog.fields.existingImages.as('text')}
				value={JSON.stringify(existingImages)} 
			/>

			<!-- Title -->
			<div class="space-y-2">
				<Label for="edit-title">Title *</Label>
				<Input
					id="edit-title"
					{...editBlog.fields.title.as('text')}
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
					{...editBlog.fields.description.as('text')}
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
					{...editBlog.fields.content.as('text')}
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
					{...editBlog.fields.tags.as('text')}
					bind:value={formData.tags}
					placeholder="Comma-separated tags: coffee, latte, tutorial"
				/>
			</div>

			<!-- Images Section -->
			<div class="space-y-2">
				<Label>Featured Images (up to 4)</Label>

				<!-- File input - always in DOM but visually hidden when previews exist -->
				<input
					bind:this={fileInput}
					id="edit-dropzone-file"
					type="file"
					accept="image/*"
					name="newImages[]"
					multiple
					bind:files={newFiles}
					class={allPreviews.length > 0 ? 'hidden' : ''}
				/>

				<!-- Empty state - show when no images -->
				{#if allPreviews.length === 0}
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							<Empty.Media variant="icon">
								<CloudIcon />
							</Empty.Media>
							<Empty.Title>No images selected</Empty.Title>
							<Empty.Description>Upload up to 4 images for your blog post</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button
								type="button"
								variant="outline"
								onclick={triggerFileInput}
								class="cursor-pointer"
							>
								<ImagePlus class="mr-2 h-4 w-4" />
								Select Images
							</Button>
						</Empty.Content>
					</Empty.Root>
				{/if}

				<!-- Preview grid - show when images exist -->
				{#if allPreviews.length > 0}
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-3">
							{#each allPreviews as preview, index}
								<div class="group relative aspect-video overflow-hidden rounded-lg border">
									<img 
										src={preview.url} 
										alt="Preview {index + 1}" 
										class="h-full w-full object-cover" 
									/>
									<Button
										variant="secondary"
										type="button"
										onclick={() => removeImage(index)}
										class="absolute right-2 top-2 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
										aria-label="Remove image"
									>
										<X class="h-4 w-4" />
									</Button>
								</div>
							{/each}
						</div>

						<!-- Add more button if less than 4 images -->
						{#if allPreviews.length < 4}
							<Button
								type="button"
								variant="outline"
								onclick={triggerFileInput}
								class="w-full cursor-pointer"
							>
								<ImagePlus class="mr-2 h-4 w-4" />
								Add More Images ({allPreviews.length}/4)
							</Button>
						{/if}
					</div>
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
					{...editBlog.fields.published.as('text')}
					value={formData.published.toString()}
				/>
			</div>

			<div class="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
				<p class="font-medium">Tips:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Required fields</li>
					<li>Existing images are preserved unless removed</li>
					<li>Remove any image by clicking the X button on hover</li>
					<li>Add new images (up to 4 total)</li>
					<li>Only new images will be uploaded to save bandwidth</li>
					<li>Each image must be less than 5MB</li>
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