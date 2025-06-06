import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // SPA routing for GitHub Pages (per official docs)
			precompress: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/best-practices-hub' : ''
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;