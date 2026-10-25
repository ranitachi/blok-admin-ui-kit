/* ==========================================================================
   BLOK pages/kanban.js — papan tugas.
   - Tombol panah dan menu "Pindahkan ke…" di tiap kartu memindah tugas antar kolom (keyboard).
   - Sentuhan/pena: seret lewat pointer events.
   - Seret-lepas HTML5 sebagai alternatif untuk pointer.
   - Filter teks/petugas/prioritas, jumlah per kolom, pengumuman aria-live.
   - Form "Tugas baru" menambah kartu ke Antrean. Semua perubahan hanya di DOM (demo).
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  NB.ready(function () {
    var board = NB.qs("[data-board]");
    if (!board) return;

    var cols = NB.qsa("[data-board-col]", board);
    var status = NB.qs("[data-board-status]");
    var summary = NB.qs("[data-board-summary]");
    var noResult = NB.qs("[data-board-noresult]");
    var search = NB.qs("[data-board-search]");
    var filters = NB.qsa("[data-board-filter]");
    var seq = 113;

    function label(col) {
      return col.getAttribute("data-board-label");
    }
    function colOf(card) {
      return card.closest("[data-board-col]");
    }
    function titleOf(card) {
      var t = NB.qs(".nb-task__title", card);
      return t ? t.textContent.trim() : card.getAttribute("data-task");
    }
    function announce(msg) {
      if (!status) return;
      status.textContent = "";
      // Jeda singkat agar pembaca layar membacakan teks yang sama berulang kali.
      setTimeout(function () {
        status.textContent = msg;
      }, 30);
    }

    /* ---- Status tombol & jumlah ---------------------------------------- */
    function syncCard(card) {
      var i = cols.indexOf(colOf(card));
      var title = titleOf(card);
      NB.qsa("[data-board-move]", card).forEach(function (btn) {
        var dir = Number(btn.getAttribute("data-board-move"));
        var target = cols[i + dir];
        btn.disabled = !target;
        btn.setAttribute(
          "aria-label",
          "Pindahkan " + title + " ke " + (target ? label(target) : dir < 0 ? "kolom sebelumnya" : "kolom berikutnya")
        );
      });
      card.classList.toggle("is-done", colOf(card).getAttribute("data-board-col") === "selesai");
    }

    function syncCounts() {
      var shown = 0;
      var total = 0;
      var filtering = isFiltering();
      cols.forEach(function (col) {
        var cards = NB.qsa("[data-task]", col);
        var visible = cards.filter(function (c) {
          return !c.hidden;
        }).length;
        total += cards.length;
        shown += visible;
        var count = NB.qs("[data-board-count]", col);
        if (count) {
          count.textContent = filtering ? visible + "/" + cards.length : String(cards.length);
          count.setAttribute(
            "aria-label",
            filtering ? visible + " dari " + cards.length + " tugas tampil" : cards.length + " tugas"
          );
        }
        var empty = NB.qs("[data-board-empty]", col);
        if (empty) empty.hidden = visible > 0;
      });
      if (summary) {
        var high = NB.qsa("[data-task]", board).filter(function (c) {
          var p = c.getAttribute("data-priority");
          return (p === "tinggi" || p === "kritis") && colOf(c).getAttribute("data-board-col") !== "selesai";
        }).length;
        summary.textContent =
          (filtering ? shown + " dari " + total : total) + " tugas · " + high + " prioritas tinggi/kritis belum selesai";
      }
      if (noResult) noResult.hidden = shown > 0;
      board.hidden = shown === 0;
    }

    /* ---- Pindah kartu --------------------------------------------------- */
    function move(card, target, how) {
      var from = colOf(card);
      if (!target || target === from) return;
      NB.qs("[data-board-list]", target).appendChild(card);
      syncCard(card);
      syncCounts();
      card.classList.remove("is-moved");
      void card.offsetWidth;
      card.classList.add("is-moved");
      announce(titleOf(card) + " dipindah dari " + label(from) + " ke " + label(target) + (how || "") + ".");
    }

    board.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-board-move]");
      if (!btn || btn.disabled) return;
      var card = btn.closest("[data-task]");
      var dir = Number(btn.getAttribute("data-board-move"));
      move(card, cols[cols.indexOf(colOf(card)) + dir]);
      // Fokus tetap pada kartu yang sama; bila sudah di ujung, pakai tombol arah sebaliknya.
      var keep = btn.disabled ? NB.qs('[data-board-move="' + -dir + '"]', card) : btn;
      if (keep) keep.focus();
      if (card.scrollIntoView) card.scrollIntoView({ block: "nearest", inline: "nearest" });
    });

    /* ---- Menu "Pindahkan ke kolom…" (keyboard & pembaca layar) ----------- */
    function closeMenus(except) {
      NB.qsa("[data-board-menu-btn][aria-expanded=\"true\"]", board).forEach(function (b) {
        if (b === except) return;
        b.setAttribute("aria-expanded", "false");
        b.nextElementSibling.hidden = true;
      });
    }

    function buildMenu(card) {
      var actions = NB.qs(".nb-task__actions", card);
      if (!actions || NB.qs("[data-board-menu-btn]", card)) return;
      var wrap = document.createElement("div");
      wrap.className = "nb-task__move";
      var id = "move-" + card.getAttribute("data-task");
      wrap.innerHTML =
        '<button class="nb-btn nb-btn--sm nb-btn--outline" type="button" data-board-menu-btn aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '">Pindahkan ke…</button>' +
        '<ul class="nb-task__move-menu" id="' + id + '" role="list" hidden></ul>';
      actions.appendChild(wrap);
    }

    function fillMenu(card) {
      var ul = NB.qs(".nb-task__move-menu", card);
      if (!ul) return;
      var here = colOf(card);
      var title = titleOf(card);
      ul.innerHTML = "";
      cols.forEach(function (col) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("data-board-to", col.getAttribute("data-board-col"));
        b.textContent = label(col);
        b.setAttribute("aria-label", "Pindahkan " + title + " ke kolom " + label(col) + (col === here ? " (kolom saat ini)" : ""));
        if (col === here) {
          b.disabled = true;
          b.setAttribute("aria-current", "true");
        }
        li.appendChild(b);
        ul.appendChild(li);
      });
    }

    board.addEventListener("click", function (e) {
      var toggle = e.target.closest("[data-board-menu-btn]");
      if (toggle) {
        var open = toggle.getAttribute("aria-expanded") === "true";
        closeMenus(toggle);
        if (open) {
          toggle.setAttribute("aria-expanded", "false");
          toggle.nextElementSibling.hidden = true;
          return;
        }
        fillMenu(toggle.closest("[data-task]"));
        toggle.setAttribute("aria-expanded", "true");
        toggle.nextElementSibling.hidden = false;
        var first = NB.qs("button:not([disabled])", toggle.nextElementSibling);
        if (first) first.focus();
        return;
      }
      var to = e.target.closest("[data-board-to]");
      if (to) {
        var card = to.closest("[data-task]");
        var menuBtn = NB.qs("[data-board-menu-btn]", card);
        var target = NB.qs('[data-board-col="' + to.getAttribute("data-board-to") + '"]', board);
        closeMenus();
        move(card, target, " lewat menu");
        if (menuBtn) menuBtn.focus();
        return;
      }
      closeMenus();
    });

    board.addEventListener("keydown", function (e) {
      var menu = e.target.closest && e.target.closest(".nb-task__move-menu");
      if (e.key === "Escape") {
        var open = NB.qs("[data-board-menu-btn][aria-expanded=\"true\"]", board);
        if (!open) return;
        e.stopPropagation();
        closeMenus();
        open.focus();
        return;
      }
      if (!menu || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      e.preventDefault();
      var items = NB.qsa("button:not([disabled])", menu);
      var i = items.indexOf(document.activeElement);
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    });

    document.addEventListener("click", function (e) {
      if (!board.contains(e.target)) closeMenus();
    });

    /* ---- Sentuhan / pena: seret dengan pointer events ------------------- */
    var touch = null;
    board.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" || e.target.closest("button, a, input, select, textarea")) return;
      var card = e.target.closest("[data-task]");
      if (card) touch = { card: card, x: e.clientX, y: e.clientY, active: false };
    });
    board.addEventListener("pointermove", function (e) {
      if (!touch) return;
      if (!touch.active && Math.abs(e.clientX - touch.x) + Math.abs(e.clientY - touch.y) < 12) return;
      touch.active = true;
      touch.card.classList.add("is-touch-dragging");
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var col = el && el.closest("[data-board-col]");
      cols.forEach(function (c) {
        c.classList.toggle("is-drop-target", c === col);
      });
    });
    function endTouch(e, drop) {
      if (!touch) return;
      var t = touch;
      touch = null;
      t.card.classList.remove("is-touch-dragging");
      cols.forEach(function (c) {
        c.classList.remove("is-drop-target");
      });
      if (!drop || !t.active) return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var col = el && el.closest("[data-board-col]");
      if (col) move(t.card, col, " dengan sentuhan");
    }
    board.addEventListener("pointerup", function (e) { endTouch(e, true); });
    board.addEventListener("pointercancel", function (e) { endTouch(e, false); });

    /* ---- Seret-lepas (opsional, pointer) -------------------------------- */
    var dragging = null;
    board.addEventListener("dragstart", function (e) {
      var card = e.target.closest && e.target.closest("[data-task]");
      if (!card) return;
      dragging = card;
      card.classList.add("is-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.getAttribute("data-task"));
      }
    });
    board.addEventListener("dragend", function () {
      if (dragging) dragging.classList.remove("is-dragging");
      dragging = null;
      cols.forEach(function (c) {
        c.classList.remove("is-drop-target");
      });
    });
    cols.forEach(function (col) {
      col.addEventListener("dragover", function (e) {
        if (!dragging) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        col.classList.add("is-drop-target");
      });
      col.addEventListener("dragleave", function (e) {
        if (!col.contains(e.relatedTarget)) col.classList.remove("is-drop-target");
      });
      col.addEventListener("drop", function (e) {
        if (!dragging) return;
        e.preventDefault();
        col.classList.remove("is-drop-target");
        move(dragging, col, " dengan seret-lepas");
      });
    });

    /* ---- Filter ---------------------------------------------------------- */
    function isFiltering() {
      return (
        (search && search.value.trim() !== "") ||
        filters.some(function (f) {
          return f.value !== "";
        })
      );
    }

    function applyFilter() {
      var q = search ? search.value.trim().toLowerCase() : "";
      NB.qsa("[data-task]", board).forEach(function (card) {
        var ok = !q || (titleOf(card) + " " + card.getAttribute("data-task")).toLowerCase().indexOf(q) !== -1;
        filters.forEach(function (f) {
          if (f.value && card.getAttribute("data-" + f.getAttribute("data-board-filter")) !== f.value) ok = false;
        });
        card.hidden = !ok;
      });
      syncCounts();
    }

    if (search) search.addEventListener("input", applyFilter);
    filters.forEach(function (f) {
      f.addEventListener("change", applyFilter);
    });
    var reset = NB.qs("[data-board-reset]");
    if (reset)
      reset.addEventListener("click", function () {
        if (search) search.value = "";
        filters.forEach(function (f) {
          f.value = "";
        });
        applyFilter();
        if (search) search.focus();
      });

    /* ---- Tugas baru ------------------------------------------------------- */
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    var PRIO = {
      kritis: ["danger", "kritis"],
      tinggi: ["warning", "tinggi"],
      normal: ["info", "normal"],
      rendah: ["neutral", "rendah"]
    };

    function buildCard(d) {
      var id = "TG-" + seq++;
      var src = NB.qs('[data-assignee="' + d.assignee + '"] .nb-avatar', board);
      var opt = NB.qs('#task-assignee option[value="' + d.assignee + '"]');
      var name = opt ? opt.textContent.split(" — ")[0] : d.assignee;
      var parts = d.due.split("-");
      var due = Number(parts[2]) + " " + MONTHS[Number(parts[1]) - 1];
      var p = PRIO[d.priority] || PRIO.normal;
      var li = document.createElement("li");
      li.className = "nb-task nb-task--board";
      li.id = "task-" + id;
      li.setAttribute("data-task", id);
      li.setAttribute("data-priority", d.priority);
      li.setAttribute("data-assignee", d.assignee);
      li.setAttribute("draggable", "true");
      li.setAttribute("aria-labelledby", "task-" + id + "-title");
      li.setAttribute("aria-describedby", "task-" + id + "-meta");
      li.innerHTML =
        '<div class="nb-task__meta"><span>' + id + '</span><span class="nb-badge nb-badge--outline">' +
        NB.escapeHtml(d.label) + '</span><span class="nb-badge nb-badge--lavender">Baru (demo)</span></div>' +
        '<h3 class="nb-task__title" id="task-' + id + '-title">' + NB.escapeHtml(d.title) + "</h3>" +
        (d.desc ? '<p class="nb-task__desc">' + NB.escapeHtml(d.desc) + "</p>" : "") +
        '<div class="nb-task__foot" id="task-' + id + '-meta">' +
        '<span class="nb-task__who">' + (src ? src.outerHTML : "") + '<span class="nb-sr-only">Penanggung jawab: </span>' +
        NB.escapeHtml(name.split(" ")[0]) + "</span>" +
        '<span class="nb-task__due"><span class="nb-sr-only">Tenggat: </span><time datetime="' + d.due + '">' + due +
        "</time></span>" +
        '<span class="nb-badge nb-badge--' + p[0] + '">Prioritas ' + p[1] + "</span></div>" +
        '<div class="nb-task__actions">' +
        '<button class="nb-icon-btn" type="button" data-board-move="-1"><svg class="nb-icon nb-icon--sm" aria-hidden="true"><use href="#i-arrow-left"></use></svg></button>' +
        '<span class="nb-task__hint" aria-hidden="true">Pindah</span>' +
        '<button class="nb-icon-btn" type="button" data-board-move="1"><svg class="nb-icon nb-icon--sm" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button>' +
        "</div>";
      return li;
    }

    var form = NB.qs("[data-board-form]");
    if (form)
      form.addEventListener("nb:valid-submit", function (e) {
        var fd = e.detail.data;
        var d = {
          title: String(fd.get("title") || "").trim(),
          desc: String(fd.get("desc") || "").trim(),
          assignee: String(fd.get("assignee") || ""),
          due: String(fd.get("due") || ""),
          priority: String(fd.get("priority") || "normal"),
          label: String(fd.get("label") || "Inventaris")
        };
        var card = buildCard(d);
        NB.qs("[data-board-list]", cols[0]).insertBefore(card, NB.qs("[data-board-list]", cols[0]).firstChild);
        buildMenu(card);
        syncCard(card);
        applyFilter();
        NB.forms.reset(form);
        NB.modal.close("modal-task");
        announce(d.title + " ditambahkan ke " + label(cols[0]) + ".");
        NB.toast({
          type: "success",
          title: "Tugas ditambahkan",
          message: card.getAttribute("data-task") + " masuk ke Antrean. Hilang saat halaman dimuat ulang (demo)."
        });
      });

    NB.qsa("[data-task]", board).forEach(function (c) {
      buildMenu(c);
      syncCard(c);
    });
    syncCounts();
  });
})();
