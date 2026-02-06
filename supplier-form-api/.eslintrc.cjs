/**
 * ESLint Configuration for Backend API (Node.js)
 */

module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Allow unused vars if they start with underscore
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    // Node.js best practices
    'no-process-exit': 'off', // Allow process.exit in server code
    'no-console': 'off', // Allow console.log in backend
  },
};
