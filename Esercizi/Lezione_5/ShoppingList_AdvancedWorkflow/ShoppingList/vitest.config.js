import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
// Cast: vite's UserConfigExport vs vitest's UserConfig are structurally compatible
// but nominally distinct — this is the canonical mergeConfig workaround.
export default mergeConfig(viteConfig, defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.config.*',
                '**/*.d.ts',
                'e2e/',
            ],
        },
    },
}));
