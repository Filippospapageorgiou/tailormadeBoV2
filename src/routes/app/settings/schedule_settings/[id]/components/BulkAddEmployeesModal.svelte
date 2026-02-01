<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Users, Search, UserPlus, Check } from 'lucide-svelte';
	import type { Profile } from '$lib/models/database.types';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		open: boolean;
		availableEmployees: Profile[];
		isLoading: boolean;
		onClose: () => void;
		onAdd: (employeeIds: string[]) => void;
	}

	let { open, availableEmployees, isLoading, onClose, onAdd }: Props = $props();

	let searchQuery = $state('');
	let selectedIds = new SvelteSet<string>();

	// Filter employees by search
	let filteredEmployees = $derived.by(() => {
		if (!searchQuery.trim()) return availableEmployees;

		const query = searchQuery.toLowerCase();
		return availableEmployees.filter(
			(emp) =>
				emp.username.toLowerCase().includes(query) ||
				emp.email.toLowerCase().includes(query) ||
				(emp.full_name && emp.full_name.toLowerCase().includes(query))
		);
	});

	// Toggle employee selection
	function toggleEmployee(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
	}

	// Select all filtered employees
	function selectAll() {
		filteredEmployees.forEach((emp) => selectedIds.add(emp.id));
	}

	// Deselect all
	function deselectAll() {
		selectedIds.clear();
	}

	// Get initials
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.substring(0, 2).toUpperCase();
	}

	// Handle close
	function handleClose() {
		resetState();
		onClose();
	}

	// Handle add
	function handleAdd() {
		onAdd(Array.from(selectedIds));
	}

	// Reset state when modal closes
	function resetState() {
		searchQuery = '';
		selectedIds.clear();
	}

	let selectedCount = $derived(selectedIds.size);
	let allSelected = $derived(
		filteredEmployees.length > 0 && filteredEmployees.every((emp) => selectedIds.has(emp.id))
	);
</script>

<Dialog bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Users class="h-5 w-5 text-primary" />
				Μαζική Προσθήκη Εργαζομένων
			</DialogTitle>
			<DialogDescription>
				Επιλέξτε τους εργαζόμενους που θέλετε να προσθέσετε στο πρόγραμμα.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<!-- Search -->
			<div class="relative">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					bind:value={searchQuery}
					placeholder="Αναζήτηση εργαζομένων..."
					class="border-white/10 bg-white/5 pl-9"
				/>
			</div>

			<!-- Select all / Deselect all -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">
					{selectedCount} επιλεγμένοι από {availableEmployees.length}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={selectAll} disabled={allSelected}>
						Επιλογή όλων
					</Button>
					<Button variant="ghost" size="sm" onclick={deselectAll} disabled={selectedCount === 0}>
						Αποεπιλογή
					</Button>
				</div>
			</div>

			<!-- Employee list -->
			<div class="max-h-[300px] space-y-2 overflow-y-auto pr-2">
				{#if filteredEmployees.length === 0}
					<div class="py-8 text-center">
						<p class="text-sm text-muted-foreground">
							{searchQuery ? 'Δεν βρέθηκαν εργαζόμενοι' : 'Όλοι οι εργαζόμενοι έχουν ήδη προστεθεί'}
						</p>
					</div>
				{:else}
					{#each filteredEmployees as employee (employee.id)}
						{@const isSelected = selectedIds.has(employee.id)}
						{@const badgeColor = employee.badge_color || '#3b82f6'}
						{@const initials = getInitials(employee.username)}

						<button
							type="button"
							onclick={() => toggleEmployee(employee.id)}
							class="flex w-full items-center gap-3 rounded-xl border p-3 transition-all duration-200 {isSelected
								? 'border-primary/40 bg-primary/10'
								: 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'}"
						>
							<!-- Checkbox indicator -->
							<div
								class="flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 {isSelected
									? 'border-primary bg-primary'
									: 'border-white/30'}"
							>
								{#if isSelected}
									<Check class="h-3 w-3 text-primary-foreground" />
								{/if}
							</div>

							<!-- Avatar -->
							<Avatar.Root
								class="h-10 w-10 flex-shrink-0"
								style="border: 2px solid {badgeColor};"
							>
								<Avatar.Image src={employee.image_url} alt={employee.username} />
								<Avatar.Fallback
									class="text-xs font-bold text-white"
									style="background-color: {badgeColor};"
								>
									{initials}
								</Avatar.Fallback>
							</Avatar.Root>

							<!-- Info -->
							<div class="min-w-0 flex-1 text-left">
								<p class="truncate text-sm font-semibold">{employee.username}</p>
								<p class="truncate text-xs text-muted-foreground">
									{employee.email.split('@')[0]}
								</p>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>
				Ακύρωση
			</Button>
			<Button onclick={handleAdd} disabled={isLoading || selectedCount === 0} class="gap-2">
				{#if isLoading}
					<Spinner />
					Προσθήκη...
				{:else}
					<UserPlus class="h-4 w-4" />
					Προσθήκη {selectedCount > 0 ? `(${selectedCount})` : ''}
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
