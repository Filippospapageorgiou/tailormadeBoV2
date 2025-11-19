import { createServerClient } from './server';
import { requireAuthenticatedUser } from './shared';
import type { Profile } from '$lib/models/database.types';
import { error, redirect } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export function generateVerificationCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code via email
export async function sendVerificationCode(email: string) {
	try {
		const supabase = createServerClient();
		const code = generateVerificationCode();
		const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds from now
		const expiresAtISO = expiresAt.toISOString();

		// Store in database
		const { error: dbError } = await supabase.from('verification_codes').insert({
			email,
			code,
			expires_at: expiresAtISO
		});

		if (dbError) {
			console.error('Database error:', dbError);
			throw new Error('Failed to store verification code');
		}

		const { error: emailError } = await resend.emails.send({
			from: 'Tailor Made  <team@tailormadebov2.app>',
			to: [email],
			subject: 'Your verification code',
			html: `
				<h2>Verification Code</h2>
				<p>Your verification code is:</p>
				<h1 style="font-size: 32px; font-weight: bold; letter-spacing: 2px;">${code}</h1>
				<p>This code expires in 60 seconds.</p>
			`
		});

		if (emailError) {
			console.error('Email error:', emailError);
			throw new Error('Failed to send verification email');
		}

		return { success: true, message: 'Verification code sent' };
	} catch (error) {
		console.error('=== sendVerificationCode ERROR ===');
		console.error('Error:', error);
		throw error;
	}
}

export async function verifyCode(email: string, code: string) {
	try {
		const supabase = createServerClient();
		const { data, error } = await supabase
			.from('verification_codes')
			.select('*')
			.eq('email', email)
			.eq('code', code)
			.eq('is_used', false)
			.single();

		if (error || !data) {
			console.log('Error or no data found:', error?.message || 'No matching record');
			return { success: false, message: 'Invalid code' };
		}

		// Check if code expired
		const now = new Date();
		const expiresAt = new Date(data.expires_at);

		if (now.getTime() > expiresAt.getTime()) {
			return { success: false, message: 'Code has expired' };
		}

		// Mark code as used
		await supabase.from('verification_codes').update({ is_used: true }).eq('id', data.id);

		return { success: true, message: 'Code verified' };
	} catch (error) {
		console.error('Error verifying code:', error);
		throw error;
	}
}

export async function verifyEmail(email: string): Promise<boolean> {
	try {
		const supabase = createServerClient();

		const { data: exists, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('email', email)
			.maybeSingle();

		if (exists) {
			console.log('Email exists in profiles');
			return true;
		}

		return false;
	} catch (error) {
		console.error('=== verifyEmail ERROR ===');
		console.error('Error verifying email:', error);
		throw error;
	}
}
