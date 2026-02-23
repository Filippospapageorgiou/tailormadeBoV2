<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Separator } from '$lib/components/ui/separator';
	import {
		ArrowLeft,
		TrendingUp,
		Building2,
		DollarSign,
		Clock,
		Download,
		RefreshCw,
		Eye,
		EyeOff,
		FileSpreadsheet,
		Trophy,
		Medal
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import {
		getBonusPeriodDetails,
		publishBonusPeriod,
		unpublishBonusPeriod,
		recalculateBonuses
	} from '$lib/api/bonus_managment/data.remote';
	import ExcelPreviewTable from '../excel-preview-table.svelte';
	import type { ParsedExcelRow } from '../types';

	// Get period ID from URL
	const periodId = $derived(Number(page.params.id));

	// Query for period details
	let query = $derived(getBonusPeriodDetails({ periodId }));
	let period = $derived(query.current?.period);
	let organizations = $derived(query.current?.organizations ?? []);
	let totals = $derived(query.current?.totals);

	// Transform organizations to ParsedExcelRow format for ExcelPreviewTable
	let tableData = $derived<ParsedExcelRow[]>(
		organizations.map((org) => ({
			org_id: org.org_id,
			store_name: org.org_name,
			current_kilos: org.current_kilos,
			previous_kilos: org.previous_kilos,
			kilo_difference: org.current_kilos - org.previous_kilos,
			percentage_change: org.percentage_change
		}))
	);

	// Top 3 organizations
	let top3 = $derived(
		[...organizations]
			.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
			.slice(0, 3)
	);

	// Loading states
	let isPublishing = $state(false);
	let isRecalculating = $state(false);
	let isExporting = $state(false);

	// Derived values
	const isPublished = $derived(period?.status === 'published');
	const periodLabel = $derived(period ? `Q${period.quarter} ${period.year}` : '');

	// Refresh function
	async function refresh() {
		await query.refresh();
	}

	// Handle publish/unpublish
	async function handleTogglePublish() {
		if (!period || isPublishing) return;

		isPublishing = true;
		try {
			const result = isPublished
				? await unpublishBonusPeriod({ periodId: period.id })
				: await publishBonusPeriod({ periodId: period.id });

			if (result.success) {
				toast.success(result.message);
				await refresh();
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			toast.error('Σφάλμα κατά την αλλαγή κατάστασης');
		} finally {
			isPublishing = false;
		}
	}

	// Handle recalculate
	async function handleRecalculate() {
		if (!period || isRecalculating) return;

		isRecalculating = true;
		try {
			const result = await recalculateBonuses({ periodId: period.id });
			if (result.success) {
				toast.success(result.message, {
					description: result.summary
						? `${result.summary.successfulOrgs}/${result.summary.totalOrgs} οργανισμοί επιτυχώς`
						: undefined
				});
				await refresh();
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			toast.error('Σφάλμα κατά τον επανυπολογισμό');
		} finally {
			isRecalculating = false;
		}
	}

	// Handle export
	async function handleExport() {
		if (!period || isExporting) return;

		isExporting = true;
		try {
			const response = await fetch(`/app/managment/bonus_managment/${period.id}/api/export`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ periodId: period.id })
			});

			if (!response.ok) {
				throw new Error('Export failed');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `bonus_report_Q${period.quarter}_${period.year}.xlsx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success('Το αρχείο εξήχθη επιτυχώς');
		} catch (error) {
			console.error('Export error:', error);
			toast.error('Σφάλμα κατά την εξαγωγή');
		} finally {
			isExporting = false;
		}
	}

	// Format currency
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR'
		}).format(value);
	}

	// Format date
	function formatDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('el-GR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto px-4 pt-6 pb-10 md:px-6 lg:px-8">
		<!-- Back Button & Header -->
		<div class="mb-6">
			<Button
				variant="ghost"
				size="sm"
				class="mb-4 gap-2"
				onclick={() => goto('/app/managment/bonus_managment')}
			>
				<ArrowLeft class="h-4 w-4" />
				Πίσω στις Περιόδους
			</Button>

			{#if query.loading}
				<div class="space-y-2">
					<Skeleton class="h-8 w-48" />
					<Skeleton class="h-4 w-64" />
				</div>
			{:else if period}
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div class="flex items-center gap-4">
						<div class="rounded-lg bg-primary/10 p-3">
							<FileSpreadsheet class="h-8 w-8 text-primary" />
						</div>
						<div>
							<div class="flex items-center gap-3">
								<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
									{periodLabel}
								</h1>
								{#if isPublished}
									<Badge class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
										<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500"></span>
										Δημοσιευμένο
									</Badge>
								{:else}
									<Badge class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
										<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
										Πρόχειρο
									</Badge>
								{/if}
							</div>
							<p class="text-sm text-muted-foreground">
								Σύγκριση με Q{period.comparison_quarter} {period.comparison_year}
								• Δημιουργήθηκε {formatDate(period.created_at)}
							</p>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={handleExport}
							disabled={isExporting}
							class="gap-2"
						>
							{#if isExporting}
								<RefreshCw class="h-4 w-4 animate-spin-clockwise repeat-infinite" />
							{:else}
								<Download class="h-4 w-4" />
							{/if}
							Εξαγωγή Excel
						</Button>

						<Button
							variant="outline"
							size="sm"
							onclick={handleRecalculate}
							disabled={isRecalculating}
							class="gap-2"
						>
							{#if isRecalculating}
								<RefreshCw class="h-4 w-4 animate-spin-clockwise repeat-infinite" />
							{:else}
								<RefreshCw class="h-4 w-4" />
							{/if}
							Επανυπολογισμός
						</Button>

						<Button
							variant={isPublished ? 'outline' : 'default'}
							size="sm"
							onclick={handleTogglePublish}
							disabled={isPublishing}
							class="gap-2"
						>
							{#if isPublishing}
								<RefreshCw class="h-4 w-4 animate-spin-clockwise repeat-infinite" />
							{:else if isPublished}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
							{isPublished ? 'Απόσυρση' : 'Δημοσίευση'}
						</Button>
					</div>
				</div>
			{/if}
		</div>

		<Separator class="mb-6" />

		<!-- Summary Cards -->
		{#if query.loading}
			<div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array(4) as _}
					<div class="rounded-xl border p-6">
						<Skeleton class="mb-2 h-4 w-24" />
						<Skeleton class="h-8 w-32" />
					</div>
				{/each}
			</div>
		{:else if period && totals}
			<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Total Organizations -->
				<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
					<div class="flex items-center gap-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
							<Building2 class="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<p class="text-sm font-medium text-muted-foreground">Οργανισμοί</p>
					</div>
					<div class="mt-4 flex items-baseline justify-between">
						<h2 class="text-3xl font-mono tabular-nums">{totals.total_orgs}</h2>
						<span class="text-xs text-muted-foreground">{totals.orgs_with_bonus} με bonus</span>
					</div>
				</div>

				<!-- Network Average -->
				<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
					<div class="flex items-center gap-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
							<TrendingUp class="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<p class="text-sm font-medium text-muted-foreground">Μ.Ο. Δικτύου</p>
					</div>
					<div class="mt-4">
						<h2 class="text-3xl font-mono tabular-nums {period.network_average_percentage >= 0 ? 'text-green-600' : 'text-red-600'}">
							{period.network_average_percentage >= 0 ? '+' : ''}{period.network_average_percentage.toFixed(2)}%
						</h2>
					</div>
				</div>

				<!-- Total Bonus Pool -->
				<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
					<div class="flex items-center gap-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
							<DollarSign class="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<p class="text-sm font-medium text-muted-foreground">Σύνολο Bonus</p>
					</div>
					<div class="mt-4">
						<h2 class="text-2xl font-mono tabular-nums">{formatCurrency(totals.total_bonus_pool)}</h2>
					</div>
				</div>

				<!-- Total Hours -->
				<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
					<div class="flex items-center gap-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
							<Clock class="h-5 w-5 text-purple-600 dark:text-purple-400" />
						</div>
						<p class="text-sm font-medium text-muted-foreground">Ώρες Εργασίας</p>
					</div>
					<div class="mt-4">
						<h2 class="text-3xl font-mono tabular-nums">{totals.total_hours_worked.toLocaleString('el-GR')}</h2>
					</div>
				</div>
			</div>

			<!-- Top 3 Podium -->
			{#if top3.length > 0}
				<Card.Root class="mb-8 overflow-hidden border-border/50">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Trophy class="h-5 w-5 text-amber-500" />
							Top 3 Καταστήματα
						</Card.Title>
						<Card.Description>Τα καταστήματα με την καλύτερη απόδοση για {periodLabel}</Card.Description>
					</Card.Header>
					<Card.Content class="p-6">
						<div class="grid gap-4 md:grid-cols-3">
							{#each top3 as org, index (org.id)}
								{@const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
								{@const bgColor = index === 0 
									? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800' 
									: index === 1 
										? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700'
										: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800'}
								
								<div class="relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-lg {bgColor}">
									<!-- Rank Badge -->
									<div class="absolute -top-1 -right-1 text-4xl opacity-20">
										{medal}
									</div>
									
									<!-- Content -->
									<div class="relative">
										<div class="mb-3 flex items-center gap-2">
											<span class="text-2xl">{medal}</span>
											<span class="text-xs font-medium text-muted-foreground">#{org.rank}</span>
										</div>
										
										<h3 class="mb-1 truncate text-lg font-semibold" title={org.org_name}>
											{org.org_name}
										</h3>
										
										<div class="mt-3 flex items-center justify-between">
											<div>
												<p class="text-xs text-muted-foreground">Μεταβολή</p>
												<p class="text-xl font-bold {org.percentage_change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
													{org.percentage_change >= 0 ? '+' : ''}{org.percentage_change.toFixed(2)}%
												</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-muted-foreground">Bonus</p>
												<p class="text-lg font-semibold text-amber-600 dark:text-amber-400">
													{formatCurrency(org.total_bonus_pool)}
												</p>
											</div>
										</div>
										
										{#if org.above_network_average}
											<Badge class="mt-3 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
												↑ Άνω Μ.Ο. Δικτύου
											</Badge>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		{/if}

		<!-- Data Table (reusing ExcelPreviewTable) -->
		{#if query.loading}
			<Card.Root class="border-border/50">
				<Card.Header>
					<Skeleton class="h-6 w-48" />
				</Card.Header>
				<Card.Content>
					<div class="space-y-3">
						{#each Array(5) as _}
							<Skeleton class="h-12 w-full" />
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{:else if tableData.length > 0}
			<Card.Root class="border-border/50">
				<Card.Header>
					<div class="flex items-center justify-between">
						<div>
							<Card.Title class="flex items-center gap-2 text-lg">
								<Medal class="h-5 w-5 text-primary" />
								Όλα τα Καταστήματα
							</Card.Title>
							<Card.Description>
								Αναλυτικά στοιχεία για την περίοδο {periodLabel}
							</Card.Description>
						</div>
						<Badge variant="secondary">{tableData.length} καταστήματα</Badge>
					</div>
				</Card.Header>
				<Card.Content>
					<ExcelPreviewTable data={tableData} />
				</Card.Content>
			</Card.Root>
		{/if}
	</main>
</div>