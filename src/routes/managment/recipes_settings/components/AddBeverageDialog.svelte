<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { addBeverage } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Upload, X, CloudIcon } from 'lucide-svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
    import * as Avatar from '$lib/components/ui/avatar/index.js';

	let {
		open = $bindable(),
		onSuccess
	}: {
		open: boolean;
		onSuccess: () => Promise<void>;
	} = $props();

	let addFormData = $state({
		name: '',
		description: '',
		image_url: '',
		execution: ''
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

	async function handleEditSuccess(text: string) {
		await onSuccess();
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
			<Dialog.Title>Add Beverage</Dialog.Title>
			<Dialog.Description>Fill out all the nesecary fields to add a beverage</Dialog.Description>
		</Dialog.Header>
		<form
			class="space-y-4 py-4"
			enctype="multipart/form-data"
			{...addBeverage.enhance(async ({ form, data, submit }) => {
				open = false;
				showProgress('Adding beverage....');
				await submit();

				if (addBeverage.result?.success) {
					handleEditSuccess(addBeverage.result?.message || 'Successfully updated beverage');
				} else {
					handleEditError(addBeverage.result?.message || 'An unexpected error occurred.');
				}
				hideProgress();
				form.reset();
			})}
		>
			<Input
				id="file-upload"
				{...addBeverage.fields.image_url.as('file')}
				accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
				bind:files
                bind:this={fileInput}
				class="hidden"
			/>

			<div class="space-y-2">
				<Label for="edit-name">Name *</Label>
				<Input
					id="edit-name"
					{...addBeverage.fields.name.as('text')}
					bind:value={addFormData.name}
					placeholder="e.g., Espresso"
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description">Description</Label>
				<Textarea
					id="edit-description"
					{...addBeverage.fields.description.as('text')}
					bind:value={addFormData.description}
					placeholder="Brief description of the beverage..."
					rows={3}
					class="resize-none"
				/>
			</div>

			<div class="space-y-2">
				{#if !previewUrl}
					<Label>Beverage Image</Label>
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							<Empty.Media variant="icon">
								<CloudIcon />
							</Empty.Media>
							<Empty.Title>Beverage image empty</Empty.Title>
							<Empty.Description>Upload image for your new beverage</Empty.Description>
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
						<img
							src={previewUrl}
							alt={'Beverage preview'}
							class="h-64 w-full object-fit-contain"
						/>
						<div class="absolute top-2 right-2 flex gap-2">
							<Button variant="secondary" onclick={refreshFiles}>
                                <X class="h-4 w-4" />
                            </Button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Execution -->
			<div class="space-y-2">
				<Label for="edit-execution">Execution Instructions *</Label>
				<Textarea
					id="edit-execution"
					{...addBeverage.fields.execution.as('text')}
					bind:value={addFormData.execution}
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
				</ul>
			</div>
            <Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" class="cursor-pointer">Save changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
