<script lang="ts">
	import { getMyEvaluations } from '$lib/api/trainers/trainer_evalution/data.remote.js';
	import DataTable from './data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RefreshCcw, Plus } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let evaluationsQuery = getMyEvaluations();

	let isRefreshing = $state(false);
	$effect(() => {
		if (isRefreshing) {
			evaluationsQuery.refresh();
			// reset after short delay so icon animation plays once
			const t = setTimeout(() => (isRefreshing = false), 800);
			return () => clearTimeout(t);
		}
	});

	let evaluations = $derived(
		(evaluationsQuery.current?.evaluations as any[] | undefined) ?? []
	);
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pb-8 pt-4">
		<!-- Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Αξιολογήσεις</h1>
				<p class="text-xs text-muted-foreground md:text-sm">
					Όλες οι αξιολογήσεις καταστημάτων που έχετε πραγματοποιήσει
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

		<!-- Table -->
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
	</main>
</div>