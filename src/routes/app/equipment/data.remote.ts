// src/routes/posts/posts.remote.ts
import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import type { Provider } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { Equipment, MaintenanceLog } from '$lib/models/equipment.types';
import { z } from 'zod/v4';

export const getAllEquipments = query(async () => {
	const supabase = createServerClient();
	try {
		const { data: equipments, error } = await supabase
			.from('equipment')
			.select('*')
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

		return {
			success: true,
			total: equipments.length || 0,
			message: 'Equipments fetched successfully',
			equipments
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
