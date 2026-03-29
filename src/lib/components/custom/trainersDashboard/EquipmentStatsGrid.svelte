<script lang="ts">
	import StatCard from './StatCard.svelte';
	import { Wrench, ClipboardList, Coins, MapPin } from '@lucide/svelte';

	let { stats, loading = false } = $props();

	let statCards = $derived([
		{
			title: 'Ολοκληρωμένες Επισκέψεις',
			value: stats.current?.completedVisits ?? '—',
			description: 'Σύνολο επισκέψεων εξοπλισμού',
			iconName: 'wrench' as const,
			trend: undefined
		},
		{
			title: 'Συνολικές Ενέργειες',
			value: stats.current?.totalActions ?? '—',
			description: 'Ενέργειες σε εξοπλισμό',
			iconName: 'clipboard' as const,
			trend: undefined
		},
		{
			title: 'Συνολικό Κόστος',
			value: stats.current?.totalCost != null ? `${stats.current.totalCost.toFixed(2)}€` : '—',
			description: 'Κόστος επισκευών & συντήρησης',
			iconName: 'coins' as const,
			trend: undefined
		},
		{
			title: 'Καταστήματα',
			value: stats.current?.uniqueStores ?? '—',
			description: 'Μοναδικά καταστήματα με επίσκεψη',
			iconName: 'mapPin' as const,
			trend: undefined
		}
	]);

	const iconMap = {
		wrench: Wrench,
		clipboard: ClipboardList,
		coins: Coins,
		mapPin: MapPin
	} as const;
</script>

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
