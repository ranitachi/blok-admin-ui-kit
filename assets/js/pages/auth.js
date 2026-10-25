/* ==========================================================================
   BLOK auth.js — demo visual halaman autentikasi (tanpa server, tanpa
   penyimpanan kata sandi). Hook: [data-auth-form], [data-pw-meter].
   ========================================================================== */
(function () {
  "use strict";
  var NB = (window.NB = window.NB || {});
  var LEVELS = ["Lemah", "Lemah", "Sedang", "Kuat", "Sangat kuat"];

  /** Skor 0-4 berdasar aturan: panjang >= 8, huruf besar, angka, simbol. */
  function score(v) {
    var r = { len: v.length >= 8, upper: /[A-Z]/.test(v), num: /[0-9]/.test(v), sym: /[^A-Za-z0-9]/.test(v) };
    var n = (r.len ? 1 : 0) + (r.upper ? 1 : 0) + (r.num ? 1 : 0) + (r.sym ? 1 : 0);
    return { rules: r, n: n };
  }
  NB.passwordScore = score;

  function initMeters() {
    NB.qsa("[data-pw-meter]").forEach(function (m) {
      var input = document.getElementById(m.getAttribute("data-pw-meter"));
      var label = NB.qs("[data-pw-label]", m);
      if (!input || !label) return;
      var bars = NB.qsa(".nb-pwmeter__bar i", m);
      function update() {
        var s = score(input.value);
        m.setAttribute("data-level", input.value ? String(s.n) : "0");
        bars.forEach(function (b, i) {
          b.classList.toggle("is-on", input.value !== "" && i < s.n);
        });
        label.textContent = input.value ? LEVELS[s.n] : "Belum diisi";
        NB.qsa("[data-rule]", m).forEach(function (li) {
          var ok = !!s.rules[li.getAttribute("data-rule")];
          li.classList.toggle("is-met", ok);
          li.setAttribute("data-state", ok ? "Terpenuhi" : "Belum");
        });
      }
      input.addEventListener("input", update);
      var form = input.form;
      if (form) form.addEventListener("nb:form-reset", update);
      update();
    });
  }

  function showSuccess(form) {
    var box = NB.qs("[data-auth-success]", form.parentNode);
    if (!box) return;
    form.hidden = true;
    box.hidden = false;
    var h = NB.qs("[data-success-title]", box);
    if (h) h.focus();
  }

  function startCountdown(box) {
    var btn = NB.qs("[data-resend]", box);
    var count = NB.qs("[data-resend-count]", box);
    var status = NB.qs("[data-resend-status]", box);
    if (!btn || !count) return;
    var left = 30;
    btn.disabled = true;
    count.textContent = left + " detik";
    if (status) status.textContent = "Kirim ulang tersedia dalam 30 detik.";
    var t = setInterval(function () {
      left--;
      if (left <= 0) {
        clearInterval(t);
        btn.disabled = false;
        count.textContent = "";
        if (status) status.textContent = "Tombol kirim ulang sudah aktif.";
        return;
      }
      count.textContent = left + " detik";
    }, 1000);
    btn.onclick = function () {
      NB.toast({ type: "info", title: "Tautan dikirim ulang (demo)", message: "Tidak ada email nyata yang dikirim." });
      startCountdown(box);
    };
  }

  var TOASTS = {
    login: ["Masuk berhasil (demo)", "Tidak ada sesi login nyata."],
    register: ["Pendaftaran berhasil (demo)", "Tidak ada akun yang disimpan."],
    forgot: ["Tautan dikirim (demo)", "Tidak ada email nyata yang dikirim."],
    reset: ["Kata sandi diperbarui (demo)", "Tidak ada data yang disimpan."]
  };

  function initForms() {
    NB.qsa("[data-auth-form]").forEach(function (form) {
      var kind = form.getAttribute("data-auth-form");
      form.addEventListener("nb:valid-submit", function (e) {
        var email = String((e.detail.data.get("email") || "")).trim().toLowerCase();
        var locked = NB.qs("[data-locked-alert]");
        if (kind === "login" && email === "terkunci@example.com") {
          if (locked) {
            locked.hidden = false;
            locked.setAttribute("tabindex", "-1");
            locked.focus();
          }
          return;
        }
        if (locked) locked.hidden = true;
        showSuccess(form);
        var t = TOASTS[kind];
        if (t) NB.toast({ type: "success", title: t[0], message: t[1] });
        if (kind === "forgot") startCountdown(NB.qs("[data-auth-success]", form.parentNode));
        form.reset();
      });
    });
  }

  NB.ready(function () {
    initMeters();
    initForms();
  });
})();
