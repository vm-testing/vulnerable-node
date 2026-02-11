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
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
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
