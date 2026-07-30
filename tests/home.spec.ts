import { expect, test } from "@playwright/test";

test("shows the mobile-first ONE CAREER launch screen", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page).toHaveTitle(/ONE CAREER/);
  await expect(page.getByTestId("launch-screen")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "One career. Every decision counts.",
    }),
  ).toBeVisible();
  await expect(page.getByText("18-22", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        return registration.active?.scriptURL.endsWith("/sw.js") ?? false;
      }),
    )
    .toBe(true);
});
