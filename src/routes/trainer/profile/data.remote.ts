import { form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
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
