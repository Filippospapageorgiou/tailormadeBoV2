<script lang="ts">
	import { UseUserStatus } from '$lib/stores/user_presence.svelte';

	let {
		userId,
		size = 'sm'
	}: {
		userId: string;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const userStatus = $derived(new UseUserStatus(userId));

	const sizeClasses = {
		sm: 'h-2.5 w-2.5',
		md: 'h-3 w-3',
		lg: 'h-3.5 w-3.5'
	} as const;

	const colorClasses = {
		active: 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]',
		idle: 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]',
		offline: 'bg-muted-foreground'
	} as const;
</script>

<span
	class="inline-block rounded-full border-2 border-background {sizeClasses[size]} {colorClasses[
		userStatus.current
	]}"
	title={userStatus.current === 'active'
		? 'Ενεργός'
		: userStatus.current === 'idle'
			? 'Αδρανής'
			: 'Εκτός σύνδεσης'}
></span>
