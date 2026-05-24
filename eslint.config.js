const js = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'build/', "src/apps/web/public/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      'eol-last': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/preserve-caught-error': 'off',
    },
  },
]
