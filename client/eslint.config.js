import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Variables starting with uppercase or _ are allowed to be unused (React components,
      // intentional placeholders). Also allow framer-motion namespace imports (motion,
      // AnimatePresence) which are used via JSX member expressions (<motion.div />) but
      // are not detected by ESLint without eslint-plugin-react's jsx-uses-vars rule.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]|^motion$|^AnimatePresence$',
        args: 'after-used',
        ignoreRestSiblings: true,
        caughtErrors: 'none',
      }],
      // Standard useEffect(() => { setState(x) }, [dep]) is a valid synchronisation
      // pattern. The React Compiler flags it as a perf concern, but it does not cause
      // bugs and is used throughout this codebase intentionally.
      'react-hooks/set-state-in-effect': 'off',
      // Empty catch blocks are intentional in WebSocket reconnect logic.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
])
