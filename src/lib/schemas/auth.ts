import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email('please enter a valid address'),
	password: z.string().min(4, 'password must at least be 4 characters')
});

export const signupSchema = z
	.object({
		email: z.email('Please enter a valid email address'),
		password: z.string().min(4, 'Password must be at least 4 characters'),
		confirmPassword: z.string().min(4, 'Password must be at least 4 characters')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
