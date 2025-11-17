<script lang="ts">
	import type { ShiftChangeRequestPorfile } from '$lib/models/schedule.types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Avatar from '$lib/components/ui/avatar';
	import { approveShiftRequest, rejectShift } from '../data.remote';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import {
		Clock,
		Calendar,
		ArrowRight,
		Check,
		X,
		MessageCircle,
		Repeat,
		Users,
		XCircle,
		AlertCircle
	} from 'lucide-svelte';

	interface Props {
		onSuccess: () => Promise<void>;
		shiftRequests: ShiftChangeRequestPorfile[];
	}

	let { shiftRequests, onSuccess }: Props = $props();

	let expandedRejectId = $state<number | null>(null);
	let rejectionReasons = $state<Map<number, string>>(new Map());

	function toggleReject(requestId: number) {
		expandedRejectId = expandedRejectId === requestId ? null : requestId;
		if (!rejectionReasons.has(requestId)) rejectionReasons.set(requestId, '');
	}

	function handleReasonChange(requestId: number, value: string) {
		rejectionReasons.set(requestId, value);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('el-GR', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTime(timeString: string | null): string {
		if (!timeString) return '-';
		const [hours, minutes] = timeString.split(':');
		return `${hours}:${minutes}`;
	}

	function getInitials(name: string): string {
		const parts = name.split('_');
		return parts.length >= 2
			? (parts[0][0] + parts[1][0]).toUpperCase()
			: name.substring(0, 2).toUpperCase();
	}

	function getRequestTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			change: 'Αλλαγή Ωρών',
			swap: 'Ανταλλαγή',
			cancel: 'Ακύρωση'
		};
		return labels[type] || type;
	}

	function getRequestTypeIcon(type: string) {
		const icons: Record<string, any> = {
			change: Clock,
			swap: Repeat,
			cancel: XCircle
		};
		return icons[type] || AlertCircle;
	}

	function getRequestTypeBgColor(type: string): string {
		const colors: Record<string, string> = {
			change: 'bg-blue-500/10 text-blue-700 border-blue-200',
			swap: 'bg-purple-500/10 text-purple-700 border-purple-200',
			cancel: 'bg-red-500/10 text-red-700 border-red-200'
		};
		return colors[type] || 'bg-gray-500/10 text-gray-700 border-gray-200';
	}
	let returnMessage: string = $state('');
	async function handleApprove(id: number) {
		if (!id) return;

		showProgress('Approving request...');

		try {
			const result = await approveShiftRequest({ shiftChangeId: id });
			returnMessage = result.message;
			if (result.success) {
				await onSuccess();
				showSuccessToast('Success', returnMessage);
			} else {
				showFailToast('Error', returnMessage);
			}
		} catch (error) {
			console.error('Error approving request:', error);
			showFailToast('Error', returnMessage);
		} finally {
			hideProgress();
		}
	}

	async function handleReject(id: number) {
		const reason = rejectionReasons.get(id);

		if (!reason?.trim()) {
			showFailToast('Error', 'Παρακαλώ προσθέστε αιτιολογία απόρριψης');
			return;
		}

		showProgress('Rejecting request...');

		try {
			const result = await rejectShift({
				shiftChangeId: id,
				adminText: reason
			});

			if (result.success) {
				await onSuccess();
				showSuccessToast('Success', result.message);
				expandedRejectId = null;
				rejectionReasons.delete(id);
			} else {
				showFailToast('Error', result.message);
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
			showFailToast('Error', 'An unexpected error occurred');
		} finally {
			hideProgress();
		}
	}
</script>

<div class="space-y-5">
	{#if shiftRequests.length === 0}
		<div class="rounded-xl border-2 border-dashed p-12 text-center">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
				<Calendar class="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-base font-semibold">Δεν υπάρχουν εκκρεμή αιτήματα</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Όλα τα αιτήματα αλλαγής βάρδιας έχουν αξιολογηθεί.
			</p>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<h3 class="text-xl font-bold tracking-tight">Αιτήματα Βαρδιών</h3>
			<Badge variant="secondary" class="px-3 py-1 text-sm font-semibold">
				{shiftRequests.length} Εκκρεμή
			</Badge>
		</div>

		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each shiftRequests as request (request.id)}
				{@const isExpanded = expandedRejectId === request.id}
				{@const profile = request.profile}
				{@const initials = getInitials(profile?.username || 'NA')}
				{@const badgeColor = profile?.badge_color || '#6366f1'}
				{@const RequestIcon = getRequestTypeIcon(request.request_type)}
				{@const isChangeRequest = request.request_type === 'change'}
				{@const shift = request.shift}
				<div
					class="group relative overflow-hidden rounded-2xl bg-card shadow-sm transition-all hover:shadow-lg"
					style="border-color: {badgeColor}20;"
				>
					<!-- Decorative gradient bar at top -->
					<div
						class="h-2 w-full"
						style="background: linear-gradient(90deg, {badgeColor}, {badgeColor}80);"
					></div>

					<div class="space-y-4 p-5">
						<!-- Header: User Info + Request Type -->
						<div class="flex items-start justify-between gap-3">
							<div class="flex min-w-0 flex-1 items-center gap-3">
								<Avatar.Root
									class="h-12 w-12 shadow-md ring-2 ring-offset-2"
									style="ring-color: {badgeColor};"
								>
									<Avatar.Image src={profile?.image_url} alt={profile?.username} />
									<Avatar.Fallback
										class="text-sm font-bold text-white"
										style="background-color: {badgeColor};"
									>
										{initials}
									</Avatar.Fallback>
								</Avatar.Root>

								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold">{profile?.username}</p>
									<p class="text-xs text-muted-foreground">
										{new Date(request.created_at).toLocaleDateString('el-GR', {
											month: 'short',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
							</div>

							<Badge class="shrink-0 border {getRequestTypeBgColor(request.request_type)}">
								<RequestIcon class="mr-1 h-3 w-3" />
								{getRequestTypeLabel(request.request_type)}
							</Badge>
						</div>

						<!-- Request Details Grid -->
						<div class="space-y-3">
							{#if isChangeRequest}
								<!-- Date Change Comparison -->
								{#if shift?.shift_date || request.proposed_date}
									<div class="rounded-lg bg-gradient-to-r from-muted/30 to-muted/50 p-3">
										<div class="mb-2 flex items-center gap-2">
											<Calendar class="h-3.5 w-3.5" style="color: {badgeColor};" />
											<p class="text-xs font-medium text-muted-foreground">Ημερομηνία</p>
										</div>
										<div class="flex items-center gap-2">
											<div class="min-w-0 flex-1">
												<p class="mb-0.5 text-xs text-muted-foreground">Παλιά</p>
												<p class="text-sm font-medium text-muted-foreground line-through">
													{shift?.shift_date ? formatDate(shift.shift_date) : '-'}
												</p>
											</div>
											<ArrowRight class="h-4 w-4 shrink-0" style="color: {badgeColor};" />
											<div class="min-w-0 flex-1">
												<p class="mb-0.5 text-xs text-muted-foreground">Νέα</p>
												<p class="text-sm font-semibold" style="color: {badgeColor};">
													{request.proposed_date ? formatDate(request.proposed_date) : '-'}
												</p>
											</div>
										</div>
									</div>
								{/if}

								<!-- Time Change Comparison -->
								{#if (shift?.start_time && shift?.end_time) || (request.proposed_start_time && request.proposed_end_time)}
									<div class="rounded-lg bg-gradient-to-r from-muted/30 to-muted/50 p-3">
										<div class="mb-2 flex items-center gap-2">
											<Clock class="h-3.5 w-3.5" style="color: {badgeColor};" />
											<p class="text-xs font-medium text-muted-foreground">Ώρες Βάρδιας</p>
										</div>
										<div class="flex items-center gap-2">
											<div class="min-w-0 flex-1">
												<p class="mb-0.5 text-xs text-muted-foreground">Παλιά</p>
												<p class="text-sm font-medium text-muted-foreground line-through">
													{shift?.start_time && shift?.end_time
														? `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`
														: '-'}
												</p>
											</div>
											<ArrowRight class="h-4 w-4 shrink-0" style="color: {badgeColor};" />
											<div class="min-w-0 flex-1">
												<p class="mb-0.5 text-xs text-muted-foreground">Νέα</p>
												<p class="text-sm font-semibold" style="color: {badgeColor};">
													{request.proposed_start_time && request.proposed_end_time
														? `${formatTime(request.proposed_start_time)} - ${formatTime(request.proposed_end_time)}`
														: '-'}
												</p>
											</div>
										</div>
									</div>
								{/if}
							{:else}
								<div class="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
									<Calendar class="h-4 w-4 shrink-0" style="color: {badgeColor};" />
									<div class="flex-1">
										<p class="text-xs text-muted-foreground">Παλιά Ημερομηνία</p>
										<p class="text-sm font-medium">{formatDate(shift.shift_date)}</p>
									</div>
								</div>
								<!-- For swap/cancel requests, show standard info -->
								{#if request.proposed_date}
									<div class="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
										<Calendar class="h-4 w-4 shrink-0" style="color: {badgeColor};" />
										<div class="flex-1">
											<p class="text-xs text-muted-foreground">Ημερομηνία</p>
											<p class="text-sm font-medium">{formatDate(request.proposed_date)}</p>
										</div>
									</div>
								{/if}

								{#if request.proposed_start_time && request.proposed_end_time}
									<div class="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
										<Clock class="h-4 w-4 shrink-0" style="color: {badgeColor};" />
										<div class="flex-1">
											<p class="text-xs text-muted-foreground">Ώρες</p>
											<p class="text-sm font-medium">
												{formatTime(request.proposed_start_time)} - {formatTime(
													request.proposed_end_time
												)}
											</p>
										</div>
									</div>
								{/if}
							{/if}

							<!-- Reason -->
							{#if request.reason}
								<div class="rounded-lg bg-card px-3 py-2.5">
									<div class="flex items-start gap-2">
										<MessageCircle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										<div class="min-w-0 flex-1">
											<p class="mb-1 text-xs font-medium text-muted-foreground">Αιτιολογία</p>
											<p class="line-clamp-3 text-sm leading-relaxed">{request.reason}</p>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Action Buttons -->
						{#if !isExpanded}
							<div class="flex gap-2 pt-2">
								<Button
									onclick={() => handleApprove(request.id)}
									size="sm"
									class="flex-1 cursor-pointer gap-1.5 font-semibold"
									style="background-color: {badgeColor}; hover:opacity-90;"
								>
									<Check class="h-4 w-4" />
									Έγκριση
								</Button>
								<Button
									onclick={() => toggleReject(request.id)}
									variant="outline"
									size="sm"
									class="flex-1 cursor-pointer gap-1.5 font-semibold hover:bg-destructive hover:text-destructive-foreground"
								>
									<X class="h-4 w-4" />
									Απόρριψη
								</Button>
							</div>
						{/if}

						<!-- Rejection Section -->
						{#if isExpanded}
							<div class="space-y-3 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4">
								<div class="flex items-center gap-2 text-destructive">
									<AlertCircle class="h-4 w-4" />
									<p class="text-sm font-semibold">Αιτιολογία Απόρριψης</p>
								</div>
								<Textarea
									placeholder="Εξηγήστε γιατί απορρίπτετε το αίτημα..."
									value={rejectionReasons.get(request.id) || ''}
									oninput={(e) => handleReasonChange(request.id, e.currentTarget.value)}
									class="min-h-[80px] resize-none text-sm"
								/>
								<div class="flex gap-2">
									<Button
										onclick={() => handleReject(request.id)}
										variant="destructive"
										size="sm"
										class="flex-1 cursor-pointer gap-1.5 font-semibold"
									>
										<Check class="h-4 w-4" />
										Επιβεβαίωση
									</Button>
									<Button
										onclick={() => toggleReject(request.id)}
										variant="outline"
										size="sm"
										class="flex-1 cursor-pointer gap-1.5 font-semibold"
									>
										<X class="h-4 w-4" />
										Ακύρωση
									</Button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
