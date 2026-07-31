import { expect, test } from "@playwright/test";

test("shows the mobile-first ONE CAREER launch screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
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
  await expect(page.getByText("18-22", { exact: true })).toHaveCSS(
    "white-space",
    "nowrap",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
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

test("manifest exposes PNG icons for install surfaces", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");

  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      }),
      expect.objectContaining({
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      }),
    ]),
  );

  const appleIconResponse = await request.get("/apple-touch-icon.png");
  expect(appleIconResponse.ok()).toBe(true);
  const appleIcon = await appleIconResponse.body();
  expect(appleIcon.readUInt32BE(16)).toBe(180);
  expect(appleIcon.readUInt32BE(20)).toBe(180);
  expect(appleIcon[25]).toBe(2);
});

test("service worker precaches the current PWA shell", async ({ request }) => {
  const response = await request.get("/sw.js");

  expect(response.ok()).toBe(true);
  const serviceWorker = await response.text();
  expect(serviceWorker).toContain('const CACHE_NAME = "one-career-shell-v2"');
  expect(serviceWorker).not.toContain('"/icon.svg"');

  for (const iconPath of [
    "/icon-192.png",
    "/icon-512.png",
    "/apple-touch-icon.png",
  ]) {
    expect(serviceWorker).toContain(`"${iconPath}"`);
  }
});
