<script lang="ts">
	import { getMyEvaluations } from '$lib/api/trainers/trainer_evalution/data.remote.js';
	import { getMyVisits } from '$lib/api/trainers/equipment/data.remote';
	import DataTable from './data-table.svelte';
	import EquipmentVisitsDataTable from '../../app/managment/trainers/equipment-visits-data-table/data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RefreshCcw } from '@lucide/svelte';
	import { ClipboardList, Wrench } from '@lucide/svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	let evaluationsQuery = getMyEvaluations();
	let visitsQuery = getMyVisits();

	let isRefreshing = $state(false);
	$effect(() => {
		if (isRefreshing) {
			evaluationsQuery.refresh();
			visitsQuery.refresh();
			const t = setTimeout(() => (isRefreshing = false), 800);
			return () => clearTimeout(t);
		}
	});

	let evaluations = $derived((evaluationsQuery.current?.evaluations as any[] | undefined) ?? []);

	let visits = $derived(visitsQuery.current?.visits ?? []);
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-8">
		<!-- Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Αξιολογήσεις</h1>
				<p class="text-xs text-muted-foreground md:text-sm">
					Όλες οι αξιολογήσεις και επισκέψεις εξοπλισμού που έχετε πραγματοποιήσει
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					class="h-9 cursor-pointer"
					onclick={() => (isRefreshing = true)}
				>
					<RefreshCcw
						class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise repeat-infinite' : ''}"
					/>
				</Button>
			</div>
		</div>

		<!-- Tabs -->
		<Tabs.Root value="evaluations" class="w-full overflow-visible">
			<Tabs.List class="flex h-auto w-auto items-end justify-end bg-transparent">
				<Tabs.Trigger
					value="evaluations"
					class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
				>
					<ClipboardList class="h-4 w-4" />
					Αξιολογήσεις
				</Tabs.Trigger>
				<Tabs.Trigger
					value="visits"
					class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
				>
					<Wrench class="h-4 w-4" />
					Επισκέψεις Εξοπλισμού
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="evaluations" class="mt-2 animate-fade-in-left overflow-visible">
				{#if evaluationsQuery.current === undefined}
					<!-- Loading skeleton -->
					<div class="space-y-3 py-6">
						<div class="flex items-center justify-between">
							<div class="h-6 w-48 animate-pulse rounded-lg bg-muted"></div>
							<div class="flex gap-2">
								<div class="h-9 w-52 animate-pulse rounded-lg bg-muted"></div>
								<div class="h-9 w-28 animate-pulse rounded-lg bg-muted"></div>
								<div class="h-9 w-20 animate-pulse rounded-lg bg-muted"></div>
							</div>
						</div>
						<div class="overflow-hidden rounded-xl border border-border">
							{#each Array(6) as _, i}
								<div
									class="flex items-center gap-4 border-b border-border/50 px-4 py-3 last:border-0"
									style="animation-delay: {i * 50}ms"
								>
									<div class="h-8 flex-1 animate-pulse rounded-md bg-muted"></div>
									<div class="h-8 w-28 animate-pulse rounded-md bg-muted"></div>
									<div class="h-6 w-20 animate-pulse rounded-full bg-muted"></div>
									<div class="h-4 w-24 animate-pulse rounded-md bg-muted"></div>
									<div class="h-4 w-20 animate-pulse rounded-md bg-muted"></div>
									<div class="h-8 w-8 animate-pulse rounded-md bg-muted"></div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<DataTable data={evaluations} />
				{/if}
			</Tabs.Content>

			<Tabs.Content value="visits" class="mt-2 animate-fade-in-left overflow-visible">
				{#if visitsQuery.current === undefined}
					<!-- Loading skeleton -->
					<div class="space-y-3 py-6">
						<div class="flex items-center justify-between">
							<div class="h-6 w-48 animate-pulse rounded-lg bg-muted"></div>
							<div class="flex gap-2">
								<div class="h-9 w-52 animate-pulse rounded-lg bg-muted"></div>
								<div class="h-9 w-28 animate-pulse rounded-lg bg-muted"></div>
								<div class="h-9 w-20 animate-pulse rounded-lg bg-muted"></div>
							</div>
						</div>
						<div class="overflow-hidden rounded-xl border border-border">
							{#each Array(6) as _, i}
								<div
									class="flex items-center gap-4 border-b border-border/50 px-4 py-3 last:border-0"
									style="animation-delay: {i * 50}ms"
								>
									<div class="h-8 flex-1 animate-pulse rounded-md bg-muted"></div>
									<div class="h-8 w-28 animate-pulse rounded-md bg-muted"></div>
									<div class="h-6 w-20 animate-pulse rounded-full bg-muted"></div>
									<div class="h-4 w-24 animate-pulse rounded-md bg-muted"></div>
									<div class="h-8 w-8 animate-pulse rounded-md bg-muted"></div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<EquipmentVisitsDataTable data={visits} basePath="/trainer/evaluations/visit" />
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</main>
</div>
