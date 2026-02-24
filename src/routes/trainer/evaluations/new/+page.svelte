<script lang="ts">
	import { getAssignmentStore } from '$lib/stores/assignedOrg.svelte';
	import EvalutionRadar from '../../../../lib/components/trainer/evalution-radar.svelte';
	import HeaderEval from '../../../../lib/components/trainer/header-eval.svelte';
	import EquipmentEval from '../../../../lib/components/trainer/equipment-eval.svelte';
	import {
		getAllOrgEquipments,
		createEvaluation,
		saveSectionItems,
		saveBaristaTraining,
		saveEquipments,
		saveSummary,
		savePhotos,
		getOrgStaff
	} from '$lib/api/trainers/trainer_evalution/data.remote';
	import { uploadEvaluationPhotos } from '$lib/api/trainers/eval_photos/photos_funcs';
	import { setEvaluationSectionsContext } from '$lib/stores/evaluationSections.svelte';
	import { getEquipmentEvalContext } from '$lib/stores/equipment-eval.svelte';
	import type { Equipment } from '$lib/models/equipment.types';
	import CleanlinessEval from '$lib/components/trainer/CleanlinessEval.svelte';
	import BaristaTrainingEval from '$lib/components/trainer/BaristaTrainingEval.svelte';
	import KnowledgeEval from '$lib/components/trainer/KnowledgeEval.svelte';
	import { setEvaluationPhotosContext } from '$lib/stores/EvalutionPhotos.svelte';
	import EvalutionPhotos from '$lib/components/trainer/EvalutionPhotos.svelte';
	import ManagersBarista from '$lib/components/trainer/managers-barista.svelte';
	import type { Profile } from '$lib/models/database.types';
	import type { EvaluationSummaryActions } from '$lib/models/trainers.types';
	import EvaluationFinal from '$lib/components/trainer/evaluation-final.svelte';
	import { Send, Save } from 'lucide-svelte';
	import { deleteAssignment } from '$lib/api/trainers/trainer_managment/data.remote';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { hideProgress, showProgress } from '$lib/stores/progress.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { setEquipmentEvalContext } from '$lib/stores/equipment-eval.svelte';

	let equipmentEvalStore = setEquipmentEvalContext();
	let evalSectionStore = setEvaluationSectionsContext();
	let EvalutionPhotosContext = setEvaluationPhotosContext();
	evalSectionStore.init();
	evalSectionStore.initBaristaTraining();

	let assignmentStore = getAssignmentStore();
	let equipmentStore = getEquipmentEvalContext();

	let equipmentQuery = getAllOrgEquipments({ orgId: assignmentStore.org_id });
	let staffQuery = getOrgStaff({ orgId: assignmentStore.org_id });
	let staff: Profile[] = $derived(staffQuery.current ?? []);
	let equipments: Equipment[] = $derived(equipmentQuery.current?.equipments ?? []);

	let date = $state('');
	let baristas = $state<string[]>([]);
	let managers = $state<string[]>([]);
	let evalFinal = $state<EvaluationSummaryActions>();
	let isSubmitting = $state(false);
	let isSubmittingDraft = $state(false);

	async function handleSubmit(type: 'draft' | 'submitted') {
		type === 'draft' ? (isSubmittingDraft = true) : (isSubmitting = true);
		showProgress('Δημιουργείτε η αξιολόγηση περιμένετε...')
		try {
			// 1. Create parent store_evaluations record → get evaluation_id
			const { evaluationId } = await createEvaluation({
				orgId: assignmentStore.org_id,
				visitDate: date,
				storeManagers: managers,
				baristasOnDuty: baristas,
				submit: type,
				overall_rating:evalFinal?.score || 0
			});

			// 2. Save checked section items (cleanliness / knowledge / training)
			const checkedItems = evalSectionStore.getCheckedItems();
			if (checkedItems.length > 0) {
				await saveSectionItems({
					evaluation_id: evaluationId,
					items: checkedItems.map((item) => ({
						section: item.section,
						item_key: item.item_key,
						item_label: item.item_label,
						checked: item.checked,
						score: item.score,
						notes: item.notes
					}))
				});
			}

			// 3. Save barista training block
			if (evalSectionStore.baristaTraining) {
				await saveBaristaTraining({
					evaluation_id: evaluationId,
					barista_name: evalSectionStore.baristaTraining.barista_name,
					score: evalSectionStore.baristaTraining.score,
					needs_followup: evalSectionStore.baristaTraining.needs_followup,
					followup_date: evalSectionStore.baristaTraining.followup_date,
					other_training: evalSectionStore.baristaTraining.other_training
				});
			}

			// 4. Save equipment evaluations + check items
			if (equipmentStore.equipments.length > 0) {
				await saveEquipments({
					evaluation_id: evaluationId,
					equipments: equipmentStore.equipments.map((eq) => ({
						equipment_id: eq.equipment_id,
						score: eq.score,
						notes: eq.notes,
						checkItems: eq.equipment_check_items.map((ci) => ({
							check_name: ci.check_name,
							value_numeric: ci.value_numeric,
							passed: ci.passed,
							notes: ci.notes
						}))
					}))
				});
			}

			// 5. Upload photo files to storage, then save metadata row
			const photoList = EvalutionPhotosContext.toUploadList();
			if (photoList.length > 0) {
				const uploadedPaths = await uploadEvaluationPhotos(evaluationId, photoList);
				await savePhotos({ evaluation_id: evaluationId, photos: uploadedPaths });
			}

			// 6. Save final summary & action points
			if (evalFinal) {
				await saveSummary({
					evaluation_id: evaluationId,
					score: evalFinal.score,
					comments: evalFinal.comments,
					sections: evalFinal.sections
				});
			}
			toast.success('Αξιολόγηση δημιουργήθηκε με επιτυχία');
			console.log('[handleSubmit] Evaluation saved successfully, id:', evaluationId);
		} catch (err) {
			toast.error('Σφάλμα κάτα την δημιουργία');
			console.error('[handleSubmit] Error saving evaluation:', err);
		} finally {
			if (type === 'submitted') {
				await deleteAssignment({ assignmentId: assignmentStore.id });
			}
			isSubmitting = false;
			isSubmittingDraft = false;
			hideProgress();
			goto('/trainer');
		}
	}
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-8">
		<!-- Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Αγιολόγηση καταστήματος</h1>
				<p class="text-xs text-muted-foreground md:text-sm">
					Νεα αξιολογήσει για το κατάστημα με κώδικο {assignmentStore.org_id} συμπλήρωσε την φόρμα και
					υπέβαλε την
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:grid-rows-6">
			<div class="flex flex-col lg:row-span-6">
				<HeaderEval bind:date />
				<ManagersBarista bind:managers bind:baristas employees={staff} />
				<EquipmentEval {equipments} />
				<BaristaTrainingEval />
				<KnowledgeEval />
				<CleanlinessEval />
				<EvalutionPhotos />
			</div>
			<div class="flex flex-col lg:row-span-6">
				<EvalutionRadar {evalFinal} />
				<EvaluationFinal bind:evalFinal />

				<!-- Submit actions -->
				<div class="mt-4 flex flex-col gap-2 p-4">
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Υποβολή Αξιολόγησης
					</p>
					<div class="flex gap-2">
						<button
							onclick={() => handleSubmit('draft')}
							disabled={isSubmitting || isSubmittingDraft}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmittingDraft}
								<Spinner />
								Αποθήκευση...
							{:else}
								<Save class="h-4 w-4" />
								Αποθήκευση Πρόχειρου
							{/if}
						</button>
						<button
							onclick={() => handleSubmit('submitted')}
							disabled={isSubmitting || isSubmittingDraft}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmitting}
								<Spinner />
								Υποβολή...
							{:else}
								<Send class="h-4 w-4" />
								Υποβολή
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
