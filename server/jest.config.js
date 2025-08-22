/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: ['js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
  ],
  transform: {
    '^.+\\.js$': 'babel-jest', // Use babel-jest for ES6+ syntax if needed, though current code is CommonJS
  },
  // If you are using ES Modules in your server code and need to transpile them for Jest:
  // transform: {
  //   '^.+\\.(js|ts|jsx|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }]
  // },
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>/src/$1', // Example for frontend alias, adjust if needed for backend
  // },
};
