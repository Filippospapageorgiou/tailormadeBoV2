import { query, form } from "$app/server";
import { createServerClient } from "$lib/supabase/server";
import { requireAuthenticatedUser } from "$lib/supabase/shared";
import type { Profile, Organization } from "$lib/models/database.types";
import type { Supplier, DailyRegisterClosing, 
              RegisterSupplierPayment,
              RegisterExpense } from "$lib/models/register.types";
import z from "zod/v4";
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';


export const authenticatedAccess = query(async () => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();

    const {data , error:profileError} = await supabase
      .from('profiles')
      .select('*')
      .eq('id',user.id)
      .overrideTypes<Profile[]>();

    if(profileError){
      console.error('Error fetching profile info in load time:', profileError);
      error(404,'Not found user info');
    }

    let profile:Profile;

    if(data && data.length > 0)  profile = data[0];
    else error(404,'Not found user info');

    if(!profile.can_close_register){
        return{
            success:false,
            message:'Δεν έχεις προσβάση σε αυτήν την σελίδα περιηγήσου πίσω',
            hasAccess: false,
            profile:null
        }
    }
    return {
        success: true,
        message: 'Επιτυχής πρόσβαση στη σελίδα.',
        hasAccess: true,
        profile,
    };
})

/**
 * Check if today there was a closing in the registry so 
 * it can be another one in the same day
 */

export const checkRegisterToday = query(async () => {
    const supabase = createServerClient();
    const user = await requireAuthenticatedUser();
    try{

        // Get user's org_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single<Pick<Profile, 'org_id'>>();
        
        if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError);
            return {
                success: false,
                message: 'Error fetching user profile',
            };
        }

        // Get today's date
        const today = new Date();
        // If you want to format it as YYYY-MM-DD (for database queries)
        const formattedDate = today.toISOString().split('T')[0];

        const { data:registry, error:registryError } = await supabase
            .from('daily_register_closings')
            .select('*')
            .eq('closing_date',formattedDate)
            .eq('org_id',profile.org_id)
            .maybeSingle<DailyRegisterClosing>();


        if (registryError) {
            console.error('Error fetching register data:', registryError);
            return {
                success: false,
                message: 'Error fetching register data',
            };
        }

        // Return true if a register exists for today
        const hasRegisterToday = Boolean(registry);

        return {
            success: true,
            message:'Επιτυχώς διάβασε το αν υπάρχει ταμείο σήμερα',
            hasRegisterToday,
            date: formattedDate,
        };
    }catch(error){
        console.error('An unexpected error occured trying to get register: ',error);
        return{
            success:false,
            hasRegisterToday:false,
            message:'An unexpected error occured trying to get register',
            date:null
        };
    }
});
