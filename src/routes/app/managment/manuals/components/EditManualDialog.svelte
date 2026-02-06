<script lang="ts">
    import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
    import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { editManual } from '$lib/api/manual/data.remote';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Label } from '$lib/components/ui/label';
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Button } from '$lib/components/ui/button';
    import { Switch } from '$lib/components/ui/switch';
    import * as Select from '$lib/components/ui/select';
    import { FileDropZone, MEGABYTE, ACCEPT_IMAGE } from '$lib/components/ui/file-drop-zone';
    import { toast } from 'svelte-sonner';
    import { X, Save } from 'lucide-svelte';
    import { onDestroy, untrack } from 'svelte';
    import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Markdown from '$lib/components/custom/htmlMarkdown/markdown.svelte';

    let {
        open = $bindable(),
        manual,
        onSuccess
    }: {
        open: boolean;
        manual: ManualWithDetails;
        onSuccess: () => Promise<void>;
    } = $props();

    // Form State
    let formData = $state({
        title: '',
        description: '',
        content: '',
        category: '' as string,
        published: false
    });

    // File States
    let existingMedia = $state<string[]>([]);
    type NewUploadedFile = {
        file: File;
        url: string;
        name: string;
    };
    let newFiles = $state<NewUploadedFile[]>([]);
    let fileInput: HTMLInputElement | undefined = $state();
    let isSubmitting = $state(false);

    let totalCount = $derived(existingMedia.length + newFiles.length);

    /**
     * SYNC LOGIC: Explicitly updates the DOM file input.
     * This replaces the problematic $effect.
     */
    function syncFileInput() {
        if (!fileInput) return;
        const dataTransfer = new DataTransfer();
        newFiles.forEach((f) => dataTransfer.items.add(f.file));
        fileInput.files = dataTransfer.files;
    }

    $effect(() => {
        // We WANT to track 'manual'
        const currentManual = manual;

        untrack(() => {
            // We do NOT want to track updates to these local states
            formData = {
                title: currentManual.title,
                description: currentManual.description || '',
                content: currentManual.content,
                category: currentManual.category as string,
                published: currentManual.published
            };
            
            existingMedia = [...(currentManual.media || [])];
            
            // Memory cleanup
            newFiles.forEach((f) => URL.revokeObjectURL(f.url));
            newFiles = [];
            
            // Ensure hidden input is cleared
            syncFileInput(); 
        });
    });

    onDestroy(() => {
        newFiles.forEach((f) => URL.revokeObjectURL(f.url));
    });

    const handleUpload = async (filesToAdd: File[]) => {
        const remaining = 4 - totalCount;
        const toAdd = filesToAdd.slice(0, remaining);

        toAdd.forEach((file) => {
            if (newFiles.find((f) => f.name === file.name)) return;
            newFiles.push({
                file,
                url: URL.createObjectURL(file),
                name: file.name
            });
        });
        syncFileInput();
    };

    function removeExisting(url: string) {
        existingMedia = existingMedia.filter((m) => m !== url);
    }

    function removeNew(index: number) {
        URL.revokeObjectURL(newFiles[index].url);
        newFiles = newFiles.filter((_, i) => i !== index);
        syncFileInput();
    }

    const categoryEntries = Object.entries(MANUAL_CATEGORY_LABELS) as [ManualCategory, string][];
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
		<Dialog.Header>
			<Dialog.Title class="font-mono text-xl tracking-wide">Επεξεργασία Εγχειριδίου</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Ενημερώστε τα στοιχεία του εγχειριδίου <span class="font-medium text-foreground">#{manual.id}</span>
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-5 py-4"
			enctype="multipart/form-data"
			{...editManual.enhance(async ({ submit }) => {
				isSubmitting = true;
				await submit();

				if (editManual.result?.success) {
					await onSuccess();
					toast.success(editManual.result?.message || 'Το εγχειρίδιο ενημερώθηκε επιτυχώς');
					open = false;
				} else {
					toast.error(editManual.result?.message || 'Παρουσιάστηκε σφάλμα.');
				}
				isSubmitting = false;
			})}
		>
			<input type="hidden" {...editManual.fields.id.as('text')} value={manual.id.toString()} />
			<input type="hidden" {...editManual.fields.existingMedia.as('text')} value={JSON.stringify(existingMedia)} />
			<input type="hidden" {...editManual.fields.display_order.as('text')} value={manual.display_order.toString()} />
			
			<input 
				{...editManual.fields.newMedia.as('file multiple')} 
				class="hidden" 
				bind:this={fileInput} 
			/>

			<div class="space-y-1.5">
				<Label for="edit-title" class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Τίτλος *</Label>
				<Input
					id="edit-title"
					{...editManual.fields.title.as('text')}
					bind:value={formData.title}
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="edit-description" class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Σύντομη Περιγραφή</Label>
				<Textarea
					id="edit-description"
					{...editManual.fields.description.as('text')}
					bind:value={formData.description}
					rows={2}
					disabled={isSubmitting}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="edit-content" class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Περιεχόμενο *</Label>
				<Markdown
					bind:value={formData.content}
					placeholder="Write your admin instructions here..."
					minHeight="400px"
					maxHeight="600px"
					disabled={isSubmitting}
				/>
				<Textarea
					id="edit-content"
					class="hidden"
					{...editManual.fields.content.as('text')}
					bind:value={formData.content}
					rows={10}
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Κατηγορία *</Label>
				<Select.Root type="single" disabled={isSubmitting} bind:value={formData.category}>
					<Select.Trigger class="w-full">
						{formData.category ? MANUAL_CATEGORY_LABELS[formData.category as ManualCategory] : 'Επιλέξτε κατηγορία'}
					</Select.Trigger>
					<Select.Content>
						{#each categoryEntries as [value, label]}
							<Select.Item {value} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" {...editManual.fields.category.as('text')} value={formData.category} />
			</div>

			<div class="space-y-2">
				<Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Εικόνες ({totalCount}/4)
				</Label>

				<div class="grid grid-cols-2 gap-3">
					{#each existingMedia as url}
						<div class="group relative aspect-video overflow-hidden rounded-xl border border-border/50 bg-muted/30">
							<img src={url} alt="Existing" class="h-full w-full object-cover" />
							<div class="absolute left-2 top-2">
								<span class="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">Υπάρχον</span>
							</div>
							<Button
								variant="destructive"
								size="icon"
								type="button"
								onclick={() => removeExisting(url)}
								class="absolute right-2 top-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<X class="h-3.5 w-3.5" />
							</Button>
						</div>
					{/each}

					{#each newFiles as file, i}
						<div class="group relative aspect-video overflow-hidden rounded-xl border border-border/50 bg-muted/30">
							<img src={file.url} alt="New" class="h-full w-full object-cover" />
							<div class="absolute left-2 top-2">
								<span class="rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-medium text-primary-foreground backdrop-blur-sm">Νέο</span>
							</div>
							<Button
								variant="destructive"
								size="icon"
								type="button"
								onclick={() => removeNew(i)}
								class="absolute right-2 top-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<X class="h-3.5 w-3.5" />
							</Button>
						</div>
					{/each}
				</div>

				{#if totalCount < 4}
					<FileDropZone
						accept={ACCEPT_IMAGE}
						maxFiles={4}
						fileCount={totalCount}
						maxFileSize={5 * MEGABYTE}
						onUpload={handleUpload}
						onFileRejected={({ reason }) => toast.error(reason)}
						class={totalCount > 0 ? 'h-24' : 'h-40'}
						disabled={isSubmitting}
					/>
				{/if}
			</div>

			<div class="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
				<div>
					<p class="text-sm font-medium">Δημοσιευμένο</p>
				</div>
				<Switch id="edit-published" bind:checked={formData.published} disabled={isSubmitting} class="cursor-pointer" />
				<input type="hidden" {...editManual.fields.published.as('text')} value={formData.published.toString()} />
			</div>

			<Dialog.Footer class="gap-2 pt-2">
				<Button variant="outline" type="button" onclick={() => (open = false)} disabled={isSubmitting}>Ακύρωση</Button>
				<Button type="submit" class="gap-2" disabled={isSubmitting}>
					{#if isSubmitting}
						<Spinner class="h-4 w-4" /> Ενημέρωση...
					{:else}
						<Save class="h-4 w-4" /> Αποθήκευση
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>