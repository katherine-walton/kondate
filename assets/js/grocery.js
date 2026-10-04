// Grocery list page: sums ingredients across the recipes on the list,
// tap-to-basket check-off, remove recipe, start over, share.
(function () {
  var root = document.querySelector("[data-grocery]");
  if (!root) return;

  var data = JSON.parse(document.getElementById("kondate-data").textContent);
  var catalog = data.ingredients || {};
  var recipesBySlug = {};
  data.recipes.forEach(function (r) { recipesBySlug[r.slug] = r; });

  var CHECK_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var CLOSE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // ---------- Helpers ----------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function assetUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return data.baseurl + path;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Avoid 0.30000000000000004 when adding fractions.
  function round(n) { return Math.round(n * 100) / 100; }

  function formatAmount(amount, unit) {
    var u = unit ? (amount === 1 ? unit[0] : unit[1]) : "";
    return u ? amount + " " + u : String(amount);
  }

  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  function photoBox(src, alt, className) {
    if (src) {
      var img = el("img", className);
      img.src = src;
      img.alt = alt || "";
      img.loading = "lazy";
      return img;
    }
    var ph = el("span", className + " photo-placeholder photo-placeholder--small", "PHOTO");
    ph.setAttribute("aria-hidden", "true");
    return ph;
  }

  // ---------- Build the list from state ----------

  // Returns ingredient rows in order of first appearance across the listed recipes.
  function buildItems(recipes) {
    var byKey = {};
    var order = [];
    recipes.forEach(function (r) {
      (r.ingredients || []).forEach(function (line) {
        var key = line.item;
        var amount = Number(line.amount) || 0;
        if (!byKey[key]) {
          var ing = catalog[key] || { name: key, unit: ["", ""], options: [] };
          var options = ing.options || [];
          byKey[key] = {
            key: key,
            name: ing.name || key,
            unit: ing.unit || ["", ""],
            photo: options[0] ? assetUrl(options[0].photo) : null,
            stores: options.map(function (o) { return o.store; }),
            total: 0,
            parts: []
          };
          order.push(key);
        }
        var item = byKey[key];
        item.total = round(item.total + amount);
        item.parts.push({ title: r.title, amount: amount });
      });
    });
    return order.map(function (k) { return byKey[k]; });
  }

  function currentRecipes(state) {
    return state.recipes
      .map(function (slug) { return recipesBySlug[slug]; })
      .filter(Boolean);
  }

  // ---------- Render ----------

  var recipesHost = root.querySelector("[data-recipes]");
  var emptyNote = root.querySelector("[data-empty]");
  var toBuyHost = root.querySelector("[data-to-buy]");
  var gotHost = root.querySelector("[data-got]");
  var basket = root.querySelector("[data-basket]");

  function renderRecipeCard(r) {
    var li = el("li", "list-recipe");
    li.appendChild(photoBox(assetUrl(r.photo), "", "list-recipe__photo"));

    var link = el("a", "list-recipe__link");
    link.href = r.url;
    link.appendChild(el("span", "dish-card__no", "NO. " + pad(r.number)));
    link.appendChild(el("span", "list-recipe__name", r.title));
    li.appendChild(link);

    var remove = el("button", "icon-btn");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove " + r.title + " from list");
    remove.setAttribute("data-remove", r.slug);
    remove.innerHTML = CLOSE_SVG;
    li.appendChild(remove);
    return li;
  }

  function renderItem(item, got) {
    var li = el("li");
    var btn = el("button", "grocery-item" + (got ? " grocery-item--got" : ""));
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(got));
    btn.setAttribute("data-item", item.key);

    var box = el("span", "checkbox checkbox--lg");
    box.setAttribute("aria-hidden", "true");
    if (got) box.innerHTML = CHECK_SVG;
    btn.appendChild(box);

    var total = formatAmount(item.total, item.unit);

    if (got) {
      btn.appendChild(el("span", "grocery-item__name", item.name));
      btn.appendChild(el("span", "grocery-item__total", total));
    } else {
      btn.appendChild(photoBox(item.photo, item.name, "grocery-item__photo"));
      var body = el("span", "grocery-item__body");
      var line = el("span", "leader-line");
      line.appendChild(el("span", "leader-line__name", item.name));
      var leader = el("span", "leader");
      leader.setAttribute("aria-hidden", "true");
      line.appendChild(leader);
      line.appendChild(el("span", "leader-line__value grocery-item__total", total));
      body.appendChild(line);
      if (item.stores.length) {
        body.appendChild(el("span", "grocery-item__stores", item.stores.join(" · ")));
      }
      if (item.parts.length > 1) {
        var breakdown = item.parts.map(function (p) {
          return p.title + " " + formatAmount(p.amount, item.unit);
        }).join(" + ");
        body.appendChild(el("span", "grocery-item__breakdown", breakdown));
      }
      btn.appendChild(body);
    }
    li.appendChild(btn);
    return li;
  }

  function render() {
    var state = window.KondateList.load();
    var recipes = currentRecipes(state);
    var items = buildItems(recipes);
    var checked = {};
    state.checked.forEach(function (k) { checked[k] = true; });
    var toBuy = items.filter(function (i) { return !checked[i.key]; });
    var got = items.filter(function (i) { return checked[i.key]; });

    root.querySelector("[data-summary]").textContent =
      plural(recipes.length, "recipe") + " · " + plural(items.length, "item");

    recipesHost.replaceChildren.apply(recipesHost, recipes.map(renderRecipeCard));
    emptyNote.hidden = recipes.length > 0;

    toBuyHost.replaceChildren.apply(toBuyHost, toBuy.map(function (i) { return renderItem(i, false); }));
    root.querySelector("[data-left-label]").textContent = toBuy.length + " left";

    gotHost.replaceChildren.apply(gotHost, got.map(function (i) { return renderItem(i, true); }));
    root.querySelector("[data-got-label]").textContent = String(got.length);
    basket.hidden = got.length === 0;

    return { recipes: recipes, items: items, toBuy: toBuy, got: got };
  }

  // ---------- Actions ----------

  root.addEventListener("click", function (e) {
    var state = window.KondateList.load();

    var itemBtn = e.target.closest("[data-item]");
    if (itemBtn) {
      var key = itemBtn.getAttribute("data-item");
      var i = state.checked.indexOf(key);
      if (i === -1) state.checked.push(key);
      else state.checked.splice(i, 1);
      window.KondateList.save(state);
      render();
      return;
    }

    var removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      var slug = removeBtn.getAttribute("data-remove");
      state.recipes = state.recipes.filter(function (s) { return s !== slug; });
      // Forget check marks for items no longer on the list.
      var stillNeeded = {};
      buildItems(currentRecipes(state)).forEach(function (it) { stillNeeded[it.key] = true; });
      state.checked = state.checked.filter(function (k) { return stillNeeded[k]; });
      window.KondateList.save(state);
      render();
    }
  });

  root.querySelector("[data-clear]").addEventListener("click", function () {
    window.KondateList.save({ recipes: [], checked: [] });
    render();
  });

  // ---------- Share ----------

  var shareLabel = root.querySelector("[data-share-label]");

  function shareText() {
    var view = render();
    var lines = ["Grocery list", ""];
    if (!view.items.length) lines.push("(empty)");
    view.toBuy.forEach(function (i) {
      var stores = i.stores.length ? " (" + i.stores.join(", ") + ")" : "";
      lines.push("- " + i.name + ": " + formatAmount(i.total, i.unit) + stores);
    });
    if (view.got.length) {
      lines.push("", "Already in the basket:");
      view.got.forEach(function (i) { lines.push("- " + i.name); });
    }
    if (view.recipes.length) {
      lines.push("", "For: " + view.recipes.map(function (r) { return r.title; }).join(", "));
    }
    return lines.join("\n");
  }

  function flashLabel(text) {
    shareLabel.textContent = text;
    setTimeout(function () { shareLabel.textContent = "Share list"; }, 2000);
  }

  function copyFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { flashLabel("Copied"); },
        function () { flashLabel("Couldn't copy"); }
      );
    } else {
      flashLabel("Couldn't copy");
    }
  }

  root.querySelector("[data-share]").addEventListener("click", function () {
    var text = shareText();
    if (navigator.share) {
      navigator.share({ title: "Grocery list", text: text }).catch(function (err) {
        // Dismissing the share sheet is not an error worth reporting.
        if (!err || err.name !== "AbortError") copyFallback(text);
      });
    } else {
      copyFallback(text);
    }
  });

  window.addEventListener("storage", render);
  render();
})();
