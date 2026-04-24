export default {
  mutate: [
    "controllers/authContoller.js",
    "controllers/adminController.js",
    "controllers/hospitalController.js",
    "controllers/bloodLabController.js",
  ],
  testRunner: "jest",
  coverageAnalysis: "off",
  reporters: ["clear-text", "html", "json"],
  jest: {
    configFile: "jest.config.js",
  },
  htmlReporter: {
    baseDir: "reports/stryker-html",
  },
  jsonReporter: {
    fileName: "reports/stryker-report.json",
  },
  tempDirName: ".stryker-tmp",
  cleanTempDir: true,
  concurrency: 2,
  maxConcurrentTestRunners: 2,
};
