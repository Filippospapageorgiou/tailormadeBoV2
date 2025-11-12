import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  console.log('========== CONFIRM ENDPOINT START ==========');
  console.log('Confirm endpoint hit');
  console.log('URL:', url.toString());
  
  // Extract parameters from URL
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/'

  console.log('Parameters extracted:');
  console.log('  token_hash:', token_hash);
  console.log('  type:', type);
  console.log('  next:', next);

  // Validate parameters exist
  if (!token_hash || !type) {
    console.log('========== ERROR: MISSING PARAMETERS ==========');
    console.log('token_hash missing:', !token_hash);
    console.log('type missing:', !type);
    redirect(303, '/auth/error?error=missing_parameters');
  }

  try {
    console.log('========== ATTEMPTING OTP VERIFICATION ==========');
    console.log('Calling supabase.auth.verifyOtp with:');
    console.log('  type:', type);
    console.log('  token_hash:', token_hash);

    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
    
    console.log('========== OTP VERIFICATION RESPONSE ==========');
    console.log('Error:', error);
    console.log('User:', data?.user?.email);
    console.log('Session created:', !!data?.session);

    // Handle verification error
    if (error) {
      console.log('========== VERIFICATION FAILED ==========');
      console.log('Error message:', error.message);
      console.log('Error code:', (error as any).code);
      console.log('Error status:', (error as any).status);
      
      const errorCode = (error as any).code || 'unknown_error';
      console.log('Redirecting to error page with code:', errorCode);
      redirect(303, `/auth/error?error=${errorCode}`);
    }

    // Success - user verified
    if (data?.user) {
      console.log('========== VERIFICATION SUCCESS ==========');
      console.log('User ID:', data.user.id);
      console.log('User email:', data.user.email);
      console.log('User verified:', data.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('Redirecting to:', next);
      console.log('========== CONFIRM ENDPOINT END - REDIRECTING TO NEXT PAGE ==========');
      
      // Redirect to next page (usually /auth/set-password for invites)
      redirect(303, next);
    }

    // No error but also no user - unexpected state
    console.log('========== UNEXPECTED STATE: NO ERROR BUT NO USER ==========');
    redirect(303, '/auth/error?error=no_user_returned');

  } catch (err: any) {
    // Check if it's a SvelteKit redirect (status 303)
    // These should be re-thrown to allow the redirect to happen
    if (err?.status === 303) {
      console.log('========== SVELTEKIT REDIRECT CAUGHT - RE-THROWING ==========');
      console.log('Redirect location:', err.location);
      throw err;
    }

    // Any other error
    console.log('========== UNEXPECTED ERROR CAUGHT ==========');
    console.log('Error type:', err?.constructor?.name);
    console.log('Error message:', err?.message);
    console.log('Error:', err);
    
    redirect(303, '/auth/error?error=verification_exception');
  }
}