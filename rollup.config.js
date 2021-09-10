//import babel from '@rollup/plugin-babel';

import pkg from './package.json';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import sourcemaps from 'rollup-plugin-sourcemaps';
import eslint from '@rollup/plugin-eslint';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle';
import { babel } from '@rollup/plugin-babel';

const isProduction = process.env.NODE_ENV === 'production';

isProduction && console.log('Making a production build');

const options = {
    input: pkg.source,
    output: [{
        dir: 'esm',
        format: 'esm',
        sourcemap: true,
        preserveModules: true,
    }, ],
    plugins: [
        eslint({
            exclude: ['node_modules/**', '**/*.css'],
        }),
        nodeResolve(),

        excludeDependenciesFromBundle({
            dependencies: true,
            peerDependencies: true,
        }),
        postcss({
            extract: true, // extracts to `${basename(dest)}.css`
            plugins: [autoprefixer(), cssnano()],
            autoModules: true,
            use: ['sass'],
        }),

        babel({
            babelHelpers: 'runtime',
            exclude: 'node_modules/**',
        }),

        typescript({
            declarationDir: 'esm/types',
            outDir: 'esm/lib',
        }),

        sourcemaps(),
    ],
};

export default options;