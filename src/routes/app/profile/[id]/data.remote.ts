import { form, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import type { Provider } from '@supabase/supabase-js';
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
	phone: z.string()
});

export const updateProfile = form(updateProfileSchema, async ({ username, avatar, phone }) => {
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
			phone
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
