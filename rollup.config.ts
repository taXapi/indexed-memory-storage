import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {dts} from 'rollup-plugin-dts';

export default [
    {
        input: 'src/storage.ts', // Entry point of your library
        output: [
            {
                file: 'dist/storage.es.js', // ES module output
                format: 'es', // ES module format
                sourcemap: true,
            },
            {
                file: 'dist/storage.cjs.js', // CommonJS output
                format: 'cjs', // CommonJS format
                sourcemap: true,
            },
        ],
        plugins: [
            typescript(), // Plugin to compile TypeScript files
            terser(),
        ],
        external: ['rxjs'], // List of dependencies you want to exclude from the bundle
    },
    {
        // path to your declaration files root
        input: './dist/dts/src/storage.d.ts',
        output: [{file: 'dist/index.d.ts', format: 'es'}],
        plugins: [dts()],
    },
];
