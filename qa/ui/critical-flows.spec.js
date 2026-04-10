import {
  createBloodRequest,
  findFacilityByEmail,
  getFacilities,
  loginApi,
  loginAsAdmin,
  registerApprovedFacility,
  registerPendingFacility,
} from "../support/backendApi.mjs";
import { test, expect } from "../support/fixtures.js";
import { loginAs, registerDonor } from "../support/uiHelpers.mjs";

test("donor can register through the UI and log in to the dashboard", async ({ page, scenario }) => {
  await registerDonor(page, scenario.donor);

  await loginAs(page, scenario.donor, /\/donor$/);

  await expect(page.getByRole("heading", { name: "Donor Dashboard" })).toBeVisible();
  await expect(page.getByText(scenario.donor.fullName)).toBeVisible();
});

test("hospital can log in, create a blood request, and see it in request history", async ({ page, scenario }) => {
  await registerApprovedFacility(scenario.hospital);
  await registerApprovedFacility(scenario.bloodLab);

  await loginAs(page, scenario.hospital, /\/hospital$/);
  await expect(page.getByRole("heading", { name: "Hospital Dashboard" })).toBeVisible();

  await page.goto("/hospital/blood-request-create");
  await expect(page.getByRole("heading", { name: "Request Blood" })).toBeVisible();
  await expect(page.locator("select").first()).toContainText(scenario.bloodLab.name);
  await page.locator("select").first().evaluate((select, labName) => {
    const option = Array.from(select.options).find((item) => item.textContent?.includes(labName));

    if (!option) {
      throw new Error(`Blood lab option not found for ${labName}`);
    }

    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, scenario.bloodLab.name);
  await page.locator('select').nth(1).selectOption("A+");
  await page.locator('input[type="number"]').fill("3");
  await page.getByRole("button", { name: "Send Blood Request" }).click();

  await page.goto("/hospital/blood-request-history");
  await expect(page.getByRole("heading", { name: "Request History" })).toBeVisible();
  const requestsTable = page.getByRole("table");
  await expect(requestsTable).toContainText(scenario.bloodLab.name);
  await expect(requestsTable).toContainText("A+");
  await expect(requestsTable).toContainText("Pending");
});

test("blood lab can add stock and process an incoming hospital request", async ({ page, scenario }) => {
  const approvedHospital = await registerApprovedFacility(scenario.hospital);
  const approvedLab = await registerApprovedFacility(scenario.bloodLab);
  const hospitalSession = await loginApi(scenario.hospital.email, scenario.hospital.password);

  await createBloodRequest(hospitalSession.token, {
    labId: approvedLab._id,
    bloodType: "O-",
    units: 2,
  });

  await loginAs(page, scenario.bloodLab, /\/lab$/);
  await page.goto("/lab/inventory");
  await expect(page.getByRole("heading", { name: "Blood Stock Management" })).toBeVisible();
  await page.locator("select").first().selectOption("O-");
  await page.locator('input[type="number"]').fill("5");
  await page.getByRole("button", { name: "Add Units" }).click();
  await expect(page.locator("table")).toContainText("O-");
  await expect(page.locator("table")).toContainText("5 units");

  await page.goto("/lab/requests");
  await expect(page.getByRole("heading", { name: "Blood Requests" })).toBeVisible();
  await expect(page.getByText(approvedHospital.name)).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("Processed on")).toBeVisible();
});

test("admin can approve one facility and reject another from the verification screen", async ({ page, scenario }) => {
  await registerPendingFacility(scenario.hospital);
  await registerPendingFacility(scenario.bloodLab);
  const admin = await loginAsAdmin();
  const facilities = await getFacilities(admin.token);

  await loginAs(page, { email: process.env.QA_ADMIN_EMAIL || "suraj@admin.com", password: process.env.QA_ADMIN_PASSWORD || "bbms@admin" }, /\/admin$/);
  await page.goto("/admin/verification");
  await expect(page.getByRole("heading", { name: "Facility Verification" })).toBeVisible();

  await page.getByText(scenario.hospital.name).click();
  await page.getByRole("button", { name: "Approve Facility" }).click();
  await expect(page.getByText(scenario.hospital.name)).toHaveCount(0);

  await page.getByText(scenario.bloodLab.name).click();
  await page.locator("textarea").fill("QA rejection reason");
  await page.getByRole("button", { name: "Reject Facility" }).click();
  await expect(page.getByText(scenario.bloodLab.name)).toHaveCount(0);

  const refreshedFacilities = await getFacilities(admin.token);
  const approvedHospital = findFacilityByEmail(refreshedFacilities, scenario.hospital.email);
  const rejectedLab = findFacilityByEmail(refreshedFacilities, scenario.bloodLab.email);

  expect(approvedHospital?.status).toBe("approved");
  expect(rejectedLab?.status).toBe("rejected");
});
