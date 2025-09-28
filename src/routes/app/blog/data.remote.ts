// src/routes/posts/posts.remote.ts
import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import type { Provider } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { Blog } from '$lib/models/database.types';
import { getRequestEvent } from '$app/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from "zod/v4";

const blogIdSchema = z.coerce
.number({ error: 'Blog Id must be a number.'})
.int({ error: 'Blog ID must be an integer.' })
.positive({ error: 'Blog ID must be a positive number.' });


export const getPosts = query(async ( ) => {
 
  const supabase = createServerClient();
  const { data:blogs , error } = await supabase
    .from('blogs')
    .select(`
        *,
        profile:profiles!blogs_author_id_fkey (
            username,
            image_url
        )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .overrideTypes<Blog[]>();   

    if(error){
        console.error('Error fetching blogs: ', error);
        return { blogs: [] };
    }
    return {
        blogs
    };
});

export const readBlog = query(blogIdSchema, async (blogId) => {
  const user = await requireAuthenticatedUser();
  const supabase = createServerClient();

  
  const { data, error } = await supabase
    .from('blog_reads')
    .upsert(
      {
        user_id: user.id,
        blog_id: blogId,
        read_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id,blog_id', // Specify the unique constraint columns
        ignoreDuplicates: false // Update the read_at timestamp even if record exists
      }
    )
    .select();

  if (error) {
    console.error('An error occurred while trying to read blog: ', error);
    return {
      status: 'error',
      message: 'An error occurred while trying to record blog read'
    };
  }

  return {
    status: 'success',
    message: 'Blog read recorded successfully'
  };
});