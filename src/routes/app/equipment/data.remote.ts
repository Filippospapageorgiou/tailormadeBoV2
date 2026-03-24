// src/routes/posts/posts.remote.ts
import { query } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import type { Equipment } from '$lib/models/equipment.types';
import { getUserOrgId } from '$lib/supabase/queries';
import { optimizeImage } from '$lib/image';

export const getAllEquipments = query(async () => {
	const supabase = createServerClient();
	const orgId = await getUserOrgId();
	try {
		const { data: equipments, error } = await supabase
			.from('equipment')
			.select('*')
			.eq('org_id', orgId)
			.order('id', { ascending: false })
			.overrideTypes<Equipment[]>();

		if (error) {
			console.error('Error fetching equipments: ', error);
			return {
				success: false,
				total: 0,
				message: 'Error fetching equipments',
				equipments: []
			};
		}

		// Optimize images through Vercel Image Optimization (resize + WebP/AVIF)
		const optimizedEquipments = (equipments || []).map((e) => ({
			...e,
			image_url: optimizeImage(e.image_url, 400, 75)
		}));

		return {
			success: true,
			total: optimizedEquipments.length || 0,
			message: 'Equipments fetched successfully',
			equipments: optimizedEquipments
		};
	} catch (error) {
		console.error('Error fetching equipments: ', error);
		return {
			success: false,
			message: 'Error fetching equipments',
			equipments: []
		};
	}
});
