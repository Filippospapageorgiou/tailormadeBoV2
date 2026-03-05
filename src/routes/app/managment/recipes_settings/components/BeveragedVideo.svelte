<script lang="ts">
	import type { BeverageVideo } from '$lib/models/database.types';
	import {
		uploadBeverageVideo,
		deleteBeverageVideo,
		updateBeverageVideoTitle
	} from '../data.remote';
	import { FileDropZone, ACCEPT_VIDEO, MEGABYTE } from '$lib/components/ui/file-drop-zone';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { Video, Trash2, Pencil, Save, X, Plus, Upload, Film, Loader2 } from 'lucide-svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	const MAX_VIDEOS = 4;

	let {
		beverageId,
		videos = [],
		onUpdate
	}: {
		beverageId: number;
		videos: BeverageVideo[];
		onUpdate: () => Promise<void>;
	} = $props();

	let uploading = $state(false);
	let deletingUrl = $state<string | null>(null);
	let editingUrl = $state<string | null>(null);
	let editTitle = $state('');

	// Upload dialog state
	let showUploadDialog = $state(false);
	let pendingFiles = $state<File[]>([]);
	let videoTitle = $state('');

	let canUpload = $derived(videos.length < MAX_VIDEOS && !uploading);

	let fileInputEl = $state<HTMLInputElement | null>(null);

	function handleFilesSelected(files: File[]) {
		if (files.length === 0) return;
		pendingFiles = files;
		videoTitle = '';
		showUploadDialog = true;

		requestAnimationFrame(() => {
			if (fileInputEl) {
				const dt = new DataTransfer();
				for (const file of files) {
					dt.items.add(file);
				}
				fileInputEl.files = dt.files;
			}
		});
	}

	async function handleDelete(videoUrl: string) {
		deletingUrl = videoUrl;
		try {
			const result = await deleteBeverageVideo({ beverageId, videoUrl });
			if (result.success) {
				toast.success(result.message);
				await onUpdate();
			} else {
				toast.error(result.message || 'Σφάλμα κάτα την διαγραφή');
			}
		} catch (err) {
			toast.error('Σφάλμα κάτα την διαγραφή βίντεο');
		} finally {
			deletingUrl = null;
		}
	}

	function startEdit(video: BeverageVideo) {
		editingUrl = video.url;
		editTitle = video.title || '';
	}

	function cancelEdit() {
		editingUrl = null;
		editTitle = '';
	}

	async function saveEdit() {
		if (!editingUrl || !editTitle.trim()) {
			toast.error('Ο τίτλος δεν μπορεί να είναι κενός');
			return;
		}

		try {
			const result = await updateBeverageVideoTitle({
				beverageId,
				videoUrl: editingUrl,
				newTitle: editTitle.trim()
			});

			if (result.success) {
				toast.success(result.message);
				await onUpdate();
			} else {
				toast.error(result.message || 'Σφάλμα κάτα την ενημέρωση');
			}
		} catch (err) {
			toast.error('Σφάλμα κάτα την ενημέρωση τίτλου');
		} finally {
			editingUrl = null;
			editTitle = '';
		}
	}

	function getFileName(url: string): string {
		try {
			const parts = url.split('/');
			return decodeURIComponent(parts[parts.length - 1]);
		} catch {
			return 'video';
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<Label class="flex items-center gap-2 text-sm font-medium">
			<Film class="h-4 w-4 text-primary" />
			Βίντεο Συνταγής
			<span class="text-xs text-muted-foreground">
				({videos.length}/{MAX_VIDEOS})
			</span>
		</Label>
	</div>

	<!-- Existing Videos List -->
	{#if videos.length > 0}
		<div class="space-y-2">
			{#each videos as video, index (video.url)}
				<div
					class="group flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 transition-all hover:border-border hover:bg-muted/50"
				>
					<!-- Video Thumbnail / Icon -->
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<Video class="h-5 w-5" />
					</div>

					<!-- Video Info -->
					<div class="min-w-0 flex-1">
						{#if editingUrl === video.url}
							<div class="flex items-center gap-2">
								<Input
									bind:value={editTitle}
									placeholder="Τίτλος βίντεο..."
									class="h-8 text-sm"
									onkeydown={(e) => {
										if (e.key === 'Enter') saveEdit();
										if (e.key === 'Escape') cancelEdit();
									}}
								/>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8 flex-shrink-0 cursor-pointer text-green-600 hover:bg-green-500/10 hover:text-green-700"
									onclick={saveEdit}
								>
									<Save class="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8 flex-shrink-0 cursor-pointer hover:bg-muted"
									onclick={cancelEdit}
								>
									<X class="h-3.5 w-3.5" />
								</Button>
							</div>
						{:else}
							<p class="truncate text-sm font-medium text-foreground">
								{video.title || `Βίντεο ${index + 1}`}
							</p>
							<p class="truncate text-[11px] text-muted-foreground">
								{getFileName(video.url)}
							</p>
						{/if}
					</div>

					<!-- Actions -->
					{#if editingUrl !== video.url}
						<div
							class="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 cursor-pointer hover:bg-primary/10 hover:text-primary"
								onclick={() => startEdit(video)}
							>
								<Pencil class="h-3 w-3" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 cursor-pointer hover:bg-red-500/10 hover:text-red-500"
								disabled={deletingUrl === video.url}
								onclick={() => handleDelete(video.url)}
							>
								{#if deletingUrl === video.url}
									<Loader2 class="animate-spin h-3 w-3" />
								{:else}
									<Trash2 class="h-3 w-3" />
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Upload Area -->
	{#if canUpload}
		{#if uploading}
			<div
				class="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5"
			>
				<Loader2 class="animate-spin h-6 w-6 text-primary" />
				<span class="text-sm text-muted-foreground">Ανέβασμα βίντεο...</span>
			</div>
		{:else}
			<FileDropZone
				accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
				maxFileSize={100 * MEGABYTE}
				maxFiles={MAX_VIDEOS - videos.length}
				fileCount={videos.length}
				onUpload={async (files) => handleFilesSelected(files)}
				onFileRejected={({ reason }) => toast.error(reason)}
				class="h-32"
			>
				<div class="flex flex-col items-center justify-center gap-1.5">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
					>
						<Upload class="h-4 w-4" />
					</div>
					<span class="text-xs font-medium text-muted-foreground">
						Σύρε ή κάνε κλικ για βίντεο
					</span>
					<span class="text-[10px] text-muted-foreground/70">
						MP4, WebM, MOV · Μέχρι 100MB · {MAX_VIDEOS - videos.length} ακόμα
					</span>
				</div>
			</FileDropZone>
		{/if}
	{:else if !uploading && videos.length >= MAX_VIDEOS}
		<div
			class="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20 p-3"
		>
			<Film class="h-4 w-4 text-muted-foreground" />
			<span class="text-xs text-muted-foreground">
				Μέγιστος αριθμός βίντεο ({MAX_VIDEOS}) — διαγράψτε ένα για να ανεβάσετε νέο
			</span>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={showUploadDialog}>
	<Dialog.Content class="sm:max-w-[420px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Video class="h-5 w-5 text-primary" />
				Τίτλος Βίντεο
			</Dialog.Title>
			<Dialog.Description>Δώστε έναν τίτλο στο βίντεο πριν το ανεβάσετε.</Dialog.Description>
		</Dialog.Header>

		<form
			enctype="multipart/form-data"
			{...uploadBeverageVideo.enhance(async ({ submit }) => {
				uploading = true;
				await submit();
				if (uploadBeverageVideo.result?.success) {
					toast.success(uploadBeverageVideo.result.message);
					await onUpdate();
				} else {
					toast.error(uploadBeverageVideo.result?.message || 'Σφάλμα κάτα το ανέβασμα');
				}

				uploading = false;
				pendingFiles = [];
				videoTitle = '';
                showUploadDialog = false;
			})}
		>
			<input type="hidden" name="beverageId" value={beverageId} />

			<div class="py-4">
				<div class="space-y-2">
					<Label for="video-title">Τίτλος *</Label>
					<Input
						id="video-title"
						name="title"
						bind:value={videoTitle}
						maxlength={40}
						placeholder="π.χ. Βήμα 1 - Αφρόγαλα"
					/>
					<p class="text-right text-[11px] text-muted-foreground">
						{videoTitle.length}/40
					</p>
				</div>

				{#if pendingFiles.length > 0}
					<div class="mt-3 min-w-0 overflow-hidden rounded-md bg-muted/50 p-2.5">
						<p class="text-xs text-muted-foreground">
							{pendingFiles.length} αρχείο{pendingFiles.length > 1 ? 'α' : ''} επιλεγμένο{pendingFiles.length >
							1
								? 'α'
								: ''}
						</p>
						{#each pendingFiles as file}
							<p class="max-w-full truncate text-xs font-medium text-foreground">{file.name}</p>
						{/each}
					</div>
					<!-- Attach the actual file(s) via a hidden file input -->
					<input type="file" name="video" class="hidden" bind:this={fileInputEl} />
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					variant="outline"
					type="button"
                    disabled={uploading}
					onclick={() => {
						showUploadDialog = false;
						pendingFiles = [];
						videoTitle = '';
					}}>Ακύρωση</Button
				>
				<Button type="submit" class="cursor-pointer gap-2" disabled={uploading}>
                    {#if  uploading}
                        <Spinner />
                        Ανέβασμα...
                    {:else}
                        <Upload class="h-4 w-4" />
                        Ανέβασμα
                    {/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
