import { expect, test } from "@playwright/test";
import { buildQaScenario } from "../support/testData.mjs";

const runId = process.env.QA_RUN_ID || "local";
const scenario = buildQaScenario(runId);

async function login(page, email, password) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login to Blood Bank" })).toBeVisible();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

test("landing page renders the main donor CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Connect Blood Donors with Those in Need/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Get Started/i })).toBeVisible();
});

test("donor can log in and reach the dashboard", async ({ page }) => {
  await login(page, scenario.donor.email, scenario.donor.password);
  await expect(page).toHaveURL(/\/donor$/);
  await expect(page.getByRole("heading", { name: "Donor Dashboard" })).toBeVisible();
});

test("hospital sees approved blood labs and can open the request form", async ({ page }) => {
  await login(page, scenario.hospital.email, scenario.hospital.password);
  await expect(page).toHaveURL(/\/hospital$/);

  await page.goto("/hospital/blood-request-create");
  await expect(page.getByRole("heading", { name: "Request Blood" })).toBeVisible();
  await expect(page.locator("select").first()).toContainText(scenario.bloodLab.name);
  await expect(page.getByText("No approved blood labs available")).toHaveCount(0);
});
