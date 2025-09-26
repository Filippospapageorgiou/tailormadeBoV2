import { getRequestEvent } from "$app/server";
import { createServerClient } from "./server";
import { error } from "@sveltejs/kit";


export async function getAuthenticatedUser(){
    const event = getRequestEvent();

    if(!event){
        return null;
    }

    const supabase = createServerClient({ cookies: event.cookies});

    const {
        data: { user }
    } = await supabase.auth.getUser();

    return user;
}

export async function requireAuthenticatedUser() {
	const user = await getAuthenticatedUser();
	if (!user) {
		throw error(401, 'Unauthorized');
	}
	return user;
}