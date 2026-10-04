// Dish page: add to grocery list, cooking mode (step + ingredient check-off), screen wake lock.
(function () {
  var root = document.querySelector("[data-dish]");
  if (!root) return;
  var slug = root.getAttribute("data-slug");

  // ---------- Add to grocery list ----------
  var addBtn = root.querySelector("[data-add-toggle]");
  var addLabel = root.querySelector("[data-add-label]");

  function renderAdded() {
    var added = window.KondateList.load().recipes.indexOf(slug) !== -1;
    addBtn.setAttribute("aria-pressed", String(added));
    addBtn.classList.toggle("btn--filled", !added);
    addBtn.classList.toggle("btn--outline", added);
    addLabel.textContent = added ? "Added to list" : "Add to grocery list";
  }

  addBtn.addEventListener("click", function () {
    var state = window.KondateList.load();
    var i = state.recipes.indexOf(slug);
    if (i === -1) state.recipes.push(slug);
    else state.recipes.splice(i, 1);
    window.KondateList.save(state);
    renderAdded();
  });
  window.addEventListener("storage", renderAdded);
  renderAdded();

  // ---------- Cooking mode: steps built from the recipe's Markdown list ----------
  var stepsHost = root.querySelector("[data-cook-steps]");
  var doneLabel = root.querySelector("[data-done-label]");
  var stepItems = root.querySelectorAll("[data-steps] ol > li");

  stepItems.forEach(function (li, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cook-step";
    btn.setAttribute("aria-pressed", "false");
    var no = document.createElement("span");
    no.className = "cook-step__no";
    no.textContent = String(i + 1).padStart(2, "0");
    var text = document.createElement("span");
    text.className = "cook-step__text";
    text.innerHTML = li.innerHTML;
    btn.appendChild(no);
    btn.appendChild(text);
    stepsHost.appendChild(btn);
  });

  function renderDone() {
    var steps = stepsHost.querySelectorAll(".cook-step");
    var done = stepsHost.querySelectorAll('.cook-step[aria-pressed="true"]').length;
    doneLabel.textContent = done + " of " + steps.length + " done";
  }

  // Steps and ingredient rows both toggle aria-pressed on tap.
  root.addEventListener("click", function (e) {
    var btn = e.target.closest(".cook-step, [data-check]");
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(btn.getAttribute("aria-pressed") !== "true"));
    renderDone();
  });
  renderDone();

  // ---------- Cooking mode toggle + wake lock ----------
  var toggle = root.querySelector("[data-cooking-toggle]");
  var browseView = root.querySelector('[data-view="browse"]');
  var cookView = root.querySelector('[data-view="cooking"]');
  var cooking = false;
  var wakeLock = null;

  function requestWakeLock() {
    if (!("wakeLock" in navigator) || wakeLock) return;
    navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
      lock.addEventListener("release", function () { wakeLock = null; });
    }).catch(function () {});
  }

  function releaseWakeLock() {
    if (wakeLock) wakeLock.release();
    wakeLock = null;
  }

  function setCooking(on) {
    cooking = on;
    toggle.setAttribute("aria-pressed", String(on));
    browseView.hidden = on;
    cookView.hidden = !on;
    if (on) requestWakeLock();
    else releaseWakeLock();
  }

  toggle.addEventListener("click", function () { setCooking(!cooking); });

  // The browser drops the lock when the tab is hidden; take it back on return.
  document.addEventListener("visibilitychange", function () {
    if (cooking && document.visibilityState === "visible") requestWakeLock();
  });
  window.addEventListener("pagehide", releaseWakeLock);
})();
