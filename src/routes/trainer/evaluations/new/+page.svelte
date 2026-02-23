<script lang="ts">
	import { getAssignmentStore } from "$lib/stores/assignedOrg.svelte";
    import { deleteAssignment } from "$lib/api/trainers/trainer_managment/data.remote";

	let assignmentStore = getAssignmentStore();
</script>
