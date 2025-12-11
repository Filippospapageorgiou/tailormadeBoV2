<script lang="ts">
	import type { EquipmentWithLogs } from '$lib/models/equipment.types';
	import { Button } from '$lib/components/ui/button';
	import {
		Pencil,
		Trash2,
		CheckCircle2,
		XCircle,
		Wrench,
		X,
		AlertCircle,
		Edit2,
		Clock
	} from 'lucide-svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns';
	import type { Equipment, EquipmentStatus } from '$lib/models/equipment.types';
	import * as Modal from '$lib/components/ui/modal';
	import { format } from 'date-fns';
	import { el } from 'date-fns/locale';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { User, Calendar, Banknote, ImageIcon, ArrowRight, AlertTriangle } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { deleteMaintanceLog } from '../data.remote';
	import { toast } from 'svelte-sonner';

	let previewImage: string | null = $state(null);
	let { equipment }: { equipment: EquipmentWithLogs } = $props();

	// Add this helper for initials
	const getInitials = (name: string) => {
		return (
			name
				?.split(' ')
				.map((n) => n[0])
				.slice(0, 2)
				.join('')
				.toUpperCase() || '??'
		);
	};

	// Sort logs by newest first for the timeline
	let sortedLogs = $derived(
		[...equipment.maintenance_logs].sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		)
	);

	let modalOpen = $state(false);

	// Derived state for service calculations
	let daysUntilService = $derived(
		equipment.next_service_date
			? differenceInDays(parseISO(equipment.next_service_date), new Date())
			: null
	);

	let serviceStatus = $derived.by(() => {
		if (daysUntilService === null) return 'unknown';
		if (daysUntilService < 0) return 'overdue';
		if (daysUntilService < 14) return 'warning';
		return 'good';
	});

	let statusCustom = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-gray-400' };
		return { count: 9, color: 'bg-emerald-500' };
	});

	const statusColors: Record<EquipmentStatus, string> = {
		operational: 'bg-white/90 text-emerald-800 border-emerald-200 backdrop-blur-sm',
		maintenance: 'bg-white/90 text-orange-800 border-orange-200 backdrop-blur-sm',
		broken: 'bg-white/90 text-red-800 border-red-200 backdrop-blur-sm'
	};

	const statusIcons = {
		operational: CheckCircle2,
		maintenance: Wrench,
		broken: XCircle
	};

	const StatusIcon = statusIcons[equipment.status];

	function handleEdit() {
		console.log('Edit equipment:', equipment.id);
	}

	function handleDelete() {
		console.log('Delete equipment:', equipment.id);
	}

	function openImagePreview(imageUrl: string) {
		modalOpen = false;
		previewImage = imageUrl;
	}

	function closeImagePreview() {
		previewImage = null;
		modalOpen = true;
	}

	let deletingLogId = $state();
</script>

<div
	class="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-[#8B6B4A]/30 hover:shadow-lg"
>
	<!-- Top Bar with Actions and Badge -->
	<div class="absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
		<!-- Edit & Delete Buttons -->
		<div class="flex gap-1">
			<button
				onclick={handleEdit}
				class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/80 text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#8B6B4A]"
				title="Edit equipment"
			>
				<Pencil class="h-3.5 w-3.5" />
			</button>
			<button
				onclick={handleDelete}
				class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/80 text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
				title="Delete equipment"
			>
				<Trash2 class="h-3.5 w-3.5" />
			</button>
		</div>

		<!-- Maintenance Log Badge -->
		{#if equipment.maintenance_logs.length > 0}
			<button
				onclick={() => (modalOpen = true)}
				class={`inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-sm transition-all hover:scale-105`}
				title="View maintenance logs"
			>
				{equipment.maintenance_logs.length} LOGS
				{#if serviceStatus === 'overdue' || serviceStatus === 'warning'}
					<span
						class={`inline-block h-2 w-2 rounded-full ${
							serviceStatus === 'overdue' ? 'animate-pulse bg-red-300' : 'bg-orange-300'
						}`}
					></span>
				{/if}
			</button>
		{/if}
	</div>

	<!-- Hero Image Section -->
	<div class="relative h-40 w-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
		{#if equipment.image_url}
			<img
				src={equipment.image_url}
				alt={equipment.name}
				class="h-full w-full object-cover transition-transform ease-in-out group-hover:animate-scale"
			/>
		{:else}
			<div class="flex h-full items-center justify-center">
				<Wrench class="h-12 w-12 text-gray-400 opacity-30" />
			</div>
		{/if}
	</div>

	<!-- Content Section -->
	<div class="space-y-4 p-4">
		<!-- Equipment Name & ID -->
		<div>
			<h3 class="line-clamp-2 font-serif text-lg font-medium tracking-wide text-gray-900">
				{equipment.name}
			</h3>
			<p class="mt-1 text-xs font-medium tracking-wider text-gray-600 uppercase">
				ID: #{equipment.id.toString().padStart(4, '0')}
			</p>
			{#if equipment.model}
				<p class="truncate text-xs text-gray-500">
					Model: {equipment.model}
				</p>
			{/if}
		</div>

		<!-- Status Badge -->
		<div class="flex items-center gap-2">
			<span
				class={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm ${statusColors[equipment.status]}`}
			>
				<StatusIcon class="h-3 w-3" />
				{statusCustom.find((s) => s.value === equipment.status)?.label || equipment.status}
			</span>
		</div>

		<!-- Service Status Section -->
		{#if equipment.next_service_date}
			<div class="space-y-2 rounded-lg bg-gray-50 p-3">
				<div class="flex items-center justify-between">
					<span
						class="flex items-center gap-1 text-[10px] font-bold tracking-widest text-gray-600 uppercase"
					>
						<Clock class="h-3 w-3" />
						Service Status
					</span>
				</div>

				<!-- Service Bars -->
				<div class="flex items-center gap-2">
					<div class="flex h-3 items-center gap-0.5">
						{#each { length: 9 } as _, i}
							<div
								class={`w-1 rounded-full transition-all duration-500 ${
									i < serviceBars.count ? serviceBars.color : 'bg-gray-200'
								}`}
								style="height: 100%"
							></div>
						{/each}
					</div>

					<p
						class={`text-xs font-medium tracking-wide whitespace-nowrap ${
							serviceStatus === 'overdue'
								? 'text-red-600'
								: serviceStatus === 'warning'
									? 'text-orange-600'
									: serviceStatus === 'unknown'
										? 'text-gray-600'
										: 'text-emerald-600'
						}`}
					>
						{daysUntilService === null
							? 'No date'
							: daysUntilService < 0
								? `OVERDUE ${Math.abs(daysUntilService)}D`
								: `${daysUntilService}D LEFT`}
					</p>
				</div>
			</div>
		{:else}
			<div class="rounded-lg bg-gray-50 p-3">
				<p class="text-xs text-gray-600">No service date scheduled</p>
			</div>
		{/if}
	</div>
</div>

<Modal.Root bind:open={modalOpen}>
	<Modal.Content class="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
		<Modal.Header class="z-20 bg-gray-50/50 px-6 py-4 backdrop-blur-sm">
			<div class="flex items-center gap-3">
				<div class="rounded-full bg-red-100 p-2 text-red-600">
					<Wrench class="h-5 w-5" />
				</div>
				<div>
					<Modal.Title class="font-serif text-xl tracking-wide">Ιστορικό Συντήρησης</Modal.Title>
					<Modal.Description class="mt-1">
						Αρχείο καταγραφής για: <span class="font-semibold text-gray-900">{equipment.name}</span>
					</Modal.Description>
				</div>
			</div>
		</Modal.Header>

		<div class="flex-1 overflow-y-auto bg-white/50 p-6">
			{#if sortedLogs.length === 0}
				<div
					class="flex animate-in flex-col items-center justify-center py-12 text-gray-400 duration-500 fade-in zoom-in"
				>
					<CheckCircle2 class="mb-3 h-12 w-12 opacity-20" />
					<p class="text-sm">Δεν υπάρχουν καταγραφές συντήρησης.</p>
				</div>
			{:else}
				<div
					class="relative space-y-8 before:absolute before:top-2 before:left-5 before:h-full before:w-0.5 before:bg-gray-200 before:content-['']"
				>
					{#each sortedLogs as log, i (log.id)}
						{#if deletingLogId !== log.id}
							<div
								class="relative animate-in pl-12 duration-700 fill-mode-both fade-in slide-in-from-bottom-8"
								style="animation-delay: {i * 100}ms;"
								transition:fade={{ duration: 300 }}
							>
								<div
									class="absolute top-2 left-3 -ml-[5px] h-5 w-5 rounded-full border-4 border-white bg-white shadow-sm ring-1 ring-gray-200"
								>
									<div class="h-full w-full rounded-full bg-[#8B6B4A]"></div>
								</div>

								<div class="group rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
									<div class="mb-4 flex items-start justify-between">
										<div class="flex items-center gap-3">
											<Avatar.Root class="h-10 w-10 border-2 border-white shadow-sm">
												<Avatar.Image src={log.profiles?.image_url} alt={log.profiles?.username} />
												<Avatar.Fallback class="bg-gray-100 text-xs font-bold text-[#8B6B4A]">
													{getInitials(log.profiles?.username || 'Unknown')}
												</Avatar.Fallback>
											</Avatar.Root>
											<div>
												<p class="text-sm font-semibold text-gray-900">
													{log.profiles?.username || 'Άγνωστος Χρήστης'}
												</p>
												<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
													{log.profiles?.role || 'Staff'}
												</p>
											</div>
										</div>

										<div
											class="flex items-center gap-1.5 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500"
										>
											<Calendar class="h-3.5 w-3.5" />
											{format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: el })}
										</div>
									</div>

									<Separator class="mb-4" />

									<div class="space-y-4">
										<div class="space-y-2">
											<h4
												class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-500 uppercase"
											>
												<AlertTriangle class="h-3.5 w-3.5" />
												Περιγραφη Βλαβης
											</h4>
											<p class="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-800">
												{log.issue_description}
											</p>
										</div>

										{#if log.action_taken}
											<div class="space-y-2">
												<h4
													class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-500 uppercase"
												>
													<Wrench class="h-3.5 w-3.5" />
													Ενεργειες που εγιναν
												</h4>
												<p class="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
													{log.action_taken}
												</p>
											</div>
										{/if}
									</div>

									<div class="mt-5 flex flex-wrap items-center justify-between gap-4">
										<form
											{...deleteMaintanceLog.enhance(async ({ form, data, submit }) => {
												deletingLogId = log.id;
												await submit();
												if (deleteMaintanceLog.result?.success) {
													toast.success(deleteMaintanceLog.result.message);
												} else {
													toast.error(deleteMaintanceLog.result?.message || '');
												}
												form.reset();
											})}
										>
											<input class="hidden" name="maintanceLogId" value={log.id} />
											<Button
												type="submit"
												variant="outline"
												class="h-7 w-7 border-destructive! text-destructive! hover:bg-destructive/10! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
											>
												<Trash2 />
											</Button>
										</form>

										{#if log.images && log.images.length > 0}
											<div class="flex -space-x-2">
												{#each log.images.slice(0, 3) as img, idx}
													<button
														class="relative z-0 h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-white ring-1 ring-gray-200 transition-transform hover:z-10 hover:scale-110"
														title="View image"
														onclick={() => openImagePreview(img)}
													>
														<img src={img} alt="Evidence" class="h-full w-full object-cover" />
													</button>
												{/each}
												{#if log.images.length > 3}
													<div
														class="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600 ring-1 ring-gray-200"
													>
														+{log.images.length - 3}
													</div>
												{/if}
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>

		<Modal.Footer class="z-20 flex items-center justify-between bg-gray-50 p-4">
			<p class="text-xs text-gray-500 italic">
				Σύνολο: {sortedLogs.length} καταγραφές
			</p>
			<Button variant="outline" onclick={() => (modalOpen = false)}>Κλείσιμο</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>

<!-- Image Preview Modal -->
{#if previewImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Image preview dialog"
		tabindex="0"
		onclick={closeImagePreview}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeImagePreview();
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				closeImagePreview();
			}
		}}
		transition:fade={{ duration: 200 }}
	>
		<button
			class="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
			onclick={closeImagePreview}
			aria-label="Close preview"
			type="button"
		>
			<X class="h-6 w-6" />
		</button>

		<!-- make the image container an interactive element so clicks/keyboard are handled accessibly -->
		<button
			type="button"
			class="rounded-lg p-0"
			onclick={(e) => e.stopPropagation()}
			aria-label="Preview image"
		>
			<img
				src={previewImage}
				alt="Preview"
				class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
				transition:scale={{ duration: 200 }}
			/>
		</button>
	</div>
{/if}
