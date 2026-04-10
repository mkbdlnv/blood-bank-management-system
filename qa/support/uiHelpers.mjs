import { expect } from "@playwright/test";

export async function loginAs(page, { email, password }, expectedPathPattern) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login to Blood Bank" })).toBeVisible();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  if (expectedPathPattern) {
    await page.waitForURL(expectedPathPattern);
  }
}

export async function registerDonor(page, donor) {
  await page.goto("/register/donor");
  await expect(page.getByRole("heading", { name: "Blood Donor Registration" })).toBeVisible();

  await page.locator('input[name="fullName"]').fill(donor.fullName);
  await page.locator('input[name="email"]').fill(donor.email);
  await page.locator('input[name="password"]').fill(donor.password);
  await page.locator('input[name="phone"]').fill(donor.phone);
  await page.locator('input[name="emergencyContact"]').fill(donor.emergencyContact);
  await page.getByRole("button", { name: "Next Step" }).click();

  await page.locator('input[name="dob"]').fill(donor.dob);
  await page.locator('select[name="gender"]').selectOption(donor.gender);
  await page.locator('select[name="bloodGroup"]').selectOption(donor.bloodGroup);
  await page.locator('input[name="healthInfo.weight"]').fill(String(donor.weight));
  await page.locator('input[name="healthInfo.height"]').fill("175");
  await page.getByRole("button", { name: "Next Step" }).click();

  await page.locator('input[name="address.street"]').fill(donor.address.street);
  await page.locator('select[name="address.state"]').selectOption(donor.address.state);
  await page.locator('select[name="address.city"]').selectOption(donor.address.city);
  await page.locator('input[name="address.pincode"]').fill(donor.address.pincode);
  await page.getByRole("button", { name: "Register as Donor" }).click();

  await page.waitForURL(/\/login$/);
}
