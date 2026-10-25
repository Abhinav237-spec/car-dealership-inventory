/** Jest configuration: TypeScript via ts-jest, tests live in tests/ */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    // Keep full type-checking; only mute the harmless "node16 hybrid module" notice (TS151002).
    '^.+\\.ts$': ['ts-jest', { diagnostics: { ignoreCodes: [151002] } }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
};
