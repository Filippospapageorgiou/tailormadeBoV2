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
			sick_leave: 'Άρρωστος',
			vacation: 'Άδεια'
		};
		return labels[type] || type;
	}

	let isWorkShift = $derived(shift?.shift_type === SHIFT_TYPE.WORK);
	let timeRange = $derived(
		shift && isWorkShift ? `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}` : null
	);

	function getShiftGradient(type: string): string {
		const gradients: Record<string, string> = {
			work: `linear-gradient(135deg, ${badgeColor}20 0%, ${badgeColor}10 100%)`,
			day_off: 'linear-gradient(135deg, ${badgeColor}20 0%, ${badgeColor}10 100%)',
			sick_leave: 'linear-gradient(135deg, ${badgeColor}20 0%, ${badgeColor}10 100%)',
			vacation: 'linear-gradient(135deg, ${badgeColor}20 0%, ${badgeColor}10 100%)'
		};
		return gradients[type] || gradients.work;
	}

	function getShiftBorderColor(type: string): string {
		const colors: Record<string, string> = {
			work: `${badgeColor}40`,
			day_off: 'rgba(16, 185, 129, 0.3)',
			sick_leave: 'rgba(239, 68, 68, 0.3)',
			vacation: 'rgba(245, 158, 11, 0.3)'
		};
		return colors[type] || colors.work;
	}
</script>

{#if shift}
	<!-- Shift exists - Show shift info with actions -->
	<div
		class="group relative h-full min-h-[56px] animate-in duration-300 fade-in slide-in-from-left-2"
	>
		<div
			class="group flex h-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
			style="
				background: {getShiftGradient(shift.shift_type)};
				border-color: {getShiftBorderColor(shift.shift_type)};
				border-left: 3px solid {badgeColor};
			"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-0.5">
				{#if isWorkShift && timeRange}
					<span class="truncate text-xs font-semibold">
						{timeRange}
					</span>
				{:else}
					<span class="text-sm font-semibold whitespace-nowrap" style="color: {badgeColor};">
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
						class="h-6 w-6 flex-shrink-0 text-black opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white/20 hover:text-black"
					>
						<MoreVertical class="h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-32">
					<DropdownMenu.Item
						onclick={onEdit}
						class="cursor-pointer gap-2 transition-all duration-200 hover:bg-white/10"
					>
						<Pencil class="h-4 w-4" />
						<span>Edit</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						onclick={onDelete}
						class="cursor-pointer gap-2 text-destructive transition-all duration-200 hover:bg-destructive/20 focus:bg-destructive/20"
					>
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
		class="group flex h-full min-h-[56px] w-full animate-in items-center justify-center rounded-xl border-2 border-dashed border-white/15 transition-all duration-300 fade-in hover:border-blue-500/50 hover:bg-blue-500/10"
		aria-label="Add shift"
	>
		<Plus class="h-5 w-5 text-blue-400" />
	</button>
{/if}

<style>
	:global(.group:hover .shift-content) {
		transform: translateY(-2px);
	}
</style>
