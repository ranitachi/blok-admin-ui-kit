/* ==========================================================================
   BLOK tables.js — tabel data sisi klien: cari, filter, urut, paginasi,
   pilih baris (select all + indeterminate), toolbar massal, kepadatan, reset.
   Semua perubahan hanya di tampilan (demo), tidak disimpan.

   <div data-table data-page-size="5">
     <input data-table-search>                      pencarian teks
     <select data-table-filter="status">            cocok dengan tr[data-status]
     <button data-table-reset>                      kembalikan kondisi awal
     <div data-table-density> <button aria-pressed value="dense|default|comfortable">
     <div data-table-bulkbar hidden> <span data-table-selected-count></span>
       <button data-table-bulk="delete|clear|export">
     <table> <th aria-sort="none" data-sort-type="text|number|date"><button data-sort>…
             <input data-table-select-all>  /  tr[data-row] <input data-table-select>
             <tbody data-table-empty hidden>   baris "tidak ada hasil"
     <p data-table-info>  <ul data-table-pagination>
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});

  function cellValue(row, index, type) {
    var cell = row.cells[index];
    if (!cell) return "";
    var raw = cell.getAttribute("data-sort-value");
    if (raw === null) raw = cell.textContent.trim();
    if (type === "number") return parseFloat(String(raw).replace(/\./g, "").replace(",", ".")) || 0;
    if (type === "date") return Date.parse(raw) || 0;
    return String(raw).toLowerCase();
  }

  function initTable(root) {
    var table = NB.qs("table", root);
    var body = table && NB.qs("tbody[data-table-body]", table);
    if (!body) body = table && NB.qs("tbody:not([data-table-empty])", table);
    if (!body) return;

    var emptyBody = NB.qs("[data-table-empty]", root);
    var search = NB.qs("[data-table-search]", root);
    var filters = NB.qsa("[data-table-filter]", root);
    var info = NB.qs("[data-table-info]", root);
    var pager = NB.qs("[data-table-pagination]", root);
    var selectAll = NB.qs("[data-table-select-all]", root);
    var bulkbar = NB.qs("[data-table-bulkbar]", root);
    var selCount = NB.qs("[data-table-selected-count]", root);
    var density = NB.qs("[data-table-density]", root);
    var headers = NB.qsa("thead th", table);
    var pageSize = parseInt(root.getAttribute("data-page-size"), 10) || 0;
    var label = root.getAttribute("data-table-label") || "baris";

    var original = NB.qsa("tr", body).map(function (r) {
      return r.cloneNode(true);
    });
    var rows = NB.qsa("tr", body);
    var state = { query: "", filters: {}, sortIndex: -1, sortDir: "none", page: 1 };

    function matches(row) {
      if (state.query) {
        var hay = (row.getAttribute("data-search") || row.textContent).toLowerCase();
        if (hay.indexOf(state.query) === -1) return false;
      }
      for (var key in state.filters) {
        var want = state.filters[key];
        if (want && row.getAttribute("data-" + key) !== want) return false;
      }
      return true;
    }

    function rowCheckbox(row) {
      return NB.qs("[data-table-select]", row);
    }

    function filtered() {
      var list = rows.filter(matches);
      if (state.sortIndex > -1 && state.sortDir !== "none") {
        var th = headers[state.sortIndex];
        var type = th.getAttribute("data-sort-type") || "text";
        var dir = state.sortDir === "ascending" ? 1 : -1;
        list = list
          .map(function (r, i) {
            return { r: r, i: i, v: cellValue(r, state.sortIndex, type) };
          })
          .sort(function (a, b) {
            if (a.v < b.v) return -dir;
            if (a.v > b.v) return dir;
            return a.i - b.i;
          })
          .map(function (x) {
            return x.r;
          });
      }
      return list;
    }

    function updateSelection(visibleRows) {
      var active = rows.filter(matches);
      // Baris yang tersaring keluar tidak ikut dipilih (mencegah aksi massal tak terlihat).
      rows.forEach(function (r) {
        var cb = rowCheckbox(r);
        if (cb && cb.checked && active.indexOf(r) === -1) cb.checked = false;
        r.classList.toggle("is-selected", !!(cb && cb.checked));
      });
      var selected = active.filter(function (r) {
        var cb = rowCheckbox(r);
        return cb && cb.checked;
      });
      if (selectAll) {
        var pageBoxes = visibleRows.map(rowCheckbox).filter(Boolean);
        var on = pageBoxes.filter(function (cb) {
          return cb.checked;
        }).length;
        selectAll.checked = pageBoxes.length > 0 && on === pageBoxes.length;
        selectAll.indeterminate = on > 0 && on < pageBoxes.length;
        selectAll.disabled = pageBoxes.length === 0;
      }
      if (bulkbar) bulkbar.hidden = selected.length === 0;
      if (selCount) selCount.textContent = selected.length + " " + label + " dipilih";
      return selected;
    }

    function pageButton(text, page, opts) {
      opts = opts || {};
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nb-pagination__btn";
      b.innerHTML = text;
      if (opts.label) b.setAttribute("aria-label", opts.label);
      if (opts.current) b.setAttribute("aria-current", "page");
      if (opts.disabled) b.disabled = true;
      b.setAttribute("data-page", String(page));
      li.appendChild(b);
      return li;
    }

    function renderPager(pages) {
      if (!pager) return;
      pager.innerHTML = "";
      if (pages <= 1) {
        pager.hidden = true;
        return;
      }
      pager.hidden = false;
      pager.appendChild(
        pageButton(NB.icons.svg("chevron-right", "nb-icon--sm nb-icon--flip"), state.page - 1, {
          label: "Halaman sebelumnya",
          disabled: state.page === 1
        })
      );
      for (var p = 1; p <= pages; p++) {
        var edge = p === 1 || p === pages || Math.abs(p - state.page) <= 1;
        if (!edge) {
          if (p === 2 || p === pages - 1) {
            var gap = document.createElement("li");
            gap.className = "nb-pagination__gap";
            gap.setAttribute("aria-hidden", "true");
            gap.textContent = "…";
            pager.appendChild(gap);
          }
          continue;
        }
        pager.appendChild(pageButton(String(p), p, { label: "Halaman " + p, current: p === state.page }));
      }
      pager.appendChild(
        pageButton(NB.icons.svg("chevron-right", "nb-icon--sm"), state.page + 1, {
          label: "Halaman berikutnya",
          disabled: state.page === pages
        })
      );
    }

    function render(announce) {
      var list = filtered();
      var total = list.length;
      var pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
      if (state.page > pages) state.page = pages;
      var start = pageSize ? (state.page - 1) * pageSize : 0;
      var end = pageSize ? Math.min(total, start + pageSize) : total;
      var visible = list.slice(start, end);

      // Susun ulang DOM sesuai urutan, sembunyikan baris di luar halaman/filter.
      list.forEach(function (r) {
        body.appendChild(r);
      });
      rows.forEach(function (r) {
        r.hidden = visible.indexOf(r) === -1;
      });
      if (emptyBody) emptyBody.hidden = total > 0;

      headers.forEach(function (th, i) {
        if (!NB.qs("[data-sort]", th)) return;
        th.setAttribute("aria-sort", i === state.sortIndex ? state.sortDir : "none");
      });

      renderPager(pages);
      updateSelection(visible);

      if (info) {
        var narrowed = total !== rows.length;
        info.textContent = total
          ? "Menampilkan " + (start + 1) + "–" + end + " dari " + total + " " + label + (narrowed ? " (tersaring dari " + rows.length + ")" : "")
          : "Tidak ada " + label + " yang cocok" + (rows.length ? " dari " + rows.length + " " + label : "") + ".";
      }
      if (announce && info) info.setAttribute("aria-live", "polite");
    }

    /* ---- Event ---------------------------------------------------- */
    if (search) {
      var t;
      search.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.query = search.value.trim().toLowerCase();
          state.page = 1;
          render(true);
        }, 120);
      });
    }

    filters.forEach(function (sel) {
      sel.addEventListener("change", function () {
        state.filters[sel.getAttribute("data-table-filter")] = sel.value;
        state.page = 1;
        render(true);
      });
    });

    headers.forEach(function (th, i) {
      var btn = NB.qs("[data-sort]", th);
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (state.sortIndex !== i) {
          state.sortIndex = i;
          state.sortDir = "ascending";
        } else {
          state.sortDir = state.sortDir === "ascending" ? "descending" : state.sortDir === "descending" ? "none" : "ascending";
        }
        state.page = 1;
        render(true);
      });
    });

    if (pager) {
      pager.addEventListener("click", function (e) {
        var b = e.target.closest("[data-page]");
        if (!b || b.disabled) return;
        state.page = parseInt(b.getAttribute("data-page"), 10);
        render(true);
        var cur = NB.qs('[aria-current="page"]', pager);
        if (cur) cur.focus();
      });
    }

    root.addEventListener("change", function (e) {
      if (e.target.matches("[data-table-select-all]")) {
        var on = e.target.checked;
        rows.forEach(function (r) {
          if (r.hidden) return;
          var cb = rowCheckbox(r);
          if (cb) cb.checked = on;
        });
        render(false);
      } else if (e.target.matches("[data-table-select]")) {
        render(false);
      }
    });

    function reset() {
      body.innerHTML = "";
      original.forEach(function (r) {
        body.appendChild(r.cloneNode(true));
      });
      rows = NB.qsa("tr", body);
      state = { query: "", filters: {}, sortIndex: -1, sortDir: "none", page: 1 };
      if (search) search.value = "";
      filters.forEach(function (sel) {
        sel.value = "";
      });
      render(true);
    }

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-table-reset]")) {
        reset();
        if (search) search.focus();
        NB.toast({ type: "info", title: "Tabel direset", message: "Pencarian, filter, urutan dan pilihan dikembalikan ke awal." , timeout: 3000});
        return;
      }
      var del = e.target.closest("[data-table-row-delete]");
      if (del) {
        var tr = del.closest("tr");
        var name = del.getAttribute("aria-label") || "Baris";
        tr.parentNode.removeChild(tr);
        rows = rows.filter(function (r) {
          return r !== tr;
        });
        render(false);
        // Fokus pindah ke tombol hapus baris berikutnya di halaman, atau ke pencarian.
        var next = NB.qsa("[data-table-row-delete]", body).filter(function (b) {
          return !b.closest("tr").hidden;
        })[0];
        (next || search || root).focus();
        NB.toast({
          type: "warning",
          title: name.replace(/^Hapus /, "") + " dihapus dari tampilan",
          message: "Demo saja — tidak ada data yang dihapus. Tekan Reset untuk mengembalikan."
        });
        return;
      }
      var bulk = e.target.closest("[data-table-bulk]");
      if (!bulk) return;
      var action = bulk.getAttribute("data-table-bulk");
      var selected = rows.filter(function (r) {
        var cb = rowCheckbox(r);
        return cb && cb.checked && matches(r);
      });
      if (action === "clear") {
        selected.forEach(function (r) {
          rowCheckbox(r).checked = false;
        });
        render(false);
        if (selectAll) selectAll.focus();
      } else if (action === "delete") {
        var n = selected.length;
        selected.forEach(function (r) {
          r.parentNode.removeChild(r);
        });
        rows = rows.filter(function (r) {
          return selected.indexOf(r) === -1;
        });
        render(true);
        if (selectAll) selectAll.focus();
        NB.toast({
          type: "warning",
          title: n + " " + label + " dihapus dari tampilan",
          message: "Demo saja — tidak ada data yang dihapus. Tekan Reset untuk mengembalikan."
        });
      } else {
        NB.toast({
          type: "info",
          title: bulk.getAttribute("data-bulk-title") || "Aksi massal (demo)",
          message: selected.length + " " + label + " dipilih. Tidak ada data yang dikirim."
        });
      }
    });

    if (density) {
      density.addEventListener("click", function (e) {
        var b = e.target.closest("[aria-pressed]");
        if (!b) return;
        NB.qsa("[aria-pressed]", density).forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        table.classList.remove("nb-table--dense", "nb-table--comfortable");
        if (b.value && b.value !== "default") table.classList.add("nb-table--" + b.value);
      });
    }

    // API untuk skrip halaman (mis. pages/crud.js): tambah/hapus baris dari kode.
    // add() juga menyimpan salinan ke kondisi awal sehingga Reset tidak menghapusnya.
    function add(tr, atEnd) {
      if (atEnd) {
        body.appendChild(tr);
        rows.push(tr);
        original.push(tr.cloneNode(true));
      } else {
        body.insertBefore(tr, body.firstChild);
        rows.unshift(tr);
        original.unshift(tr.cloneNode(true));
      }
      state.page = 1;
      render(true);
      return tr;
    }

    // Hapus baris secara permanen untuk sesi ini: ikut dibuang dari kondisi awal
    // (dicocokkan lewat data-id) agar Reset tidak memunculkannya lagi.
    function remove(tr) {
      if (!tr || rows.indexOf(tr) === -1) return false;
      var id = tr.getAttribute("data-id");
      if (tr.parentNode) tr.parentNode.removeChild(tr);
      rows = rows.filter(function (r) {
        return r !== tr;
      });
      if (id) {
        original = original.filter(function (o) {
          return o.getAttribute("data-id") !== id;
        });
      }
      render(true);
      return true;
    }

    // Jadikan isi tbody saat ini sebagai kondisi awal baru (setelah skrip halaman
    // mengubah baris langsung di DOM, mis. menerapkan data sesi).
    function sync() {
      rows = NB.qsa("tr", body);
      original = rows.map(function (r) {
        return r.cloneNode(true);
      });
      render(false);
    }

    render(false);
    root.nbTable = { reset: reset, render: render, add: add, remove: remove, sync: sync };
  }

  NB.tables = { init: initTable };

  NB.ready(function () {
    NB.qsa("[data-table]").forEach(initTable);
  });
})();
