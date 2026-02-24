// ============================================
// Evaluation Photos Store
// TailorMade BO
// ============================================

import { getContext, setContext } from 'svelte';
import type { PhotoCategory } from '$lib/models/trainers.types';
import { isProblemCategory } from '$lib/models/trainers.types';

// ─── In-memory Photo Entry ────────────────────────────────────────────────────
// Holds the raw File — no upload happens here, only at submit time

export interface PhotoEntry {
	category: PhotoCategory;
	file: File;
	/** Stable key for keyed {#each} and removal */
	id: string;
	/** Object URL for <img src> previews — revoked on remove/reset */
	previewUrl: string;
	/** Required for problem_1/2/3, optional otherwise */
	description: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

function createEvaluationPhotosStore() {
	let photos = $state<PhotoEntry[]>([]);

	return {
		// ─── Reads ────────────────────────────────────────────────────────────

		get all() {
			return photos;
		},

		get totalPhotos() {
			return photos.length;
		},

		get hasProblemPhotos() {
			return photos.some((p) => isProblemCategory(p.category));
		},

		get problemPhotos() {
			return photos.filter((p) => isProblemCategory(p.category));
		},

		getByCategory(category: PhotoCategory): PhotoEntry[] {
			return photos.filter((p) => p.category === category);
		},

		// ─── Mutations ────────────────────────────────────────────────────────

		/** Add one or more File objects under a category */
		addFiles(category: PhotoCategory, files: File[]) {
			const newEntries: PhotoEntry[] = files.map((file) => ({
				category,
				file,
				id: `${category}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
				previewUrl: URL.createObjectURL(file),
				description: ''
			}));
			photos = [...photos, ...newEntries];
		},

		/** Remove a single photo by id and revoke its object URL */
		removePhoto(id: string) {
			const target = photos.find((p) => p.id === id);
			if (target) URL.revokeObjectURL(target.previewUrl);
			photos = photos.filter((p) => p.id !== id);
		},

		/** Update the description field (used for problem_* categories) */
		updateDescription(id: string, description: string) {
			photos = photos.map((p) => (p.id === id ? { ...p, description } : p));
		},

		/** Clear everything and revoke all object URLs */
		reset() {
			photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
			photos = [];
		},

		// ─── Serialise ────────────────────────────────────────────────────────

		/**
		 * Returns the flat list ready to hand off to your upload function at
		 * submit time. Upload each entry.file, collect the storage_path, then
		 * build your EvaluationPhotosInsert payload.
		 */
		toUploadList() {
			return photos.map((p) => ({
				category: p.category,
				file: p.file,
				description: p.description || null
			}));
		}
	};
}

// ─── Context ──────────────────────────────────────────────────────────────────

const KEY = Symbol('evaluation_photos');

export type EvaluationPhotosStore = ReturnType<typeof createEvaluationPhotosStore>;

export function setEvaluationPhotosContext(): EvaluationPhotosStore {
	const store = createEvaluationPhotosStore();
	setContext(KEY, store);
	return store;
}

export function getEvaluationPhotosContext(): EvaluationPhotosStore {
	return getContext<EvaluationPhotosStore>(KEY);
}