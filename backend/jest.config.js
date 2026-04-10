export default {
  clearMocks: true,
  collectCoverageFrom: [
    "<rootDir>/controllers/**/*.js",
    "<rootDir>/middlewares/**/*.js",
    "<rootDir>/routes/**/*.js",
    "!<rootDir>/openapi/**/*.js",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageProvider: "v8",
  coverageReporters: ["text", "html", "lcov"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setup/testEnv.js"],
};
