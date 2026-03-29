<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Play, CheckCircle2, Trash2, Wrench, MapPin, Clock, ChevronDown } from 'lucide-svelte';
	import {
		completeVisit,
		updateEquipmentStatus,
		deleteVisitAction
	} from '$lib/api/trainers/equipment/data.remote.js';
	import {
		VISIT_ACTION_LABELS,
		type VisitActionType,
		type EquipmentStatus,
		type TrainerServiceVisit
	} from '$lib/models/equipment.types.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	type VisitAction = {
		id: number;
		visit_id: number;
		equipment_id: number;
		action_type: string;
		description: string;
		images: string[] | null;
		cost: number;
		status_change: string | null;
		next_service_date: string | null;
		created_at: string;
	};

	let {
		visit,
		actions = [],
		equipments = [],
		onVisitCompleted,
		onActionDeleted
	}: {
		visit: TrainerServiceVisit;
		actions: VisitAction[];
		equipments: { id: number; name: string; model: string | null; status: EquipmentStatus }[];
		onVisitCompleted?: () => void;
		onActionDeleted?: () => void;
	} = $props();

	let isCompleting = $state(false);
	let visitNotes = $derived(visit.notes || '');
	let showStatusUpdate = $state(false);

	// Equipment status update state
	let selectedEquipmentForStatus = $state('');
	let newStatus = $state('');
	let newNextServiceDate = $state('');
	let isUpdatingStatus = $state(false);

	// Group actions by equipment
	let actionsByEquipment = $derived.by(() => {
		const grouped = new Map<
			number,
			{ equipment: (typeof equipments)[0] | undefined; actions: VisitAction[] }
		>();
		for (const action of actions) {
			if (!grouped.has(action.equipment_id)) {
				grouped.set(action.equipment_id, {
					equipment: equipments.find((e) => e.id === action.equipment_id),
					actions: []
				});
			}
			grouped.get(action.equipment_id)!.actions.push(action);
		}
		return grouped;
	});

	let statusTriggerLabel = $derived(
		selectedEquipmentForStatus
			? equipments.find((e) => e.id === Number(selectedEquipmentForStatus))?.name || 'Επιλέξτε...'
			: 'Επιλέξτε εξοπλισμό...'
	);

	const statusLabels: Record<string, string> = {
		operational: 'Σε λειτουργία',
		maintenance: 'Σε service',
		broken: 'Βλάβη'
	};

	let newStatusTriggerLabel = $derived(
		newStatus ? statusLabels[newStatus] || newStatus : 'Επιλέξτε κατάσταση...'
	);

	async function handleComplete() {
		isCompleting = true;
		try {
			const result = await completeVisit({
				visitId: visit.id,
				notes: visitNotes.trim() || undefined
			});

			if (result.success) {
				showSuccessToast('Επιτυχία', 'Η επίσκεψη ολοκληρώθηκε');
				onVisitCompleted?.();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία ολοκλήρωσης');
			}
		} catch (err) {
			console.error('[ActiveVisitPanel] Complete error:', err);
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isCompleting = false;
		}
	}

	async function handleDeleteAction(actionId: number) {
		try {
			const result = await deleteVisitAction({ actionId });
			if (result.success) {
				showSuccessToast('Διαγράφηκε', 'Η ενέργεια αφαιρέθηκε');
				onActionDeleted?.();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία διαγραφής');
			}
		} catch (err) {
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
				showSuccessToast('Επιτυχία', 'Η κατάσταση ενημερώθηκε');
				selectedEquipmentForStatus = '';
				newStatus = '';
				newNextServiceDate = '';
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία ενημέρωσης');
			}
		} catch (err) {
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isUpdatingStatus = false;
		}
	}

	function formatTime(dateStr: string): string {
		return new Intl.DateTimeFormat('el-GR', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(dateStr));
	}
</script>

<Card.Root
	class="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card/60 backdrop-blur-sm"
>
	<!-- Active indicator glow -->
	<div class="absolute -top-16 -right-16 -z-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl"></div>

	<Card.Header class="pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="relative">
					<div class="rounded-lg bg-primary/10 p-2">
						<Play class="h-4 w-4 text-primary" />
					</div>
					<div
						class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-card"
					></div>
				</div>
				<div>
					<Card.Title class="text-base">Ενεργή Επίσκεψη</Card.Title>
					<Card.Description class="text-xs">
						{new Intl.DateTimeFormat('el-GR', {
							day: 'numeric',
							month: 'long',
							year: 'numeric'
						}).format(new Date(visit.visit_date))}
					</Card.Description>
				</div>
			</div>
			<Badge
				class="gap-1 border-0 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
			>
				<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
				Σε εξέλιξη
			</Badge>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Actions List -->
		{#if actions.length > 0}
			<div class="space-y-3">
				<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Ενέργειες ({actions.length})
				</p>

				{#each [...actionsByEquipment.entries()] as [eqId, group]}
					<div class="rounded-xl border border-border/30 bg-background/50 p-3">
						<p class="mb-2 text-xs font-semibold">{group.equipment?.name || `#${eqId}`}</p>
						<div class="space-y-2">
							{#each group.actions as action}
								<div class="flex items-start gap-2 rounded-lg bg-muted/30 p-2">
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
										<p class="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
											{action.description}
										</p>
										{#if action.cost > 0}
											<p class="mt-0.5 text-[10px] text-muted-foreground">Κόστος: {action.cost}€</p>
										{/if}
									</div>
									<Button
										variant="ghost"
										size="icon"
										class="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
										onclick={() => handleDeleteAction(action.id)}
									>
										<Trash2 class="h-3 w-3" />
									</Button>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-6 text-muted-foreground"
			>
				<Wrench class="mb-2 h-6 w-6 opacity-30" />
				<p class="text-xs">Δεν έχουν προστεθεί ενέργειες ακόμα</p>
				<p class="text-[10px] opacity-70">Πατήστε "Προσθήκη Ενέργειας" σε ένα μηχάνημα</p>
			</div>
		{/if}

		<!-- Optional Status Update -->
		<div class="space-y-2">
			<button
				class="flex w-full items-center justify-between rounded-lg bg-muted/30 p-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
				onclick={() => (showStatusUpdate = !showStatusUpdate)}
			>
				Ενημέρωση κατάστασης εξοπλισμού (προαιρετικό)
				<ChevronDown
					class="h-3.5 w-3.5 transition-transform {showStatusUpdate ? 'rotate-180' : ''}"
				/>
			</button>

			{#if showStatusUpdate}
				<div class="space-y-3 rounded-xl border border-border/30 bg-background/50 p-3">
					<!-- Equipment Select -->
					<div class="space-y-1.5">
						<Label class="text-[11px] font-medium text-muted-foreground">Εξοπλισμός</Label>
						<Select.Root
							type="single"
							name="statusEquipment"
							bind:value={selectedEquipmentForStatus}
						>
							<Select.Trigger class="h-8 w-full text-xs">
								{statusTriggerLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each equipments as eq}
										<Select.Item value={String(eq.id)} label={eq.name}>
											{eq.name} — {statusLabels[eq.status]}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- New Status -->
					<div class="space-y-1.5">
						<Label class="text-[11px] font-medium text-muted-foreground">Νέα κατάσταση</Label>
						<Select.Root type="single" name="newStatus" bind:value={newStatus}>
							<Select.Trigger class="h-8 w-full text-xs">
								{newStatusTriggerLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Item value="operational" label="Σε λειτουργία">Σε λειτουργία</Select.Item>
									<Select.Item value="maintenance" label="Σε service">Σε service</Select.Item>
									<Select.Item value="broken" label="Βλάβη">Βλάβη</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Next Service Date -->
					<div class="space-y-1.5">
						<Label class="text-[11px] font-medium text-muted-foreground"
							>Επόμενο service (προαιρετικό)</Label
						>
						<Input type="date" bind:value={newNextServiceDate} class="h-8 text-xs" />
					</div>

					<Button
						size="sm"
						class="h-8 w-full text-xs"
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
		</div>

		<!-- Visit Notes -->
		<div class="space-y-1.5">
			<Label class="text-[11px] font-medium text-muted-foreground"
				>Σημειώσεις επίσκεψης (προαιρετικό)</Label
			>
			<Textarea
				bind:value={visitNotes}
				placeholder="Γενικές παρατηρήσεις για το κατάστημα..."
				class="min-h-16 text-xs"
			/>
		</div>

		<!-- Complete Button -->
		<Button class="w-full gap-2" onclick={handleComplete} disabled={isCompleting}>
			{#if isCompleting}
				Ολοκλήρωση... <Spinner class="h-4 w-4" />
			{:else}
				<CheckCircle2 class="h-4 w-4" />
				Ολοκλήρωση Επίσκεψης
			{/if}
		</Button>
	</Card.Content>
</Card.Root>
