import type { PageServerLoad } from './$types';
import type { Beverage } from '$lib/models/database.types';
import { error } from '@sveltejs/kit'

export const load:PageServerLoad = async({ params, locals: {supabase}}) => {
    const id = Number(params.id);
    if(isNaN(id)){ throw error(404, { message: 'Not found'}); }

    const { data: beverage, error: beverageError } = await supabase
        .from('beverages')
        .select('*')
        .eq('id', id)
        .single<Beverage>();

    if (beverageError) {
        console.error('Error fetching beverage:', beverageError);
        return {
            beverage: null,
            recipeIngredients: []
        };
    }

    const { data: recipeIngredients, error: ingredientError } = await supabase
            .from('recipe_ingredients')
            .select(`
                *,
                ingredients(
                    name,
                    measurement_unit
                )
            `)
            .eq('beverage_id', id);
    
    if(ingredientError){
        console.error('Error fetching recipe ingredients: ', ingredientError);
        return {
            beverage,
            recipeIngredients: [] 
        }
    }
    return {
        beverage,
        recipeIngredients
    }

}