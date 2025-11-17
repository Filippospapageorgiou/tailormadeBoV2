<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-svelte';

	interface Props {
		shift: Shift | null;
		badgeColor: string;
		onAdd: () => void;
		onEdit: () => void;
		onDelete: () => void;
	}

	let { shift, badgeColor, onAdd, onEdit, onDelete }: Props = $props();

	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	function getShiftTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			work: 'Εργασία',
			day_off: 'Ρεπό',
			sick_leave: 'Άδεια',
			vacation: 'Διακοπές'
		};
		return labels[type] || type;
	}

	let isWorkShift = $derived(shift?.shift_type === SHIFT_TYPE.WORK);
	let timeRange = $derived(
		shift && isWorkShift ? `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}` : null
	);
</script>

{#if shift}
	<!-- Shift exists - Show shift info with actions -->
	<div class="group relative h-full min-h-[48px]">
		<div
			class="flex h-full items-center justify-between gap-2 rounded-lg bg-background/40 p-3 transition-all hover:border-border hover:shadow-sm"
			style="border-left: 4px solid {badgeColor};"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-0.5">
				{#if isWorkShift && timeRange}
					<span class="text-xs font-medium">
						{timeRange}
					</span>
				{:else}
					<span class="text-sm font-semibold" style="color: {badgeColor};">
						{getShiftTypeLabel(shift.shift_type)}
					</span>
				{/if}
			</div>

			<!-- Actions Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button
						variant="ghost"
						size="icon"
						class="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<MoreVertical class="h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Item onclick={onEdit} class="cursor-pointer gap-2">
						<Pencil class="h-4 w-4" />
						<span>Edit</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={onDelete} class="cursor-pointer gap-2 text-destructive">
						<Trash2 class="h-4 w-4" />
						<span>Delete</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
{:else}
	<!-- No shift - Show simple add button -->
	<button
		type="button"
		onclick={onAdd}
		class="flex h-full min-h-[48px] w-full items-center justify-center rounded-lg border-2 border-dashed border-border/50 transition-all hover:border-primary/50 hover:bg-primary/5"
		aria-label="Add shift"
	>
		<Plus class="h-5 w-5 text-muted-foreground" />
	</button>
{/if}
