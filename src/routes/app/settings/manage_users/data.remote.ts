import { query, command, form, prerender } from "$app/server";
import { createServerClient, createAdminClient  } from "$lib/supabase/server";
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Profile } from "$lib/models/database.types";
import { z } from 'zod/v4'
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const authenticatedAccess = prerender(async () => {
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

// ======================== COMMANDS ==============

const updateUserRoleSchema = z.object({
    userId: z.string({ error : 'Invalid user ID format' }),
    roleId: z.number().int().positive({ error: 'Role ID must be a positive integer' })
});

export const updateUserRole = command(updateUserRoleSchema, async ({ userId, roleId }) => {
    const supabase = createServerClient();
    try {
        const {error } = await supabase
            .from('profiles')
            .update({ role_id: roleId })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user role:', error);
            return {
                success: false,
                message: 'Failed to update user role'
            };
        }

        return {
            success: true,
            message: 'User role updated successfully'
        };
    } catch (err) {
        console.error('Unexpected error during role update:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while updating user role'
        };
    }
});

const inviteUserEmailschema = z.object({
    email: z.string({error:'invalid email cannog '}).trim().email(),
})

export const inviteUser = query(inviteUserEmailschema, async({ email }) => {
    const supabase = createServerClient();
    const adminClient = createAdminClient();
    const user = await requireAuthenticatedUser();

    try {
        const { data: inviterProfile, error: profileError } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (profileError || !inviterProfile) {
            console.error('Error fetching inviter profile: ', profileError);
            return {
                success: false,
                message: 'Failed to get organization information'
            };
        }

        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
            email,
            {
                data: {
                    invited_at: new Date().toISOString(),
                    org_id: inviterProfile.org_id
                }
            }
        );

        if(error){
            console.error('Error inviting user: ', error);
            return {
                success: false,
                message: error.message || 'Failed to invite user'
            };
        }

        return {
            success: true,
            message: 'User invited successfully'
        };

    } catch(error) {
        console.error('Error inviting user: ', error);
        return {
            success: false,
            message: 'An error occurred trying to invite user'
        };
    }
})

const deleteUserSchema = z.object({
    userId: z.string({ error: 'Invalid user ID format' })
});

export const deleteUser = command(deleteUserSchema, async ({ userId }) => {
    const adminClient = createAdminClient();

    try {
        // Delete user from Supabase Auth
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Error deleting user from auth:', authError);
            return {
                success: false,
                message: 'Failed to delete user from authentication system'
            };
        }

        // The profile will be deleted automatically via CASCADE from the database trigger

        return {
            success: true,
            message: 'User deleted successfully'
        };
    } catch (err) {
        console.error('Unexpected error during user deletion:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while deleting user'
        };
    }
});