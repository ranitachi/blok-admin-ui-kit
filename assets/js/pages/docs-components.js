/* ==========================================================================
   BLOK pages/docs-components.js — filter tabel komponen (documentation/components.html).
   ========================================================================== */
(function () {
  "use strict";

  window.NB.ready(function () {
    var input = document.querySelector("[data-ci-filter]");
    var count = document.querySelector("[data-ci-count]");
    if (!input || !count) return;
    var rows = Array.prototype.slice.call(document.querySelectorAll(".nb-table tbody tr"));
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var n = 0;
      rows.forEach(function (r) {
        var ok = !q || r.textContent.toLowerCase().indexOf(q) !== -1;
        r.hidden = !ok;
        if (ok) n++;
      });
      count.textContent = n + " komponen";
    });
  });
})();
