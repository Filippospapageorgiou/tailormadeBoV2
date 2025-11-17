<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Calendar, Pencil, Trash2, Users, Clock, Briefcase, Eye } from 'lucide-svelte';
	import type { WeeklySchedule } from '$lib/models/schedule.types';
	import { SCHEDULE_STATUS } from '$lib/models/schedule.types';

	interface Props {
		schedule: WeeklySchedule;
		onEdit: (scheduleId: number) => void;
		onDelete: (schedule: any) => void;
		onPreview: (scheduleId: number) => void;
		onStatusChange: (scheduleId: number, status: string) => void;
	}

	let { schedule, onEdit, onDelete, onPreview, onStatusChange }: Props = $props();

	let isChangingStatus = $state(false);

	// Get status badge variant and label
	function getStatusBadge(status: string) {
		switch (status) {
			case SCHEDULE_STATUS.DRAFT:
				return {
					variant: 'secondary' as const,
					label: 'Draft',
					class: 'bg-yellow-100 text-yellow-800'
				};
			case SCHEDULE_STATUS.PUBLISHED:
				return {
					variant: 'default' as const,
					label: 'Published',
					class: 'bg-green-100 text-green-800'
				};
			case SCHEDULE_STATUS.ARCHIVED:
				return {
					variant: 'outline' as const,
					label: 'Archived',
					class: 'bg-gray-100 text-gray-800'
				};
			default:
				return { variant: 'secondary' as const, label: status, class: '' };
		}
	}

	// Format date for display
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	let statusBadge = $derived(getStatusBadge(schedule.status));

	// Status options for dropdown
	const statusOptions = [
		{ value: SCHEDULE_STATUS.DRAFT, label: 'Draft' },
		{ value: SCHEDULE_STATUS.PUBLISHED, label: 'Published' },
		{ value: SCHEDULE_STATUS.ARCHIVED, label: 'Archived' }
	];

	async function handleStatusChange(newStatus: string) {
		if (newStatus === schedule.status) return;
		isChangingStatus = true;
		await onStatusChange(schedule.id, newStatus);
		isChangingStatus = false;
	}
</script>

<Card.Card
	class="group rounded-0 relative border border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
>
	<div
		class="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-primary/50 transition-all duration-300 group-hover:w-full"
	></div>

	<Card.CardHeader>
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="mb-1 flex items-center gap-2">
					<Calendar class="h-5 w-5 text-primary/70" />
					<Card.CardTitle class="text-lg">
						Week of {formatDate(schedule.week_start_date)}
					</Card.CardTitle>
				</div>
				<Card.CardDescription>
					{formatDate(schedule.week_start_date)} - {formatDate(schedule.week_end_date)}
				</Card.CardDescription>
			</div>

			<!-- Status Badge with Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="sm" class="h-auto p-0">
						<Badge
							class={`${statusBadge.class} cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md`}
						>
							{statusBadge.label}
							<svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								></path>
							</svg>
						</Badge>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Label>Change Status</DropdownMenu.Label>
					<DropdownMenu.Separator />
					{#each statusOptions as option}
						<DropdownMenu.Item
							onclick={() => handleStatusChange(option.value)}
							disabled={isChangingStatus || option.value === schedule.status}
							class="cursor-pointer"
						>
							{option.label}
							{#if option.value === schedule.status}
								<span class="ml-auto text-xs text-muted-foreground">(current)</span>
							{/if}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</Card.CardHeader>

	<Card.CardContent class="space-y-4">
		<!-- Action Buttons - Gold Edit & White Delete with Red Hover -->
		<div class="grid grid-cols-2 gap-2 pt-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => onEdit(schedule.id)}
				class="group/btn border-primary/20 text-primary/80 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary/100 hover:shadow-sm"
			>
				<Pencil class="mr-2 h-4 w-4 transition-transform group-hover/btn:scale-105" />
				Edit
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => onDelete(schedule)}
				class="group/btn border-border text-foreground transition-all duration-200 hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive hover:shadow-sm"
			>
				<Trash2 class="h-4 w-4 transition-transform group-hover/btn:scale-105" />
			</Button>
		</div>
	</Card.CardContent>

	<div
		class="pointer-events-none absolute right-0 bottom-0 -m-16 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
	></div>
</Card.Card>
