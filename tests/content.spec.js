// Checks the recipe files and ingredient catalog are filled in correctly.
// These catch typos when adding a recipe (e.g. an ingredient key that doesn't exist).
const { test, expect } = require("@playwright/test");
const { loadSiteData } = require("./helpers");

test.describe("recipe content", () => {
  // Data checks don't depend on screen size.
  test.skip(({ isMobile }) => isMobile, "runs once, on desktop");

  test("every recipe has a title and a unique number", async ({ page }) => {
    const data = await loadSiteData(page);
    expect(data.recipes.length).toBeGreaterThan(0);

    const numbers = data.recipes.map((r) => r.number);
    for (const r of data.recipes) {
      expect(r.title, `${r.slug}: title`).toBeTruthy();
      expect(Number.isInteger(r.number), `${r.slug}: number should be a whole number`).toBe(true);
    }
    expect(new Set(numbers).size, "recipe numbers should not repeat").toBe(numbers.length);
  });

  test("every recipe ingredient exists in _data/ingredients.yml with an amount", async ({ page }) => {
    const data = await loadSiteData(page);
    for (const r of data.recipes) {
      expect(r.ingredients?.length, `${r.slug}: needs at least one ingredient`).toBeGreaterThan(0);
      for (const line of r.ingredients) {
        expect(data.ingredients[line.item], `${r.slug}: unknown ingredient "${line.item}"`).toBeTruthy();
        expect(typeof line.amount, `${r.slug}: "${line.item}" amount should be a number`).toBe("number");
        expect(line.amount, `${r.slug}: "${line.item}" amount`).toBeGreaterThan(0);
      }
    }
  });

  test("every ingredient has a name, a [singular, plural] unit and a store", async ({ page }) => {
    const data = await loadSiteData(page);
    const stores = ["Costco", "Whole Foods", "Trader Joe's", "Grocery"];
    for (const [key, ing] of Object.entries(data.ingredients)) {
      expect(ing.name, `${key}: name`).toBeTruthy();
      expect(Array.isArray(ing.unit) && ing.unit.length === 2, `${key}: unit should be [singular, plural]`).toBe(true);
      expect(ing.options?.length, `${key}: needs at least one store`).toBeGreaterThan(0);
      for (const opt of ing.options) {
        expect(stores, `${key}: unknown store "${opt.store}"`).toContain(opt.store);
      }
    }
  });

  test("every photo that's referenced exists", async ({ page, request }) => {
    const data = await loadSiteData(page);
    const photos = [
      ...data.recipes.map((r) => [r.slug, r.photo]),
      ...Object.entries(data.ingredients).flatMap(([key, ing]) =>
        (ing.options || []).map((o) => [key, o.photo])
      ),
    ].filter(([, p]) => p);

    for (const [owner, path] of photos) {
      const res = await request.get(data.baseurl + path);
      expect(res.status(), `${owner}: missing photo ${path}`).toBe(200);
    }
  });
});
