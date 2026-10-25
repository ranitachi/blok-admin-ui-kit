/* ==========================================================================
   BLOK charts.js — chart SVG ringan tanpa library eksternal.
     <div class="nb-chart" data-chart="bar" data-chart-source="loans" data-chart-range="12b" id="...">
       <p class="nb-chart-fallback">Ringkasan teks bila JS tidak berjalan.</p>
     </div>
     <div data-chart="donut" data-chart-source="categories"></div>
     <div data-chart="line" data-chart-source="utilization"></div>   (multi seri)
     <span data-sparkline="3,5,4,8"></span>
     <strong data-count-to="1284">1.284</strong>                      (counter KPI)
   Kontrol rentang: <div data-chart-range-for="idChart"><button data-range="7h" aria-pressed>…
   Statistik: [data-chart-stat="total|avg|peak|onTime"][data-chart-for="idChart"]
   Ringkasan teks: [data-chart-summary][data-chart-for="idChart"]
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});
  var SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';
  var uid = 0;

  function fmt(n) {
    try {
      return Number(n).toLocaleString("id-ID");
    } catch (e) {
      return String(n);
    }
  }

  function niceStep(raw) {
    var pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / pow;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * pow;
  }

  function stats(values) {
    var total = values.reduce(function (a, b) {
      return a + b;
    }, 0);
    var peak = Math.max.apply(null, values);
    return { total: total, avg: Math.round(total / values.length), peak: peak, peakIndex: values.indexOf(peak) };
  }

  function resolveSource(name) {
    if (!name || !NB.data) return null;
    return name.split(".").reduce(function (obj, key) {
      return obj && obj[key];
    }, NB.data);
  }

  /* ---- Bar chart ----------------------------------------------------- */
  function renderBar(el, ds) {
    var width = Math.max(260, Math.round(el.clientWidth || 600));
    var height = width < 480 ? 220 : 260;
    var pad = { t: 26, r: 6, b: 30, l: 40 };
    var innerW = width - pad.l - pad.r;
    var innerH = height - pad.t - pad.b;
    var s = stats(ds.values);
    var step = niceStep(s.peak / 4);
    var max = step * Math.ceil(s.peak / step);
    if (max === s.peak) max += step;
    var ticks = Math.round(max / step);
    var n = ds.values.length;
    var band = innerW / n;
    var barW = Math.max(8, Math.min(52, band * 0.58));
    var labelEvery = band < 34 ? 2 : 1;
    var parts = [];

    for (var t = 0; t <= ticks; t++) {
      var val = step * t;
      var y = pad.t + innerH - (val / max) * innerH;
      parts.push(
        '<line class="nb-chart__grid" x1="' + pad.l + '" x2="' + (width - pad.r) + '" y1="' + y + '" y2="' + y + '"' +
          (t === 0 ? ' style="stroke-dasharray:none;opacity:1;stroke-width:2"' : "") + "/>" +
          '<text class="nb-chart__axis" x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(val) + "</text>"
      );
    }

    ds.values.forEach(function (v, i) {
      var h = Math.max(2, (v / max) * innerH);
      var x = pad.l + band * i + (band - barW) / 2;
      var y = pad.t + innerH - h;
      var peak = i === s.peakIndex;
      parts.push(
        '<g class="nb-chart__bar-group" data-i="' + i + '">' +
          '<rect x="' + (pad.l + band * i) + '" y="' + pad.t + '" width="' + band + '" height="' + innerH + '" fill="transparent"/>' +
          '<rect class="nb-chart__bar' + (peak ? " is-peak" : "") + '" x="' + x + '" y="' + y + '" width="' + barW +
          '" height="' + h + '"/>' +
          (peak
            ? '<text class="nb-chart__value" x="' + (x + barW / 2) + '" y="' + (y - 8) + '" text-anchor="middle">' + fmt(v) + "</text>"
            : "") +
          (i % labelEvery === 0
            ? '<text class="nb-chart__axis" x="' + (x + barW / 2) + '" y="' + (height - 8) + '" text-anchor="middle">' +
              NB.escapeHtml(ds.labels[i]) + "</text>"
            : "") +
          "</g>"
      );
    });

    var tableId = "nb-chart-tbl-" + ++uid;
    var rows = ds.labels
      .map(function (l, i) {
        return "<tr><th scope=\"row\">" + NB.escapeHtml(l) + "</th><td>" + fmt(ds.values[i]) + "</td></tr>";
      })
      .join("");

    el.innerHTML =
      "<svg " + SVG_NS + ' viewBox="0 0 ' + width + " " + height + '" width="' + width + '" height="' + height +
      '" aria-hidden="true" focusable="false">' + parts.join("") + "</svg>" +
      '<div class="nb-chart__tip" hidden></div>' +
      '<div class="nb-sr-only"><table id="' + tableId + '"><caption>' + NB.escapeHtml(el.getAttribute("aria-label") || "Data chart") +
      ", " + NB.escapeHtml(ds.caption || "") + "</caption><thead><tr><th scope=\"col\">Periode</th><th scope=\"col\">" +
      NB.escapeHtml(ds.unit || "Nilai") + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>";

    var tip = el.querySelector(".nb-chart__tip");
    var svg = el.querySelector("svg");
    NB.qsa(".nb-chart__bar-group", svg).forEach(function (g) {
      g.addEventListener("mouseenter", function () {
        var i = Number(g.getAttribute("data-i"));
        var bar = g.querySelector(".nb-chart__bar");
        var scale = svg.getBoundingClientRect().width / width;
        tip.textContent = ds.labels[i] + ": " + fmt(ds.values[i]) + " " + (ds.unit || "");
        tip.style.left = (Number(bar.getAttribute("x")) + barW / 2) * scale + "px";
        tip.style.top = Number(bar.getAttribute("y")) * scale + "px";
        tip.hidden = false;
      });
      g.addEventListener("mouseleave", function () {
        tip.hidden = true;
      });
    });

    return s;
  }

  /* ---- Donut chart --------------------------------------------------- */
  function renderDonut(el, items) {
    var total = items.reduce(function (a, b) {
      return a + b.value;
    }, 0);
    var r = 60;
    var c = 2 * Math.PI * r;
    var offset = 0;
    var segs = [];
    var seps = [];

    items.forEach(function (item) {
      var len = (item.value / total) * c;
      segs.push(
        '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke-width="26" style="stroke:var(--color-' + item.color +
          ')" stroke-dasharray="' + len + " " + (c - len) + '" stroke-dashoffset="' + -offset + '" transform="rotate(-90 80 80)"/>'
      );
      var angle = (offset / c) * 2 * Math.PI - Math.PI / 2;
      seps.push(
        '<line x1="' + (80 + 47 * Math.cos(angle)) + '" y1="' + (80 + 47 * Math.sin(angle)) + '" x2="' +
          (80 + 73 * Math.cos(angle)) + '" y2="' + (80 + 73 * Math.sin(angle)) + '" style="stroke:var(--color-ink)" stroke-width="2"/>'
      );
      offset += len;
    });

    var center = el.getAttribute("data-chart-center") || "Total";
    var svg =
      "<svg " + SVG_NS + ' class="nb-donut__svg" viewBox="0 0 160 160" role="img" aria-label="' +
      NB.escapeHtml((el.getAttribute("aria-label") || "Komposisi") + ": " + items.map(function (i) {
        return i.label + " " + fmt(i.value);
      }).join(", ")) + '">' +
      segs.join("") +
      '<circle cx="80" cy="80" r="73" fill="none" style="stroke:var(--color-ink)" stroke-width="2"/>' +
      '<circle cx="80" cy="80" r="47" style="fill:var(--color-paper);stroke:var(--color-ink)" stroke-width="2"/>' +
      seps.join("") +
      '<text class="nb-donut__center-value" x="80" y="82" text-anchor="middle">' + fmt(total) + "</text>" +
      '<text class="nb-donut__center-label" x="80" y="98" text-anchor="middle">' + NB.escapeHtml(center) + "</text></svg>";

    var legend =
      '<ul class="nb-legend">' +
      items
        .map(function (item) {
          var pct = Math.round((item.value / total) * 1000) / 10;
          return (
            '<li class="nb-legend__item"><span class="nb-legend__swatch" style="background:var(--color-' + item.color +
            ')" aria-hidden="true"></span><span>' + NB.escapeHtml(item.label) + '</span><span class="nb-legend__value">' +
            fmt(item.value) + " · " + String(pct).replace(".", ",") + "%</span></li>"
          );
        })
        .join("") +
      "</ul>";

    el.classList.add("nb-donut");
    el.innerHTML = svg + legend;
  }

  /* ---- Sparkline ----------------------------------------------------- */
  function renderSparkline(el) {
    var values = (el.getAttribute("data-sparkline") || "")
      .split(",")
      .map(Number)
      .filter(function (v) {
        return !isNaN(v);
      });
    if (values.length < 2) return;
    var w = 96;
    var h = 32;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;
    var pts = values.map(function (v, i) {
      return [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - min) / range) * (h - 8)];
    });
    var last = pts[pts.length - 1];
    el.innerHTML =
      "<svg " + SVG_NS + ' class="nb-sparkline" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true" focusable="false">' +
      '<polyline points="' + pts.map(function (p) {
        return p[0].toFixed(1) + "," + p[1].toFixed(1);
      }).join(" ") + '"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3.5"/></svg>';
  }

  /* ---- Pengikat deklaratif ------------------------------------------ */
  function updateStats(id, ds, s) {
    var values = { total: fmt(s.total), avg: fmt(s.avg), peak: fmt(s.peak), onTime: ds.onTime !== undefined ? ds.onTime + "%" : "–" };
    NB.qsa('[data-chart-for="' + id + '"][data-chart-stat]').forEach(function (node) {
      var key = node.getAttribute("data-chart-stat");
      if (values[key] !== undefined) node.textContent = values[key];
    });
    NB.qsa('[data-chart-for="' + id + '"][data-chart-summary]').forEach(function (node) {
      node.textContent =
        "Total " + fmt(s.total) + " " + (ds.unit || "") + " dalam " + (ds.caption || "periode ini") +
        ". Tertinggi pada " + ds.labels[s.peakIndex] + " (" + fmt(s.peak) + "), rata-rata " + fmt(s.avg) + " per periode.";
    });
    NB.qsa('[data-chart-for="' + id + '"][data-chart-caption]').forEach(function (node) {
      node.textContent = ds.caption || "";
    });
  }

  function initBar(el) {
    var source = resolveSource(el.getAttribute("data-chart-source"));
    if (!source) return;
    var range = el.getAttribute("data-chart-range");
    var current = range ? source[range] : source;
    if (!current || !current.values) return;
    var id = el.id || (el.id = "nb-chart-" + ++uid);

    function draw() {
      var s = renderBar(el, current);
      updateStats(id, current, s);
    }
    draw();

    var lastW = el.clientWidth;
    if ("ResizeObserver" in window) {
      var raf;
      new ResizeObserver(function () {
        if (Math.abs(el.clientWidth - lastW) < 4) return;
        lastW = el.clientWidth;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }).observe(el);
    }

    NB.qsa('[data-chart-range-for="' + id + '"]').forEach(function (group) {
      NB.qsa("[data-range]", group).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-range");
          if (!source[key]) return;
          current = source[key];
          el.setAttribute("data-chart-range", key);
          NB.qsa("[data-range]", group).forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
          draw();
        });
      });
    });
  }


  /* ---- Line chart (multi seri) -------------------------------------- */
  function renderLine(el, ds) {
    var width = Math.max(260, Math.round(el.clientWidth || 600));
    var height = width < 480 ? 220 : 260;
    var pad = { t: 20, r: 14, b: 30, l: 40 };
    var innerW = width - pad.l - pad.r;
    var innerH = height - pad.t - pad.b;
    var all = [];
    ds.series.forEach(function (s) {
      all = all.concat(s.values);
    });
    var peak = Math.max.apply(null, all);
    var max = ds.max || (function () {
      var step = niceStep(peak / 4);
      return step * Math.ceil(peak / step);
    })();
    var ticks = 4;
    var n = ds.labels.length;
    var xAt = function (i) {
      return pad.l + (n === 1 ? innerW / 2 : (innerW / (n - 1)) * i);
    };
    var yAt = function (v) {
      return pad.t + innerH - (v / max) * innerH;
    };
    var labelEvery = innerW / n < 34 ? 2 : 1;
    var parts = [];

    for (var t = 0; t <= ticks; t++) {
      var val = (max / ticks) * t;
      var y = yAt(val);
      parts.push(
        '<line class="nb-chart__grid" x1="' + pad.l + '" x2="' + (width - pad.r) + '" y1="' + y + '" y2="' + y + '"' +
          (t === 0 ? ' style="stroke-dasharray:none;opacity:1;stroke-width:2"' : "") + "/>" +
          '<text class="nb-chart__axis" x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' +
          fmt(Math.round(val)) + (ds.axisSuffix || "") + "</text>"
      );
    }
    ds.labels.forEach(function (l, i) {
      if (i % labelEvery) return;
      parts.push('<text class="nb-chart__axis" x="' + xAt(i) + '" y="' + (height - 8) + '" text-anchor="middle">' + NB.escapeHtml(l) + "</text>");
    });

    ds.series.forEach(function (s, si) {
      var pts = s.values.map(function (v, i) {
        return xAt(i).toFixed(1) + "," + yAt(v).toFixed(1);
      });
      if (si === 0) {
        parts.push(
          '<polygon class="nb-chart__area" points="' + xAt(0) + "," + yAt(0) + " " + pts.join(" ") + " " + xAt(n - 1) + "," + yAt(0) + '"/>'
        );
      }
      parts.push('<polyline class="nb-chart__line' + (s.alt ? " nb-chart__line--alt" : "") + '" points="' + pts.join(" ") + '"/>');
    });
    ds.series.forEach(function (s, si) {
      s.values.forEach(function (v, i) {
        parts.push(
          '<g class="nb-chart__point" data-s="' + si + '" data-i="' + i + '">' +
            '<circle cx="' + xAt(i) + '" cy="' + yAt(v) + '" r="12" fill="transparent"/>' +
            '<circle class="nb-chart__dot" cx="' + xAt(i) + '" cy="' + yAt(v) + '" r="' + (s.alt ? 3.5 : 4.5) + '"/></g>'
        );
      });
    });

    var head = "<tr><th scope=\"col\">Periode</th>" + ds.series.map(function (s) {
      return '<th scope="col">' + NB.escapeHtml(s.name) + "</th>";
    }).join("") + "</tr>";
    var rows = ds.labels.map(function (l, i) {
      return "<tr><th scope=\"row\">" + NB.escapeHtml(l) + "</th>" + ds.series.map(function (s) {
        return "<td>" + fmt(s.values[i]) + (ds.axisSuffix || "") + "</td>";
      }).join("") + "</tr>";
    }).join("");

    var legend = '<ul class="nb-legend nb-legend--inline">' + ds.series.map(function (s) {
      return '<li class="nb-legend__item"><span class="nb-legend__swatch ' + (s.alt ? "nb-legend__swatch--dash" : "nb-legend__swatch--line") +
        '" aria-hidden="true"></span><span>' + NB.escapeHtml(s.name) + "</span></li>";
    }).join("") + "</ul>";

    el.innerHTML =
      "<svg " + SVG_NS + ' viewBox="0 0 ' + width + " " + height + '" width="' + width + '" height="' + height +
      '" aria-hidden="true" focusable="false">' + parts.join("") + "</svg>" +
      '<div class="nb-chart__tip" hidden></div>' + legend +
      '<div class="nb-sr-only"><table><caption>' + NB.escapeHtml(el.getAttribute("aria-label") || "Data chart") + ", " +
      NB.escapeHtml(ds.caption || "") + "</caption><thead>" + head + "</thead><tbody>" + rows + "</tbody></table></div>";

    var tip = el.querySelector(".nb-chart__tip");
    var svg = el.querySelector("svg");
    NB.qsa(".nb-chart__point", svg).forEach(function (g) {
      g.addEventListener("mouseenter", function () {
        var s = ds.series[Number(g.getAttribute("data-s"))];
        var i = Number(g.getAttribute("data-i"));
        var dot = g.querySelector(".nb-chart__dot");
        var scale = svg.getBoundingClientRect().width / width;
        tip.textContent = s.name + " · " + ds.labels[i] + ": " + fmt(s.values[i]) + (ds.axisSuffix || "");
        tip.style.left = Number(dot.getAttribute("cx")) * scale + "px";
        tip.style.top = (Number(dot.getAttribute("cy")) - 6) * scale + "px";
        tip.hidden = false;
      });
      g.addEventListener("mouseleave", function () {
        tip.hidden = true;
      });
    });
  }

  function initLine(el) {
    var ds = resolveSource(el.getAttribute("data-chart-source"));
    if (!ds || !ds.series) return;
    renderLine(el, ds);
    var lastW = el.clientWidth;
    if ("ResizeObserver" in window) {
      var raf;
      new ResizeObserver(function () {
        if (Math.abs(el.clientWidth - lastW) < 4) return;
        lastW = el.clientWidth;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          renderLine(el, ds);
        });
      }).observe(el);
    }
  }

  /* ---- Counter KPI ---------------------------------------------------- */
  function initCounters() {
    var nodes = NB.qsa("[data-count-to]");
    if (!nodes.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function run(el) {
      var target = Number(el.getAttribute("data-count-to"));
      var suffix = el.getAttribute("data-count-suffix") || "";
      if (reduce || isNaN(target)) {
        el.textContent = fmt(target) + suffix;
        return;
      }
      var start = null;
      var dur = 900;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!("IntersectionObserver" in window)) return nodes.forEach(run);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    });
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }
  NB.countUp = function (scope) {
    NB.qsa("[data-count-to]", scope).forEach(function (el) {
      el.textContent = "0";
    });
    initCounters();
  };

  NB.charts = { bar: renderBar, line: renderLine, donut: renderDonut, sparkline: renderSparkline, stats: stats };

  NB.ready(function () {
    NB.qsa('[data-chart="bar"]').forEach(function (el) {
      try {
        initBar(el);
      } catch (e) {
        if (window.console) console.error("BLOK chart:", e);
      }
    });
    NB.qsa('[data-chart="donut"]').forEach(function (el) {
      var items = resolveSource(el.getAttribute("data-chart-source"));
      if (items && items.length) renderDonut(el, items);
    });
    NB.qsa('[data-chart="line"]').forEach(function (el) {
      try {
        initLine(el);
      } catch (e) {
        if (window.console) console.error("BLOK chart:", e);
      }
    });
    NB.qsa("[data-sparkline]").forEach(renderSparkline);
    initCounters();
  });
})();
