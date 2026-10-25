/* ==========================================================================
   BLOK icons — sprite SVG inline.
   Disuntikkan ke <body> agar <use href="#i-nama"> bekerja juga saat file
   dibuka langsung (file://), tanpa fetch dan tanpa sprite eksternal.
   Pemakaian:
     <svg class="nb-icon" aria-hidden="true"><use href="#i-home"></use></svg>
   ========================================================================== */
(function () {
  "use strict";

  var ICONS = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4"/><path d="M12 11v10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M18 14c2.2.6 3.5 2.8 3.5 6"/>',
    door: '<path d="M5 21V3h11v18"/><path d="M3 21h18"/><path d="M16 5h3v16"/><path d="M12 12h.01"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 005 5L21 13l-8 8-3-3 6.5-6.5"/><path d="M14.5 6.5L9 12"/><path d="M3 21l6-6"/><path d="M14 3a4 4 0 00.5 3.5"/>',
    kanban: '<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M5 7h2M11 7h2M17 7h2M5 11h2M11 11h2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    layout: '<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18"/><path d="M9 9v12"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M5 5l14 14M19 5L5 19"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    "chevron-right": '<path d="M9 6l6 6-6 6"/>',
    "sidebar-collapse": '<rect x="3" y="4" width="18" height="16"/><path d="M9 4v16"/><path d="M16 9l-3 3 3 3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    "arrow-up": '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
    "arrow-down": '<path d="M7 7l10 10"/><path d="M17 8v9H8"/>',
    "arrow-right": '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    logout: '<path d="M10 4H4v16h6"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4"/><path d="M12 17h.01"/>',
    tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    card: '<rect x="2" y="5" width="20" height="14"/><path d="M2 10h20"/><path d="M6 15h4"/>',
    lock: '<rect x="4" y="10" width="16" height="11"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    octagon: '<path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M12 7v6"/><path d="M12 16.5h.01"/>',
    palette: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 004-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    type: '<path d="M4 6V4h16v2"/><path d="M12 4v16"/><path d="M8 20h8"/>',
    code: '<path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/><path d="M14 4l-4 16"/>',
    terminal: '<rect x="2" y="4" width="20" height="16"/><path d="M6 9l3 3-3 3"/><path d="M12 15h5"/>',
    swap: '<path d="M4 8h14l-4-4"/><path d="M20 16H6l4 4"/>',
    mail: '<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>',
    refresh: '<path d="M20 11a8 8 0 00-14.5-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0014.5 4.5L20 16"/><path d="M20 21v-5h-5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    "arrow-left": '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8"/><path d="M7 14h10v7H7z"/>'
  };

  var NS = "http://www.w3.org/2000/svg";

  function buildSprite() {
    if (document.getElementById("nb-icon-sprite")) return;
    var markup = "";
    Object.keys(ICONS).forEach(function (name) {
      markup += '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + ICONS[name] + "</symbol>";
    });
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("id", "nb-icon-sprite");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    svg.innerHTML = markup;
    document.body.insertBefore(svg, document.body.firstChild);
  }

  window.NB = window.NB || {};
  window.NB.icons = {
    names: Object.keys(ICONS),
    /** Kembalikan markup <svg> untuk dipakai di template JS. */
    svg: function (name, extraClass) {
      return (
        '<svg class="nb-icon' + (extraClass ? " " + extraClass : "") +
        '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>'
      );
    }
  };

  if (document.body) {
    buildSprite();
  } else {
    document.addEventListener("DOMContentLoaded", buildSprite);
  }
})();
