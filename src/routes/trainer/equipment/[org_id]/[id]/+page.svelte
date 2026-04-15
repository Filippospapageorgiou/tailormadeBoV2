<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getTrainerEquipmentDetail } from '$lib/api/trainers/equipment/data.remote';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';
	import {
		ArrowLeft,
		Wrench,
		CheckCircle2,
		XCircle,
		AlertTriangle,
		Calendar,
		ImageIcon,
		ChevronDown,
		X,
		ExternalLink,
		Clock,
		Hash,
		Activity
	} from 'lucide-svelte';
	import { differenceInDays, parseISO, format } from 'date-fns';
	import { el } from 'date-fns/locale';
	import {
		type EquipmentStatus,
		type VisitActionType,
		VISIT_ACTION_LABELS
	} from '$lib/models/equipment.types';
	import { fade, scale } from 'svelte/transition';

	let orgId = $derived(Number(page.params.org_id));
	let equipmentId = $derived(Number(page.params.id));

	let detailQuery = $derived(getTrainerEquipmentDetail({ equipmentId }));

	let equipment = $derived(detailQuery?.current?.equipment);
	let logs = $derived(detailQuery?.current?.logs ?? []);
	let visitActions = $derived(detailQuery?.current?.actions ?? []);

	let openLogs = $derived(
		logs.filter((l: any) => l.status === 'open' || l.status === 'in_progress')
	);
	let resolvedLogs = $derived(logs.filter((l: any) => l.status === 'resolved'));

	const statusList = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'Σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

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

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-muted-foreground/30' };
		return { count: 9, color: 'bg-emerald-500' };
	});

	let expandedLogId = $state<number | null>(null);
	let expandedActionId = $state<number | null>(null);
	let previewImage: string | null = $state(null);
	let activeTab = $state('open');

	function toggleLog(id: number) {
		expandedLogId = expandedLogId === id ? null : id;
	}
	function toggleAction(id: number) {
		expandedActionId = expandedActionId === id ? null : id;
	}

	const getInitials = (name: string) =>
		name
			?.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || '??';

	function openImagePreview(url: string) {
		previewImage = url;
	}
	function closeImagePreview() {
		previewImage = null;
	}

	function handleBack() {
		goto(`/trainer/equipment/${orgId}`);
	}
</script>

{#if detailQuery?.loading}
	<div class="min-h-screen">
		<main class="container mx-auto px-4 pt-6 pb-20 md:px-6 lg:max-w-5xl">
			<Skeleton class="mb-6 h-5 w-48" />
			<div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<div class="space-y-6">
					<Skeleton class="h-64 w-full rounded-xl" />
					<Skeleton class="h-48 w-full rounded-xl" />
				</div>
				<div class="space-y-6">
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
				onPrimaryClick={handleBack}
			/>
		</main>
	</div>
{:else}
	<div class="min-h-screen">
		<main class="container mx-auto px-4 pt-6 pb-20 md:px-6 lg:max-w-5xl">
			<button
				onclick={handleBack}
				class="group mb-6 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
				Πίσω στον εξοπλισμό
			</button>

			<div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<!-- LEFT: Equipment -->
				<div class="space-y-6">
					<div class="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
						{#if equipment.image_url}
							<div class="relative h-56 w-full overflow-hidden">
								<img
									src={equipment.image_url}
									alt={equipment.name}
									class="h-full w-full object-cover"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
								></div>
								{#if equipment.status}
									{@const StatusIcon = statusIcons[equipment.status as EquipmentStatus]}
									<div class="absolute right-3 bottom-3">
										<Badge
											class="gap-1.5 rounded-md border-0 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md {statusColors[
												equipment.status as EquipmentStatus
											]}"
										>
											<StatusIcon class="h-3.5 w-3.5" />
											{statusList.find((s) => s.value === equipment.status)?.label || equipment.status}
										</Badge>
									</div>
								{/if}
							</div>
						{/if}

						<div class="p-5">
							<h1 class="text-2xl font-semibold tracking-tight">{equipment.name}</h1>
							<div class="mt-1.5 flex flex-wrap items-center gap-2">
								<span
									class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60"
								>
									#{equipment.id.toString().padStart(4, '0')}
								</span>
								{#if equipment.model}
									<span class="text-xs text-muted-foreground">{equipment.model}</span>
								{/if}
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

					<!-- Service Health -->
					<div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
						<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
							<Activity class="h-4 w-4 text-muted-foreground" />
							Service Status
						</h3>

						{#if equipment.next_service_date}
							<div class="space-y-4">
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

								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-1">
										<span
											class="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase"
										>
											Τελευταίο service
										</span>
										<p class="text-sm font-medium">
											{equipment.last_service_date
												? format(parseISO(equipment.last_service_date), 'dd MMM yyyy', {
														locale: el
													})
												: '-'}
										</p>
									</div>
									<div class="space-y-1">
										<span
											class="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase"
										>
											Επόμενο service
										</span>
										<p class="text-sm font-medium">
											{equipment.next_service_date
												? format(parseISO(equipment.next_service_date), 'dd MMM yyyy', {
														locale: el
													})
												: '-'}
										</p>
									</div>
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground/60">Δεν έχει προγραμματιστεί service</p>
						{/if}
					</div>
				</div>

				<!-- RIGHT: Tabs -->
				<div class="space-y-6">
					<div class="rounded-xl border border-border/60 bg-card shadow-sm">
						<div class="border-b border-border/40 px-5 py-4">
							<div class="flex items-center justify-between">
								<h2 class="flex items-center gap-2 text-lg font-semibold tracking-tight">
									<Wrench class="h-5 w-5 text-muted-foreground" />
									Ιστορικό
								</h2>
								<span
									class="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
								>
									{logs.length} logs · {visitActions.length} ενέργειες
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
											<span
												class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
											>
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
											<span
												class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/15 px-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
											>
												{resolvedLogs.length}
											</span>
										{/if}
									</Tabs.Trigger>
									<Tabs.Trigger
										value="trainer"
										class="relative h-10 rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
									>
										Εκπαιδευτής
										{#if visitActions.length > 0}
											<span
												class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary"
											>
												{visitActions.length}
											</span>
										{/if}
									</Tabs.Trigger>
								</Tabs.List>
							</div>

							<!-- OPEN -->
							<Tabs.Content value="open" class="mt-0">
								{#if openLogs.length === 0}
									<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
										<CheckCircle2 class="mb-3 h-10 w-10 opacity-20" />
										<p class="text-sm">Δεν υπάρχουν ανοιχτά ζητήματα</p>
									</div>
								{:else}
									<div class="divide-y divide-border/40">
										{#each openLogs as log (log.id)}
											{@const isExpanded = expandedLogId === log.id}
											<div
												class="transition-colors duration-200 {isExpanded
													? 'bg-muted/20 dark:bg-muted/10'
													: 'hover:bg-muted/10'}"
											>
												<button
													class="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
													onclick={() => toggleLog(log.id)}
												>
													<Avatar.Root class="h-9 w-9 flex-shrink-0 shadow-sm">
														<Avatar.Image
															src={log.profiles?.image_url}
															alt={log.profiles?.username}
														/>
														<Avatar.Fallback class="text-[10px] font-bold text-primary">
															{getInitials(log.profiles?.username || 'Unknown')}
														</Avatar.Fallback>
													</Avatar.Root>

													<div class="min-w-0 flex-1">
														<div class="flex items-center gap-2">
															<span class="truncate text-sm font-medium"
																>{log.profiles?.username || 'Άγνωστος'}</span
															>
															<Badge
																class="rounded px-1.5 py-0 text-[9px] font-medium {logStatusColors[
																	log.status
																]}"
															>
																{logStatusLabels[log.status]}
															</Badge>
														</div>
														<p class="mt-0.5 truncate text-xs text-muted-foreground/70">
															{log.issue_description}
														</p>
													</div>

													<div class="flex flex-shrink-0 items-center gap-2">
														{#if log.images && log.images.length > 0}
															<span
																class="flex items-center gap-1 text-[10px] text-muted-foreground/50"
															>
																<ImageIcon class="h-3 w-3" />
																{log.images.length}
															</span>
														{/if}
														<span class="text-[11px] text-muted-foreground/60">
															{format(new Date(log.created_at), 'dd MMM yyyy', { locale: el })}
														</span>
														<ChevronDown
															class="h-4 w-4 text-muted-foreground/40 transition-transform duration-200 {isExpanded
																? 'rotate-180'
																: ''}"
														/>
													</div>
												</button>

												{#if isExpanded}
													<div
														class="space-y-4 px-5 pb-5 pl-[4.5rem]"
														transition:fade={{ duration: 150 }}
													>
														<div class="flex items-center gap-1.5 text-xs text-muted-foreground/60">
															<Calendar class="h-3 w-3" />
															{format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm', {
																locale: el
															})}
														</div>

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

														{#if log.action_taken}
															<div class="space-y-1.5">
																<h4
																	class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
																>
																	<Wrench class="h-3 w-3" />
																	Ενέργειες που έγιναν
																</h4>
																<p
																	class="rounded-lg bg-emerald-500/5 p-3 text-sm leading-relaxed text-foreground/90"
																>
																	{log.action_taken}
																</p>
															</div>
														{/if}

														{#if log.cost > 0}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Κόστος:</span>
																<span class="rounded bg-muted px-2 py-0.5 font-mono"
																	>{log.cost.toFixed(2)}€</span
																>
															</div>
														{/if}

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
																		</button>
																	{/each}
																</div>
															</div>
														{/if}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</Tabs.Content>

							<!-- RESOLVED -->
							<Tabs.Content value="resolved" class="mt-0">
								{#if resolvedLogs.length === 0}
									<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
										<Clock class="mb-3 h-10 w-10 opacity-20" />
										<p class="text-sm">Δεν υπάρχει ιστορικό συντήρησης</p>
									</div>
								{:else}
									<div class="divide-y divide-border/40">
										{#each resolvedLogs as log (log.id)}
											{@const isExpanded = expandedLogId === log.id}
											<div
												class="transition-colors duration-200 {isExpanded
													? 'bg-muted/20 dark:bg-muted/10'
													: 'hover:bg-muted/10'}"
											>
												<button
													class="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
													onclick={() => toggleLog(log.id)}
												>
													<Avatar.Root class="h-9 w-9 flex-shrink-0 shadow-sm">
														<Avatar.Image
															src={log.profiles?.image_url}
															alt={log.profiles?.username}
														/>
														<Avatar.Fallback class="text-[10px] font-bold text-primary">
															{getInitials(log.profiles?.username || 'Unknown')}
														</Avatar.Fallback>
													</Avatar.Root>

													<div class="min-w-0 flex-1">
														<div class="flex items-center gap-2">
															<span class="truncate text-sm font-medium"
																>{log.profiles?.username || 'Άγνωστος'}</span
															>
															<Badge
																class="rounded px-1.5 py-0 text-[9px] font-medium {logStatusColors[
																	'resolved'
																]}"
															>
																Επιλύθηκε
															</Badge>
														</div>
														<p class="mt-0.5 truncate text-xs text-muted-foreground/70">
															{log.issue_description}
														</p>
													</div>

													<div class="flex flex-shrink-0 items-center gap-2">
														{#if log.images && log.images.length > 0}
															<span
																class="flex items-center gap-1 text-[10px] text-muted-foreground/50"
															>
																<ImageIcon class="h-3 w-3" />
																{log.images.length}
															</span>
														{/if}
														<span class="text-[11px] text-muted-foreground/60">
															{format(new Date(log.created_at), 'dd MMM yyyy', { locale: el })}
														</span>
														<ChevronDown
															class="h-4 w-4 text-muted-foreground/40 transition-transform duration-200 {isExpanded
																? 'rotate-180'
																: ''}"
														/>
													</div>
												</button>

												{#if isExpanded}
													<div
														class="space-y-4 px-5 pb-5 pl-[4.5rem]"
														transition:fade={{ duration: 150 }}
													>
														<div
															class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60"
														>
															<div class="flex items-center gap-1.5">
																<Calendar class="h-3 w-3" />
																Δημιουργήθηκε: {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', {
																	locale: el
																})}
															</div>
															{#if log.resolved_at}
																<div
																	class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
																>
																	<CheckCircle2 class="h-3 w-3" />
																	Επιλύθηκε: {format(new Date(log.resolved_at), 'dd MMM yyyy, HH:mm', {
																		locale: el
																	})}
																</div>
															{/if}
														</div>

														{#if log.resolved_profile?.username}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Επιλύθηκε από:</span>
																<span>{log.resolved_profile.username}</span>
															</div>
														{/if}

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

														{#if log.action_taken}
															<div class="space-y-1.5">
																<h4
																	class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
																>
																	<Wrench class="h-3 w-3" />
																	Ενέργειες που έγιναν
																</h4>
																<p
																	class="rounded-lg bg-emerald-500/5 p-3 text-sm leading-relaxed text-foreground/90"
																>
																	{log.action_taken}
																</p>
															</div>
														{/if}

														{#if log.cost > 0}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Κόστος:</span>
																<span class="rounded bg-muted px-2 py-0.5 font-mono"
																	>{log.cost.toFixed(2)}€</span
																>
															</div>
														{/if}

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
																		</button>
																	{/each}
																</div>
															</div>
														{/if}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</Tabs.Content>

							<!-- TRAINER ACTIONS -->
							<Tabs.Content value="trainer" class="mt-0">
								{#if visitActions.length === 0}
									<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
										<Wrench class="mb-3 h-10 w-10 opacity-20" />
										<p class="text-sm">Δεν υπάρχουν ενέργειες εκπαιδευτή</p>
									</div>
								{:else}
									<div class="divide-y divide-border/40">
										{#each visitActions as action (action.id)}
											{@const isExpanded = expandedActionId === action.id}
											{@const visit = (action as any).trainer_service_visits}
											{@const trainer = visit?.profiles}
											<div
												class="transition-colors duration-200 {isExpanded
													? 'bg-muted/20 dark:bg-muted/10'
													: 'hover:bg-muted/10'}"
											>
												<button
													class="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
													onclick={() => toggleAction(action.id)}
												>
													<Avatar.Root class="h-9 w-9 flex-shrink-0 shadow-sm">
														<Avatar.Image src={trainer?.image_url} alt={trainer?.username} />
														<Avatar.Fallback class="text-[10px] font-bold text-primary">
															{getInitials(trainer?.username || 'Trainer')}
														</Avatar.Fallback>
													</Avatar.Root>

													<div class="min-w-0 flex-1">
														<div class="flex items-center gap-2">
															<span class="truncate text-sm font-medium"
																>{trainer?.username || 'Εκπαιδευτής'}</span
															>
															<Badge
																class="rounded bg-primary/10 px-1.5 py-0 text-[9px] font-medium text-primary ring-1 ring-primary/20"
															>
																{VISIT_ACTION_LABELS[action.action_type as VisitActionType] ??
																	action.action_type}
															</Badge>
														</div>
														<p class="mt-0.5 truncate text-xs text-muted-foreground/70">
															{action.description}
														</p>
													</div>

													<div class="flex flex-shrink-0 items-center gap-2">
														{#if action.images && action.images.length > 0}
															<span
																class="flex items-center gap-1 text-[10px] text-muted-foreground/50"
															>
																<ImageIcon class="h-3 w-3" />
																{action.images.length}
															</span>
														{/if}
														<span class="text-[11px] text-muted-foreground/60">
															{format(new Date(visit?.visit_date ?? action.created_at), 'dd MMM yyyy', {
																locale: el
															})}
														</span>
														<ChevronDown
															class="h-4 w-4 text-muted-foreground/40 transition-transform duration-200 {isExpanded
																? 'rotate-180'
																: ''}"
														/>
													</div>
												</button>

												{#if isExpanded}
													<div
														class="space-y-4 px-5 pb-5 pl-[4.5rem]"
														transition:fade={{ duration: 150 }}
													>
														<div
															class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60"
														>
															<div class="flex items-center gap-1.5">
																<Calendar class="h-3 w-3" />
																Επίσκεψη: {format(
																	new Date(visit?.visit_date ?? action.created_at),
																	'dd MMMM yyyy',
																	{ locale: el }
																)}
															</div>
															<div class="flex items-center gap-1.5">
																<Clock class="h-3 w-3" />
																Καταγραφή: {format(new Date(action.created_at), 'HH:mm', {
																	locale: el
																})}
															</div>
														</div>

														<div class="space-y-1.5">
															<h4
																class="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
															>
																<Wrench class="h-3 w-3" />
																Περιγραφή ενέργειας
															</h4>
															<p
																class="rounded-lg bg-primary/5 p-3 text-sm leading-relaxed text-foreground/90"
															>
																{action.description}
															</p>
														</div>

														{#if action.status_change}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Νέα κατάσταση:</span>
																<Badge
																	class="rounded px-1.5 py-0 text-[9px] font-medium {statusColors[
																		action.status_change as EquipmentStatus
																	]}"
																>
																	{statusList.find((s) => s.value === action.status_change)?.label ||
																		action.status_change}
																</Badge>
															</div>
														{/if}

														{#if action.next_service_date}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Επόμενο service:</span>
																<span
																	>{format(parseISO(action.next_service_date), 'dd MMM yyyy', {
																		locale: el
																	})}</span
																>
															</div>
														{/if}

														{#if action.cost > 0}
															<div class="flex items-center gap-2 text-xs text-muted-foreground">
																<span class="font-semibold">Κόστος:</span>
																<span class="rounded bg-muted px-2 py-0.5 font-mono"
																	>{action.cost.toFixed(2)}€</span
																>
															</div>
														{/if}

														{#if action.images && action.images.length > 0}
															<div class="space-y-1.5">
																<h4
																	class="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
																>
																	Φωτογραφίες
																</h4>
																<div class="flex flex-wrap gap-2">
																	{#each action.images as img, idx}
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
{/if}
