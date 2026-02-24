<script lang="ts">
	import { getAssignmentStore } from '$lib/stores/assignedOrg.svelte';
	import { deleteAssignment } from '$lib/api/trainers/trainer_managment/data.remote';
	import EvalutionRadar from '../../../../lib/components/trainer/evalution-radar.svelte';
	import HeaderEval from '../../../../lib/components/trainer/header-eval.svelte';
	import EquipmentEval from '../../../../lib/components/trainer/equipment-eval.svelte';
	import { getAllOrgEquipments } from '$lib/api/trainers/trainer_evalution/data.remote';
	import { getEvaluationSectionsContext } from '$lib/stores/evaluationSections.svelte';
	import type { Equipment } from '$lib/models/equipment.types';
	import CleanlinessEval from '$lib/components/trainer/CleanlinessEval.svelte';
	import BaristaTrainingEval from '$lib/components/trainer/BaristaTrainingEval.svelte';
	import KnowledgeEval from '$lib/components/trainer/KnowledgeEval.svelte';
	import { setEvaluationSectionsContext } from '$lib/stores/evaluationSections.svelte';

	// This MUST be called at the top level of the script, not inside onMount
	let evalSectionStore = setEvaluationSectionsContext();
	evalSectionStore.init();               // loads all 23 defaults
	evalSectionStore.initBaristaTraining(); // initializes empty barista training

	let assignmentStore = getAssignmentStore();

	let equipmentQuery = getAllOrgEquipments({orgId: assignmentStore.org_id});
	let equipments:Equipment[] = $derived(equipmentQuery.current?.equipments ?? []);
	
	let date = $state('');
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-8">
		<!-- Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Αγιολόγηση καταστήματος</h1>
				<p class="text-xs text-muted-foreground md:text-sm">
					Νεα αξιολογήσει για το κατάστημα με κώδικο {assignmentStore.org_id} συμπλήρωσε την φόρμα και υπέβαλε την
				</p>
			</div>
		</div>

		<div class="grid grid-cols-2 grid-rows-6 gap-4">
			<div class="row-span-6">
				<HeaderEval bind:date />
				<EquipmentEval {equipments} />
				<CleanlinessEval />
				<BaristaTrainingEval />
				<KnowledgeEval />
			</div>
			<div class="row-span-6">
				<EvalutionRadar />
			</div>
		</div>
	</main>
</div>
