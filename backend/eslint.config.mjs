// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'off', // Disable for external API responses
      '@typescript-eslint/no-unsafe-assignment': 'off', // Disable for external API responses
      '@typescript-eslint/no-unsafe-call': 'off', // Disable for external API responses
      '@typescript-eslint/no-unsafe-argument': 'off', // Disable for external API responses
      '@typescript-eslint/no-unsafe-return': 'off', // Disable for external API responses
      
      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'prefer-const': 'error',
      'no-var': 'error',
      
      // NestJS specific rules
      '@typescript-eslint/no-empty-function': 'off', // Allow empty constructors
      '@typescript-eslint/ban-ts-comment': 'warn',
      
      // Prettier integration
      'prettier/prettier': 'error',
    },
  },
);