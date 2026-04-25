import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your Stay, Your Price!")).toBeVisible();
  await expect(page.getByText("Find a Stay, Make a Deal")).toBeVisible();
});

test("search results page loads", async ({ page }) => {
  await page.goto("/search?destination=Yaounde&checkIn=2025-07-23&checkOut=2025-07-30");
  await expect(page.getByText(/Your Results/)).toBeVisible();
});

test("property details page loads", async ({ page }) => {
  await page.goto("/property/1");
  await expect(page).toHaveURL(/\/property\/1$/);

  let detailsVisible = false;
  try {
    await page.getByText("Description").waitFor({ state: "visible", timeout: 8000 });
    detailsVisible = true;
  } catch {
    // detailsVisible stays false
  }

  if (!detailsVisible) {
    await expect(page.getByText("Property not found")).toBeVisible();
  }
});

test("sign-in page loads", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});
