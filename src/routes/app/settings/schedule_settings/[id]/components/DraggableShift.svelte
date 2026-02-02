<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { MoreVertical, Pencil, Trash2, Coffee, Thermometer, Palmtree, GripVertical } from 'lucide-svelte';
	import { useDraggable } from '@dnd-kit-svelte/svelte';

	interface Props {
		shift: Shift;
		badgeColor: string;
		onEdit: () => void;
		onDelete: () => void;
		isOverlay?: boolean;
	}

	let { shift, badgeColor, onEdit, onDelete, isOverlay = false }: Props = $props();

	const { ref, isDragging } = useDraggable({
		// svelte-ignore state_referenced_locally
		id: `shift-${shift.id}`,
		// svelte-ignore state_referenced_locally
		data: { shift, badgeColor },
		type: 'shift'
	});

	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	function getShiftTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			work: 'Εργασία',
			day_off: 'Ρεπό',
			sick_leave: 'Ασθένεια',
			vacation: 'Άδεια'
		};
		return labels[type] || type;
	}

	let isWorkShift = $derived(shift.shift_type === SHIFT_TYPE.WORK);
	let timeRange = $derived(
		isWorkShift ? `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}` : null
	);

	function getShiftTypeConfig(type: string): { bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string } {
		const configs: Record<string, { bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string }> = {
			work: {
				bg: 'bg-zinc-50',
				border: 'border-zinc-200',
				text: 'text-zinc-900',
				darkBg: 'dark:bg-zinc-800',
				darkBorder: 'dark:border-zinc-700',
				darkText: 'dark:text-zinc-100'
			},
			day_off: {
				bg: 'bg-emerald-50',
				border: 'border-emerald-200',
				text: 'text-emerald-700',
				darkBg: 'dark:bg-emerald-950',
				darkBorder: 'dark:border-emerald-800',
				darkText: 'dark:text-emerald-300'
			},
			sick_leave: {
				bg: 'bg-red-50',
				border: 'border-red-200',
				text: 'text-red-700',
				darkBg: 'dark:bg-red-950',
				darkBorder: 'dark:border-red-800',
				darkText: 'dark:text-red-300'
			},
			vacation: {
				bg: 'bg-amber-50',
				border: 'border-amber-200',
				text: 'text-amber-700',
				darkBg: 'dark:bg-amber-950',
				darkBorder: 'dark:border-amber-800',
				darkText: 'dark:text-amber-300'
			}
		};
		return configs[type] || configs.work;
	}

	const config = $derived(getShiftTypeConfig(shift.shift_type));
</script>

<div
	class="group relative h-full min-h-[48px]"
	class:invisible={isDragging.current && !isOverlay}
	{@attach ref}
>
	{#if isDragging.current && !isOverlay}
		<!-- Placeholder while dragging -->
		<div class="flex h-full min-h-[48px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600">
			<span class="text-xs text-zinc-400 dark:text-zinc-500">Moving...</span>
		</div>
	{:else}
		<div
			class="flex h-full cursor-grab items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-all duration-150 active:cursor-grabbing
				{config.bg} {config.border} {config.darkBg} {config.darkBorder}
				hover:shadow-sm dark:hover:shadow-none
				{isOverlay ? 'shadow-lg ring-2 ring-blue-500/50' : ''}"
			style="border-left: 3px solid {badgeColor};"
		>
			<!-- Drag handle indicator -->
			<GripVertical class="h-3.5 w-3.5 flex-shrink-0 text-zinc-300 dark:text-zinc-600" />

			<div class="flex min-w-0 flex-1 flex-col">
				{#if isWorkShift && timeRange}
					<span class="truncate text-sm font-semibold tabular-nums tracking-tight {config.text} {config.darkText}">
						{timeRange}
					</span>
				{:else}
					<div class="flex items-center gap-1.5">
						{#if shift.shift_type === 'day_off'}
							<Coffee class="h-3.5 w-3.5 flex-shrink-0 {config.text} {config.darkText}" />
						{:else if shift.shift_type === 'sick_leave'}
							<Thermometer class="h-3.5 w-3.5 flex-shrink-0 {config.text} {config.darkText}" />
						{:else if shift.shift_type === 'vacation'}
							<Palmtree class="h-3.5 w-3.5 flex-shrink-0 {config.text} {config.darkText}" />
						{/if}
						<span class="text-xs font-medium whitespace-nowrap {config.text} {config.darkText}">
							{getShiftTypeLabel(shift.shift_type)}
						</span>
					</div>
				{/if}
			</div>

			<!-- Actions Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button
						variant="ghost"
						size="icon"
						class="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100
							text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100
							dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-700"
					>
						<MoreVertical class="h-3.5 w-3.5" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-32">
					<DropdownMenu.Item
						onclick={onEdit}
						class="cursor-pointer gap-2"
					>
						<Pencil class="h-4 w-4" />
						<span>Edit</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						onclick={onDelete}
						class="cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
					>
						<Trash2 class="h-4 w-4" />
						<span>Delete</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/if}
</div>
