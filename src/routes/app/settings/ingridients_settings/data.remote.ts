import { command, query } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import type { Ingredient } from '$lib/models/database.types';
import { z } from 'zod/v4';

export const getIngridients = query(async () => {
	const supabase = createServerClient();

	const { data: Ingredient, error } = await supabase
		.from('ingredients')
		.select(
			`
        *,
        recipe_ingredients!left(count)
    `
		)
		.order('category', {ascending : false})
		.overrideTypes<Ingredient[]>();

	const total: number = Ingredient?.length || 0;

	if (error) {
		console.error('Error fetching ingridients ', error);
		return {
			success: false,
			message: 'Error while trying to fetch ingridients'
		};
	}

	return {
		success: true,
		ingredients: Ingredient ?? [],
		total: total
	};
});

const deleteIngridientId = z.object({
	ingridientId: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(
			z
				.number()
				.int({ message: 'Ingredient ID must be an integer.' })
				.positive({ message: 'Ingredient ID must be a positive number.' })
		)
});

export const deleteIngredient = command(deleteIngridientId, async ({ ingridientId }) => {
	const supabase = createServerClient();

	const { error } = await supabase.from('ingredients').delete().eq('id', ingridientId);

	if (error) {
		console.error('Error deleting ingredient:', error);
		return {
			success: false,
			message: 'An error occurred trying to delete ingredient'
		};
	}

	return {
		success: true,
		message: 'Ingredient deleted successfully'
	};
});

const editIngredientSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().min(1, { error: 'Name is required' }),
	category: z.string().min(1, {error: 'Category is required'}),
	measurement_unit: z.string().min(1, {error: 'measurment unit is required'}),
	description: z.string().optional()
});

export const editIngredient = command(editIngredientSchema, async (ingredientData) => {
	const supabase = createServerClient();

	const { error } = await supabase
		.from('ingredients')
		.update({
			name: ingredientData.name,
			category: ingredientData.category,
			measurement_unit: ingredientData.measurement_unit,
			description: ingredientData.description
		})
		.eq('id', ingredientData.id);

	if (error) {
		console.error('Error updating ingredient:', error);
		return {
			success: false,
			message: 'An error occurred trying to update the ingredient'
		};
	}

	return {
		success: true,
		message: 'Ingredient updated successfully'
	};
});

const addIngredientSchema = z.object({
	name: z.string().min(1, { message: 'Name is required' }),
	category: z.string().min(1, {error: 'Category is required'}),
	measurement_unit: z.string().min(1, {error: 'measurment unit is required'}),
	description: z.string().optional()
});

export const addIngredient = command(addIngredientSchema, async (ingredientData) => {
	const supabase = createServerClient();

	const { error } = await supabase.from('ingredients').insert({
		name: ingredientData.name,
		category: ingredientData.category,
		measurement_unit: ingredientData.measurement_unit,
		description: ingredientData.description
	});

	if (error) {
		console.error('Error adding ingredient:', error);
		return {
			success: false,
			message: 'An error occurred trying to add the ingredient'
		};
	}

	return {
		success: true,
		message: 'Ingredient added successfully'
	};
});