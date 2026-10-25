/* ==========================================================================
   BLOK pages/dashboard.js — tambah aset cepat (demo, hanya di tampilan ini).
   Tidak ada penyimpanan: data hilang saat halaman dimuat ulang.
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;
  var STATUS_LABEL = { success: "Baik", warning: "Perlu servis", danger: "Rusak berat" };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  NB.ready(function () {
    var form = NB.qs("#form-add-asset");
    var tbody = NB.qs("[data-recent-assets]");
    if (!form || !tbody) return;

    var nextId = 1285;
    var added = 0;
    var totalEl = NB.qs('[data-kpi-value="total"]');
    var countEl = NB.qs("[data-recent-count]");
    var nf = new Intl.NumberFormat("id-ID");

    form.addEventListener("nb:valid-submit", function (e) {
      var data = e.detail.data;
      var name = String(data.get("name")).trim();
      var status = data.get("status");
      var now = new Date();
      var iso = now.toISOString().slice(0, 10);
      var dateText = now.getDate() + " " + MONTHS[now.getMonth()] + " " + now.getFullYear();
      var id = "AST-26-" + nextId++;

      var tr = document.createElement("tr");
      tr.className = "is-new";
      tr.innerHTML =
        '<td class="nb-cell-id">' + id + "</td>" +
        '<td class="nb-cell-strong">' + NB.escapeHtml(name) + ' <span class="nb-badge nb-badge--ink">Baru</span></td>' +
        "<td>" + NB.escapeHtml(data.get("category")) + "</td>" +
        "<td>" + NB.escapeHtml(data.get("location")) + "</td>" +
        '<td><span class="nb-badge nb-badge--' + status + ' nb-badge--dot">' + STATUS_LABEL[status] + "</span></td>" +
        '<td class="nb-cell-muted"><time datetime="' + iso + '">' + dateText + "</time></td>";
      tbody.insertBefore(tr, tbody.firstChild);
      added++;

      if (totalEl) totalEl.textContent = nf.format(1284 + added);
      if (countEl) countEl.textContent = "Menampilkan " + (6 + added) + " entri (" + added + " ditambahkan di sesi ini)";

      NB.modal.close("modal-add-asset");
      NB.forms.reset(form);
      NB.toast({
        type: "success",
        title: "Aset " + id + " ditambahkan",
        message: "Hanya di tampilan ini (demo) — hilang saat halaman dimuat ulang."
      });
    });
  });
})();
