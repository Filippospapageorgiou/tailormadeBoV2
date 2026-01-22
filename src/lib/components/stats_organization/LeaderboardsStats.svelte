<script lang="ts">
	import { Trophy, Medal, User, Store, TrendingUp } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let { topOrganizations = [], topEmployees = [] } = $props<{
		topOrganizations: {
			org_id: number;
			store_name: string;
			avg_percentage: number;
			total_bonus: number;
			periods_count: number;
		}[];
		topEmployees: {
			user_id: string;
			username: string;
			image_url: string | null;
			total_bonus: number;
			payouts_count: number;
		}[];
	}>();

	// Medal colors for top 3
	const medalColors = [
		'text-yellow-500', // 🥇 Gold
		'text-gray-400', // 🥈 Silver
		'text-amber-600' // 🥉 Bronze
	];

	const medalBg = ['bg-yellow-500/10', 'bg-gray-400/10', 'bg-amber-600/10'];

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Get initials for avatar fallback
	function getInitials(name: string): string {
		return (
			name
				.split(' ')
				.map((n) => n[0])
				.slice(0, 2)
				.join('')
				.toUpperCase() || '??'
		);
	}
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<!-- Top Organizations -->
	<Card.Root
		class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm"
	>
		<!-- Subtle gradient background -->
		<div
			class="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5"
		></div>

		<!-- Subtle ambient glow -->
		<div
			class="absolute -top-32 -left-32 -z-10 h-64 w-64 rounded-full bg-yellow-400/8 blur-3xl"
		></div>

		<Card.Header class="pb-4">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-yellow-500/10 p-2">
					<Trophy class="h-4 w-4 text-yellow-500" />
				</div>
				<div>
					<Card.Title class="text-base">Top Καταστήματα</Card.Title>
					<Card.Description class="text-xs">Μέσος όρος % αλλαγής</Card.Description>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="flex-1 space-y-2">
			{#if topOrganizations.length > 0}
				{#each topOrganizations as org, index}
					<div
						style="animation-delay: {index * 200}ms;"
						class="flex items-center animate-fade-in-down gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 {index <
						3
							? medalBg[index]
							: ''}"
					>
						<!-- Rank -->
						<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center">
							{#if index < 3}
								<Medal class="h-5 w-5 {medalColors[index]}" />
							{:else}
								<span class="text-xs font-medium text-muted-foreground">{index + 1}</span>
							{/if}
						</div>

						<!-- Store icon -->
						<div class="flex-shrink-0 rounded-md bg-muted/50 p-1.5">
							<Store class="h-3.5 w-3.5 text-muted-foreground" />
						</div>

						<!-- Name -->
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{org.store_name}</p>
							<p class="text-[10px] text-muted-foreground">{org.periods_count} quarters</p>
							<span class="font-monospace text-emerald-600">
								€{org.total_bonus.toLocaleString('el-GR')}
							</span>
						</div>

						<!-- Percentage -->
						<div class="flex items-center gap-1 text-emerald-600">
							<TrendingUp class="h-3 w-3" />
							<span class="text-sm font-semibold">+{org.avg_percentage}%</span>
						</div>
					</div>
				{/each}
			{:else}
				<div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
					<Trophy class="mb-2 h-8 w-8 opacity-30" />
					<p class="text-sm">Δεν υπάρχουν δεδομένα</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Top Employees -->
	<Card.Root
		class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm"
	>
		<!-- Subtle gradient background -->
		<div
			class="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5"
		></div>

		<!-- Subtle ambient glow -->
		<div
			class="absolute -top-32 -right-32 -z-10 h-64 w-64 rounded-full bg-purple-400/8 blur-3xl"
		></div>

		<Card.Header class="pb-4">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-purple-500/10 p-2">
					<Medal class="h-4 w-4 text-purple-500" />
				</div>
				<div>
					<Card.Title class="text-base">Top Υπάλληλοι</Card.Title>
					<Card.Description class="text-xs">Συνολικό bonus</Card.Description>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="flex-1 space-y-2">
			{#if topEmployees.length > 0}
				{#each topEmployees as emp, index}
					<div
						style="animation-delay: {index * 200}ms;"
						class="flex items-center animate-fade-in-down gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 {index <
						3
							? medalBg[index]
							: ''}"
					>
						<!-- Rank -->
						<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center">
							{#if index < 3}
								<Medal class="h-5 w-5 {medalColors[index]}" />
							{:else}
								<span class="text-xs font-medium text-muted-foreground">{index + 1}</span>
							{/if}
						</div>

						<!-- Avatar -->
						<Avatar.Root class="h-7 w-7">
							<Avatar.Image class="dark:bg-muted" src={emp.image_url} alt={emp.username} />
							<Avatar.Fallback class="text-[10px] font-medium">
								{getInitials(emp.username)}
							</Avatar.Fallback>
						</Avatar.Root>

						<!-- Name -->
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{emp.username}</p>
							<p class="text-[10px] text-muted-foreground">{emp.payouts_count} payouts</p>
						</div>

						<!-- Bonus Amount -->
						<span class="text-sm font-semibold text-emerald-600">
							{formatCurrency(emp.total_bonus)}
						</span>
					</div>
				{/each}
			{:else}
				<div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
					<User class="mb-2 h-8 w-8 opacity-30" />
					<p class="text-sm">Δεν υπάρχουν δεδομένα</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
