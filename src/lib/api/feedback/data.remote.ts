// src/lib/components/custom/feedback/data.remote.ts
import { form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { getUserProfile } from '$lib/supabase/queries';
import { sendFeedbackNotification } from '$lib/emails/feedback-notifications';
import { z } from 'zod/v4';
import type { Feedback } from '$lib/models/feedback.types';

// ======================== SCHEMA ==============

const submitFeedbackSchema = z.object({
	rating: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(
			z
				.number()
				.int()
				.min(1, { error: 'Η βαθμολογία πρέπει να είναι τουλάχιστον 1' })
				.max(5, { error: 'Η βαθμολογία δεν μπορεί να υπερβαίνει το 5' })
		),
	comment: z
		.string()
		.min(10, { error: 'Το σχόλιο πρέπει να είναι τουλάχιστον 10 χαρακτήρες' })
		.max(1000, { error: 'Το σχόλιο δεν μπορεί να υπερβαίνει τους 1000 χαρακτήρες' })
		.trim()
});

// ======================== FORM ==============

export const submitFeedback = form(submitFeedbackSchema, async ({ rating, comment }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Get user profile with organization info
		const profile = await getUserProfile();

		if (!profile) {
			return {
				success: false,
				message: 'Δεν βρέθηκε το προφίλ χρήστη'
			};
		}

		// Get organization name
		const { data: organization, error: orgError } = await supabase
			.from('core_organizations')
			.select('id, store_name')
			.eq('id', profile.org_id)
			.single();

		if (orgError) {
			console.error('[submitFeedback] Error fetching organization:', orgError);
		}

		const organizationName = organization?.store_name || 'Άγνωστος Οργανισμός';

		// Insert feedback into database
		const { data: newFeedback, error: insertError } = await supabase
			.from('feedback')
			.insert({
				user_id: user.id,
				org_id: profile.org_id,
				rating,
				comment
			})
			.select()
			.single<Feedback>();

		if (insertError) {
			console.error('[submitFeedback] Error inserting feedback:', insertError);
			return {
				success: false,
				message: 'Αποτυχία αποθήκευσης feedback. Παρακαλώ δοκιμάστε ξανά.'
			};
		}

		// Send email notification (non-blocking - don't fail if email fails)
		try {
			const emailResult = await sendFeedbackNotification({
				userName: profile.username,
				userEmail: profile.email,
				organizationName,
				rating,
				comment,
				submittedAt: new Date()
			});

			if (!emailResult.success) {
				console.warn('[submitFeedback] Email notification failed:', emailResult.message);
				// Don't return error - feedback was saved successfully
			}
		} catch (emailError) {
			console.error('[submitFeedback] Email notification error:', emailError);
			// Don't return error - feedback was saved successfully
		}

		return {
			success: true,
			message: 'Ευχαριστούμε για το feedback σας! 🎉',
			feedback: newFeedback
		};
	} catch (err) {
		console.error('[submitFeedback] Unexpected error:', err);
		return {
			success: false,
			message: 'Παρουσιάστηκε απρόσμενο σφάλμα. Παρακαλώ δοκιμάστε ξανά.'
		};
	}
});