<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { authenticatedAccess } from '$lib/api/bonus_managment/data.remote';
	import {
		inviteTrainer,
		getTrainers,
		getAllOrganizations,
		bulkAssignTrainerToOrgs,
		getEvaluations
	} from '$lib/api/trainers/trainer_managment/data.remote';
	import { toast } from 'svelte-sonner';
	import * as Modal from '$lib/components/ui/modal/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Plus, RefreshCcw, CheckCircle, XCircle, Mail } from 'lucide-svelte';
	import { Braces, ChartBarIncreasing, MoveRight } from '@lucide/svelte';
	import EvalutionAssign from '$lib/components/custom/trainersDashboard/evalution-assign.svelte';
	import StatsSection from '$lib/components/custom/trainersDashboard/StatsSection.svelte';
	import AssignmentSheet from '$lib/components/custom/trainersDashboard/assignment-sheet.svelte';
	import DataTable from './data-table/data-table.svelte';

	let auth = authenticatedAccess();
	let evaluationsQuery = getEvaluations();

	// ─── Invite Trainer Modal ───
	let openTrainerModal = $state(false);
	let isSubmitting = $state(false);
	let inviteEmail = $state('');
	let inviteError = $state('');
	let inviteSuccess = $state(false);

	// ─── Evaluation Assign Modal ───
	let openEvalModal = $state(false);

	// ─── Data for dropdowns ───
	let trainersData = $state<
		Array<{ id: string; full_name: string | null; username: string; imageUrl: string; email: string; }>
	>([]);
	let orgsData = $state<Array<{ id: number; store_name: string }>>([]);

	let openAssignmentsSheet = $state(false);

	// Load data for the evaluation modal
	async function loadDropdownData() {
		try {
			const [trainersResult, orgsResult] = await Promise.all([
				getTrainers(),
				getAllOrganizations()
			]);

			if (trainersResult.success && trainersResult.trainers) {
				trainersData = trainersResult.trainers.map((t: any) => ({
					id: t.id,
					full_name: t.full_name,
					username: t.username,
					imageUrl: t.image_url,
					email: t.email
				}));
			}

			if (orgsResult.success && orgsResult.organizations) {
				orgsData = orgsResult.organizations.map((o: any) => ({
					id: o.id,
					store_name: o.store_name
				}));
			}
		} catch (err) {
			console.error('Failed to load dropdown data:', err);
		}
	}

	function openEvalAssignModal() {
		loadDropdownData();
		openEvalModal = true;
	}

	// Handle evaluation assignment submission
	async function handleEvalAssign(data: {
		trainerId: string;
		orgIds: number[];
		visitDate: string;
	}) {
		return await bulkAssignTrainerToOrgs({
        	trainerId: data.trainerId,
        	orgIds: data.orgIds,
        	visitDate: data.visitDate
   	 	});
	}

	// ─── Invite modal handlers ───
	function openAddDialog() {
		inviteEmail = '';
		inviteError = '';
		inviteSuccess = false;
		openTrainerModal = true;
	}

	function closeInviteModal() {
		openTrainerModal = false;
		inviteEmail = '';
		inviteError = '';
		inviteSuccess = false;
	}

	async function handleInviteTrainer() {
		if (isSubmitting) return;
		isSubmitting = true;
		inviteError = '';

		try {
			const result = await inviteTrainer({ email: inviteEmail });
			if (result.success) {
				inviteSuccess = true;
				toast.success(`Πρόσκληση στάλθηκε στο ${inviteEmail}`);
			} else {
				inviteError = result.message || 'Αποτυχία αποστολής πρόσκλησης';
			}
		} catch (err: any) {
			inviteError = err?.message || 'Παρουσιάστηκε σφάλμα';
		} finally {
			isSubmitting = false;
		}
	}

	let isRefreshing = $state(false);
	$effect(() => {
		if(isRefreshing){
			evaluationsQuery.refresh();
		}
	})
</script>

{#await auth}
	<AuthBlock />
{:then}
	<div class="min-h-screen">
		<main class="container mx-auto px-2 pt-4 pb-4 md:px-2">
			<!-- Header Section -->
			<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div class="space-y-1">
					<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Διαχείριση Trainers</h1>
					<p class="text-xs text-muted-foreground md:text-sm">
						Διαχειριστείτε τους trainers σας, αναθέστε τους νέες εργασίες και δείτε live ενημερώσεις
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						class="h-9 cursor-pointer"
						onclick={() => {
							isRefreshing = true;
						}}
					>
						<RefreshCcw
							class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise repeat-infinite' : ''}"
						/>
					</Button>
					<Button
						variant="secondary"
						size="sm"
						class="h-9 w-fit cursor-pointer gap-2 px-4"
						onclick={() => (openAssignmentsSheet = true)}
					>
						<ChartBarIncreasing class="h-4 w-4" />
						<span class="hidden sm:inline">Προβολή Αναθέσεων</span>
					</Button>
					<Button
						variant="default"
						size="sm"
						class="h-9 w-fit cursor-pointer gap-2 px-4"
						onclick={openEvalAssignModal}
					>
						<Braces class="h-4 w-4" />
						<span class="hidden sm:inline">Ανάθεση Αξιολόγησης</span>
					</Button>
					<Button
						variant="default"
						size="sm"
						class="h-9 w-fit cursor-pointer gap-2 px-4"
						onclick={openAddDialog}
					>
						<Plus class="h-4 w-4" />
						<span class="hidden sm:inline">Νέος Trainer</span>
					</Button>
				</div>
			</div>

			<StatsSection trainers={getTrainers().current?.trainers} bind:isRefreshing />
			<DataTable
				data={evaluationsQuery?.current?.evaluations ?? []}
				onview={(id) => console.log('View', id)}
				onedit={(id) => console.log('Edit', id)}
				ondelete={(id) => console.log('Delete', id)}
			/>
		</main>
	</div>
{/await}

<!-- EVALUATION ASSIGN MODAL -->
<EvalutionAssign
	bind:open={openEvalModal}
	trainers={trainersData}
	organizations={orgsData}
	onsubmit={handleEvalAssign}
/>

<AssignmentSheet bind:open={openAssignmentsSheet} />

<!-- INVITE TRAINER MODAL -->
<Modal.Root bind:open={openTrainerModal}>
	<Modal.Content class="flex flex-col sm:h-auto sm:max-w-md">
		<Modal.Header>
			<Modal.Title>Πρόσκληση νέου Trainer</Modal.Title>
			<Modal.Description>Θα σταλεί email πρόσκληση για δημιουργία λογαριασμού</Modal.Description>
		</Modal.Header>
		<div class="grid gap-4 py-4">
			<div class="space-y-2">
				<Label for="trainer-email">Email</Label>
				<Input
					id="trainer-email"
					type="email"
					bind:value={inviteEmail}
					placeholder="trainer@example.com"
					disabled={isSubmitting}
					class="w-full"
				/>
			</div>

			{#if inviteError}
				<div
					class="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
				>
					<XCircle class="h-4 w-4 shrink-0" />
					<span>{inviteError}</span>
				</div>
			{/if}

			{#if inviteSuccess}
				<div
					class="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-400"
				>
					<CheckCircle class="h-4 w-4 shrink-0" />
					<span>Η πρόσκληση στάλθηκε επιτυχώς!</span>
				</div>
			{/if}
		</div>
		<Modal.Footer>
			<Button variant="outline" onclick={closeInviteModal} disabled={isSubmitting}>
				{inviteSuccess ? 'Κλείσιμο' : 'Ακύρωση'}
			</Button>
			{#if !inviteSuccess}
				<Button onclick={handleInviteTrainer} disabled={isSubmitting} class="gap-2">
					{#if isSubmitting}
						<Spinner class="h-4 w-4" />
						Αποστολή...
					{:else}
						<Mail class="h-4 w-4" />
						Αποστολή Πρόσκλησης
					{/if}
				</Button>
			{/if}
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>
