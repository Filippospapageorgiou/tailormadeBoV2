import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x',
			// If you're using edge functions, add:
			// edge: false,
			// If your functions need more memory/time:
			// maxDuration: 10
		}),
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental:{
			async: true
		}
	}
};

export default config;