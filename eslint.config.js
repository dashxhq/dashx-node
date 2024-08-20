import globals from 'globals'
import js from '@eslint/js'
import path from 'node:path'
import pluginJs from '@eslint/js'
import stylisticTs from '@stylistic/eslint-plugin-ts'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'node:url'
import { fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

/**
 * @param {string} name the pugin name
 * @param {string} alias the plugin alias
 * @returns {import("eslint").ESLint.Plugin}
 */
function legacyPlugin(name, alias = name) {
  const plugin = compat.plugins(name)[0]?.plugins?.[alias]

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`)
  }

  return fixupPluginRules(plugin)
}

export default [
  {
    ignores: [ '**/node_modules', '**/build', '**/dist' ],
  },
  { files: [ '**/*.{js,mjs,cjs,ts}' ] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...compat.extends('plugin:import/typescript'),
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: legacyPlugin('eslint-plugin-import', 'import'),
      '@stylistic/ts': stylisticTs,
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],

      '@stylistic/ts/semi': [ 'error', 'never' ],

      '@stylistic/ts/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'comma',
            requireLast: true,
          },

          singleline: {
            delimiter: 'comma',
            requireLast: false,
          },
        },
      ],

      '@typescript-eslint/no-explicit-any': 'off',

      'array-bracket-spacing': [ 'error', 'always' ],

      'object-curly-newline': [
        'error',
        {
          consistent: true,
        },
      ],

      quotes: [ 'error', 'single' ],
    },
  },
]
