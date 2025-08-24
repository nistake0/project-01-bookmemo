import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CI 
      ? 'https://localhost:5173/project-01-bookmemo'
      : 'https://localhost:5173',
    chromeWebSecurity: false,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // HTTPS自己署名証明書を許可
    requestTimeout: 10000,
    responseTimeout: 10000,
    defaultCommandTimeout: 10000,
    // 自己署名証明書を無視
    experimentalModifyObstructiveThirdPartyCode: true,
  },
});
