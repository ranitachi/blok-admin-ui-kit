/* ==========================================================================
   BLOK pages/catalog.js — katalog halaman.
   Kartu mengambang "Unduh / GitHub" bisa disembunyikan; pilihan diingat
   di sessionStorage, jadi muncul lagi pada kunjungan berikutnya.
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;
  var KEY = "nb-fab-hidden";

  function remembered() {
    try {
      return window.sessionStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  NB.ready(function () {
    var fab = NB.qs("[data-fab]");
    if (!fab) return;

    if (remembered()) {
      fab.hidden = true;
      return;
    }

    var close = NB.qs("[data-fab-close]", fab);
    if (!close) return;

    close.addEventListener("click", function () {
      fab.hidden = true;
      try {
        window.sessionStorage.setItem(KEY, "1");
      } catch (e) {
        /* storage diblokir: kartu hanya tersembunyi sampai halaman dimuat ulang */
      }
      // Fokus tidak boleh hilang bersama tombol yang disembunyikan.
      var heading = NB.qs("main h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    });
  });
})();
