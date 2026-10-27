import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    restoreMocks: true,
    clearMocks: true,
    reporters: ["default", "junit"],
    outputFile: { junit: "test-results/angular.xml" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
