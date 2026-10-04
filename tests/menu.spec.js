const { test, expect } = require("@playwright/test");
const { loadSiteData, pad, setList, watchForErrors, expectNoHorizontalScroll } = require("./helpers");

test.describe("menu page", () => {
  test("shows a card for every recipe, in number order", async ({ page }) => {
    const data = await loadSiteData(page);
    const errors = watchForErrors(page);
    await page.goto("./");

    const sorted = [...data.recipes].sort((a, b) => a.number - b.number);
    const cards = page.locator(".menu-grid .dish-card");
    await expect(cards).toHaveCount(sorted.length);

    for (let i = 0; i < sorted.length; i++) {
      const card = cards.nth(i);
      await expect(card).toContainText(`NO. ${pad(sorted[i].number)}`);
      await expect(card.locator(".dish-card__name")).toHaveText(sorted[i].title);
      await expect(card).toHaveAttribute("href", sorted[i].url);
    }

    await expectNoHorizontalScroll(page);
    errors.check();
  });

  test("clicking a card opens that dish", async ({ page }) => {
    const data = await loadSiteData(page);
    const first = [...data.recipes].sort((a, b) => a.number - b.number)[0];
    await page.goto("./");
    await page.locator(".menu-grid .dish-card").first().click();
    await expect(page).toHaveURL(new RegExp(first.url + "$"));
    await expect(page.locator("h1")).toHaveText(first.title);
  });

  test("LIST button shows how many recipes are on the list", async ({ page }) => {
    const data = await loadSiteData(page);
    await page.goto("./");
    const listButton = page.getByRole("link", { name: /grocery list/i });
    await expect(listButton).toContainText("List (0)");

    await setList(page, { recipes: data.recipes.slice(0, 2).map((r) => r.slug) });
    await page.reload();
    await expect(listButton).toContainText(`List (${Math.min(2, data.recipes.length)})`);

    await listButton.click();
    await expect(page).toHaveURL(/\/list\/$/);
  });
});
