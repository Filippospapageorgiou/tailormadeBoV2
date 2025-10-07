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
	import { X, CloudIcon } from 'lucide-svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';

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

	function refreshInputFields() {
		files = undefined;
		previewUrl = '';
		formData = {
			title: '',
			description: '',
			content: '',
			category: '',
			tags: '',
			published: false
		};
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
				refreshInputFields();
				hideProgress();
				form.reset();
			})}
		>
			<Input
				type="file"
				name={addBlog.field('images')}
				accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
				class="hidden"
				bind:files
				bind:this={fileInput}
			/>
			<!-- Title -->
			<div class="space-y-2">
				<Label for="title">Title *</Label>
				<Input
					id="title"
					name={addBlog.field('title')}
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
					name={addBlog.field('description')}
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
					name={addBlog.field('content')}
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
					name={addBlog.field('tags')}
					bind:value={formData.tags}
					placeholder="Comma-separated tags: coffee, latte, tutorial"
				/>
			</div>

			<!-- Image Upload -->
			<div class="space-y-2">
				{#if !previewUrl}
					<Label>Featured Image</Label>
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							<Empty.Media variant="icon">
								<CloudIcon />
							</Empty.Media>
							<Empty.Title>No image selected</Empty.Title>
							<Empty.Description>Upload a featured image for your blog post</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Input
								type="file"
								accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
								bind:files
								bind:this={fileInput}
							/>
						</Empty.Content>
					</Empty.Root>
				{:else}
					<div class="relative w-full overflow-hidden rounded-lg border border-gray-200">
						<img src={previewUrl} alt="Blog preview" class="h-64 w-full object-cover" />
						<div class="absolute top-2 right-2 flex gap-2">
							<Button variant="secondary" onclick={refreshFiles}>
								<X class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Published Toggle -->
			<div class="flex items-center space-x-2">
				<Switch id="published" bind:checked={formData.published} class="cursor-pointer" />
				<Label for="published" class="cursor-pointer">Publish immediately</Label>
				<input
					type="hidden"
					name={addBlog.field('published')}
					value={formData.published.toString()}
				/>
			</div>

			<div class="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
				<p class="font-medium">Tips:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Required fields</li>
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
