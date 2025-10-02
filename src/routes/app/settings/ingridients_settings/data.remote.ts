import { form, query } from '$app/server'
import { createAdminClient, createServerClient } from '$lib/supabase/server'
import type { Provider } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Ingredient } from '$lib/models/database.types';
import { z } from 'zod/v4'

export const getIngridients = query(async ( ) => {
    const supabase = createServerClient();

    const { data: Ingredient, error } = await supabase
    .from('ingredients')
    .select(`
        *,
        recipe_ingredients!left(count)
    `)
    .order('category')
    .overrideTypes<Ingredient[]>();

    const total:number = Ingredient?.length || 0;

  if (error) {
    console.error('Error fetching ingridients ', error);
    return {
        success: false,
        message:'Error while trying to fetch ingridients',
    }
  }

  return {
    success : true,
    ingredients: Ingredient ?? [],
    total : total
  };
})