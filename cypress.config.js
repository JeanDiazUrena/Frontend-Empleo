import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // URL donde corre Vite (tu Frontend)
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
