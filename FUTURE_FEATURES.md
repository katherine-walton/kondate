# Kondate — Future Features

Ideas we've agreed on but aren't building in the first version. Each one notes what it needs so it can be picked up later without re-deciding.

---

## 1. Store-specific ingredient photos (switchable)

**Status:** Planned · not in v1

**Why:** The same ingredient can look different depending on the store (e.g. Costco's salmon pack vs. Trader Joe's). Showing the right package helps when shopping.

**Design (the "middle option"):**

- Each ingredient shows **one main photo** at a time.
- Below it, the store names appear as small tappable labels (e.g. `COSTCO · TRADER JOE'S`).
- Tapping a store label swaps the main photo to that store's version and highlights the selected label.
- The first store in the data is selected by default.
- If an ingredient only has one store or one photo, the labels are plain text (not tappable).
- Applies to the dish detail page; the grocery list can use the same pattern or stick to the default photo.

**Data — already supported in v1:** each ingredient in `_data/ingredients.yml` stores a list of store + photo pairs, so no recipe files need to change:

```yaml
salmon-fillet:
  name: Salmon fillets
  unit: [fillet, fillets]
  options:
    - store: Costco
      photo: /assets/ingredients/salmon-costco.jpg
    - store: Trader Joe's
      photo: /assets/ingredients/salmon-tj.jpg
```

**v1 behaviour until then:** show the first option's photo; list all store names as plain text underneath.

**Open questions:**

- Should the chosen store be remembered (e.g. "I'm shopping at Costco today" applies to all ingredients)?

---

## 2. Serving size options

**Status:** Planned · not in v1

**Why:** Sometimes we cook for two, sometimes for leftovers or guests.

**Design:**

- On the dish detail page, a small segmented control next to the Ingredients heading: `SERVES 2 · 4 · 6` (default = the recipe's base servings).
- Changing it scales every ingredient amount on the page.
- "Add to grocery list" adds the recipe **at the selected serving size**.
- The grocery list's recipe cards show the serving size (e.g. `SERVES 4`) and allow changing it there; totals recalculate.
- Nutrition stays **per serving** (does not change).

**Data needed:**

- `servings:` (base number) in each recipe's front matter — already planned for v1.
- Optional `serving_options: [2, 4, 6]` per recipe; fall back to a site default.

**Rules to decide:**

- Rounding for display (e.g. 1.5 cups → "1½ cups"; eggs always round up to whole numbers).
- Per-ingredient `round: up` flag for things bought whole (cans, fillets, bunches).

---

## Other ideas (parked)

- Filters on the menu page (Quick / High protein / High fiber), designed in an early mockup, then removed for simplicity.
- Pantry staples flag, hiding salt, oil, soy sauce, etc. from the grocery list unless toggled on.
