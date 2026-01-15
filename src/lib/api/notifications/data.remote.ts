// src/lib/components/custom/notifications/data.remote.ts

import { query, command } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Notification } from '$lib/models/notifications.types';
import { z } from 'zod/v4';

/**
 * Get all notifications for the current user
 */
export const getNotifications = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		const { data: notifications, error } = await supabase
			.from('notifications')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(50)
			.overrideTypes<Notification[]>();

		if (error) {
			console.error('[getNotifications] Error fetching notifications:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση ειδοποιήσεων',
				notifications: [],
				unreadCount: 0
			};
		}

		const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
		return {
			success: true,
			message: 'Επιτυχής ανάκτηση ειδοποιήσεων',
			notifications: notifications || [],
			unreadCount
		};
	} catch (err) {
		console.error('[getNotifications] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα',
			notifications: [],
			unreadCount: 0
		};
	}
});

/**
 * Mark a single notification as read
 */
const markAsReadSchema = z.object({
	notificationId: z.number().int().positive()
});

export const markNotificationAsRead = command(markAsReadSchema, async ({ notificationId }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		const { error } = await supabase
			.from('notifications')
			.update({
				is_read: true,
				read_at: new Date().toISOString()
			})
			.eq('id', notificationId)
			.eq('user_id', user.id);

		if (error) {
			console.error('[markNotificationAsRead] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ενημέρωση'
			};
		}

		return {
			success: true,
			message: 'Η ειδοποίηση σημάνθηκε ως αναγνωσμένη'
		};
	} catch (err) {
		console.error('[markNotificationAsRead] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = command(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		const { error } = await supabase
			.from('notifications')
			.update({
				is_read: true,
				read_at: new Date().toISOString()
			})
			.eq('user_id', user.id)
			.eq('is_read', false);

		if (error) {
			console.error('[markAllNotificationsAsRead] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ενημέρωση'
			};
		}

		return {
			success: true,
			message: 'Όλες οι ειδοποιήσεις σημάνθηκαν ως αναγνωσμένες'
		};
	} catch (err) {
		console.error('[markAllNotificationsAsRead] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});