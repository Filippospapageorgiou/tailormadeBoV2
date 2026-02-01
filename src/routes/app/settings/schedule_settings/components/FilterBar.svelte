<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { RefreshCcw, X, Plus, Search } from 'lucide-svelte';
	import { SCHEDULE_STATUS } from '$lib/models/schedule.types';

	interface Props {
		statusFilter: string;
		yearFilter: string;
		searchQuery: string;
		isRefreshing: boolean;
		availableYears: number[];
		onStatusChange: (value: string) => void;
		onYearChange: (value: string) => void;
		onSearchChange: (value: string) => void;
		onRefresh: () => void;
		onClearFilters: () => void;
		onCreate: () => void;
	}

	let {
		statusFilter,
		yearFilter,
		searchQuery,
		isRefreshing=true,
		availableYears,
		onStatusChange,
		onYearChange,
		onSearchChange,
		onRefresh,
		onClearFilters,
		onCreate
	}: Props = $props();

	// Derive if filters are active
	let hasActiveFilters = $derived(statusFilter !== '' || yearFilter !== '' || searchQuery !== '');

	// Status options in Greek
	const statusOptions = [
		{ value: '', label: 'Όλες οι Καταστάσεις' },
		{ value: SCHEDULE_STATUS.DRAFT, label: 'Πρόχειρο' },
		{ value: SCHEDULE_STATUS.PUBLISHED, label: 'Δημοσιευμένο' },
		{ value: SCHEDULE_STATUS.ARCHIVED, label: 'Αρχειοθετημένο' }
	];

	// Year options
	let yearOptions = $derived([
		{ value: '', label: 'Όλα τα Έτη' },
		...availableYears.map((year) => ({ value: String(year), label: String(year) }))
	]);

	// Get current label for selects
	let statusLabel = $derived(
		statusOptions.find((opt) => opt.value === statusFilter)?.label ?? 'Όλες οι Καταστάσεις'
	);

	let yearLabel = $derived(
		yearOptions.find((opt) => opt.value === yearFilter)?.label ?? 'Όλα τα Έτη'
	);
</script>

<div
	class="animate-fade-in slide-in-from-top-4 space-y-4 rounded-xl border
	  border-border/50 dark:border-white/5 dark:bg-gradient-to-br dark:from-white/[0.02] dark:to-transparent p-4 dark:backdrop-blur-sm duration-500"
	style="animation-delay: 100ms;"
>
	<!-- Top Row: Create Button & Refresh -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Button onclick={onCreate} class="gap-2 transition-all duration-300 hover:scale-105">
				<Plus class="h-4 w-4" />
				Νέο Πρόγραμμα
			</Button>
		</div>

		<Button
			variant="outline"
			size="sm"
			onclick={onRefresh}
			disabled={isRefreshing}
			class="gap-2 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
		>
			<RefreshCcw
				class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise repeat-infinite' : ''}"
			/>
			Ανανέωση
		</Button>
	</div>

	<!-- Filters Row -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<!-- Status Filter -->
		<Select.Root
			type="single"
			name="statusFilter"
			value={statusFilter}
			onValueChange={onStatusChange}
		>
			<Select.Trigger class="w-full border-border/50 sm:w-[180px]">
				{statusLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Label>Κατάσταση</Select.Label>
					{#each statusOptions as option}
						<Select.Item value={option.value} label={option.label}>
							{option.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<!-- Year Filter -->
		<Select.Root type="single" name="yearFilter" value={yearFilter} onValueChange={onYearChange}>
			<Select.Trigger class="w-full border-border/50 sm:w-[140px]">
				{yearLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Label>Έτος</Select.Label>
					{#each yearOptions as option}
						<Select.Item value={option.value} label={option.label}>
							{option.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<!-- Search Input -->
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={searchQuery}
				oninput={(e) => onSearchChange(e.currentTarget.value)}
				placeholder="Αναζήτηση προγραμμάτων..."
				class="w-full border-border/50 pl-9 pr-8"
			/>
			{#if searchQuery}
				<Button
					variant="ghost"
					size="icon"
					onclick={() => onSearchChange('')}
					class="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 hover:bg-white/10"
				>
					<X class="h-3 w-3" />
				</Button>
			{/if}
		</div>

		<!-- Clear Filters Button -->
		{#if hasActiveFilters}
			<Button
				variant="outline"
				size="sm"
				onclick={onClearFilters}
				class="gap-2 whitespace-nowrap border-white/10 transition-all duration-300 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
			>
				<X class="h-3 w-3" />
				Καθαρισμός
			</Button>
		{/if}
	</div>

	<!-- Active Filters Display -->
	{#if hasActiveFilters}
		<div class="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
			<span class="text-xs text-muted-foreground">Ενεργά φίλτρα:</span>
			{#if statusFilter}
				<div
					class="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
				>
					<span>{statusLabel}</span>
					<button
						onclick={() => onStatusChange('')}
						class="ml-0.5 transition-colors hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</div>
			{/if}
			{#if yearFilter}
				<div
					class="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
				>
					<span>{yearLabel}</span>
					<button
						onclick={() => onYearChange('')}
						class="ml-0.5 transition-colors hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</div>
			{/if}
			{#if searchQuery}
				<div
					class="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
				>
					<span>"{searchQuery}"</span>
					<button
						onclick={() => onSearchChange('')}
						class="ml-0.5 transition-colors hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
