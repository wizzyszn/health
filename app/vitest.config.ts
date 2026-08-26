import path from "node:path";
import { defineConfig } from "vitest/config";

// Tests target pure TS logic (error classifiers, deep-link parsing) — the
// node environment avoids pulling jsdom into the dependency tree. Switch to
// environment: "jsdom" (+ devDep) if component tests are added later.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
