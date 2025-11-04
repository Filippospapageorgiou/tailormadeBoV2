import { query, command, form, prerender } from "$app/server";
import { createServerClient, createAdminClient  } from "$lib/supabase/server";
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from "$lib/models/database.types";
import { z } from 'zod/v4'
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

    if(profile.role_id !== 1 && profile.role_id !== 2){
      throw redirect(308,'/app')
    }
    return { profile };
})
