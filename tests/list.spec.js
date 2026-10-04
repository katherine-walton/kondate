const { test, expect } = require("@playwright/test");
const { loadSiteData, formatAmount, setList, watchForErrors, expectNoHorizontalScroll } = require("./helpers");

/** What the list should contain for a set of recipes: one entry per ingredient, summed. */
function expectedItems(data, slugs) {
  const items = new Map();
  for (const slug of slugs) {
    const recipe = data.recipes.find((r) => r.slug === slug);
    for (const { item, amount } of recipe.ingredients) {
      const entry = items.get(item) || { key: item, total: 0, parts: [] };
      entry.total = Math.round((entry.total + amount) * 100) / 100;
      entry.parts.push(recipe.title);
      items.set(item, entry);
    }
  }
  return [...items.values()];
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

test.describe("grocery list page", () => {
  test("empty list explains how to add recipes", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto("list/");
    await expect(page.locator("[data-empty]")).toBeVisible();
    await expect(page.locator("[data-summary]")).toHaveText("0 recipes · 0 items");
    await expect(page.locator("[data-to-buy] [data-item]")).toHaveCount(0);
    errors.check();
  });

  test("sums ingredients across recipes and shows each one once", async ({ page }) => {
    const data = await loadSiteData(page);
    const slugs = data.recipes.slice(0, 2).map((r) => r.slug);
    const expected = expectedItems(data, slugs);

    await setList(page, { recipes: slugs });
    await page.reload();

    await expect(page.locator("[data-summary]")).toHaveText(
      `${plural(slugs.length, "recipe")} · ${plural(expected.length, "item")}`
    );
    await expect(page.locator(".list-recipe")).toHaveCount(slugs.length);
    await expect(page.locator("[data-to-buy] [data-item]")).toHaveCount(expected.length);

    for (const item of expected) {
      const ing = data.ingredients[item.key];
      const row = page.locator(`[data-to-buy] [data-item="${item.key}"]`);
      await expect(row.locator(".grocery-item__total")).toHaveText(formatAmount(item.total, ing.unit));
      // Ingredients used by more than one recipe say how the total adds up.
      if (item.parts.length > 1) {
        await expect(row.locator(".grocery-item__breakdown")).toContainText(" + ");
      }
    }
    await expectNoHorizontalScroll(page);
  });

  test("tapping an item moves it to the basket, and back", async ({ page }) => {
    const data = await loadSiteData(page);
    const recipe = data.recipes[0];
    const key = recipe.ingredients[0].item;

    await setList(page, { recipes: [recipe.slug] });
    await page.reload();

    await page.locator(`[data-to-buy] [data-item="${key}"]`).click();
    await expect(page.locator(`[data-got] [data-item="${key}"]`)).toBeVisible();
    await expect(page.locator(`[data-to-buy] [data-item="${key}"]`)).toHaveCount(0);
    await expect(page.locator("[data-got-label]")).toHaveText("1");

    // Remembered after reload.
    await page.reload();
    await expect(page.locator(`[data-got] [data-item="${key}"]`)).toBeVisible();

    await page.locator(`[data-got] [data-item="${key}"]`).click();
    await expect(page.locator(`[data-to-buy] [data-item="${key}"]`)).toBeVisible();
    await expect(page.locator("[data-basket]")).toBeHidden();
  });

  test("removing a recipe recalculates the list", async ({ page }) => {
    const data = await loadSiteData(page);
    test.skip(data.recipes.length < 2, "needs two recipes");
    const [a, b] = data.recipes;

    await setList(page, { recipes: [a.slug, b.slug] });
    await page.reload();
    await page.getByRole("button", { name: `Remove ${b.title} from list` }).click();

    const expected = expectedItems(data, [a.slug]);
    await expect(page.locator(".list-recipe")).toHaveCount(1);
    await expect(page.locator("[data-to-buy] [data-item]")).toHaveCount(expected.length);
    await expect(page.locator("[data-list-count]")).toHaveCount(0); // no LIST button on this page
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kondate:list")));
    expect(stored.recipes).toEqual([a.slug]);
  });

  test("Start over empties the list", async ({ page }) => {
    const data = await loadSiteData(page);
    const recipe = data.recipes[0];
    await setList(page, { recipes: [recipe.slug], checked: [recipe.ingredients[0].item] });
    await page.reload();

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.locator("[data-empty]")).toBeVisible();
    await expect(page.locator("[data-summary]")).toHaveText("0 recipes · 0 items");
    await expect(page.locator("[data-basket]")).toBeHidden();
  });

  test("Share list copies a text list when the share sheet isn't available", async ({ page }) => {
    // Simulate a browser without navigator.share and capture what gets copied.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      window.__copied = null;
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } },
        configurable: true,
      });
    });
    const data = await loadSiteData(page);
    const recipe = data.recipes[0];
    await setList(page, { recipes: [recipe.slug] });
    await page.reload();

    await page.getByRole("button", { name: "Share list" }).click();
    await expect(page.locator("[data-share-label]")).toHaveText("Copied");

    const copied = await page.evaluate(() => window.__copied);
    for (const { item } of recipe.ingredients) {
      expect(copied).toContain(data.ingredients[item].name);
    }
  });

  test("Close goes back to the menu", async ({ page }) => {
    await page.goto("list/");
    await page.getByRole("link", { name: "Close grocery list" }).click();
    await expect(page.locator(".menu-grid")).toBeVisible();
  });
});
