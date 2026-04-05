import js from '@eslint/js';
import globals from 'globals';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    // تجاهل المجلدات التي لا تحتاج لفحص
    ignores: ['node_modules', 'dist', 'coverage'],
  },
  {
    // استهداف كافة ملفات الجافا سكريبت
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node, // لتعريف process, __dirname, إلخ
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
        },
      ],
      'no-unused-vars': 'warn',
      'no-console': 'off', // مسموح في السيرفر للـ Logging
    },
  },
  eslintConfigPrettier, // لضمان عدم تداخل القواعد
];
