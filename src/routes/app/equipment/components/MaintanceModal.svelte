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
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
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
	<Dialog.Content class="max-h-[90vh] w-full max-w-full overflow-y-auto px-4 sm:max-w-2xl sm:px-6">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-lg sm:text-xl">
				<AlertCircle class="h-5 w-5 flex-shrink-0 text-orange-600" />
				<span class="truncate">Report Equipment Issue</span>
			</Dialog.Title>
			<Dialog.Description class="text-sm sm:text-base">
				Submit a maintenance log for <span class="font-semibold break-words text-foreground"
					>{equipment.name}</span
				>.
				{#if equipment.model}
					<span class="block sm:inline">(Model: {equipment.model})</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<form
			action="?/addMaintenanceLog"
			method="POST"
			enctype="multipart/form-data"
			class="space-y-3 py-4 sm:space-y-4"
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
					class="min-h-20 text-sm sm:min-h-24"
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
					class="min-h-16 text-sm sm:min-h-20"
				/>
			</div>

			<div class="space-y-2">
				<div class="flex w-full flex-col gap-2 rounded-md bg-muted/50 p-2 sm:p-4">
					<FileDropZone
						{onUpload}
						{onFileRejected}
						maxFileSize={2 * MEGABYTE}
						accept="image/*"
						maxFiles={4}
						fileCount={files.length}
						name="images[]"
					/>

					<div class="flex max-h-48 flex-col gap-2 overflow-y-auto sm:max-h-64">
						{#each files as file, i (file.name)}
							<div class="flex items-center justify-between gap-2 rounded-md bg-background p-2">
								<div class="flex min-w-0 items-center gap-2 sm:gap-3">
									{#await file.url then src}
										<div
											class="relative size-8 flex-shrink-0 overflow-hidden rounded-md sm:size-10"
										>
											<img
												{src}
												alt={file.name}
												class="absolute inset-0 h-full w-full object-cover"
											/>
										</div>
									{/await}
									<div class="flex min-w-0 flex-col">
										<span class="truncate text-xs font-medium sm:text-sm">{file.name}</span>
										<span class="text-xs text-muted-foreground">{displaySize(file.size)}</span>
									</div>
								</div>

								<div class="flex flex-shrink-0 items-center gap-1 sm:gap-2">
									{#await file.url}
										<Progress
											class="h-2 w-12 sm:w-20"
											value={((date.getTime() - file.uploadedAt) / 1000) * 100}
											max={100}
										/>
									{:then url}
										<Button
											type="button"
											variant="ghost"
											size="icon"
											class="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
											onclick={() => {
												URL.revokeObjectURL(url);
												files = files.filter((_, index) => index !== i);
											}}
										>
											<X class="h-3 w-3 sm:h-4 sm:w-4" />
										</Button>
									{/await}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<Dialog.Footer class="flex-col-reverse gap-2 pt-2 sm:flex-row sm:gap-3">
				<Button
					type="button"
					variant="outline"
					onclick={() => (open = false)}
					disabled={isSubmitting}
					class="w-full sm:w-auto"
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting} class="w-full sm:w-auto">
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
