/* ==========================================================================
   BLOK pages/analytics.js — KPI dashboard analitik mengikuti rentang waktu.
   Chart batang diperbarui oleh charts.js (data-chart-range-for); file ini
   hanya mengganti angka KPI. Data contoh fiktif, tanpa server.
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;
  var UP = '<svg class="nb-icon nb-icon--sm" aria-hidden="true"><use href="#i-arrow-up"></use></svg>';
  var DOWN = '<svg class="nb-icon nb-icon--sm" aria-hidden="true"><use href="#i-arrow-down"></use></svg>';

  /* Total peminjaman = jumlah bar pada NB.data.loans untuk rentang yang sama. */
  var KPI = {
    "7h": {
      label: "7 hari terakhir",
      loans: ["136", UP + "4,6%", "vs 7 hari sebelumnya"],
      approval: ["87%", UP + "3 poin", "rasio konversi pengajuan"],
      duration: ["2,8 hari", DOWN + "0,3 hari", "lebih singkat"],
      users: ["29", UP + "2", "orang dengan ≥1 transaksi"]
    },
    "30h": {
      label: "30 hari terakhir",
      loans: ["450", DOWN + "1,8%", "vs 30 hari sebelumnya"],
      approval: ["85%", UP + "1 poin", "rasio konversi pengajuan"],
      duration: ["3,9 hari", DOWN + "0,4 hari", "lebih singkat"],
      users: ["41", UP + "5", "orang dengan ≥1 transaksi"]
    },
    "12b": {
      label: "12 bulan terakhir",
      loans: ["3.000", UP + "6,1%", "vs 12 bulan sebelumnya"],
      approval: ["84%", UP + "2 poin", "rasio konversi pengajuan"],
      duration: ["4,2 hari", DOWN + "0,6 hari", "lebih singkat"],
      users: ["58", UP + "9", "orang dengan ≥1 transaksi"]
    }
  };

  NB.ready(function () {
    var group = NB.qs('[data-chart-range-for="anLoans"]');
    if (!group) return;
    var status = NB.qs("[data-an-status]");

    function apply(range) {
      var set = KPI[range];
      if (!set) return;
      Object.keys(set).forEach(function (key) {
        if (key === "label") return;
        var v = NB.qs('[data-an-kpi="' + key + '"]');
        var d = NB.qs('[data-an-delta="' + key + '"]');
        var m = NB.qs('[data-an-meta="' + key + '"]');
        if (v) v.textContent = set[key][0];
        if (d) d.innerHTML = set[key][1];
        if (m) m.textContent = set[key][2];
      });
      if (status) status.textContent = "Rentang " + set.label + " dipilih. KPI dan chart diperbarui.";
    }

    NB.qsa("[data-range]", group).forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-range"));
      });
    });
  });
})();
