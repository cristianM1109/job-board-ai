import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200", // Asigură-te că ai frontend-ul pornit
    setupNodeEvents(on, config) {
      // Event listeners
    },
  },
});
