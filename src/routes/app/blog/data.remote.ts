// src/routes/posts/posts.remote.ts
import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import type { Provider } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { Blog } from '$lib/models/database.types';

export const getPosts = query(async ( ) => {
  console.log('Server: getPosts remote function executed.');
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