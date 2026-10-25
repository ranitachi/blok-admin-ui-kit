/* ==========================================================================
   BLOK pages/pricing.js — toggle bulanan/tahunan & pilih paket (demo).
   Harga ada di atribut data-monthly / data-yearly pada [data-price] & [data-price-note].
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  NB.ready(function () {
    var group = NB.qs("[data-billing]");
    var status = NB.qs("[data-billing-status]");

    if (group)
      group.addEventListener("nb:toggle-group", function (e) {
        var mode = e.detail.value === "yearly" ? "yearly" : "monthly";
        NB.qsa("[data-price], [data-price-note]").forEach(function (el) {
          var v = el.getAttribute("data-" + mode);
          if (v) el.textContent = v;
        });
        if (status) {
          status.textContent =
            mode === "yearly" ? "Harga per bulan, ditagih tahunan (hemat 20%)." : "Harga per bulan, ditagih bulanan.";
        }
      });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-plan]");
      if (!btn) return;
      var yearly = group && NB.qs('[value="yearly"][aria-pressed="true"]', group);
      NB.toast({
        type: "success",
        title: "Paket " + btn.getAttribute("data-plan") + " dipilih (demo)",
        message: (yearly ? "Tagihan tahunan. " : "Tagihan bulanan. ") + "Tidak ada pembayaran atau langganan yang dibuat."
      });
    });
  });
})();
