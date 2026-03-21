import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x',
			images: {
				sizes: [400, 640, 828, 1200],
				formats: ['image/avif', 'image/webp'],
				minimumCacheTTL: 86400,
				domains: ['uhrpdmoknmrbosqenotk.supabase.co']
			}
		}),
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
