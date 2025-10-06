import { query, command, form } from "$app/server";
import { createServerClient } from '$lib/supabase/server';
import type { Beverage, RecipeIngredient } from '$lib/models/database.types';
import { z } from 'zod/v4';

const defaultImageUrl = 'https://uhrpdmoknmrbosqenotk.supabase.co/storage/v1/object/public/beverages/default_url.png';

// ============= QUERIES =============

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
            beverages: [], 
            totalBeverages: 0 
        };
    }

    return {
        success: true,
        beverages: beverages ?? [],
        totalBeverages: beverages?.length ?? 0
    };
});

const beverageIdSchema = z.object({
    beverageId: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(
            z.number()
                .int({ message: 'Beverage ID must be an integer.' })
                .positive({ message: 'Beverage ID must be a positive number.' })
        )
});

export const getBeverageIngredients = query(beverageIdSchema, async ({ beverageId }) => {
    const supabase = createServerClient();

    const { data: recipeIngredients, error } = await supabase
        .from('recipe_ingredients')
        .select(`
            *,
            ingredients (
                id,
                name,
                measurement_unit,
                category
            )
        `)
        .eq('beverage_id', beverageId)
        .order('id')
        .overrideTypes<RecipeIngredient[]>();

    if (error) {
        console.error('Error fetching beverage ingredients:', error);
        return {
            success: false,
            message: 'Error fetching ingredients',
            ingredients: []
        };
    }

    return {
        success: true,
        ingredients: recipeIngredients ?? []
    };
});

// ============= COMMANDS =============

const addBeverageSchema = z.object({
    name: z.string().min(1, { error: 'Name is required' }),
    description: z.string().optional(),
    execution: z.string().min(1, { error: 'Execution is required' }),
    image_url: z.instanceof(File, { error: 'Please upload a file.' })
        .refine(file => file.size > 0, 'File cannot be empty.')
        .refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
        .refine(
            file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
            'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
        )
        .optional(),
});


export const addBeverage = form(addBeverageSchema, async (beverageData) => {
    const supabase = createServerClient();
    try {
        let imageUrl: string = defaultImageUrl; // fallback default

        // If user uploaded an image, upload to Supabase storage
        if (beverageData.image_url && beverageData.image_url instanceof File) {
            const fileExt = beverageData.image_url.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `new/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('beverages')
                .upload(filePath, beverageData.image_url, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return {
                    success: false,
                    message: 'Failed to upload image.'
                };
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('beverages')
                .getPublicUrl(uploadData.path);

            imageUrl = urlData.publicUrl;
        }

        // Insert beverage into DB
        const { error: insertError } = await supabase
            .from('beverages')
            .insert({
                name: beverageData.name,
                description: beverageData.description,
                execution: beverageData.execution,
                image_url: imageUrl // always has a value now
            });

        if (insertError) {
            console.error('Error inserting beverage:', insertError);
            return {
                success: false,
                message: 'Failed to add beverage.'
            };
        }

        return {
            success: true,
            message: 'Beverage added successfully'
        };
    } catch (err) {
        console.error('Unexpected error during add beverage:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while adding beverage.'
        };
    }
});

const editBeverageSchema = z.object({
    id: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(
            z.number()
                .int({ error: 'Beverage ID must be an integer.' })
                .positive({ error: 'Beverage ID must be a positive number.' })
        ),
    name: z.string().min(1, { error: 'Name is required' }),
    description: z.string().optional(),
    execution: z.string().min(1, { error: 'Execution is required' }),
    image_url: z.instanceof(File, { error: 'Please upload a file.' })
        .refine(file => file.size > 0, 'File cannot be empty.')
        .refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
        .refine(
            file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
            'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
        )
        .optional(),
});

export const editBeverage = form(editBeverageSchema, async (beverageData) => {
    const supabase = createServerClient();
    try {
        let imageUrl = undefined;

        if (beverageData.image_url && beverageData.image_url instanceof File) {
            const { data: currentBeverage } = await supabase
                .from('beverages')
                .select('image_url')
                .eq('id', beverageData.id)
                .single();

            if (currentBeverage?.image_url && 
                currentBeverage.image_url.includes('beverages') && 
                !currentBeverage.image_url.includes('default_url')) {
                const oldPath = currentBeverage.image_url.split('/beverages/')[1];
                if (oldPath) {
                    await supabase.storage
                        .from('beverages')
                        .remove([oldPath]);
                }
            }

            const fileExt = beverageData.image_url.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${beverageData.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('beverages')
                .upload(filePath, beverageData.image_url, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return {
                    success: false,
                    message: 'Failed to upload image.'
                };
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('beverages')
                .getPublicUrl(uploadData.path);

            imageUrl = urlData.publicUrl;
        }

        // Update beverage (only update image_url if new image was uploaded)
        const updateData: any = {
            name: beverageData.name,
            description: beverageData.description,
            execution: beverageData.execution
        };

        if (imageUrl) {
            updateData.image_url = imageUrl;
        }

        const { error } = await supabase
            .from('beverages')
            .update(updateData)
            .eq('id', beverageData.id);

        if (error) {
            console.error('Error updating beverage:', error);
            return {
                success: false,
                message: 'An error occurred trying to update the beverage'
            };
        }

        return {
            success: true,
            message: 'Beverage updated successfully'
        };
    } catch (err) {
        console.error('Unexpected error during beverage update:', err);
        return {
            success: false,
            message: 'An unexpected error occurred while updating beverage.'
        };
    }
});

const deleteBeverageSchema = z.object({
    beverageId: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(
            z.number()
                .int({ message: 'Beverage ID must be an integer.' })
                .positive({ message: 'Beverage ID must be a positive number.' })
        )
});

export const deleteBeverage = query(deleteBeverageSchema, async ({ beverageId }) => {
    const supabase = createServerClient();

    const { error } = await supabase
        .from('beverages')
        .delete()
        .eq('id', beverageId);

    if (error) {
        console.error('Error deleting beverage:', error);
        return {
            success: false,
            message: 'An error occurred trying to delete beverage'
        };
    }

    return {
        success: true,
        message: 'Beverage deleted successfully'
    };
});

const addIngredientToBeverageSchema = z.object({
    beverage_id: z.number().int().positive(),
    ingredient_id: z.number().int().positive(),
    quantity: z.number().positive(),
    notes: z.string().optional()
});

export const addIngredientToBeverage = command(addIngredientToBeverageSchema, async (data) => {
    const supabase = createServerClient();

    const { error } = await supabase
        .from('recipe_ingredients')
        .insert({
            beverage_id: data.beverage_id,
            ingredient_id: data.ingredient_id,
            quantity: data.quantity,
            notes: data.notes
        });

    if (error) {
        console.error('Error adding ingredient to beverage:', error);
        return {
            success: false,
            message: 'An error occurred trying to add ingredient to recipe'
        };
    }

    return {
        success: true,
        message: 'Ingredient added to recipe successfully'
    };
});

const removeIngredientFromBeverageSchema = z.object({
    recipeIngredientId: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(
            z.number()
                .int({ message: 'Recipe ingredient ID must be an integer.' })
                .positive({ message: 'Recipe ingredient ID must be a positive number.' })
        )
});

export const removeIngredientFromBeverage = command(removeIngredientFromBeverageSchema, async ({ recipeIngredientId }) => {
    const supabase = createServerClient();

    const { error } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('id', recipeIngredientId);

    if (error) {
        console.error('Error removing ingredient from beverage:', error);
        return {
            success: false,
            message: 'An error occurred trying to remove ingredient from recipe'
        };
    }

    return {
        success: true,
        message: 'Ingredient removed from recipe successfully'
    };
});

const updateRecipeIngredientSchema = z.object({
    id: z.number().int().positive(),
    quantity: z.number().positive(),
    notes: z.string().optional()
});

export const updateRecipeIngredient = command(updateRecipeIngredientSchema, async (data) => {
    const supabase = createServerClient();

    const { error } = await supabase
        .from('recipe_ingredients')
        .update({
            quantity: data.quantity,
            notes: data.notes
        })
        .eq('id', data.id);

    if (error) {
        console.error('Error updating recipe ingredient:', error);
        return {
            success: false,
            message: 'An error occurred trying to update recipe ingredient'
        };
    }

    return {
        success: true,
        message: 'Recipe ingredient updated successfully'
    };
});


const uploadBeverageImageSchema = z.object({
	image: z.instanceof(File, { message: 'Please upload a file.' })
		.refine(file => file.size > 0, 'File cannot be empty.')
		.refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
		.refine(
			file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type),
			'Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'
		),
	beverageId: z.number().int().positive()
});

export const uploadBeverageImage = command(uploadBeverageImageSchema, async ({ image, beverageId }) => {
	const supabase = createServerClient();

	if (!image.name) {
		return {
			success: false,
			message: 'Please select a file'
		};
	}

	try {
		// Get current beverage to check for existing image
		const { data: currentBeverage } = await supabase
			.from('beverages')
			.select('image_url')
			.eq('id', beverageId)
			.single();

		// Delete old image if it exists (except default images)
		if (currentBeverage?.image_url && currentBeverage.image_url.includes('beverages')) {
			const oldPath = currentBeverage.image_url.split('/beverages/')[1];
			if (oldPath) {
				await supabase.storage
					.from('beverages')
					.remove([oldPath]);
			}
		}

		// Generate unique filename to avoid collisions
		const fileExt = image.name.split('.').pop();
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
		const filePath = `${beverageId}/${fileName}`;

		// Upload new image
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('beverages')
			.upload(filePath, image, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('Error uploading image:', uploadError);
			return {
				success: false,
				message: 'Failed to upload image.'
			};
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from('beverages')
			.getPublicUrl(uploadData.path);

		const publicUrl = urlData.publicUrl;

		
		const { error: updateError } = await supabase
			.from('beverages')
			.update({ image_url: publicUrl })
			.eq('id', beverageId);

		if (updateError) {
			console.error('Error updating beverage:', updateError);
			await supabase.storage.from('beverages_images').remove([filePath]);
			return {
				success: false,
				message: 'Failed to update beverage with new image.'
			};
		}

		return {
			success: true,
			imageUrl: publicUrl,
			message: 'Image uploaded successfully'
		};
	} catch (err) {
		console.error('Unexpected error during image upload:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while uploading image.'
		};
	}
});