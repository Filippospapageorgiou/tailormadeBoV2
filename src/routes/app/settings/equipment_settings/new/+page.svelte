<script lang="ts">
	import { goto } from '$app/navigation';
	import { addEquipment } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ArrowLeft, X, Wrench, Save, Cog } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import { FileDropZone, MEGABYTE, displaySize } from '$lib/components/ui/file-drop-zone';
	import type { FileDropZoneProps } from '$lib/components/ui/file-drop-zone';
	import { Separator } from '$lib/components/ui/separator';

	let equipmentStatus = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'Σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	let isUpdating = $state(false);
	let addFile: File | null = $state(null);
	let addPreviewUrl: string | null = $state(null);
	let addFileInputRef: HTMLInputElement | null = $state(null);

	const onAddUpload: FileDropZoneProps['onUpload'] = async (newFiles) => {
		const file = newFiles[0];
		if (!file) return;
		addFile = file;
		addPreviewUrl = URL.createObjectURL(file);
		if (addFileInputRef) {
			const dt = new DataTransfer();
			dt.items.add(file);
			addFileInputRef.files = dt.files;
		}
	};

	const onAddFileRejected: FileDropZoneProps['onFileRejected'] = ({ reason, file }) => {
		toast.error(`${file.name} απέτυχε!`, { description: reason });
	};

	function removeAddFile() {
		if (addPreviewUrl) URL.revokeObjectURL(addPreviewUrl);
		addFile = null;
		addPreviewUrl = null;
		if (addFileInputRef) addFileInputRef.value = '';
	}

	let valueStatus = $state('');
	let lastServiceDate = $state('');
	let nextServiceDate = $state('');
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-6 pb-20 md:px-6 lg:max-w-3xl">
		<!-- Back navigation -->
		<button
			onclick={() => goto('/app/settings/equipment_settings')}
			class="group mb-6 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
			Πίσω στον εξοπλισμό
		</button>

		<!-- Page header -->
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<Cog class="h-5 w-5" />
				</div>
				<h1 class="font-mono text-3xl tracking-wider">Νέος εξοπλισμός</h1>
			</div>
			<p class="text-sm text-muted-foreground">
				Συμπλήρωσε τις απαραίτητες πληροφορίες για τον νέο εξοπλισμό του καταστήματος.
			</p>
		</div>

		<form
			class="space-y-8"
			enctype="multipart/form-data"
			{...addEquipment.enhance(async ({ form, submit }) => {
				isUpdating = true;
				await submit();
				if (addEquipment.result?.success) {
					toast.success(addEquipment.result.message);
					goto('/app/settings/equipment_settings');
				} else {
					toast.error(addEquipment.result?.message || 'Αποτυχία προσθήκης προσπάθησε πάλι');
				}
				isUpdating = false;
			})}
		>
			<!-- Section: Basic Info -->
			<section class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
				<h2 class="mb-1 text-base font-semibold tracking-tight">Βασικές πληροφορίες</h2>
				<p class="mb-5 text-xs text-muted-foreground">Όνομα, μοντέλο και σειριακός αριθμός του εξοπλισμού</p>
				<Separator class="mb-5" />

				<div class="grid gap-5 sm:grid-cols-2">
					<div class="space-y-2">
						<Label class="gap-1">
							Όνομα εξοπλισμού <span class="text-destructive">*</span>
						</Label>
						<Input type="text" name="name" placeholder="La Marzocco Linea" required />
					</div>
					<div class="space-y-2">
						<Label class="gap-1">
							Μοντέλο εξοπλισμού <span class="text-destructive">*</span>
						</Label>
						<Input type="text" name="model" placeholder="2-Group AV" required />
					</div>
					<div class="space-y-2 sm:col-span-2">
						<Label class="gap-1">Σειριακός αριθμός</Label>
						<Input type="text" name="serial_number" placeholder="LM-1234-5678" />
					</div>
				</div>
			</section>

			<!-- Section: Image -->
			<section class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
				<h2 class="mb-1 text-base font-semibold tracking-tight">Εικόνα εξοπλισμού</h2>
				<p class="mb-5 text-xs text-muted-foreground">Ανέβασε μια εικόνα του εξοπλισμού (μέγ. 10MB)</p>
				<Separator class="mb-5" />

				<input
					bind:this={addFileInputRef}
					name="image_url"
					type="file"
					accept="image/*"
					class="hidden"
				/>

				{#if addPreviewUrl}
					<div class="relative overflow-hidden rounded-lg border border-border/50">
						<img
							src={addPreviewUrl}
							alt="Preview"
							class="mx-auto max-h-64 w-full object-cover"
						/>
						<div class="flex items-center justify-between bg-muted/30 px-4 py-2">
							<span class="truncate text-xs text-muted-foreground">
								{addFile?.name} ({addFile ? displaySize(addFile.size) : ''})
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-destructive"
								onclick={removeAddFile}
							>
								<X class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{:else}
					<FileDropZone
						onUpload={onAddUpload}
						onFileRejected={onAddFileRejected}
						maxFileSize={10 * MEGABYTE}
						accept="image/*"
						maxFiles={1}
						fileCount={addFile ? 1 : 0}
						class="h-44"
					/>
				{/if}
			</section>

			<!-- Section: Status & Service -->
			<section class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
				<h2 class="mb-1 text-base font-semibold tracking-tight">Κατάσταση & Service</h2>
				<p class="mb-5 text-xs text-muted-foreground">Τρέχουσα κατάσταση και ημερομηνίες service</p>
				<Separator class="mb-5" />

				<div class="grid gap-5 sm:grid-cols-2">
					<div class="space-y-2 sm:col-span-2">
						<Label>Κατάσταση εξοπλισμού <span class="text-destructive">*</span></Label>
						<Select.Root type="single" name="status" bind:value={valueStatus} required>
							<Select.Trigger class="w-full sm:w-64">
								{equipmentStatus.find((c) => c.value === valueStatus)?.label ?? 'Διαλέξε κατάσταση'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Κατάσταση</Select.Label>
									{#each equipmentStatus as status (status.value)}
										<Select.Item value={status.value} label={status.label}>
											{status.label}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label>Τελευταίο service <span class="text-destructive">*</span></Label>
						<InputCalendar id="last_service_date" bind:value={lastServiceDate} required />
						<input type="hidden" name="last_service_date" value={lastServiceDate} />
					</div>
					<div class="space-y-2">
						<Label>Επόμενο service <span class="text-destructive">*</span></Label>
						<InputCalendar id="next_service_date" bind:value={nextServiceDate} required />
						<input type="hidden" name="next_service_date" value={nextServiceDate} />
					</div>
				</div>
			</section>

			<!-- Section: Manual URL -->
			<section class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
				<h2 class="mb-1 text-base font-semibold tracking-tight">Πρόσθετες πληροφορίες</h2>
				<p class="mb-5 text-xs text-muted-foreground">Σύνδεσμος εγχειριδίου κατασκευαστή</p>
				<Separator class="mb-5" />

				<div class="space-y-2">
					<Label>Manual URL</Label>
					<Input
						name="manual_url"
						type="text"
						placeholder="https://lamarzoccousa.com/commercial-products/espresso-machines/kb90/"
					/>
				</div>
			</section>

			<!-- Actions -->
			<div class="flex items-center justify-between rounded-xl border border-border/60 bg-card px-6 py-4 shadow-sm">
				<Button
					type="button"
					variant="outline"
					onclick={() => goto('/app/settings/equipment_settings')}
				>
					Ακύρωση
				</Button>
				<Button type="submit" disabled={isUpdating} class="gap-2">
					{#if isUpdating}
						<Spinner class="h-4 w-4" /> Αποθήκευση...
					{:else}
						<Save class="h-4 w-4" /> Αποθήκευση εξοπλισμού
					{/if}
				</Button>
			</div>
		</form>
	</main>
</div>
