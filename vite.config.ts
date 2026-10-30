import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	plugins: [
		sveltekit({
			compilerOptions: { runes: true },
			adapter: adapter({ fallback: undefined, strict: true }),
			prerender: { handleHttpError: 'fail' }
		})
	]
});
