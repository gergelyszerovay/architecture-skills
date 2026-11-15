import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import n from 'eslint-plugin-n';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';
import prettier from 'eslint-config-prettier';
import { tsdocSyntaxPlugin } from '@gergelyszerovay/architecture-skills/eslint-rules.cjs';

// top-level declarations that need TSDoc; `_`-prefixed schema checks are exempt
const topLevel = [
  'FunctionDeclaration',
  'ClassDeclaration',
  'TSTypeAliasDeclaration:not([id.name=/^_/])',
  'TSInterfaceDeclaration',
  'VariableDeclaration:not(:has(VariableDeclarator[id.name=/^_/]))',
];

export default defineConfig(
  { ignores: ['node_modules/', 'dist/', 'coverage/', '**/*.cjs'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  n.configs['flat/recommended-module'],
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'architecture-skills': tsdocSyntaxPlugin(tsdoc) },
    settings: {
      jsdoc: { mode: 'typescript' },
      // `bin` points at the tsdown output; map each source entry to it so n/hashbang accepts its shebang
      n: { convertPath: { 'app/*.main.ts': ['^app/(.+)\\.ts$', 'dist/$1.mjs'] } },
    },
    rules: {
      // correctness for async and event code
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      // in-memory adapters and fakes implement async ports synchronously
      '@typescript-eslint/require-await': 'off',
      // ports are interfaces, data contracts are type aliases
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      // explicit types: every function states its return type (a factory states the contract it
      // returns), and exported functions state their parameter types; locals stay inferred
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowTypedFunctionExpressions: true, allowHigherOrderFunctions: false },
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        { allowHigherOrderFunctions: false },
      ],
      // no wildcard re-exports; import library barrels by name, not as a namespace
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message: 'No wildcard re-exports; re-export names explicitly.',
        },
        {
          selector: 'ImportDeclaration[source.value=/^#libs\\//] > ImportNamespaceSpecifier',
          message:
            'Import named symbols from a library barrel, not the whole barrel as a namespace.',
        },
      ],
      // named exports only
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      // stdout belongs to formats and binaries
      'no-console': 'error',
      'n/no-process-exit': 'error',
      // TSDoc on every top-level declaration, with @param and @returns
      // an exported declaration's comment sits on the export statement, so match that node
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: false,
          require: { FunctionDeclaration: false },
          contexts: topLevel.flatMap((s) => [
            `Program > ${s}`,
            `Program > ExportNamedDeclaration:has(> ${s})`,
          ]),
        },
      ],
      // `enableFixer: false` on both: the fixer inserts the tag but cannot write the
      // description, so `--fix` leaves `@param name` with no text and no hyphen, which then
      // fails require-param-description and tsdoc/syntax. One honest finding becomes three,
      // in a file an agent may have touched for an unrelated reason. The tag is written by
      // hand; the rule only reports.
      'jsdoc/require-param': [
        'error',
        { checkDestructured: false, checkDestructuredRoots: false, enableFixer: false },
      ],
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      // tsdoc/syntax (through its wrapper, which accepts a root row link) checks TSDoc syntax
      // (tags, @param hyphens); jsdoc keeps the presence rules
      'architecture-skills/tsdoc-syntax': 'error',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/require-yields': 'off',
      'jsdoc/require-returns': [
        'error',
        { forceRequireReturn: false, forceReturnsWithAsync: true, enableFixer: false },
      ],
    },
  },
  { files: ['**/adapters-driving/**', 'app/*.main.ts'], rules: { 'no-console': 'off' } },
  {
    // Only `.config.ts` blocks read the environment (node-block-architecture D26); tests may
    // pass it on to child processes they start.
    files: ['**/*.ts'],
    ignores: ['**/*.config.ts', '**/*.test.ts'],
    rules: { 'n/no-process-env': 'error' },
  },
  // Specs label their arrange/act/assert phases; the labels are never jump targets. Contract
  // suites hold specs too, so they follow the same rules as tests.
  {
    files: ['**/*.test.ts', '**/*.contract.ts'],
    rules: { 'no-unused-labels': 'off', 'jsdoc/require-jsdoc': 'off' },
  },
  // tRPC clients infer their types from procedures and routers, so inference is the contract there
  {
    files: ['**/*.procedure.ts', '**/*.router.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['*.config.js', '*.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'no-restricted-exports': 'off',
      'jsdoc/require-jsdoc': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  prettier,
);
