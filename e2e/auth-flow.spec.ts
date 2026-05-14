import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: `test-${Date.now()}@cardbid.test`,
  username: `tester-${Date.now()}`,
  password: "Test1234_",
};

test.describe("Auth flow", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/auth/register", {
      data: TEST_USER,
    });
    expect(res.ok()).toBeTruthy();
  });

  test("full user flow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Přihlásit se" }).click();
    await page.waitForURL("**/login");

    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Heslo").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Přihlásit se" }).click();

    await page.waitForURL("/");
    await expect(page.getByRole("link", { name: "Profil", exact: false })).toBeVisible();

    await page.goto("/auctions");
    await page.waitForLoadState("networkidle");

    const auctionLink = page.locator("a[href^='/auctions/']").first();
    if (await auctionLink.count() > 0) {
      await auctionLink.click();
      await page.waitForURL("**/auctions/**");
      await expect(page.locator("text=Aktuální nabídka").first()).toBeVisible();
    }

    await page.goto("/wanted");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Hledané karty")).toBeVisible();
  });
});
