/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/typings/', '/support/', '/dist/', '/fixtures/', '/helpers/'],
  coveragePathIgnorePatterns: ['/graphqlQuery/', '/models/', '/__snapshots__/', '/fixtures/'],
  collectCoverageFrom: ['src/**/*'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
};
