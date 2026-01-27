<script lang="ts">
	import * as Modal from '$lib/components/ui/modal';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Camera, X, Check, RotateCcw } from 'lucide-svelte';
	import { uploadTaskPhoto } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import Loader from '$lib/components/ai-elements/loader/Loader.svelte';

	let {
		open = $bindable(false),
		taskId = '',
		taskTitle = '',
		onSuccess,
		onCancel
	}: {
		open: boolean;
		taskId: string;
		taskTitle: string;
		onSuccess: () => Promise<void>;
		onCancel: () => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let previewUrl: string | null = $state(null);
	let selectedFile: File | null = $state(null);
	let isUploading = $state(false);

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			selectedFile = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				previewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function handleRetake() {
		previewUrl = null;
		selectedFile = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function handleCancel() {
		resetState();
		onCancel();
	}

	function resetState() {
		previewUrl = null;
		selectedFile = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Reset state when modal closes
	$effect(() => {
		if (!open) {
			resetState();
		}
	});
</script>

<Modal.Root bind:open>
	<Modal.Content class="sm:max-w-md">
		<Modal.Header>
			<Modal.Title class="flex items-center gap-2">
				<Camera class="h-5 w-5 text-primary" />
				Απαιτείται Φωτογραφία
			</Modal.Title>
			<Modal.Description>
				Για να ολοκληρώσεις την εργασία "<span class="font-semibold">{taskTitle}</span>" πρέπει να
				τραβήξεις μια φωτογραφία.
			</Modal.Description>
		</Modal.Header>

		<form
			enctype="multipart/form-data"
			class="py-4"
			{...uploadTaskPhoto.enhance(async ({ form, submit }) => {
				isUploading = true;
				await submit();

				if (uploadTaskPhoto.result?.success) {
					toast.success(uploadTaskPhoto.result.message);
					open = false;
					resetState();
					await onSuccess();
				} else {
					toast.error(uploadTaskPhoto.result?.message || 'Σφάλμα');
					// Don't close modal on error, let user retry
				}
				isUploading = false;
			})}
		>
			<!-- Hidden task ID field -->
			<input type="hidden" name="taskId" value={taskId} />

			<input
				bind:this={fileInput}
				type="file"
				name="photoFile"
				accept="image/*"
				capture="environment"
				class="hidden"
				onchange={handleFileChange}
			/>

			{#if previewUrl}
				<!-- Preview State -->
				<div class="space-y-4">
					<div class="relative overflow-hidden rounded-lg border">
						<img src={previewUrl} alt="Preview" class="h-64 w-full object-cover" />
					</div>
					<div class="flex gap-2">
						<Button
							type="button"
							variant="outline"
							class="flex-1"
							onclick={handleRetake}
							disabled={isUploading}
						>
							<RotateCcw class="mr-2 h-4 w-4" />
							Ξανά
						</Button>
						<Button type="submit" class="flex-1" disabled={isUploading}>
							{#if isUploading}
								<Loader class="mr-2 h-4 w-4" />
								Αποθήκευση...
							{:else}
								<Check class="mr-2 h-4 w-4" />
								Επιβεβαίωση
							{/if}
						</Button>
					</div>
				</div>
			{:else}
				<!-- Capture State -->
				<button
					type="button"
					onclick={() => fileInput?.click()}
					class="flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-primary/30 bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50"
				>
					<div class="rounded-full bg-primary/10 p-4">
						<Camera class="h-8 w-8 text-primary" />
					</div>
					<div class="text-center">
						<p class="font-medium text-foreground">Τράβηξε φωτογραφία</p>
						<p class="text-sm text-muted-foreground">Πάτα εδώ για να ανοίξεις την κάμερα</p>
					</div>
				</button>
			{/if}
		</form>

		<Modal.Footer>
			<Button variant="outline" onclick={handleCancel} disabled={isUploading}>
				<X class="mr-2 h-4 w-4" />
				Ακύρωση
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>