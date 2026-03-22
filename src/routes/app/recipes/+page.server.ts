import type { PageServerLoad } from './$types';
import { optimizeImage } from '$lib/image';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders }) => {
	// Cache the page for 1 hour — returning users won't re-fetch the beverage list
	setHeaders({
		'cache-control': 'public, max-age=3600, s-maxage=600'
	});

	const { data: beverages, error } = await supabase
		.from('beverages')
		.select('id, name, description, execution, image_url, public')
		.eq('public', true)
		.order('id');

	if (error) {
		console.error('Error fetching beverages:', error);
		return { beverages: [] };
	}

	// 640px wide @ quality 90 — sharp enough for retina grid cards, still ~4x smaller than full res
	const transformedBeverages = (beverages ?? []).map((b) => ({
		...b,
		image_url: optimizeImage(b.image_url)
	}));

	return {
		beverages: transformedBeverages
	};
};
