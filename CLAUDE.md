# Kondate — Build Spec (v1)

A small, warm, minimalist recipe menu site so my husband can see what we can cook, what to buy, and where to buy it. Hosted on **GitHub Pages**. Designed for phone and desktop.

The approved mockups are in `design-mockups/` (see "Design reference" below). Future ideas live in `FUTURE_FEATURES.md`. Don't build those yet.

---

## Tech

- **Jekyll** (built natively by GitHub Pages; no custom build step or GitHub Action required).
- Plain HTML/CSS + a small amount of vanilla JavaScript. No framework.
- No server: all interactivity is client-side.
- Grocery list state is saved in `localStorage` (per device).

## Content structure

```
_recipes/                 # one Markdown file per recipe (Jekyll collection)
  miso-salmon-bowl.md
_data/
  ingredients.yml         # shared ingredient catalog
assets/
  dishes/                 # square dish photos
  ingredients/            # product photos
```

### Recipe file (`_recipes/*.md`)

```markdown
---
title: Miso salmon rice bowl
number: 1                  # shown as "NO. 01"; also the menu order
photo: /assets/dishes/miso-salmon.jpg   # square
tags: [protein, quick]     # any of: protein, quick, fiber
servings: 2
nutrition:                 # per serving, entered by hand
  calories: 520
  protein: 38
  carbs: 55
  fat: 14
  fiber: 4
ingredients:               # displayed in this order
  - item: salmon-fillet    # key in _data/ingredients.yml
    amount: 2              # in that ingredient's unit
  - item: white-miso
    amount: 2
notes: Optional free text.
addons:
  - Soft-boiled egg
  - Pickled ginger
---

1. Rinse the rice and start it cooking.
2. Stir the miso with a splash of water and brush it over the salmon.
3. ...
```

The Markdown body (an ordered list) is the recipe steps.

### Ingredient catalog (`_data/ingredients.yml`)

```yaml
salmon-fillet:
  name: Salmon fillets
  unit: [fillet, fillets]      # [singular, plural]; use ["", ""] for plain counts
  options:                     # store + photo pairs, in display order
    - store: Costco
      photo: /assets/ingredients/salmon-costco.jpg
    - store: Trader Joe's
      photo: /assets/ingredients/salmon-tj.jpg
```

Stores: `Costco`, `Whole Foods`, `Trader Joe's`, `Piazza`, `Grocery` (generic).
Each ingredient has exactly one unit, so amounts across recipes can be summed.
v1 shows the **first** option's photo and lists all store names as text.

---

## Pages

### 1. Menu (landing page, `/`)
- Header: `KONDATE` title (left), outlined `LIST (n)` button (right) linking to the grocery list; `n` = number of recipes on the list.
- Grid of dish cards with a 16px gap: `repeat(auto-fill, minmax(min(340px, 100%), 1fr))`. Cards keep the same size even when few are shown.
- Card (1px border): `NO. 01` + dish name (uppercase) → tag row with line icons (High protein / Quick / High fiber) → square photo with 12px inset.
- No store info and no filters on this page.
- Card links to the dish page.

### 2. Dish page (`/recipes/<slug>/`)
- Back link "← All dishes"; **Cooking mode** switch on the right.
- **Normal mode** (two columns on desktop, stacked on phone):
  - Left: large dish card (number, name, tags, square photo) + full-width `ADD TO GROCERY LIST` button (filled; becomes outlined "✓ Added to list").
  - Right: **Ingredients**. Each is a menu-style line `Name ........ amount`, with product photo(s) + store caption below (no borders/grid). Then a **Nutrition** card (per serving: Calories, Protein, Carbs, Fat, Fiber).
  - Below, full width: **Recipe** card with numbered steps (left) and Notes + Optional add-ons (right, divided by a 1px line).
- **Cooking mode:**
  - Hides photo, nutrition and add-to-list.
  - Shows compact title, then **Steps** first in larger text (18px); tapping a step crosses it off ("2 OF 5 DONE").
  - Ingredients as a tap-to-check list (no photos).
  - Keeps the screen awake using the Screen Wake Lock API where supported (release when turning off / leaving).

### 3. Grocery list (`/list/`)
- Header shows a filled `× CLOSE` button back to the menu.
- Title `GROCERY LIST` + summary (`2 RECIPES · 9 ITEMS`); buttons `SHARE LIST` (filled) and `START OVER` (outlined).
- **Recipes** column: small card per recipe (thumbnail, number, name, × remove). Removing recalculates totals.
- **To buy**: one row per ingredient, summed across recipes: checkbox, thumbnail, `Name ........ total`, store names below, and a breakdown line when shared (`Miso salmon 1 cup + Turkey taco 1 cup`).
- Tapping a row moves it to **In the basket** (crossed out); tapping again moves it back.
- **Share list**: `navigator.share()` with a plain-text list; fall back to copying to clipboard with a small "Copied" confirmation.
- State (recipes on list, checked items) persists in `localStorage`.

---

## Design system

| Token | Value |
|---|---|
| Background | `#F6F3ED` |
| Card fill | `#F9F7F2` |
| Ink (text, lines, filled buttons) | `#2B2823` |
| Muted text | `#5E5A52` |
| Done / disabled text | `#8F877A` |
| Photo placeholder | `#E6E0D5` |
| Font | **DM Mono** (Google Fonts, 300/400/500), fallback `SFMono-Regular, Menlo, Consolas, monospace` |
| Lines | 1px solid ink; dotted leaders `1px dotted #8F877A` |
| Corners | square (no border radius), except the cooking-mode switch |
| Page width | max 1124px, 20px side padding |
| Labels | 11–13px, uppercase, letter-spacing 0.04–0.08em |

- Inspiration: a ruled postcard / small Kyoto coffee-shop menu. Simple, warm, quiet.
- Icons: thin line SVGs (egg = protein, clock = quick, leaf = fiber, tote bag = list). No emoji.
- Touch targets at least 44px. Use real `<button>`/`<a>` elements, with `aria-label` on icon-only buttons and `aria-pressed` on toggles.

## Design reference

`design-mockups/*.dc.html` are the approved mockups from the design canvas. Treat them as **visual reference only** (layout, spacing, sizes, colors): they use a canvas-specific template format (`<x-dc>`, `<sc-for>`, `{{ }}`), not production code. The sample dishes, ingredients, steps and nutrition values in them are placeholders.

- `PostcardMenu.dc.html`: menu page
- `PostcardDetail.dc.html`: dish page (normal + cooking mode)
- `PostcardList.dc.html`: grocery list

## Out of scope for v1
See `FUTURE_FEATURES.md` (store-switchable photos, serving sizes, filters, pantry staples).
