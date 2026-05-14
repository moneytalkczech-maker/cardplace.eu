import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  timeout: 30000,
  retries: 1,
  use: { baseURL: "http://localhost:5173", headless: true },
  webServer: [
    { command: "cd server && npm run dev", port: 4000, reuseExistingServer: true },
    { command: "cd client && npm run dev", port: 5173, reuseExistingServer: true },
  ],
});
