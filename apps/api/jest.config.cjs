/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['<rootDir>/../test/setup.ts'],
  moduleNameMapper: {
    '^@rc/db$': '<rootDir>/../test/mocks/rc-db.ts',
    '^@rc/types$': '<rootDir>/../../../packages/types/src/index.ts',
  },
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
  collectCoverageFrom: ['**/*.util.ts'],
};
