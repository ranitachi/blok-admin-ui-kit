/* ==========================================================================
   BLOK pages/ops-dashboard.js — peringatan dashboard operasional.
   Tombol "Tampilkan lagi" muncul setelah ada peringatan yang ditutup.
   Status tutup hanya berlaku di tampilan ini (demo, tanpa penyimpanan).
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  NB.ready(function () {
    var box = NB.qs("#ops-alerts");
    var restore = NB.qs("[data-ops-restore]");
    if (!box || !restore) return;

    box.addEventListener("nb:dismiss", function () {
      restore.hidden = false;
    });
    restore.addEventListener("click", function () {
      // components.js memunculkan kembali alert lewat data-undismiss.
      // Tunggu handler delegasi di document selesai sebelum memindah fokus.
      setTimeout(function () {
        restore.hidden = true;
        var first = NB.qs(".nb-alert:not([hidden]) .nb-alert__close", box);
        if (first) first.focus();
      }, 0);
      NB.toast({ type: "info", title: "Peringatan ditampilkan lagi", message: "Hanya di tampilan ini (demo)." });
    });
  });
})();
