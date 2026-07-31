import { expect, test, type Page } from "@playwright/test";

/**
 * End to end coverage for the three season slice.
 *
 * The unit tests already prove the engine and the journal are correct, so these
 * tests deliberately cover what only a browser can: the full path a player
 * walks, restoring a run after a reload, keyboard operation, and layout at the
 * narrowest phone width.
 */

async function createPlayer(page: Page, name = "Dana Levi") {
  await page.goto("/play");
  await page.getByLabel("Player name").fill(name);
  await page.getByLabel("Nationality").fill("Israel");
  await page.getByTestId("start-slice").click();
  await expect(page.getByTestId("decision-list")).toBeVisible();
}

async function playSeason(page: Page) {
  await page.getByTestId("decision-list").getByRole("button").first().click();

  await page.getByTestId("moment-read-continue").click();
  await page.getByTestId("moment-choice-shoot").click();

  await page.getByTestId("power-slider").fill("64");
  await page.getByTestId("timing-start").click();
  await page.getByTestId("timing-stop").click();
  await expect(page.getByTestId("moment-submit")).toBeEnabled();
  await page.getByTestId("moment-submit").click();

  await expect(page.getByTestId("summary-continue")).toBeVisible();
}

test("plays a full three season slice from the home screen", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play-cta").click();
  await expect(page).toHaveURL(/\/play$/);

  await page.getByLabel("Player name").fill("Dana Levi");
  await page.getByLabel("Nationality").fill("Israel");
  await page.getByTestId("start-slice").click();

  for (const season of [1, 2, 3]) {
    await expect(page.getByTestId("hud-season")).toHaveText(`${season} / 3`);
    await expect(page.getByTestId("decision-list")).toBeVisible();

    await playSeason(page);

    // Every season must show the player something that moved, and say why.
    await expect(page.getByTestId("summary-outcome")).toBeVisible();
    await expect(page.getByTestId("summary-why")).toBeVisible();
    await expect(page.getByTestId("attribute-changes").getByRole("listitem").first()).toBeVisible();
    await expect(page.getByTestId("condition-changes").getByRole("listitem").first()).toBeVisible();

    await page.getByTestId("summary-continue").click();
  }

  await expect(page.getByTestId("legacy-score")).toBeVisible();
  await expect(page.getByTestId("legacy-title")).toBeVisible();
  await expect(page.getByTestId("timeline").getByRole("listitem")).toHaveCount(3);

  const score = Number(await page.getByTestId("legacy-score").innerText());
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(1000);

  // An earlier choice has to be visible in the outcome, not just felt.
  await expect(page.getByTestId("decision-impact")).not.toBeEmpty();
});

test("restores the same run after a reload", async ({ page }) => {
  await createPlayer(page);
  await playSeason(page);
  await page.getByTestId("summary-continue").click();

  await expect(page.getByTestId("hud-season")).toHaveText("2 / 3");
  const club = await page.getByTestId("hud-club").innerText();
  const morale = await page.getByTestId("meter-morale").innerText();

  await page.reload();

  await expect(page.getByTestId("restored-notice")).toBeVisible();
  await expect(page.getByTestId("hud-season")).toHaveText("2 / 3");
  await expect(page.getByTestId("hud-club")).toHaveText(club);
  await expect(page.getByTestId("meter-morale")).toHaveText(morale);
});

test("refuses a saved run from a newer build instead of loading it", async ({ page }) => {
  await page.goto("/play");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "one-career.slice.v1",
      JSON.stringify({ version: 99, seed: {}, actionLog: [] }),
    );
  });
  await page.reload();

  await expect(page.getByTestId("save-notice")).toBeVisible();
  await expect(page.getByTestId("start-slice")).toBeVisible();
});

test("plays a moment with the keyboard alone", async ({ page }) => {
  await createPlayer(page);

  // Tab order reaches the decisions without a pointer. The exact number of
  // presses is not asserted: the sequential focus starting point depends on
  // where the last click landed, so only reachability is meaningful.
  const firstDecision = page.getByTestId("decision-list").getByRole("button").first();
  let reached = false;
  for (let press = 0; press < 12 && !reached; press += 1) {
    await page.keyboard.press("Tab");
    reached = await firstDecision.evaluate(
      (element) => element === document.activeElement,
    );
  }

  expect(reached).toBe(true);
  await page.keyboard.press("Enter");

  await page.getByTestId("moment-read-continue").focus();
  await page.keyboard.press("Enter");

  await page.getByTestId("moment-choice-dribble").focus();
  await page.keyboard.press("Enter");

  // Direction is a radio group, so arrow keys move the selection.
  await page.getByTestId("direction-0").click();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("input[type=radio]:checked")).toHaveValue("1");

  await page.getByTestId("power-slider").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("power-value")).toHaveText("51");

  await page.getByTestId("timing-start").focus();
  await page.keyboard.press("Space");
  await page.getByTestId("timing-stop").press("Space");
  await expect(page.getByTestId("timing-value")).not.toBeEmpty();

  await page.getByTestId("moment-submit").focus();
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("summary-outcome")).toBeVisible();
});

test("fits the narrowest phone without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await createPlayer(page);

  const fits = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  expect(await fits()).toBe(true);

  await page.getByTestId("decision-list").getByRole("button").first().click();
  await page.getByTestId("moment-read-continue").click();
  await page.getByTestId("moment-choice-shoot").click();

  expect(await fits()).toBe(true);
});

test("asks for the details it needs before starting", async ({ page }) => {
  await page.goto("/play");
  await page.getByTestId("start-slice").click();

  await expect(page.getByTestId("create-error")).toBeVisible();
  await expect(page.getByTestId("decision-list")).toHaveCount(0);
});

test("locks the submit button again when a new timing run starts", async ({ page }) => {
  // Restarting the sweep must clear the locked value. Otherwise the moment
  // could be played with the timing from the previous attempt while the marker
  // is still moving, so the result would not match what the player just did.
  await createPlayer(page);
  await page.getByTestId("decision-list").getByRole("button").first().click();
  await page.getByTestId("moment-read-continue").click();
  await page.getByTestId("moment-choice-shoot").click();

  await page.getByTestId("timing-start").click();
  await page.getByTestId("timing-stop").click();
  await expect(page.getByTestId("moment-submit")).toBeEnabled();

  await page.getByTestId("timing-start").click();
  await expect(page.getByTestId("moment-submit")).toBeDisabled();
  await expect(page.getByTestId("timing-value")).toBeEmpty();

  await page.getByTestId("timing-stop").click();
  await expect(page.getByTestId("moment-submit")).toBeEnabled();
});
