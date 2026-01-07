import { query, command, form, prerender } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { error, redirect } from '@sveltejs/kit';
import type { Organization } from '$lib/models/database.types';
import { getUserOrgId, getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';

export const authenticatedAccess = query(async () => {
    const profile = await getUserProfileWithRoleCheck([1]);
    return {
        profile,
        success: true
    };
});

export const getAllOrganizations = query(async () => {
    const supabase = createServerClient();
    
    try{

        const { data:organizations, error:organizationError } = await supabase
            .from('core_organizations')
            .select('*')
            .overrideTypes<Organization[]>();
        
        if(organizationError){
            console.error('[getAllOrganizations] Error fetching all organizations: ',organizationError);
            return{
                success:false,
                message:'Σφάλμα κάτα την ανάκτηση οργανισμών',
                organizations: []
            }
        }   

        return{
            success:true,
            message:'Επιτυχής ανάκτηση οργανισμών',
            organizations:organizations ?? []
        }
    }catch(err){
        console.error('[getAllOrganizations] Error fetching all organizations: ',err);
        return{
            success:false,
            message:'Σφάλμα κάτα την ανάκτηση οργανισμών',
            organizations: []
        }
    }
})