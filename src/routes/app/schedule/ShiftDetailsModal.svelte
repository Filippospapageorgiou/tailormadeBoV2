<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Briefcase, Clock, Coffee, StickyNote, Flag, Loader } from 'lucide-svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	interface Props {
		open: boolean;
		selectedShiftData: any;
		loadingShiftDetails: boolean;
		isSameUser: boolean;
		onClose: () => void;
		onOpenRequest: () => void;
	}

	const {
		open,
		selectedShiftData,
		loadingShiftDetails,
		isSameUser,
		onClose,
		onOpenRequest
	}: Props = $props();

	function formatGreekDate(dateString: string): string {
		const date = new Date(dateString);
		const dayOfWeek = (date.getDay() + 6) % 7;
		const fullGreekDayNames = [
			'Δευτέρα',
			'Τρίτη',
			'Τετάρτη',
			'Πέμπτη',
			'Παρασκευή',
			'Σάββατο',
			'Κυριακή'
		];
		const dayName = fullGreekDayNames[dayOfWeek];
		const day = date.getDate();
		const monthNames = [
			'Ιανουαρίου',
			'Φεβρουαρίου',
			'Μαρτίου',
			'Απριλίου',
			'Μαΐου',
			'Ιουνίου',
			'Ιουλίου',
			'Αυγούστου',
			'Σεπτεμβρίου',
			'Οκτωβρίου',
			'Νοεμβρίου',
			'Δεκεμβρίου'
		];
		const month = monthNames[date.getMonth()];

		return `${dayName}, ${day} ${month}`;
	}

	function getShiftTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			work: 'Εργασία',
			day_off: 'Ρεπό',
			sick_leave: 'Άδεια Ασθενείας',
			vacation: 'Διακοπές'
		};
		return labels[type] || type;
	}

	function getShiftCategoryLabel(category: string | null): string {
		if (!category) return '';
		const labels: Record<string, string> = {
			morning: 'Πρωινή',
			afternoon: 'Απογευματινή',
			night: 'Νυχτερινή',
			full_day: 'Ολοήμερη'
		};
		return labels[category] || category;
	}

	function calculateShiftDuration(
		startTime: string | null,
		endTime: string | null,
		breakMinutes: number | null
	): string {
		if (!startTime || !endTime) return 'N/A';

		const [startHour, startMin] = startTime.split(':').map(Number);
		const [endHour, endMin] = endTime.split(':').map(Number);

		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;

		const totalMinutes = endMinutes - startMinutes;
		const netMinutes = totalMinutes - (breakMinutes || 0);

		const hours = Math.floor(netMinutes / 60);
		const minutes = netMinutes % 60;

		return `${hours}ω ${minutes > 0 ? `${minutes}λ` : ''}`;
	}

	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		{#if loadingShiftDetails}
			<div class="flex flex-col items-center justify-center py-12">
				<Spinner class="size-6" />
				<p class="mt-4 text-sm text-muted-foreground">Φόρτωση στοιχείων βάρδιας...</p>
			</div>
		{:else if selectedShiftData}
			{@const employee = selectedShiftData.profiles}
			{@const badgeColor = employee?.badge_color || '#3b82f6'}
			{@const initials = getInitials(employee?.username || '')}

			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-3 text-2xl">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg"
						style="background-color: {badgeColor}22;"
					>
						<Briefcase class="h-5 w-5" style="color: {badgeColor};" />
					</div>
					Λεπτομέρειες Βάρδιας
				</Dialog.Title>
				<Dialog.Description class="text-muted-foreground">
					{formatGreekDate(selectedShiftData.shift_date)}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-6 py-6">
				<!-- Employee Info Card -->
				<div class="rounded-lg border border-border/50 bg-background/40 p-6 backdrop-blur-sm">
					<div class="flex items-center gap-4">
						<Avatar.Root class="h-16 w-16 shadow-md" style="border: 3px solid {badgeColor};">
							<Avatar.Image src={employee?.image_url} alt={employee?.username} />
							<Avatar.Fallback
								class="text-xl font-bold text-white"
								style="background-color: {badgeColor};"
							>
								{initials}
							</Avatar.Fallback>
						</Avatar.Root>

						<div class="flex-1">
							<h3 class="text-lg font-semibold">{employee?.username}</h3>
							<p class="text-sm text-muted-foreground">{employee?.email}</p>
							<Badge
								class="mt-2 text-xs"
								style="background-color: {badgeColor}; color: white; border: none;"
							>
								{employee?.role_name || 'Employee'}
							</Badge>
						</div>
					</div>
				</div>

				<!-- Shift Details Grid -->
				<div class="grid gap-4 md:grid-cols-2">
					<!-- Shift Type -->
					<div class="rounded-lg border border-border/50 bg-background/40 p-4 backdrop-blur-sm">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
								style="background-color: {badgeColor}22;"
							>
								<Briefcase class="h-5 w-5" style="color: {badgeColor};" />
							</div>
							<div class="flex-1">
								<p class="text-sm text-muted-foreground">Τύπος Βάρδιας</p>
								<p class="mt-1 font-semibold">{getShiftTypeLabel(selectedShiftData.shift_type)}</p>
								{#if selectedShiftData.shift_category}
									<Badge variant="outline" class="mt-2 text-xs">
										{getShiftCategoryLabel(selectedShiftData.shift_category)}
									</Badge>
								{/if}
							</div>
						</div>
					</div>

					<!-- Time Range -->
					{#if selectedShiftData.shift_type === 'work' && selectedShiftData.start_time && selectedShiftData.end_time}
						<div class="rounded-lg border border-border/50 bg-background/40 p-4 backdrop-blur-sm">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10"
								>
									<Clock class="h-5 w-5 text-blue-600" />
								</div>
								<div class="flex-1">
									<p class="text-sm text-muted-foreground">Ώρες Εργασίας</p>
									<p class="mt-1 text-lg font-semibold">
										{formatTime(selectedShiftData.start_time)} - {formatTime(
											selectedShiftData.end_time
										)}
									</p>
								</div>
							</div>
						</div>

						<!-- Break Duration -->
						{#if selectedShiftData.break_duration_minutes}
							<div class="rounded-lg border border-border/50 bg-background/40 p-4 backdrop-blur-sm">
								<div class="flex items-start gap-3">
									<div
										class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10"
									>
										<Coffee class="h-5 w-5 text-amber-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm text-muted-foreground">Διάλειμμα</p>
										<p class="mt-1 font-semibold">
											{selectedShiftData.break_duration_minutes} λεπτά
										</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- Total Duration -->
						<div class="rounded-lg border border-border/50 bg-background/40 p-4 backdrop-blur-sm">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10"
								>
									<Clock class="h-5 w-5 text-green-600" />
								</div>
								<div class="flex-1">
									<p class="text-sm text-muted-foreground">Καθαρές Ώρες</p>
									<p class="mt-1 text-lg font-semibold">
										{calculateShiftDuration(
											selectedShiftData.start_time,
											selectedShiftData.end_time,
											selectedShiftData.break_duration_minutes
										)}
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Notes Section -->
				{#if selectedShiftData.notes}
					<div class="rounded-lg border border-border/50 bg-background/40 p-4 backdrop-blur-sm">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10"
							>
								<StickyNote class="h-5 w-5 text-purple-600" />
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-muted-foreground">Σημειώσεις</p>
								<p class="mt-2 text-sm leading-relaxed">{selectedShiftData.notes}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Metadata -->
				<div class="rounded-lg border border-border/50 bg-muted/20 p-4 backdrop-blur-sm">
					<div class="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
						<div>
							<span class="font-medium">Δημιουργήθηκε:</span>
							<span class="ml-2">
								{new Date(selectedShiftData.created_at).toLocaleDateString('el-GR', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
						<div>
							<span class="font-medium">Τελευταία ενημέρωση:</span>
							<span class="ml-2">
								{new Date(selectedShiftData.updated_at).toLocaleDateString('el-GR', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					</div>
				</div>
			</div>

			<Dialog.Footer>
				{#if isSameUser}
					<Button
						variant="default"
						onclick={onOpenRequest}
						class="w-full gap-2 bg-amber-600 hover:bg-amber-700 md:w-auto"
					>
						<Flag class="h-4 w-4" />
						Αίτημα Αλλαγής
					</Button>
				{/if}
				<Button variant="outline" onclick={onClose} class="w-full md:w-auto">Κλείσιμο</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
