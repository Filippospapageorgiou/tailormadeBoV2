import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { z } from "zod/v4";

const blogIdSchema = z.coerce
.number({ error: 'Blog Id must be a number.'})
.int({ error: 'Blog ID must be an integer.' })
.positive({ error: 'Blog ID must be a positive number.' });

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const { id } = params;

  const validateId = blogIdSchema.safeParse(id);

  if (!validateId.success) {
    const errorMessage = validateId.error;
    throw error(400, errorMessage);
  }

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