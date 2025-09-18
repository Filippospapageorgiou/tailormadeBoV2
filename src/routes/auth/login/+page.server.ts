import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { loginSchema } from '$lib/schemas/auth';
import { fail,redirect } from '@sveltejs/kit';


export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions = {
	loginWithEmail: async ({request, locals:{supabase}}) => {
        const formData = await request.formData();

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const resultSchema = loginSchema.safeParse({email, password});

        if(!resultSchema.success){
            return fail(400,{
                error:resultSchema.error?.issues?.[0]?.message ?? "",
                email
            })
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if(error){
            return fail(400,{
                error:error.message,
                email
            });
        }

        redirect(303,'/')
	}
} satisfies Actions;
