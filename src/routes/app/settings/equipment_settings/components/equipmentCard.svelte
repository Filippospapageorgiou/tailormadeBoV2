<script lang="ts">
	import type { EquipmentWithLogCount, MaintenanceLogWithUser } from '$lib/models/equipment.types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Pencil,
		Trash2,
		CheckCircle2,
		XCircle,
		Wrench,
		X,
		BadgeAlert,
		Calendar,
		AlertTriangle,
		ImageIcon,
		ChevronDown,
		Cloud
	} from 'lucide-svelte';
	import { differenceInDays, parseISO } from 'date-fns';
	import type { EquipmentStatus } from '$lib/models/equipment.types';
	import * as Modal from '$lib/components/ui/modal';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { format } from 'date-fns';
	import { el } from 'date-fns/locale';
	import * as Avatar from '$lib/components/ui/avatar';
	import { fade, scale } from 'svelte/transition';
	import {
		deleteEquipment,
		deleteMaintanceLog,
		editEquipment,
		getMaintenanceLogs
	} from '../data.remote';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Select from '$lib/components/ui/select';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let previewImage: string | null = $state(null);
	let {
		equipment,
		index
	}: {
		equipment: EquipmentWithLogCount;
		index: number;
	} = $props();

	let logCount = $derived(equipment.maintenance_logs?.[0]?.count ?? 0);

	const getInitials = (name: string) => {
		return (
			name
				?.split(' ')
				.map((n) => n[0])
				.slice(0, 2)
				.join('')
				.toUpperCase() || '??'
		);
	};

	let modalOpen = $state(false);

	let daysUntilService = $derived(
		equipment.next_service_date
			? differenceInDays(parseISO(equipment.next_service_date), new Date())
			: null
	);

	let serviceStatus = $derived.by(() => {
		if (daysUntilService === null) return 'unknown';
		if (daysUntilService < 0) return 'overdue';
		if (daysUntilService < 14) return 'warning';
		return 'good';
	});

	let statusCustom = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'Σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-muted-foreground/30' };
		return { count: 9, color: 'bg-emerald-500' };
	});

	const statusColors: Record<EquipmentStatus, string> = {
		operational:
			'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
		maintenance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20',
		broken: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20'
	};

	const statusIcons = {
		operational: CheckCircle2,
		maintenance: Wrench,
		broken: XCircle
	};

	let StatusIcon = $derived(statusIcons[equipment.status]);

	const borderColor = $derived(
		serviceStatus === 'overdue'
			? 'border-red-500/40 hover:border-red-500/60'
			: serviceStatus === 'warning'
				? 'border-orange-400/40 hover:border-orange-400/60'
				: 'border-border/60 hover:border-border'
	);

	// Edit modal states
	let editModalOpen = $state(false);
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

	function handleEdit() {
		editName = equipment.name;
		editModel = equipment.model || '';
		editSerialNumber = equipment.serial_number || '';
		editManualUrl = equipment.manual_url || '';
		editStatus = equipment.status;
		editLastServiceDate = equipment.last_service_date || '';
		editNextServiceDate = equipment.next_service_date || '';
		editPreviewUrl = equipment.image_url || null;
		editModalOpen = true;
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
			editPreviewUrl = equipment.image_url || null;
		}
	}

	let openDeleteDialog = $state(false);
	let deleteEquipmentData: EquipmentWithLogCount | undefined = $state();

	function handleDelete() {
		openDeleteDialog = true;
		deleteEquipmentData = equipment;
	}

	function openImagePreview(imageUrl: string) {
		modalOpen = false;
		previewImage = imageUrl;
	}

	function closeImagePreview() {
		previewImage = null;
		modalOpen = true;
	}

	let deletingLogId = $state();
	let isDeleting = $state(false);

	// Expanded log tracking for accordion-style
	let expandedLogId = $state<number | null>(null);

	function toggleLog(id: number) {
		expandedLogId = expandedLogId === id ? null : id;
	}
	// Lazy-loaded logs state
	let maintenanceQuery = $state<ReturnType<typeof getMaintenanceLogs> | null>(null);
	let logs = $derived(maintenanceQuery?.current?.logs ?? []);
	let loading = $derived(maintenanceQuery?.loading ?? false);

	let sortedLogs = $derived(
		[...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
	);

	function openEquipmentModal(id: number) {
		modalOpen = true;
		maintenanceQuery = getMaintenanceLogs({ equipmentId: id });
	}
</script>

<div
	style="animation-delay: {index * 80}ms; animation-fill-mode: backwards;"
	class="group animate-fade-in-right overflow-hidden rounded-xl border bg-background/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:bg-background/50 {borderColor}"
>
	<!-- Hero Image -->
	<div class="relative h-48 w-full overflow-hidden sm:h-52">
		<img
			src={equipment.image_url}
			loading="lazy"
			decoding="async"
			width="400"
			height="250"
			class="h-full w-full object-cover"
			alt={equipment.name}
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
		></div>

		<!-- Top bar: Edit/Delete + Logs badge -->
		<div class="absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
			<div class="flex gap-1">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="secondary"
								size="icon"
								class="h-7 w-7 cursor-pointer bg-background/80 backdrop-blur-md hover:bg-background"
								onclick={handleEdit}
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
								variant="secondary"
								size="icon"
								class="h-7 w-7 cursor-pointer bg-background/80 backdrop-blur-md hover:bg-destructive/10 hover:text-destructive"
								onclick={handleDelete}
							>
								<Trash2 class="h-3.5 w-3.5" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content><p>Διαγραφή</p></Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>

			{#if logCount > 0}
				<button
					onclick={() => openEquipmentModal(equipment.id)}
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-red-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-red-600"
				>
					<Wrench class="h-3 w-3" />
					{logCount} Logs
					{#if serviceStatus === 'overdue'}
						<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
					{/if}
				</button>
			{/if}
		</div>

		<!-- Status badge bottom-right -->
		<div class="absolute right-3 bottom-3">
			<Badge
				class="gap-1.5 rounded-md border-0 px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-md {statusColors[
					equipment.status
				]}"
			>
				<StatusIcon class="h-3 w-3" />
				{statusCustom.find((s) => s.value === equipment.status)?.label || equipment.status}
			</Badge>
		</div>

		<!-- Service dot top-left corner -->
		<div class="absolute bottom-3 left-3">
			<div
				class="h-2.5 w-2.5 rounded-full ring-2 ring-black/20 {serviceStatus === 'overdue'
					? 'bg-red-500 shadow-sm shadow-red-500/50'
					: serviceStatus === 'warning'
						? 'bg-orange-400 shadow-sm shadow-orange-400/50'
						: serviceStatus === 'good'
							? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
							: 'bg-muted-foreground/40'}"
			></div>
		</div>
	</div>

	<!-- Content -->
	<div class="space-y-4 p-4 sm:p-5">
		<!-- Header -->
		<div>
			<h3
				class="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary"
			>
				{equipment.name}
			</h3>
			<div class="mt-1 flex flex-wrap items-center gap-2">
				<span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
					#{equipment.id.toString().padStart(4, '0')}
				</span>
				{#if equipment.model}
					<span class="text-xs text-muted-foreground/70">{equipment.model}</span>
				{/if}
			</div>
		</div>

		<!-- Service Health -->
		{#if equipment.next_service_date}
			<div class="space-y-2.5 rounded-lg bg-muted/30 p-3 dark:bg-muted/15">
				<span class="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
					Service Status
				</span>

				<div class="flex w-full items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div class="flex h-5 items-end gap-0.5">
							{#each { length: 9 } as _, i}
								<div
									class="w-1 rounded-full transition-all duration-500 {i < serviceBars.count
										? serviceBars.color
										: 'bg-muted/40 dark:bg-muted/20'}"
									style="height: {40 + i * 7}%"
								></div>
							{/each}
						</div>

						<p
							class="text-xs font-medium {serviceStatus === 'overdue'
								? 'text-red-600 dark:text-red-400'
								: serviceStatus === 'warning'
									? 'text-orange-600 dark:text-orange-400'
									: 'text-emerald-600 dark:text-emerald-400'}"
						>
							{daysUntilService === null
								? 'No service date'
								: daysUntilService < 0
									? `OVERDUE ${Math.abs(daysUntilService)} DAYS`
									: `${daysUntilService} DAYS REMAINING`}
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-lg bg-muted/30 p-3 dark:bg-muted/15">
				<span class="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
					Service Status
				</span>
				<p class="mt-1.5 text-xs text-muted-foreground/60">No service date scheduled</p>
			</div>
		{/if}
	</div>
</div>

<Modal.Root bind:open={modalOpen}>
	<Modal.Content
		class="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden rounded-xl border-border/60 bg-background/95 p-0 backdrop-blur-xl dark:bg-background/90"
	>
		<!-- Header -->
		<Modal.Header
			class="sticky top-0 z-20 border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-md"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400"
				>
					<Wrench class="h-5 w-5" />
				</div>
				<div class="flex-1">
					<Modal.Title class="text-lg font-semibold tracking-tight">
						Ιστορικό Συντήρησης
					</Modal.Title>
					<Modal.Description class="text-xs text-muted-foreground">
						{equipment.name}
						<span class="text-muted-foreground/50">·</span>
						{maintenanceQuery ? sortedLogs.length : logCount} καταγραφές
					</Modal.Description>
				</div>
			</div>
		</Modal.Header>

		<!-- Logs list -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="space-y-4 p-6">
					{#each { length: 3 } as _}
						<div class="flex items-center gap-3">
							<Skeleton class="h-9 w-9 rounded-full" />
							<div class="flex-1 space-y-2">
								<Skeleton class="h-4 w-1/3" />
								<Skeleton class="h-3 w-2/3" />
							</div>
							<Skeleton class="h-4 w-16" />
						</div>
					{/each}
				</div>
			{:else if sortedLogs.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<CheckCircle2 class="mb-3 h-10 w-10 opacity-20" />
					<p class="text-sm">Δεν υπάρχουν καταγραφές συντήρησης.</p>
				</div>
			{:else}
				<div class="divide-y divide-border/40">
					{#each sortedLogs as log, i (log.id)}
						{#if deletingLogId !== log.id}
							{@const isExpanded = expandedLogId === log.id}
							<div
								class="transition-colors duration-200 {isExpanded
									? 'bg-muted/20 dark:bg-muted/10'
									: 'hover:bg-muted/10'}"
								style="animation-delay: {i * 50}ms;"
							>
								<!-- Log summary row (always visible, clickable) -->
								<button
									class="flex w-full cursor-pointer items-center gap-3 px-6 py-4 text-left"
									onclick={() => toggleLog(log.id)}
								>
									<!-- Avatar -->
									<Avatar.Root class="h-9 w-9 flex-shrink-0 shadow-sm">
										<Avatar.Image src={log.profiles?.image_url} alt={log.profiles?.username} />
										<Avatar.Fallback class="text-[10px] font-bold text-primary">
											{getInitials(log.profiles?.username || 'Unknown')}
										</Avatar.Fallback>
									</Avatar.Root>

									<!-- Main info -->
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="truncate text-sm font-medium text-foreground">
												{log.profiles?.username || 'Άγνωστος'}
											</span>
											{#if log.profiles?.role}
												<Badge
													variant="secondary"
													class="rounded px-1.5 py-0 text-[9px] font-medium"
												>
													{log.profiles.role}
												</Badge>
											{/if}
										</div>
										<p class="mt-0.5 truncate text-xs text-muted-foreground/70">
											{log.issue_description}
										</p>
									</div>

									<!-- Right side: date + images count + chevron -->
									<div class="flex flex-shrink-0 items-center gap-2">
										{#if log.images && log.images.length > 0}
											<span class="flex items-center gap-1 text-[10px] text-muted-foreground/50">
												<ImageIcon class="h-3 w-3" />
												{log.images.length}
											</span>
										{/if}
										<span class="text-[11px] text-muted-foreground/60">
											{format(new Date(log.created_at), 'dd MMM', { locale: el })}
										</span>
										<ChevronDown
											class="h-4 w-4 text-muted-foreground/40 transition-transform duration-200 {isExpanded
												? 'rotate-180'
												: ''}"
										/>
									</div>
								</button>

								<!-- Expanded details -->
								{#if isExpanded}
									<div class="space-y-4 px-6 pb-5 pl-[4.5rem]" transition:fade={{ duration: 150 }}>
										<!-- Date full -->
										<div class="flex items-center gap-1.5 text-xs text-muted-foreground/60">
											<Calendar class="h-3 w-3" />
											{format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm', {
												locale: el
											})}
										</div>

										<!-- Issue description -->
										<div class="space-y-1.5">
											<h4
												class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
											>
												<AlertTriangle class="h-3 w-3" />
												Περιγραφή Βλάβης
											</h4>
											<p
												class="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90 dark:bg-muted/15"
											>
												{log.issue_description}
											</p>
										</div>

										<!-- Action taken -->
										{#if log.action_taken}
											<div class="space-y-1.5">
												<h4
													class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
												>
													<Wrench class="h-3 w-3" />
													Ενέργειες που έγιναν
												</h4>
												<p
													class="rounded-lg bg-emerald-500/5 p-3 text-sm leading-relaxed text-foreground/90 dark:bg-emerald-500/5"
												>
													{log.action_taken}
												</p>
											</div>
										{/if}

										<!-- Images -->
										{#if log.images && log.images.length > 0}
											<div class="space-y-1.5">
												<h4
													class="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
												>
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
															<div
																class="absolute inset-0 bg-black/0 transition-colors group-hover/img:bg-black/10"
															></div>
														</button>
													{/each}
												</div>
											</div>
										{/if}
									</div>

									<!-- Delete log -->
									<div class="flex justify-end pt-2">
										<form
											{...deleteMaintanceLog.enhance(async ({ submit }) => {
												deletingLogId = log.id;
												isDeleting = true;
												await submit();
												if (deleteMaintanceLog.result?.success) {
													toast.success(deleteMaintanceLog.result.message);
													maintenanceQuery = getMaintenanceLogs({ equipmentId: equipment.id });
												} else {
													toast.error(
														deleteMaintanceLog.result?.message || 'Σφάλμα κατά την διαγραφή'
													);
												}
												isDeleting = false;
												deletingLogId = undefined;
											})}
										>
											<input type="hidden" name="maintanceLogId" value={log.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												disabled={isDeleting && deletingLogId === log.id}
												class="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
											>
												{#if isDeleting && deletingLogId === log.id}
													<Spinner class="h-3 w-3" />
													Διαγραφή...
												{:else}
													<Trash2 class="h-3 w-3" />
													Διαγραφή
												{/if}
											</Button>
										</form>
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<Modal.Footer
			class="sticky bottom-0 z-20 flex items-center justify-between border-t border-border/40 bg-background/80 px-6 py-3 backdrop-blur-md"
		>
			<p class="text-[11px] text-muted-foreground/60">
				Σύνολο: {sortedLogs.length} καταγραφές
			</p>
			<Button
				variant="outline"
				size="sm"
				class="cursor-pointer"
				onclick={() => (modalOpen = false)}
			>
				Κλείσιμο
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

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
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				closeImagePreview();
			}
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

		<button
			type="button"
			class="rounded-xl p-0"
			onclick={(e) => e.stopPropagation()}
			aria-label="Preview image"
		>
			<img
				src={previewImage}
				alt="Preview"
				class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
				transition:scale={{ duration: 200 }}
			/>
		</button>
	</div>
{/if}
<Modal.Root bind:open={openDeleteDialog}>
	<Modal.Content>
		<Modal.Header>
			<Modal.Title>Διαγραφή Εξοπλισμού</Modal.Title>
			<Modal.Description>
				Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτόν τον εξοπλισμό;
			</Modal.Description>
		</Modal.Header>

		<div class="space-y-4 py-4">
			<div class="rounded-lg p-4">
				<div class="flex gap-3">
					<BadgeAlert class="h-5 w-5 flex-shrink-0 text-red-600" />
					<div class="space-y-1">
						<p class="text-sm font-semibold text-red-900">
							Προσοχή: Αυτή η ενέργεια δεν μπορεί να αναιρεθεί
						</p>
						<p class="text-xs text-red-700">
							Θα διαγραφούν όλα τα δεδομένα και το ιστορικό συντήρησης για:
						</p>
					</div>
				</div>
			</div>

			{#if deleteEquipmentData}
				<div class="borderp-4 rounded-lg">
					<div class="flex items-start gap-4">
						{#if deleteEquipmentData.image_url}
							<img
								src={deleteEquipmentData.image_url}
								alt={deleteEquipmentData.name}
								class="h-16 w-16 rounded-lg object-cover"
							/>
						{:else}
							<div class="flex h-16 w-16 items-center justify-center rounded-lg">
								<Wrench class="h-8 w-8" />
							</div>
						{/if}

						<div class="flex-1">
							<h4 class="font-semibold">{deleteEquipmentData.name}</h4>
							{#if deleteEquipmentData.model}
								<p class="text-sm text-muted-foreground">Μοντέλο: {deleteEquipmentData.model}</p>
							{/if}
							<p class="text-xs text-muted-foreground/50">
								ID: #{deleteEquipmentData.id.toString().padStart(4, '0')}
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<form
			{...deleteEquipment.enhance(async ({ form, submit }) => {
				isDeleting = true;
				await submit();
				if (deleteEquipment.result?.success) {
					toast.success(deleteEquipment.result.message);
				} else {
					toast.error(deleteEquipment.result?.message || 'Σφάλμα κατά την διαγραφή');
				}
				deleteEquipmentData = undefined;
				form.reset();
				isDeleting = false;
				openDeleteDialog = false;
			})}
		>
			<input name="equipmentId" type="hidden" value={deleteEquipmentData?.id} />

			<Modal.Footer class="gap-2">
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						openDeleteDialog = false;
						deleteEquipmentData = undefined;
					}}
				>
					Ακύρωση
				</Button>
				<Button type="submit" variant="destructive" class="gap-2">
					{#if isDeleting}
						<Spinner /> Διαγραφή...
					{:else}
						Διαγραφή Εξοπλισμού
					{/if}
				</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>

<!-- Edit Equipment Modal -->
<Modal.Root bind:open={editModalOpen}>
	<Modal.Content class="flex flex-col">
		<Modal.Header>
			<Modal.Title>Επεξεργασία εξοπλισμού</Modal.Title>
			<Modal.Description>
				Ενημέρωσε τις πληροφορίες για: <span class="font-semibold">{equipment.name}</span>
			</Modal.Description>
		</Modal.Header>
		<form
			class="flex flex-col gap-2 space-y-2 px-2 py-2"
			enctype="multipart/form-data"
			{...editEquipment.enhance(async ({ form, submit }) => {
				isUpdating = true;
				await submit();
				if (editEquipment.result?.success) {
					toast.success(editEquipment.result.message);
					editModalOpen = false;
				} else {
					toast.error(editEquipment.result?.message || 'Αποτυχία ενημέρωσης προσπάθησε πάλι');
				}
				isUpdating = false;
			})}
		>
			<input type="hidden" name="id" value={equipment.id} />
			<ScrollArea class="h-96 w-full">
				<div class="w-full space-y-2">
					<Label class="gap-1">
						Όνομα εξοπλισμού <span class="text-destructive">*</span>
					</Label>
					<Input
						type="text"
						name="name"
						bind:value={editName}
						placeholder="La marzoco machine"
						required
					/>

					<Label class="gap-1">
						Μοντέλο εξοπλισμού <span class="text-destructive">*</span>
					</Label>
					<Input
						type="text"
						name="model"
						bind:value={editModel}
						placeholder="2-Group AV"
						required
					/>

					<Label class="gap-1">Σειριακός αριθμός εξοπλισμού</Label>
					<Input
						type="text"
						name="serial_number"
						bind:value={editSerialNumber}
						placeholder="LM-1234-5678"
					/>

					<input
						id="edit-image-upload"
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
							onclick={() => document.getElementById('edit-image-upload')?.click()}
							class="w-full"
						>
							<Empty.Root class="cursor-pointer transition-colors hover:bg-muted/50">
								<Empty.Header>
									<Empty.Description>
										<img
											src={editPreviewUrl}
											alt="Preview"
											class="mx-auto max-h-48 rounded-md object-cover"
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
							onclick={() => document.getElementById('edit-image-upload')?.click()}
							class="w-full"
						>
							<Empty.Root
								class="cursor-pointer border border-dashed transition-colors hover:bg-muted/50"
							>
								<Empty.Header>
									<Empty.Media variant="icon">
										<Cloud />
									</Empty.Media>
									<Empty.Title>Ανέβασε εικόνα</Empty.Title>
									<Empty.Description>
										Κάνε κλικ για να ανεβάσεις εικόνα του εξοπλισμού
									</Empty.Description>
								</Empty.Header>
							</Empty.Root>
						</button>
					{/if}

					<Label class="gap-1">Manual url</Label>
					<Input
						name="manual_url"
						type="text"
						bind:value={editManualUrl}
						placeholder="https://lamarzoccousa.com/commercial-products/espresso-machines/kb90/"
					/>

					<Label>Κατάσταση εξοπλισμού<span class="text-destructive">*</span></Label>
					<Select.Root type="single" name="status" bind:value={editStatus} required>
						<Select.Trigger class="w-full">
							{statusCustom.find((c) => c.value === editStatus)?.label ?? 'Διαλέξε κατάσταση'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Κατάσταση</Select.Label>
								{#each statusCustom as status (status.value)}
									<Select.Item value={status.value} label={status.label}>
										{status.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>

					<Label>Τελευταίο servise εξοπλισμού<span class="text-destructive">*</span></Label>
					<InputCalendar id="edit_last_service_date" bind:value={editLastServiceDate} required />
					<input type="hidden" name="last_service_date" value={editLastServiceDate} />

					<Label>Έπομενο servise εξοπλισμού<span class="text-destructive">*</span></Label>
					<InputCalendar id="edit_next_service_date" bind:value={editNextServiceDate} required />
					<input type="hidden" name="next_service_date" value={editNextServiceDate} />
				</div>
			</ScrollArea>
			<Modal.Footer class="py-2">
				<Button type="submit" disabled={isUpdating}>
					{#if isUpdating}
						<Spinner /> Ενημέρωση...
					{:else}
						Ενημέρωση εξοπλισμού
					{/if}
				</Button>
				<Button
					variant="outline"
					onclick={() => {
						editModalOpen = false;
					}}
				>
					Κλείσιμο
				</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>
