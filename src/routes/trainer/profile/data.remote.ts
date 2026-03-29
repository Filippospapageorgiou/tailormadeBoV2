import { form, query } from '$app/server';
import { createServerClient, createAdminClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from 'zod/v4';

const updateProfileSchema = z.object({
	username: z
		.string({ error: 'Username is required.' })
		.min(3, { error: 'Username must be at least 3 characters long.' })
		.max(30, { error: 'Username must not exceed 30 characters.' })
		.regex(/^[a-zA-Z0-9_-]+$/, {
			error: 'Username can only contain letters, numbers, underscores, and hyphens.'
		})
		.toLowerCase()
		.trim(),
	avatar: z
		.instanceof(File, { message: 'Please upload a file.' })
		.refine((file) => file.size > 0, 'File cannot be empty.')
		.refine((file) => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
		.refine(
			(file) =>
				['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
			'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
		)
		.optional(),
	phone: z.string(),
	full_name: z
		.string({ error: 'full_name is required.' })
		.min(3, { error: 'full_name must be at least 3 characters long.' })
		.max(30, { error: 'full_name must not exceed 30 characters.' })
});

export const updateTrainerProfile = form(
	updateProfileSchema,
	async ({ username, avatar, phone, full_name }) => {
		const user = await requireAuthenticatedUser();
		const supabase = createServerClient();

		const { count, error: countError } = await supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.neq('id', user.id)
			.eq('username', username);

		const usernameExists = count && count > 0;
		if (usernameExists || countError) {
			return {
				success: false,
				message: 'Το username υπάρχει δόκιμασε κάτι άλλο'
			};
		}

		const { error: updateError } = await supabase
			.from('profiles')
			.update({ username, phone, full_name })
			.eq('id', user.id);

		if (updateError) {
			return {
				success: false,
				message: 'Σφάλμα κατά την ενημέρωση του προφιλ'
			};
		}

		if (avatar && avatar.size > 0) {
			try {
				const { data: currentProfile } = await supabase
					.from('profiles')
					.select('image_url')
					.eq('id', user.id)
					.single();

				if (currentProfile?.image_url) {
					const urlPath = currentProfile.image_url.split('avatars_url/')[1];
					if (urlPath) {
						await supabase.storage.from('avatars_url').remove([urlPath]);
					}
				}

				const buffer = await avatar.arrayBuffer();
				const fileName = `${user.id}/${Date.now()}-${avatar.name}`;

				const { error: uploadError } = await supabase.storage
					.from('avatars_url')
					.upload(fileName, buffer, { upsert: true });

				if (uploadError) {
					return { success: false, message: 'Σφάλμα κατά την μεταφόρτωση της εικόνας' };
				}

				const { data: publicUrlData } = supabase.storage
					.from('avatars_url')
					.getPublicUrl(fileName);

				await supabase
					.from('profiles')
					.update({ image_url: publicUrlData.publicUrl })
					.eq('id', user.id);
			} catch {
				return { success: false, message: 'Σφάλμα κατά την επεξεργασία της εικόνας' };
			}
		}

		return { success: true, message: 'Το προφιλ σου ενημερωθήκε επιτυχώς' };
	}
);

// Greek month abbreviations
const MONTH_LABELS = [
	'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν',
	'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'
];

/**
 * Get trainer profile stats: monthly evaluations, monthly visits, summary numbers
 */
export const getTrainerProfileStats = query(async () => {
	const user = await requireAuthenticatedUser();
	const supabase = createAdminClient();
	const uid = user.id;

	// Evaluations
	const { data: evaluations } = await supabase
		.from('store_evaluations')
		.select('id, visit_date, submit, overall_rating, created_at')
		.eq('trainer_id', uid)
		.order('visit_date', { ascending: false });

	// Visits with action counts
	const { data: visits } = await supabase
		.from('trainer_service_visits')
		.select('id, visit_date, status, completed_at, trainer_visit_actions(id, cost)')
		.eq('trainer_id', uid)
		.order('visit_date', { ascending: false });

	// Build monthly evaluation chart data
	const evalMonthMap = new Map<string, { submitted: number; reviewed: number }>();
	for (const e of evaluations ?? []) {
		const date = new Date(e.visit_date);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		if (!evalMonthMap.has(key)) evalMonthMap.set(key, { submitted: 0, reviewed: 0 });
		const entry = evalMonthMap.get(key)!;
		if (e.submit === 'submitted' || e.submit === 'reviewed') entry.submitted++;
		if (e.submit === 'reviewed') entry.reviewed++;
	}

	const evaluationChartData = Array.from(evalMonthMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.slice(-8)
		.map(([key, counts]) => {
			const [year, month] = key.split('-');
			return {
				month: `${MONTH_LABELS[parseInt(month) - 1]} '${year.slice(-2)}`,
				...counts
			};
		});

	// Build monthly visits chart data
	const visitMonthMap = new Map<string, { visits: number; actions: number }>();
	for (const v of visits ?? []) {
		if (v.status !== 'completed') continue;
		const date = new Date(v.visit_date);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		if (!visitMonthMap.has(key)) visitMonthMap.set(key, { visits: 0, actions: 0 });
		const entry = visitMonthMap.get(key)!;
		entry.visits++;
		entry.actions += (v.trainer_visit_actions as any[])?.length ?? 0;
	}

	const visitsChartData = Array.from(visitMonthMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.slice(-8)
		.map(([key, counts]) => {
			const [year, month] = key.split('-');
			return {
				month: `${MONTH_LABELS[parseInt(month) - 1]} '${year.slice(-2)}`,
				...counts
			};
		});

	// Summary numbers
	const completedVisits = (visits ?? []).filter((v) => v.status === 'completed').length;
	const totalActions = (visits ?? []).reduce(
		(sum, v) => sum + ((v.trainer_visit_actions as any[])?.length ?? 0), 0
	);
	const totalCost = (visits ?? []).reduce(
		(sum, v) => sum + ((v.trainer_visit_actions as any[]) ?? []).reduce(
			(s: number, a: any) => s + (a.cost || 0), 0
		), 0
	);

	const ratings = (evaluations ?? [])
		.map((e) => e.overall_rating)
		.filter((r): r is number => r !== null && r > 0);
	const avgRating = ratings.length > 0
		? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
		: null;

	return {
		evaluationChartData,
		visitsChartData,
		summary: {
			completedVisits,
			totalActions,
			totalCost: Math.round(totalCost * 100) / 100,
			avgRating
		}
	};
});
