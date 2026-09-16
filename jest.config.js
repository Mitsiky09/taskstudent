/**
 * Les tests portent sur la logique métier pure (`lib/`), volontairement isolée
 * de React Native : ts-jest en environnement Node suffit, sans avoir à monter
 * un rendu de composants.
 */
module.exports = {
  preset: 'ts-jest',
  // ts-jest utilise sa propre configuration TypeScript : celle de l'application
  // étend `expo/tsconfig.base`, inutile (et indisponible) hors du bundler.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['lib/**/*.ts'],
};
