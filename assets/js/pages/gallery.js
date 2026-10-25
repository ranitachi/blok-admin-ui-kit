/* ==========================================================================
   BLOK pages/gallery.js — interaksi demo khusus halaman galeri komponen.
   Semua demo hanya mengubah tampilan; tidak ada data yang disimpan.
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;
  var nf = new Intl.NumberFormat("id-ID");

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setProgress(bar, value, text) {
    bar.setAttribute("aria-valuenow", String(value));
    bar.setAttribute("aria-valuetext", text || value + " persen");
    var fill = NB.qs(".nb-progress__bar", bar);
    if (fill) fill.style.setProperty("--value", value + "%");
  }

  /* Jalankan progres 0 → 100 dalam langkah; langsung selesai bila reduced motion. */
  function runProgress(from, onStep, onDone) {
    if (reducedMotion()) {
      onStep(100);
      onDone();
      return;
    }
    var value = from;
    var timer = setInterval(function () {
      value = Math.min(100, value + 8);
      onStep(value);
      if (value >= 100) {
        clearInterval(timer);
        onDone();
      }
    }, 120);
  }

  /* ---------- Badge: siklus status ---------- */
  function initBadgeCycle() {
    var btn = NB.qs("[data-badge-cycle-btn]");
    var badge = NB.qs("[data-badge-cycle]");
    var out = NB.qs("[data-badge-cycle-out]");
    if (!btn || !badge) return;
    var states = [
      { cls: "nb-badge--warning", label: "Perlu servis" },
      { cls: "nb-badge--success", label: "Baik" },
      { cls: "nb-badge--info", label: "Dipinjam" },
      { cls: "nb-badge--danger", label: "Rusak berat" }
    ];
    var i = 0;
    btn.addEventListener("click", function () {
      badge.classList.remove(states[i].cls);
      i = (i + 1) % states.length;
      badge.classList.add(states[i].cls);
      badge.textContent = states[i].label;
      if (out) out.textContent = "Status saat ini: " + states[i].label;
    });
  }

  /* ---------- Alert: tumpuk toast ---------- */
  function initToastBurst() {
    NB.qsa("[data-toast-burst]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var list = [
          { type: "info", title: "Sinkronisasi dimulai (demo)", message: "Toast ditumpuk dari bawah." },
          { type: "success", title: "Aset AST-26-1284 diperbarui (demo)" },
          { type: "warning", title: "3 pinjaman jatuh tempo besok (demo)" },
          { type: "danger", title: "Gagal mengunggah foto (demo)", message: "Contoh pesan galat; tidak ada unggahan nyata." }
        ];
        list.forEach(function (t, idx) {
          setTimeout(function () {
            NB.toast(t);
          }, reducedMotion() ? 0 : idx * 250);
        });
      });
    });
  }

  /* ---------- Form demo: toast, tutup modal, reset ---------- */
  function initDemoSubmit() {
    NB.qsa("form[data-demo-submit]").forEach(function (form) {
      form.addEventListener("nb:valid-submit", function () {
        NB.toast({
          type: "success",
          title: form.getAttribute("data-demo-submit") || "Formulir valid (demo)",
          message: "Demo saja — tidak ada data yang dikirim atau disimpan."
        });
        var modal = form.closest(".nb-modal");
        if (modal) NB.modal.close(modal.id);
        NB.forms.reset(form);
      });
    });
  }

  /* ---------- Modal konfirmasi: ketik kata kunci untuk mengaktifkan tombol ---------- */
  function initConfirmInput() {
    NB.qsa("[data-confirm-input]").forEach(function (input) {
      var scope = input.closest(".nb-modal") || document;
      var target = NB.qs("[data-confirm-target]", scope);
      var word = input.getAttribute("data-confirm-input");
      if (!target) return;
      function sync() {
        target.disabled = input.value.trim() !== word;
      }
      function clear() {
        input.value = "";
        sync();
      }
      input.addEventListener("input", sync);
      if (scope !== document) {
        scope.addEventListener("nb:modal-open", clear);
        scope.addEventListener("nb:modal-close", clear);
      }
      sync();
    });
  }

  /* ---------- Segmented: tampilkan pilihan ---------- */
  function initToggleOutput() {
    NB.qsa("[data-toggle-output]").forEach(function (out) {
      var prev = out.previousElementSibling;
      if (!prev || !prev.hasAttribute("data-toggle-group")) return;
      prev.addEventListener("nb:toggle-group", function (e) {
        out.textContent = "Periode: " + e.detail.value;
      });
    });
  }

  /* ---------- Paginasi demo ---------- */
  function initDemoPager() {
    NB.qsa("[data-demo-pager]").forEach(function (nav) {
      var total = parseInt(nav.getAttribute("data-total"), 10);
      var per = parseInt(nav.getAttribute("data-per-page"), 10);
      var pages = Math.ceil(total / per);
      var info = NB.qs("[data-demo-pager-info]", nav);
      var list = NB.qs("[data-demo-pager-list]", nav);
      var current = 1;
      var prevIcon = NB.qs("li:first-child svg", list).outerHTML;
      var nextIcon = NB.qs("li:last-child svg", list).outerHTML;

      function pageItems() {
        var set = [1, pages, current - 1, current, current + 1].filter(function (n) {
          return n >= 1 && n <= pages;
        });
        set = set.filter(function (n, i) {
          return set.indexOf(n) === i;
        }).sort(function (a, b) {
          return a - b;
        });
        var out = [];
        set.forEach(function (n, i) {
          if (i && n - set[i - 1] > 1) out.push(null);
          out.push(n);
        });
        return out;
      }

      function btn(label, content, page, opts) {
        opts = opts || {};
        return (
          '<li><button class="nb-pagination__btn" type="button" aria-label="' + label + '" data-page="' + page + '"' +
          (opts.current ? ' aria-current="page"' : "") + (opts.disabled ? " disabled" : "") + ">" + content + "</button></li>"
        );
      }

      function render() {
        var html = btn("Halaman sebelumnya", prevIcon, current - 1, { disabled: current === 1 });
        pageItems().forEach(function (n) {
          html += n === null
            ? '<li class="nb-pagination__gap" aria-hidden="true">…</li>'
            : btn("Halaman " + n, String(n), n, { current: n === current });
        });
        html += btn("Halaman berikutnya", nextIcon, current + 1, { disabled: current === pages });
        list.innerHTML = html;
        var from = (current - 1) * per + 1;
        var to = Math.min(total, current * per);
        info.textContent = "Menampilkan " + nf.format(from) + "–" + nf.format(to) + " dari " + nf.format(total) + " aset";
      }

      list.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-page]");
        if (!b || b.disabled) return;
        var label = b.getAttribute("aria-label");
        current = parseInt(b.getAttribute("data-page"), 10);
        render();
        // Tombol lama diganti; fokus ke tombol berlabel sama, atau halaman aktif bila panah kini nonaktif.
        var same = NB.qs('[aria-label="' + label + '"]:not([disabled])', list);
        (same || NB.qs('[aria-current="page"]', list)).focus();
      });
      render();
    });
  }

  /* ---------- Pindahkan fokus ke elemen lain ---------- */
  function initFocusTarget() {
    NB.qsa("[data-focus-target]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = NB.qs(btn.getAttribute("data-focus-target"));
        if (target) target.focus();
      });
    });
  }

  /* ---------- Checkbox induk/anak (indeterminate) ---------- */
  function initCheckParent() {
    NB.qsa("[data-check-parent-group]").forEach(function (group) {
      var parent = NB.qs("[data-check-parent]", group);
      var children = NB.qsa("[data-check-child]", group);
      function sync() {
        var n = children.filter(function (c) {
          return c.checked;
        }).length;
        parent.checked = n === children.length;
        parent.indeterminate = n > 0 && n < children.length;
        parent.setAttribute("aria-checked", parent.indeterminate ? "mixed" : String(parent.checked));
      }
      parent.addEventListener("change", function () {
        children.forEach(function (c) {
          c.checked = parent.checked;
        });
        sync();
      });
      children.forEach(function (c) {
        c.addEventListener("change", sync);
      });
      var form = group.closest("form");
      if (form) form.addEventListener("reset", function () {
        setTimeout(sync, 0);
      });
      sync();
    });
  }

  /* ---------- Form filter inline ---------- */
  function initDemoFilter() {
    NB.qsa("form[data-demo-filter]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        NB.toast({ type: "info", title: "Filter diterapkan (demo)", message: "Tidak ada data nyata yang disaring di galeri ini." });
      });
    });
  }

  /* ---------- Kanban: pindah kolom dengan tombol ---------- */
  function initKanban() {
    NB.qsa("[data-kanban]").forEach(function (board) {
      var cols = NB.qsa("[data-kanban-col]", board);
      var status = board.parentNode.querySelector("[data-kanban-status]");
      function colName(col) {
        var head = NB.qs(".nb-kanban__head", col);
        return head.firstChild.textContent.trim();
      }
      function sync() {
        cols.forEach(function (col, ci) {
          var tasks = NB.qsa("[data-task]", col);
          NB.qs("[data-kanban-count]", col).textContent = String(tasks.length);
          tasks.forEach(function (t) {
            NB.qs('[data-kanban-move="-1"]', t).disabled = ci === 0;
            NB.qs('[data-kanban-move="1"]', t).disabled = ci === cols.length - 1;
          });
        });
      }
      board.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-kanban-move]");
        if (!btn || btn.disabled) return;
        var task = btn.closest("[data-task]");
        var dir = parseInt(btn.getAttribute("data-kanban-move"), 10);
        var from = cols.indexOf(task.closest("[data-kanban-col]"));
        var to = cols[from + dir];
        if (!to) return;
        NB.qs("[data-kanban-list]", to).appendChild(task);
        sync();
        var same = NB.qs('[data-kanban-move="' + dir + '"]', task);
        (same.disabled ? NB.qs('[data-kanban-move="' + -dir + '"]', task) : same).focus();
        if (status) {
          status.textContent = NB.qs(".nb-task__title", task).textContent.trim() + " dipindahkan ke " + colName(to) +
            ". Demo saja — tidak disimpan.";
        }
      });
      sync();
    });
  }

  /* ---------- Item file: simulasi unggah ---------- */
  function initUploadDemo() {
    NB.qsa("[data-upload-demo-run]").forEach(function (btn) {
      var item = btn.closest(".nb-file") || btn.parentNode;
      var bar = NB.qs("[data-upload-demo]", item);
      var label = NB.qs("[data-upload-demo-label]", item);
      if (!bar) return;
      btn.addEventListener("click", function () {
        btn.disabled = true;
        runProgress(0, function (v) {
          setProgress(bar, v);
          if (label) label.textContent = v < 100 ? "Mengunggah " + v + "%" : "Selesai";
        }, function () {
          btn.disabled = false;
          NB.toast({ type: "success", title: "Unggah selesai (demo)", message: "Simulasi saja — file tidak dikirim ke mana pun." });
        });
      });
    });
  }

  /* ---------- Skeleton → konten ---------- */
  function initSkeletonDemo() {
    NB.qsa("[data-skeleton-demo]").forEach(function (btn) {
      var card = document.getElementById(btn.getAttribute("aria-controls"));
      if (!card) return;
      var loading = NB.qs("[data-skeleton-loading]", card);
      var content = NB.qs("[data-skeleton-content]", card);
      btn.addEventListener("click", function () {
        btn.disabled = true;
        card.setAttribute("aria-busy", "true");
        loading.hidden = false;
        content.hidden = true;
        setTimeout(function () {
          card.setAttribute("aria-busy", "false");
          loading.hidden = true;
          content.hidden = false;
          btn.disabled = false;
          btn.focus();
        }, 1500);
      });
    });
  }

  /* ---------- Progress determinate ---------- */
  function initProgressDemo() {
    NB.qsa("[data-progress-demo-run]").forEach(function (btn) {
      var scope = btn.closest(".nb-stack") || document;
      var bar = NB.qs("[data-progress-demo]", scope);
      var text = NB.qs("[data-progress-demo-text]", scope);
      var total = 1284;
      if (!bar) return;
      btn.addEventListener("click", function () {
        btn.disabled = true;
        runProgress(0, function (v) {
          var rows = Math.round((total * v) / 100);
          setProgress(bar, v);
          if (text) text.textContent = v + "% · " + nf.format(rows) + " dari " + nf.format(total) + " baris";
        }, function () {
          btn.disabled = false;
          NB.toast({ type: "success", title: "Impor selesai (demo)", message: "Simulasi saja — tidak ada aset yang ditambahkan." });
        });
      });
    });
  }

  /* ---------- Pencarian tanpa hasil ---------- */
  function initNoResults() {
    NB.qsa("[data-noresults-demo]").forEach(function (box) {
      var input = NB.qs("[data-noresults-input]", box);
      var count = NB.qs("[data-noresults-count]", box);
      var items = NB.qsa("[data-noresults-list] > li", box);
      var list = NB.qs("[data-noresults-list]", box);
      var empty = NB.qs("[data-noresults-empty]", box);
      var term = NB.qs("[data-noresults-term]", box);
      function filter() {
        var q = input.value.trim().toLowerCase();
        var n = 0;
        items.forEach(function (li) {
          var hit = li.textContent.toLowerCase().indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) n++;
        });
        list.hidden = n === 0;
        empty.hidden = n !== 0;
        term.textContent = input.value.trim();
        count.textContent = n === 0 ? "Tidak ada ruangan yang cocok" : n + " ruangan";
      }
      input.addEventListener("input", filter);
      NB.qs("[data-noresults-clear]", box).addEventListener("click", function () {
        input.value = "";
        filter();
        input.focus();
      });
    });
  }

  /* ---------- Saring ikon ---------- */
  function initIconFilter() {
    NB.qsa("[data-icon-filter]").forEach(function (box) {
      var input = NB.qs("[data-icon-filter-input]", box);
      var count = NB.qs("[data-icon-filter-count]", box);
      var empty = NB.qs("[data-icon-filter-empty]", box);
      var items = NB.qsa("[data-icon-name]", box);
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        var n = 0;
        items.forEach(function (li) {
          var hit = li.getAttribute("data-icon-name").indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) n++;
        });
        count.textContent = n + " ikon";
        empty.hidden = n !== 0;
      });
    });
  }

  NB.ready(function () {
    initBadgeCycle();
    initToastBurst();
    initDemoSubmit();
    initConfirmInput();
    initToggleOutput();
    initDemoPager();
    initFocusTarget();
    initCheckParent();
    initDemoFilter();
    initKanban();
    initUploadDemo();
    initSkeletonDemo();
    initProgressDemo();
    initNoResults();
    initIconFilter();
  });
})();
