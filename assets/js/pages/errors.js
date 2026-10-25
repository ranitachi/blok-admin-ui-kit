/* ==========================================================================
   BLOK errors.js — aksi halaman error (kembali, cari, coba lagi, salin kode).
   ========================================================================== */
(function () {
  "use strict";
  var NB = (window.NB = window.NB || {});

  function initBack() {
    NB.qsa("[data-go-back]").forEach(function (btn) {
      if (window.history.length > 1) {
        btn.hidden = false;
        btn.addEventListener("click", function () {
          window.history.back();
        });
      }
    });
  }

  function initSearch() {
    NB.qsa("[data-err-search]").forEach(function (root) {
      var input = NB.qs("[data-err-search-input]", root);
      var items = NB.qsa("[data-err-search-list] li", root);
      var count = NB.qs("[data-err-search-count]", root);
      var empty = NB.qs("[data-err-search-empty]", root);
      if (!input) return;
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        var n = 0;
        items.forEach(function (li) {
          var show = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
          li.hidden = !show;
          if (show) n++;
        });
        if (count) count.textContent = n + " halaman";
        if (empty) empty.hidden = n > 0;
      });
    });
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy gagal"));
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function initRetryCopy() {
    NB.qsa("[data-retry]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.location.reload();
      });
    });
    NB.qsa("[data-copy-ref]").forEach(function (btn) {
      var code = NB.qs("[data-ref-code]");
      if (!code) return;
      btn.addEventListener("click", function () {
        copyText(code.textContent.trim()).then(
          function () {
            NB.toast({ type: "success", title: "Kode disalin (demo)", message: code.textContent.trim() });
          },
          function () {
            NB.toast({ type: "warning", title: "Gagal menyalin", message: "Pilih dan salin kode secara manual." });
          }
        );
      });
    });
  }

  NB.ready(function () {
    initBack();
    initSearch();
    initRetryCopy();
  });
})();
