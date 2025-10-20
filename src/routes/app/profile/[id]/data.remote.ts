import { form, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { createAdminClient, createServerClient } from '$lib/supabase/server';
import type { Provider } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from "zod/v4";

const usernameSchema = z.object({username :z
    .string({ error: 'Username is required.' })
    .min(3, { error: 'Username must be at least 3 characters long.' })
    .max(30, { error: 'Username must not exceed 30 characters.' })
    .regex(/^[a-zA-Z0-9_-]+$/, { 
      error: 'Username can only contain letters, numbers, underscores, and hyphens.' 
    })
    .toLowerCase()
    .trim()
});


export const updateUsername = form(usernameSchema,async ({ username }) => {
    const user = await requireAuthenticatedUser();
    const supabase = createServerClient();
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (checkError) {
      return {
        success: false,
        message: 'Database error checking username availability'
      }
    }

    if (existing) {
      return {
        success: false,
        message: 'Username has already been taken'
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: 'An error occurred while trying to update username'
      }
    }

    return { success: true };
  }
);

const avatarFormSchema = z.object({
  avatar: z.instanceof(File, { message: 'Please upload a file.' })
    .refine(file => file.size > 0, 'File cannot be empty.')
    .refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type), 
      'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
    ),
});

export const updateAvatar = form(avatarFormSchema, async ({ avatar }) => {
  const user = await requireAuthenticatedUser();
  const supabase = createServerClient();

  try {
    // Get current profile to check for existing avatar
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('image_url')
      .eq('id', user.id)
      .single<Pick<import('$lib/models/database.types').Profile, 'image_url'>>();

    if (profileError) {
      console.error('Error fetching current profile:', profileError);
      return {
        success: false,
        message: 'Failed to fetch current profile'
      };
    }

    // Delete old avatar if it exists (except default images)
    if (currentProfile?.image_url && currentProfile.image_url.includes('avatars_url')) {
      const oldPath = currentProfile.image_url.split('/avatars_url/')[1];
      if (oldPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars_url')
          .remove([oldPath]);

        if (deleteError) {
          console.warn('Failed to delete old avatar:', deleteError);
          // Continue anyway - not critical
        }
      }
    }

    // Generate unique filename to avoid collisions
    const fileExt = avatar.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload new avatar
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars_url')
      .upload(filePath, avatar, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return {
        success: false,
        message: 'Failed to upload avatar'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars_url')
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ image_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Try to clean up uploaded file
      const { error: cleanupError } = await supabase.storage
        .from('avatars_url')
        .remove([filePath]);

      if (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }

      return {
        success: false,
        message: 'Failed to update profile with new avatar'
      };
    }

    return {
      success: true,
      imageUrl: publicUrl
    };
  } catch (err) {
    console.error('Unexpected error during avatar update:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while updating avatar'
    };
  }
});