const { test, expect } = require("@playwright/test");
const { loadSiteData, formatAmount, watchForErrors, expectNoHorizontalScroll } = require("./helpers");

test.describe("dish page", () => {
  test("every dish shows its ingredients, amounts, stores, nutrition and steps", async ({ page }) => {
    const data = await loadSiteData(page);

    for (const recipe of data.recipes) {
      const errors = watchForErrors(page);
      await page.goto(recipe.url);
      await expect(page.locator("h1")).toHaveText(recipe.title);

      const lines = page.locator(".ingredient");
      await expect(lines).toHaveCount(recipe.ingredients.length);
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const { item, amount } = recipe.ingredients[i];
        const ing = data.ingredients[item];
        const line = lines.nth(i);
        await expect(line.locator(".leader-line__name")).toHaveText(ing.name);
        await expect(line.locator(".leader-line__value")).toHaveText(formatAmount(amount, ing.unit));
        await expect(line.locator(".product__stores")).toHaveText(ing.options.map((o) => o.store).join(" · "));
      }

      await expect(page.locator(".nutrition dt")).toHaveText(["Calories", "Protein", "Carbs", "Fat", "Fiber"]);
      expect(await page.locator("[data-steps] ol > li").count(), `${recipe.slug}: steps`).toBeGreaterThan(0);

      await expectNoHorizontalScroll(page);
      errors.check();
    }
  });

  test("Add to grocery list toggles, updates the count and is remembered", async ({ page }) => {
    const data = await loadSiteData(page);
    const recipe = data.recipes[0];
    await page.goto(recipe.url);

    const add = page.locator("[data-add-toggle]");
    const count = page.locator("[data-list-count]");
    await expect(add).toHaveText(/Add to grocery list/i);
    await expect(count).toHaveText("0");

    await add.click();
    await expect(add).toHaveText(/Added to list/i);
    await expect(add).toHaveAttribute("aria-pressed", "true");
    await expect(count).toHaveText("1");

    await page.reload();
    await expect(add).toHaveText(/Added to list/i);
    await expect(count).toHaveText("1");

    await add.click();
    await expect(add).toHaveText(/Add to grocery list/i);
    await expect(count).toHaveText("0");
  });

  test("cooking mode shows steps to cross off and an ingredient checklist", async ({ page }) => {
    const data = await loadSiteData(page);
    const recipe = data.recipes[0];
    await page.goto(recipe.url);

    const toggle = page.getByRole("button", { name: /cooking mode/i });
    const browse = page.locator('[data-view="browse"]');
    const cooking = page.locator('[data-view="cooking"]');
    await expect(cooking).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(browse).toBeHidden();
    await expect(cooking).toBeVisible();

    const steps = cooking.locator(".cook-step");
    const stepCount = await page.locator("[data-steps] ol > li").count();
    await expect(steps).toHaveCount(stepCount);
    await expect(page.locator("[data-done-label]")).toHaveText(`0 of ${stepCount} done`);

    await steps.first().click();
    await expect(steps.first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-done-label]")).toHaveText(`1 of ${stepCount} done`);
    await steps.first().click();
    await expect(page.locator("[data-done-label]")).toHaveText(`0 of ${stepCount} done`);

    const checks = cooking.locator("[data-check]");
    await expect(checks).toHaveCount(recipe.ingredients.length);
    await checks.first().click();
    await expect(checks.first()).toHaveAttribute("aria-pressed", "true");

    await toggle.click();
    await expect(browse).toBeVisible();
    await expect(cooking).toBeHidden();
  });

  test("All dishes goes back to the menu", async ({ page }) => {
    const data = await loadSiteData(page);
    await page.goto(data.recipes[0].url);
    await page.getByRole("link", { name: "All dishes" }).click();
    await expect(page.locator(".menu-grid")).toBeVisible();
  });
});
