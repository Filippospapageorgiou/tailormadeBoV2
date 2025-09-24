import type { PageServerLoad } from './$types';

export const load:PageServerLoad = async({ locals: {supabase} }) => {
    const {data:blogs, error} = await supabase
        .from('blogs')
        .select(`
            *,
            profile:profiles!blogs_author_id_fkey (
                username,
                image_url
            )
        `)
        .eq('published',true)
        .order('created_at', {ascending : false});

    if(error){
        console.error('Error fetching blogs: ', error);
        return { blogs: [] };
    }
    console.log(blogs)
    return {
        blogs
    };
}