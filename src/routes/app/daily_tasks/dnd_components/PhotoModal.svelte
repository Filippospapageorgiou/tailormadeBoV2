<script lang="ts">
	import * as Modal from '$lib/components/ui/modal';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Camera, X, Check, RotateCcw } from 'lucide-svelte';
	import { uploadTaskPhoto } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	let {
		open = $bindable(false),
		taskId = '',
		taskTitle = '',
		frequency = 'daily',
		onSuccess,
		onCancel
	}: {
		open: boolean;
		taskId: string;
		taskTitle: string;
		frequency?: Frequency;
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
		if (fileInput) fileInput.value = '';
	}

	function handleCancel() {
		resetState();
		onCancel();
	}

	function resetState() {
		previewUrl = null;
		selectedFile = null;
		if (fileInput) fileInput.value = '';
	}

	$effect(() => {
		if (!open) resetState();
	});
</script>

<Modal.Root bind:open>
	<Modal.Content class="sm:max-w-md">
		<Modal.Header>
			<Modal.Title class="flex items-center gap-2.5 text-base">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
					<Camera class="h-4 w-4 text-sky-600 dark:text-sky-400" />
				</div>
				Φωτογραφία απαιτείται
			</Modal.Title>
			<Modal.Description class="text-[13px] leading-relaxed">
				Τράβηξε μια φωτογραφία για να ολοκληρώσεις την εργασία
				"<span class="font-semibold text-foreground">{taskTitle}</span>".
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
				}
				isUploading = false;
			})}
		>
			<input type="hidden" name="taskId" value={taskId} />
			<input type="hidden" name="frequency" value={frequency} />

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
				<div class="space-y-3">
					<div class="relative overflow-hidden rounded-xl border border-border/30">
						<img src={previewUrl} alt="Preview" class="h-60 w-full object-cover" />
					</div>
					<div class="flex gap-2">
						<Button
							type="button"
							variant="outline"
							class="flex-1"
							onclick={handleRetake}
							disabled={isUploading}
						>
							<RotateCcw class="mr-1.5 h-3.5 w-3.5" />
							Ξανά
						</Button>
						<Button type="submit" class="flex-1" disabled={isUploading}>
							{#if isUploading}
								<Spinner class="mr-1.5 h-3.5 w-3.5" />
								Αποθήκευση...
							{:else}
								<Check class="mr-1.5 h-3.5 w-3.5" />
								Επιβεβαίωση
							{/if}
						</Button>
					</div>
				</div>
			{:else}
				<button
					type="button"
					onclick={() => fileInput?.click()}
					class="photo-capture-zone flex h-52 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-sky-500/20 bg-sky-500/[0.03] transition-all duration-200 hover:border-sky-500/35 hover:bg-sky-500/[0.06]"
				>
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10">
						<Camera class="h-6 w-6 text-sky-600 dark:text-sky-400" />
					</div>
					<div class="text-center">
						<p class="text-sm font-semibold text-foreground">Τράβηξε φωτογραφία</p>
						<p class="mt-0.5 text-[11px] text-muted-foreground/60">
							Πάτα εδώ για να ανοίξεις την κάμερα
						</p>
					</div>
				</button>
			{/if}
		</form>

		<Modal.Footer>
			<Button variant="ghost" size="sm" onclick={handleCancel} disabled={isUploading}>
				<X class="mr-1.5 h-3.5 w-3.5" />
				Ακύρωση
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

<style>
	.photo-capture-zone {
		-webkit-tap-highlight-color: transparent;
		min-height: 44px;
	}
</style>
