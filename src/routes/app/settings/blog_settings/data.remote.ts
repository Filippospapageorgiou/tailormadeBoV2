import { query, command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import type { Blog } from '$lib/models/database.types';
import { z } from 'zod/v4';

// ============= QUERIES =============

export const getAllBlogs = query(async () => {
  const supabase = createServerClient();

  const { data: blogs, error } = await supabase
    .from('blogs')
    .select(`
      *,
      profile:profiles!blogs_author_id_fkey (
        username,
        image_url,
        email
      )
    `)
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
      z.number()
        .int({ message: 'Blog ID must be an integer.' })
        .positive({ message: 'Blog ID must be a positive number.' })
    ),
  published: z.boolean()
});


export const togglePublishStatus = command(togglePublishSchema, async({ blogId, published }) => {
    const supabase = createServerClient();

    const { error } = await supabase
        .from('blogs')
        .update({ published })
        .eq('id',blogId)

    if(error){
        console.error('Error toggling publish status: ',error);
        return {
            success: false,
            message: 'Failde to update publish status'
        }
    }
    return {
    success: true,
    message: published ? 'Blog post published successfully' : 'Blog post unpublished successfully'
  };
})

// ============= FORMS =============

const addBlogSchema = z.object({
  title: z.string().min(1, { error: 'Title is required' }),
  description: z.string().optional(),
  content: z.string().min(1, { error: 'Content is required' }),
  category: z.string().optional(),
  tags: z.string().optional(), 
  images: z.instanceof(File, { error: 'Please upload a file.' })
    .refine(file => file.size > 0, 'File cannot be empty.')
    .refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
    )
    .optional(),
  published: z.string().transform(val => val === 'true')
});

export const addBlog = form(addBlogSchema, async (blogData) => {
  const supabase = createServerClient();
  const user = await requireAuthenticatedUser();
  try {
    let imageUrls: string[] = [];

    // Upload image if provided
    if (blogData.images && blogData.images instanceof File) {
      const fileExt = blogData.images.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog_images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog_images')
        .upload(filePath, blogData.images, {
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

      const { data: urlData } = supabase.storage
        .from('blog_images')
        .getPublicUrl(uploadData.path);

      imageUrls = [urlData.publicUrl];
    }

    // Parse tags from comma-separated string
    const tags = blogData.tags
      ? blogData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Insert blog
    const { error: insertError } = await supabase
      .from('blogs')
      .insert({
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
    .pipe(
      z.number()
        .int({ error: 'Blog ID must be an integer.' })
        .positive({ error: 'Blog ID must be a positive number.' })
    ),
  title: z.string().min(1, { error: 'Title is required' }),
  description: z.string().optional(),
  content: z.string().min(1, { error: 'Content is required' }),
  category: z.string().optional(),
  tags: z.string().optional(),
  images: z.instanceof(File, { error: 'Please upload a file.' })
    .refine(file => file.size > 0, 'File cannot be empty.')
    .refine(file => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only image files (JPEG, PNG, WebP, GIF) are allowed.'
    )
    .optional(),
  published: z.string().transform(val => val === 'true')
});

export const editBlog = form(editBlogSchema, async (blogData) => {
  const supabase = createServerClient();

  try {
    let imageUrls: string[] | undefined = undefined;

    // Handle image upload if new image provided
    if (blogData.images && blogData.images instanceof File) {
      // Get current blog to check for existing images
      const { data: currentBlog } = await supabase
        .from('blogs')
        .select('images')
        .eq('id', blogData.id)
        .single();

      // Delete old images if they exist
      if (currentBlog?.images && Array.isArray(currentBlog.images) && currentBlog.images.length > 0) {
        for (const imageUrl of currentBlog.images) {
          if (imageUrl && imageUrl.includes('blog_images')) {
            const oldPath = imageUrl.split('/blog_images/')[1];
            if (oldPath) {
              await supabase.storage
                .from('blog_images')
                .remove([oldPath]);
            }
          }
        }
      }

      // Upload new image
      const fileExt = blogData.images.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog_images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog_images')
        .upload(filePath, blogData.images, {
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

      const { data: urlData } = supabase.storage
        .from('blog_images')
        .getPublicUrl(uploadData.path);

      imageUrls = [urlData.publicUrl];
    }

    // Parse tags
    const tags = blogData.tags
      ? blogData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const updateData: any = {
      title: blogData.title,
      description: blogData.description,
      content: blogData.content,
      category: blogData.category,
      tags: tags,
      published: blogData.published
    };

    if (imageUrls) {
      updateData.images = imageUrls;
    }

    const { error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogData.id);

    if (error) {
      console.error('Error updating blog:', error);
      return {
        success: false,
        message: 'An error occurred trying to update the blog post'
      };
    }

    return {
      success: true,
      message: 'Blog post updated successfully'
    };
  } catch (err) {
    console.error('Unexpected error during blog update:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while updating blog post.'
    };
  }
});

// ============= COMMANDS =============

const deleteBlogSchema = z.object({
  blogId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number()
        .int({ message: 'Blog ID must be an integer.' })
        .positive({ message: 'Blog ID must be a positive number.' })
    )
});

export const deleteBlog = query(deleteBlogSchema, async ({ blogId }) => {
  const supabase = createServerClient();

  try {
    // Get blog to check for images
    const { data: blog } = await supabase
      .from('blogs')
      .select('images')
      .eq('id', blogId)
      .single();

    // Delete associated images from storage
    if (blog?.images && Array.isArray(blog.images) && blog.images.length > 0) {
      for (const imageUrl of blog.images) {
        if (imageUrl && imageUrl.includes('blog_images')) {
          const imagePath = imageUrl.split('/blog_images/')[1];
          if (imagePath) {
            await supabase.storage
              .from('blog_images')
              .remove([imagePath]);
          }
        }
      }
    }

    // Delete blog from database
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId);

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
