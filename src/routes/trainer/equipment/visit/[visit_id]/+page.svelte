<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import {
		ArrowLeft,
		Plus,
		CheckCircle2,
		Trash2,
		Wrench,
		XCircle,
		AlertTriangle,
		MapPin,
		ChevronDown
	} from 'lucide-svelte';
	import {
		getVisitWithActions,
		completeVisit,
		cancelVisit,
		deleteVisitAction,
		updateEquipmentStatus,
		resolveMaintenanceLogs
	} from '$lib/api/trainers/equipment/data.remote.js';
	import {
		VISIT_ACTION_LABELS,
		type VisitActionType,
		type EquipmentStatus
	} from '$lib/models/equipment.types.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import VisitActionForm from '../../components/VisitActionForm.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	let visitId = $derived(Number(page.params.visit_id));
	let visitQuery = $derived(getVisitWithActions({ visitId }));

	let visit = $derived(visitQuery?.current?.visit as any);
	let allEquipments = $derived((visitQuery?.current?.allEquipments ?? []) as any[]);
	let loading = $derived(visitQuery?.current === undefined);

	let actions = $derived((visit?.trainer_visit_actions ?? []) as any[]);
	let openIssues = $derived((visitQuery?.current?.openIssues ?? []) as any[]);
	let orgName = $derived(visit?.core_organizations?.store_name ?? '—');
	let orgLocation = $derived(visit?.core_organizations?.location ?? null);
	let orgId = $derived(visit?.org_id);
	let isCompleted = $derived(visit?.status === 'completed');

	// Action form
	let actionFormOpen = $state(false);
	let actionEquipmentId = $state(0);
	let actionEquipmentName = $state('');

	// Cancel dialog
	let cancelDialogOpen = $state(false);
	let isCancelling = $state(false);

	// Complete modal
	let completeModalOpen = $state(false);
	let isCompleting = $state(false);
	let visitNotes = $state('');
	let selectedResolvedIds = $state<Set<number>>(new Set());

	// Status update
	let showStatusUpdate = $state(false);
	let selectedEquipmentForStatus = $state('');
	let newStatus = $state('');
	let newNextServiceDate = $state('');
	let isUpdatingStatus = $state(false);

	// Sync notes from visit data
	$effect(() => {
		if (visit?.notes && !visitNotes) {
			visitNotes = visit.notes;
		}
	});

	// Group actions by equipment
	let actionsByEquipment = $derived.by(() => {
		const grouped = new Map<number, { equipment: any; actions: any[] }>();
		for (const action of actions) {
			if (!grouped.has(action.equipment_id)) {
				const eq = action.equipment || allEquipments.find((e: any) => e.id === action.equipment_id);
				grouped.set(action.equipment_id, { equipment: eq, actions: [] });
			}
			grouped.get(action.equipment_id)!.actions.push(action);
		}
		return grouped;
	});

	function openActionForm(equipmentId?: number) {
		if (equipmentId) {
			const eq = allEquipments.find((e: any) => e.id === equipmentId);
			actionEquipmentId = equipmentId;
			actionEquipmentName = eq?.name || `#${equipmentId}`;
		} else {
			// Let user pick from list — default to first
			actionEquipmentId = allEquipments[0]?.id || 0;
			actionEquipmentName = allEquipments[0]?.name || '';
		}
		actionFormOpen = true;
	}

	function openCompleteModal() {
		selectedResolvedIds = new Set();
		completeModalOpen = true;
	}

	function toggleResolvedId(id: number) {
		const next = new Set(selectedResolvedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedResolvedIds = next;
	}

	async function handleComplete() {
		isCompleting = true;
		try {
			// Resolve selected maintenance logs first
			if (selectedResolvedIds.size > 0 && orgId) {
				const resolveResult = await resolveMaintenanceLogs({
					logIds: [...selectedResolvedIds],
					orgId
				});
				if (!resolveResult.success) {
					showFailToast('Σφάλμα', resolveResult.message || 'Αποτυχία επίλυσης βλαβών');
				}
			}

			const result = await completeVisit({ visitId, notes: visitNotes.trim() || undefined });
			if (result.success) {
				showSuccessToast('Ολοκληρώθηκε', 'Η επίσκεψη ολοκληρώθηκε');
				goto(`/trainer/equipment/${orgId}`);
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία');
			}
		} catch {
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isCompleting = false;
			completeModalOpen = false;
		}
	}

	async function handleCancel() {
		isCancelling = true;
		try {
			const result = await cancelVisit({ visitId });
			if (result.success) {
				showSuccessToast('Ακυρώθηκε', 'Η επίσκεψη και όλες οι ενέργειες διαγράφηκαν');
				goto(`/trainer/equipment/${orgId}`);
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία');
			}
		} catch {
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isCancelling = false;
			cancelDialogOpen = false;
		}
	}

	async function handleDeleteAction(actionId: number) {
		try {
			const result = await deleteVisitAction({ actionId });
			if (result.success) {
				showSuccessToast('Διαγράφηκε', 'Η ενέργεια αφαιρέθηκε');
				visitQuery.refresh();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία');
			}
		} catch {
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		}
	}

	async function handleStatusUpdate() {
		if (!selectedEquipmentForStatus || !newStatus) return;
		isUpdatingStatus = true;
		try {
			const result = await updateEquipmentStatus({
				equipmentId: Number(selectedEquipmentForStatus),
				status: newStatus as EquipmentStatus,
				nextServiceDate: newNextServiceDate || undefined,
				updateLastServiceDate: true
			});
			if (result.success) {
				showSuccessToast('Ενημερώθηκε', 'Η κατάσταση εξοπλισμού ενημερώθηκε');
				selectedEquipmentForStatus = '';
				newStatus = '';
				newNextServiceDate = '';
				visitQuery.refresh();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία');
			}
		} catch {
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isUpdatingStatus = false;
		}
	}

	function formatTime(dateStr: string): string {
		return new Intl.DateTimeFormat('el-GR', { hour: '2-digit', minute: '2-digit' }).format(
			new Date(dateStr)
		);
	}

	const statusLabels: Record<string, string> = {
		operational: 'Σε λειτουργία',
		maintenance: 'Σε service',
		broken: 'Βλάβη'
	};

	let statusTriggerLabel = $derived(
		selectedEquipmentForStatus
			? allEquipments.find((e: any) => e.id === Number(selectedEquipmentForStatus))?.name ||
					'Επιλέξτε...'
			: 'Επιλέξτε εξοπλισμό...'
	);

	let newStatusTriggerLabel = $derived(
		newStatus ? statusLabels[newStatus] || newStatus : 'Επιλέξτε κατάσταση...'
	);
</script>

<div class="flex flex-1 flex-col gap-6 p-4 pt-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				class="h-9 w-9 rounded-xl"
				onclick={() => goto(`/trainer/equipment/${orgId || ''}`)}
			>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				{#if loading}
					<div class="h-6 w-48 animate-pulse rounded bg-muted/40"></div>
				{:else}
					<div class="flex items-center gap-2">
						<h1 class="text-xl font-semibold">Επίσκεψη</h1>
						{#if isCompleted}
							<Badge class="gap-1 border-0 bg-muted text-[10px] text-muted-foreground"
								>Ολοκληρωμένη</Badge
							>
						{:else}
							<Badge
								class="gap-1 border-0 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
							>
								<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
								Σε εξέλιξη
							</Badge>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="font-medium text-foreground">{orgName}</span>
						{#if orgLocation}
							<span class="flex items-center gap-1 text-xs">
								<MapPin class="h-3 w-3" />
								{orgLocation}
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if !loading && !isCompleted}
			<div class="flex items-center gap-2">
				<Button
					variant="destructive"
					size="sm"
					class="gap-1.5 rounded-xl text-xs"
					onclick={() => (cancelDialogOpen = true)}
				>
					<XCircle class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Ακύρωση</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="h-32 animate-pulse rounded-2xl bg-muted/40"></div>
			{/each}
		</div>
	{:else}
		<!-- Equipment Picker — Add Action -->
		{#if !isCompleted}
			<Card.Root class="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
				<Card.Header class="pb-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="rounded-lg bg-primary/10 p-2">
								<Plus class="h-4 w-4 text-primary" />
							</div>
							<Card.Title class="text-base">Προσθήκη Ενέργειας</Card.Title>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
						{#each allEquipments as eq (eq.id)}
							{@const hasActions = actions.some((a: any) => a.equipment_id === eq.id)}
							<button
								class="flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:border-primary/30 hover:bg-primary/5
									{hasActions ? 'border-primary/20 bg-primary/5' : 'border-border/40'}"
								onclick={() => {
									actionEquipmentId = eq.id;
									actionEquipmentName = eq.name;
									actionFormOpen = true;
								}}
							>
								{#if eq.image_url}
									<img src={eq.image_url} alt={eq.name} class="h-12 w-12 rounded-lg object-cover" />
								{:else}
									<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
										<Wrench class="h-5 w-5 text-muted-foreground" />
									</div>
								{/if}
								<div>
									<p class="line-clamp-1 text-xs font-medium">{eq.name}</p>
									<p class="text-[10px] text-muted-foreground">
										{statusLabels[eq.status] || eq.status}
									</p>
								</div>
								{#if hasActions}
									{@const count = actions.filter((a: any) => a.equipment_id === eq.id).length}
									<Badge variant="secondary" class="text-[9px]">{count} ενέργ.</Badge>
								{/if}
							</button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Actions List -->
		<Card.Root class="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
			<Card.Header class="pb-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-primary/10 p-2">
						<Wrench class="h-4 w-4 text-primary" />
					</div>
					<div>
						<Card.Title class="text-base">Ενέργειες ({actions.length})</Card.Title>
						<Card.Description class="text-xs">Ενέργειες που πραγματοποιήθηκαν</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if actions.length > 0}
					{#each [...actionsByEquipment.entries()] as [eqId, group]}
						<div class="rounded-xl border border-border/30 bg-background/50 p-3">
							<div class="mb-2 flex items-center gap-2">
								{#if group.equipment?.image_url}
									<img
										src={group.equipment.image_url}
										alt=""
										class="h-7 w-7 rounded-md object-cover"
									/>
								{/if}
								<p class="text-sm font-semibold">{group.equipment?.name || `#${eqId}`}</p>
								{#if group.equipment?.model}
									<span class="text-[10px] text-muted-foreground">{group.equipment.model}</span>
								{/if}
							</div>
							<div class="space-y-2">
								{#each group.actions as action, i}
									<div
										style="animation-delay: {i * 40}ms; animation-fill-mode: backwards;"
										class="flex animate-fade-in-down items-start gap-2 rounded-lg bg-muted/30 p-2.5"
									>
										<Wrench class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<Badge variant="secondary" class="text-[9px]">
													{VISIT_ACTION_LABELS[action.action_type as VisitActionType] ||
														action.action_type}
												</Badge>
												<span class="text-[10px] text-muted-foreground"
													>{formatTime(action.created_at)}</span
												>
											</div>
											<p class="mt-1 text-[11px] text-muted-foreground">{action.description}</p>
											{#if action.images?.length}
												<div class="mt-2 flex gap-2">
													{#each action.images as img}
														<img src={img} alt="" class="h-12 w-12 rounded-md object-cover" />
													{/each}
												</div>
											{/if}
											{#if action.cost > 0}
												<p class="mt-1 text-[10px] text-muted-foreground">Κόστος: {action.cost}€</p>
											{/if}
										</div>
										{#if !isCompleted}
											<Button
												variant="ghost"
												size="icon"
												class="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
												onclick={() => handleDeleteAction(action.id)}
											>
												<Trash2 class="h-3 w-3" />
											</Button>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{:else}
					<div
						class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 text-muted-foreground"
					>
						<Wrench class="mb-2 h-6 w-6 opacity-30" />
						<p class="text-xs">Δεν έχουν προστεθεί ενέργειες</p>
						{#if !isCompleted}
							<p class="text-[10px] opacity-70">Επιλέξτε εξοπλισμό παραπάνω</p>
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Status Update + Complete (only for active visits) -->
		{#if !isCompleted}
			<!-- Optional Status Update -->
			<Card.Root class="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
				<button
					class="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
					onclick={() => (showStatusUpdate = !showStatusUpdate)}
				>
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-muted p-2">
							<CheckCircle2 class="h-4 w-4 text-muted-foreground" />
						</div>
						<div>
							<p class="text-sm font-medium">Ενημέρωση κατάστασης εξοπλισμού</p>
							<p class="text-xs text-muted-foreground">
								Προαιρετικό — αλλάξτε κατάσταση ή ημερομηνία service
							</p>
						</div>
					</div>
					<ChevronDown
						class="h-4 w-4 text-muted-foreground transition-transform {showStatusUpdate
							? 'rotate-180'
							: ''}"
					/>
				</button>

				{#if showStatusUpdate}
					<div class="space-y-3 border-t border-border/30 p-4">
						<div class="space-y-1.5">
							<Label class="text-xs font-medium text-muted-foreground">Εξοπλισμός</Label>
							<Select.Root
								type="single"
								name="statusEquipment"
								bind:value={selectedEquipmentForStatus}
							>
								<Select.Trigger class="h-9 w-full text-sm">{statusTriggerLabel}</Select.Trigger>
								<Select.Content>
									<Select.Group>
										{#each allEquipments as eq}
											<Select.Item value={String(eq.id)} label={eq.name}>
												{eq.name} — {statusLabels[eq.status] || eq.status}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="space-y-1.5">
							<Label class="text-xs font-medium text-muted-foreground">Νέα κατάσταση</Label>
							<Select.Root type="single" name="newStatus" bind:value={newStatus}>
								<Select.Trigger class="h-9 w-full text-sm">{newStatusTriggerLabel}</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Item value="operational" label="Σε λειτουργία"
											>Σε λειτουργία</Select.Item
										>
										<Select.Item value="maintenance" label="Σε service">Σε service</Select.Item>
										<Select.Item value="broken" label="Βλάβη">Βλάβη</Select.Item>
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="space-y-1.5">
							<Label class="text-xs font-medium text-muted-foreground"
								>Επόμενο service (προαιρετικό)</Label
							>
							<Input type="date" bind:value={newNextServiceDate} class="h-9 text-sm" />
						</div>
						<Button
							size="sm"
							class="w-full"
							disabled={!selectedEquipmentForStatus || !newStatus || isUpdatingStatus}
							onclick={handleStatusUpdate}
						>
							{#if isUpdatingStatus}
								Ενημέρωση... <Spinner class="ml-1.5 h-3 w-3" />
							{:else}
								Ενημέρωση Κατάστασης
							{/if}
						</Button>
					</div>
				{/if}
			</Card.Root>

			<!-- Notes + Complete -->
			<Card.Root class="rounded-2xl border-2 border-primary/30 bg-card/60 backdrop-blur-sm">
				<div class="space-y-4 p-4">
					<div class="space-y-1.5">
						<Label class="text-xs font-medium text-muted-foreground"
							>Σημειώσεις επίσκεψης (προαιρετικό)</Label
						>
						<Textarea
							bind:value={visitNotes}
							placeholder="Γενικές παρατηρήσεις για το κατάστημα..."
							class="min-h-20 text-sm"
						/>
					</div>

					<Button class="w-full gap-2" size="lg" onclick={openCompleteModal}>
						<CheckCircle2 class="h-4 w-4" />
						Ολοκλήρωση Επίσκεψης
					</Button>
				</div>
			</Card.Root>
		{/if}
	{/if}
</div>

<!-- Action Form Dialog -->
{#if visit && !isCompleted}
	<VisitActionForm
		bind:open={actionFormOpen}
		{visitId}
		equipmentId={actionEquipmentId}
		equipmentName={actionEquipmentName}
		onActionAdded={() => visitQuery.refresh()}
	/>
{/if}

<!-- Cancel Confirmation Dialog -->
<Dialog.Root bind:open={cancelDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				<AlertTriangle class="h-5 w-5" />
				Ακύρωση Επίσκεψης
			</Dialog.Title>
			<Dialog.Description>
				Είστε σίγουροι; Η επίσκεψη και <strong>όλες οι ενέργειες</strong> ({actions.length}) θα
				διαγραφούν μόνιμα.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="gap-2">
			<Button variant="outline" onclick={() => (cancelDialogOpen = false)} disabled={isCancelling}>
				Πίσω
			</Button>
			<Button variant="destructive" onclick={handleCancel} disabled={isCancelling}>
				{#if isCancelling}
					Διαγραφή... <Spinner class="ml-1.5 h-3.5 w-3.5" />
				{:else}
					Ναι, Ακύρωση
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Complete Visit Modal -->
<Dialog.Root bind:open={completeModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<CheckCircle2 class="h-5 w-5 text-primary" />
				Ολοκλήρωση Επίσκεψης
			</Dialog.Title>
			<Dialog.Description>
				{#if openIssues.length > 0}
					Υπάρχουν ανοιχτές βλάβες σε αυτό το κατάστημα. Επιλέξτε όσες επιλύσατε.
				{:else}
					Είστε σίγουροι ότι θέλετε να ολοκληρώσετε την επίσκεψη;
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if openIssues.length > 0}
			<div class="max-h-64 space-y-2 overflow-y-auto py-2">
				{#each openIssues as issue (issue.id)}
					{@const isChecked = selectedResolvedIds.has(issue.id)}
					<button
						class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all
							{isChecked
							? 'border-emerald-500/40 bg-emerald-500/5'
							: 'border-border/30 bg-background/50 hover:border-border/60'}"
						onclick={() => toggleResolvedId(issue.id)}
					>
						<Checkbox checked={isChecked} class="mt-0.5" />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<p class="text-xs font-semibold">{issue.equipment?.name || '—'}</p>
								<Badge
									variant="secondary"
									class="text-[9px] {issue.status === 'open'
										? 'bg-red-500/10 text-red-600 dark:text-red-400'
										: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}"
								>
									{issue.status === 'open' ? 'Ανοιχτή' : 'Σε εξέλιξη'}
								</Badge>
							</div>
							<p class="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
								{issue.issue_description}
							</p>
							{#if issue.profiles?.username}
								<p class="mt-1 text-[10px] text-muted-foreground">
									Από: {issue.profiles.username}
								</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			{#if selectedResolvedIds.size > 0}
				<p class="text-xs text-emerald-600 dark:text-emerald-400">
					{selectedResolvedIds.size} βλάβ{selectedResolvedIds.size === 1 ? 'η' : 'ες'} θα σημειωθ{selectedResolvedIds.size === 1 ? 'εί' : 'ούν'} ως επιλυμέν{selectedResolvedIds.size === 1 ? 'η' : 'ες'}
				</p>
			{/if}
		{/if}

		<Dialog.Footer class="gap-2">
			<Button
				variant="outline"
				onclick={() => (completeModalOpen = false)}
				disabled={isCompleting}
			>
				Πίσω
			</Button>
			<Button class="gap-1.5" onclick={handleComplete} disabled={isCompleting}>
				{#if isCompleting}
					Ολοκλήρωση... <Spinner class="h-3.5 w-3.5" />
				{:else}
					<CheckCircle2 class="h-3.5 w-3.5" />
					Ολοκλήρωση
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
