import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const { id } = params;

  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select(
      `
      *,
      profile:profiles!blogs_author_id_fkey (
        username,
        image_url
      )
    `
    )
    .eq('id', id)
    .single();

  if (blogError) {
    console.error('Error fetching blog:', blogError);
    throw error(404, 'Blog not found');
  }

  return {
    blog,
  };
};