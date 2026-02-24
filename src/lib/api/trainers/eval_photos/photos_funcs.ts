// ============================================================
// CLIENT-SIDE ONLY — no $app/server imports here
// Upload photo files to Supabase storage bucket.
// Returns storage paths to hand off to savePhotos command.
// ============================================================

import { createBrowserClient } from '$lib/supabase/browse';

export async function uploadEvaluationPhotos(
	evaluationId: number,
	photos: { category: string; file: File; description: string | null }[]
): Promise<{ category: string; storage_path: string; description: string | null }[]> {
	const supabase = createBrowserClient();
	const results: { category: string; storage_path: string; description: string | null }[] = [];

	for (const photo of photos) {
		const ext = photo.file.name.split('.').pop() ?? 'jpg';
		const path = `${evaluationId}/${photo.category}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

		const { data, error: uploadError } = await supabase.storage
			.from('evaluation-photos')
			.upload(path, photo.file, { upsert: false });

		if (uploadError) {
			console.error('[uploadEvaluationPhotos] Upload failed for category:', photo.category, uploadError);
			throw uploadError;
		}

		results.push({
			category: photo.category,
			storage_path: data.path,
			description: photo.description ?? null,
		});
	}

	return results;
}
