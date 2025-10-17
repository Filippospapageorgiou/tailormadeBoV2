<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Search, Check } from 'lucide-svelte';

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
</script>

<Card.Card>
	<Card.CardHeader>
		<Card.CardTitle class="text-lg">Select Employee</Card.CardTitle>
		<Card.CardDescription>
			Choose an employee to view and manage their weekly schedule
		</Card.CardDescription>

		<!-- Search Input -->
		<div class="relative mt-3">
			<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				bind:value={searchQuery}
				placeholder="Search employees..."
				class="pl-8"
				type="search"
			/>
		</div>

		<!-- Employee Count -->
		<p class="mt-2 text-xs text-muted-foreground">
			Showing {filteredEmployees.length} of {employees.length} employees
		</p>
	</Card.CardHeader>

	<Card.CardContent>
		<ScrollArea class="h-[400px] pr-4">
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredEmployees as employee (employee.id)}
					{@const isSelected = employee.id === selectedEmployeeId}
					{@const hours = getEmployeeHours(employee.id)}

					<button
						type="button"
						onclick={() => handleSelectEmployee(employee)}
						class="relative rounded-lg border bg-card p-3 text-left transition-all hover:bg-accent hover:shadow-md {isSelected
							? 'border-primary ring-2 ring-primary ring-offset-2'
							: 'border-border'}"
					>
						<!-- Selected Check Mark -->
						{#if isSelected}
							<div
								class="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
							>
								<Check class="h-3 w-3" />
							</div>
						{/if}

						<!-- Employee Info -->
						<div class="flex items-start gap-3">
							<Avatar.Root class="h-10 w-10 flex-shrink-0">
								<Avatar.Image src={employee.image_url} alt={employee.username} />
								<Avatar.Fallback class="text-sm">
									{employee.username.substring(0, 2).toUpperCase()}
								</Avatar.Fallback>
							</Avatar.Root>

							<div class="flex-1 space-y-1 overflow-hidden">
								<p class="truncate text-sm font-semibold">
									{employee.username}
								</p>

								<!-- Badge with dynamic color from DB -->
								{#if employee.badge_color}
									<Badge
										class="text-xs"
										style="background-color: {employee.badge_color}; color: white;"
									>
										{employee.role_name || 'Employee'}
									</Badge>
								{:else}
									<Badge variant="secondary" class="text-xs">
										{employee.role_name || 'Employee'}
									</Badge>
								{/if}

								<!-- Hours Display -->
								<p class="text-xs text-muted-foreground">
									{hours}h / 40h week
								</p>
							</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Empty State -->
			{#if filteredEmployees.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
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
	</Card.CardContent>
</Card.Card>
