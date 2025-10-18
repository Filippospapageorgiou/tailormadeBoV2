<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Search, Check, Clock } from 'lucide-svelte';

	interface Props {
		employees: Profile[];
		selectedEmployeeId?: string | null;
		employeeHours?: Map<string, number>; // userId -> hours
		onSelectEmployee?: (employee: Profile) => void;
	}

	let { employees, selectedEmployeeId, employeeHours, onSelectEmployee }: Props = $props();

	let searchQuery = $state('');

	// Filter employees based on search
	let filteredEmployees = $derived.by(() => {
		if (!searchQuery.trim()) return employees;

		const query = searchQuery.toLowerCase();
		return employees.filter(
			(emp) =>
				emp.username.toLowerCase().includes(query) ||
				emp.email.toLowerCase().includes(query) ||
				emp.role_name?.toLowerCase().includes(query)
		);
	});

	function handleSelectEmployee(employee: Profile) {
		if (onSelectEmployee) {
			onSelectEmployee(employee);
		}
	}

	function getEmployeeHours(userId: string): number {
		return employeeHours?.get(userId) ?? 0;
	}

	// Get initials from username
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}
</script>

<div class="space-y-4">
	<!-- Search Input -->
	<div class="relative">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			bind:value={searchQuery}
			placeholder="Search employees..."
			class="pl-9"
			type="search"
		/>
	</div>

	<!-- Employee Count -->
	<p class="text-sm text-muted-foreground">
		Showing {filteredEmployees.length} of {employees.length} employees
	</p>

	<!-- Employee Grid -->
	<ScrollArea class="h-[280px]">
		<div class="grid grid-cols-2 gap-4 pr-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each filteredEmployees as employee (employee.id)}
				{@const isSelected = employee.id === selectedEmployeeId}
				{@const hours = getEmployeeHours(employee.id)}
				{@const initials = getInitials(employee.username)}
				{@const badgeColor = employee.badge_color || '#3b82f6'}

				<button
					type="button"
					onclick={() => handleSelectEmployee(employee)}
					class="group relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-card p-6 transition-all hover:shadow-lg {isSelected
						? 'border-2 shadow-lg'
						: 'border-border hover:border-primary/30'}"
					style={isSelected ? `border-color: ${badgeColor};` : ''}
				>
					<!-- Online Indicator -->
					<div class="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-green-500"></div>

					<!-- Avatar Circle -->
					<div
						class="relative flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md transition-transform group-hover:scale-105"
						style="background-color: {badgeColor};"
					>
						{initials}
						
						<!-- Selected Checkmark -->
						{#if isSelected}
							<div
								class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm"
								style="background-color: {badgeColor};"
							>
								<Check class="h-3.5 w-3.5 text-white" />
							</div>
						{/if}
					</div>

					<!-- Employee Info -->
					<div class="flex flex-col items-center gap-1 text-center">
						<!-- Name -->
						<p class="text-base font-semibold leading-tight">
							{employee.username}
						</p>

						<!-- Email/Full Name - could be full name if you have it -->
						<p class="text-xs text-muted-foreground line-clamp-1">
							{employee.email.split('@')[0]}
						</p>

						<!-- Role Badge -->
						<Badge
							class="mt-1 text-xs font-medium"
							style="background-color: {badgeColor}; color: white; border: none;"
						>
							{employee.role_name || 'Employee'}
						</Badge>

						<!-- Hours Display -->
						<div class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
							<Clock class="h-3.5 w-3.5" />
							<span class="font-medium">{hours}h / 40h</span>
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Empty State -->
		{#if filteredEmployees.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-sm text-muted-foreground">No employees found</p>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="mt-2 text-xs text-primary hover:underline"
					>
						Clear search
					</button>
				{/if}
			</div>
		{/if}
	</ScrollArea>
</div>