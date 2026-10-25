/* ==========================================================================
   BLOK pages/operations.js — ruangan, peminjaman, perawatan (Phase C).

   BUKAN database. Status peminjaman/tiket dan pesanan ruangan hanya hidup di
   halaman yang sedang dibuka; muat ulang = kembali ke data contoh. Semua toast
   menyebut "(demo)". Data awal: assets/js/records.js (NB.records).

   Hook utama:
     [data-room] [data-room-search] [data-room-filter] [data-room-view]
     [data-room-book="KODE"] form[data-room-book-form]
     [data-booking-table] [data-booking-open="ID"] #drawer-booking [data-bk=…]
     form[data-booking-form]  (?asset=KODE membuka formulir terisi)
     [data-ticket="ID"] [data-ticket-filter] [data-ticket-detail] [data-td=…]
     form[data-td-note] form[data-ticket-form]  (?id=TK-… memilih tiket)
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});
  var R = NB.records || { bookings: [], tickets: [], bookingStatus: {}, ticketStatus: {}, priority: {} };
  var esc = NB.escapeHtml;
  var C = NB.crud;

  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }
  function badgeOf(map, key, dot) {
    var s = map[key] || ["neutral", key];
    return C.badge(s[0], s[1], dot);
  }
  function now() {
    var d = new Date();
    return C.today() + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function user(id) {
    return C.find("users", id) || { id: id, name: "—", initials: "?", color: "yellow" };
  }
  function asset(code) {
    return C.find("assets", code) || { code: code, name: code };
  }
  function avatar(u) {
    return '<span class="nb-avatar nb-avatar--' + u.color + ' nb-avatar--sm" aria-hidden="true">' + esc(u.initials) + "</span>";
  }
  function setKpi(key, value) {
    var el = NB.qs('[data-kpi="' + key + '"]');
    if (el) el.textContent = String(value);
  }

  /* ======================================================================
     Ruangan
     ====================================================================== */
  function initRooms() {
    var grid = NB.qs("[data-room-grid]");
    if (!grid) return;
    var cards = NB.qsa("[data-room]", grid);
    var search = NB.qs("[data-room-search]");
    var filters = NB.qsa("[data-room-filter]");
    var count = NB.qs("[data-room-count]");
    var empty = NB.qs("[data-room-empty]");

    function apply() {
      var q = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (card) {
        var ok = !q || (card.getAttribute("data-search") || "").indexOf(q) !== -1;
        filters.forEach(function (f) {
          if (f.value && card.getAttribute("data-" + f.getAttribute("data-room-filter")) !== f.value) ok = false;
        });
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = "Menampilkan " + shown + " dari " + cards.length + " ruangan";
      if (empty) empty.hidden = shown > 0;
      grid.hidden = shown === 0;
    }
    if (search) search.addEventListener("input", apply);
    filters.forEach(function (f) {
      f.addEventListener("change", apply);
    });
    NB.qsa("[data-room-reset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (search) search.value = "";
        filters.forEach(function (f) {
          f.value = "";
        });
        apply();
        if (search) search.focus();
      });
    });

    var view = NB.qs("[data-room-view]");
    if (view) {
      view.addEventListener("nb:toggle-group", function (e) {
        grid.classList.toggle("nb-room-grid--list", e.detail.value === "list");
      });
    }

    var form = NB.qs("form[data-room-book-form]");
    if (!form) return;
    var modalId = form.closest(".nb-modal").id;
    var people = NB.qs('[name="people"]', form);
    var current = null;
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-room-book]");
      if (!btn) return;
      current = btn.closest("[data-room]");
      var cap = +current.getAttribute("data-capacity");
      NB.forms.reset(form);
      NB.qs("[data-room-book-name]", form).textContent = current.getAttribute("data-name");
      NB.qs("[data-room-book-cap]", form).textContent = "(" + current.getAttribute("data-code") + ", kapasitas " + cap + " orang)";
      NB.qs("[data-room-book-code]", form).value = current.getAttribute("data-code");
      NB.qs("[data-room-book-max]", form).textContent = "Maksimal " + cap + " orang sesuai kapasitas ruangan.";
      if (people) people.max = String(cap);
      NB.modal.open(modalId, btn);
    });
    form.addEventListener("nb:valid-submit", function () {
      if (!current) return;
      var date = form.elements.date.value;
      var session = form.elements.session.value;
      var list = NB.qs("[data-room-bookings]", current);
      if (list) {
        var li = document.createElement("li");
        li.innerHTML = NB.icons.svg("calendar", "nb-icon--sm") + "<span>" + C.dfmt(date) + " · " + esc(session) + " — " +
          esc(form.elements.people.value) + " orang</span>";
        list.appendChild(li);
        list.hidden = false;
      }
      var badges = NB.qs("[data-room-badges]", current);
      if (badges && !NB.qs("[data-room-booked]", badges)) {
        badges.insertAdjacentHTML("beforeend", '<span class="nb-badge nb-badge--ink" data-room-booked>Dipesan (demo)</span>');
      }
      NB.modal.close(modalId);
      NB.toast({
        type: "success",
        title: "Pesanan dikirim (demo)",
        message: current.getAttribute("data-name") + ", " + C.dfmt(date) + " sesi " + session.split(" ·")[0] +
          ". Hanya simulasi — hilang saat halaman dimuat ulang."
      });
      NB.forms.reset(form);
    });
    apply();
  }

  /* ======================================================================
     Peminjaman
     ====================================================================== */
  var BK_ACTIONS = {
    menunggu: [
      { to: "disetujui", label: "Setujui", icon: "check", cls: "nb-btn--yellow", log: ["Disetujui admin", "Aset siap diambil peminjam.", "mint", "check"] },
      { to: "ditolak", label: "Tolak", icon: "x", cls: "nb-btn--danger", log: ["Ditolak", "Pengajuan ditolak admin.", "pink", "x"] }
    ],
    disetujui: [
      { to: "dipinjam", label: "Tandai diambil", icon: "arrow-right", cls: "nb-btn--yellow", log: ["Aset diambil", "Serah terima ke peminjam.", "blue", "bookmark"] }
    ],
    dipinjam: [
      { to: "selesai", label: "Tandai dikembalikan", icon: "check", cls: "nb-btn--yellow", log: ["Dikembalikan", "Aset diterima kembali dalam kondisi baik.", "mint", "check"] }
    ],
    terlambat: [
      { to: "selesai", label: "Tandai dikembalikan", icon: "check", cls: "nb-btn--yellow", log: ["Dikembalikan terlambat", "Aset diterima kembali setelah jatuh tempo.", "mint", "check"] }
    ]
  };

  function initBookings() {
    var root = NB.qs("[data-booking-table]");
    if (!root) return;
    var drawer = NB.qs("#drawer-booking");
    var data = {};
    (R.bookings || []).forEach(function (b) {
      data[b.id] = Object.assign({}, b, {
        log: [{ iso: b.start, title: "Diajukan", text: "Pengajuan oleh " + user(b.user).name + ".", color: "yellow", icon: "file" }]
      });
    });
    var openId = null;
    var seq = 419;

    function kpis() {
      var c = { menunggu: 0, aktif: 0, terlambat: 0, selesai: 0 };
      Object.keys(data).forEach(function (id) {
        var s = data[id].status;
        if (s === "dipinjam" || s === "disetujui") c.aktif++;
        else if (c[s] !== undefined) c[s]++;
      });
      Object.keys(c).forEach(function (k) {
        setKpi(k, c[k]);
      });
    }

    function row(b) {
      var a = asset(b.asset);
      var u = user(b.user);
      var tr = document.createElement("tr");
      tr.setAttribute("data-id", b.id);
      tr.setAttribute("data-status", b.status);
      tr.setAttribute("data-search", [b.id, b.asset, a.name, u.name, b.purpose].join(" ").toLowerCase());
      tr.innerHTML =
        '<td class="nb-cell-id">' + b.id + ' <span class="nb-badge nb-badge--ink">Baru</span></td>' +
        '<td class="nb-cell-strong"><a class="nb-cell-link" href="assets-detail.html?id=' + encodeURIComponent(b.asset) + '">' +
        esc(a.name) + '</a><span class="nb-cell-sub">' + esc(b.asset) + "</span></td>" +
        '<td><div class="nb-cell-user">' + avatar(u) + "<span>" + esc(u.name) + "</span></div></td>" +
        '<td data-sort-value="' + b.start + '"><time datetime="' + b.start + '">' + C.dfmt(b.start, false) + '</time> – <time datetime="' +
        b.end + '">' + C.dfmt(b.end) + "</time></td>" +
        "<td data-booking-status>" + badgeOf(R.bookingStatus, b.status) + "</td>" +
        '<td class="nb-cell-actions"><button class="nb-btn nb-btn--sm nb-btn--outline" type="button" data-booking-open="' + b.id +
        '" aria-label="Detail ' + b.id + '">Detail</button></td>';
      return tr;
    }

    function render(id) {
      var b = data[id];
      if (!b || !drawer) return;
      var a = asset(b.asset);
      var u = user(b.user);
      var set = function (k, html) {
        var el = NB.qs('[data-bk="' + k + '"]', drawer);
        if (el) el.innerHTML = html;
      };
      set("id", esc(b.id));
      set("status", badgeOf(R.bookingStatus, b.status));
      set("asset", '<a href="assets-detail.html?id=' + encodeURIComponent(b.asset) + '">' + esc(a.name) + "</a> · " + esc(b.asset));
      set("user", '<span class="nb-cell-user">' + avatar(u) + "<span>" + esc(u.name) + "</span></span>");
      set("period", C.dfmt(b.start) + " – " + C.dfmt(b.end));
      set("purpose", esc(b.purpose));
      set("log", C.timelineHtml(b.log.slice().reverse()));
      var box = NB.qs("[data-bk-actions]", drawer);
      if (!box) return;
      var acts = BK_ACTIONS[b.status] || [];
      box.innerHTML = acts.length
        ? acts.map(function (act) {
            return '<button class="nb-btn ' + act.cls + '" type="button" data-bk-act="' + act.to + '">' +
              NB.icons.svg(act.icon, "nb-icon--sm") + act.label + "</button>";
          }).join("")
        : '<p class="nb-help">Tidak ada tindakan lanjutan untuk status ini.</p>';
      box.insertAdjacentHTML("beforeend", '<button class="nb-btn nb-btn--outline" type="button" data-modal-close>Tutup</button>');
    }

    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-booking-open]");
      if (!btn || !drawer) return;
      openId = btn.getAttribute("data-booking-open");
      render(openId);
      NB.modal.open(drawer.id, btn);
    });

    if (drawer) {
      drawer.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-bk-act]");
        if (!btn || !openId) return;
        var b = data[openId];
        var act = (BK_ACTIONS[b.status] || []).filter(function (x) {
          return x.to === btn.getAttribute("data-bk-act");
        })[0];
        if (!act) return;
        b.status = act.to;
        b.log.push({ iso: now(), title: act.log[0], text: act.log[1], color: act.log[2], icon: act.log[3] });
        var tr = NB.qs('tr[data-id="' + openId + '"]', root);
        if (tr) {
          tr.setAttribute("data-status", b.status);
          var cell = NB.qs("[data-booking-status]", tr);
          if (cell) cell.innerHTML = badgeOf(R.bookingStatus, b.status);
          if (root.nbTable) root.nbTable.sync();
        }
        kpis();
        render(openId);
        var next = NB.qs("[data-bk-act], [data-modal-close]", NB.qs("[data-bk-actions]", drawer));
        if (next) next.focus();
        NB.toast({
          type: act.to === "ditolak" ? "warning" : "success",
          title: b.id + ": " + (R.bookingStatus[b.status] || [0, b.status])[1] + " (demo)",
          message: "Status hanya berubah di halaman ini; muat ulang untuk kembali ke data contoh.",
          timeout: 4000
        });
      });
    }

    var form = NB.qs("form[data-booking-form]");
    if (form) {
      var modalId = form.closest(".nb-modal").id;
      form.addEventListener("nb:valid-submit", function () {
        var id = "PJM-26-0" + seq++;
        var b = {
          id: id,
          asset: form.elements.asset.value,
          user: form.elements.user.value,
          start: form.elements.start.value,
          end: form.elements.end.value,
          status: "menunggu",
          purpose: form.elements.purpose.value.trim()
        };
        b.log = [{ iso: now(), title: "Diajukan", text: "Pengajuan oleh " + user(b.user).name + ".", color: "yellow", icon: "file" }];
        data[id] = b;
        if (root.nbTable) root.nbTable.add(row(b));
        kpis();
        NB.modal.close(modalId);
        NB.forms.reset(form);
        NB.toast({
          type: "success",
          title: id + " diajukan (demo)",
          message: asset(b.asset).name + " untuk " + user(b.user).name + ". Menunggu persetujuan; tidak tersimpan setelah dimuat ulang."
        });
      });

      var pre = param("asset");
      if (pre) {
        var select = form.elements.asset;
        var opt = select && NB.qsa("option", select).filter(function (o) {
          return o.value === pre;
        })[0];
        if (opt) {
          select.value = pre;
          NB.modal.open(modalId, NB.qs('[data-modal-open="' + modalId + '"]'));
        } else {
          NB.toast({
            type: "warning",
            title: "Aset tidak bisa dipinjam",
            message: pre + " tidak berstatus Baik atau tidak ditandai bisa dipinjam.",
            timeout: 6000
          });
        }
      }
    }
    kpis();
  }

  /* ======================================================================
     Perawatan
     ====================================================================== */
  var TK_ACTIONS = {
    terbuka: [{ to: "dikerjakan", label: "Mulai kerjakan", icon: "wrench", cls: "nb-btn--yellow", needsTech: true }],
    dikerjakan: [
      { to: "selesai", label: "Tandai selesai", icon: "check", cls: "nb-btn--yellow" },
      { to: "menunggu", label: "Tunggu suku cadang", icon: "clock", cls: "nb-btn--outline" }
    ],
    menunggu: [{ to: "dikerjakan", label: "Lanjutkan pengerjaan", icon: "wrench", cls: "nb-btn--yellow" }],
    selesai: [{ to: "terbuka", label: "Buka ulang", icon: "refresh", cls: "nb-btn--outline" }]
  };
  var TK_LOG = {
    dikerjakan: ["Mulai dikerjakan", "blue", "wrench"],
    menunggu: ["Menunggu suku cadang", "lavender", "clock"],
    selesai: ["Selesai", "mint", "check"],
    terbuka: ["Dibuka ulang", "pink", "alert"]
  };

  function initMaintenance() {
    var detail = NB.qs("[data-ticket-detail]");
    var listEl = NB.qs("[data-ticket-list]");
    if (!detail || !listEl) return;
    var data = {};
    (R.tickets || []).forEach(function (t) {
      data[t.id] = Object.assign({}, t, { events: t.events.slice() });
    });
    var first = NB.qs("[data-ticket][aria-current]", listEl) || NB.qs("[data-ticket]", listEl);
    var currentId = first ? first.getAttribute("data-ticket") : null;
    var filterValue = "";
    var info = NB.qs("[data-ticket-info]");
    var empty = NB.qs("[data-ticket-empty]");
    var techSel = NB.qs("[data-td-tech]", detail);
    var seq = 222;

    function td(k, html) {
      var el = NB.qs('[data-td="' + k + '"]', detail);
      if (el) el.innerHTML = html;
    }

    function counts() {
      var c = { "": 0, terbuka: 0, dikerjakan: 0, menunggu: 0, selesai: 0 };
      Object.keys(data).forEach(function (id) {
        c[""]++;
        c[data[id].status]++;
      });
      NB.qsa("[data-ticket-count]").forEach(function (el) {
        el.textContent = String(c[el.getAttribute("data-ticket-count")] || 0);
      });
      ["terbuka", "dikerjakan", "menunggu", "selesai"].forEach(function (k) {
        setKpi(k, c[k]);
      });
    }

    function applyFilter() {
      var shown = 0;
      NB.qsa("[data-ticket-item]", listEl).forEach(function (li) {
        var ok = !filterValue || li.getAttribute("data-status") === filterValue;
        li.hidden = !ok;
        if (ok) shown++;
      });
      if (info) info.textContent = shown + " tiket" + (filterValue ? " · " + (R.ticketStatus[filterValue] || [0, filterValue])[1] : "");
      if (empty) empty.hidden = shown > 0;
    }

    function itemHtml(t) {
      var pr = R.priority[t.priority] || ["neutral", t.priority];
      return (
        '<button class="nb-ticket" type="button" data-ticket="' + t.id + '">' +
        '<span class="nb-ticket__top"><span class="nb-ticket__id">' + t.id + "</span>" + C.badge(pr[0], pr[1], false) + "</span>" +
        '<span class="nb-ticket__title">' + esc(t.title) + "</span>" +
        '<span class="nb-ticket__meta">' + esc(asset(t.asset).name) + " · " + C.dfmt(t.opened) + "</span>" +
        '<span class="nb-ticket__status">' + badgeOf(R.ticketStatus, t.status) + "</span></button>"
      );
    }

    function refreshItem(t) {
      var btn = NB.qs('[data-ticket="' + t.id + '"]', listEl);
      if (!btn) return;
      btn.closest("[data-ticket-item]").setAttribute("data-status", t.status);
      var st = NB.qs(".nb-ticket__status", btn);
      if (st) st.innerHTML = badgeOf(R.ticketStatus, t.status);
    }

    function renderDetail() {
      var t = data[currentId];
      if (!t) return;
      var pr = R.priority[t.priority] || ["neutral", t.priority];
      var opened = C.dfmt(t.opened) + (t.opened.length > 10 ? " · " + t.opened.slice(11, 16).replace(":", ".") : "");
      td("id", esc(t.id));
      td("title", esc(t.title));
      td("badges", C.badge(pr[0], pr[1], false) + badgeOf(R.ticketStatus, t.status));
      td("desc", esc(t.desc));
      td("asset", '<a href="assets-detail.html?id=' + encodeURIComponent(t.asset) + '">' + esc(asset(t.asset).name) + "</a> · " + esc(t.asset));
      td("reporter", esc(user(t.reporter).name));
      td("opened", opened);
      td("timeline", C.timelineHtml(t.events.slice().reverse()));
      if (techSel) techSel.value = t.tech || "";
      td(
        "actions",
        '<span class="nb-label">Tindakan</span><div class="nb-btn-row">' +
          (TK_ACTIONS[t.status] || []).map(function (a) {
            return '<button class="nb-btn ' + a.cls + '" type="button" data-td-act="' + a.to + '">' +
              NB.icons.svg(a.icon, "nb-icon--sm") + a.label + "</button>";
          }).join("") +
          "</div>"
      );
    }

    function select(id, focus) {
      if (!data[id]) return;
      currentId = id;
      NB.qsa("[data-ticket]", listEl).forEach(function (b) {
        if (b.getAttribute("data-ticket") === id) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
      var note = NB.qs("form[data-td-note]", detail);
      if (note) NB.forms.reset(note);
      renderDetail();
      if (focus) {
        var h = NB.qs("#ticket-title", detail);
        if (h) h.focus();
      }
    }

    function log(t, title, text, color, icon) {
      t.events.push({ iso: now(), title: title, text: text, color: color, icon: icon });
    }

    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-ticket]");
      if (btn) select(btn.getAttribute("data-ticket"), true);
    });

    var filter = NB.qs("[data-ticket-filter]");
    if (filter) {
      filter.addEventListener("nb:toggle-group", function (e) {
        filterValue = e.detail.value || "";
        applyFilter();
      });
    }

    if (techSel) {
      techSel.addEventListener("change", function () {
        var t = data[currentId];
        if (!t) return;
        t.tech = techSel.value;
        var name = t.tech ? user(t.tech).name : "";
        log(t, t.tech ? "Teknisi ditugaskan" : "Penugasan dilepas", t.tech ? name + " menangani tiket ini." : "Belum ada teknisi.", "yellow", "user");
        renderDetail();
        NB.toast({
          type: "info",
          title: t.tech ? name + " ditugaskan (demo)" : "Penugasan dilepas (demo)",
          message: t.id + " — hanya berubah di halaman ini.",
          timeout: 3500
        });
      });
    }

    detail.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-td-act]");
      if (!btn) return;
      var t = data[currentId];
      var act = (TK_ACTIONS[t.status] || []).filter(function (a) {
        return a.to === btn.getAttribute("data-td-act");
      })[0];
      if (!act) return;
      if (act.needsTech && !t.tech) {
        NB.toast({ type: "warning", title: "Pilih teknisi dulu", message: "Tiket perlu teknisi sebelum mulai dikerjakan.", timeout: 4000 });
        if (techSel) techSel.focus();
        return;
      }
      t.status = act.to;
      var lg = TK_LOG[act.to];
      log(t, lg[0], (t.tech ? user(t.tech).name : "Admin") + " memperbarui status.", lg[1], lg[2]);
      refreshItem(t);
      counts();
      applyFilter();
      renderDetail();
      var next = NB.qs("[data-td-act]", detail);
      if (next) next.focus();
      NB.toast({
        type: "success",
        title: t.id + ": " + (R.ticketStatus[t.status] || [0, t.status])[1] + " (demo)",
        message: "Perubahan hanya disimulasikan di halaman ini.",
        timeout: 3500
      });
    });

    var note = NB.qs("form[data-td-note]", detail);
    if (note) {
      note.addEventListener("nb:valid-submit", function () {
        var t = data[currentId];
        if (!t) return;
        log(t, "Catatan", note.elements.note.value.trim(), "blue", "edit");
        renderDetail();
        NB.forms.reset(note);
        NB.toast({ type: "success", title: "Catatan ditambahkan (demo)", message: "Muncul di riwayat " + t.id + ", tidak dikirim ke server.", timeout: 3500 });
      });
    }

    var form = NB.qs("form[data-ticket-form]");
    if (form) {
      var modalId = form.closest(".nb-modal").id;
      form.addEventListener("nb:valid-submit", function () {
        var id = "TK-" + seq++;
        var pr = NB.qs('[name="priority"]:checked', form);
        var t = {
          id: id,
          asset: form.elements.asset.value,
          title: form.elements.title.value.trim(),
          desc: form.elements.desc.value.trim(),
          priority: pr ? pr.value : "normal",
          status: "terbuka",
          reporter: "USR-001",
          tech: "",
          opened: now(),
          events: []
        };
        log(t, "Tiket dibuka", "Dilaporkan oleh " + user(t.reporter).name + ".", "pink", "alert");
        data[id] = t;
        var li = document.createElement("li");
        li.setAttribute("data-ticket-item", "");
        li.setAttribute("data-status", t.status);
        li.innerHTML = itemHtml(t);
        listEl.insertBefore(li, listEl.firstChild);
        counts();
        applyFilter();
        NB.modal.close(modalId);
        NB.forms.reset(form);
        select(id, true);
        NB.toast({ type: "success", title: id + " dibuat (demo)", message: t.title + ". Tiket hilang saat halaman dimuat ulang." });
      });
    }

    counts();
    applyFilter();
    var pre = param("id");
    if (pre && data[pre]) select(pre, true);
    else if (currentId) renderDetail();
  }

  NB.ready(function () {
    if (!C) return;
    initRooms();
    initBookings();
    initMaintenance();
  });
})();
