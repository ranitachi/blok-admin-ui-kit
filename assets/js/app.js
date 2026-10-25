/* ==========================================================================
   BLOK app.js — inisialisasi bersama: sidebar, drawer mobile, menu aktif,
   pencarian halaman (quick nav), notifikasi, tanggal.
   Semua fitur dijaga: elemen yang tidak ada di halaman akan dilewati.
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});
  var DESKTOP_QUERY = "(min-width: 1024px)";
  var STORAGE_SIDEBAR = "nb.sidebar";

  /* ---- Utilitas ------------------------------------------------------ */
  NB.ready = function (fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  NB.qs = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  NB.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  NB.storage = {
    get: function (key) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        /* storage diblokir: abaikan, preferensi hanya berlaku sesi ini */
      }
    }
  };

  /* Preferensi tampilan dari halaman Pengaturan. Sengaja memakai sessionStorage:
     hanya bertahan selama tab terbuka (demo), lalu kembali ke bawaan. */
  var DISPLAY_KEY = "nb-display";
  var DISPLAY_ATTRS = { density: "data-density", textsize: "data-text", motion: "data-motion" };
  NB.display = {
    defaults: { density: "default", textsize: "default", motion: "default" },
    get: function () {
      var out = {};
      var saved = null;
      try {
        saved = JSON.parse(window.sessionStorage.getItem(DISPLAY_KEY) || "null");
      } catch (e) {
        saved = null;
      }
      Object.keys(NB.display.defaults).forEach(function (k) {
        out[k] = (saved && typeof saved[k] === "string" && saved[k]) || NB.display.defaults[k];
      });
      return out;
    },
    set: function (prefs) {
      try {
        window.sessionStorage.setItem(DISPLAY_KEY, JSON.stringify(prefs));
      } catch (e) {
        /* storage diblokir: tetap diterapkan untuk halaman ini saja */
      }
      NB.display.apply(prefs);
    },
    clear: function () {
      try {
        window.sessionStorage.removeItem(DISPLAY_KEY);
      } catch (e) {
        /* abaikan */
      }
      NB.display.apply(NB.display.defaults);
    },
    apply: function (prefs) {
      var root = document.documentElement;
      Object.keys(DISPLAY_ATTRS).forEach(function (k) {
        if (prefs[k] && prefs[k] !== "default") root.setAttribute(DISPLAY_ATTRS[k], prefs[k]);
        else root.removeAttribute(DISPLAY_ATTRS[k]);
      });
    }
  };
  NB.display.apply(NB.display.get());

  NB.escapeHtml = function (str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  NB.focus = {
    list: function (root) {
      return NB.qsa(FOCUSABLE, root).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });
    },
    /** Kunci Tab di dalam root. Kembalikan fungsi untuk melepas. */
    trap: function (root) {
      function onKey(e) {
        if (e.key !== "Tab") return;
        var items = NB.focus.list(root);
        if (!items.length) {
          e.preventDefault();
          return;
        }
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      root.addEventListener("keydown", onKey);
      return function () {
        root.removeEventListener("keydown", onKey);
      };
    }
  };

  NB.isDesktop = function () {
    return window.matchMedia(DESKTOP_QUERY).matches;
  };

  /* ---- Menu aktif ---------------------------------------------------- */
  function initActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    NB.qsa('[data-nav="' + page + '"]').forEach(function (link) {
      link.setAttribute("aria-current", "page");
      // Buka grup bertingkat yang memuat item aktif.
      var sub = link.closest(".nb-nav--sub");
      if (sub && sub.id) {
        sub.hidden = false;
        var toggle = NB.qs('[aria-controls="' + sub.id + '"]');
        if (toggle) toggle.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ---- Grup navigasi bertingkat ------------------------------------- */
  function initNavGroups() {
    NB.qsa("[data-nav-toggle]").forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute("aria-controls"));
      if (!target) return;
      btn.addEventListener("click", function () {
        var app = NB.qs(".nb-app");
        // Saat sidebar terciut di desktop, buka sidebar lebih dulu agar submenu terlihat.
        if (app && app.classList.contains("is-sidebar-collapsed") && NB.isDesktop()) {
          NB.sidebar.setCollapsed(false);
          target.hidden = false;
          btn.setAttribute("aria-expanded", "true");
          return;
        }
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        target.hidden = open;
      });
    });
  }

  /* ---- Sidebar & drawer --------------------------------------------- */
  NB.sidebar = (function () {
    var app, sidebar, toggles, overlay, releaseTrap, lastFocus;

    function labelToggles() {
      var desktop = NB.isDesktop();
      var collapsed = app.classList.contains("is-sidebar-collapsed");
      var drawerOpen = app.classList.contains("is-drawer-open");
      toggles.forEach(function (btn) {
        if (desktop) {
          btn.setAttribute("aria-expanded", String(!collapsed));
          btn.setAttribute("aria-label", collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar");
        } else {
          btn.setAttribute("aria-expanded", String(drawerOpen));
          btn.setAttribute("aria-label", drawerOpen ? "Tutup menu navigasi" : "Buka menu navigasi");
        }
        var use = btn.querySelector("use");
        if (use) use.setAttribute("href", desktop ? "#i-sidebar-collapse" : "#i-menu");
      });
      // Tooltip native untuk ikon saat terciut.
      NB.qsa(".nb-nav__link", sidebar).forEach(function (link) {
        var label = link.querySelector(".nb-nav__label");
        if (!label) return;
        if (desktop && collapsed) link.setAttribute("title", label.textContent.trim());
        else link.removeAttribute("title");
      });
    }

    function setCollapsed(collapsed) {
      app.classList.toggle("is-sidebar-collapsed", collapsed);
      NB.storage.set(STORAGE_SIDEBAR, collapsed ? "collapsed" : "expanded");
      labelToggles();
    }

    function openDrawer() {
      lastFocus = document.activeElement;
      app.classList.add("is-drawer-open");
      overlay.classList.add("is-visible");
      document.body.classList.add("nb-scroll-lock");
      labelToggles();
      releaseTrap = NB.focus.trap(sidebar);
      // Tunggu transisi visibilitas agar elemen bisa difokus.
      window.requestAnimationFrame(function () {
        var current = NB.qs('[aria-current="page"]', sidebar) || NB.focus.list(sidebar)[0];
        if (current) current.focus();
      });
    }

    function closeDrawer(restore) {
      if (!app.classList.contains("is-drawer-open")) return;
      app.classList.remove("is-drawer-open");
      overlay.classList.remove("is-visible");
      document.body.classList.remove("nb-scroll-lock");
      if (releaseTrap) releaseTrap();
      releaseTrap = null;
      labelToggles();
      if (restore !== false && lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    function init() {
      app = NB.qs(".nb-app");
      sidebar = NB.qs(".nb-sidebar");
      if (!app || !sidebar) return;
      toggles = NB.qsa("[data-sidebar-toggle]");

      overlay = NB.qs("[data-sidebar-overlay]");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "nb-overlay";
        overlay.setAttribute("data-sidebar-overlay", "");
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);
      }

      if (NB.storage.get(STORAGE_SIDEBAR) === "collapsed") {
        app.classList.add("is-sidebar-collapsed");
      }

      toggles.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (NB.isDesktop()) {
            setCollapsed(!app.classList.contains("is-sidebar-collapsed"));
          } else if (app.classList.contains("is-drawer-open")) {
            closeDrawer();
          } else {
            openDrawer();
          }
        });
      });

      NB.qsa("[data-sidebar-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          closeDrawer();
        });
      });

      overlay.addEventListener("click", function () {
        closeDrawer();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && app.classList.contains("is-drawer-open")) closeDrawer();
      });

      // Klik tautan di drawer: tutup tanpa mengembalikan fokus (halaman berpindah).
      sidebar.addEventListener("click", function (e) {
        if (e.target.closest("a[href]") && !NB.isDesktop()) closeDrawer(false);
      });

      var mq = window.matchMedia(DESKTOP_QUERY);
      var onChange = function () {
        if (mq.matches) closeDrawer(false);
        labelToggles();
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else mq.addListener(onChange);

      labelToggles();
    }

    return { init: init, setCollapsed: setCollapsed, open: openDrawer, close: closeDrawer };
  })();

  /* ---- Quick nav: cari halaman dari tautan sidebar ------------------ */
  function initQuickNav() {
    var root = NB.qs("[data-quicknav]");
    if (!root) return;
    var input = NB.qs("input", root);
    var list = NB.qs("[data-quicknav-results]", root);
    if (!input || !list) return;

    var index = NB.qsa(".nb-sidebar a.nb-nav__link[href]").map(function (a) {
      var group = a.closest(".nb-nav-group");
      var title = group ? NB.qs(".nb-nav-group__title", group) : null;
      var label = NB.qs(".nb-nav__label", a);
      return {
        label: (label ? label.textContent : a.textContent).trim(),
        group: title ? title.textContent.trim() : "",
        href: a.getAttribute("href")
      };
    });
    var results = [];
    var active = -1;

    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      active = -1;
    }

    function highlight(i) {
      var items = NB.qsa("[role=option]", list);
      items.forEach(function (el, n) {
        el.setAttribute("aria-selected", String(n === i));
      });
      active = i;
      if (items[i]) {
        input.setAttribute("aria-activedescendant", items[i].id);
        items[i].scrollIntoView({ block: "nearest" });
      }
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        close();
        return;
      }
      results = index.filter(function (item) {
        return (item.label + " " + item.group).toLowerCase().indexOf(q) !== -1;
      });
      if (!results.length) {
        list.innerHTML =
          '<li class="nb-search-results__empty" role="presentation">Tidak ada halaman yang cocok dengan “' +
          NB.escapeHtml(input.value.trim()) + "”.</li>";
      } else {
        list.innerHTML = results
          .map(function (item, i) {
            return (
              '<li role="presentation"><a class="nb-search-results__item" role="option" id="nb-qn-' + i +
              '" aria-selected="false" tabindex="-1" href="' + NB.escapeHtml(item.href) + '"><span>' +
              NB.escapeHtml(item.label) + "</span><small>" + NB.escapeHtml(item.group) + "</small></a></li>"
            );
          })
          .join("");
      }
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      active = -1;
      if (results.length) highlight(0);
    }

    input.addEventListener("input", render);
    input.addEventListener("focus", function () {
      if (input.value.trim()) render();
    });
    input.addEventListener("keydown", function (e) {
      var count = results.length;
      if (e.key === "ArrowDown" && count) {
        e.preventDefault();
        if (list.hidden) render();
        highlight((active + 1) % count);
      } else if (e.key === "ArrowUp" && count) {
        e.preventDefault();
        highlight((active - 1 + count) % count);
      } else if (e.key === "Enter") {
        if (active > -1 && results[active]) {
          e.preventDefault();
          window.location.href = results[active].href;
        }
      } else if (e.key === "Escape") {
        if (!list.hidden) {
          e.stopPropagation();
          close();
        } else {
          input.blur();
        }
      }
    });
    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) close();
    });

    // Pintasan "/" untuk fokus ke pencarian.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      var topbar = root.closest(".nb-topbar");
      if (topbar && !NB.isDesktop()) topbar.classList.add("is-search-open");
      input.focus();
    });

    // Tombol pencarian mobile.
    NB.qsa("[data-search-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var topbar = btn.closest(".nb-topbar");
        if (!topbar) return;
        var open = !topbar.classList.contains("is-search-open");
        topbar.classList.toggle("is-search-open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (open) input.focus();
        else close();
      });
    });
  }

  /* ---- Notifikasi: tandai dibaca (demo sesi) ------------------------ */
  function initNotifications() {
    NB.qsa("[data-notif-mark-all]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var unread = NB.qsa(".nb-notif.is-unread");
        unread.forEach(function (n) {
          n.classList.remove("is-unread");
          var sr = NB.qs(".nb-notif__state", n);
          if (sr) sr.textContent = "Sudah dibaca. ";
        });
        NB.qsa("[data-notif-count]").forEach(function (badge) {
          badge.hidden = true;
        });
        NB.qsa("[data-notif-trigger]").forEach(function (t) {
          t.setAttribute("aria-label", "Notifikasi, tidak ada yang belum dibaca");
        });
        btn.disabled = true;
        if (NB.toast) {
          NB.toast({
            type: "success",
            title: unread.length ? unread.length + " notifikasi ditandai dibaca" : "Semua sudah dibaca",
            message: "Status baca hanya berlaku di halaman ini (demo)."
          });
        }
      });
    });
  }

  /* ---- Tanggal hari ini --------------------------------------------- */
  function initToday() {
    var els = NB.qsa("[data-today]");
    if (!els.length) return;
    var now = new Date();
    var text;
    try {
      text = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      text = now.toDateString();
    }
    els.forEach(function (el) {
      el.textContent = text;
      el.setAttribute("datetime", now.toISOString().slice(0, 10));
    });
  }

  /* ---- Cetak halaman ------------------------------------------------- */
  function initPrint() {
    NB.qsa("[data-print]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.print();
      });
    });
  }

  NB.ready(function () {
    initActiveNav();
    initPrint();
    NB.sidebar.init();
    initNavGroups();
    initQuickNav();
    initNotifications();
    initToday();
    window.requestAnimationFrame(function () {
      document.documentElement.classList.remove("nb-preload");
    });
  });
})();
