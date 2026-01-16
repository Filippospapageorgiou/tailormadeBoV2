import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			onwarn(warning, warn) {
				// Suppress warnings from node_modules
				if (warning.id?.includes('node_modules')) return;
				if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
				warn(warning);
			},
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						// Charts - largest chunk
						if (id.includes('layerchart') || id.includes('d3')) {
							return 'charts';
						}
						// UI component library
						if (id.includes('bits-ui')) {
							return 'bits-ui';
						}
						// Icons
						if (id.includes('lucide')) {
							return 'icons';
						}
						// Date/calendar components
						if (id.includes('date') || id.includes('calendar')) {
							return 'datetime';
						}
						// Drag and drop
						if (id.includes('dnd-kit')) {
							return 'dnd';
						}
						// Animations
						if (id.includes('svelte-motion')) {
							return 'motion';
						}
						// Validation
						if (id.includes('zod')) {
							return 'validation';
						}
						// Other UI utilities
						if (
							id.includes('vaul') ||
							id.includes('sonner') ||
							id.includes('mode-watcher')
						) {
							return 'ui-utils';
						}
					}
				}
			}
		}
	}
});