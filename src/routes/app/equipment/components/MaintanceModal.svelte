<script lang="ts">
	import { AlertCircle, X } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FileDropZone, MEGABYTE } from '$lib/components/ui/file-drop-zone';
	import type { Equipment } from '$lib/models/equipment.types';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { displaySize, type FileDropZoneProps } from '$lib/components/ui/file-drop-zone';
	import { Progress } from '$lib/components/ui/progress';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms'; // [cite: 27]
	import type { SubmitFunction } from '@sveltejs/kit'; //
	import { SvelteDate } from 'svelte/reactivity';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	let { equipment, open = $bindable(false) }: { equipment: Equipment; open: boolean } = $props();

	let issueDescription = $state('');
	let actionTaken = $state('');
	let isSubmitting = $state(false);

	type UploadedFile = {
		name: string;
		type: string;
		size: number;
		uploadedAt: number;
		url: Promise<string>;
		file: File;
	};

	let files = $state<UploadedFile[]>([]);

	const onUpload: FileDropZoneProps['onUpload'] = async (newFiles) => {
		await Promise.allSettled(newFiles.map((file) => uploadFile(file)));
	};

	const onFileRejected: FileDropZoneProps['onFileRejected'] = async ({ reason, file }) => {
		toast.error(`${file.name} failed to upload!`, { description: reason });
	};

	const uploadFile = async (file: File) => {
		if (files.find((f) => f.name === file.name)) return;

		const urlPromise = new Promise<string>((resolve) => {
			sleep(1000).then(() => resolve(URL.createObjectURL(file)));
		});

		files.push({
			name: file.name,
			type: file.type,
			size: file.size,
			uploadedAt: Date.now(),
			url: urlPromise,
			file: file
		});

		await urlPromise;
	};

	let date = new SvelteDate();
	onDestroy(async () => {
		for (const file of files) {
			URL.revokeObjectURL(await file.url);
		}
	});

	$effect(() => {
		const interval = setInterval(() => {
			date.setTime(Date.now());
		}, 100);
		return () => clearInterval(interval);
	});

	const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
		isSubmitting = true;
		files.forEach((uploadedFile) => {
			formData.append('images', uploadedFile.file);
		});

		if (files.length === 0 && !issueDescription) {
			toast.error('Please add a description or image.');
			cancel();
			isSubmitting = false;
		}

		return async ({ result, update }) => {
			isSubmitting = false;
			console.log(result);
			if (result.type === 'success') {
				showSuccessToast('Success', 'Maintenance log submitted successfully!');
				files = [];
				open = false;
				await update();
			} else if (result.type === 'failure') {
				showFailToast('Failed to submit log.', (result.data?.message as string) || 'Unknown error');
			} else if (result.type === 'error') {
				showFailToast('Failed to submit log.', 'Unknown error');
			}
		};
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<AlertCircle class="h-5 w-5 text-orange-600" />
				Report Equipment Issue
			</Dialog.Title>
			<Dialog.Description>
				Submit a maintenance log for <span class="font-semibold text-foreground"
					>{equipment.name}</span
				>.
				{#if equipment.model}
					(Model: {equipment.model})
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<form
			action="?/addMaintenanceLog"
			method="POST"
			enctype="multipart/form-data"
			class="space-y-4 py-4"
			use:enhance={handleSubmit}
		>
			<input type="hidden" name="equipmentId" value={equipment.id} />

			<div class="space-y-2">
				<label
					for="issue"
					class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Issue Description <span class="text-red-500">*</span>
				</label>
				<Textarea
					id="issue"
					name="issueDescription"
					bind:value={issueDescription}
					placeholder="Describe the problem in detail..."
					class="min-h-24"
				/>
			</div>

			<div class="space-y-2">
				<label
					for="action"
					class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Action Taken <span class="text-red-500">*</span>
				</label>
				<Textarea
					id="action"
					name="actionTaken"
					bind:value={actionTaken}
					placeholder="What action was taken to resolve the issue..."
					class="min-h-20"
				/>
			</div>

			<div class="space-y-2">
				<div class="flex w-full flex-col gap-2 rounded-md p-4">
					<FileDropZone
						{onUpload}
						{onFileRejected}
						maxFileSize={2 * MEGABYTE}
						accept="image/*"
						maxFiles={4}
						fileCount={files.length}
						name="images[]"
					/>

					<div class="flex flex-col gap-2">
						{#each files as file, i (file.name)}
							<div class="flex items-center justify-between gap-2 rounded-md p-2">
								<div class="flex items-center gap-3">
									{#await file.url then src}
										<div class="relative size-10 overflow-hidden rounded-md">
											<img
												{src}
												alt={file.name}
												class="absolute inset-0 h-full w-full object-cover"
											/>
										</div>
									{/await}
									<div class="flex flex-col">
										<span class="text-sm font-medium">{file.name}</span>
										<span class="text-xs text-muted-foreground">{displaySize(file.size)}</span>
									</div>
								</div>

								<div class="flex items-center gap-2">
									{#await file.url}
										<Progress
											class="h-2 w-20"
											value={((date.getTime() - file.uploadedAt) / 1000) * 100}
											max={100}
										/>
									{:then url}
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-muted-foreground hover:text-destructive"
											onclick={() => {
												URL.revokeObjectURL(url);
												files = files.filter((_, index) => index !== i);
											}}
										>
											<X class="h-4 w-4" />
										</Button>
									{/await}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (open = false)}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						Submitting... <Spinner class="ml-2 h-4 w-4" />
					{:else}
						Submit Issue
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
