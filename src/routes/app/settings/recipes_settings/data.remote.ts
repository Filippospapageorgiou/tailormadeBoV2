import { query, command } from "$app/server";
import { createServerClient } from '$lib/supabase/server';
import type { Ingredient, Beverage } from '$lib/models/database.types';
import { z } from 'zod/v4';

export const getBeverages = query(async () => {
    const supabase = createServerClient();

    const { data: beverages, error: beveragesError } = await supabase
    .from('beverages')
    .select('*')
    .order('id')
    .overrideTypes<Beverage[]>();

  if (beveragesError) {
    console.error('Error fetching beverages:', beveragesError);
    return {
        success: false,
        message: 'Error fetching beverages', 
        beverages: [] , 
        totalBeverages: 0 
    };
  }

  return {
    success : true,
    beverages: beverages ?? [],
    totalBeverages: beverages.length
  }
})