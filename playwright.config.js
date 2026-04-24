const { defineConfig } = require("@playwright/test");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4217";
const useExternalBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL);

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: useExternalBaseURL
    ? undefined
    : {
        command: "HOST=127.0.0.1 PORT=4217 node server.js",
        url: "http://127.0.0.1:4217",
        reuseExistingServer: false,
        timeout: 120_000
      }
});
