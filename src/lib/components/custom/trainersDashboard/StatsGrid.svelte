<script lang="ts">
	import StatCard from './StatCard.svelte';
	import { Users, UserCheck, GitBranch, Trash2, Phone, Mail } from 'lucide-svelte';
	import { deleteUser } from '../../../../routes/app/settings/manage_users/data.remote';
	import * as Modal from '$lib/components/ui/modal/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	let { stats, loading = false, trainers } = $props();

	const iconMap = {
		users: Users,
		userCheck: UserCheck,
		gitBranch: GitBranch
	} as const;

	let statCards = $derived([
		{
			title: 'Ενεργή ανάθεσηs',
			value: stats.current?.activeAssignments ?? '—',
			description: 'Επί του παρόντος ανατεθειμένο',
			iconName: 'userCheck' as const,
			trend: undefined
		},
		{
			title: 'Συνολικές αξιολογήσεις',
			value: stats.current?.totalEvaluations ?? '—',
			description: 'Ολοκληρωμένες αξιολογήσεις',
			iconName: 'gitBranch' as const,
			trend: undefined
		}
	]);

	let trainerList = $derived((trainers as any[]) ?? []);

	let confirmOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);
	let pendingDeleteName = $state('');
	let deleting = $state(false);

	function openConfirm(id: string, name: string) {
		pendingDeleteId = id;
		pendingDeleteName = name;
		confirmOpen = true;
	}

	async function confirmDelete() {
		if (!pendingDeleteId) return;
		deleting = true;
		try {
			const result = await deleteUser({ userId: pendingDeleteId });
			if (result.success) {
				toast.success('Ο χρήστης διαγράφηκε επιτυχώς');
			} else {
				toast.error(result.message || 'Σφάλμα κατά τη διαγραφή');
			}
		} catch {
			toast.error('Σφάλμα κατά τη διαγραφή');
		} finally {
			deleting = false;
			confirmOpen = false;
			pendingDeleteId = null;
			pendingDeleteName = '';
		}
	}

	function getInitials(name: string | null, username: string): string {
		if (name) {
			return name
				.split(' ')
				.slice(0, 2)
				.map((n) => n[0])
				.join('')
				.toUpperCase();
		}
		return username.slice(0, 2).toUpperCase();
	}
</script>

<div class="flex flex-row gap-3 px-4 py-4">
	<!-- Stat cards — equal half -->
	<div class="grid flex-1 grid-cols-2 gap-3">
		{#each statCards as stat}
			<StatCard
				title={stat.title}
				value={stat.value}
				description={stat.description}
				icon={iconMap[stat.iconName] as any}
				trend={stat.trend}
				{loading}
			/>
		{/each}
	</div>

	<!-- Trainers list — equal half -->
	<Card.Root
		class="group relative flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
	>
		<div
			class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
		></div>
		<Card.Content class="p-0">
			<div class="flex items-center justify-between px-4 pt-4 pb-3">
				<p class="font-tailormade text-[13px] font-medium tracking-wide text-muted-foreground">
					Trainers
				</p>
				<span
					class="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
				>
					{trainerList.length}
				</span>
			</div>

			{#if trainerList.length === 0}
				<div class="flex flex-col items-center justify-center py-6 text-muted-foreground/40">
					<Users size={18} strokeWidth={1.5} class="mb-1" />
					<p class="text-[12px]">Δεν υπάρχουν trainers</p>
				</div>
			{:else}
				<div class="max-h-[180px] overflow-y-auto">
					<table class="w-full">
						<tbody>
							{#each trainerList as trainer (trainer.id)}
								<tr
									class="group/row border-t border-border/40 transition-colors hover:bg-accent/30"
								>
									<!-- Avatar + info -->
									<td class="px-4 py-2">
										<div class="flex items-center gap-2.5">
											<Avatar.Root class="h-7 w-7 shrink-0">
												<Avatar.Image
													src={trainer.image_url}
													class="grayscale dark:bg-white"
												/>
												<Avatar.Fallback class="text-[10px]">
													{getInitials(trainer.full_name, trainer.username)}
												</Avatar.Fallback>
											</Avatar.Root>
											<div class="min-w-0">
												<p class="truncate text-[12px] font-medium text-foreground leading-tight">
													{trainer.full_name ?? trainer.username}
												</p>
												{#if trainer.email}
													<p class="flex items-center gap-1 truncate text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
														<Mail size={9} strokeWidth={1.75} class="shrink-0" />
														{trainer.email}
													</p>
												{/if}
												{#if trainer.phone}
													<p class="flex items-center gap-1 truncate text-[11px] text-muted-foreground/60 leading-tight">
														<Phone size={9} strokeWidth={1.75} class="shrink-0" />
														{trainer.phone}
													</p>
												{/if}
											</div>
										</div>
									</td>

									<!-- Eval badge + delete -->
									<td class="pr-3 text-right align-middle">
										<div class="flex items-center justify-end gap-1.5">
											{#if trainer.evaluation_count > 0}
												<span
													class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
												>
													{trainer.evaluation_count}
												</span>
											{/if}
											<button
												onclick={() =>
													openConfirm(
														trainer.id,
														trainer.full_name ?? trainer.username
													)}
												class="rounded-md p-1 text-muted-foreground/30 opacity-0 transition-all group-hover/row:opacity-100 hover:bg-destructive/10 hover:text-destructive"
												title="Διαγραφή"
											>
												<Trash2 size={12} strokeWidth={1.75} />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Confirm delete modal -->
<Modal.Root bind:open={confirmOpen}>
	<Modal.Content class="sm:max-w-sm">
		<Modal.Header>
			<Modal.Title>Διαγραφή Trainer</Modal.Title>
			<Modal.Description>
				Είστε σίγουροι ότι θέλετε να διαγράψετε τον <strong>{pendingDeleteName}</strong>; Η
				ενέργεια δεν μπορεί να αναιρεθεί.
			</Modal.Description>
		</Modal.Header>
		<Modal.Footer>
			<Button variant="outline" onclick={() => (confirmOpen = false)} disabled={deleting}>
				Ακύρωση
			</Button>
			<Button variant="destructive" onclick={confirmDelete} disabled={deleting} class="gap-2">
				{#if deleting}
					Διαγραφή...
				{:else}
					<Trash2 size={14} />
					Διαγραφή
				{/if}
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>
