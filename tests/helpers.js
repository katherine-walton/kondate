// Shared test helpers. Tests read the real recipe data from the built site,
// so they keep working as recipes are added, changed or removed.
const { expect } = require("@playwright/test");

/** Recipe + ingredient data, as embedded in the grocery list page. */
async function loadSiteData(page) {
  await page.goto("list/");
  const json = await page.locator("#kondate-data").textContent();
  return JSON.parse(json);
}

/** Same formatting the site uses: "1 cup", "2 cups", "3". */
function formatAmount(amount, unit) {
  const u = unit ? (amount === 1 ? unit[0] : unit[1]) : "";
  return u ? `${amount} ${u}` : String(amount);
}

function pad(n) {
  return (n < 10 ? "0" : "") + n;
}

/** Put recipes on the grocery list directly (as if added from dish pages). */
async function setList(page, state) {
  await page.evaluate((s) => {
    localStorage.setItem("kondate:list", JSON.stringify({ recipes: [], checked: [], ...s }));
  }, state);
}

/** Fail the test on any JavaScript error or console error. */
function watchForErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return {
    check() {
      expect(errors, "page errors").toEqual([]);
    },
  };
}

async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(0);
}

module.exports = { loadSiteData, formatAmount, pad, setList, watchForErrors, expectNoHorizontalScroll };
