# Kondate

Our recipe menu: what we can cook, what to buy, and where to buy it.
Built with Jekyll and hosted on GitHub Pages. See `CLAUDE.md` for the full spec.

## Add a recipe

1. Put a **square** dish photo in `assets/dishes/` (e.g. `egg-bites.jpg`, about 1200×1200, JPG).
2. Put ingredient product photos in `assets/ingredients/` (optional).
3. Add any new ingredients to `_data/ingredients.yml`.
4. Create `_recipes/<slug>.md` (the file name becomes the URL, `/recipes/<slug>/`):

   ```markdown
   ---
   title: Egg bites
   number: 3
   photo: /assets/dishes/egg-bites.jpg
   tags: [protein, quick]
   servings: 2
   nutrition: { calories: 300, protein: 20, carbs: 5, fat: 20, fiber: 1 }
   ingredients:
     - item: eggs
       amount: 6
   ---

   1. First step.
   2. Second step.
   ```

5. Commit and push. GitHub Pages rebuilds in about a minute.

## Preview locally

```bash
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" LANG=en_US.UTF-8
bundle install
bundle exec jekyll serve --livereload
```

Then open http://localhost:4000/kondate/

## Tests

Browser tests (Playwright) build the site and click through the menu, dish page and
grocery list on a desktop and a phone screen. They also check recipe files for
mistakes, like an ingredient that isn't in `_data/ingredients.yml` or a missing photo.

```bash
npm install
npx playwright install chromium
npm test
```

The tests run automatically before every `git push` and stop the push if anything
fails. On a new computer, turn that on once with:

```bash
git config core.hooksPath .githooks
```
