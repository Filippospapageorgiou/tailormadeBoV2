<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { FileDropZone, MEGABYTE, displaySize } from '$lib/components/ui/file-drop-zone';
	import { Progress } from '$lib/components/ui/progress';
	import { X, Plus, Wrench } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import { addVisitAction } from '$lib/api/trainers/equipment/data.remote.js';
	import { VISIT_ACTION_LABELS, type VisitActionType } from '$lib/models/equipment.types.js';
	import { SvelteDate } from 'svelte/reactivity';
	import { onDestroy } from 'svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	let {
		open = $bindable(false),
		visitId,
		equipmentId,
		equipmentName,
		onActionAdded
	}: {
		open: boolean;
		visitId: number;
		equipmentId: number;
		equipmentName: string;
		onActionAdded?: () => void;
	} = $props();

	let actionType = $state('');
	let description = $state('');
	let cost = $state('');
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
	let date = new SvelteDate();

	$effect(() => {
		const interval = setInterval(() => {
			date.setTime(Date.now());
		}, 100);
		return () => clearInterval(interval);
	});

	onDestroy(async () => {
		for (const file of files) {
			URL.revokeObjectURL(await file.url);
		}
	});

	const onUpload = async (newFiles: File[]) => {
		await Promise.allSettled(newFiles.map((file) => uploadFile(file)));
	};

	const onFileRejected = async ({ reason, file }: { reason: string; file: File }) => {
		toast.error(`${file.name} απέτυχε!`, { description: reason });
	};

	const uploadFile = async (file: File) => {
		if (files.find((f) => f.name === file.name)) return;
		const urlPromise = new Promise<string>((resolve) => {
			setTimeout(() => resolve(URL.createObjectURL(file)), 500);
		});
		files.push({
			name: file.name,
			type: file.type,
			size: file.size,
			uploadedAt: Date.now(),
			url: urlPromise,
			file
		});
		await urlPromise;
	};

	// Action type options
	const actionOptions = Object.entries(VISIT_ACTION_LABELS).map(([value, label]) => ({
		value,
		label
	}));

	let triggerLabel = $derived(
		actionType ? VISIT_ACTION_LABELS[actionType as VisitActionType] : 'Επιλέξτε ενέργεια...'
	);

	async function handleSubmit() {
		if (!actionType || !description.trim()) {
			showFailToast('Σφάλμα', 'Επιλέξτε ενέργεια και προσθέστε περιγραφή');
			return;
		}

		isSubmitting = true;

		try {
			// Upload images to storage first
			let imageUrls: string[] = [];
			if (files.length > 0) {
				const { createBrowserClient } = await import('$lib/supabase/browse');
				const supabase = createBrowserClient();

				for (const f of files) {
					const ext = f.name.split('.').pop() || 'jpg';
					const path = `visit-${visitId}/${equipmentId}-${Date.now()}.${ext}`;
					const buffer = await f.file.arrayBuffer();

					const { error: uploadError } = await supabase.storage
						.from('trainer-visit-images')
						.upload(path, buffer, { contentType: f.type, upsert: false });

					if (uploadError) {
						console.error('Upload error:', uploadError);
						continue;
					}

					const {
						data: { publicUrl }
					} = supabase.storage.from('trainer-visit-images').getPublicUrl(path);
					imageUrls.push(publicUrl);
				}
			}

			const result = await addVisitAction({
				visitId,
				equipmentId,
				actionType,
				description: description.trim(),
				images: imageUrls.length > 0 ? imageUrls : undefined,
				cost: cost ? parseFloat(cost) : undefined
			});

			if (result.success) {
				showSuccessToast('Επιτυχία', 'Η ενέργεια καταχωρήθηκε');
				resetForm();
				open = false;
				onActionAdded?.();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία καταχώρησης');
			}
		} catch (err) {
			console.error('[VisitActionForm] Error:', err);
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		actionType = '';
		description = '';
		cost = '';
		files = [];
	}

	// Reset when dialog opens
	$effect(() => {
		if (open) {
			resetForm();
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-full max-w-full overflow-y-auto px-4 sm:max-w-lg sm:px-6">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-lg">
				<Wrench class="h-5 w-5 text-primary" />
				Νέα Ενέργεια
			</Dialog.Title>
			<Dialog.Description>
				Εξοπλισμός: <span class="font-semibold text-foreground">{equipmentName}</span>
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Action Type -->
			<div class="space-y-2">
				<Label class="text-sm font-medium">
					Τύπος Ενέργειας <span class="text-red-500">*</span>
				</Label>
				<Select.Root type="single" name="actionType" bind:value={actionType}>
					<Select.Trigger class="w-full">
						{triggerLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each actionOptions as option}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label class="text-sm font-medium">
					Περιγραφή <span class="text-red-500">*</span>
				</Label>
				<Textarea
					bind:value={description}
					placeholder="Τι έγινε, τι παρατηρήθηκε..."
					class="min-h-20 text-sm"
				/>
			</div>

			<!-- Cost -->
			<div class="space-y-2">
				<Label class="text-sm font-medium">Κόστος (προαιρετικό)</Label>
				<Input
					type="number"
					step="0.01"
					min="0"
					placeholder="0.00"
					bind:value={cost}
					class="text-sm"
				/>
			</div>

			<!-- Images -->
			<div class="space-y-2">
				<Label class="text-sm font-medium">Φωτογραφίες (προαιρετικό)</Label>
				<div class="flex w-full flex-col gap-2 rounded-md bg-muted/50 p-2">
					<FileDropZone
						{onUpload}
						{onFileRejected}
						maxFileSize={5 * MEGABYTE}
						accept="image/*"
						maxFiles={4}
						fileCount={files.length}
						name="visit-images"
					/>

					{#if files.length > 0}
						<div class="flex max-h-40 flex-col gap-2 overflow-y-auto">
							{#each files as file, i (file.name)}
								<div class="flex items-center justify-between gap-2 rounded-md bg-background p-2">
									<div class="flex min-w-0 items-center gap-2">
										{#await file.url then src}
											<div class="relative size-8 shrink-0 overflow-hidden rounded-md">
												<img
													{src}
													alt={file.name}
													class="absolute inset-0 h-full w-full object-cover"
												/>
											</div>
										{/await}
										<div class="flex min-w-0 flex-col">
											<span class="truncate text-xs font-medium">{file.name}</span>
											<span class="text-[10px] text-muted-foreground">{displaySize(file.size)}</span
											>
										</div>
									</div>
									<div class="flex shrink-0 items-center">
										{#await file.url}
											<Progress
												class="h-2 w-12"
												value={((date.getTime() - file.uploadedAt) / 500) * 100}
												max={100}
											/>
										{:then url}
											<Button
												type="button"
												variant="ghost"
												size="icon"
												class="h-6 w-6 text-muted-foreground hover:text-destructive"
												onclick={() => {
													URL.revokeObjectURL(url);
													files = files.filter((_, index) => index !== i);
												}}
											>
												<X class="h-3 w-3" />
											</Button>
										{/await}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<Dialog.Footer class="flex-col-reverse gap-2 sm:flex-row">
			<Button
				variant="outline"
				onclick={() => (open = false)}
				disabled={isSubmitting}
				class="w-full sm:w-auto"
			>
				Ακύρωση
			</Button>
			<Button
				onclick={handleSubmit}
				disabled={isSubmitting || !actionType || !description.trim()}
				class="w-full sm:w-auto"
			>
				{#if isSubmitting}
					Καταχώρηση... <Spinner class="ml-2 h-4 w-4" />
				{:else}
					<Plus class="mr-1.5 h-3.5 w-3.5" />
					Καταχώρηση Ενέργειας
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
