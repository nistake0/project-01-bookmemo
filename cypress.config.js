import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CI 
      ? 'http://localhost:5173/project-01-bookmemo'
      : 'https://localhost:5173',
    chromeWebSecurity: false,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
