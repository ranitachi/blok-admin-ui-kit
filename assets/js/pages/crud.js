/* ==========================================================================
   BLOK pages/crud.js — alur CRUD demo untuk halaman aset & pengguna (Phase C).

   BUKAN database. Tambah/ubah/hapus disimpan sementara di sessionStorage
   (kunci "nb-crud-v1") agar terasa nyata saat berpindah halaman, lalu hilang
   saat tab ditutup atau tombol "Kembalikan data contoh" ditekan.
   Data awal: assets/js/records.js (NB.records). Tanpa fetch, tanpa server.

   Hook utama:
     [data-crud-table="assets|users"]   tabel daftar (dibantu tables.js)
     form[data-crud-form="create|edit"] formulir aset (lihat juga data-crud-user-form)
     [data-crud-delete="ID"]            buka konfirmasi hapus
     [data-crud-delete-confirm]         tombol hapus di modal (aktif setelah ketik HAPUS)
     [data-field="nama"]                diisi ulang di halaman detail sesuai ?id=
     [data-crud-session]                banner "perubahan sesi ini"
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});
  var R = NB.records || { assets: [], users: [], rooms: [], status: {}, userStatus: {} };
  var KEY = "nb-crud-v1";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var LIFE = { Elektronik: 4, Furnitur: 8, "Alat laboratorium": 8, "Peralatan olahraga": 4, "Kendaraan & lainnya": 8 };
  var CAT_KEY = {
    Elektronik: "elektronik",
    Furnitur: "furnitur",
    "Alat laboratorium": "lab",
    "Peralatan olahraga": "olahraga",
    "Kendaraan & lainnya": "kendaraan"
  };
  var BUILDING_KEY = { "Gedung A": "gedung-a", "Gedung B": "gedung-b", "Gedung C": "gedung-c", "Gedung D": "gedung-d" };
  var ID_FIELD = { assets: "code", users: "id" };
  var esc = NB.escapeHtml;
  var icon = function (name) {
    return NB.icons.svg(name, "nb-icon--sm");
  };

  /* ---------- Penyimpanan sesi (try/catch: bisa diblokir browser) ---------- */
  function blank() {
    return { created: { assets: [], users: [] }, updated: { assets: {}, users: {} }, deleted: { assets: [], users: [] }, flash: null };
  }
  function load() {
    try {
      var s = JSON.parse(window.sessionStorage.getItem(KEY));
      return s && s.created ? s : blank();
    } catch (e) {
      return blank();
    }
  }
  function save(s) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(s));
      return true;
    } catch (e) {
      return false;
    }
  }
  function update(fn) {
    var s = load();
    fn(s);
    return save(s);
  }
  function changeCount(s) {
    var n = 0;
    ["assets", "users"].forEach(function (k) {
      n += s.created[k].length + Object.keys(s.updated[k]).length + s.deleted[k].length;
    });
    return n;
  }

  /* ---------- Format ---------- */
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dfmt(iso, year) {
    if (!iso) return "—";
    var p = iso.slice(0, 10).split("-");
    return +p[2] + " " + MONTHS[+p[1] - 1] + (year === false ? "" : " " + p[0]);
  }
  function rp(n) {
    return "Rp" + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function badge(kind, text, dot) {
    return '<span class="nb-badge nb-badge--' + kind + (dot === false ? "" : " nb-badge--dot") + '">' + esc(text) + "</span>";
  }
  function statusBadge(map, key) {
    var s = map[key] || ["neutral", key];
    return badge(s[0], s[1]);
  }
  function roomOf(name) {
    var r = (R.rooms || []).filter(function (x) {
      return x.name === name;
    })[0];
    return r || { code: "Area luar", name: name, building: "Area luar" };
  }

  /* ---------- Akses record (data awal + perubahan sesi) ---------- */
  function list(kind) {
    var s = load();
    var idf = ID_FIELD[kind];
    var base = (R[kind] || []).map(function (r) {
      return Object.assign({}, r, s.updated[kind][r[idf]] || {});
    });
    return s.created[kind]
      .map(function (r) {
        return Object.assign({ _new: true }, r, s.updated[kind][r[idf]] || {});
      })
      .concat(base)
      .filter(function (r) {
        return s.deleted[kind].indexOf(r[idf]) === -1;
      });
  }
  function find(kind, id) {
    return (
      list(kind).filter(function (r) {
        return r[ID_FIELD[kind]] === id;
      })[0] || null
    );
  }
  function user(id) {
    return find("users", id) || { id: id, name: "—", initials: "?", color: "yellow", role: "", unit: "" };
  }
  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  /* ---------- Flash: pesan yang dibawa ke halaman berikutnya ---------- */
  function flash(msg) {
    update(function (s) {
      s.flash = msg;
    });
  }
  function takeFlash() {
    var s = load();
    var f = s.flash;
    if (f) {
      s.flash = null;
      save(s);
    }
    return f;
  }
  function go(href) {
    // Pastikan peringatan "belum disimpan" tidak muncul saat berpindah setelah simpan.
    NB.qsa("form[data-dirty]").forEach(function (f) {
      f.removeAttribute("data-dirty");
    });
    window.location.href = href;
  }

  /* ---------- Judul & breadcrumb mengikuti record ---------- */
  function setTitle(text, prefix) {
    var h1 = NB.qs("[data-crud-title]");
    if (h1) h1.textContent = (prefix || "") + text;
    document.title = (prefix || "") + text + " — BLOK Admin UI Kit";
    NB.qsa('.nb-breadcrumb [aria-current="page"]').forEach(function (el) {
      el.textContent = (prefix || "") + text;
    });
  }
  function fill(root, name, value, html) {
    NB.qsa('[data-field="' + name + '"]', root).forEach(function (el) {
      if (html) el.innerHTML = value;
      else el.textContent = value;
    });
  }

  /* ---------- Konfirmasi ketik-untuk-hapus ---------- */
  function initConfirmInputs() {
    NB.qsa("[data-confirm-input]").forEach(function (input) {
      var scope = input.closest(".nb-modal") || document;
      var target = NB.qs("[data-confirm-target]", scope);
      var word = input.getAttribute("data-confirm-input");
      if (!target) return;
      function sync() {
        target.disabled = input.value.trim().toUpperCase() !== word;
      }
      function clear() {
        input.value = "";
        sync();
      }
      input.addEventListener("input", sync);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !target.disabled) {
          e.preventDefault();
          target.click();
        }
      });
      scope.addEventListener("nb:modal-open", clear);
      scope.addEventListener("nb:modal-close", clear);
      sync();
    });
  }

  /* ---------- Banner perubahan sesi ---------- */
  function initSessionBanner() {
    var box = NB.qs("[data-crud-session]");
    if (!box) return;
    var n = changeCount(load());
    box.hidden = n === 0;
    var text = NB.qs("[data-crud-session-text]", box);
    if (text) {
      text.textContent =
        n + " perubahan demo (tambah/ubah/hapus) tersimpan sementara di sesi browser ini. Data asli template tidak berubah.";
    }
    var btn = NB.qs("[data-crud-session-clear]", box);
    if (btn && !btn.__nb) {
      btn.__nb = true;
      btn.addEventListener("click", function () {
        try {
          window.sessionStorage.removeItem(KEY);
        } catch (e) {
          /* abaikan */
        }
        flash({ type: "info", title: "Data contoh dikembalikan", message: "Semua perubahan sesi ini dibuang." });
        window.location.reload();
      });
    }
  }

  function showFlash() {
    var f = takeFlash();
    if (f) NB.toast({ type: f.type || "success", title: f.title, message: f.message, timeout: 6000 });
  }

  /* ======================================================================
     ASET
     ====================================================================== */
  function assetRow(a) {
    var room = roomOf(a.room);
    var st = R.status[a.status] || ["neutral", a.status];
    var pic = user(a.pic);
    var n = esc(a.name);
    var href = "assets-detail.html?id=" + encodeURIComponent(a.code);
    var tr = document.createElement("tr");
    tr.setAttribute("data-id", a.code);
    tr.setAttribute("data-status", a.status);
    tr.setAttribute("data-category", CAT_KEY[a.category] || "");
    tr.setAttribute("data-building", BUILDING_KEY[room.building] || "luar");
    tr.setAttribute(
      "data-search",
      [a.code, a.name, a.category, a.brand, a.serial, a.room, room.code, pic.name].join(" ").toLowerCase()
    );
    tr.innerHTML =
      '<td class="nb-cell-check"><label class="nb-check"><input type="checkbox" data-table-select aria-label="Pilih ' + n +
      '"><span class="nb-sr-only">Pilih</span></label></td>' +
      '<td class="nb-cell-id"><a href="' + href + '">' + esc(a.code) + "</a></td>" +
      '<td class="nb-cell-strong"><a class="nb-cell-link" href="' + href + '">' + n + "</a>" +
      (a._new ? ' <span class="nb-badge nb-badge--ink">Baru</span>' : "") + "</td>" +
      "<td>" + esc(a.category) + "</td>" +
      "<td>" + esc(a.room) + '<span class="nb-cell-sub">' + esc(room.code) + "</span></td>" +
      "<td>" + badge(st[0], st[1]) + "</td>" +
      '<td class="nb-cell-num" data-sort-value="' + (a.value || 0) + '">' + rp(a.value) + "</td>" +
      '<td class="nb-cell-muted" data-sort-value="' + a.updated + '"><time datetime="' + a.updated + '">' + dfmt(a.updated) + "</time></td>" +
      '<td class="nb-cell-actions"><div class="nb-row-actions">' +
      '<a class="nb-icon-btn" href="' + href + '" aria-label="Lihat ' + n + '">' + icon("eye") + "</a>" +
      '<a class="nb-icon-btn" href="assets-edit.html?id=' + encodeURIComponent(a.code) + '" aria-label="Ubah ' + n + '">' + icon("edit") + "</a>" +
      '<button class="nb-icon-btn" type="button" aria-label="Hapus ' + n + '" data-crud-delete="' + esc(a.code) + '">' + icon("trash") + "</button>" +
      "</div></td>";
    return tr;
  }

  function updateAssetKpis(root) {
    var all = NB.qsa("tbody[data-table-body] tr[data-status]", root);
    var c = { baik: 0, servis: 0, rusak: 0, dipinjam: 0 };
    all.forEach(function (tr) {
      c[tr.getAttribute("data-status")] = (c[tr.getAttribute("data-status")] || 0) + 1;
    });
    var set = function (k, v) {
      var el = NB.qs('[data-kpi="' + k + '"]');
      if (el) el.textContent = String(v);
    };
    set("total", all.length);
    set("baik", c.baik);
    set("tindakan", c.servis + c.rusak);
    set("dipinjam", c.dipinjam);
  }

  function initAssetList() {
    var root = NB.qs('[data-crud-table="assets"]');
    if (!root || !root.nbTable) return;
    var body = NB.qs("tbody[data-table-body]", root);
    var s = load();
    // Terapkan perubahan sesi langsung ke DOM, lalu jadikan kondisi awal tabel.
    s.deleted.assets.forEach(function (code) {
      var tr = NB.qs('tr[data-id="' + code + '"]', body);
      if (tr) tr.parentNode.removeChild(tr);
    });
    Object.keys(s.updated.assets).forEach(function (code) {
      var tr = NB.qs('tr[data-id="' + code + '"]', body);
      var rec = find("assets", code);
      if (tr && rec) body.replaceChild(assetRow(rec), tr);
    });
    s.created.assets
      .slice()
      .reverse()
      .forEach(function (a) {
        var rec = find("assets", a.code);
        if (rec && !NB.qs('tr[data-id="' + a.code + '"]', body)) body.insertBefore(assetRow(rec), body.firstChild);
      });
    root.nbTable.sync();
    updateAssetKpis(root);
  }

  /* ---------- Hapus (daftar, detail, ubah) ---------- */
  function initDelete(kind, modalId, listPage, label) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    var current = null;
    var opener = null;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-crud-delete]");
      if (!btn) return;
      current = { id: btn.getAttribute("data-crud-delete"), redirect: btn.hasAttribute("data-crud-delete-redirect") };
      opener = btn;
      var rec = find(kind, current.id);
      var name = NB.qs("[data-crud-delete-name]", modal);
      if (name) name.textContent = (rec ? rec.name : current.id) + " (" + current.id + ")";
      NB.modal.open(modalId, btn);
    });
    var confirm = NB.qs("[data-crud-delete-confirm]", modal);
    if (!confirm) return;
    confirm.addEventListener("click", function () {
      if (!current) return;
      var rec = find(kind, current.id);
      var name = rec ? rec.name : current.id;
      update(function (s) {
        if (s.deleted[kind].indexOf(current.id) === -1) s.deleted[kind].push(current.id);
        delete s.updated[kind][current.id];
      });
      NB.modal.close(modalId);
      var msg = { type: "warning", title: name + " dihapus (demo)", message: "Hanya hilang di sesi browser ini. Data asli template tidak berubah." };
      if (current.redirect) {
        flash(msg);
        go(listPage);
        return;
      }
      var table = NB.qs('[data-crud-table="' + kind + '"]');
      var tr = table && NB.qs('tr[data-id="' + current.id + '"]', table);
      if (table && tr && table.nbTable) table.nbTable.remove(tr);
      if (kind === "assets" && table) updateAssetKpis(table);
      initSessionBanner();
      NB.toast(msg);
      var search = table && NB.qs("[data-table-search]", table);
      // Tombol pembuka sudah hilang bersama barisnya: pindahkan fokus ke tempat yang masuk akal.
      setTimeout(function () {
        (search || NB.qs("#main")).focus();
      }, 0);
      current = null;
      opener = null;
    });
    modal.addEventListener("nb:modal-close", function () {
      if (opener && !document.body.contains(opener)) {
        var s = NB.qs("[data-table-search]");
        if (s) s.focus();
      }
    });
    void label;
  }

  /* ---------- Formulir aset ---------- */
  function readAssetForm(form) {
    var fd = new FormData(form);
    var get = function (k) {
      return String(fd.get(k) || "").trim();
    };
    return {
      code: get("code"),
      name: get("name"),
      category: get("category"),
      brand: get("brand"),
      serial: get("serial"),
      room: get("room"),
      roomCode: roomOf(get("room")).code,
      pic: get("pic"),
      status: get("status"),
      bought: get("bought"),
      value: parseInt(get("value").replace(/\D/g, ""), 10) || 0,
      updated: today(),
      warranty: get("warranty"),
      fund: get("fund"),
      loanable: fd.get("loanable") === "ya",
      notes: get("notes")
    };
  }

  function setDefault(form, name, value) {
    NB.qsa('[name="' + name + '"]', form).forEach(function (el) {
      if (el.type === "radio") {
        el.checked = el.defaultChecked = el.value === value;
      } else if (el.type === "checkbox") {
        el.checked = el.defaultChecked = !!value;
      } else if (el.tagName === "SELECT") {
        Array.prototype.forEach.call(el.options, function (o) {
          o.selected = o.defaultSelected = o.value === value || (!o.value && false) || o.text === value;
        });
      } else if (el.type === "hidden") {
        el.value = value || "";
        el.setAttribute("data-default", value || "");
      } else {
        el.value = el.defaultValue = value == null ? "" : value;
      }
    });
  }

  function hydrateAssetForm(form, a) {
    setDefault(form, "code", a.code);
    setDefault(form, "name", a.name);
    setDefault(form, "category", a.category);
    setDefault(form, "brand", a.brand);
    setDefault(form, "serial", a.serial);
    setDefault(form, "pic", a.pic);
    setDefault(form, "status", a.status);
    setDefault(form, "bought", a.bought);
    setDefault(form, "value", String(a.value || "").replace(/\B(?=(\d{3})+(?!\d))/g, "."));
    setDefault(form, "warranty", a.warranty);
    setDefault(form, "fund", a.fund);
    setDefault(form, "loanable", a.loanable);
    setDefault(form, "notes", a.notes);
    setDefault(form, "room", a.room);
    var combo = NB.qs('[role="combobox"]', form);
    if (combo) {
      combo.value = combo.defaultValue = a.room;
      var listEl = document.getElementById(combo.getAttribute("aria-controls"));
      NB.qsa('[role="option"]', listEl).forEach(function (o) {
        o.setAttribute("aria-selected", String(o.getAttribute("data-value") === a.room));
      });
    }
    // Perbarui teks switch & penghitung karakter tanpa menandai formulir "berubah".
    NB.qsa('input[role="switch"]', form).forEach(function (sw) {
      sw.dispatchEvent(new Event("change", { bubbles: false }));
    });
    NB.qsa("[data-char-count]", form).forEach(function (f) {
      f.dispatchEvent(new Event("input", { bubbles: false }));
    });
  }

  function updateLabel(form) {
    var name = NB.qs('[data-label-source="name"]', form);
    var room = NB.qs('[data-label-source="room"]', form);
    var code = NB.qs("[data-crud-code]", form);
    var set = function (sel, v) {
      var el = NB.qs(sel);
      if (el) el.textContent = v;
    };
    if (name) set("[data-label-name]", name.value.trim() || "Nama aset");
    if (room) set("[data-label-room]", room.value.trim() || "Lokasi belum dipilih");
    if (code) set("[data-label-code]", code.value);
  }

  function initAssetForm() {
    var form = NB.qs('form[data-crud-form]');
    if (!form) return;
    var mode = form.getAttribute("data-crud-form");
    var rec = null;

    if (mode === "create") {
      // Kode berikutnya memperhitungkan aset yang sudah ditambahkan di sesi ini.
      var max = 0;
      list("assets")
        .concat(load().created.assets)
        .forEach(function (a) {
          var n = parseInt(String(a.code).split("-").pop(), 10);
          if (n > max) max = n;
        });
      R.assets.forEach(function (a) {
        var n = parseInt(String(a.code).split("-").pop(), 10);
        if (n > max) max = n;
      });
      setDefault(form, "code", "AST-26-" + (max + 1));
    } else {
      var id = param("id") || "AST-26-1284";
      rec = find("assets", id);
      var missing = NB.qs("[data-crud-missing]");
      if (!rec) {
        if (missing) missing.hidden = false;
        rec = find("assets", "AST-26-1284");
      }
      if (rec) {
        hydrateAssetForm(form, rec);
        setTitle(rec.name, "Ubah: ");
        NB.qsa("[data-crud-back], [data-crud-cancel]").forEach(function (a) {
          a.setAttribute("href", "assets-detail.html?id=" + encodeURIComponent(rec.code));
        });
        NB.qsa("[data-crud-delete]").forEach(function (b) {
          b.setAttribute("data-crud-delete", rec.code);
        });
        fill(document, "bought", dfmt(rec.bought));
        fill(document, "updated", dfmt(rec.updated));
      }
    }
    updateLabel(form);

    form.addEventListener("input", function () {
      updateLabel(form);
    });
    form.addEventListener("change", function () {
      updateLabel(form);
    });
    form.addEventListener("reset", function () {
      setTimeout(function () {
        updateLabel(form);
        if (mode === "edit") NB.toast({ type: "info", title: "Perubahan dibatalkan", message: "Isian dikembalikan ke data tersimpan.", timeout: 3000 });
      }, 10);
    });

    form.addEventListener("nb:valid-submit", function () {
      var data = readAssetForm(form);
      if (mode === "create") {
        update(function (s) {
          s.created.assets.unshift(data);
        });
        flash({
          type: "success",
          title: data.name + " ditambahkan (demo)",
          message: "Kode " + data.code + ". Tersimpan sementara di sesi browser ini, bukan di database."
        });
        go("assets-list.html");
      } else {
        update(function (s) {
          var created = s.created.assets.filter(function (a) {
            return a.code === data.code;
          })[0];
          if (created) Object.assign(created, data);
          else s.updated.assets[data.code] = data;
        });
        flash({
          type: "success",
          title: "Perubahan disimpan (demo)",
          message: data.name + " diperbarui untuk sesi browser ini saja."
        });
        go("assets-detail.html?id=" + encodeURIComponent(data.code));
      }
    });
  }

  /* ---------- Detail aset ---------- */
  function timelineHtml(events) {
    return (
      '<ol class="nb-timeline">' +
      events
        .map(function (e) {
          var when = dfmt(e.iso, false) + (e.iso.length > 10 ? " · " + e.iso.slice(11, 16).replace(":", ".") : "");
          return (
            '<li class="nb-timeline__item"><span class="nb-timeline__marker" style="--marker: var(--color-' + e.color +
            ')" aria-hidden="true">' + icon(e.icon) + '</span><div class="nb-timeline__head"><p class="nb-timeline__title">' +
            esc(e.title) + '</p><time class="nb-timeline__time" datetime="' + e.iso + '">' + when + "</time></div>" +
            '<p class="nb-timeline__text">' + esc(e.text) + "</p></li>"
          );
        })
        .join("") +
      "</ol>"
    );
  }

  function initAssetDetail() {
    if (!NB.qs("#asset-hero-title")) return;
    var id = param("id");
    var s = load();
    var rec = find("assets", id || "AST-26-1284");
    if (!rec) {
      var missing = NB.qs("[data-crud-missing]");
      if (missing) missing.hidden = false;
      return;
    }
    // Tanpa ?id dan tanpa perubahan sesi: HTML statis sudah benar, tidak perlu diisi ulang.
    if (!id && !s.updated.assets[rec.code]) return;

    var room = roomOf(rec.room);
    var pic = user(rec.pic);
    var st = R.status[rec.status] || ["neutral", rec.status];
    var bought = rec.bought || today();
    var years = (Date.now() - Date.parse(bought)) / (365.25 * 864e5);
    var life = LIFE[rec.category] || 5;
    var used = Math.max(0, Math.min(100, Math.round((years / life) * 100)));
    var book = Math.max(0, Math.round((rec.value || 0) * (1 - years / life)));

    setTitle(rec.name);
    fill(document, "code", rec.code);
    fill(document, "category", rec.category);
    fill(document, "name", rec.name);
    fill(document, "room", rec.room);
    fill(document, "roomCode", room.code);
    fill(document, "building", room.building);
    fill(document, "value", rp(rec.value));
    fill(document, "book", rp(book));
    fill(document, "picName", pic.name);
    fill(document, "updated", dfmt(rec.updated));
    fill(document, "brand", rec.brand || "—");
    fill(document, "serial", rec.serial ? '<code class="nb-inline-code">' + esc(rec.serial) + "</code>" : "—", true);
    fill(document, "boughtText", dfmt(rec.bought) + ' · <span data-field="fund">' + esc(rec.fund || "—") + "</span>", true);
    fill(
      document,
      "warrantyText",
      rec.warranty ? "s.d. " + dfmt(rec.warranty) + (rec.warranty > today() ? " · masih berlaku" : " · sudah habis") : "Tidak ada"
    );
    fill(document, "notes", rec.notes || "—");
    fill(document, "statusBadge", badge(st[0], st[1]) + (rec.loanable ? badge("outline", "Bisa dipinjam", false) : ""), true);

    var history = (rec.history || []).slice();
    if (rec._new) history.unshift({ iso: rec.updated, title: "Aset dicatat (sesi ini)", text: "Ditambahkan lewat formulir demo.", color: "yellow", icon: "box" });
    if (s.updated.assets[rec.code] || (rec._new && rec.updated !== rec.bought && false)) {
      history.unshift({ iso: rec.updated, title: "Data diubah (sesi ini)", text: "Disimpan lewat formulir ubah aset (demo).", color: "lavender", icon: "edit" });
    }
    fill(document, "history", history.length ? timelineHtml(history) : '<p class="nb-help">Belum ada riwayat.</p>', true);

    var loans = rec.loans || [];
    fill(document, "loanCount", String(loans.length));
    fill(
      document,
      "loans",
      loans
        .map(function (b) {
          return (
            '<tr><td class="nb-cell-id">' + b.id + "</td><td>" + esc(user(b.user).name) + '</td><td><time datetime="' + b.start + '">' +
            dfmt(b.start, false) + '</time> – <time datetime="' + b.end + '">' + dfmt(b.end) + "</time></td><td>" +
            statusBadge(R.bookingStatus || {}, b.status) + "</td></tr>"
          );
        })
        .join(""),
      true
    );
    NB.qsa('[data-field="loansEmpty"]').forEach(function (el) {
      el.hidden = loans.length > 0;
    });
    var tickets = rec.tickets || [];
    fill(document, "ticketCount", String(tickets.length));
    fill(
      document,
      "tickets",
      tickets
        .map(function (t) {
          var pr = (R.priority || {})[t.priority] || ["neutral", t.priority];
          return (
            '<li class="nb-list__item"><div class="nb-list__main"><p class="nb-list__title"><a href="maintenance.html?id=' + t.id + '">' +
            t.id + " · " + esc(t.title) + '</a></p><p class="nb-list__meta">Dibuka ' + dfmt(t.opened) + "</p></div>" +
            badge(pr[0], pr[1], false) + statusBadge(R.ticketStatus || {}, t.status) + "</li>"
          );
        })
        .join(""),
      true
    );
    NB.qsa('[data-field="ticketsEmpty"]').forEach(function (el) {
      el.hidden = tickets.length > 0;
    });

    var bar = NB.qs('[data-field="lifeBar"]');
    if (bar) {
      bar.setAttribute("aria-valuenow", String(used));
      bar.setAttribute("aria-valuetext", used + " persen masa pakai terlewati");
      var inner = NB.qs(".nb-progress__bar", bar);
      if (inner) inner.style.setProperty("--value", used + "%");
    }
    fill(document, "lifeText", used + "% dari estimasi " + life + " tahun · penyusutan garis lurus");
    fill(
      document,
      "picAvatar",
      '<span class="nb-avatar nb-avatar--' + pic.color + '" aria-hidden="true">' + esc(pic.initials) + "</span>",
      true
    );
    NB.qsa('[data-field="picLink"]').forEach(function (a) {
      a.textContent = pic.name;
      a.setAttribute("href", "users-detail.html?id=" + encodeURIComponent(pic.id));
    });
    fill(document, "picRole", pic.role + " · " + pic.unit);
    fill(document, "docInvoice", "faktur-" + rec.code.toLowerCase() + ".pdf");
    fill(document, "docPhoto", "foto-" + rec.code.toLowerCase() + ".jpg");
    var set = function (sel, v) {
      var el = NB.qs(sel);
      if (el) el.textContent = v;
    };
    set("[data-label-code]", rec.code);
    set("[data-label-name]", rec.name);
    set("[data-label-room]", rec.room);
    NB.qsa('[data-crud-link="edit"]').forEach(function (a) {
      a.setAttribute("href", "assets-edit.html?id=" + encodeURIComponent(rec.code));
    });
    NB.qsa('[data-crud-link="loan"]').forEach(function (a) {
      a.setAttribute("href", "bookings.html?asset=" + encodeURIComponent(rec.code));
      if (!rec.loanable) {
        a.setAttribute("aria-disabled", "true");
        a.setAttribute("title", "Aset ini tidak dipinjamkan");
      }
    });
    NB.qsa("[data-crud-delete]").forEach(function (b) {
      b.setAttribute("data-crud-delete", rec.code);
    });
  }

  /* ======================================================================
     PENGGUNA
     ====================================================================== */
  function userRow(u) {
    var n = esc(u.name);
    var href = "users-detail.html?id=" + encodeURIComponent(u.id);
    var tr = document.createElement("tr");
    tr.setAttribute("data-id", u.id);
    tr.setAttribute("data-role", slug(u.role));
    tr.setAttribute("data-status", u.status);
    tr.setAttribute("data-search", [u.id, u.name, u.role, u.unit, u.email].join(" ").toLowerCase());
    tr.innerHTML =
      '<td><div class="nb-cell-user"><span class="nb-avatar nb-avatar--sm nb-avatar--' + u.color + '" aria-hidden="true">' + esc(u.initials) +
      '</span><span><a class="nb-cell-link" href="' + href + '">' + n + "</a>" +
      (u._new ? ' <span class="nb-badge nb-badge--ink">Baru</span>' : "") + '<span class="nb-cell-sub">' + esc(u.email) + "</span></span></div></td>" +
      "<td>" + esc(u.role) + "</td>" +
      "<td>" + esc(u.unit) + "</td>" +
      "<td>" + statusBadge(R.userStatus, u.status) + "</td>" +
      '<td class="nb-cell-num" data-sort-value="' + (u.assets || 0) + '">' + (u.assets || 0) + "</td>" +
      '<td class="nb-cell-muted" data-sort-value="' + (u.lastIso || "") + '">' + esc(u.last || "Belum pernah masuk") + "</td>" +
      '<td class="nb-cell-actions"><div class="nb-row-actions">' +
      '<a class="nb-icon-btn" href="' + href + '" aria-label="Lihat profil ' + n + '">' + icon("eye") + "</a>" +
      '<button class="nb-icon-btn" type="button" aria-label="Hapus ' + n + '" data-crud-delete="' + esc(u.id) + '">' + icon("trash") + "</button>" +
      "</div></td>";
    return tr;
  }

  function slug(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function nextUserId() {
    var max = 0;
    R.users.concat(load().created.users).forEach(function (u) {
      var n = parseInt(String(u.id).split("-").pop(), 10);
      if (n > max) max = n;
    });
    return "USR-" + String(max + 1).padStart(3, "0");
  }

  function initUserList() {
    var root = NB.qs('[data-crud-table="users"]');
    if (!root || !root.nbTable) return;
    var body = NB.qs("tbody[data-table-body]", root);
    var s = load();
    s.deleted.users.forEach(function (id) {
      var tr = NB.qs('tr[data-id="' + id + '"]', body);
      if (tr) tr.parentNode.removeChild(tr);
    });
    Object.keys(s.updated.users).forEach(function (id) {
      var tr = NB.qs('tr[data-id="' + id + '"]', body);
      var rec = find("users", id);
      if (tr && rec) {
        var lastCell = tr.cells[5];
        rec.lastIso = lastCell ? lastCell.getAttribute("data-sort-value") : "";
        body.replaceChild(userRow(rec), tr);
      }
    });
    s.created.users
      .slice()
      .reverse()
      .forEach(function (u) {
        var rec = find("users", u.id);
        if (rec && !NB.qs('tr[data-id="' + u.id + '"]', body)) body.insertBefore(userRow(rec), body.firstChild);
      });
    root.nbTable.sync();

    var form = NB.qs("form[data-crud-user-form]");
    if (!form) return;
    form.addEventListener("nb:valid-submit", function () {
      var fd = new FormData(form);
      var name = String(fd.get("name") || "").trim();
      var initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map(function (w) {
          return w.charAt(0).toUpperCase();
        })
        .join("");
      var colors = ["yellow", "mint", "pink", "blue", "lavender"];
      var u = {
        id: nextUserId(),
        name: name,
        initials: initials || "?",
        color: colors[name.length % colors.length],
        role: String(fd.get("role")),
        unit: String(fd.get("unit") || "").trim() || "—",
        email: String(fd.get("email") || "").trim(),
        phone: "",
        status: "undangan",
        last: "Belum pernah masuk",
        joined: today(),
        assets: 0,
        loans: 0,
        tickets: 0,
        activity: [],
        assetList: [],
        loanList: []
      };
      update(function (st) {
        st.created.users.unshift(u);
      });
      var rec = find("users", u.id);
      root.nbTable.add(userRow(rec));
      NB.modal.close(form.closest(".nb-modal").id);
      NB.forms.reset(form);
      initSessionBanner();
      NB.toast({
        type: "success",
        title: "Undangan untuk " + u.name + " dibuat (demo)",
        message: "Tidak ada email yang dikirim. Baris baru hanya ada di sesi browser ini."
      });
    });
  }

  /* ---------- Detail pengguna ---------- */
  function initUserDetail() {
    var profile = NB.qs("[data-user-profile]");
    if (!profile) return;
    var id = param("id");
    var s = load();
    var rec = find("users", id || "USR-001");
    if (!rec) {
      var missing = NB.qs("[data-crud-missing]");
      if (missing) missing.hidden = false;
      rec = find("users", "USR-001");
      id = null;
    }
    if (!rec) return;
    var hydrate = !!id || !!s.updated.users[rec.id];

    function paintStatus() {
      fill(document, "userStatus", statusBadge(R.userStatus, rec.status), true);
      var btn = NB.qs("[data-user-toggle]");
      if (btn) {
        var active = rec.status !== "nonaktif";
        btn.innerHTML = icon(active ? "lock" : "check") + (active ? "Nonaktifkan akun" : "Aktifkan kembali");
        btn.classList.toggle("nb-btn--danger", active);
        btn.classList.toggle("nb-btn--outline", !active);
      }
      var label = NB.qs("[data-user-toggle-label]");
      if (label) label.textContent = rec.status !== "nonaktif" ? "Nonaktifkan akun?" : "Aktifkan kembali akun?";
    }

    if (hydrate) {
      setTitle(rec.name);
      fill(document, "name", rec.name);
      fill(document, "role", rec.role);
      fill(document, "roleUnit", rec.role + " · " + rec.unit);
      fill(document, "email", rec.email);
      fill(document, "phone", rec.phone || "—");
      fill(document, "unit", rec.unit);
      fill(document, "uid", rec.id);
      fill(document, "joined", dfmt(rec.joined));
      fill(document, "last", rec.last || "Belum pernah masuk");
      fill(document, "statAssets", String(rec.assets || 0));
      fill(document, "statLoans", String(rec.loans || 0));
      fill(document, "statTickets", String(rec.tickets || 0));
      NB.qsa('[data-field="avatar"]').forEach(function (el) {
        el.className = "nb-avatar nb-avatar--lg nb-avatar--" + rec.color;
        el.textContent = rec.initials;
      });
      NB.qsa('[data-field="mailto"]').forEach(function (a) {
        a.setAttribute("href", "mailto:" + rec.email);
        a.textContent = rec.email;
      });
      var acts = (rec.activity || []).slice();
      if (rec._new) acts.unshift({ iso: rec.joined, title: "Undangan dibuat (sesi ini)", text: "Menunggu pengguna menerima undangan.", color: "yellow", icon: "mail" });
      fill(document, "activity", acts.length ? timelineHtml(acts) : '<p class="nb-help">Belum ada aktivitas.</p>', true);
      var assets = (rec.assetList || [])
        .map(function (code) {
          return find("assets", code);
        })
        .filter(Boolean);
      fill(document, "assetCount", String(assets.length));
      fill(
        document,
        "assetList",
        assets
          .map(function (a) {
            var st = R.status[a.status] || ["neutral", a.status];
            return (
              '<li class="nb-list__item"><div class="nb-list__main"><p class="nb-list__title"><a href="assets-detail.html?id=' + a.code + '">' +
              esc(a.name) + '</a></p><p class="nb-list__meta">' + a.code + " · " + esc(a.room) + "</p></div>" + badge(st[0], st[1]) + "</li>"
            );
          })
          .join(""),
        true
      );
      NB.qsa('[data-field="assetEmpty"]').forEach(function (el) {
        el.hidden = assets.length > 0;
      });
      var loans = rec.loanList || [];
      fill(document, "loanCount", String(loans.length));
      fill(
        document,
        "loanRows",
        loans
          .map(function (b) {
            var a = find("assets", b.asset);
            return (
              '<tr><td class="nb-cell-id">' + b.id + "</td><td>" + (a ? '<a href="assets-detail.html?id=' + a.code + '">' + esc(a.name) + "</a>" : b.asset) +
              '</td><td><time datetime="' + b.start + '">' + dfmt(b.start, false) + '</time> – <time datetime="' + b.end + '">' + dfmt(b.end) +
              "</time></td><td>" + statusBadge(R.bookingStatus || {}, b.status) + "</td></tr>"
            );
          })
          .join(""),
        true
      );
      NB.qsa('[data-field="loanEmpty"]').forEach(function (el) {
        el.hidden = loans.length > 0;
      });
      NB.qsa("[data-crud-delete]").forEach(function (b) {
        b.setAttribute("data-crud-delete", rec.id);
      });
      var roleSel = NB.qs("#role-select");
      if (roleSel) {
        Array.prototype.forEach.call(roleSel.options, function (o) {
          o.selected = o.defaultSelected = o.value === rec.role;
        });
      }
    }
    paintStatus();

    // Ubah peran
    var roleForm = NB.qs("form[data-user-role-form]");
    if (roleForm) {
      roleForm.addEventListener("nb:valid-submit", function () {
        var role = String(new FormData(roleForm).get("role"));
        rec.role = role;
        saveUser(rec, { role: role });
        fill(document, "role", role);
        fill(document, "roleUnit", role + " · " + rec.unit);
        NB.modal.close(roleForm.closest(".nb-modal").id);
        NB.toast({ type: "success", title: "Peran diubah menjadi " + role + " (demo)", message: "Hanya berlaku di sesi browser ini." });
      });
    }

    // Nonaktifkan / aktifkan
    var toggleConfirm = NB.qs("[data-user-toggle-confirm]");
    if (toggleConfirm) {
      toggleConfirm.addEventListener("click", function () {
        rec.status = rec.status === "nonaktif" ? "aktif" : "nonaktif";
        saveUser(rec, { status: rec.status });
        NB.modal.close(toggleConfirm.closest(".nb-modal").id);
        paintStatus();
        NB.toast({
          type: rec.status === "nonaktif" ? "warning" : "success",
          title: rec.name + (rec.status === "nonaktif" ? " dinonaktifkan" : " diaktifkan kembali") + " (demo)",
          message: "Status hanya berubah di sesi browser ini."
        });
      });
    }

    // Hak akses
    var access = NB.qs("form[data-user-access]");
    if (access) {
      access.addEventListener("submit", function (e) {
        e.preventDefault();
        var on = NB.qsa('input[type="checkbox"]:checked', access).length;
        NB.toast({ type: "success", title: "Hak akses disimpan (demo)", message: on + " izin aktif untuk " + rec.name + ". Tidak ada data yang dikirim." });
      });
    }
  }

  function saveUser(rec, patch) {
    update(function (s) {
      var created = s.created.users.filter(function (u) {
        return u.id === rec.id;
      })[0];
      if (created) Object.assign(created, patch);
      else s.updated.users[rec.id] = Object.assign({}, s.updated.users[rec.id] || {}, patch);
    });
  }

  NB.crud = {
    load: load, update: update, find: find, list: list, flash: flash,
    dfmt: dfmt, rp: rp, today: today, badge: badge, timelineHtml: timelineHtml
  };

  NB.ready(function () {
    initConfirmInputs();
    initAssetList();
    initAssetForm();
    initAssetDetail();
    initUserList();
    initUserDetail();
    if (NB.qs('[data-crud-table="assets"]') || NB.qs("#asset-hero-title") || NB.qs("form[data-crud-form]")) {
      initDelete("assets", "modal-delete-asset", "assets-list.html");
    }
    if (NB.qs('[data-crud-table="users"]') || NB.qs("[data-user-profile]")) {
      initDelete("users", "modal-delete-user", "users-list.html");
    }
    initSessionBanner();
    showFlash();
  });
})();
