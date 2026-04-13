<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		getEquipmentById,
		getAllMaintenanceLogs,
		editEquipment,
		deleteEquipment,
		deleteMaintanceLog
	} from '../data.remote';
	import { toast } from 'svelte-sonner';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Cloud } from 'lucide-svelte';
	import {
		ArrowLeft,
		Save,
		Trash2,
		Pencil,
		Wrench,
		CheckCircle2,
		XCircle,
		AlertTriangle,
		Calendar,
		ImageIcon,
		ChevronDown,
		X,
		BadgeAlert,
		ExternalLink,
		Clock,
		Hash,
		Activity
	} from 'lucide-svelte';
	import { differenceInDays, parseISO, format } from 'date-fns';
	import { el } from 'date-fns/locale';
	import type { EquipmentStatus } from '$lib/models/equipment.types';
	import { fade, scale } from 'svelte/transition';

	let equipmentId = $derived(Number(page.params.id));

	let equipmentQuery = $derived(getEquipmentById({ equipmentId }));
	let logsQuery = $derived(getAllMaintenanceLogs({ equipmentId }));

	let equipment = $derived(equipmentQuery?.current?.equipment);
	let logs = $derived(logsQuery?.current?.logs ?? []);

	let openLogs = $derived(logs.filter((l) => l.status === 'open' || l.status === 'in_progress'));
	let resolvedLogs = $derived(logs.filter((l) => l.status === 'resolved'));

	let statusList = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'Σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	const statusColors: Record<EquipmentStatus, string> = {
		operational: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
		maintenance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20',
		broken: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20'
	};

	const statusIcons = {
		operational: CheckCircle2,
		maintenance: Wrench,
		broken: XCircle
	};

	const logStatusColors: Record<string, string> = {
		open: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20',
		in_progress: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20',
		resolved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
	};

	const logStatusLabels: Record<string, string> = {
		open: 'Ανοιχτό',
		in_progress: 'Σε εξέλιξη',
		resolved: 'Επιλύθηκε'
	};

	let daysUntilService = $derived(
		equipment?.next_service_date
			? differenceInDays(parseISO(equipment.next_service_date), new Date())
			: null
	);

	let serviceStatus = $derived.by(() => {
		if (daysUntilService === null) return 'unknown';
		if (daysUntilService < 0) return 'overdue';
		if (daysUntilService < 14) return 'warning';
		return 'good';
	});

	// --- Edit state ---
	let isEditing = $state(false);
	let isUpdating = $state(false);
	let editName = $state('');
	let editModel = $state('');
	let editSerialNumber = $state('');
	let editFiles: FileList | undefined = $state();
	let editPreviewUrl: string | null = $state(null);
	let editManualUrl = $state('');
	let editStatus = $state('');
	let editLastServiceDate = $state('');
	let editNextServiceDate = $state('');

	function startEditing() {
		if (!equipment) return;
		editName = equipment.name;
		editModel = equipment.model || '';
		editSerialNumber = equipment.serial_number || '';
		editManualUrl = equipment.manual_url || '';
		editStatus = equipment.status;
		editLastServiceDate = equipment.last_service_date || '';
		editNextServiceDate = equipment.next_service_date || '';
		editPreviewUrl = equipment.image_url || null;
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	function handleEditFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				editPreviewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			editPreviewUrl = equipment?.image_url || null;
		}
	}

	// --- Delete state ---
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	// --- Logs ---
	let expandedLogId = $state<number | null>(null);
	let deletingLogId = $state<number | undefined>();
	let isDeletingLog = $state(false);
	let previewImage: string | null = $state(null);
	let activeTab = $state('open');

	function toggleLog(id: number) {
		expandedLogId = expandedLogId === id ? null : id;
	}

	const getInitials = (name: string) =>
		name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '??';

	function openImagePreview(url: string) {
		previewImage = url;
	}

	function closeImagePreview() {
		previewImage = null;
	}

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-muted-foreground/30' };
		return { count: 9, color: 'bg-emerald-500' };
	});
</script>

{#if equipmentQuery?.loading}
	<!-- Loading skeleton -->
	<div class="min-h-screen">
		<main class="container mx-auto px-4 pt-6 pb-20 md:px-6 lg:max-w-5xl">
			<Skeleton class="mb-6 h-5 w-48" />
			<div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<div class="space-y-6">
					<Skeleton class="h-64 w-full rounded-xl" />
					<Skeleton class="h-48 w-full rounded-xl" />
				</div>
				<div class="space-y-6">
					<Skeleton class="h-32 w-full rounded-xl" />
					<Skeleton class="h-96 w-full rounded-xl" />
				</div>
			</div>
		</main>
	</div>
{:else if !equipment}
	<div class="min-h-screen">
		<main class="container mx-auto px-4 pt-6 pb-20 md:px-6 lg:max-w-5xl">
			<EmptyComp
				title="Δεν βρέθηκε εξοπλισμός"
				description="Ο εξοπλισμός δεν βρέθηκε ή δεν έχετε πρόσβαση."
				icon={Wrench as any}
				primaryLabel="Πίσω στον εξοπλισμό"
				onPrimaryClick={() => goto('/app/settings/equipment_settings')}
			/>
		</main>
	</div>
{:else}
	<div class="min-h-screen">
		<main class="container mx-auto px-4 pt-6 pb-20 md:px-6 lg:max-w-5xl">
			<!-- Back navigation -->
			<button
				onclick={() => goto('/app/settings/equipment_settings')}
				class="group mb-6 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
				Πίσω στον εξοπλισμό
			</button>

			<div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<!-- ===== LEFT COLUMN: Equipment Details ===== -->
				<div class="space-y-6">
					<!-- Hero image + header card -->
					<div class="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
						{#if equipment.image_url}
							<div class="relative h-56 w-full overflow-hidden">
								<img
									src={equipment.image_url}
									alt={equipment.name}
									class="h-full w-full object-cover"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
								{#if equipment.status}
									{@const StatusIcon = statusIcons[equipment.status as EquipmentStatus]}
									<div class="absolute right-3 bottom-3">
										<Badge
											class="gap-1.5 rounded-md border-0 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md {statusColors[equipment.status as EquipmentStatus]}"
										>
											<StatusIcon class="h-3.5 w-3.5" />
											{statusList.find((s) => s.value === equipment.status)?.label || equipment.status}
										</Badge>
									</div>
								{/if}
							</div>
						{/if}

						<div class="p-5">
							<div class="flex items-start justify-between">
								<div>
									<h1 class="text-2xl font-semibold tracking-tight">{equipment.name}</h1>
									<div class="mt-1.5 flex flex-wrap items-center gap-2">
										<span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
											#{equipment.id.toString().padStart(4, '0')}
										</span>
										{#if equipment.model}
											<span class="text-xs text-muted-foreground">{equipment.model}</span>
										{/if}
									</div>
								</div>
								<div class="flex gap-1.5">
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													variant="outline"
													size="icon"
													class="h-8 w-8 cursor-pointer"
													onclick={startEditing}
												>
													<Pencil class="h-3.5 w-3.5" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content><p>Επεξεργασία</p></Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													variant="outline"
													size="icon"
													class="h-8 w-8 cursor-pointer hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
													onclick={() => (showDeleteConfirm = true)}
												>
													<Trash2 class="h-3.5 w-3.5" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content><p>Διαγραφή</p></Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								</div>
							</div>

							{#if equipment.serial_number}
								<div class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
									<Hash class="h-3.5 w-3.5" />
									S/N: {equipment.serial_number}
								</div>
							{/if}

							{#if equipment.manual_url}
								<a
									href={equipment.manual_url}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
								>
									<ExternalLink class="h-3.5 w-3.5" />
									Manual κατασκευαστή
								</a>
							{/if}
						</div>
					</div>

					<!-- Service Health Card -->
					<div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
						<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
							<Activity class="h-4 w-4 text-muted-foreground" />
							Service Status
						</h3>

						{#if equipment.next_service_date}
							<div class="space-y-4">
								<!-- Service bars -->
								<div class="flex items-center gap-3">
									<div class="flex h-6 items-end gap-0.5">
										{#each { length: 9 } as _, i}
											<div
												class="w-1.5 rounded-full transition-all duration-500 {i < serviceBars.count
													? serviceBars.color
													: 'bg-muted/40 dark:bg-muted/20'}"
												style="height: {35 + i * 8}%"
											></div>
										{/each}
									</div>
									<p
										class="text-sm font-semibold {serviceStatus === 'overdue'
											? 'text-red-600 dark:text-red-400'
											: serviceStatus === 'warning'
												? 'text-orange-600 dark:text-orange-400'
												: 'text-emerald-600 dark:text-emerald-400'}"
									>
										{daysUntilService === null
											? 'Χωρίς ημερομηνία'
											: daysUntilService < 0
												? `ΕΚΠΡΟΘΕΣΜΟ ${Math.abs(daysUntilService)} ΗΜΕΡΕΣ`
												: `${daysUntilService} ΗΜΕΡΕΣ ΑΠΟΜΕΝΟΥΝ`}
									</p>
								</div>

								<Separator />

								<!-- Dates -->
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-1">
										<span class="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
											Τελευταίο service
										</span>
										<p class="text-sm font-medium">
											{equipment.last_service_date
												? format(parseISO(equipment.last_service_date), 'dd MMM yyyy', { locale: el })
												: '-'}
										</p>
									</div>
									<div class="space-y-1">
										<span class="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
											Επόμενο service
										</span>
										<p class="text-sm font-medium">
											{equipment.next_service_date
												? format(parseISO(equipment.next_service_date), 'dd MMM yyyy', { locale: el })
												: '-'}
										</p>
									</div>
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground/60">Δεν έχει προγραμματιστεί service</p>
						{/if}
					</div>

					<!-- Delete Confirm (inline, not modal) -->
					{#if showDeleteConfirm}
						<div class="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm" transition:fade={{ duration: 150 }}>
							<div class="flex items-start gap-3 mb-4">
								<BadgeAlert class="h-5 w-5 flex-shrink-0 text-destructive" />
								<div>
									<h4 class="text-sm font-semibold text-destructive">Διαγραφή εξοπλισμού</h4>
									<p class="mt-1 text-xs text-muted-foreground">
										Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Θα διαγραφούν όλα τα δεδομένα και το ιστορικό
										συντήρησης για <span class="font-semibold">{equipment.name}</span>.
									</p>
								</div>
							</div>
							<form
								class="flex items-center gap-2"
								{...deleteEquipment.enhance(async ({ submit }) => {
									isDeleting = true;
									await submit();
									if (deleteEquipment.result?.success) {
										toast.success(deleteEquipment.result.message);
										goto('/app/settings/equipment_settings');
									} else {
										toast.error(deleteEquipment.result?.message || 'Σφάλμα κατά την διαγραφή');
									}
									isDeleting = false;
								})}
							>
								<input name="equipmentId" type="hidden" value={equipment.id} />
								<Button type="submit" variant="destructive" size="sm" disabled={isDeleting} class="gap-2">
									{#if isDeleting}
										<Spinner class="h-3 w-3" /> Διαγραφή...
									{:else}
										<Trash2 class="h-3 w-3" /> Επιβεβαίωση διαγραφής
									{/if}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onclick={() => (showDeleteConfirm = false)}
								>
									Ακύρωση
								</Button>
							</form>
						</div>
					{/if}
				</div>

				<!-- ===== RIGHT COLUMN: Edit Form / Maintenance Logs ===== -->
				<div class="space-y-6">
					<!-- Edit Form (shown when editing) -->
					{#if isEditing}
						<div class="rounded-xl border border-primary/20 bg-card p-6 shadow-sm" transition:fade={{ duration: 150 }}>
							<div class="mb-5 flex items-center justify-between">
								<h2 class="text-lg font-semibold tracking-tight">Επεξεργασία εξοπλισμού</h2>
								<Button variant="ghost" size="icon" class="h-8 w-8" onclick={cancelEditing}>
									<X class="h-4 w-4" />
								</Button>
							</div>

							<form
								class="space-y-5"
								enctype="multipart/form-data"
								{...editEquipment.enhance(async ({ submit }) => {
									isUpdating = true;
									await submit();
									if (editEquipment.result?.success) {
										toast.success(editEquipment.result.message);
										isEditing = false;
									} else {
										toast.error(editEquipment.result?.message || 'Αποτυχία ενημέρωσης');
									}
									isUpdating = false;
								})}
							>
								<input type="hidden" name="id" value={equipment.id} />

								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-2">
										<Label class="gap-1">Όνομα <span class="text-destructive">*</span></Label>
										<Input type="text" name="name" bind:value={editName} required />
									</div>
									<div class="space-y-2">
										<Label class="gap-1">Μοντέλο <span class="text-destructive">*</span></Label>
										<Input type="text" name="model" bind:value={editModel} required />
									</div>
									<div class="space-y-2 sm:col-span-2">
										<Label>Σειριακός αριθμός</Label>
										<Input type="text" name="serial_number" bind:value={editSerialNumber} />
									</div>
								</div>

								<!-- Image -->
								<div class="space-y-2">
									<Label>Εικόνα</Label>
									<input
										id="edit-image-upload-page"
										name="image_url"
										type="file"
										accept="image/*"
										class="hidden"
										bind:files={editFiles}
										onchange={handleEditFileChange}
									/>
									{#if editPreviewUrl}
										<button
											type="button"
											onclick={() => document.getElementById('edit-image-upload-page')?.click()}
											class="w-full"
										>
											<Empty.Root class="cursor-pointer transition-colors hover:bg-muted/50">
												<Empty.Header>
													<Empty.Description>
														<img
															src={editPreviewUrl}
															alt="Preview"
															class="mx-auto max-h-40 rounded-md object-cover"
														/>
													</Empty.Description>
												</Empty.Header>
												<Empty.Content>
													<p class="text-xs text-muted-foreground">Κλικ για αλλαγή εικόνας</p>
												</Empty.Content>
											</Empty.Root>
										</button>
									{:else}
										<button
											type="button"
											onclick={() => document.getElementById('edit-image-upload-page')?.click()}
											class="w-full"
										>
											<Empty.Root class="cursor-pointer border border-dashed transition-colors hover:bg-muted/50">
												<Empty.Header>
													<Empty.Media variant="icon">
														<Cloud />
													</Empty.Media>
													<Empty.Title>Ανέβασε εικόνα</Empty.Title>
												</Empty.Header>
											</Empty.Root>
										</button>
									{/if}
								</div>

								<div class="space-y-2">
									<Label>Manual URL</Label>
									<Input name="manual_url" type="text" bind:value={editManualUrl} />
								</div>

								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-2 sm:col-span-2">
										<Label>Κατάσταση <span class="text-destructive">*</span></Label>
										<Select.Root type="single" name="status" bind:value={editStatus} required>
											<Select.Trigger class="w-full sm:w-64">
												{statusList.find((c) => c.value === editStatus)?.label ?? 'Διαλέξε κατάσταση'}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													<Select.Label>Κατάσταση</Select.Label>
													{#each statusList as status (status.value)}
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
										<InputCalendar id="edit_last" bind:value={editLastServiceDate} required />
										<input type="hidden" name="last_service_date" value={editLastServiceDate} />
									</div>
									<div class="space-y-2">
										<Label>Επόμενο service <span class="text-destructive">*</span></Label>
										<InputCalendar id="edit_next" bind:value={editNextServiceDate} required />
										<input type="hidden" name="next_service_date" value={editNextServiceDate} />
									</div>
								</div>

								<Separator />

								<div class="flex items-center justify-end gap-2">
									<Button type="button" variant="outline" onclick={cancelEditing}>Ακύρωση</Button>
									<Button type="submit" disabled={isUpdating} class="gap-2">
										{#if isUpdating}
											<Spinner class="h-4 w-4" /> Αποθήκευση...
										{:else}
											<Save class="h-4 w-4" /> Αποθήκευση
										{/if}
									</Button>
								</div>
							</form>
						</div>
					{/if}

					<!-- Maintenance Logs Section -->
					<div class="rounded-xl border border-border/60 bg-card shadow-sm">
						<div class="border-b border-border/40 px-5 py-4">
							<div class="flex items-center justify-between">
								<h2 class="flex items-center gap-2 text-lg font-semibold tracking-tight">
									<Wrench class="h-5 w-5 text-muted-foreground" />
									Ιστορικό Συντήρησης
								</h2>
								<span class="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
									{logs.length} συνολικά
								</span>
							</div>
						</div>

						<Tabs.Root bind:value={activeTab} class="w-full">
							<div class="border-b border-border/40 px-5">
								<Tabs.List class="h-10 w-full justify-start gap-4 bg-transparent p-0">
									<Tabs.Trigger
										value="open"
										class="relative h-10 rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 font-medium data-[state=active]:border-red-500 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-none"
									>
										Ανοιχτά
										{#if openLogs.length > 0}
											<span class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
												{openLogs.length}
											</span>
										{/if}
									</Tabs.Trigger>
									<Tabs.Trigger
										value="resolved"
										class="relative h-10 rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 font-medium data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-none"
									>
										Επιλυμένα
										{#if resolvedLogs.length > 0}
											<span class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/15 px-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
												{resolvedLogs.length}
											</span>
										{/if}
									</Tabs.Trigger>
								</Tabs.List>
							</div>

							<Tabs.Content value="open" class="mt-0">
								{#if logsQuery?.loading}
									<div class="space-y-4 p-5">
										{#each { length: 3 } as _}
											<div class="flex items-center gap-3">
												<Skeleton class="h-9 w-9 rounded-full" />
												<div class="flex-1 space-y-2">
													<Skeleton class="h-4 w-1/3" />
													<Skeleton class="h-3 w-2/3" />
												</div>
											</div>
										{/each}
									</div>
								{:else if openLogs.length === 0}
									<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
										<CheckCircle2 class="mb-3 h-10 w-10 opacity-20" />
										<p class="text-sm">Δεν υπάρχουν ανοιχτά ζητήματα</p>
										<p class="text-xs text-muted-foreground/50">Ο εξοπλισμός είναι σε καλή κατάσταση</p>
									</div>
								{:else}
									<div class="divide-y divide-border/40">
										{#each openLogs as log, i (log.id)}
											{@const isExpanded = expandedLogId === log.id}
											<div
												class="transition-colors duration-200 {isExpanded ? 'bg-muted/20 dark:bg-muted/10' : 'hover:bg-muted/10'}"
											>
												<button
													class="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
													onclick={() => toggleLog(log.id)}
												>
													<Avatar.Root class="h-9 w-9 flex-shrink-0 shadow-sm">
														<Avatar.Image src={log.profiles?.image_url} alt={log.profiles?.username} />
														<Avatar.Fallback class="text-[10px] font-bold text-primary">
															{getInitials(log.profiles?.username || 'Unknown')}
														</Avatar.Fallback>
													</Avatar.Root>

													<div class="min-w-0 flex-1">
														<div class="flex items-center gap-2">
															<span class="truncate text-sm font-medium">{log.profiles?.username || 'Άγνωστος'}</span>
															<Badge class="rounded px-1.5 py-0 text-[9px] font-medium {logStatusColors[log.status]}">
																{logStatusLabels[log.status]}
															</Badge>
														</div>
														<p class="mt-0.5 truncate text-xs text-muted-foreground/70">{log.issue_description}</p>
													</div>

													<div class="flex flex-shrink-0 items-center gap-2">
														{#if log.images && log.images.length > 0}
															<span class="flex items-center gap-1 text-[10px] text-muted-foreground/50">
																<ImageIcon class="h-3 w-3" />
																{log.images.length}
															</span>
														{/if}
														<span class="text-[11px] text-muted-foreground/60">
															{format(new Date(log.created_at), 'dd MMM yyyy', { locale: el })}
														</span>
														<ChevronDown
															class="h-4 w-4 text-muted-foreground/40 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
														/>
													</div>
												</button>

												{#if isExpanded}
													<div class="space-y-4 px-5 pb-5 pl-[4.5rem]" transition:fade={{ duration: 150 }}>
														<div class="flex items-center gap-1.5 text-xs text-muted-foreground/60">
															<Calendar class="h-3 w-3" />
															{format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm', { locale: el })}
														</div>

														<div class="space-y-1.5">
															<h4 class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
																<AlertTriangle class="h-3 w-3" />
																Περιγραφή Βλάβης
															</h4>
															<p class="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90 dark:bg-muted/15">
																{log.issue_description}
															</p>
														</div>

														{#if log.action_taken}
															<div class="space-y-1.5">
																<h4 class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
																	<Wrench class="h-3 w-3" />
																	Ενέργειες που έγιναν
																</h4>
																<p class="rounded-lg bg-emerald-500/5 p-3 text-sm leading-relaxed text-foreground/90">
																	{log.action_taken}
																</p>
															</div>
														{/if}

														{#if log.cost > 0}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Κόστος:</span>
																<span class="rounded bg-muted px-2 py-0.5 font-mono">{log.cost.toFixed(2)}€</span>
															</div>
														{/if}

														{#if log.images && log.images.length > 0}
															<div class="space-y-1.5">
																<h4 class="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
																	Φωτογραφίες
																</h4>
																<div class="flex flex-wrap gap-2">
																	{#each log.images as img, idx}
																		<button
																			class="group/img relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg border border-border/50 transition-all hover:border-primary/30 hover:shadow-md sm:h-20 sm:w-20"
																			onclick={() => openImagePreview(img)}
																		>
																			<img
																				src={img}
																				alt="Evidence {idx + 1}"
																				loading="lazy"
																				decoding="async"
																				class="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-110"
																			/>
																		</button>
																	{/each}
																</div>
															</div>
														{/if}

														<!-- Delete log -->
														<div class="flex justify-end pt-2">
															<form
																{...deleteMaintanceLog.enhance(async ({ submit }) => {
																	deletingLogId = log.id;
																	isDeletingLog = true;
																	await submit();
																	if (deleteMaintanceLog.result?.success) {
																		toast.success(deleteMaintanceLog.result.message);
																	} else {
																		toast.error(deleteMaintanceLog.result?.message || 'Σφάλμα κατά την διαγραφή');
																	}
																	isDeletingLog = false;
																	deletingLogId = undefined;
																})}
															>
																<input type="hidden" name="maintanceLogId" value={log.id} />
																<Button
																	type="submit"
																	variant="ghost"
																	size="sm"
																	disabled={isDeletingLog && deletingLogId === log.id}
																	class="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
																>
																	{#if isDeletingLog && deletingLogId === log.id}
																		<Spinner class="h-3 w-3" /> Διαγραφή...
																	{:else}
																		<Trash2 class="h-3 w-3" /> Διαγραφή
																	{/if}
																</Button>
															</form>
														</div>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</Tabs.Content>

							<Tabs.Content value="resolved" class="mt-0">
								{#if logsQuery?.loading}
									<div class="space-y-4 p-5">
										{#each { length: 3 } as _}
											<div class="flex items-center gap-3">
												<Skeleton class="h-9 w-9 rounded-full" />
												<div class="flex-1 space-y-2">
													<Skeleton class="h-4 w-1/3" />
													<Skeleton class="h-3 w-2/3" />
												</div>
											</div>
										{/each}
									</div>
								{:else if resolvedLogs.length === 0}
									<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
										<Clock class="mb-3 h-10 w-10 opacity-20" />
										<p class="text-sm">Δεν υπάρχει ιστορικό συντήρησης</p>
									</div>
								{:else}
									<div class="divide-y divide-border/40">
										{#each resolvedLogs as log, i (log.id)}
											{@const isExpanded = expandedLogId === log.id}
											<div
												class="transition-colors duration-200 {isExpanded ? 'bg-muted/20 dark:bg-muted/10' : 'hover:bg-muted/10'}"
											>
												<button
													class="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
													onclick={() => toggleLog(log.id)}
												>
													<Avatar.Root class="h-9 w-9 flex-shrink-0 shadow-sm">
														<Avatar.Image src={log.profiles?.image_url} alt={log.profiles?.username} />
														<Avatar.Fallback class="text-[10px] font-bold text-primary">
															{getInitials(log.profiles?.username || 'Unknown')}
														</Avatar.Fallback>
													</Avatar.Root>

													<div class="min-w-0 flex-1">
														<div class="flex items-center gap-2">
															<span class="truncate text-sm font-medium">{log.profiles?.username || 'Άγνωστος'}</span>
															<Badge class="rounded px-1.5 py-0 text-[9px] font-medium {logStatusColors['resolved']}">
																Επιλύθηκε
															</Badge>
														</div>
														<p class="mt-0.5 truncate text-xs text-muted-foreground/70">{log.issue_description}</p>
													</div>

													<div class="flex flex-shrink-0 items-center gap-2">
														{#if log.images && log.images.length > 0}
															<span class="flex items-center gap-1 text-[10px] text-muted-foreground/50">
																<ImageIcon class="h-3 w-3" />
																{log.images.length}
															</span>
														{/if}
														<span class="text-[11px] text-muted-foreground/60">
															{format(new Date(log.created_at), 'dd MMM yyyy', { locale: el })}
														</span>
														<ChevronDown
															class="h-4 w-4 text-muted-foreground/40 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
														/>
													</div>
												</button>

												{#if isExpanded}
													<div class="space-y-4 px-5 pb-5 pl-[4.5rem]" transition:fade={{ duration: 150 }}>
														<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
															<div class="flex items-center gap-1.5">
																<Calendar class="h-3 w-3" />
																Δημιουργήθηκε: {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: el })}
															</div>
															{#if log.resolved_at}
																<div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
																	<CheckCircle2 class="h-3 w-3" />
																	Επιλύθηκε: {format(new Date(log.resolved_at), 'dd MMM yyyy, HH:mm', { locale: el })}
																</div>
															{/if}
														</div>

														{#if (log as any).resolved_profile?.username}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Επιλύθηκε από:</span>
																<span>{(log as any).resolved_profile.username}</span>
															</div>
														{/if}

														<div class="space-y-1.5">
															<h4 class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
																<AlertTriangle class="h-3 w-3" />
																Περιγραφή Βλάβης
															</h4>
															<p class="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90 dark:bg-muted/15">
																{log.issue_description}
															</p>
														</div>

														{#if log.action_taken}
															<div class="space-y-1.5">
																<h4 class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
																	<Wrench class="h-3 w-3" />
																	Ενέργειες που έγιναν
																</h4>
																<p class="rounded-lg bg-emerald-500/5 p-3 text-sm leading-relaxed text-foreground/90">
																	{log.action_taken}
																</p>
															</div>
														{/if}

														{#if log.cost > 0}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Κόστος:</span>
																<span class="rounded bg-muted px-2 py-0.5 font-mono">{log.cost.toFixed(2)}€</span>
															</div>
														{/if}

														{#if log.images && log.images.length > 0}
															<div class="space-y-1.5">
																<h4 class="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
																	Φωτογραφίες
																</h4>
																<div class="flex flex-wrap gap-2">
																	{#each log.images as img, idx}
																		<button
																			class="group/img relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg border border-border/50 transition-all hover:border-primary/30 hover:shadow-md sm:h-20 sm:w-20"
																			onclick={() => openImagePreview(img)}
																		>
																			<img
																				src={img}
																				alt="Evidence {idx + 1}"
																				loading="lazy"
																				decoding="async"
																				class="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-110"
																			/>
																		</button>
																	{/each}
																</div>
															</div>
														{/if}

														<!-- Delete log -->
														<div class="flex justify-end pt-2">
															<form
																{...deleteMaintanceLog.enhance(async ({ submit }) => {
																	deletingLogId = log.id;
																	isDeletingLog = true;
																	await submit();
																	if (deleteMaintanceLog.result?.success) {
																		toast.success(deleteMaintanceLog.result.message);
																	} else {
																		toast.error(deleteMaintanceLog.result?.message || 'Σφάλμα κατά την διαγραφή');
																	}
																	isDeletingLog = false;
																	deletingLogId = undefined;
																})}
															>
																<input type="hidden" name="maintanceLogId" value={log.id} />
																<Button
																	type="submit"
																	variant="ghost"
																	size="sm"
																	disabled={isDeletingLog && deletingLogId === log.id}
																	class="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
																>
																	{#if isDeletingLog && deletingLogId === log.id}
																		<Spinner class="h-3 w-3" /> Διαγραφή...
																	{:else}
																		<Trash2 class="h-3 w-3" /> Διαγραφή
																	{/if}
																</Button>
															</form>
														</div>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</Tabs.Content>
						</Tabs.Root>
					</div>
				</div>
			</div>
		</main>
	</div>

	<!-- Image Preview Overlay -->
	{#if previewImage}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label="Image preview"
			tabindex="0"
			onclick={closeImagePreview}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeImagePreview();
			}}
			transition:fade={{ duration: 200 }}
		>
			<button
				class="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-white/20"
				onclick={closeImagePreview}
				aria-label="Close preview"
				type="button"
			>
				<X class="h-5 w-5" />
			</button>
			<button type="button" class="rounded-xl p-0" onclick={(e) => e.stopPropagation()} aria-label="Preview image">
				<img
					src={previewImage}
					alt="Preview"
					class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
					transition:scale={{ duration: 200 }}
				/>
			</button>
		</div>
	{/if}
{/if}
