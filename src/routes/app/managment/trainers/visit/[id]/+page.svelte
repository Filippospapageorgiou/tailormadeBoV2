<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getEquipmentVisitById } from '$lib/api/trainers/trainer_managment/data.remote';
	import { VISIT_ACTION_LABELS } from '$lib/models/equipment.types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import {
		ArrowLeft,
		Wrench,
		MapPin,
		Phone,
		Mail,
		Calendar,
		Clock,
		Coins,
		ClipboardList,
		ImageIcon
	} from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const visitId = $derived(Number(page.params.id));
	// svelte-ignore state_referenced_locally
	let visitQuery = getEquipmentVisitById({ visitId });
	let result = $derived(visitQuery.current);
	let isLoading = $derived(visitQuery.current === undefined);

	let visit = $derived(result?.visit);
	let org = $derived((visit as any)?.core_organizations);
	let trainer = $derived((visit as any)?.profiles);
	let actions = $derived((visit as any)?.trainer_visit_actions ?? []);

	// Group actions by equipment
	let groupedActions = $derived.by(() => {
		const groups = new Map<
			number,
			{
				equipment: any;
				actions: any[];
				totalCost: number;
			}
		>();

		for (const action of actions) {
			const eqId = action.equipment?.id ?? action.equipment_id;
			if (!groups.has(eqId)) {
				groups.set(eqId, {
					equipment: action.equipment,
					actions: [],
					totalCost: 0
				});
			}
			const group = groups.get(eqId)!;
			group.actions.push(action);
			group.totalCost += action.cost || 0;
		}

		return Array.from(groups.values());
	});

	let totalCost = $derived(actions.reduce((sum: number, a: any) => sum + (a.cost || 0), 0));

	function getInitials(name: string | null, username: string): string {
		const source = name || username;
		return source
			.split(' ')
			.map((n: string) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	const statusConfig: Record<string, { label: string; classes: string }> = {
		completed: {
			label: 'Ολοκληρωμένη',
			classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
		},
		in_progress: {
			label: 'Σε εξέλιξη',
			classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
		}
	};

	const equipmentStatusConfig: Record<string, { label: string; classes: string }> = {
		operational: {
			label: 'Λειτουργεί',
			classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
		},
		maintenance: {
			label: 'Service',
			classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
		},
		broken: {
			label: 'Βλάβη',
			classes: 'bg-destructive/10 text-destructive'
		}
	};
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pb-8 pt-4">
		<!-- Header -->
		<div class="mb-6 flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				class="h-9 w-9 shrink-0"
				onclick={() => goto('/app/managment/trainers')}
			>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Επίσκεψη Εξοπλισμού</h1>
				<p class="text-xs text-muted-foreground">
					#{visitId} · Λεπτομέρειες επίσκεψης
				</p>
			</div>
		</div>

		<!-- Loading skeleton -->
		{#if isLoading}
			<div class="space-y-4">
				<div class="rounded-xl border border-border bg-card p-5">
					<div class="flex justify-between">
						<div class="space-y-2">
							<div class="h-4 w-24 animate-pulse rounded-full bg-muted"></div>
							<div class="h-8 w-56 animate-pulse rounded-lg bg-muted"></div>
							<div class="h-4 w-32 animate-pulse rounded-md bg-muted"></div>
						</div>
						<div class="h-20 w-20 animate-pulse rounded-full bg-muted"></div>
					</div>
					<div class="mt-4 flex gap-6 border-t border-border/40 pt-4">
						<div class="h-4 w-40 animate-pulse rounded-md bg-muted"></div>
						<div class="h-4 w-40 animate-pulse rounded-md bg-muted"></div>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{#each [1, 2] as _}
						<div class="space-y-4">
							{#each [140, 240, 180] as h}
								<div
									class="animate-pulse rounded-xl border border-border bg-card"
									style="height: {h}px"
								></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<!-- Error state -->
		{:else if !visit}
			<div class="flex flex-col items-center justify-center py-24 text-center">
				<div class="mb-4 rounded-full bg-muted p-4">
					<Wrench class="h-8 w-8 text-muted-foreground" />
				</div>
				<p class="font-mono text-lg tracking-wide">Δεν βρέθηκε επίσκεψη</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Η επίσκεψη #{visitId} δεν υπάρχει.
				</p>
				<Button class="mt-6" onclick={() => goto('/app/managment/trainers')}>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Πίσω στους trainers
				</Button>
			</div>

			<!-- Detail view -->
		{:else}
			<!-- Visit Summary Card -->
			<Card.Root
				class="relative mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
			>
				<div
					class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
				></div>
				<Card.Content class="p-6">
					<div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
						<!-- Left: Store + Status -->
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								<span
									class={cn(
										'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
										statusConfig[visit.status]?.classes ?? 'bg-muted text-muted-foreground'
									)}
								>
									{statusConfig[visit.status]?.label ?? visit.status}
								</span>
								<span class="text-xs text-muted-foreground">ID: #{visit.id}</span>
							</div>

							<div>
								<h2 class="font-tailormade text-2xl font-semibold">
									{org?.store_name ?? 'Άγνωστο κατάστημα'}
								</h2>
								{#if org?.location}
									<p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
										<MapPin class="h-3.5 w-3.5" />
										{org.location}
									</p>
								{/if}
								{#if org?.phone}
									<p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
										<Phone class="h-3.5 w-3.5" />
										{org.phone}
									</p>
								{/if}
							</div>
						</div>

						<!-- Right: Trainer info -->
						{#if trainer}
							<div class="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
								<Avatar.Root class="h-10 w-10">
									<Avatar.Image
										src={trainer.image_url}
										alt={trainer.username}
										class="dark:bg-white"
									/>
									<Avatar.Fallback class="text-xs font-semibold">
										{getInitials(trainer.full_name, trainer.username)}
									</Avatar.Fallback>
								</Avatar.Root>
								<div>
									<p class="text-sm font-medium">
										{trainer.full_name ?? trainer.username}
									</p>
									{#if trainer.email}
										<p
											class="flex items-center gap-1 text-[11px] text-muted-foreground"
										>
											<Mail class="h-3 w-3" />
											{trainer.email}
										</p>
									{/if}
									{#if trainer.phone}
										<p
											class="flex items-center gap-1 text-[11px] text-muted-foreground"
										>
											<Phone class="h-3 w-3" />
											{trainer.phone}
										</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Stats row -->
					<div
						class="mt-6 flex flex-wrap items-center gap-6 border-t border-border/40 pt-4 text-sm"
					>
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<Calendar class="h-3.5 w-3.5" />
							<span>
								{new Date(visit.visit_date).toLocaleDateString('el-GR', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</span>
						</div>
						{#if visit.completed_at}
							<div class="flex items-center gap-1.5 text-muted-foreground">
								<Clock class="h-3.5 w-3.5" />
								<span>
									Ολοκληρώθηκε: {new Date(visit.completed_at).toLocaleString('el-GR', {
										dateStyle: 'medium',
										timeStyle: 'short'
									})}
								</span>
							</div>
						{/if}
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<ClipboardList class="h-3.5 w-3.5" />
							<span>{actions.length} ενέργειες</span>
						</div>
						{#if totalCost > 0}
							<div class="flex items-center gap-1.5 font-medium text-foreground">
								<Coins class="h-3.5 w-3.5" />
								<span>{totalCost.toFixed(2)}€</span>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Actions grouped by equipment -->
			<div class="space-y-4">
				<h3 class="font-tailormade text-lg font-semibold">
					Ενέργειες ανά Εξοπλισμό
				</h3>

				{#if groupedActions.length === 0}
					<Card.Root class="rounded-xl border border-border bg-card p-8 text-center">
						<ClipboardList class="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-40" />
						<p class="text-sm text-muted-foreground">
							Δεν καταγράφηκαν εν��ργειες σε αυτή την επίσκεψη.
						</p>
					</Card.Root>
				{:else}
					{#each groupedActions as group, groupIndex}
						<Card.Root
							class="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
							style="animation-delay: {groupIndex * 100}ms"
						>
							<div
								class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
							></div>
							<Card.Content class="p-0">
								<!-- Equipment header -->
								<div
									class="flex items-center justify-between border-b border-border/40 px-5 py-4"
								>
									<div class="flex items-center gap-3">
										{#if group.equipment?.image_url}
											<img
												src={group.equipment.image_url}
												alt={group.equipment.name}
												class="h-10 w-10 rounded-lg border border-border object-cover"
											/>
										{:else}
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
											>
												<Wrench class="h-5 w-5 text-muted-foreground" />
											</div>
										{/if}
										<div>
											<p class="text-sm font-semibold">
												{group.equipment?.name ?? 'Άγνωστο'}
											</p>
											{#if group.equipment?.model}
												<p class="text-[11px] text-muted-foreground">
													{group.equipment.model}
												</p>
											{/if}
										</div>
									</div>
									<div class="flex items-center gap-2">
										{#if group.equipment?.status}
											{@const eqStatus =
												equipmentStatusConfig[group.equipment.status]}
											<span
												class={cn(
													'rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
													eqStatus?.classes ?? 'bg-muted text-muted-foreground'
												)}
											>
												{eqStatus?.label ?? group.equipment.status}
											</span>
										{/if}
										{#if group.totalCost > 0}
											<span
												class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary"
											>
												{group.totalCost.toFixed(2)}€
											</span>
										{/if}
									</div>
								</div>

								<!-- Actions list -->
								<div class="divide-y divide-border/30">
									{#each group.actions as action, actionIndex}
										<div
											class="px-5 py-3 transition-colors hover:bg-muted/20"
											style="animation-delay: {(groupIndex * 3 + actionIndex) * 60}ms"
										>
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0 flex-1">
													<div class="mb-1 flex items-center gap-2">
														<span
															class="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground"
														>
															{VISIT_ACTION_LABELS[
																action.action_type as keyof typeof VISIT_ACTION_LABELS
															] ?? action.action_type}
														</span>
														{#if action.cost > 0}
															<span
																class="text-[11px] font-medium tabular-nums text-muted-foreground"
															>
																{action.cost.toFixed(2)}€
															</span>
														{/if}
													</div>
													<p class="text-sm leading-relaxed text-foreground/80">
														{action.description}
													</p>
													<p class="mt-1 text-[10px] text-muted-foreground/60">
														{new Date(action.created_at).toLocaleString('el-GR', {
															dateStyle: 'medium',
															timeStyle: 'short'
														})}
													</p>
												</div>
											</div>

											<!-- Images -->
											{#if action.images && action.images.length > 0}
												<div class="mt-2 flex flex-wrap gap-2">
													{#each action.images as img}
														<a
															href={img}
															target="_blank"
															rel="noopener noreferrer"
															class="group/img relative overflow-hidden rounded-lg border border-border"
														>
															<img
																src={img}
																alt="Φωτογραφία ενέργειας"
																class="h-20 w-20 object-cover transition-transform group-hover/img:scale-105"
															/>
															<div
																class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/20"
															>
																<ImageIcon
																	class="h-4 w-4 text-white opacity-0 transition-opacity group-hover/img:opacity-100"
																/>
															</div>
														</a>
													{/each}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				{/if}
			</div>

			<!-- Visit Notes -->
			{#if visit.notes}
				<Card.Root class="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<Card.Content class="p-5">
						<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Σημειώσεις Επίσκεψης
						</h3>
						<p class="text-sm leading-relaxed text-foreground/80">{visit.notes}</p>
					</Card.Content>
				</Card.Root>
			{/if}
		{/if}
	</main>
</div>
