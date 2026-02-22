<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import {
		getTrainerAssignments,
		unassignTrainer,
		assignTrainerToOrg,
		deleteAssignment
	} from '$lib/api/trainers/trainer_managment/data.remote';
	import {
		Trash2,
		Search,
		Building2,
		CalendarDays,
		AlertTriangle,
		RefreshCcw,
		Filter,
		X,
		Users,
		MapPin,
		Clock,
		UserCheck
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { fly, fade } from 'svelte/transition';

	// ─── Only prop: open ───
	let { open = $bindable(false) }: { open: boolean } = $props();

	// ─── Internal State ───
	let isLoading = $state(false);
	let searchQuery = $state('');
	let filterMode = $state<'all' | 'active' | 'inactive'>('all');
	let togglingIds = $state<Set<number>>(new Set());
	let deletingId = $state<number | null>(null);
	let confirmDeleteId = $state<number | null>(null);
	let isRefreshing = $state(false);
	let showFilters = $state(false);

	const query = getTrainerAssignments();
	let assignments = $derived(query.current?.assignments ?? []);
	// ─── Derived ───
	let filteredAssignments = $derived.by(() => {
		let result = assignments;

		if (filterMode === 'active') {
			result = result.filter((a) => a.is_active);
		} else if (filterMode === 'inactive') {
			result = result.filter((a) => !a.is_active);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(a) =>
					(a.profiles?.full_name || '').toLowerCase().includes(q) ||
					(a.profiles?.username || '').toLowerCase().includes(q) ||
					(a.core_organizations?.store_name || '').toLowerCase().includes(q)
			);
		}

		return result;
	});

	let counts = $derived({
		total: assignments.length,
		active: assignments.filter((a) => a.is_active).length,
		inactive: assignments.filter((a) => !a.is_active).length
	});

	// ─── Toggle (activate / deactivate) ───
	async function handleToggle(assignment: any) {
		togglingIds = new Set([...togglingIds, assignment.id]);

		try {
			if (assignment.is_active) {
				const result = await unassignTrainer({ assignmentId: assignment.id });
				if (result.success) {
                    handleRefresh()
					toast.success('Η ανάθεση απενεργοποιήθηκε');
				}
			} else {
				const result = await assignTrainerToOrg({
					trainerId: assignment.profiles.id,
					orgId: assignment.core_organizations.id,
					visitDate: assignment.visit_date
				});
				if (result.success) {
                    handleRefresh()
					toast.success('Η ανάθεση ενεργοποιήθηκε');
				}
			}
		} catch (err) {
			console.error('[ActiveAssignmentsSheet] Toggle error:', err);
			toast.error('Σφάλμα κατά την ενημέρωση');
		} finally {
			togglingIds = new Set([...togglingIds].filter((id) => id !== assignment.id));
		}
	}

	// ─── Delete (double-click confirm) ───
	async function handleDelete(assignmentId: number) {
		if (confirmDeleteId !== assignmentId) {
			confirmDeleteId = assignmentId;
			setTimeout(() => {
				if (confirmDeleteId === assignmentId) {
					confirmDeleteId = null;
				}
			}, 3000);
			return;
		}

		deletingId = assignmentId;
		confirmDeleteId = null;

		try {
			const result = await deleteAssignment({ assignmentId });
			if (result.success) {
				handleRefresh()
				toast.success('Η ανάθεση διαγράφηκε');
			}
		} catch (err) {
			console.error('[ActiveAssignmentsSheet] Delete error:', err);
			toast.error('Σφάλμα κατά τη διαγραφή');
		} finally {
			deletingId = null;
		}
	}

	async function handleRefresh() {
		isRefreshing = true;
		await query.refresh();
		isRefreshing = false;
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('el-GR', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function getInitials(name: string | null, username: string): string {
		if (name) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		return username.charAt(0).toUpperCase();
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex w-full flex-col overflow-hidden p-0 sm:max-w-lg">

		<!-- ════════════════════════════════════════════ -->
		<!-- HEADER                                      -->
		<!-- ════════════════════════════════════════════ -->
		<Sheet.Header class="shrink-0 border-b border-border/50 bg-muted/30 px-5 pb-4 pt-8">
			<div class="flex items-start justify-between">
				<div class="space-y-1">
					<Sheet.Title class="text-lg font-semibold tracking-tight">
						Αναθέσεις Εκπαιδευτών
					</Sheet.Title>
					<Sheet.Description class="text-sm text-muted-foreground">
						Διαχείριση αναθέσεων εκπαιδευτών σε καταστήματα
					</Sheet.Description>
				</div>
				<div class="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 text-muted-foreground hover:text-foreground"
						onclick={() => (showFilters = !showFilters)}
					>
						{#if showFilters}
							<X class="h-4 w-4" />
						{:else}
							<Filter class="h-4 w-4" />
						{/if}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 text-muted-foreground hover:text-foreground"
						onclick={handleRefresh}
						disabled={isRefreshing}
					>
						<RefreshCcw class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise repeat-infinite' : ''}" />
					</Button>
				</div>
			</div>
		</Sheet.Header>

		<!-- ════════════════════════════════════════════ -->
		<!-- FILTERS BAR                                 -->
		<!-- ════════════════════════════════════════════ -->
		{#if showFilters}
			<div
				class="shrink-0 space-y-3 border-b border-border/40 bg-muted/15 px-5 py-3"
				transition:fly={{ y: -10, duration: 200 }}
			>
				<!-- Search -->
				<div class="relative">
					<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Αναζήτηση εκπαιδευτή ή καταστήματος…"
						class="h-9 pl-9 text-sm"
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<button
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
							onclick={() => (searchQuery = '')}
						>
							<X class="h-3.5 w-3.5" />
						</button>
					{/if}
				</div>

				<!-- Filter pills -->
				<div class="flex gap-1.5">
					<button
						class="rounded-full px-3 py-1 text-xs font-medium transition-colors
							{filterMode === 'all'
								? 'bg-foreground text-background'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
						onclick={() => (filterMode = 'all')}
					>
						Όλες ({counts.total})
					</button>
					<button
						class="rounded-full px-3 py-1 text-xs font-medium transition-colors
							{filterMode === 'active'
								? 'bg-emerald-600 text-white'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
						onclick={() => (filterMode = 'active')}
					>
						Ενεργές ({counts.active})
					</button>
					<button
						class="rounded-full px-3 py-1 text-xs font-medium transition-colors
							{filterMode === 'inactive'
								? 'bg-orange-600 text-white'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
						onclick={() => (filterMode = 'inactive')}
					>
						Ανενεργές ({counts.inactive})
					</button>
				</div>
			</div>
		{/if}

		<!-- ════════════════════════════════════════════ -->
		<!-- SUMMARY BAR                                 -->
		<!-- ════════════════════════════════════════════ -->
		<div class="flex shrink-0 items-center justify-between border-b border-border/40 px-5 py-2.5">
			<span class="text-xs font-medium text-muted-foreground">
				{filteredAssignments.length}/{assignments.length} αναθέσεις
			</span>
			{#if searchQuery || filterMode !== 'all'}
				<button
					class="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
					onclick={() => {
						searchQuery = '';
						filterMode = 'all';
					}}
				>
					Εκκαθάριση φίλτρων
				</button>
			{/if}
		</div>

		<!-- ════════════════════════════════════════════ -->
		<!-- SCROLLABLE LIST                             -->
		<!-- ════════════════════════════════════════════ -->
		<div class="flex-1 overflow-y-auto">
			{#if isLoading}
				<div class="flex h-48 items-center justify-center">
					<Spinner class="h-6 w-6 text-muted-foreground" />
				</div>
			{:else if filteredAssignments.length === 0}
				<!-- Empty state -->
				<div class="flex h-48 flex-col items-center justify-center gap-3 px-5 text-center">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Users class="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<p class="text-sm font-medium text-foreground">Δεν βρέθηκαν αναθέσεις</p>
						<p class="text-xs text-muted-foreground">
							{#if searchQuery || filterMode !== 'all'}
								Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης
							{:else}
								Δεν υπάρχουν αναθέσεις προς το παρόν
							{/if}
						</p>
					</div>
				</div>
			{:else}
				<div class="divide-y divide-border/40">
					{#each filteredAssignments as assignment (assignment.id)}
						{@const profile = assignment.profiles}
						{@const org = assignment.core_organizations}
						{@const isToggling = togglingIds.has(assignment.id)}
						{@const isDeleting = deletingId === assignment.id}
						{@const isConfirmDelete = confirmDeleteId === assignment.id}

						<div
							class="group relative px-5 py-4 transition-colors hover:bg-muted/30
								{!assignment.is_active ? 'opacity-60' : ''}"
						>
							<div class="flex items-start gap-3.5">

								<!-- Avatar -->
								<div class="relative shrink-0">
									{#if profile?.image_url}
										<img
											src={profile.image_url}
											alt={profile.full_name ?? profile.username}
											class="h-10 w-10 rounded-full object-cover ring-2 dark:bg-white
												{assignment.is_active ? 'ring-emerald-500/30' : 'ring-border/50'}"
										/>
									{:else}
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold
												{assignment.is_active
													? 'bg-emerald-500/10 text-emerald-700 ring-2 ring-emerald-500/30'
													: 'bg-muted text-muted-foreground ring-2 ring-border/50'}"
										>
											{getInitials(profile?.full_name ?? null, profile?.username ?? '?')}
										</div>
									{/if}
									<!-- Active dot -->
									{#if assignment.is_active}
										<span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500"></span>
									{/if}
								</div>

								<!-- Info -->
								<div class="min-w-0 flex-1">
									<!-- Name row -->
									<div class="flex items-center gap-2">
										<span class="truncate text-sm font-semibold text-foreground">
											{profile?.full_name ?? profile?.username ?? 'Άγνωστος'}
										</span>
										{#if !assignment.is_active}
											<span class="shrink-0 rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-orange-600">
												Ανενεργή
											</span>
										{/if}
									</div>

									<!-- Org -->
									{#if org}
										<div class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
											<Building2 class="h-3 w-3 shrink-0" />
											<span class="truncate">{org.store_name}</span>
											{#if org.location}
												<span class="text-border">·</span>
												<MapPin class="h-3 w-3 shrink-0" />
												<span class="truncate">{org.location}</span>
											{/if}
										</div>
									{/if}

									<!-- Date row -->
									<div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
										{#if assignment.visit_date}
											<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
												<CalendarDays class="h-3 w-3" />
												<span>{formatDate(assignment.visit_date)}</span>
											</div>
										{/if}
										{#if assignment.assigned_by_profile}
											<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
												<UserCheck class="h-3 w-3" />
												<span>από {assignment.assigned_by_profile.full_name ?? assignment.assigned_by_profile.username}</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex shrink-0 items-center gap-2">
									<!-- Delete button -->
									<Button
										variant={isConfirmDelete ? 'destructive' : 'ghost'}
										size="icon"
										class="h-8 w-8 {isConfirmDelete ? '' : 'text-muted-foreground opacity-0 group-hover:opacity-100'} transition-all"
										onclick={() => handleDelete(assignment.id)}
										disabled={isDeleting}
									>
										{#if isDeleting}
											<Spinner class="h-3.5 w-3.5" />
										{:else if isConfirmDelete}
											<AlertTriangle class="h-3.5 w-3.5" />
										{:else}
											<Trash2 class="h-3.5 w-3.5" />
										{/if}
									</Button>

									<!-- Toggle switch -->
									<div class="flex items-center">
										{#if isToggling}
											<div class="flex h-5 w-9 items-center justify-center">
												<Spinner class="h-3.5 w-3.5 text-muted-foreground" />
											</div>
										{:else}
											<Switch
												checked={assignment.is_active}
												onCheckedChange={() => handleToggle(assignment)}
												class="scale-90"
											/>
										{/if}
									</div>
								</div>

							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ════════════════════════════════════════════ -->
		<!-- FOOTER                                      -->
		<!-- ════════════════════════════════════════════ -->
		<div class="shrink-0 border-t border-border/40 bg-muted/20 px-5 py-3">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<div class="flex items-center gap-3">
					<span class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						{counts.active} ενεργές
					</span>
					<span class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-orange-400"></span>
						{counts.inactive} ανενεργές
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					class="h-7 text-xs text-muted-foreground"
					onclick={() => (open = false)}
				>
					Κλείσιμο
				</Button>
			</div>
		</div>

	</Sheet.Content>
</Sheet.Root>