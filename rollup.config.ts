import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default {
  input: `src/main.ts`,
  output: [
    {
      file: pkg.main,
      name: pkg.name,
      format: 'umd',
      sourcemap: true,
      globals: {
        axios: 'axios',
        buffer: 'buffer',
        'hash-wasm': 'hashWasm',
      },
    },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  external: ['crypto-js', 'hash-wasm', 'crc', 'axios'],
  watch: {
    include: 'src/**',
  },
  plugins: [
    json(),
    typescript({ useTsconfigDeclarationDir: true }),
    commonjs(),
    resolve({
      preferBuiltins: false,
    }),
    terser(),
    sourceMaps(),
  ],
};
