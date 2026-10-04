// Browser tests: builds the site with Jekyll, serves it, and clicks through it.
// Run with `npm test`.
const { defineConfig, devices } = require("@playwright/test");

const PORT = 4001;

module.exports = defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}/kondate/`,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Same Ruby + Jekyll that GitHub Pages uses (see README).
    command:
      `PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 ` +
      `bundle exec jekyll serve --port ${PORT} --no-watch --destination .test-site`,
    url: `http://localhost:${PORT}/kondate/`,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
