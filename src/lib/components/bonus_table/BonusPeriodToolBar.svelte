<script lang="ts">
	import type { Table } from '@tanstack/table-core';
	import type { BonusPeriod } from '$lib/models/bonus_organization.types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { cn } from '$lib/utils';
	import { Search, X, CirclePlus, Check, Filter } from 'lucide-svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Checkbox from '../ui/checkbox/checkbox.svelte';

	type Props = {
		table: Table<BonusPeriod>;
		data: BonusPeriod[];
	};

	let { table, data }: Props = $props();

	// Extract unique values for filters from data
	let uniqueYears = $derived([...new Set(data.map((d) => d.year))].sort((a, b) => b - a));
	let uniqueQuarters = $derived([...new Set(data.map((d) => d.quarter))].sort());

	// Filter options
	const statusOptions = [
		{ value: 'published', label: 'Δημοσιευμένο', icon: '🟢' },
		{ value: 'draft', label: 'Πρόχειρο', icon: '🟡' }
	];

	let yearOptions = $derived(
		uniqueYears.map((year) => ({
			value: String(year),
			label: String(year)
		}))
	);

	const quarterOptions = [
		{ value: '1', label: 'Q1 (Ιαν-Μαρ)' },
		{ value: '2', label: 'Q2 (Απρ-Ιουν)' },
		{ value: '3', label: 'Q3 (Ιουλ-Σεπ)' },
		{ value: '4', label: 'Q4 (Οκτ-Δεκ)' }
	];

	// Check if any filters are active
	let isFiltered = $derived(table.getState().columnFilters.length > 0);
</script>

<!-- Toolbar -->
<div class="flex flex-col gap-4 py-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<!-- Left side: Filters -->
		<div class="flex flex-1 flex-wrap items-center gap-2">
			<!-- Status Filter -->
			{#if table.getColumn('status')}
				{@const column = table.getColumn('status')}
				{@const selectedValues = new SvelteSet<string>(
					(column?.getFilterValue() as string[]) ?? []
				)}
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="h-8 border-dashed">
								<CirclePlus class="mr-2 h-4 w-4" />
								Κατάσταση
								{#if selectedValues.size > 0}
									<Separator orientation="vertical" class="mx-2 h-4" />
									<Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
										{selectedValues.size}
									</Badge>
									<div class="hidden space-x-1 lg:flex">
										{#if selectedValues.size > 2}
											<Badge variant="secondary" class="rounded-sm px-1 font-normal">
												{selectedValues.size} επιλεγμένα
											</Badge>
										{:else}
											{#each statusOptions.filter((opt) => selectedValues.has(opt.value)) as option (option.value)}
												<Badge variant="secondary" class="rounded-sm px-1 font-normal">
													{option.label}
												</Badge>
											{/each}
										{/if}
									</div>
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[200px] p-0 border border-border/50 rounded-md" align="start">
						<Command.Root>
							<Command.Input placeholder="Αναζήτηση..." />
							<Command.List>
								<Command.Empty>Δεν βρέθηκαν αποτελέσματα.</Command.Empty>
								<Command.Group>
									{#each statusOptions as option (option.value)}
										{@const isSelected = selectedValues.has(option.value)}
										<Command.Item
											onSelect={() => {
												if (isSelected) {
													selectedValues.delete(option.value);
												} else {
													selectedValues.add(option.value);
												}
												const filterValues = Array.from(selectedValues);
												column?.setFilterValue(filterValues.length ? filterValues : undefined);
											}}
										>
											<Checkbox checked={isSelected} />
											<span class="mr-2">{option.icon}</span>
											<span>{option.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
								{#if selectedValues.size > 0}
									<Command.Separator />
									<Command.Group>
										<Command.Item
											onSelect={() => column?.setFilterValue(undefined)}
											class="justify-center text-center"
										>
											Καθαρισμός φίλτρων
										</Command.Item>
									</Command.Group>
								{/if}
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			{/if}

			<!-- Year Filter -->
			{#if table.getColumn('period') && yearOptions.length > 0}
				{@const column = table.getColumn('year')}
				{@const selectedValues = new SvelteSet<string>((column?.getFilterValue() as string[]) ?? [])}
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="h-8 border-dashed">
								<CirclePlus class="mr-2 h-4 w-4" />
								Έτος
								{#if selectedValues.size > 0}
									<Separator orientation="vertical" class="mx-2 h-4" />
									<Badge variant="secondary" class="rounded-sm px-1 font-normal">
										{selectedValues.size} επιλεγμένα
									</Badge>
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[200px] p-0 border border-border/50 rounded-md" align="start">
						<Command.Root>
							<Command.Input placeholder="Αναζήτηση έτους..." />
							<Command.List>
								<Command.Empty>Δεν βρέθηκαν αποτελέσματα.</Command.Empty>
								<Command.Group>
									{#each yearOptions as option (option.value)}
										{@const isSelected = selectedValues.has(option.value)}
										<Command.Item
											onSelect={() => {
												if (isSelected) {

													selectedValues.delete(option.value);
												} else {
													selectedValues.add(option.value);
												}
												const filterValues = Array.from(selectedValues);
												column?.setFilterValue(filterValues.length ? filterValues : undefined);
											}}
										>
											<Checkbox checked={isSelected} />
											<span>{option.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
								{#if selectedValues.size > 0}
									<Command.Separator />
									<Command.Group>
										<Command.Item
											onSelect={() => column?.setFilterValue(undefined)}
											class="justify-center text-center"
										>
											Καθαρισμός φίλτρων
										</Command.Item>
									</Command.Group>
								{/if}
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			{/if}

			<!-- Quarter Filter -->
			{#if table.getColumn('quarter')}
				{@const column = table.getColumn('quarter')}
				{@const selectedValues = new SvelteSet<string>((column?.getFilterValue() as string[]) ?? [])}
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="h-8 border-dashed">
								<CirclePlus class="mr-2 h-4 w-4" />
								Τρίμηνο
								{#if selectedValues.size > 0}
									<Separator orientation="vertical" class="mx-2 h-4" />
									<Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
										{selectedValues.size}
									</Badge>
									<div class="hidden space-x-1 lg:flex">
										{#if selectedValues.size > 2}
											<Badge variant="secondary" class="rounded-sm px-1 font-normal">
												{selectedValues.size} επιλεγμένα
											</Badge>
										{:else}
											{#each quarterOptions.filter((opt) => selectedValues.has(opt.value)) as option (option.value)}
												<Badge variant="secondary" class="rounded-sm px-1 font-normal">
													Q{option.value}
												</Badge>
											{/each}
										{/if}
									</div>
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[220px] p-0  border border-border/50 rounded-md" align="start">
						<Command.Root>
							<Command.Input placeholder="Αναζήτηση τριμήνου..." />
							<Command.List>
								<Command.Empty>Δεν βρέθηκαν αποτελέσματα.</Command.Empty>
								<Command.Group>
									{#each quarterOptions as option (option.value)}
										{@const isSelected = selectedValues.has(option.value)}
										<Command.Item
											onSelect={() => {
												if (isSelected) {
													selectedValues.delete(option.value);
												} else {
													selectedValues.add(option.value);
												}
												const filterValues = Array.from(selectedValues);
												column?.setFilterValue(filterValues.length ? filterValues : undefined);
											}}
										>
											<Checkbox checked={isSelected} />
											<span>{option.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
								{#if selectedValues.size > 0}
									<Command.Separator />
									<Command.Group>
										<Command.Item
											onSelect={() => column?.setFilterValue(undefined)}
											class="justify-center text-center"
										>
											Καθαρισμός φίλτρων
										</Command.Item>
									</Command.Group>
								{/if}
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			{/if}

			<!-- Clear All Filters Button -->
			{#if isFiltered}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 px-2 lg:px-3"
					onclick={() => table.resetColumnFilters()}
				>
					Καθαρισμός
					<X class="ml-2 h-4 w-4" />
				</Button>
			{/if}
		</div>

		<!-- Right side: Stats -->
		<div class="flex items-center gap-2">
			<Badge variant="outline" class="text-xs">
				<Filter class="mr-1 h-3 w-3" />
				{table.getFilteredRowModel().rows.length} / {data.length} εγγραφές
			</Badge>
		</div>
	</div>
</div>