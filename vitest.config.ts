import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        alias: {
            'react-native': path.resolve(__dirname, './__mocks__/react-native.ts'),
        },
    },
    define: {
        __DEV__: true,
    },
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./test/setup.ts'],
    },
});
