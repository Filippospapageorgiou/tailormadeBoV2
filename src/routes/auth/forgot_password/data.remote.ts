import { Resend } from 'resend';
import { command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import z from 'zod';
import { sendVerificationCode, verifyEmail, verifyCode } from '$lib/supabase/verification';

const EmailSchema = z.object({
	email: z.email().trim()
});

export const resendEmail = form(EmailSchema, async ({ email }) => {
	try {
		let send = await sendVerificationCode(email);
		if (!send.success) {
			console.error('Error resending email: ', send.message);
			return {
				success: false,
				message: 'Error resending email try again'
			};
		}
		return {
			success: true,
			message: `Code has been sent to : ${email}`
		};
	} catch (error) {
		console.error('Error resending email: ', error);
		return {
			success: false,
			message: 'Error resending email try again'
		};
	}
});

export const verifyEmailForm = form(EmailSchema, async ({ email }) => {
	try {
		let verify = await verifyEmail(email);
		if (verify) {
			await sendVerificationCode(email);
			console.log(`${email} exists`);
			return {
				success: true,
				message: `Code has been sent to : ${email}`
			};
		}
		return {
			success: false,
			message: `Email ${email} doesnt exists`
		};
	} catch (error) {
		console.error('Error verifying email: ', error);
		return {
			success: false,
			message: 'Error veryfiyng email try again'
		};
	}
});

const EmailSchemaVerify = z.object({
	email: z.email().trim(),
	code: z.string()
});

export const verifyCodeForm = form(EmailSchemaVerify, async ({ email, code }) => {
	try {
		const verify = await verifyCode(email, code);
		if (!verify.success) {
			console.log('Verification failed:', verify.message);
			return {
				success: false,
				message: verify.message
			};
		}

		return {
			success: true,
			message: 'Code verified successfully'
		};
	} catch (error) {
		return {
			success: false,
			message: 'Error verifying code try again'
		};
	}
});
