import { query, command, form, prerender } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { getAuthenticatedUser, requireAuthenticatedUser } from '$lib/supabase/shared';
import { type Profile, type Blog } from '$lib/models/database.types';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const authenticatedAccess = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	const { data, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.overrideTypes<Profile[]>();

	if (profileError) {
		console.error('Error fetching profile info in load time:', profileError);
		error(404, 'Not found user info');
	}

	let profile: Profile;

	if (data && data.length > 0) profile = data[0];
	else error(404, 'Not found user info');

	if (profile.role_id !== 1 && profile.role_id !== 2 && profile.role_id !== 4) {
		throw redirect(308, '/app');
	}
	return {
		success: true,
		profile
	};
});

// ============= QUERIES =============

export const getAllBlogs = query(async () => {
	const supabase = createServerClient();

	const { data: blogs, error } = await supabase
		.from('blogs')
		.select(
			`
      *,
      profile:profiles!blogs_author_id_fkey (
        username,
        image_url,
        email
      )
    `
		)
		.order('created_at', { ascending: false })
		.overrideTypes<Blog[]>();

	if (error) {
		console.error('Error fetching blogs:', error);
		return {
			success: false,
			message: 'Error fetching blogs',
			blogs: [],
			total: 0
		};
	}

	return {
		success: true,
		blogs: blogs ?? [],
		total: blogs?.length ?? 0
	};
});

const togglePublishSchema = z.object({
	blogId: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(
			z
				.number()
				.int({ message: 'Blog ID must be an integer.' })
				.positive({ message: 'Blog ID must be a positive number.' })
		),
	published: z.boolean()
});

export const togglePublishStatus = command(togglePublishSchema, async ({ blogId, published }) => {
	const supabase = createServerClient();

	const { error } = await supabase.from('blogs').update({ published }).eq('id', blogId);

	if (error) {
		console.error('Error toggling publish status: ', error);
		return {
			success: false,
			message: 'Failde to update publish status'
		};
	}
	return {
		success: true,
		message: published ? 'Blog post published successfully' : 'Blog post unpublished successfully'
	};
});

// ============= FORMS =============

const imageFileSchema = z
	.instanceof(File)
	.refine((file) => file.size > 0, 'File cannot be empty.')
	.refine((file) => file.size < 5 * 1024 * 1024, 'File must be less than 5MB.')
	.refine(
		(file) =>
			['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
		'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
	);

const addBlogSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	content: z.string().min(1, 'Content is required'),
	category: z.string().optional(),
	tags: z.string().optional(),
	images: z.array(imageFileSchema).max(4, 'Maximum 4 images allowed.').optional(),
	published: z.string().transform((val) => val === 'true')
});

export const addBlog = form(addBlogSchema, async (blogData) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		let imageUrls: string[] = [];

		// Handle image uploads
		const images = blogData.images;
		if (images && images.length > 0) {
			for (const file of images) {
				const fileExt = file.name.split('.').pop();
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
				const filePath = `blog_images/${fileName}`;

				const { data: uploadData, error: uploadError } = await supabase.storage
					.from('blog_images')
					.upload(filePath, file, {
						cacheControl: '3600',
						upsert: false
					});

				if (uploadError) {
					console.error('Error uploading image:', uploadError);
					// Cleanup already uploaded images on error
					if (imageUrls.length > 0) {
						for (const url of imageUrls) {
							const path = url.split('/blog_images/')[1];
							if (path) {
								await supabase.storage.from('blog_images').remove([path]);
							}
						}
					}
					return {
						success: false,
						message: 'Failed to upload image.'
					};
				}

				const { data: urlData } = supabase.storage
					.from('blog_images')
					.getPublicUrl(uploadData.path);

				imageUrls.push(urlData.publicUrl);
			}
		}

		// Parse tags from comma-separated string
		const tags = blogData.tags
			? blogData.tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0)
			: [];

		// Insert blog
		const { error: insertError } = await supabase.from('blogs').insert({
			title: blogData.title,
			description: blogData.description,
			content: blogData.content,
			category: blogData.category,
			tags: tags,
			images: imageUrls,
			author_id: user.id,
			published: blogData.published
		});

		if (insertError) {
			console.error('Error inserting blog:', insertError);
			return {
				success: false,
				message: 'Failed to create blog post.'
			};
		}

		return {
			success: true,
			message: 'Blog post created successfully'
		};
	} catch (err) {
		console.error('Unexpected error during blog creation:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while creating blog post.'
		};
	}
});

const editBlogSchema = z.object({
	id: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive()),
	title: z.string().min(1, { error: 'Title is required' }),
	description: z.string().optional(),
	content: z.string().min(1, { error: 'Content is required' }),
	tags: z.string().optional(),
	published: z.string().transform((val) => val === 'true'),

	// NEW: Separate existing URLs from new files
	existingImages: z.string().optional(), // JSON array of URLs to keep
	newImages: z.array(imageFileSchema).max(4).optional() // Only NEW files
});

export const editBlog = form(editBlogSchema, async (blogData) => {
	const supabase = createServerClient();

	try {
		// Get current blog
		const { data: currentBlog } = await supabase
			.from('blogs')
			.select('images')
			.eq('id', blogData.id)
			.single();

		if (!currentBlog) {
			return { success: false, message: 'Blog post not found.' };
		}

		const currentImages = (currentBlog.images as string[]) || [];

		// Parse which existing images to KEEP
		const existingImagesToKeep = blogData.existingImages ? JSON.parse(blogData.existingImages) : [];

		// Find images to DELETE (in current but not in existingImagesToKeep)
		const imagesToDelete = currentImages.filter((url) => !existingImagesToKeep.includes(url));

		// Delete removed images
		if (imagesToDelete.length > 0) {
			const pathsToDelete = imagesToDelete
				.filter((url) => url.includes('blog_images'))
				.map((url) => url.split('/blog_images/')[1])
				.filter(Boolean) as string[];

			if (pathsToDelete.length > 0) {
				await supabase.storage.from('blog_images').remove(pathsToDelete);
			}
		}

		// Upload ONLY new images
		let newImageUrls: string[] = [];

		if (blogData.newImages && blogData.newImages.length > 0) {
			for (const file of blogData.newImages) {
				const fileExt = file.name.split('.').pop();
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

				const { data: uploadData, error: uploadError } = await supabase.storage
					.from('blog_images')
					.upload(`blog_images/${fileName}`, file);

				if (uploadError) {
					// Cleanup on error
					if (newImageUrls.length > 0) {
						const paths = newImageUrls.map((url) => url.split('/blog_images/')[1]).filter(Boolean);
						await supabase.storage.from('blog_images').remove(paths);
					}
					return { success: false, message: 'Failed to upload image.' };
				}

				const { data: urlData } = supabase.storage
					.from('blog_images')
					.getPublicUrl(uploadData.path);

				newImageUrls.push(urlData.publicUrl);
			}
		}

		// Combine: existing images to keep + newly uploaded images
		const finalImageUrls = [...existingImagesToKeep, ...newImageUrls];

		// Parse tags
		const tags = blogData.tags
			? blogData.tags
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
			: [];

		// Update blog
		const { error: updateError } = await supabase
			.from('blogs')
			.update({
				title: blogData.title,
				description: blogData.description,
				content: blogData.content,
				tags: tags,
				images: finalImageUrls,
				published: blogData.published
			})
			.eq('id', blogData.id);

		if (updateError) {
			return { success: false, message: 'Failed to update blog post.' };
		}

		return { success: true, message: 'Blog post updated successfully' };
	} catch (err) {
		console.error('Unexpected error:', err);
		return { success: false, message: 'An unexpected error occurred.' };
	}
});

// ============= COMMANDS =============

const deleteBlogSchema = z.object({
	blogId: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(
			z
				.number()
				.int({ message: 'Blog ID must be an integer.' })
				.positive({ message: 'Blog ID must be a positive number.' })
		)
});

export const deleteBlog = query(deleteBlogSchema, async ({ blogId }) => {
	const supabase = createServerClient();

	try {
		// Get blog to check for images
		const { data: blog } = await supabase.from('blogs').select('images').eq('id', blogId).single();

		// Delete associated images from storage
		if (blog?.images && Array.isArray(blog.images) && blog.images.length > 0) {
			for (const imageUrl of blog.images) {
				if (imageUrl && imageUrl.includes('blog_images')) {
					const imagePath = imageUrl.split('/blog_images/')[1];
					if (imagePath) {
						await supabase.storage.from('blog_images').remove([imagePath]);
					}
				}
			}
		}

		// Delete blog from database
		const { error } = await supabase.from('blogs').delete().eq('id', blogId);

		if (error) {
			console.error('Error deleting blog:', error);
			return {
				success: false,
				message: 'An error occurred trying to delete blog post'
			};
		}

		return {
			success: true,
			message: 'Blog post deleted successfully'
		};
	} catch (err) {
		console.error('Unexpected error during blog deletion:', err);
		return {
			success: false,
			message: 'An unexpected error occurred while deleting blog post.'
		};
	}
});
