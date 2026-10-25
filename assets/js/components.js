/* ==========================================================================
   BLOK components.js — dropdown/popover, modal & drawer, tabs, accordion,
   toast, tooltip, alert dismiss, salin snippet, demo tombol (loading/pressed).
   Hook deklaratif lewat atribut data-*; aman bila elemen tidak ada.
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});

  /* ---- Toast --------------------------------------------------------- */
  var TOAST_ICONS = { success: "check", info: "info", warning: "alert", danger: "octagon" };

  function toastStack() {
    var stack = document.querySelector(".nb-toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "nb-toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  /**
   * Tampilkan toast.
   * @param {{title?:string, message?:string, type?:"success"|"info"|"warning"|"danger", timeout?:number}} opts
   */
  NB.toast = function (opts) {
    opts = typeof opts === "string" ? { message: opts } : opts || {};
    var type = TOAST_ICONS[opts.type] ? opts.type : "info";
    var el = document.createElement("div");
    el.className = "nb-toast nb-toast--" + type;
    el.innerHTML =
      '<span class="nb-toast__icon">' + NB.icons.svg(TOAST_ICONS[type]) + "</span>" +
      "<div>" +
      (opts.title ? '<p class="nb-toast__title">' + NB.escapeHtml(opts.title) + "</p>" : "") +
      (opts.message ? '<p class="nb-toast__msg">' + NB.escapeHtml(opts.message) + "</p>" : "") +
      "</div>" +
      '<button type="button" class="nb-icon-btn nb-icon-btn--plain nb-toast__close" aria-label="Tutup notifikasi">' +
      NB.icons.svg("x", "nb-icon--sm") + "</button>";

    var timer;
    function dismiss() {
      clearTimeout(timer);
      el.classList.add("is-leaving");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 180);
    }
    el.querySelector(".nb-toast__close").addEventListener("click", dismiss);
    el.addEventListener("mouseenter", function () {
      clearTimeout(timer);
    });
    el.addEventListener("mouseleave", function () {
      timer = setTimeout(dismiss, 2500);
    });

    var stack = toastStack();
    stack.appendChild(el);
    while (stack.children.length > 4) stack.removeChild(stack.firstElementChild);
    var timeout = opts.timeout === undefined ? 5000 : opts.timeout;
    if (timeout > 0) timer = setTimeout(dismiss, timeout);
    return { dismiss: dismiss };
  };

  function initToastTriggers() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-toast]");
      if (!btn) return;
      if (btn.tagName === "A") e.preventDefault();
      NB.toast({
        type: btn.getAttribute("data-toast-type") || "info",
        title: btn.getAttribute("data-toast") || "",
        message: btn.getAttribute("data-toast-message") || ""
      });
    });
  }

  /* ---- Dropdown & popover ------------------------------------------- */
  var openDropdown = null;

  function closeDropdown(restoreFocus) {
    if (!openDropdown) return;
    var d = openDropdown;
    openDropdown = null;
    d.panel.hidden = true;
    d.trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) d.trigger.focus();
  }

  function menuItems(panel) {
    return NB.qsa('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])', panel);
  }

  function initDropdowns() {
    NB.qsa("[data-dropdown]").forEach(function (root) {
      var trigger = NB.qs("[data-dropdown-trigger]", root);
      var panel = trigger && document.getElementById(trigger.getAttribute("aria-controls"));
      if (!trigger || !panel) return;
      var isMenu = panel.getAttribute("role") === "menu";
      var state = { root: root, trigger: trigger, panel: panel };

      function open(focusLast) {
        if (openDropdown && openDropdown !== state) closeDropdown(false);
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        openDropdown = state;
        if (isMenu) {
          var items = menuItems(panel);
          var target = focusLast ? items[items.length - 1] : items[0];
          if (target) target.focus();
        } else {
          var focusTarget = NB.qs("[data-autofocus]", panel) || panel;
          focusTarget.focus();
        }
      }

      trigger.addEventListener("click", function () {
        if (openDropdown === state) closeDropdown(false);
        else open(false);
      });

      trigger.addEventListener("keydown", function (e) {
        if (!isMenu) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          open(e.key === "ArrowUp");
        }
      });

      panel.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.stopPropagation();
          closeDropdown(true);
          return;
        }
        if (e.key === "Tab") {
          // Keluar dari panel dengan Tab menutupnya.
          setTimeout(function () {
            if (openDropdown === state && !root.contains(document.activeElement)) closeDropdown(false);
          }, 0);
          return;
        }
        if (!isMenu) return;
        var items = menuItems(panel);
        var i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          items[(i + 1) % items.length].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          items[(i - 1 + items.length) % items.length].focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          items[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          items[items.length - 1].focus();
        }
      });

      if (isMenu) {
        panel.addEventListener("click", function (e) {
          if (e.target.closest('[role="menuitem"]')) closeDropdown(false);
        });
      }
    });

    document.addEventListener("click", function (e) {
      if (openDropdown && !openDropdown.root.contains(e.target)) closeDropdown(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && openDropdown) closeDropdown(true);
    });
  }

  /* ---- Modal --------------------------------------------------------- */
  var modalStack = [];

  NB.modal = {
    open: function (id, opener) {
      var modal = document.getElementById(id);
      if (!modal || !modal.hidden) return;
      closeDropdown(false);
      var dialog = NB.qs('[role="dialog"], [role="alertdialog"]', modal) || modal;
      var entry = {
        modal: modal,
        opener: opener || document.activeElement,
        release: NB.focus.trap(modal)
      };
      modalStack.push(entry);
      modal.hidden = false;
      document.body.classList.add("nb-scroll-lock");
      var first = NB.qs("[data-autofocus]", modal) || NB.focus.list(dialog)[0] || dialog;
      first.focus();
      modal.dispatchEvent(new CustomEvent("nb:modal-open", { bubbles: true }));
    },
    close: function (id) {
      var idx = -1;
      for (var i = modalStack.length - 1; i >= 0; i--) {
        if (!id || modalStack[i].modal.id === id) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return;
      var entry = modalStack.splice(idx, 1)[0];
      entry.modal.hidden = true;
      entry.release();
      if (!modalStack.length) document.body.classList.remove("nb-scroll-lock");
      if (entry.opener && typeof entry.opener.focus === "function") entry.opener.focus();
      entry.modal.dispatchEvent(new CustomEvent("nb:modal-close", { bubbles: true }));
    }
  };

  function initModals() {
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-modal-open]");
      if (opener) {
        e.preventDefault();
        NB.modal.open(opener.getAttribute("data-modal-open"), opener);
        return;
      }
      var closer = e.target.closest("[data-modal-close]");
      if (closer) {
        var m = closer.closest(".nb-modal");
        if (m) NB.modal.close(m.id);
        return;
      }
      // Klik backdrop (area di luar dialog).
      if (e.target.classList && e.target.classList.contains("nb-modal") && !e.target.hasAttribute("data-static")) {
        NB.modal.close(e.target.id);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalStack.length) {
        var top = modalStack[modalStack.length - 1].modal;
        if (!top.hasAttribute("data-static")) NB.modal.close(top.id);
      }
    });
  }

  /* ---- Tabs ---------------------------------------------------------- */
  function initTabs() {
    NB.qsa("[data-tabs]").forEach(function (root) {
      var tabs = NB.qsa('[role="tab"]', root);
      if (!tabs.length) return;

      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.setAttribute("tabindex", on ? "0" : "-1");
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () {
          select(tab, false);
        });
        tab.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
          else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === "Home") next = tabs[0];
          else if (e.key === "End") next = tabs[tabs.length - 1];
          if (next) {
            e.preventDefault();
            select(next, true);
          }
        });
      });

      select(
        tabs.filter(function (t) {
          return t.getAttribute("aria-selected") === "true";
        })[0] || tabs[0],
        false
      );
    });
  }

  /* ---- Accordion ----------------------------------------------------- */
  function initAccordions() {
    NB.qsa("[data-accordion-trigger]").forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      panel.hidden = btn.getAttribute("aria-expanded") !== "true";
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        var group = btn.closest("[data-accordion-single]");
        if (group && !open) {
          NB.qsa("[data-accordion-trigger]", group).forEach(function (other) {
            if (other === btn) return;
            other.setAttribute("aria-expanded", "false");
            var p = document.getElementById(other.getAttribute("aria-controls"));
            if (p) p.hidden = true;
          });
        }
        btn.setAttribute("aria-expanded", String(!open));
        panel.hidden = open;
      });
    });
  }


  /* ---- Tooltip ------------------------------------------------------- */
  // <span class="nb-tooltip-wrap"><button aria-describedby="tip-x">…</button>
  //   <span class="nb-tooltip" role="tooltip" id="tip-x" hidden>Teks</span></span>
  function initTooltips() {
    NB.qsa(".nb-tooltip-wrap").forEach(function (wrap) {
      var tip = NB.qs('[role="tooltip"]', wrap);
      if (!tip) return;
      tip.hidden = true;
      function show() {
        tip.hidden = false;
      }
      function hide() {
        tip.hidden = true;
      }
      wrap.addEventListener("mouseenter", show);
      wrap.addEventListener("mouseleave", function () {
        if (!wrap.contains(document.activeElement)) hide();
      });
      wrap.addEventListener("focusin", show);
      wrap.addEventListener("focusout", function (e) {
        if (!wrap.contains(e.relatedTarget)) hide();
      });
      wrap.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !tip.hidden) {
          e.stopPropagation();
          hide();
        }
      });
    });
    // Esc menutup tooltip yang terbuka karena hover juga.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      NB.qsa('.nb-tooltip-wrap [role="tooltip"]:not([hidden])').forEach(function (tip) {
        tip.hidden = true;
      });
    });
  }

  /* ---- Alert yang bisa ditutup -------------------------------------- */
  function initDismiss() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-dismiss]");
      if (btn) {
        var id = btn.getAttribute("data-dismiss");
        var box = (id && document.getElementById(id)) || btn.closest(".nb-alert");
        if (!box) return;
        box.hidden = true;
        var focusTarget = document.getElementById(btn.getAttribute("data-dismiss-focus") || "");
        if (focusTarget) {
          if (!focusTarget.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(focusTarget.tagName)) {
            focusTarget.setAttribute("tabindex", "-1");
          }
          focusTarget.focus();
        }
        box.dispatchEvent(new CustomEvent("nb:dismiss", { bubbles: true }));
        return;
      }
      var restore = e.target.closest("[data-undismiss]");
      if (restore) {
        restore
          .getAttribute("data-undismiss")
          .split(/\s+/)
          .forEach(function (rid) {
            var el = document.getElementById(rid);
            if (el) el.hidden = false;
          });
      }
    });
  }

  /* ---- Salin snippet kode ------------------------------------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }
  NB.copyText = copyText;

  function initCopy() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-copy]");
      if (!btn) return;
      var id = btn.getAttribute("data-copy");
      var src = (id && document.getElementById(id)) || NB.qs("code", btn.closest(".nb-demo__code") || document);
      if (!src) return;
      var label = NB.qs("[data-copy-label]", btn);
      copyText(src.textContent).then(
        function () {
          if (label) {
            label.textContent = "Disalin";
            setTimeout(function () {
              label.textContent = "Salin";
            }, 1600);
          }
          NB.toast({ type: "success", title: "Kode disalin", message: "Snippet HTML ada di clipboard.", timeout: 2500 });
        },
        function () {
          NB.toast({ type: "warning", title: "Tidak dapat menyalin", message: "Pilih teks kode lalu tekan Ctrl/Cmd + C." });
        }
      );
    });
  }

  /* ---- Demo tombol: loading, pressed, grup pilihan ------------------ */
  function initButtonDemos() {
    document.addEventListener("click", function (e) {
      var load = e.target.closest("[data-loading-demo]");
      if (load && !load.classList.contains("is-loading")) {
        var original = load.getAttribute("aria-label");
        load.classList.add("is-loading");
        load.setAttribute("aria-busy", "true");
        load.setAttribute("aria-label", "Memproses…");
        setTimeout(function () {
          load.classList.remove("is-loading");
          load.removeAttribute("aria-busy");
          if (original) load.setAttribute("aria-label", original);
          else load.removeAttribute("aria-label");
          NB.toast({ type: "success", title: "Selesai (demo)", message: "Proses disimulasikan selama 1,5 detik — tidak ada data yang dikirim." });
        }, 1500);
        return;
      }
      var press = e.target.closest("[data-toggle-pressed]");
      if (press) {
        press.setAttribute("aria-pressed", String(press.getAttribute("aria-pressed") !== "true"));
        return;
      }
      var opt = e.target.closest("[data-toggle-group] > [aria-pressed]");
      if (opt) {
        NB.qsa("[aria-pressed]", opt.parentNode).forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === opt));
        });
        opt.parentNode.dispatchEvent(new CustomEvent("nb:toggle-group", { bubbles: true, detail: { value: opt.value || opt.getAttribute("data-value") } }));
        return;
      }
      var demo = e.target.closest("[data-demo-collapse]");
      if (demo) {
        var target = document.getElementById(demo.getAttribute("aria-controls"));
        if (!target) return;
        var expanded = demo.getAttribute("aria-expanded") === "true";
        demo.setAttribute("aria-expanded", String(!expanded));
        target.classList.toggle("nb-sidenav-demo--collapsed", expanded);
        var text = NB.qs("[data-demo-collapse-label]", demo);
        if (text) text.textContent = expanded ? "Lebarkan" : "Ciutkan";
      }
    });
  }

  NB.ready(function () {
    initToastTriggers();
    initDropdowns();
    initModals();
    initTabs();
    initAccordions();
    initTooltips();
    initDismiss();
    initCopy();
    initButtonDemos();
  });
})();
