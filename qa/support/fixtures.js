import { test as base, expect } from "@playwright/test";
import { buildQaScenario } from "./testData.mjs";

function slugify(value) {
  return String(value || "scenario")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "scenario";
}

export const test = base.extend({
  runId: async ({}, use, testInfo) => {
    const runId = `${Date.now()}-${testInfo.retry}-${slugify(testInfo.title)}`;
    await use(runId);
  },
  scenario: async ({ runId }, use) => {
    await use(buildQaScenario(runId));
  },
});

export { expect };
