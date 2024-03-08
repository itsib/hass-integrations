import path from 'path';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
// import minifyHTML from 'rollup-plugin-minify-html-literals';
import clean from 'rollup-plugin-delete';
import litScss from './libs/lit-scss.js';

export default argv => {
  const projectName = argv.project;
  Reflect.deleteProperty(argv, 'project');
  if (!projectName) {
    throw new Error('No project name provided');
  }

  const isProd = argv.environment?.includes('production');

  console.log(argv.prod)

  const projectSrc = `packages/${projectName}/src`;
  const projectDist = `packages/${projectName}/custom_components/${projectName.replace('-', '_')}`;

  /**
   * @type {import('rollup').RollupOptions}
   */
  return {
    input: `${projectSrc}/index.ts`,
    output: {
      dir: `${projectDist}/lovelace`,
      format: 'es',
    },
    plugins: [
      clean({
        targets: [
          `${projectDist}/lovelace/*`,
          // `config/custom_components/${projectName.replace('-', '_')}`
        ]
      }),
      // minifyHTML(),
      litScss({
        minify: true,
        options: {
          loadPaths: [
            'node_modules',
            `${projectSrc}/scss`
          ],
        },
      }),
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: path.resolve(`${projectSrc}`, '../tsconfig.json'),
      }),
      json(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      ...(isProd ? [terser()] : []),
      copy({
        hook: 'closeBundle',
        verbose: false,
        targets: [
          { src: `${projectSrc}/images/**/*`, dest: `${projectDist}/lovelace` },
          ...(isProd ? [] : [{ src: `${projectDist}/*`, dest: `config/custom_components/${projectName.replace('-', '_')}` }]),
        ],
      }),
    ],
  }
}