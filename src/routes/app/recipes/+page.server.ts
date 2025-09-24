import type { PageServerLoad } from './$types';

export const load:PageServerLoad = async ({ locals: {supabase}}) => {
    const { data:beverages, error } = await supabase
        .from('beverages')
        .select('*')
        .order('id')
    
    if(error) {
        console.error('Error fetching beverages:', error);
        return { beverages: [] };
    }

    return {
        beverages: beverages ?? []
    };
};