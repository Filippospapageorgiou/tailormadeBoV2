// src/lib/api/manuals/data.remote.ts
import { query, command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { getUserProfile, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';
import type {
	Manual,
	ManualWithAuthor,
	ManualWithDetails,
	ManualReader,
	ManualCategory
} from '$lib/models/manuals.types';

const STORAGE_BUCKET = 'manual_media';

// =============================================
// SCHEMAS
// =============================================
const manualCategorySchema = z.enum([
	'equipment',
	'cleaning',
	'sales',
	'customer_service',
	'safety',
	'inventory',
	'opening_closing',
	'other'
]);

const imageFileSchema = z
	.instanceof(File)
	.refine((file) => file.size > 0, 'File cannot be empty.')
	.refine((file) => file.size < 5 * 1024 * 1024, 'File must be less than 5MB.')
	.refine(
		(file) =>
			['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
		'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
	);

const manualIdSchema = z.object({
	id: z.number().int().positive()
});

const categoryFilterSchema = z.object({
	category: manualCategorySchema.optional()
});

// Form schemas (string-based for FormData)
const createManualFormSchema = z.object({
	title: z.string().min(3, 'Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες').max(200),
	description: z.string().max(500).optional(),
	content: z.string().min(10, 'Το περιεχόμενο πρέπει να έχει τουλάχιστον 10 χαρακτήρες'),
	category: manualCategorySchema,
	media: z.array(imageFileSchema).max(4, 'Μέγιστο 4 εικόνες.').optional(),
	published: z.string().transform((val) => val === 'true'),
	display_order: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int()).optional()
});

const editManualFormSchema = z.object({
	id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
	title: z.string().min(3, 'Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες').max(200),
	description: z.string().max(500).optional(),
	content: z.string().min(10, 'Το περιεχόμενο πρέπει να έχει τουλάχιστον 10 χαρακτήρες'),
	category: manualCategorySchema,
	existingMedia: z.string().optional(), // JSON array of URLs to keep
	newMedia: z.array(imageFileSchema).max(4, 'Μέγιστο 4 εικόνες.').optional(),
	published: z.string().transform((val) => val === 'true'),
	display_order: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int()).optional()
});

const deleteManualSchema = z.object({
	id: z.number().int().positive()
});


// =============================================
// QUERIES - Read Operations
// =============================================

/**
 * Get all published manuals (for all authenticated users)
 * Includes read status for the current user
 */
export const getPublishedManuals = query(categoryFilterSchema, async({category}) => {
    try{
        const supabase = createServerClient();
        const user = await requireAuthenticatedUser()

        let queryBuilder = supabase
			.from('manuals')
			.select(
				`
				*,
				profiles!manuals_author_id_fkey (
					id,
					username,
					image_url
				)
			`
			)
			.eq('published', true)
			.order('display_order', { ascending: true })
			.order('created_at', { ascending: false });

        if(category){
            queryBuilder = queryBuilder.eq('category',category);
        }

        const { data: manuals, error } = await queryBuilder;

		if (error) {
			console.error('[getPublishedManuals] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση εγχειριδίων',
				manuals: []
			};
		}

        const manualIds = manuals?.map((m) => m.id) || [];

		const { data: readRecords, error: readError } = await supabase
			.from('manual_reads')
			.select('manual_id, read_at')
			.eq('user_id', user.id)
			.in('manual_id', manualIds);

		if (readError) {
			console.error('[getPublishedManuals] Read status error:', readError);
		}

        //create a map of manual_id -> read_at

        const readMap = new Map<number,string>();
        readRecords?.forEach((r) => {
            readMap.set(r.manual_id, r.read_at)
        });

        // Merge read status with manuals
		const manualsWithReadStatus: ManualWithDetails[] =
			manuals?.map((manual) => ({
				...manual,
				is_read: readMap.has(manual.id),
				read_at: readMap.get(manual.id) || null
			})) || [];

		return {
			success: true,
			message: 'Επιτυχής ανάκτηση εγχειριδίων',
			manuals: manualsWithReadStatus
		};


    }catch(err){
        console.error('[getPublishedManuals] Error fetching published manuals: ',err);
        return{
            success:false,
            message:'Σφάλμα κάτα την ανάκτηση δεδομένων',
            manuals:[]
        };
    }
})


/**
 * Get all manuals (for super admin - includes drafts)
 */
export const getAllManuals = query(async () => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		const { data: manuals, error } = await supabase
			.from('manuals')
			.select(
				`
				*,
				profiles!manuals_author_id_fkey (
					id,
					username,
					image_url
				)
			`
			)
			.order('display_order', { ascending: true })
			.order('created_at', { ascending: false });

		if (error) {
			console.error('[getAllManuals] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση εγχειριδίων',
				manuals: []
			};
		}

		// Get read counts for each manual
		const { data: readCounts, error: countError } = await supabase
			.from('manual_reads')
			.select('manual_id');

		if (countError) {
			console.error('[getAllManuals] Read count error:', countError);
		}

		// Count reads per manual
		const readCountMap = new Map<number, number>();
		readCounts?.forEach((r) => {
			const current = readCountMap.get(r.manual_id) || 0;
			readCountMap.set(r.manual_id, current + 1);
		});

		// Merge read counts
		const manualsWithStats =
			manuals?.map((manual) => ({
				...manual,
				read_count: readCountMap.get(manual.id) || 0
			})) || [];

		return {
			success: true,
			message: 'Επιτυχής ανάκτηση εγχειριδίων',
			manuals: manualsWithStats
		};
	} catch (err) {
		console.error('[getAllManuals] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα',
			manuals: []
		};
	}
});

/**
 * Get single manual by ID (for all authenticated users - only if published)
 */
export const getManualById = query(manualIdSchema, async ({ id }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		const { data: manual, error } = await supabase
			.from('manuals')
			.select(
				`
				*,
				profiles!manuals_author_id_fkey (
					id,
					username,
					image_url
				)
			`
			)
			.eq('id', id)
			.eq('published', true)
			.single<ManualWithAuthor>();

		if (error || !manual) {
			console.error('[getManualById] Error:', error);
			return {
				success: false,
				message: 'Το εγχειρίδιο δεν βρέθηκε',
				manual: null
			};
		}

		// Check if user has read this manual
		const { data: readRecord, error: readError } = await supabase
			.from('manual_reads')
			.select('read_at')
			.eq('user_id', user.id)
			.eq('manual_id', id)
			.maybeSingle();

		if (readError) {
			console.error('[getManualById] Read status error:', readError);
		}

		const manualWithReadStatus: ManualWithDetails = {
			...manual,
			is_read: !!readRecord,
			read_at: readRecord?.read_at || null
		};

		return {
			success: true,
			message: 'Επιτυχής ανάκτηση εγχειριδίου',
			manual: manualWithReadStatus
		};
	} catch (err) {
		console.error('[getManualById] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα',
			manual: null
		};
	}
});







// =============================================
// COMMANDS - Write Operations
// =============================================

/**
 * Publish a manual (super admin only)
 */
export const publishManual = command(manualIdSchema, async ({ id }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		const { error } = await supabase
			.from('manuals')
			.update({
				published: true,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) {
			console.error('[publishManual] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά τη δημοσίευση εγχειριδίου'
			};
		}

		return {
			success: true,
			message: 'Το εγχειρίδιο δημοσιεύτηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[publishManual] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});

/**
 * Unpublish a manual (super admin only)
 */
export const unpublishManual = command(manualIdSchema, async ({ id }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		const { error } = await supabase
			.from('manuals')
			.update({
				published: false,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) {
			console.error('[unpublishManual] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την απόσυρση εγχειριδίου'
			};
		}

		return {
			success: true,
			message: 'Το εγχειρίδιο αποσύρθηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[unpublishManual] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});

/**
 * Mark a manual as read (for any authenticated user)
 */
export const markManualAsRead = command(manualIdSchema, async ({ id }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Check if already read (upsert won't fail but let's be efficient)
		const { data: existingRead, error: checkError } = await supabase
			.from('manual_reads')
			.select('id')
			.eq('user_id', user.id)
			.eq('manual_id', id)
			.maybeSingle();

		if (checkError) {
			console.error('[markManualAsRead] Check error:', checkError);
		}

		if (existingRead) {
			return {
				success: true,
				message: 'Το εγχειρίδιο είναι ήδη σημειωμένο ως αναγνωσμένο'
			};
		}

		// Insert new read record
		const { error } = await supabase.from('manual_reads').insert({
			user_id: user.id,
			manual_id: id
		});

		if (error) {
			console.error('[markManualAsRead] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά τη σήμανση ως αναγνωσμένο'
			};
		}

		return {
			success: true,
			message: 'Το εγχειρίδιο σημειώθηκε ως αναγνωσμένο'
		};
	} catch (err) {
		console.error('[markManualAsRead] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});

/**
 * Update display order for multiple manuals (super admin only)
 */
const updateDisplayOrderSchema = z.object({
	orders: z.array(
		z.object({
			id: z.number().int().positive(),
			display_order: z.number().int()
		})
	)
});

export const updateManualsOrder = command(updateDisplayOrderSchema, async ({ orders }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		// Update each manual's display order
		const updates = orders.map((order) =>
			supabase
				.from('manuals')
				.update({ display_order: order.display_order })
				.eq('id', order.id)
		);

		await Promise.all(updates);

		return {
			success: true,
			message: 'Η σειρά εμφάνισης ενημερώθηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[updateManualsOrder] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});

// =============================================
// FORMS - File Upload Operations
// =============================================

/**
 * Create a new manual with media upload (super admin only)
 */
export const createManual = form(createManualFormSchema, async (manualData) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only
		let mediaUrls: string[] = [];
		// Handle media uploads
		if (manualData.media && manualData.media.length > 0) {
			for (const file of manualData.media) {
				const fileExt = file.name.split('.').pop();
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
				const filePath = `manual_images/${fileName}`;

				const { data: uploadData, error: uploadError } = await supabase.storage
					.from(STORAGE_BUCKET)
					.upload(filePath, file, {
						cacheControl: '3600',
						upsert: false
					});

				if (uploadError) {
					console.error('[createManual] Upload error:', uploadError);
					// Cleanup already uploaded files
					if (mediaUrls.length > 0) {
						const paths = mediaUrls
							.map((url) => url.split(`/${STORAGE_BUCKET}/`)[1])
							.filter(Boolean) as string[];
						await supabase.storage.from(STORAGE_BUCKET).remove(paths);
					}
					return {
						success: false,
						message: 'Σφάλμα κατά την μεταφόρτωση αρχείου.'
					};
				}

				const { data: urlData } = supabase.storage
					.from(STORAGE_BUCKET)
					.getPublicUrl(uploadData.path);

				mediaUrls.push(urlData.publicUrl);
			}
		}

		// Insert manual
		const { error: insertError } = await supabase.from('manuals').insert({
			title: manualData.title,
			description: manualData.description || null,
			content: manualData.content,
			category: manualData.category,
			media: mediaUrls,
			author_id: user.id,
			published: manualData.published,
			display_order: manualData.display_order ?? 0
		});

		if (insertError) {
			console.error('[createManual] Insert error:', insertError);
			// Cleanup uploaded files on DB error
			if (mediaUrls.length > 0) {
				const paths = mediaUrls
					.map((url) => url.split(`/${STORAGE_BUCKET}/`)[1])
					.filter(Boolean) as string[];
				await supabase.storage.from(STORAGE_BUCKET).remove(paths);
			}
			return {
				success: false,
				message: 'Σφάλμα κατά τη δημιουργία εγχειριδίου.'
			};
		}

		return {
			success: true,
			message: 'Το εγχειρίδιο δημιουργήθηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[createManual] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα κατά τη δημιουργία εγχειριδίου.'
		};
	}
});

/**
 * Edit an existing manual with media management (super admin only)
 */
export const editManual = form(editManualFormSchema, async (manualData) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		// Get current manual media
		const { data: currentManual } = await supabase
			.from('manuals')
			.select('media')
			.eq('id', manualData.id)
			.single();

		if (!currentManual) {
			return { success: false, message: 'Το εγχειρίδιο δεν βρέθηκε.' };
		}

		const currentMedia = (currentManual.media as string[]) || [];

		// Parse which existing media to keep
		const existingMediaToKeep: string[] = manualData.existingMedia
			? JSON.parse(manualData.existingMedia)
			: [];

		// Find media to delete
		const mediaToDelete = currentMedia.filter((url) => !existingMediaToKeep.includes(url));

		// Delete removed media from storage
		if (mediaToDelete.length > 0) {
			const pathsToDelete = mediaToDelete
				.filter((url) => url.includes(STORAGE_BUCKET))
				.map((url) => url.split(`/${STORAGE_BUCKET}/`)[1])
				.filter(Boolean) as string[];

			if (pathsToDelete.length > 0) {
				await supabase.storage.from(STORAGE_BUCKET).remove(pathsToDelete);
			}
		}

		// Upload new media
		let newMediaUrls: string[] = [];

		if (manualData.newMedia && manualData.newMedia.length > 0) {
			for (const file of manualData.newMedia) {
				const fileExt = file.name.split('.').pop();
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

				const { data: uploadData, error: uploadError } = await supabase.storage
					.from(STORAGE_BUCKET)
					.upload(`manual_images/${fileName}`, file, {
						cacheControl: '3600',
						upsert: false
					});

				if (uploadError) {
					console.error('[editManual] Upload error:', uploadError);
					// Cleanup newly uploaded files on error
					if (newMediaUrls.length > 0) {
						const paths = newMediaUrls
							.map((url) => url.split(`/${STORAGE_BUCKET}/`)[1])
							.filter(Boolean) as string[];
						await supabase.storage.from(STORAGE_BUCKET).remove(paths);
					}
					return { success: false, message: 'Σφάλμα κατά την μεταφόρτωση αρχείου.' };
				}

				const { data: urlData } = supabase.storage
					.from(STORAGE_BUCKET)
					.getPublicUrl(uploadData.path);

				newMediaUrls.push(urlData.publicUrl);
			}
		}

		// Combine: existing media to keep + newly uploaded media
		const finalMediaUrls = [...existingMediaToKeep, ...newMediaUrls];

		// Update manual
		const { error: updateError } = await supabase
			.from('manuals')
			.update({
				title: manualData.title,
				description: manualData.description || null,
				content: manualData.content,
				category: manualData.category,
				media: finalMediaUrls,
				published: manualData.published,
				display_order: manualData.display_order ?? undefined,
				updated_at: new Date().toISOString()
			})
			.eq('id', manualData.id);

		if (updateError) {
			console.error('[editManual] Update error:', updateError);
			return { success: false, message: 'Σφάλμα κατά την ενημέρωση εγχειριδίου.' };
		}

		return { success: true, message: 'Το εγχειρίδιο ενημερώθηκε επιτυχώς' };
	} catch (err) {
		console.error('[editManual] Unexpected error:', err);
		return { success: false, message: 'Απρόσμενο σφάλμα κατά την ενημέρωση.' };
	}
});

/**
 * Delete a manual and its media (super admin only)
 */
export const deleteManual = command(deleteManualSchema, async ({ id }) => {
	const supabase = createServerClient();

	try {
		await getUserProfileWithRoleCheck([1]); // super_admin only

		// Get manual to check for media
		const { data: manual } = await supabase
			.from('manuals')
			.select('media')
			.eq('id', id)
			.single();

		// Delete associated media from storage
		if (manual?.media && Array.isArray(manual.media) && manual.media.length > 0) {
			const pathsToDelete = (manual.media as string[])
				.filter((url) => url.includes(STORAGE_BUCKET))
				.map((url) => url.split(`/${STORAGE_BUCKET}/`)[1])
				.filter(Boolean) as string[];

			if (pathsToDelete.length > 0) {
				await supabase.storage.from(STORAGE_BUCKET).remove(pathsToDelete);
			}
		}

		// Delete manual from database (manual_reads cascade automatically)
		const { error } = await supabase.from('manuals').delete().eq('id', id);

		if (error) {
			console.error('[deleteManual] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά τη διαγραφή εγχειριδίου'
			};
		}

		return {
			success: true,
			message: 'Το εγχειρίδιο διαγράφηκε επιτυχώς'
		};
	} catch (err) {
		console.error('[deleteManual] Unexpected error:', err);
		return {
			success: false,
			message: 'Απρόσμενο σφάλμα'
		};
	}
});
