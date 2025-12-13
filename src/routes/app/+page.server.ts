import type { PageServerLoad } from './$types';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	const { data: blog, error: BlogError } = await supabase
		.from('blogs')
		.select(
			`
            *,
            profile:profiles!blogs_author_id_fkey (
                username,
                image_url
            )`
		)
		.eq('published', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.single();

	if (BlogError) {
		console.error('Error fetching blog:', BlogError);
		return {
			blog: null,
			tos: null,
			error: BlogError.message
		};
	}

	// --- Check if user has accepted ToS ---
	const { data: tos, error: tosError } = await supabase
		.from('user_term_acceptance')
		.select('*')
		.eq('user_id', user?.id)
		.eq('is_accepted', true)
		.maybeSingle();

	if (tosError) {
		console.error('Error fetching Terms of acceptance:', tosError);
		return {
			blog,
			tos: null,
			error: tosError.message
		};
	}

	const tosFlag = user?.id ? !!tos : false;

	return {
		blog: blog || null,
		tos: tosFlag
	};
};

export const actions = {
	acceptTerms: async ({ request, locals: { supabase, user } }) => {
		const data = await request.formData();
		const accept = data.get('accept');

		if (accept !== 'accept' || !user?.id) {
			return {
				success: false,
				error: 'Invalid request'
			};
		}

		const { error } = await supabase.from('user_term_acceptance').insert({
			user_id: user.id,
			is_accepted: true,
			created_at: new Date().toISOString()
		});

		if (error) {
			console.error('Error saving ToS acceptance:', error);
			return {
				success: false,
				error: error.message
			};
		}

		return {
			success: true
		};
	}
} satisfies Actions;
