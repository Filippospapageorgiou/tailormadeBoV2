<script lang="ts">
	import Header from "$lib/components/custom/dayliTasks/header.svelte";
    import { getDayliTaskForUser } from "./data.remote";
	import TaskList from "./dnd_components/task-list.svelte";
	

    let query = getDayliTaskForUser();

    // Reactive calculations for the gamified stats
    let tasks = $derived(query.current?.tasks ?? []);
    let totalTasks = $derived(query.current?.tasks.length || 0);
    let completedTasks = $derived(tasks.filter(t => t.completed).length);
    let progressPercentage = $derived(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
    function refresh(){
		query.refresh();
	} 
</script>


<Header {tasks} {totalTasks} {completedTasks} {progressPercentage} />
<TaskList {tasks} onUpdate={refresh} />