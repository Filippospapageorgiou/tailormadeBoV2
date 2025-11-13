<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	interface Props {
		employee: Profile;
		isSelected?: boolean;
		onClick?: () => void;
	}

	const { employee, isSelected = false, onClick }: Props = $props();

	const badgeColor = employee.badge_color || '#3b82f6';

	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	const initials = getInitials(employee.username);
</script>

<button
	type="button"
	onclick={onClick}
	class="group flex w-full items-center gap-3 border-r border-border/50 px-4 py-3 transition-all duration-200 hover:bg-muted/30"
	style="border-left: 4px solid {badgeColor};"
	aria-pressed={isSelected}
	aria-label={`Select ${employee.username}`}
>
	<!-- Avatar -->
	<Avatar.Root class="h-10 w-10 flex-shrink-0" style="border: 2px solid {badgeColor};">
		<Avatar.Image src={employee.image_url} alt={employee.username} />
		<Avatar.Fallback class="text-xs font-bold text-white" style="background-color: {badgeColor};">
			{initials}
		</Avatar.Fallback>
	</Avatar.Root>

	<!-- Employee Info -->
	<div class="flex-1 text-left">
		<p class="text-sm leading-tight font-semibold">{employee.username}</p>
		<p class="text-xs text-muted-foreground">{employee.email.split('@')[0]}</p>
	</div>

	<!-- Selection Indicator -->
	{#if isSelected}
		<div
			class="h-2 w-2 rounded-full"
			style="background-color: {badgeColor};"
			aria-hidden="true"
		></div>
	{/if}
</button>
