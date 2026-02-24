<script lang="ts">
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { getAssignmentStore } from '$lib/stores/assignedOrg.svelte';
    import { getprofileByUUID } from '$lib/api/trainers/trainer_evalution/data.remote';

	let { date = $bindable() } = $props();

    let assignmentStore = getAssignmentStore();

    let assignedQuery = getprofileByUUID({ id: assignmentStore.assigned_by });
    let assigned_by = $derived(assignedQuery.current?.profile);

</script>

<div class="grid grid-cols-2 gap-4">
  <div class="flex flex-col gap-2">
    <span>Ημερομηνία επίσκεψης</span>
    <InputCalendar
      id="visit_date"
      bind:value={date}
    />
  </div>

  <div class="flex flex-col gap-2">
    <span>Ανατέθηκε από</span>
    <Input
      disabled
      value={assigned_by?.full_name}
      class="w-full"
    />
  </div>
</div>