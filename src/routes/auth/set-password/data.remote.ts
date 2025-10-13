import { form } from "$app/server";
import { createServerClient } from "$lib/supabase/server";
import { z } from 'zod/v4';
import { redirect } from '@sveltejs/kit';

// ======================== SCHEMAS ==============

const setPasswordSchema = z.object({
    password: z.string()
        .min(8, { error: 'Password must be at least 8 characters long' })
        .regex(/[A-Z]/, { error: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { error: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { error: 'Password must contain at least one number' }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword']
});

// ======================== FORMS ==============

export const setPassword = form(setPasswordSchema, async ({ password }) => {
    const supabase = createServerClient();

    try {
        // Get the current user from the session (validated in page.server.ts)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('Error getting user:', userError);
            return {
                success: false,
                message: 'Session expired. Please use your invitation link again.'
            };
        }

        const userId = user.id;
        const userEmail = user.email;
        const userMetadata = user.user_metadata;

        // Double-check if user already has a profile
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (existingProfile) {
            return {
                success: false,
                message: 'Your account has already been set up. Please use the login page.'
            };
        }

        // Get org_id from user metadata (set during invitation)
        const orgId = userMetadata?.org_id;

        if (!orgId) {
            console.error('No org_id found in user metadata');
            return {
                success: false,
                message: 'Invalid invitation. Organization information is missing.'
            };
        }

        // Create profile with default values
        const defaultUsername = userEmail?.split('@')[0] || 'user';
        const defaultImageUrl = 'https://uhrpdmoknmrbosqenotk.supabase.co/storage/v1/object/public/avatars_url/default.png';

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: userEmail,
                username: defaultUsername,
                role: 'employee',
                role_id: 5,
                org_id: orgId,
                image_url: defaultImageUrl
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            return {
                success: false,
                message: 'Failed to create user profile'
            };
        }

        // Update the user's password
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return {
                success: false,
                message: updateError.message || 'Failed to set password'
            };
        }

        // Password set successfully, redirect to app
        redirect(303, '/app');

    } catch (error: any) {
        // Handle redirect
        if (error?.status === 303) {
            throw error;
        }

        console.error('Unexpected error during password setup:', error);
        return {
            success: false,
            message: 'An unexpected error occurred while setting password'
        };
    }
});
