import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// GitHub Pages serves project repos from /<repo>/, so the base must match the repo name.
// Set BASE_PATH='' for a user site, a custom domain, or a local root-served build.
type Base = '' | `/${string}`;
const base = (process.env.BASE_PATH ?? '/prototipe-A') as Base;

export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	plugins: [
		sveltekit({
			compilerOptions: { runes: true },
			paths: { base },
			adapter: adapter({ fallback: '404.html', strict: true }),
			prerender: { handleHttpError: 'fail' }
		})
	]
});
