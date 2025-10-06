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
	import { Upload } from 'lucide-svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { CloudIcon, X } from 'lucide-svelte';

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

	// Initialize form data when dialog opens
	$effect(() => {
		if (open) {
			editFormData = {
				name: beverage.name,
				description: beverage.description || '',
				image_url: beverage.image_url || '',
				execution: beverage.execution || ''
			};
		}
	});

	async function handleEditSuccess(text:string){
		await onUpdate();
		toast.show = true;
		toast.status = true;
		toast.title = 'Success';
		toast.text = text;
	}

	function handleEditError(text:string){
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
				showProgress('updating beverage....');
				await submit();

				if (editBeverage?.issues) {
					handleEditError(editBeverage.issues);
					return;
				}

				if (editBeverage.result?.success) {
					handleEditSuccess(editBeverage.result?.message || 'Success update beverage');
				} else {
					handleEditError(editBeverage.result?.message || 'An unexpected error occurred.');
				}

				hideProgress();
				form.reset();
			})}
		>
			<!-- Name -->
			<div class="space-y-2">
				<Label for="edit-name">Name *</Label>
				<Input id="edit-name" bind:value={editFormData.name} placeholder="e.g., Espresso" />
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description">Description</Label>
				<Textarea
					id="edit-description"
					bind:value={editFormData.description}
					placeholder="Brief description of the beverage..."
					rows={3}
					class="resize-none"
				/>
			</div>

			<div class="space-y-2">
				{#if editFormData.image_url}
					<div class="relative h-56 w-full overflow-hidden rounded-lg">
						<img
							src={editFormData.image_url}
							alt={editFormData.name}
							class="h-full w-full object-cover"
						/>
						<Button
							variant="secondary"
							type="button"
							size="icon"
							class="absolute top-2 right-2 cursor-pointer"
							aria-label="Αφαίρεση εικόνας"
							onclick={() => {
								editFormData.image_url = '';
							}}
						>
							<X class="h-4 w-4" />
						</Button>
					</div>
				{:else}
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							<Empty.Media variant="icon">
								<CloudIcon />
							</Empty.Media>
							<Empty.Title>Beverage image empty</Empty.Title>
							<Empty.Description>
								Upload image for the beverage {editFormData.name}.
							</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button variant="outline" size="sm">Upload Files</Button>
						</Empty.Content>
					</Empty.Root>
				{/if}
			</div>

			<!-- Execution -->
			<div class="space-y-2">
				<Label for="edit-execution">Execution Instructions *</Label>
				<Textarea
					id="edit-execution"
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
				</ul>
			</div>
		</form>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" class="cursor-pointer">Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
