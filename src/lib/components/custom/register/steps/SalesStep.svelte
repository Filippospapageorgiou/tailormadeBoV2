<script lang="ts">
	import { DollarSign, CreditCard, Bike, UtensilsCrossed, Smartphone } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
    import { getSalesRegister } from '$lib/stores/register.svelte';

    let sales = getSalesRegister();
	
</script>

<Card.Root class="border-neutral-200 shadow-sm">
	<Card.Header>
		<div class="flex items-center gap-2">
			<div class="rounded-full bg-[#8B6B4A]/10 p-2">
				<DollarSign class="h-5 w-5 text-[#8B6B4A]" />
			</div>
			<div>
				<Card.Title class="text-xl text-neutral-800">Πωλήσεις Ημέρας</Card.Title>
				<Card.Description>Καταχωρήστε τις πωλήσεις της ημέρας</Card.Description>
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-6">
		<!-- Total Sales -->
		<div class="space-y-2">
			<Label for="total_sales" class="text-sm font-semibold text-neutral-700"
				>Συνολικές Πωλήσεις *</Label
			>
			<div class="relative">
				<DollarSign class="absolute left-3 top-3 h-4 w-4 text-green-700" />
				<Input
					id="total_sales"
					type="number"
					bind:value={sales.totalSales}
					placeholder="0.00"
					min="0"
					step="0.01"
					class="pl-10"
					required
				/>
			</div>
			<p class="text-xs text-neutral-500">Συνολικό ποσό πωλήσεων (μετρητά + ψηφιακά)</p>
		</div>

		<!-- Digital Sales Breakdown -->
		<div class="space-y-4 rounded-lg bg-neutral-50 p-4">
			<h3 class="flex items-center gap-2 text-sm font-semibold text-neutral-700">
				<CreditCard class="h-4 w-4" />
				Ψηφιακές Πληρωμές
			</h3>

			<!-- Card Sales -->
			<div class="space-y-2">
				<Label for="card_sales" class="text-sm text-neutral-600">Κάρτες (POS)</Label>
				<div class="relative">
					<CreditCard class="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
					<Input
						id="card_sales"
						type="number"
						bind:value={sales.cardSales}
						placeholder="0.00"
						min="0"
						step="0.01"
						class="pl-10"
					/>
				</div>
			</div>

			<!-- Wolt Sales -->
			<div class="space-y-2">
				<Label for="wolt_sales" class="text-sm text-neutral-600">Wolt</Label>
				<div class="relative">
					<Bike class="absolute left-3 top-3 h-4 w-4 text-blue-400" />
					<Input
						id="wolt_sales"
						type="number"
						bind:value={sales.woltSales}
						placeholder="0.00"
						min="0"
						step="0.01"
						class="pl-10"
					/>
				</div>
			</div>

			<!-- eFoodgr Sales -->
			<div class="space-y-2">
				<Label for="efood_sales" class="text-sm text-neutral-600">e-Food</Label>
				<div class="relative">
					<UtensilsCrossed class="absolute left-3 top-3 h-4 w-4 text-red-400" />
					<Input
						id="efood_sales"
						type="number"
						bind:value={sales.efoodSales}
						placeholder="0.00"
						min="0"
						step="0.01"
						class="pl-10"
					/>
				</div>
			</div>

			<!-- Other Digital Sales -->
			<div class="space-y-2">
				<Label for="other_digital_sales" class="text-sm text-neutral-600">Άλλες Ψηφιακές</Label>
				<div class="relative">
					<Smartphone class="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
					<Input
						id="other_digital_sales"
						type="number"
						bind:value={sales.otherDigitalSales}
						placeholder="0.00"
						min="0"
						step="0.01"
						class="pl-10"
					/>
				</div>
			</div>

			
		</div>

		<!-- Expected Cash Calculation -->
		<div class="rounded-lg bg-[#8B6B4A]/5 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold text-neutral-700">Αναμενόμενα Μετρητά</p>
					<p class="text-xs text-neutral-500">Συνολικές πωλήσεις - Ψηφιακές πληρωμές</p>
				</div>
				<div class="text-right">
					<p class="text-2xl font-bold text-[#8B6B4A]">€{sales.expectedCash.toFixed(2)}</p>
					{#if sales.expectedCash < 0}
						<Badge variant="destructive" class="mt-1 text-xs">Αρνητικό υπόλοιπο</Badge>
					{/if}
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>