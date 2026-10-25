/* ==========================================================================
   BLOK forms.js — validasi demo (tanpa pengiriman ke server), password
   reveal, grup radio, rentang tanggal, wizard, peringatan perubahan belum
   disimpan, dropzone + pratinjau file, combobox, range, switch, penghitung
   karakter.
   <form data-validate novalidate> ... </form>
   Form valid memicu event "nb:valid-submit" dengan detail { form, data }.
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});
  var uid = 0;

  function labelText(label) {
    var clone = label.cloneNode(true);
    NB.qsa(".nb-req, .nb-sr-only", clone).forEach(function (n) {
      n.remove();
    });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function fieldLabel(input) {
    if (input.type === "radio" || input.getAttribute("data-group")) {
      var fs = input.closest("fieldset");
      var legend = fs && NB.qs("legend", fs);
      if (legend) return labelText(legend);
    }
    var label = input.id && document.querySelector('label[for="' + input.id + '"]');
    if (!label) label = input.closest("label");
    if (!label) return input.getAttribute("aria-label") || "Kolom ini";
    return labelText(label);
  }

  function messageFor(input) {
    var v = input.validity;
    var name = fieldLabel(input);
    if (v.valueMissing) {
      if (input.type === "checkbox" && !input.getAttribute("data-group")) {
        return input.getAttribute("data-required-message") || name + " wajib dicentang.";
      }
      if (input.type === "file") return name + " wajib dilampirkan.";
      return input.tagName === "SELECT" || input.type === "radio" || input.type === "checkbox"
        ? name + " wajib dipilih."
        : name + " wajib diisi.";
    }
    if (v.typeMismatch && input.type === "email") return "Masukkan alamat email yang valid, mis. nama@contoh.id.";
    if (v.typeMismatch && input.type === "url") return "Masukkan URL lengkap, mis. https://contoh.id.";
    if (v.tooShort) return name + " minimal " + input.minLength + " karakter (saat ini " + input.value.length + ").";
    if (v.tooLong) return name + " maksimal " + input.maxLength + " karakter.";
    if (v.rangeUnderflow) return name + " minimal " + input.min + ".";
    if (v.rangeOverflow) return name + " maksimal " + input.max + ".";
    if (v.stepMismatch) return name + " harus kelipatan " + input.step + ".";
    if (v.patternMismatch) return input.getAttribute("data-pattern-message") || name + " tidak sesuai format.";
    if (v.badInput) return name + " berisi nilai yang tidak valid.";
    if (v.customError) return input.validationMessage;
    return "";
  }

  /** Radio dan checkbox ber-data-group berbagi satu pesan error per grup (di fieldset). */
  function groupMembers(input) {
    if (input.type === "radio" && input.name) {
      var scope = input.form || document;
      return NB.qsa('input[type="radio"][name="' + input.name + '"]', scope);
    }
    var g = input.getAttribute("data-group");
    if (g) return NB.qsa('input[data-group="' + g + '"]', input.form || document);
    return null;
  }

  function errorEl(input) {
    var id = input.getAttribute("data-error-id");
    var el = id && document.getElementById(id);
    if (el) return el;
    var members = groupMembers(input);
    el = document.createElement("p");
    el.className = "nb-error";
    el.id = "nb-err-" + ++uid;
    el.hidden = true;
    var host = members ? input.closest("fieldset") || input.closest(".nb-field") : input.closest(".nb-field");
    (host || input.parentNode).appendChild(el);
    (members || [input]).forEach(function (m) {
      m.setAttribute("data-error-id", el.id);
      var described = (m.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      described.push(el.id);
      m.setAttribute("aria-describedby", described.join(" "));
    });
    return el;
  }

  function applyCustomRules(input) {
    if (!input.setCustomValidity) return;
    var msg = "";
    var afterId = input.getAttribute("data-date-after");
    if (afterId) {
      var start = document.getElementById(afterId);
      if (start && start.value && input.value && input.value < start.value) {
        msg =
          input.getAttribute("data-date-after-message") ||
          fieldLabel(input) + " tidak boleh sebelum " + fieldLabel(start).toLowerCase() + ".";
      }
    }
    var matchId = input.getAttribute("data-match");
    if (matchId) {
      var other = document.getElementById(matchId);
      if (other && input.value && input.value !== other.value) msg = input.getAttribute("data-match-message") || "Nilai tidak sama.";
    }
    var g = input.getAttribute("data-group");
    if (g && input.hasAttribute("data-group-min")) {
      var checked = groupMembers(input).filter(function (m) {
        return m.checked;
      }).length;
      var min = +input.getAttribute("data-group-min");
      if (checked < min) msg = "Pilih minimal " + min + " opsi pada " + fieldLabel(input).toLowerCase() + ".";
    }
    if (input.hasAttribute("data-combobox-input")) {
      var combo = input.closest("[data-combobox]");
      var hidden = combo && NB.qs("[data-combobox-value]", combo);
      if (hidden && input.value && !hidden.value) msg = "Pilih salah satu opsi dari daftar.";
    }
    input.setCustomValidity(msg);
  }

  function validateField(input) {
    if (input.disabled || !input.willValidate) return true;
    applyCustomRules(input);
    var members = groupMembers(input);
    var msg = messageFor(input);
    var el = errorEl(input);
    var targets = members || [input];
    var fs = members && input.closest("fieldset");
    if (msg) {
      targets.forEach(function (m) {
        m.setAttribute("aria-invalid", "true");
      });
      if (fs) fs.classList.add("is-invalid");
      el.textContent = msg;
      el.hidden = false;
      return false;
    }
    targets.forEach(function (m) {
      m.removeAttribute("aria-invalid");
    });
    if (fs) fs.classList.remove("is-invalid");
    el.textContent = "";
    el.hidden = true;
    return true;
  }

  function validatable(root) {
    var seen = {};
    return NB.qsa("input, select, textarea", root).filter(function (f) {
      if (f.type === "submit" || f.type === "button" || f.type === "reset" || f.type === "hidden") return false;
      var key = f.type === "radio" ? "r:" + f.name : f.getAttribute("data-group") ? "g:" + f.getAttribute("data-group") : null;
      if (key) {
        if (seen[key]) return false;
        seen[key] = true;
      }
      return true;
    });
  }

  NB.forms = {
    validateField: validateField,
    /** Validasi semua kolom di root (form atau langkah wizard). Kembalikan kolom invalid pertama. */
    validate: function (root) {
      var firstInvalid = null;
      validatable(root).forEach(function (f) {
        if (!validateField(f) && !firstInvalid) firstInvalid = f;
      });
      return firstInvalid;
    },
    reset: function (form) {
      form.__nbResetting = true;
      form.reset();
      form.__nbResetting = false;
      form.removeAttribute("data-submitted");
      NB.qsa("[aria-invalid]", form).forEach(function (f) {
        f.removeAttribute("aria-invalid");
      });
      NB.qsa(".is-invalid", form).forEach(function (f) {
        f.classList.remove("is-invalid");
      });
      NB.qsa(".nb-error", form).forEach(function (el) {
        el.hidden = true;
        el.textContent = "";
      });
      form.dispatchEvent(new CustomEvent("nb:form-reset", { bubbles: true }));
    }
  };

  function initValidation() {
    NB.qsa("form[data-validate]").forEach(function (form) {
      form.setAttribute("novalidate", "");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        form.setAttribute("data-submitted", "");
        var firstInvalid = NB.forms.validate(form);
        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }
        form.dispatchEvent(
          new CustomEvent("nb:valid-submit", { bubbles: true, detail: { form: form, data: new FormData(form) } })
        );
      });

      // Validasi ulang secara langsung setelah percobaan submit pertama.
      ["input", "change"].forEach(function (type) {
        form.addEventListener(type, function (e) {
          var t = e.target;
          if (!t.willValidate) return;
          var step = t.closest("[data-wizard-step]");
          var touched = form.hasAttribute("data-submitted") || (step && step.hasAttribute("data-attempted"));
          if (touched || t.getAttribute("aria-invalid") === "true") validateField(t);
          // Kolom lain yang bergantung pada kolom ini (rentang tanggal, konfirmasi).
          if (t.id) {
            NB.qsa('[data-date-after="' + t.id + '"], [data-match="' + t.id + '"]', form).forEach(function (dep) {
              if (dep.value) validateField(dep);
            });
          }
        });
      });
      // Tombol type="reset" biasa: bersihkan juga pesan error dan kabari komponen
      // (combobox, dropzone, wizard) lewat nb:form-reset — sama seperti NB.forms.reset().
      form.addEventListener("reset", function () {
        if (form.__nbResetting) return;
        setTimeout(function () {
          NB.forms.reset(form);
        }, 0);
      });
      form.addEventListener(
        "blur",
        function (e) {
          var t = e.target;
          if (t.willValidate && t.value !== "" && t.type !== "radio" && t.type !== "checkbox" && t.type !== "file") {
            validateField(t);
          }
        },
        true
      );
    });
  }

  function initPasswordToggles() {
    NB.qsa("[data-password-toggle]").forEach(function (btn) {
      var input = document.getElementById(btn.getAttribute("aria-controls"));
      if (!input) return;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-pressed", String(show));
        btn.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
      });
    });
  }

  /* ---- Wizard multi-langkah ----------------------------------------- */
  function valueText(form, field) {
    if (field.type === "radio") {
      var c = NB.qs('input[name="' + field.name + '"]:checked', form);
      if (!c) return "—";
      var l = c.closest("label");
      return l ? labelText(l) : c.value;
    }
    if (field.type === "checkbox") return field.checked ? "Ya" : "Tidak";
    if (field.tagName === "SELECT") {
      var opt = field.options[field.selectedIndex];
      return opt && field.value ? opt.text : "—";
    }
    if (field.type === "file") {
      return field.files && field.files.length
        ? Array.prototype.map.call(field.files, function (f) { return f.name; }).join(", ")
        : "—";
    }
    return field.value.trim() || "—";
  }

  function initWizards() {
    NB.qsa("[data-wizard]").forEach(function (form) {
      var steps = NB.qsa("[data-wizard-step]", form);
      var markers = NB.qsa("[data-wizard-steps] > li", form);
      var prev = NB.qs("[data-wizard-prev]", form);
      var next = NB.qs("[data-wizard-next]", form);
      var submit = NB.qs("[data-wizard-submit]", form);
      var counter = NB.qs("[data-wizard-counter]", form);
      if (!steps.length || !next) return;
      var current = 0;

      function renderSummary(step) {
        var out = NB.qs("[data-wizard-summary]", step);
        if (!out) return;
        var seen = {};
        var html = "";
        steps.forEach(function (s) {
          if (s === step) return;
          NB.qsa("input[name], select[name], textarea[name]", s).forEach(function (f) {
            if (seen[f.name] || f.type === "hidden") return;
            seen[f.name] = true;
            html +=
              "<dt>" + NB.escapeHtml(fieldLabel(f)) + "</dt><dd>" + NB.escapeHtml(valueText(form, f)) + "</dd>";
          });
        });
        out.innerHTML = html;
      }

      function show(i, focus) {
        current = i;
        steps.forEach(function (s, n) {
          s.hidden = n !== i;
        });
        markers.forEach(function (m, n) {
          m.classList.toggle("is-done", n < i);
          if (n === i) m.setAttribute("aria-current", "step");
          else m.removeAttribute("aria-current");
        });
        if (prev) prev.disabled = i === 0;
        var last = i === steps.length - 1;
        next.hidden = last;
        if (submit) submit.hidden = !last;
        if (counter) counter.textContent = "Langkah " + (i + 1) + " dari " + steps.length;
        if (last) renderSummary(steps[i]);
        if (focus) {
          var heading = NB.qs("[data-wizard-heading]", steps[i]) || steps[i];
          if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
      }

      next.addEventListener("click", function () {
        var step = steps[current];
        step.setAttribute("data-attempted", "");
        var bad = NB.forms.validate(step);
        if (bad) {
          bad.focus();
          return;
        }
        show(Math.min(current + 1, steps.length - 1), true);
      });
      if (prev) {
        prev.addEventListener("click", function () {
          show(Math.max(current - 1, 0), true);
        });
      }
      form.addEventListener("nb:form-reset", function () {
        steps.forEach(function (s) {
          s.removeAttribute("data-attempted");
        });
        show(0, false);
      });
      show(0, false);
    });
  }

  /* ---- Peringatan perubahan belum disimpan -------------------------- */
  function initDirtyWarning() {
    var forms = NB.qsa("form[data-dirty-warn]");
    if (!forms.length) return;

    function setDirty(form, dirty) {
      if (dirty) form.setAttribute("data-dirty", "");
      else form.removeAttribute("data-dirty");
      var flagId = form.getAttribute("data-dirty-warn");
      var flag = (flagId && document.getElementById(flagId)) || NB.qs("[data-dirty-flag]", form);
      if (flag) flag.hidden = !dirty;
    }

    forms.forEach(function (form) {
      form.addEventListener("input", function () {
        setDirty(form, true);
      });
      form.addEventListener("change", function () {
        setDirty(form, true);
      });
      form.addEventListener("nb:valid-submit", function () {
        setDirty(form, false);
      });
      form.addEventListener("nb:form-reset", function () {
        setDirty(form, false);
      });
      form.addEventListener("reset", function () {
        setTimeout(function () {
          setDirty(form, false);
        }, 0);
      });
    });

    window.addEventListener("beforeunload", function (e) {
      if (!NB.qs("form[data-dirty]")) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  /* ---- Dropzone & pratinjau file ------------------------------------ */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace(".", ",") + " KB";
    return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
  }

  var FILE_COLORS = { PDF: "pink", PNG: "mint", JPG: "mint", JPEG: "mint", SVG: "mint", CSV: "yellow", XLSX: "yellow", DOCX: "blue" };

  function initDropzones() {
    NB.qsa("[data-dropzone]").forEach(function (zone) {
      var input = NB.qs('input[type="file"]', zone);
      var list = document.getElementById(zone.getAttribute("data-dropzone"));
      var status = document.getElementById(zone.getAttribute("data-dropzone-status"));
      if (!input || !list) return;
      var maxMb = parseFloat(zone.getAttribute("data-max-size") || "5");
      var simulate = zone.hasAttribute("data-simulate-upload");
      var files = [];
      var urls = [];
      var internal = false;

      function announce(msg) {
        if (status) status.textContent = msg;
      }

      function syncInput() {
        try {
          var dt = new DataTransfer();
          files.forEach(function (f) {
            dt.items.add(f);
          });
          input.files = dt.files;
        } catch (err) {
          /* Browser lama: daftar tampilan tetap diperbarui. */
        }
      }

      function render() {
        urls.forEach(function (u) {
          URL.revokeObjectURL(u);
        });
        urls = [];
        list.innerHTML = "";
        files.forEach(function (f, i) {
          var ext = (f.name.split(".").pop() || "").toUpperCase().slice(0, 4);
          var li = document.createElement("li");
          li.className = "nb-file";
          var icon = document.createElement("span");
          icon.className = "nb-file__icon";
          icon.setAttribute("aria-hidden", "true");
          icon.style.setProperty("--file-bg", "var(--color-" + (FILE_COLORS[ext] || "blue") + ")");
          if (/^image\//.test(f.type)) {
            var url = URL.createObjectURL(f);
            urls.push(url);
            icon.style.backgroundImage = "url(" + url + ")";
            icon.style.backgroundSize = "cover";
            icon.style.backgroundPosition = "center";
          } else {
            icon.textContent = ext || "FILE";
          }
          li.appendChild(icon);
          var main = document.createElement("div");
          main.className = "nb-file__main";
          main.innerHTML =
            '<span class="nb-file__name">' + NB.escapeHtml(f.name) + "</span>" +
            '<span class="nb-file__meta">' + formatSize(f.size) + (simulate ? ' · <span data-upload-state>Menyiapkan…</span>' : "") + "</span>" +
            (simulate
              ? '<div class="nb-progress nb-progress--thin" role="progressbar" aria-label="Progres unggah ' +
                NB.escapeHtml(f.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="nb-progress__bar" style="--value: 0%; --progress-color: var(--color-sage-strong)"></div></div>'
              : "");
          li.appendChild(main);
          var rm = document.createElement("button");
          rm.type = "button";
          rm.className = "nb-icon-btn nb-icon-btn--plain";
          rm.setAttribute("aria-label", "Hapus " + f.name);
          rm.innerHTML = NB.icons.svg("x", "nb-icon--sm");
          rm.addEventListener("click", function () {
            files.splice(i, 1);
            syncInput();
            render();
            announce(f.name + " dihapus dari daftar.");
            input.focus();
            internal = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            internal = false;
          });
          li.appendChild(rm);
          list.appendChild(li);
          if (simulate) fakeUpload(li, f);
        });
      }

      function fakeUpload(li, f) {
        var bar = NB.qs(".nb-progress", li);
        var label = NB.qs("[data-upload-state]", li);
        var pct = 0;
        var timer = setInterval(function () {
          if (!li.isConnected) return clearInterval(timer);
          pct = Math.min(100, pct + 12 + Math.round(Math.random() * 14));
          bar.setAttribute("aria-valuenow", String(pct));
          bar.firstElementChild.style.setProperty("--value", pct + "%");
          label.textContent = pct < 100 ? "Mengunggah " + pct + "%" : "Selesai (demo — tidak dikirim ke server)";
          if (pct >= 100) {
            clearInterval(timer);
            announce(f.name + " selesai diproses (simulasi).");
          }
        }, 220);
      }

      input.addEventListener("change", function (e) {
        if (internal) return; // perubahan dari tombol hapus, bukan pilihan baru
        var picked = Array.prototype.slice.call(input.files || []);
        var rejected = [];
        var accepted = picked.filter(function (f) {
          if (f.size > maxMb * 1024 * 1024) {
            rejected.push(f.name);
            return false;
          }
          return true;
        });
        files = input.multiple ? files.concat(accepted) : accepted.slice(0, 1);
        syncInput();
        render();
        var msg = accepted.length + " file dipilih.";
        if (rejected.length) msg += " Ditolak (lebih dari " + maxMb + " MB): " + rejected.join(", ") + ".";
        announce(msg);
      });

      ["dragenter", "dragover"].forEach(function (t) {
        zone.addEventListener(t, function () {
          zone.classList.add("is-dragover");
        });
      });
      ["dragleave", "drop"].forEach(function (t) {
        zone.addEventListener(t, function () {
          zone.classList.remove("is-dragover");
        });
      });

      var form = input.form;
      if (form) {
        form.addEventListener("nb:form-reset", function () {
          files = [];
          render();
          announce("");
        });
      }
    });
  }

  /* ---- Combobox (select yang bisa dicari) --------------------------- */
  function initComboboxes() {
    NB.qsa("[data-combobox]").forEach(function (root) {
      var input = NB.qs('[role="combobox"]', root);
      var list = input && document.getElementById(input.getAttribute("aria-controls"));
      var hidden = NB.qs("[data-combobox-value]", root);
      if (!input || !list) return;
      input.setAttribute("data-combobox-input", "");
      var options = NB.qsa('[role="option"]', list);
      var empty = NB.qs("[data-combobox-empty]", list);
      var active = -1;

      options.forEach(function (o, i) {
        if (!o.id) o.id = (list.id || "nb-combo") + "-opt-" + i;
      });

      function visible() {
        return options.filter(function (o) {
          return !o.hidden;
        });
      }

      function setActive(i) {
        var vis = visible();
        options.forEach(function (o) {
          o.classList.remove("is-active");
        });
        active = i;
        if (i < 0 || !vis[i]) {
          input.removeAttribute("aria-activedescendant");
          return;
        }
        vis[i].classList.add("is-active");
        input.setAttribute("aria-activedescendant", vis[i].id);
        vis[i].scrollIntoView({ block: "nearest" });
      }

      function open() {
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
      }

      function close() {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        setActive(-1);
      }

      function filter() {
        var q = input.value.trim().toLowerCase();
        var count = 0;
        options.forEach(function (o) {
          var match = !q || o.textContent.toLowerCase().indexOf(q) !== -1;
          o.hidden = !match;
          if (match) count++;
        });
        if (empty) empty.hidden = count > 0;
        setActive(count && q ? 0 : -1);
      }

      function choose(o) {
        options.forEach(function (x) {
          x.setAttribute("aria-selected", String(x === o));
        });
        input.value = o.getAttribute("data-label") || o.firstChild.textContent.trim();
        if (hidden) hidden.value = o.getAttribute("data-value") || input.value;
        close();
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      input.addEventListener("input", function () {
        if (hidden) hidden.value = "";
        options.forEach(function (x) {
          x.setAttribute("aria-selected", "false");
        });
        filter();
        open();
      });
      input.addEventListener("focus", function () {
        filter();
      });
      input.addEventListener("click", function () {
        if (list.hidden) {
          filter();
          open();
        }
      });
      input.addEventListener("keydown", function (e) {
        var vis = visible();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (list.hidden) open();
          setActive(Math.min(active + 1, vis.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (list.hidden) open();
          setActive(Math.max(active - 1, 0));
        } else if (e.key === "Enter") {
          if (!list.hidden && vis[active]) {
            e.preventDefault();
            choose(vis[active]);
          }
        } else if (e.key === "Escape") {
          if (!list.hidden) {
            e.preventDefault();
            e.stopPropagation();
            close();
          }
        } else if (e.key === "Tab") {
          close();
        }
      });
      list.addEventListener("mousedown", function (e) {
        e.preventDefault(); // pertahankan fokus di input
      });
      list.addEventListener("click", function (e) {
        var o = e.target.closest('[role="option"]');
        if (o) choose(o);
      });
      document.addEventListener("click", function (e) {
        if (!root.contains(e.target)) close();
      });
      if (input.form) {
        input.form.addEventListener("nb:form-reset", function () {
          // Kembali ke nilai awal (data-default pada input tersembunyi), bukan selalu kosong —
          // penting untuk formulir edit yang sudah terisi.
          var initial = hidden ? hidden.getAttribute("data-default") || "" : "";
          if (hidden) hidden.value = initial;
          options.forEach(function (x) {
            x.setAttribute("aria-selected", String(!!initial && x.getAttribute("data-value") === initial));
          });
          close();
        });
      }
    });
  }

  /* ---- Range, switch, penghitung karakter --------------------------- */
  function initRanges() {
    NB.qsa("input[type='range'][data-range-output]").forEach(function (range) {
      var out = document.getElementById(range.getAttribute("data-range-output"));
      var suffix = range.getAttribute("data-range-suffix") || "";
      function update() {
        var text = range.value + suffix;
        if (out) out.textContent = text;
        range.setAttribute("aria-valuetext", text);
      }
      range.addEventListener("input", update);
      if (range.form) range.form.addEventListener("reset", function () { setTimeout(update, 0); });
      update();
    });
  }

  function initSwitches() {
    NB.qsa("input[role='switch']").forEach(function (sw) {
      var label = sw.closest("label");
      var state = label && NB.qs(".nb-switch__state", label);
      if (!state) return;
      function update() {
        state.textContent = sw.checked ? sw.getAttribute("data-on") || "Aktif" : sw.getAttribute("data-off") || "Nonaktif";
      }
      sw.addEventListener("change", update);
      if (sw.form) sw.form.addEventListener("reset", function () { setTimeout(update, 0); });
      update();
    });
  }

  function initCharCounters() {
    NB.qsa("[data-char-count]").forEach(function (field) {
      var out = document.getElementById(field.getAttribute("data-char-count"));
      var max = field.maxLength > 0 ? field.maxLength : null;
      if (!out) return;
      function update() {
        out.textContent = field.value.length + (max ? " / " + max : "") + " karakter";
      }
      field.addEventListener("input", update);
      if (field.form) field.form.addEventListener("reset", function () { setTimeout(update, 0); });
      update();
    });
  }

  NB.ready(function () {
    initValidation();
    initPasswordToggles();
    initWizards();
    initDirtyWarning();
    initDropzones();
    initComboboxes();
    initRanges();
    initSwitches();
    initCharCounters();
  });
})();
