/* ==========================================================================
   BLOK pages/account.js — profil & pengaturan.
   Profil: simpan form memperbarui kartu ringkasan, ganti kata sandi, keluarkan sesi.
   Pengaturan: preferensi Tampilan langsung diterapkan lewat NB.display
   (sessionStorage tab ini); pengaturan lain hanya demo; zona berbahaya berkonfirmasi.
   ========================================================================== */
(function () {
  "use strict";

  var NB = window.NB;

  function initials(name) {
    var parts = name.trim().split(/\s+/);
    return ((parts[0] || "").charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase();
  }

  function initProfile() {
    var form = NB.qs("[data-pf-form]");
    if (form)
      form.addEventListener("nb:valid-submit", function (e) {
        var fd = e.detail.data;
        var name = String(fd.get("name") || "").trim();
        var set = function (sel, val) {
          var el = NB.qs(sel);
          if (el) el.textContent = val;
        };
        set("[data-pf-name]", name);
        set("[data-pf-avatar]", initials(name));
        set("[data-pf-unit]", String(fd.get("unit") || ""));
        set("[data-pf-email]", String(fd.get("email") || ""));
        // Nilai baru menjadi nilai bawaan form, sehingga "Batalkan perubahan" kembali ke sini.
        NB.qsa("input, textarea", form).forEach(function (f) {
          f.defaultValue = f.value;
        });
        NB.qsa("option", form).forEach(function (o) {
          o.defaultSelected = o.selected;
        });
        NB.toast({ type: "success", title: "Profil diperbarui", message: "Hanya di halaman ini; tidak disimpan ke server (demo)." });
      });

    var pw = NB.qs("[data-pw-form]");
    if (pw)
      pw.addEventListener("nb:valid-submit", function () {
        NB.forms.reset(pw);
        NB.toast({ type: "success", title: "Kata sandi diganti (demo)", message: "Tidak ada kata sandi yang dikirim atau disimpan." });
      });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-session-end]");
      if (!btn) return;
      var li = btn.closest("[data-session]");
      var list = li && li.parentNode;
      var title = NB.qs(".nb-list__title", li);
      var name = title ? title.textContent : "Perangkat";
      if (li) li.remove();
      // Fokus ke tombol "Keluarkan" berikutnya, atau ke judul kartu bila habis.
      var next = list && NB.qs("[data-session-end]", list);
      var head = NB.qs("#pf-sess-title");
      if (next) next.focus();
      else if (head) {
        head.setAttribute("tabindex", "-1");
        head.focus();
      }
      NB.toast({ type: "info", title: "Sesi dikeluarkan (demo)", message: name + " — kembali muncul saat halaman dimuat ulang." });
    });
  }

  function initSettings() {
    var form = NB.qs("[data-settings-form]");
    var display = NB.qs("[data-display]");
    if (!form) return;

    function readInputs() {
      var prefs = {};
      NB.qsa("[data-display-opt]", display || form).forEach(function (input) {
        if (input.type === "radio") {
          if (input.checked) prefs[input.name] = input.value;
        } else if (input.type === "checkbox") {
          prefs[input.name] = input.checked ? "reduce" : "default";
        }
      });
      return prefs;
    }

    function syncInputs(prefs) {
      NB.qsa("[data-display-opt]", display || form).forEach(function (input) {
        if (input.type === "radio") input.checked = prefs[input.name] === input.value;
        else if (input.type === "checkbox") input.checked = prefs[input.name] === "reduce";
        input.dispatchEvent(new Event("change", { bubbles: false }));
      });
    }

    var prefs = NB.display.get();
    syncInputs(prefs);

    if (display)
      display.addEventListener("change", function (e) {
        if (!e.target.hasAttribute("data-display-opt") || !e.isTrusted) return;
        NB.display.set(readInputs());
        NB.toast({ type: "info", title: "Tampilan diterapkan", message: "Tersimpan di sessionStorage tab ini (demo)." });
      });

    // "Batalkan" mengembalikan form, tetapi tampilan tetap mengikuti yang sudah diterapkan.
    form.addEventListener("reset", function () {
      setTimeout(function () {
        syncInputs(NB.display.get());
      }, 0);
    });

    form.addEventListener("nb:valid-submit", function () {
      NB.qsa("input, textarea", form).forEach(function (f) {
        f.defaultValue = f.value;
        if (f.type === "radio" || f.type === "checkbox") f.defaultChecked = f.checked;
      });
      NB.qsa("option", form).forEach(function (o) {
        o.defaultSelected = o.selected;
      });
      NB.toast({ type: "success", title: "Pengaturan disimpan (demo)", message: "Hanya tampilan yang bertahan selama tab terbuka." });
    });

    var reset = NB.qs("[data-display-reset]");
    if (reset)
      reset.addEventListener("click", function () {
        NB.display.clear();
        syncInputs(NB.display.get());
        NB.toast({ type: "info", title: "Tampilan bawaan dipulihkan", message: "Preferensi di sessionStorage dihapus." });
      });

    var wipe = NB.qs("[data-settings-wipe]");
    if (wipe)
      wipe.addEventListener("click", function () {
        NB.display.clear();
        NB.forms.reset(form);
        syncInputs(NB.display.get());
        NB.modal.close("modal-wipe");
        NB.toast({ type: "success", title: "Data demo dihapus", message: "sessionStorage dikosongkan dan form dikembalikan ke awal." });
      });
  }

  NB.ready(function () {
    initProfile();
    initSettings();
  });
})();
