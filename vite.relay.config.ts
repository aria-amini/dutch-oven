import { defineConfig } from 'vite-plus'

// Builds the home import relay (scripts/import-relay.ts) into one file Node can
// run. Vite handles the `?raw` import of the fetch script and the `@/` alias,
// which a plain Node run cannot.
export default defineConfig({
	publicDir: false,
	resolve: { tsconfigPaths: true },
	build: {
		ssr: 'scripts/import-relay.ts',
		outDir: '.relay',
		emptyOutDir: true,
		target: 'node24',
		rollupOptions: { output: { entryFileNames: 'import-relay.mjs' } },
	},
})
