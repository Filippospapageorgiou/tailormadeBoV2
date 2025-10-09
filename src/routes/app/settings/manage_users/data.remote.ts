import { query, command, form } from "$app/server";
import { createServerClient,  } from "$lib/supabase/server";
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from "$lib/models/database.types";
import { z } from 'zod/v4'

// ======================== QUERIES ==============

export const getAllUserFromOrg = query(async () => {
    const supabase = createServerClient();
    const user =  await requireAuthenticatedUser();

    // get orgId from admin user
    const { data:orgId , error:orgIdError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
    if(orgIdError){
        console.error('Error fecthing users orgId: ',orgIdError);
        return {
            success: false,
            message:'An error occured try again later'
        };
    }

    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select(`
                    *,
                role_types!role_id(role_name)
            `)
        .eq('org_id', orgId.org_id);

    const flattenedUsers: Profile[] = users?.map(user => ({...user,
        role_name: user.role_types?.role_name || ''
    })) || [];
    

    if(userError){
        console.error('Error fetching user from organization: ',userError)
        return {
            success: false,
            message:'An error occured while trying to read users'
        };
    }

    //get Role types for updating users and so on
    const { data:roleTypes, error:roleTypesError } = await supabase
        .from('role_types')
        .select('*');
    
    
    if(roleTypesError){
        console.error('Error fetching role types: ',roleTypesError)
        return {
            success: false,
            message:'An error occured while trying to read role types'
        };
    }

    return {
        success:true,
        message:'Success reading data from database',
        flattenedUsers,
        roleTypes
    };
    
})