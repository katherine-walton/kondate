// Grocery list state, saved per device in localStorage.
// Shape: { recipes: ["miso-salmon-bowl", ...], checked: ["salmon-fillet", ...] }
(function () {
  var KEY = "kondate:list";

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY)) || {};
      return { recipes: data.recipes || [], checked: data.checked || [] };
    } catch (e) {
      return { recipes: [], checked: [] };
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
    renderCount(state);
  }

  // Keep every "LIST (n)" button in sync.
  function renderCount(state) {
    var n = (state || load()).recipes.length;
    document.querySelectorAll("[data-list-count]").forEach(function (el) {
      el.textContent = n;
    });
    document.querySelectorAll("[data-list-link]").forEach(function (el) {
      el.setAttribute("aria-label", "Open grocery list, " + n + (n === 1 ? " recipe" : " recipes"));
    });
  }

  window.KondateList = { load: load, save: save, renderCount: renderCount };

  renderCount();
  // Update when the list changes in another tab.
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) renderCount();
  });
})();
