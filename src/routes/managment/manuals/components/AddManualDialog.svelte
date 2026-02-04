<script lang="ts">
	import { createManual } from '../../../../lib/api/manual/data.remote';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import type { ManualCategory } from '$lib/models/manuals.types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import {
		FileDropZone,
		MEGABYTE,
		ACCEPT_IMAGE,
		displaySize
	} from '$lib/components/ui/file-drop-zone';
	import { toast } from 'svelte-sonner';
	import { X, ImagePlus } from 'lucide-svelte';
	import { onDestroy, untrack } from 'svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
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
		category: '' as string,
		published: false
	});

	// --- Blueprint: Structured File State ---
	type UploadedFile = {
		name: string;
		size: number;
		url: string;
		file: File;
	};

	let fileInput: HTMLInputElement | undefined= $state();

	// Helper function to keep the hidden input in sync with our state
    // This is the logic that was previously in the $effect
    function syncFileInput() {
        if (!fileInput) return;
        const dataTransfer = new DataTransfer();
        files.forEach((f) => dataTransfer.items.add(f.file));
        fileInput.files = dataTransfer.files;
    }


	let files = $state<UploadedFile[]>([]);

	const handleUpload = async (newFiles: File[]) => {
        const remaining = 4 - files.length;
        const toAdd = newFiles.slice(0, remaining);

        toAdd.forEach((file) => {
            if (files.find((f) => f.name === file.name)) return;
            files.push({
                name: file.name,
                size: file.size,
                url: URL.createObjectURL(file),
                file: file
            });
        });

        // Sync immediately after modification
        syncFileInput();
    };

	// --- Blueprint: Memory Management ---
	onDestroy(() => {
		files.forEach((file) => URL.revokeObjectURL(file.url));
	});

	function removeFile(index: number) {
		URL.revokeObjectURL(files[index].url);
		files = files.filter((_, i) => i !== index);
		// Sync immediately after modification
        syncFileInput();
	}

	$effect(() => {
		// We want to run this whenever the 'files' array changes
		const currentFiles = files;

		untrack(() => {
			if (!fileInput) return;
			const dataTransfer = new DataTransfer();
			currentFiles.forEach((f) => dataTransfer.items.add(f.file));
			fileInput.files = dataTransfer.files;
		});
	});

	function resetForm() {
		formData = {
			title: '',
			description: '',
			content: '',
			category: '',
			published: false
		};
		files.forEach((f) => URL.revokeObjectURL(f.url));
		files = [];

		syncFileInput();
	}

	const categoryEntries = Object.entries(MANUAL_CATEGORY_LABELS) as [ManualCategory, string][];

	let isSubmitting = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
		<Dialog.Header>
			<Dialog.Title class="font-mono text-xl tracking-wide">Νέο Εγχειρίδιο</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Συμπληρώστε τα στοιχεία για να δημιουργήσετε νέο εγχειρίδιο εκπαίδευσης
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-5 py-4"
			enctype="multipart/form-data"
			{...createManual.enhance(async ({ form, submit }) => {
				isSubmitting = true;
				await submit();

				if (createManual.result?.success) {
					await onSuccess();
					toast.success(createManual.result?.message || 'Το εγχειρίδιο δημιουργήθηκε επιτυχώς');
					resetForm();
					open = false;
				} else {
					toast.error(createManual.result?.message || 'Παρουσιάστηκε σφάλμα.');
				}
				isSubmitting = false;
			})}
		>
			<div class="space-y-1.5">
				<Label
					for="title"
					class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>Τίτλος *</Label
				>
				<Input
					id="title"
					{...createManual.fields.title.as('text')}
					bind:value={formData.title}
					placeholder="π.χ. Οδηγός Λειτουργίας Espresso Machine"
					required
					class="font-medium"
				/>
			</div>

			<div class="space-y-1.5">
				<Label
					for="description"
					class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>Σύντομη Περιγραφή</Label
				>
				<Textarea
					id="description"
					{...createManual.fields.description.as('text')}
					bind:value={formData.description}
					placeholder="Σύντομη περιγραφή εγχειριδίου..."
					rows={2}
					class="resize-none"
				/>
			</div>

			<div class="space-y-1.5">
				<Label
					for="content"
					class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>Περιεχόμενο *</Label
				>
				<Textarea
					id="content"
					{...createManual.fields.content.as('text')}
					bind:value={formData.content}
					placeholder="Γράψτε αναλυτικά το περιεχόμενο του εγχειριδίου..."
					rows={10}
					class="resize-none font-mono text-sm leading-relaxed"
					required
				/>
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>Κατηγορία *</Label
				>
				<Select.Root type="single" bind:value={formData.category}>
					<Select.Trigger class="w-full">
						{formData.category
							? MANUAL_CATEGORY_LABELS[formData.category as ManualCategory]
							: 'Επιλέξτε κατηγορία'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Κατηγορίες</Select.Label>
							{#each categoryEntries as [value, label]}
								<Select.Item {value} {label}>{label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<input
					type="hidden"
					{...createManual.fields.category.as('text')}
					value={formData.category}
				/>
			</div>

			<div class="space-y-2">
				<Label class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>Εικόνες (μέχρι 4)</Label
				>
				<input
					{...createManual.fields.media.as('file multiple')}
					class="hidden"
					bind:this={fileInput}
				/>
			</div>
			<div class="space-y-2">
				{#if files.length < 4}
					<FileDropZone
						accept={ACCEPT_IMAGE}
						maxFiles={4}
						fileCount={files.length}
						maxFileSize={5 * MEGABYTE}
						onUpload={handleUpload}
						onFileRejected={({ reason }) => toast.error(reason)}
						class={files.length > 0 ? 'h-24' : 'h-40'}
					/>
				{/if}
			</div>
			<div class="space-y-2">
				<div class="flex flex-col gap-2">
					{#each files as file, i (file.name)}
						<div
							class="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-background p-2"
						>
							<div class="flex items-center gap-3">
								<div class="relative size-10 overflow-hidden rounded-md">
									<img
										src={file.url}
										alt={file.name}
										class="absolute inset-0 h-full w-full object-cover"
									/>
								</div>
								<div class="flex flex-col">
									<span class="truncate text-xs font-medium">{file.name}</span>
									<span class="text-xs text-muted-foreground">{displaySize(file.size)}</span>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:text-destructive"
								onclick={() => removeFile(i)}
							>
								<X class="h-4 w-4" />
							</Button>
						</div>
					{/each}
				</div>
			</div>

			<div
				class="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
			>
				<div>
					<p class="text-sm font-medium">Δημοσίευση αμέσως</p>
					<p class="text-xs text-muted-foreground">
						Το εγχειρίδιο θα είναι ορατό στους εργαζομένους
					</p>
				</div>
				<Switch id="published" bind:checked={formData.published} class="cursor-pointer" />
				<input
					type="hidden"
					{...createManual.fields.published.as('text')}
					value={formData.published.toString()}
				/>
			</div>

			<input type="hidden" {...createManual.fields.display_order.as('text')} value="0" />
			<div class="rounded-md p-3 text-xs">
				<p class="font-medium">Tips:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Required fields</li>
					<li>Upload up to 4 images (JPEG, PNG, WebP, GIF)</li>
					<li>Each image must be less than 5MB</li>
					<li>Content must be more then 10 characters</li>
					<li>Use the switch to publish immediately or save as draft</li>
				</ul>
			</div>
			<Dialog.Footer class="gap-2 pt-2">
				<Button variant="outline" type="button" onclick={() => (open = false)}>Ακύρωση</Button>
				<Button type="submit" class="cursor-pointer gap-2">
					{#if isSubmitting}
						<Spinner /> Δημιουργία....
					{:else}
						<ImagePlus class="h-4 w-4" />
						Δημιουργία
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
