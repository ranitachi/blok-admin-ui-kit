/* ==========================================================================
   BLOK pages/calendar.js — kalender bulanan.
   Data agenda dibaca dari <script type="application/json" id="cal-events">.
   - Navigasi bulan (tombol & Page Up/Down), "Hari ini" = tanggal acuan demo.
   - Grid tanggal dengan roving tabindex: panah, Home/End.
   - Filter jenis agenda, panel agenda tanggal terpilih, agenda berikutnya.
   - Form "Tambah agenda" hanya menambah ke memori halaman (demo).
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  var MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var TYPES = {
    peminjaman: ["Peminjaman", "blue"],
    perawatan: ["Perawatan", "pink"],
    kegiatan: ["Kegiatan", "yellow"],
    audit: ["Audit & laporan", "lavender"]
  };

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function iso(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function parse(s) {
    var p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }
  /** Geser bulan dengan tanggal dijepit ke akhir bulan (31 Jan + 1 bulan = 28/29 Feb). */
  function addMonths(d, n) {
    var last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
    return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
  }
  function longDate(d) {
    return DAYS[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function esc(s) {
    return NB.escapeHtml(String(s));
  }

  NB.ready(function () {
    var root = NB.qs("[data-calendar]");
    var dataEl = NB.qs("#cal-events");
    var body = root && NB.qs("[data-cal-body]", root);
    if (!root || !body) return;

    var events = [];
    try {
      events = JSON.parse(dataEl ? dataEl.textContent : "[]");
    } catch (err) {
      events = [];
    }

    var today = root.getAttribute("data-cal-ref");
    var selected = parse(today);
    var view = new Date(selected.getFullYear(), selected.getMonth(), 1);
    var enabled = {};
    NB.qsa("[data-cal-type]").forEach(function (cb) {
      enabled[cb.getAttribute("data-cal-type")] = cb.checked;
    });

    var title = NB.qs("[data-cal-title]", root);
    var countEl = NB.qs("[data-cal-count]", root);
    var dayTitle = NB.qs("[data-cal-day-title]");
    var daySub = NB.qs("[data-cal-day-sub]");
    var dayList = NB.qs("[data-cal-day-list]");
    var dayEmpty = NB.qs("[data-cal-day-empty]");
    var upList = NB.qs("[data-cal-up-list]");
    var upEmpty = NB.qs("[data-cal-up-empty]");
    var upSub = NB.qs("[data-cal-up-sub]");

    function visible() {
      return events
        .filter(function (e) {
          return enabled[e.type] !== false;
        })
        .sort(function (a, b) {
          return a.date === b.date ? (a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1;
        });
    }
    function byDate(list) {
      var map = {};
      list.forEach(function (e) {
        (map[e.date] = map[e.date] || []).push(e);
      });
      return map;
    }
    function color(type) {
      return (TYPES[type] || TYPES.kegiatan)[1];
    }

    /* ---- Grid ----------------------------------------------------------- */
    function renderGrid() {
      var map = byDate(visible());
      var y = view.getFullYear();
      var m = view.getMonth();
      // Senin sebagai awal minggu.
      var start = addDays(view, -((view.getDay() + 6) % 7));
      var lastDay = new Date(y, m + 1, 0);
      var end = addDays(lastDay, 6 - ((lastDay.getDay() + 6) % 7));
      var sel = iso(selected);
      var html = "";
      for (var d = start; d <= end; d = addDays(d, 1)) {
        if ((d.getDay() + 6) % 7 === 0) html += "<tr>";
        var key = iso(d);
        var items = map[key] || [];
        var label = longDate(d) + (items.length ? ", " + items.length + " agenda" : ", tanpa agenda") + (key === today ? ", hari ini" : "");
        var dots = items.length
          ? '<span class="nb-month__dots" aria-hidden="true">' +
            items.slice(0, 3).map(function (e) {
              return '<i style="--ev: var(--color-' + color(e.type) + ')"></i>';
            }).join("") + "</span>"
          : "";
        var chips = items.slice(0, 2).map(function (e) {
          return '<span class="nb-month__event" style="--ev: var(--color-' + color(e.type) + ')">' + esc(e.title) + "</span>";
        }).join("") + (items.length > 2 ? '<span class="nb-month__more">+' + (items.length - 2) + " lagi</span>" : "");
        html +=
          "<td" + (d.getMonth() !== m ? ' class="is-outside"' : "") + '><button class="nb-month__day" type="button" data-cal-day="' + key +
          '" tabindex="' + (key === sel ? "0" : "-1") + '" aria-pressed="' + (key === sel) + '"' +
          (key === today ? ' aria-current="date"' : "") + '><span class="nb-month__num">' + d.getDate() + "</span>" + dots +
          '<span class="nb-sr-only">, ' + label + '. </span><span class="nb-month__events">' + chips + "</span></button></td>";
        if ((d.getDay() + 6) % 7 === 6) html += "</tr>";
      }
      body.innerHTML = html;
      if (title) title.textContent = MONTHS[m] + " " + y;
      var prefix = y + "-" + pad(m + 1);
      var n = visible().filter(function (e) {
        return e.date.slice(0, 7) === prefix;
      }).length;
      if (countEl) countEl.textContent = n + " agenda";
    }

    /* ---- Panel samping ---------------------------------------------------- */
    function agendaItem(e, lead, meta) {
      return (
        '<li class="nb-agenda__item" style="--ev: var(--color-' + color(e.type) + ')"><span class="nb-agenda__time">' + esc(lead) +
        '</span><div><p class="nb-agenda__title">' + esc(e.title) + '</p><p class="nb-list__meta">' + esc(meta) + "</p></div>" +
        (e.isNew ? '<span class="nb-badge nb-badge--lavender">Baru (demo)</span>' : "") + "</li>"
      );
    }

    function renderSide() {
      var key = iso(selected);
      var list = visible();
      var items = list.filter(function (e) {
        return e.date === key;
      });
      if (dayTitle) dayTitle.textContent = longDate(selected);
      if (daySub) daySub.textContent = (key === today ? "Hari ini · " : "") + (items.length ? items.length + " agenda" : "Tanpa agenda");
      if (dayList) {
        dayList.innerHTML = items.map(function (e) {
          return agendaItem(e, e.time, (TYPES[e.type] || TYPES.kegiatan)[0] + (e.place ? " · " + e.place : ""));
        }).join("");
        dayList.hidden = !items.length;
      }
      if (dayEmpty) dayEmpty.hidden = items.length > 0;

      var prefix = view.getFullYear() + "-" + pad(view.getMonth() + 1);
      var up = list.filter(function (e) {
        return e.date.slice(0, 7) === prefix && e.date > today;
      });
      if (upList) {
        upList.innerHTML = up.map(function (e) {
          var d = parse(e.date);
          return agendaItem(e, d.getDate() + " " + MON[d.getMonth()], e.time + (e.place ? " · " + e.place : ""));
        }).join("");
        upList.hidden = !up.length;
      }
      if (upEmpty) upEmpty.hidden = up.length > 0;
      if (upSub) upSub.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear() + " · setelah tanggal acuan " + parse(today).getDate() + " " + MON[parse(today).getMonth()] + ".";
    }

    function render(focus) {
      renderGrid();
      renderSide();
      if (focus) {
        var btn = NB.qs('[data-cal-day="' + iso(selected) + '"]', body);
        if (btn) btn.focus();
      }
    }

    function select(date, focus) {
      selected = date;
      if (date.getMonth() !== view.getMonth() || date.getFullYear() !== view.getFullYear()) {
        view = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      render(focus);
    }

    /* ---- Interaksi --------------------------------------------------------- */
    body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cal-day]");
      if (btn) select(parse(btn.getAttribute("data-cal-day")), true);
    });

    body.addEventListener("keydown", function (e) {
      if (!e.target.closest("[data-cal-day]")) return;
      var d = selected;
      var dow = (d.getDay() + 6) % 7;
      var next = null;
      switch (e.key) {
        case "ArrowLeft": next = addDays(d, -1); break;
        case "ArrowRight": next = addDays(d, 1); break;
        case "ArrowUp": next = addDays(d, -7); break;
        case "ArrowDown": next = addDays(d, 7); break;
        case "Home": next = addDays(d, -dow); break;
        case "End": next = addDays(d, 6 - dow); break;
        case "PageUp": next = addMonths(d, -1); break;
        case "PageDown": next = addMonths(d, 1); break;
      }
      if (!next) return;
      e.preventDefault();
      select(next, true);
    });

    NB.qsa("[data-cal-nav]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        select(addMonths(selected, Number(btn.getAttribute("data-cal-nav"))), false);
      });
    });

    var todayBtn = NB.qs("[data-cal-today]", root);
    if (todayBtn)
      todayBtn.addEventListener("click", function () {
        select(parse(today), true);
      });

    NB.qsa("[data-cal-type]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        enabled[cb.getAttribute("data-cal-type")] = cb.checked;
        render(false);
      });
    });

    var form = NB.qs("[data-cal-form]");
    if (form) {
      var dateInput = NB.qs("[data-cal-form-date]", form);
      document.addEventListener("nb:modal-open", function (e) {
        if (e.target.id === "modal-event" && dateInput) dateInput.value = iso(selected);
      });
      form.addEventListener("nb:valid-submit", function (e) {
        var fd = e.detail.data;
        var ev = {
          date: String(fd.get("date")),
          time: String(fd.get("time") || "09:00").replace(":", "."),
          title: String(fd.get("title") || "").trim(),
          type: String(fd.get("type") || "kegiatan"),
          place: String(fd.get("place") || "").trim(),
          isNew: true
        };
        events.push(ev);
        // Pastikan jenis agenda baru ikut tampil.
        enabled[ev.type] = true;
        var cb = NB.qs('[data-cal-type="' + ev.type + '"]');
        if (cb) cb.checked = true;
        NB.forms.reset(form);
        NB.modal.close("modal-event");
        select(parse(ev.date), false);
        NB.toast({
          type: "success",
          title: "Agenda ditambahkan",
          message: ev.title + " · " + longDate(parse(ev.date)) + ". Hilang saat halaman dimuat ulang (demo)."
        });
      });
    }

    render(false);
  });
})();
