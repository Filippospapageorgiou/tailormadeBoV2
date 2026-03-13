import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

const manualIdSchema = z.coerce.number().int().positive();

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { id } = params;

	const validateId = manualIdSchema.safeParse(id);

	if (!validateId.success) {
		throw error(400, 'Invalid manual ID');
	}

	const { data: manual, error: manualError } = await supabase
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
		.eq('id', validateId.data)
		.eq('published', true)
		.single();

	if (manualError || !manual) {
		console.error('Error fetching manual:', manualError);
		throw error(404, 'Manual not found');
	}

	return {
		manual
	};
};
