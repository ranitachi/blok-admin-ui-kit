/* ==========================================================================
   BLOK pages/notifications.js — pusat notifikasi.
   - Tandai dibaca/belum per item, "Tandai semua dibaca".
   - Filter (Semua, Belum dibaca, per kategori) lewat data-toggle-group.
   - Jumlah belum dibaca disinkronkan ke badge & popover topbar.
   Status hanya di DOM halaman ini (demo).
   Kelas item sengaja .nb-nitem (bukan .nb-notif) agar tidak ikut diproses
   handler [data-notif-mark-all] milik popover topbar di app.js.
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;
  // Urutan item popover topbar (lihat tools/sync-shell.py) = id notifikasi di halaman ini.
  var TOPBAR_IDS = ["n-01", "n-02", "n-04"];

  NB.ready(function () {
    var items = NB.qsa("[data-nitem]");
    if (!items.length) return;

    var unreadEl = NB.qs("[data-nunread]");
    var markAll = NB.qs("[data-nmark-all]");
    var status = NB.qs("[data-nstatus]");
    var empty = NB.qs("[data-nempty]");
    var emptyText = NB.qs("[data-nempty-text]");
    var filterGroup = NB.qs("[data-nfilter]");
    var filter = "semua";

    function textOf(item) {
      var t = NB.qs(".nb-nitem__text", item);
      var s = t ? t.textContent : "";
      var st = NB.qs("[data-nitem-state]", item);
      return st ? s.replace(st.textContent, "").trim() : s.trim();
    }
    function isUnread(item) {
      return item.classList.contains("is-unread");
    }

    function setRead(item, read) {
      item.classList.toggle("is-unread", !read);
      var st = NB.qs("[data-nitem-state]", item);
      if (st) st.textContent = read ? "Sudah dibaca. " : "Belum dibaca. ";
      var btn = NB.qs("[data-nitem-toggle]", item);
      if (btn) {
        var lbl = read ? "Tandai belum dibaca" : "Tandai dibaca";
        btn.textContent = lbl;
        btn.setAttribute("aria-label", lbl + ": " + textOf(item));
      }
    }

    function syncTopbar(count) {
      NB.qsa("[data-notif-count]").forEach(function (b) {
        b.textContent = String(count);
        b.hidden = count === 0;
      });
      NB.qsa("[data-notif-trigger]").forEach(function (t) {
        t.setAttribute("aria-label", count ? "Notifikasi, " + count + " belum dibaca" : "Notifikasi, tidak ada yang belum dibaca");
      });
      var pop = NB.qsa("#nb-notif-panel .nb-notif");
      TOPBAR_IDS.forEach(function (id, i) {
        var page = NB.qs('[data-nitem="' + id + '"]');
        var n = pop[i];
        if (!page || !n) return;
        var unread = isUnread(page);
        n.classList.toggle("is-unread", unread);
        var sr = NB.qs(".nb-notif__state", n);
        if (sr) sr.textContent = unread ? "Belum dibaca. " : "Sudah dibaca. ";
      });
      NB.qsa("[data-notif-mark-all]").forEach(function (b) {
        b.disabled = count === 0;
      });
    }

    function refresh() {
      var count = items.filter(isUnread).length;
      if (unreadEl) unreadEl.textContent = String(count);
      if (markAll) markAll.disabled = count === 0;
      syncTopbar(count);
      applyFilter();
      return count;
    }

    function matches(item) {
      if (filter === "semua") return true;
      if (filter === "unread") return isUnread(item);
      return item.getAttribute("data-cat") === filter;
    }

    function applyFilter() {
      var shown = 0;
      items.forEach(function (item) {
        item.hidden = !matches(item);
        if (!item.hidden) shown++;
      });
      NB.qsa("[data-ngroup]").forEach(function (g) {
        g.hidden = !NB.qsa("[data-nitem]", g).some(function (i) {
          return !i.hidden;
        });
      });
      if (empty) empty.hidden = shown > 0;
      if (emptyText) {
        emptyText.textContent =
          filter === "unread" ? "Semua notifikasi sudah dibaca." : "Tidak ada notifikasi pada kategori ini.";
      }
      return shown;
    }

    function say(msg) {
      if (status) status.textContent = msg;
    }

    document.addEventListener("click", function (e) {
      var toggle = e.target.closest("[data-nitem-toggle]");
      if (toggle) {
        var item = toggle.closest("[data-nitem]");
        var read = isUnread(item);
        setRead(item, read);
        var count = refresh();
        say((read ? "Ditandai dibaca. " : "Ditandai belum dibaca. ") + count + " belum dibaca.");
        // Bila item hilang karena filter "Belum dibaca", pindahkan fokus ke judul daftar.
        if (item.hidden) {
          var head = NB.qs("#nlist-title");
          if (head) {
            head.setAttribute("tabindex", "-1");
            head.focus();
          }
        }
        return;
      }
      // Tombol "Tandai semua" di popover topbar ikut menandai daftar halaman ini.
      if (e.target.closest("[data-notif-mark-all]")) {
        setTimeout(function () {
          items.forEach(function (i) {
            setRead(i, true);
          });
          refresh();
        }, 0);
      }
    });

    if (markAll)
      markAll.addEventListener("click", function () {
        var n = items.filter(isUnread).length;
        items.forEach(function (i) {
          setRead(i, true);
        });
        refresh();
        say("Semua notifikasi ditandai dibaca.");
        NB.toast({
          type: "success",
          title: n ? n + " notifikasi ditandai dibaca" : "Semua sudah dibaca",
          message: "Status baca hanya berlaku di halaman ini (demo)."
        });
        var head = NB.qs("#nlist-title");
        if (head) {
          head.setAttribute("tabindex", "-1");
          head.focus();
        }
      });

    if (filterGroup)
      filterGroup.addEventListener("nb:toggle-group", function (e) {
        filter = e.detail.value || "semua";
        var shown = applyFilter();
        say(shown + " notifikasi ditampilkan.");
      });

    var reset = NB.qs("[data-nfilter-reset]");
    if (reset)
      reset.addEventListener("click", function () {
        var all = filterGroup && NB.qs('[value="semua"]', filterGroup);
        if (all) all.click();
        else {
          filter = "semua";
          applyFilter();
        }
        if (all) all.focus();
      });

    NB.qsa("[data-npref] input").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var label = cb.closest("label");
        var name = label ? label.textContent.replace(/Aktif|Nonaktif/g, "").trim() : "Preferensi";
        NB.toast({
          type: "info",
          title: name + (cb.checked ? " diaktifkan" : " dinonaktifkan"),
          message: "Hanya tampilan, tidak disimpan (demo)."
        });
      });
    });

    refresh();
  });
})();
