/* ==========================================================================
   BLOK pages/help.js — pusat bantuan.
   Pencarian teks + kartu kategori menyaring FAQ akordeon; jumlah hasil diumumkan.
   Form kontak hanya menampilkan toast (demo, tidak ada yang dikirim).
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  NB.ready(function () {
    var items = NB.qsa("[data-faq-item]");
    if (!items.length) return;

    var search = NB.qs("[data-faq-search]");
    var count = NB.qs("[data-faq-count]");
    var empty = NB.qs("[data-faq-empty]");
    var labelEl = NB.qs("[data-faq-label]");
    var cats = NB.qsa("[data-faq-cat]");
    var cat = "";
    var timer = null;

    function apply() {
      var q = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      items.forEach(function (item) {
        var ok = (!cat || item.getAttribute("data-faq-cat-of") === cat) && (!q || item.textContent.toLowerCase().indexOf(q) !== -1);
        item.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      var active = cats.filter(function (c) {
        return c.getAttribute("aria-pressed") === "true";
      })[0];
      var catName = active ? NB.qs(".nb-help-cat__label", active).textContent : "";
      if (labelEl) labelEl.textContent = catName ? "Kategori: " + catName : "Semua kategori";
      if (count) {
        clearTimeout(timer);
        // Tunda pengumuman agar tidak dibacakan pada setiap ketukan.
        timer = setTimeout(function () {
          count.textContent = shown + " pertanyaan" + (q || catName ? " cocok" : "");
        }, q ? 300 : 0);
      }
    }

    if (search) search.addEventListener("input", apply);

    cats.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") !== "true";
        cats.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn && on));
        });
        cat = on ? btn.getAttribute("data-faq-cat") : "";
        apply();
      });
    });

    var reset = NB.qs("[data-faq-reset]");
    if (reset)
      reset.addEventListener("click", function () {
        if (search) search.value = "";
        cats.forEach(function (b) {
          b.setAttribute("aria-pressed", "false");
        });
        cat = "";
        apply();
        if (search) search.focus();
      });

    var form = NB.qs("[data-help-form]");
    if (form)
      form.addEventListener("nb:valid-submit", function () {
        var topic = form.querySelector("[name=topic]");
        var topicText = topic && topic.selectedIndex > 0 ? topic.options[topic.selectedIndex].text : "";
        NB.forms.reset(form);
        NB.toast({
          type: "success",
          title: "Pertanyaan terkirim (demo)",
          message: (topicText ? "Topik " + topicText + ". " : "") + "Tidak ada pesan yang benar-benar dikirim."
        });
      });
  });
})();
