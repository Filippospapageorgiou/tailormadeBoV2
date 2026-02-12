<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { getAllOrganizations, createOrganization } from './data.remote';
	import { authenticatedAccess } from '$lib/api/bonus_managment/data.remote';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Modal from '$lib/components/ui/modal/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Building2Icon, Info, Plus, RefreshCcw, TrendingUpDownIcon, Users, Wrench, CheckCircle, XCircle } from 'lucide-svelte';
	import DataTable from './data-table.svelte';
	import { orgColumns } from './columns';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import PhoneInput from '$lib/components/ui/phone-input/phone-input.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Stats from '$lib/components/stats_organization/Stats.svelte';

	let auth = authenticatedAccess();
	let query = getAllOrganizations();

	let organizations = $derived(query.current?.organizations ?? []);
	let phone = $state('');

	// Modal state
	let openAddOrgModal = $state(false);
	let isSubmitting = $state(false);
	let orgStatus = $state(true);

	// Org stats
	let orgStats = $derived.by(() => {
		const stats = { total: organizations.length, active: 0, inactive: 0, totalEmployees: 0, totalEquipment: 0 };
		for (const org of organizations) {
			if (org.status) stats.active++;
			else stats.inactive++;
			stats.totalEmployees += org.employee_count ?? 0;
			stats.totalEquipment += org.equipment_count ?? 0;
		}
		return stats;
	});

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	function openAddDialog() {
		openAddOrgModal = true;
		orgStatus = true;
	}

	function closeAddDialog() {
		openAddOrgModal = false;
		orgStatus = true;
	}

	let isRefresing = $state(false);
	async function refresh() {
		isRefresing = true;
		await query.refresh();
		isRefresing = false;
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen">
		<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
			<!-- Header Section -->
			<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div class="space-y-1">
					<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Διαχείριση οργανισμών</h1>
					<p class="text-xs text-muted-foreground md:text-sm">
						Διαχειριστείτε τους οργανισμούς σας, δείτε λεπτομέρειες και κατάσταση
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="secondary" size="sm" class="h-9 cursor-pointer" onclick={refresh}>
						<RefreshCcw
							class="h-4 w-4 {isRefresing ? 'animate-spin-clockwise repeat-infinite' : ''}"
						/>
					</Button>
					<Button
						variant="default"
						size="sm"
						class="h-9 w-fit cursor-pointer gap-2 px-4"
						onclick={openAddDialog}
					>
						<Plus class="h-4 w-4" />
						<span class="hidden sm:inline">Νέος Οργανισμός</span>
					</Button>
				</div>
			</div>

			<!-- Tabs Section -->
			<Tabs.Root value="stats" class="w-full">
				<Tabs.List class="flex h-auto w-auto justify-start bg-transparent">
					<Tabs.Trigger
						value="stats"
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					>
						<TrendingUpDownIcon class="h-4 w-4" />
						Στατιστικά
					</Tabs.Trigger>
					<Tabs.Trigger
						value="orgs"
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					>
						<Building2Icon class="h-4 w-4" />
						Οργανισμοί
					</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="stats" class="mt-6 animate-fade-in-left space-y-6">
					<Stats />
				</Tabs.Content>

				<Tabs.Content value="orgs" class="mt-6 animate-fade-in-left space-y-6">
					<!-- Stats Cards -->
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
						<!-- Total Orgs -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Σύνολο</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{orgStats.total}</p>
								</div>
								<div class="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
									<Building2Icon class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<p class="text-[11px] text-muted-foreground">Οργανισμοί</p>
							</div>
						</div>

						<!-- Active -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Ενεργοί</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{orgStats.active}</p>
								</div>
								<div class="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 transition-colors group-hover:bg-emerald-500/15 dark:text-emerald-400">
									<CheckCircle class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-emerald-500 transition-all duration-500"
										style="width: {orgStats.total ? (orgStats.active / orgStats.total) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>

						<!-- Inactive -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Ανενεργοί</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{orgStats.inactive}</p>
								</div>
								<div class="rounded-lg bg-red-500/10 p-2.5 text-red-600 transition-colors group-hover:bg-red-500/15 dark:text-red-400">
									<XCircle class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-red-500 transition-all duration-500"
										style="width: {orgStats.total ? (orgStats.inactive / orgStats.total) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>

						<!-- Total Employees -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Υπάλληλοι</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{orgStats.totalEmployees}</p>
								</div>
								<div class="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 transition-colors group-hover:bg-blue-500/15 dark:text-blue-400">
									<Users class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<p class="text-[11px] text-muted-foreground">Σε όλους τους οργανισμούς</p>
							</div>
						</div>

						<!-- Total Equipment -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Εξοπλισμός</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{orgStats.totalEquipment}</p>
								</div>
								<div class="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 transition-colors group-hover:bg-purple-500/15 dark:text-purple-400">
									<Wrench class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<p class="text-[11px] text-muted-foreground">Σε όλους τους οργανισμούς</p>
							</div>
						</div>
					</div>

					<!-- Data Table wrapped in card -->
					<div class="rounded-xl border border-border/60 bg-card">
						<DataTable data={organizations} columns={orgColumns} />
					</div>
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>

	<!-- ADD ORGANIZATION MODAL -->
	<Modal.Root bind:open={openAddOrgModal}>
		<Modal.Content class="flex flex-col sm:h-auto">
			<Modal.Header>
				<Modal.Title>Δημιουργία νέου οργανισμού</Modal.Title>
				<Modal.Description>Συμπληρώστε τα στοιχεία του νέου οργανισμού</Modal.Description>
			</Modal.Header>

			<ScrollArea class="h-[65dvh] w-full sm:h-auto">
				<form
					class="space-y-6 px-1 py-4"
					{...createOrganization.enhance(async ({ form, submit }) => {
						isSubmitting = true;
						await submit();

						if (createOrganization.result?.success) {
							toast.success('Ο οργανισμός δημιουργήθηκε επιτυχώς');
							form.reset();
							closeAddDialog();
							await query.refresh();
						} else {
							toast.error(
								createOrganization.result?.message || 'Αποτυχία δημιουργίας, προσπαθήστε ξανά'
							);
						}
						isSubmitting = false;
					})}
				>
					<div class="space-y-4">
						<!-- Store Name -->
						<div class="space-y-2">
							<Label for="store-name"
								>Όνομα καταστήματος<span class="text-destructive">*</span></Label
							>
							<Input
								id="store-name"
								{...createOrganization.fields.store_name.as('text')}
								placeholder="π.χ. Coffee roasters Athens"
								disabled={isSubmitting}
							/>
						</div>

						<!-- Email -->
						<div class="space-y-2">
							<Label for="org-email">Email</Label>
							<Input
								id="org-email"
								type="email"
								{...createOrganization.fields.email.as('text')}
								placeholder="info@example.com"
								disabled={isSubmitting}
							/>
						</div>

						<!-- Phone -->
						<div class="space-y-2">
							<Label for="org-phone">Τηλέφωνο</Label>
							<PhoneInput
								country="GR"
								placeholder={'+30 210 5671 123'}
								disabled={isSubmitting}
								{...createOrganization.fields.phone.as('text')}
								bind:value={phone}
							/>
						</div>

						<!-- Country -->
						<div class="space-y-2">
							<Label for="org-country">Χώρα</Label>
							<Input
								id="org-country"
								{...createOrganization.fields.country.as('text')}
								placeholder="Greece"
								disabled={isSubmitting}
							/>
						</div>

						<!-- Location -->
						<div class="space-y-2">
							<Label for="org-location"
								>Τοποθεσία / Διεύθυνση<span class="text-destructive">*</span></Label
							>
							<Input
								id="org-location"
								{...createOrganization.fields.location.as('text')}
								placeholder="Περικλέους 37, Αθήνα"
								disabled={isSubmitting}
								required
							/>
						</div>

						<!-- Status Toggle -->
						<div class="flex items-center justify-between rounded-lg border border-border p-3">
							<div class="space-y-0.5">
								<Label for="org-status">Κατάσταση</Label>
								<p class="text-xs text-muted-foreground">
									{orgStatus ? 'Ο οργανισμός είναι ενεργός' : 'Ο οργανισμός είναι ανενεργός'}
								</p>
							</div>
							<Switch id="org-status" bind:checked={orgStatus} class="cursor-pointer" />
							<input
								type="hidden"
								{...createOrganization.fields.status.as('text')}
								value={orgStatus.toString()}
							/>
						</div>
						<div
							class="flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
						>
							<Info class="mt-0.5 h-4 w-4 shrink-0" />
							<div class="space-y-1">
								<p class="font-medium">Μορφή διεύθυνσης για τον χάρτη</p>
								<p class="text-xs opacity-90">
									Χρησιμοποιήστε: <span class="font-mono">[Οδός] [Αριθμός], [Πόλη]</span>
								</p>
								<p class="text-xs opacity-75">π.χ. Ερμού 10, Αθήνα ή Τσιμισκή 50, Θεσσαλονίκη</p>
							</div>
						</div>
					</div>

					<Modal.Footer class="py-4">
						<Button type="submit" disabled={isSubmitting} class="cursor-pointer">
							{#if isSubmitting}
								<Spinner class="mr-2 h-4 w-4" />
								Δημιουργία...
							{:else}
								<Plus class="mr-2 h-4 w-4" />
								Δημιουργία οργανισμού
							{/if}
						</Button>
						<Button variant="outline" type="button" onclick={closeAddDialog} class="cursor-pointer">
							Ακύρωση
						</Button>
					</Modal.Footer>
				</form>
			</ScrollArea>
		</Modal.Content>
	</Modal.Root>
{/if}
