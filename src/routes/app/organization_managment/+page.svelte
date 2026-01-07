<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import {
		authenticatedAccess,
		getAllOrganizations,
		createOrganization,
		type OrganizationWithCounts
	} from './data.remote';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Modal from '$lib/components/ui/modal/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Plus, RefreshCcw } from 'lucide-svelte';
	import DataTable from './data-table.svelte';
	import { orgColumns } from './columns';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	let auth = authenticatedAccess();
	let query = getAllOrganizations();

	let organizations = $derived(query.current?.organizations ?? []);

	// Calculate totals for header stats
	let totalEmployees = $derived(organizations.reduce((sum, org) => sum + org.employee_count, 0));
	let totalEquipment = $derived(organizations.reduce((sum, org) => sum + org.equipment_count, 0));

	// Modal state
	let openAddOrgModal = $state(false);
	let isSubmitting = $state(false);
	let orgStatus = $state(true);

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
	async function refresh(){
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
			<div class="mb-8 space-y-4">
				<div class="flex flex-col gap-2">
					<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Organization Management</h1>
					<p class="text-xs text-muted-foreground md:text-sm">
						Manage your organizations, view details and status
					</p>
					<div class="flex items-center gap-4">
						<p class="text-xs text-muted-foreground md:text-sm">
							<span class="font-semibold">{organizations.length}</span> organizations
						</p>
						<span class="text-muted-foreground">•</span>
						<p class="text-xs text-muted-foreground md:text-sm">
							<span class="font-semibold">{totalEmployees}</span> total employees
						</p>
						<span class="text-muted-foreground">•</span>
						<p class="text-xs text-muted-foreground md:text-sm">
							<span class="font-semibold">{totalEquipment}</span> total equipment
						</p>
					</div>
				</div>

				<!-- Filters & Actions Section -->
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center"></div>

					<div class="relative flex items-center gap-2">
						<Button
							variant="secondary"
							onclick={refresh}
						>
							<RefreshCcw class="h-4 w-4 {isRefresing ? 'animate-spin-clockwise repeat-infinite' : ''}" />
						</Button>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="default"
										size="sm"
										class="h-8 cursor-pointer gap-2 px-3"
										onclick={openAddDialog}
									>
										<Plus class="h-4 w-4" />
										<span class="hidden sm:inline">Add Organization</span>
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Add New Organization</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				</div>
			</div>

			<!-- Data Table -->
			<DataTable data={organizations} columns={orgColumns} />
		</main>
	</div>

	<!-- ADD ORGANIZATION MODAL -->
	<Modal.Root bind:open={openAddOrgModal}>
		<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
			<Modal.Header>
				<Modal.Title>Δημιουργία νέου οργανισμού</Modal.Title>
				<Modal.Description>Συμπληρώστε τα στοιχεία του νέου οργανισμού</Modal.Description>
			</Modal.Header>

			<ScrollArea class="h-[65dvh] w-full sm:h-auto sm:max-h-[60dvh]">
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
							<Label for="store-name">Όνομα καταστήματος *</Label>
							<Input
								id="store-name"
								{...createOrganization.fields.store_name.as('text')}
								placeholder="π.χ. Coffee roasters Athens"
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
							/>
						</div>

						<!-- Phone -->
						<div class="space-y-2">
							<Label for="org-phone">Τηλέφωνο</Label>
							<Input
								id="org-phone"
								{...createOrganization.fields.phone.as('text')}
								placeholder="+30 210 1234567"
							/>
						</div>

						<!-- Country -->
						<div class="space-y-2">
							<Label for="org-country">Χώρα</Label>
							<Input
								id="org-country"
								{...createOrganization.fields.country.as('text')}
								placeholder="Greece"
							/>
						</div>

						<!-- Location -->
						<div class="space-y-2">
							<Label for="org-location">Τοποθεσία / Διεύθυνση</Label>
							<Input
								id="org-location"
								{...createOrganization.fields.location.as('text')}
								placeholder="Ermou 15, Athens"
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
