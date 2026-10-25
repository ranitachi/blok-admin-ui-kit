/* ==========================================================================
   BLOK pages/reports.js — laporan.
   - Pilih periode: menukar tabel di area cetak (#report-print).
   - Unduh CSV: dibuat di browser dari tabel periode terpilih (Blob), tanpa server.
     data-report-csv="0,2,3" = indeks kolom; kosong = semua kolom.
   Tombol cetak memakai data-print (app.js).
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  NB.ready(function () {
    var select = NB.qs("[data-report-select]");
    var label = NB.qs("[data-report-label]");
    var status = NB.qs("[data-report-status]");
    var periods = NB.qsa("[data-report-period]");
    if (!periods.length) return;

    function current() {
      return (
        periods.filter(function (p) {
          return !p.hidden;
        })[0] || periods[0]
      );
    }

    if (select)
      select.addEventListener("change", function () {
        var chosen = null;
        periods.forEach(function (p) {
          var on = p.getAttribute("data-report-period") === select.value;
          p.hidden = !on;
          if (on) chosen = p;
        });
        if (!chosen) return;
        var title = chosen.getAttribute("data-report-title");
        if (label) label.textContent = title;
        if (status) status.textContent = "Tabel laporan diganti ke " + title + ".";
      });

    function cellText(cell) {
      return cell.textContent.replace(/\s+/g, " ").trim();
    }
    function quote(v) {
      return /[";,\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }

    function toCsv(table, cols) {
      return NB.qsa("tr", table)
        .map(function (tr) {
          var cells = NB.qsa("th, td", tr).map(cellText);
          if (cols) cells = cols.map(function (i) {
            return cells[i] === undefined ? "" : cells[i];
          });
          return cells.map(quote).join(";");
        })
        .join("\r\n");
    }

    NB.qsa("[data-report-csv]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var period = current();
        var table = NB.qs("[data-report-table]", period);
        if (!table) return;
        var spec = btn.getAttribute("data-report-csv");
        var cols = spec
          ? spec.split(",").map(function (n) {
              return Number(n);
            })
          : null;
        var key = period.getAttribute("data-report-period");
        var name = (btn.getAttribute("data-report-name") || "laporan") + "-" + key + ".csv";
        // BOM agar Excel membaca UTF-8; pemisah titik koma sesuai lokal Indonesia.
        var csv = "﻿" + toCsv(table, cols);
        try {
          var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.hidden = true;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 1000);
          NB.toast({
            type: "success",
            title: "CSV dibuat (demo)",
            message: name + " — " + period.getAttribute("data-report-title") + ". Dibuat di browser, tidak ada data yang dikirim."
          });
        } catch (err) {
          NB.toast({ type: "danger", title: "CSV gagal dibuat", message: "Browser ini tidak mendukung unduhan Blob (demo)." });
        }
      });
    });
  });
})();
