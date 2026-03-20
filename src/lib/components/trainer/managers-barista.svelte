<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Check, ChevronsUpDown, X, Users, Coffee } from 'lucide-svelte';
	import type { Profile } from '$lib/models/database.types';

	let {
		baristas = $bindable(),
		managers = $bindable(),
		employees
	}: {
		baristas: string[];
		managers: string[];
		employees: Profile[];
	} = $props();

	let selectManagers = $derived(employees.filter((n) => n.is_manager || n.role_id === 2) ?? []);
	let selectBaristas = $derived(employees.filter((n) => n.role_id === 4 || n.role_id === 5) ?? []);

	let managersOpen = $state(false);
	let baristaOpen = $state(false);

	function getEmployee(id: string): Profile | undefined {
		return employees.find((e) => e.id === id);
	}

	function getInitials(name: string): string {
		return (
			name
				?.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2) ?? '?'
		);
	}

	function toggleManager(id: string) {
		if (managers.includes(id)) {
			managers = managers.filter((m) => m !== id);
		} else {
			managers = [...managers, id];
		}
	}

	function toggleBarista(id: string) {
		if (baristas.includes(id)) {
			baristas = baristas.filter((b) => b !== id);
		} else {
			baristas = [...baristas, id];
		}
	}

	function removeManager(id: string) {
		managers = managers.filter((m) => m !== id);
	}

	function removeBarista(id: string) {
		baristas = baristas.filter((b) => b !== id);
	}
</script>

<div class="grid grid-cols-1 gap-6 py-2 sm:grid-cols-2">
	<!-- Managers -->
	<div class="flex flex-col gap-3">
		<div class="flex items-center gap-2">
			<Users class="h-4 w-4 text-muted-foreground" />
			<span class="text-sm font-medium">Υπεύθυνος κατά την αξιολόγηση</span>
		</div>

		<Popover.Root bind:open={managersOpen}>
			<Popover.Trigger>
				<Button
					variant="outline"
					role="combobox"
					class="w-full justify-between font-normal text-muted-foreground"
				>
					Επιλογή υπεύθυνου...
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-full p-0" align="start">
				<Command.Root>
					<Command.Input placeholder="Αναζήτηση..." />
					<Command.Empty>Δεν βρέθηκαν αποτελέσματα.</Command.Empty>
					<Command.Group>
						{#each selectManagers as emp}
							<Command.Item
								value={emp.id}
								onSelect={() => toggleManager(emp.id)}
								class="flex cursor-pointer items-center gap-2"
							>
								<div
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
								>
									{#if emp.image_url}
										<img
											src={emp.image_url}
											alt={emp.full_name}
											class="h-6 w-6 rounded-full object-cover dark:bg-white"
										/>
									{:else}
										{getInitials(emp.full_name)}
									{/if}
								</div>
								<span class="flex-1 text-sm">{emp.full_name}</span>
								{#if managers.includes(emp.id)}
									<Check class="h-4 w-4 text-primary" />
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		{#if managers.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each managers as id}
					{@const emp = getEmployee(id)}
					{#if emp}
						<Badge variant="secondary" class="flex items-center gap-1.5 py-1 pr-1 pl-1">
							<div
								class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-bold text-white"
							>
								{#if emp.image_url}
									<img
										src={emp.image_url}
										alt={emp.full_name}
										class="h-5 w-5 object-cover dark:bg-white"
									/>
								{:else}
									{getInitials(emp.full_name)}
								{/if}
							</div>
							<span class="text-xs">{emp.full_name}</span>
							<button
								onclick={() => removeManager(id)}
								class="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-muted"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Baristas -->
	<div class="flex flex-col gap-3">
		<div class="flex items-center gap-2">
			<Coffee class="h-4 w-4 text-muted-foreground" />
			<span class="text-sm font-medium">Barista κατά την αξιολόγηση</span>
		</div>

		<Popover.Root bind:open={baristaOpen}>
			<Popover.Trigger>
				<Button
					variant="outline"
					role="combobox"
					class="w-full justify-between font-normal text-muted-foreground"
				>
					Επιλογή barista...
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-full p-0" align="start">
				<Command.Root>
					<Command.Input placeholder="Αναζήτηση..." />
					<Command.Empty>Δεν βρέθηκαν αποτελέσματα.</Command.Empty>
					<Command.Group>
						{#each selectBaristas as emp}
							<Command.Item
								value={emp.id}
								onSelect={() => toggleBarista(emp.id)}
								class="flex cursor-pointer items-center gap-2"
							>
								<div
									class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white"
								>
									{#if emp.image_url}
										<img
											src={emp.image_url}
											alt={emp.full_name}
											class="h-6 w-6 rounded-full object-cover dark:bg-white"
										/>
									{:else}
										{getInitials(emp.full_name)}
									{/if}
								</div>
								<span class="flex-1 text-sm">{emp.full_name}</span>
								{#if baristas.includes(emp.id)}
									<Check class="h-4 w-4 text-primary" />
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		{#if baristas.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each baristas as id}
					{@const emp = getEmployee(id)}
					{#if emp}
						<Badge variant="secondary" class="flex items-center gap-1.5 py-1 pr-1 pl-1">
							<div
								class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-bold text-white"
							>
								{#if emp.image_url}
									<img
										src={emp.image_url}
										alt={emp.full_name}
										class="h-5 w-5 object-cover dark:bg-white"
									/>
								{:else}
									{getInitials(emp.full_name)}
								{/if}
							</div>
							<span class="text-xs">{emp.full_name}</span>
							<button
								onclick={() => removeBarista(id)}
								class="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-muted"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
