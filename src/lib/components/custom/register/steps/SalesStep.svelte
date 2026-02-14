<script lang="ts">
	import { DollarSign, CreditCard, Bike, UtensilsCrossed, Smartphone } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
    import { getSalesRegister } from '$lib/stores/register.svelte';

    let sales = getSalesRegister();

</script>

<Card.Root class="rounded-xl border-border/60 shadow-sm">
	<Card.Header class="pb-4">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<DollarSign class="h-5 w-5 text-primary" />
			</div>
			<div>
				<Card.Title class="text-lg font-semibold text-foreground">Πωλήσεις Ημέρας</Card.Title>
				<Card.Description class="text-sm">Καταχωρήστε τις πωλήσεις της ημέρας</Card.Description>
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-6">
		<!-- Total Sales -->
		<div class="space-y-2">
			<Label for="total_sales" class="text-sm font-medium text-foreground"
				>Συνολικές Πωλήσεις *</Label
			>
			<div class="relative">
				<DollarSign class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
			<p class="text-xs text-muted-foreground">Συνολικό ποσό πωλήσεων (μετρητά + ψηφιακά)</p>
		</div>

		<!-- Digital Sales Breakdown -->
		<div class="space-y-4 rounded-lg border border-border/40 bg-muted/50 p-4">
			<h3 class="flex items-center gap-2 text-sm font-semibold text-foreground">
				<CreditCard class="h-4 w-4 text-muted-foreground" />
				Ψηφιακές Πληρωμές
			</h3>

			<div class="grid gap-4 sm:grid-cols-2">
				<!-- Card Sales -->
				<div class="space-y-1.5">
					<Label for="card_sales" class="text-sm text-muted-foreground">Κάρτες (POS)</Label>
					<div class="relative">
						<CreditCard class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
				<div class="space-y-1.5">
					<Label for="wolt_sales" class="text-sm text-muted-foreground">Wolt</Label>
					<div class="relative">
						<Bike class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
				<div class="space-y-1.5">
					<Label for="efood_sales" class="text-sm text-muted-foreground">e-Food</Label>
					<div class="relative">
						<UtensilsCrossed class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
				<div class="space-y-1.5">
					<Label for="other_digital_sales" class="text-sm text-muted-foreground">Άλλες Ψηφιακές</Label>
					<div class="relative">
						<Smartphone class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
		</div>

		<!-- Expected Cash Calculation -->
		<div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-foreground">Αναμενόμενα Μετρητά</p>
					<p class="text-xs text-muted-foreground">Συνολικές πωλήσεις - Ψηφιακές πληρωμές</p>
				</div>
				<div class="text-right">
					<p class="text-2xl font-bold tabular-nums text-primary">€{sales.expectedCash.toFixed(2)}</p>
					{#if sales.expectedCash < 0}
						<Badge variant="destructive" class="mt-1 text-xs">Αρνητικό υπόλοιπο</Badge>
					{/if}
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
