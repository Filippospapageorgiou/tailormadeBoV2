import type { PageServerLoad } from './$types';


export const load:PageServerLoad = async({ locals: { supabase }}) => {
    const { data: blog , error: BlogError } = await supabase
        .from('blogs')
        .select(`
            *,
            profile:profiles!blogs_author_id_fkey (
                username,
                image_url
            )`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if(BlogError){
        console.error('Error fetching blog:', BlogError);
        return {
            blog:null,
            error: BlogError.message
        };
    }

    return {
        blog: blog || null,
    }
}