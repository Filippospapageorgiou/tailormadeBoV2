import { form, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import type { Provider } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from 'zod/v4';
import type { importantPhoneCalls } from '$lib/models/database.types';
import { getUserOrgId } from '$lib/supabase/queries';

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

export const updateProfile = form(updateProfileSchema, async ({ username, avatar, phone, full_name }) => {
	const user = await requireAuthenticatedUser();
	const supabase = createServerClient();

	// Check if username already exists
	const { count, error: countError } = await supabase
		.from('profiles')
		.select('*', { count: 'exact', head: true })
		.neq('id', user.id)
		.eq('username', username);

	const usernameExists = count && count > 0;
	if (usernameExists || countError) {
		console.error('[updateProfile] error checking username if exists: ', countError);
		return {
			success: false,
			message: 'Το username υπάρχει δόκιμασε κάτι άλλο'
		};
	}

	// Update username and phone first
	const { error: updateError } = await supabase
		.from('profiles')
		.update({
			username,
			phone,
			full_name
		})
		.eq('id', user.id);

	if (updateError) {
		console.error('[updateProfile] error updating profile: ', updateError);
		return {
			success: false,
			message: 'Σφάλμα κατά την ενημέρωση του προφιλ'
		};
	}

	// Handle avatar upload if it exists
	if (avatar && avatar.size > 0) {
		try {
			// Get current profile to find old avatar
			const { data: currentProfile, error: fetchError } = await supabase
				.from('profiles')
				.select('image_url')
				.eq('id', user.id)
				.single();

			if (fetchError) {
				console.error('[updateProfile] error fetching current profile: ', fetchError);
				return {
					success: false,
					message: 'Σφάλμα κατά την ανάκτηση του προφιλ'
				};
			}

			// Delete old avatar if it exists
			if (currentProfile?.image_url) {
				try {
					const urlPath = currentProfile.image_url.split('avatars_url/')[1];
					if (urlPath) {
						await supabase.storage.from('avatars_url').remove([urlPath]);
					}
				} catch (err) {
					console.warn('[updateProfile] could not delete old avatar:', err);
				}
			}

			// Upload new avatar
			const buffer = await avatar.arrayBuffer();
			const fileName = `${user.id}/${Date.now()}-${avatar.name}`;

			const { error: uploadError } = await supabase.storage
				.from('avatars_url')
				.upload(fileName, buffer, { upsert: true });

			if (uploadError) {
				console.error('[updateProfile] error uploading avatar: ', uploadError);
				return {
					success: false,
					message: 'Σφάλμα κατά την μεταφόρτωση της εικόνας'
				};
			}

			// Get public URL
			const { data: publicUrlData } = supabase.storage.from('avatars_url').getPublicUrl(fileName);

			const avatarUrl = publicUrlData.publicUrl;

			// Update avatar_url in profile
			const { error: avatarUpdateError } = await supabase
				.from('profiles')
				.update({ image_url: avatarUrl })
				.eq('id', user.id);

			if (avatarUpdateError) {
				console.error('[updateProfile] error updating avatar_url: ', avatarUpdateError);
				return {
					success: false,
					message: 'Σφάλμα κατά την ενημέρωση της εικόνας'
				};
			}
		} catch (err) {
			console.error('[updateProfile] error handling avatar: ', err);
			return {
				success: false,
				message: 'Σφάλμα κατά την επεξεργασία της εικόνας'
			};
		}
	}

	return {
		success: true,
		message: 'Το προφιλ σου ενημερωθήκε επιτυχώς'
	};
});


export const getProfileStats = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();
	const uid = user.id;

	// 1. Shifts — total + breakdown by type and category
	const { data: shifts } = await supabase
		.from('shifts')
		.select('shift_type, shift_category')
		.eq('user_id', uid);

	const shiftTypeCounts: Record<string, number> = {};
	const shiftCategoryCounts: Record<string, number> = {};
	for (const s of shifts ?? []) {
		shiftTypeCounts[s.shift_type] = (shiftTypeCounts[s.shift_type] ?? 0) + 1;
		if (s.shift_category) {
			shiftCategoryCounts[s.shift_category] = (shiftCategoryCounts[s.shift_category] ?? 0) + 1;
		}
	}

	// 2. Bonuses — all payouts with period info
	//only published
	const { data: payouts } = await supabase
	.from('bonus_employee_payouts')
	.select(`
		bonus_amount,
		hours_worked,
		total_shifts_in_pool,
		created_at,
		bonus_organization_data!inner (
			period_id,
			bonus_periods!inner ( quarter, year, status )
		)
	`)
	.eq('user_id', uid)
	.eq('bonus_organization_data.bonus_periods.status', 'published')
	.order('created_at', { ascending: false });

	const totalBonusEarned = (payouts ?? []).reduce((sum, p) => sum + (p.bonus_amount ?? 0), 0);
	const bonusHistory = (payouts ?? []).map((p) => {
		const orgData = p.bonus_organization_data as any;
		const period = orgData?.bonus_periods;
		return {
			amount: p.bonus_amount ?? 0,
			hours_worked: p.hours_worked ?? 0,
			quarter: period?.quarter ?? null,
			year: period?.year ?? null,
			status: period?.status ?? null
		};
	});

	// 3. Tasks completed
	const [{ count: dailyDone }, { count: weeklyDone }, { count: monthlyDone }] = await Promise.all([
		supabase
			.from('user_daily_tasks')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', uid)
			.eq('completed', true),
		supabase
			.from('user_weekly_tasks')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', uid)
			.eq('completed', true),
		supabase
			.from('user_monthly_tasks')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', uid)
			.eq('completed', true)
	]);
	return {
		shifts: {
			total: (shifts ?? []).length,
			byType: shiftTypeCounts,
			byCategory: shiftCategoryCounts
		},
		bonuses: {
			total: totalBonusEarned,
			count: (payouts ?? []).length,
			history: bonusHistory
		},
		tasks: {
			daily: dailyDone ?? 0,
			weekly: weeklyDone ?? 0,
			monthly: monthlyDone ?? 0,
			total: (dailyDone ?? 0) + (weeklyDone ?? 0) + (monthlyDone ?? 0)
		}
	};
});

export const getAllPhoneContactsProfile = query(async () => {
	const supabase = createServerClient();

	try {
		const org_id = await getUserOrgId();

		const { data: contacts, error } = await supabase
			.from('important_phone_calls')
			.select('*')
			.eq('org_id', org_id)
			.eq('is_active',true)
			.order('associated_company', { ascending: true });

		if (error) {
			console.error('[getAllPhoneContacts] Error fetching contacts:', error);
			return {
				success: false,
				contacts: [],
				message: 'Σφάλμα κατά την ανάκτηση επαφών'
			};
		}

		return {
			success: true,
			contacts: (contacts as importantPhoneCalls[]) || [],
			message: 'Επιτυχής ανάκτηση επαφών'
		};
	} catch (err) {
		console.error('[getAllPhoneContacts] Error:', err);
		return {
			success: false,
			contacts: [],
			message: 'Σφάλμα κατά την ανάκτηση επαφών'
		};
	}
});