<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { editBeverage } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Upload, X, CloudIcon } from 'lucide-svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';

	let {
		open = $bindable(),
		beverage,
		onUpdate
	}: {
		open: boolean;
		beverage: Beverage;
		onUpdate: () => Promise<void>;
	} = $props();

	let editFormData = $state({
		name: '',
		description: '',
		image_url: '',
		execution: ''
	});

	// File handling
	let files: FileList | undefined = $state();
	let previewUrl = $state('');
	let imageCleared = $state(false);

	// Initialize form data when dialog opens
	$effect(() => {
		if (open) {
			editFormData = {
				name: beverage.name,
				description: beverage.description || '',
				image_url: beverage.image_url || '',
				execution: beverage.execution || ''
			};
			// Reset file input and preview
			files = undefined;
			previewUrl = '';
			imageCleared = false;
		}
	});

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

	// Determine which image to show
	let displayImage = $derived(previewUrl || editFormData.image_url);

	async function handleEditSuccess(text: string) {
		await onUpdate();
		toast.show = true;
		toast.status = true;
		toast.title = 'Success';
		toast.text = text;
	}

	function handleEditError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Error';
		toast.text = text;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Edit Beverage</Dialog.Title>
			<Dialog.Description>
				Make changes to the beverage details. Click save when you're done.
			</Dialog.Description>
		</Dialog.Header>
		<form
			class="space-y-4 py-4"
			enctype="multipart/form-data"
			{...editBeverage.enhance(async ({ form, data, submit }) => {
				open = false;
				showProgress('Updating beverage...');
				await submit();

				if (editBeverage.result?.success) {
					handleEditSuccess(editBeverage.result?.message || 'Successfully updated beverage');
				} else {
					handleEditError(editBeverage.result?.message || 'An unexpected error occurred.');
				}

				hideProgress();
				form.reset();
			})}
		>
			<!-- Hidden ID field -->
			<input type="hidden" {...editBeverage.fields.id.as('text')} value={beverage.id} />
			<input type="hidden" value={imageCleared} />

			<!-- Name -->
			<div class="space-y-2">
				<Label for="edit-name">Name *</Label>
				<Input
					id="edit-name"
					{...editBeverage.fields.name.as('text')}
					bind:value={editFormData.name}
					placeholder="e.g., Espresso"
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description">Description</Label>
				<Textarea
					id="edit-description"
					{...editBeverage.fields.description.as('text')}
					bind:value={editFormData.description}
					placeholder="Brief description of the beverage..."
					rows={3}
					class="resize-none"
				/>
			</div>

			<!-- Image Upload Section -->
			<div class="space-y-2">
				<Label>Beverage Image</Label>
				<Input
					id="file-upload"
					{...editBeverage.fields.image_url.as('file')}
					accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
					bind:files
					class="hidden"
				/>
				{#if displayImage}
					<div class="relative h-56 w-full overflow-hidden rounded-lg border border-gray-200">
						<img
							src={displayImage}
							alt={editFormData.name || 'Beverage preview'}
							class="h-full w-full object-cover"
						/>
						<div class="absolute top-2 right-2 flex gap-2">
							<label
								for="file-upload"
								class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-secondary text-sm font-medium text-secondary-foreground shadow-md transition-colors hover:bg-secondary/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
							>
								<Upload class="h-4 w-4" />
								<span class="sr-only">Change Image</span>
							</label>
						</div>
						{#if previewUrl}
							<div
								class="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white"
							>
								New image selected
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Execution -->
			<div class="space-y-2">
				<Label for="edit-execution">Execution Instructions *</Label>
				<Textarea
					id="edit-execution"
					{...editBeverage.fields.execution.as('text')}
					bind:value={editFormData.execution}
					placeholder="Step-by-step instructions... Use '- ' for bullet points"
					rows={8}
					class="resize-none font-mono text-sm"
				/>
			</div>

			<div class="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
				<p class="font-medium">Tips:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Required fields</li>
					<li>Use "- " at the start of lines in execution for bullet points</li>
					<li>Upload a new image to replace the existing one</li>
				</ul>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" class="cursor-pointer">Save changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
