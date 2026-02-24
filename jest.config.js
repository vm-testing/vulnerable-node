export default {
    transform: {},
    testEnvironment: 'node',
    extensionsToTreatAsEsm: [],
    moduleNameMapper: {},
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 4,
            lines: 5,
            statements: 5
        }
    },
    collectCoverageFrom: [
        'model/**/*.js',
        'routes/**/*.js',
        'src/**/*.js',
        '!**/node_modules/**'
    ],
    verbose: true
};
