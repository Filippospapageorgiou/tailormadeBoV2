import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  console.log('========== CONFIRM ENDPOINT START ==========');
  console.log('Confirm endpoint hit');
  console.log('url: ', url);
  
  const token_hash = url.searchParams.get('token_hash')
  console.log('token_hash extracted:', token_hash);
  
  const type = url.searchParams.get('type') as EmailOtpType | null
  console.log('type extracted:', type);
  
  const next = url.searchParams.get('next') ?? '/'
  console.log('next extracted:', next);

  /**
   * Clean up the redirect URL by deleting the Auth flow parameters.
   *
   * `next` is preserved for now, because it's needed in the error case.
   */
  const redirectTo = new URL(url)
  console.log('redirectTo created from url:', redirectTo.toString());
  
  redirectTo.pathname = next
  console.log('redirectTo pathname set to:', next);
  console.log('redirectTo after pathname change:', redirectTo.toString());
  
  redirectTo.searchParams.delete('token_hash')
  console.log('token_hash removed from redirectTo');
  
  redirectTo.searchParams.delete('type')
  console.log('type removed from redirectTo');
  console.log('redirectTo after cleanup:', redirectTo.toString());

  console.log('========== CHECKING token_hash && type ==========');
  console.log('token_hash truthy?', !!token_hash);
  console.log('type truthy?', !!type);
  console.log('Both truthy?', !!(token_hash && type));

  if (token_hash && type) {
    console.log('========== INSIDE IF BLOCK - Attempting verifyOtp ==========');
    console.log('Calling supabase.auth.verifyOtp with:', { type, token_hash });
    
    try {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash })
      console.log('========== VERIFY OTP RESPONSE ==========');
      console.log('error object:', error);
      console.log('error is null/undefined?', !error);
      
      if (!error) {
        console.log('========== NO ERROR - SUCCESS PATH ==========');
        redirectTo.searchParams.delete('next')
        console.log('next removed from redirectTo');
        console.log('Final redirectTo:', redirectTo.toString());
        console.log('Redirecting to:', redirectTo.toString());
        redirect(303, redirectTo)
      } else {
        console.log('========== ERROR EXISTS - ERROR PATH ==========');
        console.log('Error details:', {
          message: error.message,
          status: (error as any).status,
          code: (error as any).code
        });
      }
    } catch (err) {
      console.log('========== EXCEPTION CAUGHT ==========');
      console.log('Exception:', err);
      console.log('Exception message:', (err as any).message);
      console.log('Exception stack:', (err as any).stack);
    }
  } else {
    console.log('========== SKIPPED IF BLOCK ==========');
    console.log('token_hash:', token_hash);
    console.log('type:', type);
  }

  console.log('========== FALLING THROUGH TO ERROR ==========');
  redirectTo.pathname = '/auth/error'
  console.log('redirectTo pathname set to: /auth/error');
  console.log('Final redirectTo:', redirectTo.toString());
  console.log('Redirecting to error page:', redirectTo.toString());
  console.log('========== CONFIRM ENDPOINT END ==========');
  redirect(303, redirectTo)
}