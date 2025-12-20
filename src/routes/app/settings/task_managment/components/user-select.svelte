<script lang="ts">
	type User = {
		id: string;
		name: string;
		email: string;
		role: string;
		avatar: string;
	};

	let { users, value = $bindable() }: { users: User[]; value: string } = $props();
</script>

<!-- This component can be enhanced with a custom select if needed -->
<select bind:value class="w-full rounded-md border border-border bg-background px-3 py-2">
	<option value="">Select user...</option>
	{#each users as user (user.id)}
		<option value={user.id}>{user.name}</option>
	{/each}
</select>
