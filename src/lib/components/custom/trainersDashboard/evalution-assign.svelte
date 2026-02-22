<script lang="ts">
	import * as Modal from '$lib/components/ui/modal/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import {
		X,
		CalendarIcon,
		ChevronDown,
		Check,
		User,
		Building2,
		ArrowRight,
		Plus
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { fly, scale, fade } from 'svelte/transition';
	import { cubicOut, backOut } from 'svelte/easing';
	import InputCalendar from '../inputCalendar.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	// ─── Props ───
	interface Props {
		open: boolean;
		trainers: Array<{ id: string; full_name: string | null; username: string; imageUrl: string }>;
		organizations: Array<{ id: number; store_name: string }>;
		onsubmit: (data: {
			trainerId: string;
			orgIds: number[];
			visitDate: string;
		}) => Promise<{ success: boolean; message?: string }>;
	}

	let { open = $bindable(false), trainers, organizations, onsubmit }: Props = $props();

	// ─── State ───
	let visitDate = $state('');
	let selectedTrainerId = $state('');
	let selectedOrgIds = $state<number[]>([]);
	let isSubmitting = $state(false);
	let submitError = $state('');

	// Dropdown open states
	let trainerDropdownOpen = $state(false);
	let orgDropdownOpen = $state(false);

	// Search filters
	let trainerSearch = $state('');
	let orgSearch = $state('');

	// ─── Derived ───
	let selectedTrainer = $derived(trainers.find((t) => t.id === selectedTrainerId));

	let selectedOrgs = $derived(organizations.filter((o) => selectedOrgIds.includes(o.id)));

	let filteredTrainers = $derived(
		trainers.filter((t) => {
			const name = (t.full_name || t.username || '').toLowerCase();
			return name.includes(trainerSearch.toLowerCase());
		})
	);

	let filteredOrgs = $derived(
		organizations.filter((o) => {
			return o.store_name.toLowerCase().includes(orgSearch.toLowerCase());
		})
	);

	let isFormValid = $derived(
		visitDate !== '' && selectedTrainerId !== '' && selectedOrgIds.length > 0
	);

	// ─── Handlers ───
	function reset() {
		visitDate = '';
		selectedTrainerId = '';
		selectedOrgIds = [];
		isSubmitting = false;
		submitError = '';
		trainerSearch = '';
		orgSearch = '';
		trainerDropdownOpen = false;
		orgDropdownOpen = false;
	}

	function closeModal() {
		open = false;
		// Reset after animation
		setTimeout(reset, 300);
	}

	function toggleOrg(orgId: number) {
		if (selectedOrgIds.includes(orgId)) {
			selectedOrgIds = selectedOrgIds.filter((id) => id !== orgId);
		} else {
			selectedOrgIds = [...selectedOrgIds, orgId];
		}
	}

	function removeOrg(orgId: number) {
		selectedOrgIds = selectedOrgIds.filter((id) => id !== orgId);
	}

	async function handleSubmit() {
		if (!isFormValid || isSubmitting) return;
		isSubmitting = true;
		submitError = '';

		try {
			const result = await onsubmit({
				trainerId: selectedTrainerId,
				orgIds: selectedOrgIds,
				visitDate
			});

			if (result.success) {
				toast.success('Η ανάθεση αξιολόγησης δημιουργήθηκε επιτυχώς');
				closeModal();
			} else {
				submitError = result.message || 'Σφάλμα κατά τη δημιουργία';
			}
		} catch (err: any) {
			submitError = err?.message || 'Παρουσιάστηκε σφάλμα';
		} finally {
			isSubmitting = false;
		}
	}

	// Close dropdowns on outside click
	function handleClickOutsideTrainer(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.trainer-dropdown-container')) {
			trainerDropdownOpen = false;
		}
	}

	function handleClickOutsideOrg(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.org-dropdown-container')) {
			orgDropdownOpen = false;
		}
	}
</script>

<svelte:window
	onclick={(e) => {
		handleClickOutsideTrainer(e);
		handleClickOutsideOrg(e);
	}}
/>

<Modal.Root bind:open>
	<Modal.Content class="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
		<Modal.Header>
			<Modal.Title class="flex items-center gap-2 text-lg">
				<Plus class="h-5 w-5" />
				Νέα Ανάθεση Αξιολόγησης
			</Modal.Title>
			<Modal.Description>
				Επιλέξτε trainer, ημερομηνία επίσκεψης και καταστήματα για αξιολόγηση
			</Modal.Description>
		</Modal.Header>

		<div class="flex-1 space-y-5 overflow-y-auto px-1 py-4">
			<!-- VISIT DATE -->
			<div class="space-y-2">
				<Label for="visit-date" class="flex items-center gap-1.5 text-sm font-medium">
					<CalendarIcon class="h-3.5 w-3.5 text-muted-foreground" />
					Ημερομηνία Επίσκεψης
				</Label>
				<InputCalendar id="visit-date" bind:value={visitDate} />
			</div>

			<!-- TRAINER SELECT (Custom Dropdown) -->
			<div class="space-y-2">
				<Label class="flex items-center gap-1.5 text-sm font-medium">
					<User class="h-3.5 w-3.5 text-muted-foreground" />
					Trainer
				</Label>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="trainer-dropdown-container relative">
					<button
						type="button"
						class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent/50 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						onclick={() => (trainerDropdownOpen = !trainerDropdownOpen)}
						disabled={isSubmitting}
					>
						<span class={selectedTrainer ? 'text-foreground' : 'text-muted-foreground'}>
							{selectedTrainer
								? selectedTrainer.full_name || selectedTrainer.username
								: 'Επιλέξτε trainer...'}
						</span>
						<ChevronDown
							class="h-4 w-4 text-muted-foreground transition-transform duration-200 {trainerDropdownOpen
								? 'rotate-180'
								: ''}"
						/>
					</button>

					{#if trainerDropdownOpen}
						<div
							class="absolute z-50 mt-1 w-full rounded-md border border-border/50 bg-popover shadow-lg"
							transition:fly={{ y: -8, duration: 200, easing: cubicOut }}
						>
							<div class="p-2">
								<Input
									placeholder="Αναζήτηση trainer..."
									bind:value={trainerSearch}
									class="h-8 text-sm"
								/>
							</div>
							<div class="max-h-48 overflow-y-auto px-1 pb-1">
								{#each filteredTrainers as trainer (trainer.id)}
									<button
										type="button"
										class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent {selectedTrainerId ===
										trainer.id
											? 'bg-accent'
											: ''}"
										onclick={() => {
											selectedTrainerId = trainer.id;
											trainerDropdownOpen = false;
											trainerSearch = '';
										}}
									>
										<Avatar.Root class="h-6 w-6 rounded-full dark:bg-white">
											<Avatar.Image src={trainer.imageUrl} alt={trainer.username} />
											<Avatar.Fallback class="rounded-lg"
												>{(trainer.full_name || trainer.username || '?')
													.charAt(0)
													.toUpperCase()}</Avatar.Fallback
											>
										</Avatar.Root>
										<span>{trainer.full_name || trainer.username}</span>
										{#if selectedTrainerId === trainer.id}
											<Check class="ml-auto h-4 w-4 text-primary" />
										{/if}
									</button>
								{:else}
									<p class="px-2 py-3 text-center text-sm text-muted-foreground">
										Δεν βρέθηκαν trainers
									</p>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- ORGANIZATION MULTI-SELECT -->
			<div class="space-y-2">
				<Label class="flex items-center gap-1.5 text-sm font-medium">
					<Building2 class="h-3.5 w-3.5 text-muted-foreground" />
					Καταστήματα για Αξιολόγηση
					{#if selectedOrgIds.length > 0}
						<span
							class="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
						>
							{selectedOrgIds.length}
						</span>
					{/if}
				</Label>
				<div class="org-dropdown-container relative">
					<button
						type="button"
						class="flex min-h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent/50 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						onclick={() => (orgDropdownOpen = !orgDropdownOpen)}
						disabled={isSubmitting}
					>
						<span class={selectedOrgIds.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
							{selectedOrgIds.length > 0
								? `${selectedOrgIds.length} κατάστημα(τα) επιλεγμένα`
								: 'Επιλέξτε καταστήματα...'}
						</span>
						<ChevronDown
							class="h-4 w-4 text-muted-foreground transition-transform duration-200 {orgDropdownOpen
								? 'rotate-180'
								: ''}"
						/>
					</button>

					{#if orgDropdownOpen}
						<div
							class="absolute z-50 mt-1 w-full rounded-md border border-border/50 bg-popover shadow-lg"
							transition:fly={{ y: -8, duration: 200, easing: cubicOut }}
						>
							<div class="p-2">
								<Input
									placeholder="Αναζήτηση καταστήματος..."
									bind:value={orgSearch}
									class="h-8 text-sm"
								/>
							</div>
							<div class="max-h-48 overflow-y-auto px-1 pb-1">
								{#each filteredOrgs as org (org.id)}
									<button
										type="button"
										class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
										onclick={() => toggleOrg(org.id)}
									>
										<div
											class="flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors {selectedOrgIds.includes(
												org.id
											)
												? 'border-primary bg-primary'
												: 'border-muted-foreground/30'}"
										>
											{#if selectedOrgIds.includes(org.id)}
												<Check class="h-3 w-3 text-primary-foreground" />
											{/if}
										</div>
										<span>{org.store_name}</span>
									</button>
								{:else}
									<p class="px-2 py-3 text-center text-sm text-muted-foreground">
										Δεν βρέθηκαν καταστήματα
									</p>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Selected orgs chips -->
				{#if selectedOrgIds.length > 0}
					<div class="flex flex-wrap gap-1.5 pt-1">
						{#each selectedOrgs as org (org.id)}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
								in:scale={{ start: 0.8, duration: 200, easing: backOut }}
								out:scale={{ start: 0.8, duration: 150 }}
							>
								{org.store_name}
								<button
									type="button"
									class="rounded-full p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
									onclick={() => removeOrg(org.id)}
								>
									<X class="h-3 w-3" />
								</button>
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- PREVIEW SECTION (appears when trainer + orgs selected) -->
			{#if selectedTrainer && selectedOrgs.length > 0}
				<div
					class="rounded-lg border border-dashed border-border/50 bg-primary/5 p-4"
					in:fly={{ y: 20, duration: 350, easing: backOut }}
				>
					<p class="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Προεπισκόπηση Ανάθεσης
					</p>
					<div class="flex items-start gap-3">
						<!-- Trainer card -->
						<div
							class="flex shrink-0 flex-col items-center gap-1.5"
							in:scale={{ start: 0.5, duration: 300, delay: 100, easing: backOut }}
						>
							<Avatar.Root class="h-12 w-12 rounded-full dark:bg-white">
								<Avatar.Image src={selectedTrainer.imageUrl} alt={selectedTrainer.username} />
								<Avatar.Fallback class="rounded-lg"
									>{(selectedTrainer.full_name || selectedTrainer.username || '?')
										.charAt(0)
										.toUpperCase()}</Avatar.Fallback
								>
							</Avatar.Root>
							<span class="max-w-[80px] truncate text-xs font-medium">
								{selectedTrainer.full_name || selectedTrainer.username}
							</span>
						</div>

						<!-- Arrow -->
						<div
							class="flex shrink-0 items-center self-center pt-0"
							in:fly={{ x: -10, duration: 300, delay: 200, easing: cubicOut }}
						>
							<ArrowRight class="h-5 w-5 text-primary/50" />
						</div>

						<!-- Organizations list -->
						<div class="flex flex-1 flex-row flex-wrap gap-2">
							{#each selectedOrgs as org, i (org.id)}
								<Badge variant="secondary">
									<Building2 class="h-3.5 w-3.5 text-muted-foreground" />
									{org.store_name}
								</Badge>
							{/each}
						</div>
					</div>

					{#if visitDate}
						<div
							class="mt-3 flex items-center gap-1.5 border-t border-primary/10 pt-2 text-xs text-muted-foreground"
							in:fade={{ duration: 200, delay: 400 }}
						>
							<CalendarIcon class="h-3 w-3" />
							Ημερομηνία: {new Date(visitDate).toLocaleDateString('el-GR', {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Error message -->
			{#if submitError}
				<div
					class="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
					in:fly={{ y: 5, duration: 200 }}
				>
					<X class="h-4 w-4 shrink-0" />
					<span>{submitError}</span>
				</div>
			{/if}
		</div>

		<Modal.Footer class="gap-2 border-t pt-4">
			<Button variant="outline" onclick={closeModal} disabled={isSubmitting}>Ακύρωση</Button>
			<Button onclick={handleSubmit} disabled={!isFormValid || isSubmitting} class="gap-2">
				{#if isSubmitting}
					<Spinner class="h-4 w-4" />
					Δημιουργία...
				{:else}
					<Plus class="h-4 w-4" />
					Δημιουργία Ανάθεσης
				{/if}
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>
