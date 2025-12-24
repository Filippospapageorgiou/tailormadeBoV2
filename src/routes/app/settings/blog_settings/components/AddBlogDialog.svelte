<script lang="ts">
	import { addBlog } from '../data.remote';
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
	import { file } from 'zod';

	let {
		open = $bindable(),
		onSuccess
	}: {
		open: boolean;
		onSuccess: () => Promise<void>;
	} = $props();

	let formData = $state({
		title: '',
		description: '',
		content: '',
		category: '',
		tags: '',
		published: false
	});

	let files: FileList | undefined = $state();
	let fileInput: HTMLInputElement;

	
	let previewFiles = $derived(files ? Array.from(files) : []);
	let previewUrls = $derived(
		previewFiles.map((file) => ({
			file,
			url: URL.createObjectURL(file)
		}))
	);

	function removeFile(index: number) {
		if (!files) return;

		const dt = new DataTransfer();
		Array.from(files).forEach((file, i) => {
			if (i !== index) dt.items.add(file);
		});

		fileInput.files = dt.files;
		files = dt.files.length > 0 ? dt.files : undefined;
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

	function resetForm() {
		formData = {
			title: '',
			description: '',
			content: '',
			category: '',
			tags: '',
			published: false
		};
		files = undefined;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
		<Dialog.Header>
			<Dialog.Title>Create Blog Post</Dialog.Title>
			<Dialog.Description>Fill out the details to create a new blog post</Dialog.Description>
		</Dialog.Header>
		<form
			class="space-y-4 py-4"
			enctype="multipart/form-data"
			{...addBlog.enhance(async ({ form, submit }) => {
				open = false;
				showProgress('Creating blog post...');
				await submit();

				if (addBlog.result?.success) {
					handleSuccess(addBlog.result?.message || 'Successfully created blog post');
				} else {
					handleError(addBlog.result?.message || 'An unexpected error occurred.');
				}
				resetForm();
				hideProgress();
				form.reset();
			})}
		>
			<!-- Title -->
			<div class="space-y-2">
				<Label for="title">Title *</Label>
				<Input
					id="title"
					{...addBlog.fields.title.as('text')}
					bind:value={formData.title}
					placeholder="Enter blog post title..."
					required
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="description">Short Description</Label>
				<Textarea
					id="description"
					{...addBlog.fields.description.as('text')}
					bind:value={formData.description}
					placeholder="Brief description of the blog post..."
					rows={2}
					class="resize-none"
				/>
			</div>

			<!-- Content -->
			<div class="space-y-2">
				<Label for="content">Content *</Label>
				<Textarea
					id="content"
					{...addBlog.fields.content.as('text')}
					bind:value={formData.content}
					placeholder="Write your blog content here... You can use HTML formatting."
					rows={10}
					class="resize-none font-mono text-sm"
					required
				/>
			</div>

			<!-- Tags -->
			<div class="space-y-2">
				<Label for="tags">Tags</Label>
				<Input
					id="tags"
					{...addBlog.fields.tags.as('text')}
					bind:value={formData.tags}
					placeholder="Comma-separated tags: coffee, latte, tutorial"
				/>
			</div>

			<div class="space-y-2">
				<Label>Featured Images (up to 4)</Label>

				<!-- File input - always in DOM but visually hidden when previews exist -->
				<input
					bind:this={fileInput}
					id="dropzone-file"
					type="file"
					accept="image/*"
					name="images[]"
					multiple
					bind:files
					class={previewUrls.length > 0 ? 'hidden' : ''}
				/>

				<!-- Empty state - show when no files -->
				{#if previewUrls.length === 0}
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

				<!-- Preview grid - show when files are selected -->
				{#if previewUrls.length > 0}
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-3">
							{#each previewUrls as { file, url }, index}
								<div class="group relative aspect-video overflow-hidden rounded-lg border">
									<img src={url} alt={file.name} class="h-full w-full object-cover" />
									<Button
										variant="secondary"
										type="button"
										onclick={() => removeFile(index)}
										class="absolute right-2 top-2 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
										aria-label="Remove image"
									>
										<X class="h-4 w-4" />
									</Button>
									<div
										class="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white truncate"
									>
										{file.name}
									</div>
								</div>
							{/each}
						</div>

						<!-- Add more button if less than 4 images -->
						{#if previewUrls.length < 4}
							<Button
								type="button"
								variant="outline"
								onclick={triggerFileInput}
								class="w-full cursor-pointer"
							>
								<ImagePlus class="mr-2 h-4 w-4" />
								Add More Images ({previewUrls.length}/4)
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		

			<!-- Published Toggle -->
			<div class="flex items-center space-x-2">
				<Switch id="published" bind:checked={formData.published} class="cursor-pointer" />
				<Label for="published" class="cursor-pointer">Publish immediately</Label>
				<input
					type="hidden"
					{...addBlog.fields.published.as('text')}
					value={formData.published.toString()}
				/>
			</div>

			<div class="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
				<p class="font-medium">Tips:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Required fields</li>
					<li>Upload up to 4 images (JPEG, PNG, WebP, GIF)</li>
					<li>Each image must be less than 5MB</li>
					<li>Tags should be comma-separated</li>
					<li>Content supports HTML formatting</li>
					<li>Use the switch to publish immediately or save as draft</li>
				</ul>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" class="cursor-pointer">Create Blog Post</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
