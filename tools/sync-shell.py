#!/usr/bin/env python3
"""
BLOK — sinkronisasi shell HTML statis (OPSIONAL, bukan dependensi runtime).

Situs tetap 100% HTML statis: setiap halaman berisi sidebar/topbar lengkap
dan bisa dibuka langsung. Skrip ini hanya membantu pengembang agar markup
yang berulang tetap seragam. Ia menulis ulang blok di antara penanda:

    <!-- nb:sidebar -->  ... <!-- /nb:sidebar -->   sidebar + grup navigasi
    <!-- nb:topbar -->   ... <!-- /nb:topbar -->    topbar (breadcrumb, cari, notifikasi, akun)
    <!-- nb:crumbs -->   ... <!-- /nb:crumbs -->    breadcrumb di dalam konten (mobile)
    <!-- nb:progress --> ... <!-- /nb:progress -->  panel progres (index.html)
    <!-- nb:catalog -->  ... <!-- /nb:catalog -->   katalog halaman (index.html)

Aturan "tanpa tautan mati": sebuah halaman tampil sebagai tautan HANYA jika
file-nya ada. Halaman yang belum dibuat tampil sebagai item non-aktif
"Segera" (sidebar) atau label fase (katalog).

Pemakaian (dari folder neo-brutal-html/):
    python3 tools/sync-shell.py          # tulis perubahan
    python3 tools/sync-shell.py --check  # hanya laporkan file yang berbeda
Hanya membutuhkan Python 3 standar.
"""
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Registri halaman: (key, path, label, kategori, ikon, fase, nav_parent)
#   nav_parent = key item sidebar yang disorot untuk halaman turunan.
# ---------------------------------------------------------------------------
PAGES = [
    ("index", "index.html", "Katalog halaman", "Dashboard", "grid", "A", None),
    ("dashboard", "dashboard.html", "Ringkasan", "Dashboard", "home", "A", None),
    ("dashboard-analytics", "dashboard-analytics.html", "Analitik", "Dashboard", "chart", "D", None),
    ("dashboard-operations", "dashboard-operations.html", "Operasional", "Dashboard", "activity", "D", None),

    ("assets", "pages/assets-list.html", "Aset", "Data", "box", "C", None),
    ("assets-create", "pages/assets-create.html", "Tambah aset", "Data", None, "C", "assets"),
    ("assets-edit", "pages/assets-edit.html", "Ubah aset", "Data", None, "C", "assets"),
    ("assets-detail", "pages/assets-detail.html", "Detail aset", "Data", None, "C", "assets"),
    ("users", "pages/users-list.html", "Pengguna", "Data", "users", "C", None),
    ("users-detail", "pages/users-detail.html", "Detail pengguna", "Data", None, "C", "users"),
    ("rooms", "pages/rooms-list.html", "Ruangan", "Data", "door", "C", None),

    ("bookings", "pages/bookings.html", "Peminjaman", "Operasional", "bookmark", "C", None),
    ("maintenance", "pages/maintenance.html", "Perawatan", "Operasional", "wrench", "C", None),
    ("tasks", "pages/tasks-kanban.html", "Tugas", "Operasional", "kanban", "D", None),
    ("calendar", "pages/calendar.html", "Kalender", "Operasional", "calendar", "D", None),

    ("c-buttons", "components/buttons.html", "Tombol", "UI Kit", None, "B", None),
    ("c-cards", "components/cards.html", "Kartu", "UI Kit", None, "B", None),
    ("c-badges", "components/badges.html", "Badge & status", "UI Kit", None, "B", None),
    ("c-alerts", "components/alerts.html", "Alert & toast", "UI Kit", None, "B", None),
    ("c-modals", "components/modals.html", "Modal & drawer", "UI Kit", None, "B", None),
    ("c-dropdowns", "components/dropdowns.html", "Dropdown & popover", "UI Kit", None, "B", None),
    ("c-tabs", "components/tabs-accordion.html", "Tab & akordeon", "UI Kit", None, "B", None),
    ("c-navigation", "components/navigation.html", "Navigasi", "UI Kit", None, "B", None),
    ("c-tables", "components/tables.html", "Tabel", "UI Kit", None, "B", None),
    ("c-forms", "components/forms.html", "Formulir", "UI Kit", None, "B", None),
    ("c-charts", "components/charts.html", "Chart & KPI", "UI Kit", None, "B", None),
    ("c-timelines", "components/timelines.html", "Timeline & konten", "UI Kit", None, "B", None),
    ("c-empty", "components/empty-loading.html", "Empty & loading", "UI Kit", None, "B", None),
    ("c-icons", "components/icons-typography.html", "Ikon & tipografi", "UI Kit", None, "B", None),

    ("reports", "pages/reports.html", "Laporan", "Halaman", "file", "D", None),
    ("notifications", "pages/notifications.html", "Notifikasi", "Halaman", "bell", "D", None),
    ("profile", "pages/profile.html", "Profil", "Halaman", "user", "D", None),
    ("settings", "pages/settings.html", "Pengaturan", "Halaman", "settings", "D", None),
    ("pricing", "pages/pricing.html", "Harga", "Halaman", "tag", "D", None),
    ("help", "pages/help-center.html", "Pusat bantuan", "Halaman", "help", "D", None),

    ("auth", "auth/login.html", "Masuk", "Autentikasi", "lock", "E", None),
    ("auth-register", "auth/register.html", "Daftar", "Autentikasi", None, "E", "auth"),
    ("auth-forgot", "auth/forgot-password.html", "Lupa kata sandi", "Autentikasi", None, "E", "auth"),
    ("auth-reset", "auth/reset-password.html", "Atur ulang kata sandi", "Autentikasi", None, "E", "auth"),
    ("e-403", "errors/403.html", "Error 403", "Error", None, "E", "errors"),
    ("errors", "errors/404.html", "Error 404", "Error", "octagon", "E", None),
    ("e-500", "errors/500.html", "Error 500", "Error", None, "E", "errors"),

    ("docs", "documentation/index.html", "Mulai di sini", "Dokumentasi", "file", "F", None),
    ("docs-components", "documentation/components.html", "Indeks komponen", "Dokumentasi", "layers", "F", None),
    ("docs-tokens", "documentation/tokens.html", "Design token", "Dokumentasi", "palette", "F", None),
    ("docs-js", "documentation/javascript.html", "API JavaScript", "Dokumentasi", "code", "F", None),
    ("docs-a11y", "documentation/accessibility.html", "Aksesibilitas", "Dokumentasi", "eye", "F", None),
]

# Label item sidebar bila berbeda dari label halaman.
NAV_LABEL = {"index": "Katalog halaman", "auth": "Autentikasi", "errors": "Halaman error"}

# Kelompok sidebar (urutan tampil). "UI Kit" dirender sebagai grup bersarang.
NAV_GROUPS = [
    ("Dashboard", ["index", "dashboard", "dashboard-analytics", "dashboard-operations"]),
    ("Data", ["assets", "users", "rooms"]),
    ("Operasional", ["bookings", "maintenance", "tasks", "calendar"]),
    ("UI Kit", None),
    ("Halaman", ["reports", "notifications", "profile", "settings", "pricing", "help", "auth", "errors"]),
    ("Dokumentasi", ["docs", "docs-components", "docs-tokens", "docs-js", "docs-a11y"]),
]

# Kategori katalog di index.html.
CATALOG = [
    ("Dashboard", "home", "yellow", ["index", "dashboard", "dashboard-analytics", "dashboard-operations"]),
    ("Data & CRUD", "box", "mint", ["assets", "assets-create", "assets-edit", "assets-detail", "users", "users-detail", "rooms"]),
    ("Operasional", "calendar", "blue", ["bookings", "maintenance", "tasks", "calendar"]),
    ("Komponen UI Kit", "layers", "lavender", [p[0] for p in PAGES if p[0].startswith("c-")]),
    ("Halaman umum", "file", "pink", ["reports", "notifications", "profile", "settings", "pricing", "help"]),
    ("Auth & error", "lock", "sage", ["auth", "auth-register", "auth-forgot", "auth-reset", "e-403", "errors", "e-500"]),
    ("Dokumentasi", "file", "lavender-soft", [p[0] for p in PAGES if p[0].startswith("docs")]),
]
CATALOG_LABEL = {"index": "Katalog halaman", "dashboard": "Ringkasan inventaris", "dashboard-analytics": "Dashboard analitik",
                 "dashboard-operations": "Dashboard operasional", "assets": "Daftar aset", "users": "Daftar pengguna",
                 "rooms": "Daftar ruangan", "tasks": "Tugas (Kanban)", "auth": "Masuk"}

PHASES = [
    ("A", "Fondasi, shell & dashboard"),
    ("B", "Pustaka komponen"),
    ("C", "Demo CRUD"),
    ("D", "Halaman bisnis tambahan"),
    ("E", "Autentikasi & error"),
    ("F", "Pemantapan & dokumentasi"),
]

BY_KEY = {p[0]: p for p in PAGES}
BY_PATH = {p[1]: p for p in PAGES}


def exists(key):
    return os.path.isfile(os.path.join(ROOT, BY_KEY[key][1]))


def icon(name, cls="nb-icon"):
    return '<svg class="%s" aria-hidden="true"><use href="#i-%s"></use></svg>' % (cls, name)


def esc(s):
    return html.escape(s, quote=True)


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------
def nav_item(key, prefix, indent, with_icon=True):
    _, path, label, _, ic, _, _ = BY_KEY[key]
    label = NAV_LABEL.get(key, label)
    ico = icon(ic) if (with_icon and ic) else ""
    if exists(key):
        return '%s<li><a class="nb-nav__link" href="%s%s" data-nav="%s">%s<span class="nb-nav__label">%s</span></a></li>' % (
            indent, prefix, path, key, ico, esc(label))
    return ('%s<li><span class="nb-nav__link is-disabled" aria-disabled="true">%s<span class="nb-nav__label">%s</span>'
            '<span class="nb-nav__tag">Segera</span></span></li>') % (indent, ico, esc(label))


def build_sidebar(prefix):
    i = "  "
    out = [
        '<aside class="nb-sidebar" id="nb-sidebar" aria-label="Navigasi utama">',
        i + '<div class="nb-sidebar__brand">',
        i * 2 + '<a class="nb-brand" href="%sindex.html">' % prefix,
        i * 3 + '<span class="nb-brand__mark" aria-hidden="true">B</span>',
        i * 3 + '<span class="nb-brand__text"><strong>BLOK</strong><small>Admin UI Kit</small></span>',
        i * 2 + '</a>',
        i * 2 + '<button class="nb-icon-btn nb-sidebar__close" type="button" data-sidebar-close aria-label="Tutup menu navigasi">',
        i * 3 + icon("x"),
        i * 2 + '</button>',
        i + '</div>',
        '',
        i + '<nav class="nb-sidebar__nav" aria-label="Menu">',
    ]
    for title, keys in NAV_GROUPS:
        out.append(i * 2 + '<div class="nb-nav-group">')
        out.append(i * 3 + '<p class="nb-nav-group__title">%s</p>' % esc(title))
        out.append(i * 3 + '<ul class="nb-nav">')
        if keys is None:
            comps = [p[0] for p in PAGES if p[0].startswith("c-")]
            ready = sum(1 for k in comps if exists(k))
            out += [
                i * 4 + '<li>',
                i * 5 + '<button class="nb-nav__link" type="button" data-nav-toggle aria-expanded="false" aria-controls="nb-nav-components">',
                i * 6 + icon("layers") + '<span class="nb-nav__label">Komponen</span>'
                '<span class="nb-nav__count" aria-label="%d halaman siap">%d</span>' % (ready, ready)
                + icon("chevron-down", "nb-icon nb-icon--sm nb-nav__chevron"),
                i * 5 + '</button>',
                i * 5 + '<ul class="nb-nav nb-nav--sub" id="nb-nav-components" hidden>',
            ]
            out += [nav_item(k, prefix, i * 6, with_icon=False) for k in comps]
            out += [i * 5 + '</ul>', i * 4 + '</li>']
        else:
            out += [nav_item(k, prefix, i * 4) for k in keys]
        out.append(i * 3 + '</ul>')
        out.append(i * 2 + '</div>')
    out += [
        i + '</nav>',
        '',
        i + '<div class="nb-sidebar__footer">',
        i * 2 + '<p class="nb-sidebar-note"><strong>Mode demo</strong>Semua data fiktif. Perubahan hanya bertahan selama halaman terbuka.</p>',
        i + '</div>',
        '</aside>',
    ]
    return out


# ---------------------------------------------------------------------------
# Breadcrumb & topbar
# ---------------------------------------------------------------------------
def crumbs(entry, prefix):
    key, path, label, group, _, _, parent = entry
    items = []
    if key == "index":
        items.append('<li><a href="%sindex.html">Beranda</a></li>' % prefix)
        items.append('<li><span aria-current="page">Katalog halaman</span></li>')
        return items
    items.append('<li><a href="%sindex.html">Beranda</a></li>' % prefix)
    items.append('<li>%s</li>' % esc(group))
    if parent and parent in BY_KEY and exists(parent):
        items.append('<li><a href="%s%s">%s</a></li>' % (prefix, BY_KEY[parent][1], esc(BY_KEY[parent][2])))
    items.append('<li><span aria-current="page">%s</span></li>' % esc(label))
    return items


def build_crumbs(entry, prefix):
    out = ['<nav class="nb-breadcrumb nb-page-breadcrumb" aria-label="Breadcrumb halaman">', '  <ol>']
    out += ['    ' + c for c in crumbs(entry, prefix)]
    out += ['  </ol>', '</nav>']
    return out


NOTIFS = [
    ("pink", "wrench", True, "Tiket TK-221: proyektor Lab Multimedia tidak menyala.", "2026-10-24T09:12", "12 menit lalu"),
    ("yellow", "clock", True, "12 peminjaman jatuh tempo minggu ini.", "2026-10-24T07:00", "2 jam lalu"),
    ("mint", "check", True, "Audit kuartal III selesai dengan tingkat kecocokan 98%.", "2026-10-23", "Kemarin"),
    ("blue", "users", False, "Dimas Pratama bergabung sebagai Operator Gudang.", "2026-10-21", "3 hari lalu"),
]


def build_topbar(entry, prefix):
    i = "  "
    out = [
        '<header class="nb-topbar">',
        i + '<div class="nb-topbar__start">',
        i * 2 + '<button class="nb-icon-btn" type="button" data-sidebar-toggle aria-controls="nb-sidebar" aria-expanded="true" aria-label="Ciutkan sidebar">',
        i * 3 + icon("sidebar-collapse"),
        i * 2 + '</button>',
        i * 2 + '<a class="nb-brand nb-topbar__brand" href="%sindex.html" aria-label="BLOK — katalog halaman">' % prefix,
        i * 3 + '<span class="nb-brand__mark" aria-hidden="true">B</span>',
        i * 3 + '<span class="nb-brand__text"><strong>BLOK</strong></span>',
        i * 2 + '</a>',
        i * 2 + '<nav class="nb-breadcrumb" aria-label="Breadcrumb">',
        i * 3 + '<ol>',
    ]
    out += [i * 4 + c for c in crumbs(entry, prefix)]
    out += [
        i * 3 + '</ol>',
        i * 2 + '</nav>',
        i + '</div>',
        '',
        i + '<div class="nb-topbar__search" data-quicknav role="search">',
        i * 2 + '<label class="nb-sr-only" for="nb-quicknav">Cari halaman</label>',
        i * 2 + '<div class="nb-search">',
        i * 3 + icon("search", "nb-icon nb-search__icon"),
        i * 3 + '<input class="nb-search__input" id="nb-quicknav" type="search" placeholder="Cari halaman…" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="nb-quicknav-results">',
        i * 3 + '<kbd class="nb-search__kbd" aria-hidden="true">/</kbd>',
        i * 2 + '</div>',
        i * 2 + '<ul class="nb-search-results" id="nb-quicknav-results" role="listbox" aria-label="Hasil pencarian halaman" data-quicknav-results hidden></ul>',
        i + '</div>',
        '',
        i + '<div class="nb-topbar__actions">',
        i * 2 + '<button class="nb-icon-btn nb-topbar__search-toggle" type="button" data-search-toggle aria-expanded="false" aria-controls="nb-quicknav" aria-label="Tampilkan pencarian halaman">',
        i * 3 + icon("search"),
        i * 2 + '</button>',
        '',
        i * 2 + '<div class="nb-dropdown" data-dropdown>',
        i * 3 + '<button class="nb-icon-btn" type="button" data-dropdown-trigger data-notif-trigger aria-expanded="false" aria-controls="nb-notif-panel" aria-label="Notifikasi, 3 belum dibaca">',
        i * 4 + icon("bell"),
        i * 4 + '<span class="nb-icon-btn__dot" data-notif-count aria-hidden="true">3</span>',
        i * 3 + '</button>',
        i * 3 + '<div class="nb-popover" id="nb-notif-panel" role="dialog" aria-labelledby="nb-notif-title" tabindex="-1" hidden>',
        i * 4 + '<div class="nb-popover__header">',
        i * 5 + '<h2 id="nb-notif-title">Notifikasi</h2>',
        i * 5 + '<button class="nb-link-btn" type="button" data-notif-mark-all>Tandai semua dibaca</button>',
        i * 4 + '</div>',
        i * 4 + '<ul class="nb-notif-list">',
    ]
    for color, ic, unread, text, dt, ago in NOTIFS:
        out += [
            i * 5 + '<li class="nb-notif%s">' % (" is-unread" if unread else ""),
            i * 6 + '<span class="nb-notif__icon" style="background: var(--color-%s)">%s</span>' % (color, icon(ic, "nb-icon nb-icon--sm")),
            i * 6 + '<p class="nb-notif__title">%s%s<time class="nb-notif__time" datetime="%s">%s</time></p>' % (
                '<span class="nb-sr-only nb-notif__state">Belum dibaca. </span>' if unread else "", esc(text), dt, ago),
            i * 5 + '</li>',
        ]
    notif_link = ""
    if exists("notifications"):
        notif_link = ' <a href="%s%s">Lihat semua</a>' % (prefix, BY_KEY["notifications"][1])
    out += [
        i * 4 + '</ul>',
        i * 4 + '<p class="nb-popover__footer">Notifikasi contoh — tidak tersambung ke server.%s</p>' % notif_link,
        i * 3 + '</div>',
        i * 2 + '</div>',
        '',
        i * 2 + '<div class="nb-dropdown" data-dropdown>',
        i * 3 + '<button class="nb-user-btn" type="button" data-dropdown-trigger aria-haspopup="menu" aria-expanded="false" aria-controls="nb-user-menu">',
        i * 4 + '<span class="nb-avatar" aria-hidden="true">RA</span>',
        i * 4 + '<span class="nb-user-btn__text"><strong>Rani Ardiani</strong><small>Administrator</small></span>',
        i * 4 + icon("chevron-down", "nb-icon nb-icon--sm"),
        i * 3 + '</button>',
        i * 3 + '<div class="nb-menu" id="nb-user-menu" role="menu" aria-label="Menu akun" hidden>',
        i * 4 + '<div class="nb-menu__header" role="presentation"><strong>Rani Ardiani</strong><span>rani@example.com</span></div>',
    ]
    menu = [("profile", "user", "Profil saya"), ("settings", "settings", "Pengaturan"),
            ("dashboard", "home", "Ringkasan"), ("index", "grid", "Katalog halaman")]
    for k, ic, lbl in menu:
        if exists(k):
            out.append(i * 4 + '<a class="nb-menu__item" role="menuitem" href="%s%s">%s%s</a>' % (
                prefix, BY_KEY[k][1], icon(ic, "nb-icon nb-icon--sm"), lbl))
    out += [
        i * 4 + '<hr class="nb-menu__sep">',
        i * 4 + '<button class="nb-menu__item nb-menu__item--danger" type="button" role="menuitem" data-toast="Keluar (demo)" data-toast-message="Tidak ada sesi login nyata — ini template statis." data-toast-type="info">%sKeluar</button>' % icon("logout", "nb-icon nb-icon--sm"),
        i * 3 + '</div>',
        i * 2 + '</div>',
        i + '</div>',
        '</header>',
    ]
    return out


# ---------------------------------------------------------------------------
# index.html: progres & katalog
# ---------------------------------------------------------------------------
def phase_status():
    status = {}
    started_next = False
    for code, _ in PHASES:
        keys = [p[0] for p in PAGES if p[5] == code]
        done = sum(1 for k in keys if exists(k))
        if keys and done == len(keys):
            status[code] = ("Selesai", "success")
        elif done:
            status[code] = ("Berjalan", "warning")
        elif not started_next:
            status[code] = ("Berikutnya", "")
            started_next = True
        else:
            status[code] = ("Antre", "")
    return status


def build_progress(prefix):
    total = len(PAGES)
    done = sum(1 for p in PAGES if exists(p[0]))
    status = phase_status()
    current = next((c for c, _ in PHASES if status[c][0] != "Selesai"), "F")
    pct = round(done * 100.0 / total, 1)
    i = "  "
    out = [
        '<div class="nb-hero__panel nb-launch-progress">',
        i + '<div class="nb-hero__panel-head">',
        i * 2 + '<span class="nb-kpi__label" id="progress-label">Progres pembangunan</span>',
        i * 2 + '<span class="nb-badge nb-badge--warning nb-badge--dot">Phase %s</span>' % current,
        i + '</div>',
        i + '<p class="nb-launch-progress__num">%d<small style="font-size: var(--fs-xl)"> / %d halaman</small></p>' % (done, total),
        i + '<div class="nb-progress" role="progressbar" aria-labelledby="progress-label" aria-valuemin="0" aria-valuemax="%d" aria-valuenow="%d" aria-valuetext="%d dari %d halaman selesai">' % (total, done, done, total),
        i * 2 + '<div class="nb-progress__bar" style="--value: %s%%; --progress-color: var(--color-yellow)"></div>' % pct,
        i + '</div>',
        i + '<ol class="nb-phase-list">',
    ]
    for code, name in PHASES:
        label, mod = status[code]
        cls = "nb-badge" + (" nb-badge--" + mod if mod else "")
        out.append(i * 2 + '<li><span>%s · %s</span><span class="%s">%s</span></li>' % (code, esc(name), cls, label))
    out += [i + '</ol>', '</div>']
    return out


def build_catalog(prefix):
    i = "  "
    out = ['<div class="nb-grid nb-grid--3">']
    for title, ic, color, keys in CATALOG:
        ready = sum(1 for k in keys if exists(k))
        phases = sorted({BY_KEY[k][5] for k in keys})
        out += [
            i + '<article class="nb-card nb-category">',
            i * 2 + '<header class="nb-card__header">',
            i * 3 + '<div class="nb-category__head">',
            i * 4 + '<span class="nb-category__icon" style="background: var(--color-%s)" aria-hidden="true">%s</span>' % (color, '<svg class="nb-icon"><use href="#i-%s"></use></svg>' % ic),
            i * 4 + '<div><h3 class="nb-card__title">%s</h3><p class="nb-card__subtitle">%d dari %d siap · Phase %s</p></div>' % (
                esc(title), ready, len(keys), "/".join(phases)),
            i * 3 + '</div>',
            i * 2 + '</header>',
            i * 2 + '<ul class="nb-page-list">',
        ]
        for k in keys:
            _, path, label, _, _, phase, _ = BY_KEY[k]
            label = CATALOG_LABEL.get(k, label)
            if exists(k):
                out.append(i * 3 + '<li><a class="nb-page-list__item" href="%s%s"><span><span class="nb-page-list__name">%s</span><span class="nb-page-list__file">%s</span></span><span class="nb-badge nb-badge--success">Siap</span></a></li>' % (
                    prefix, path, esc(label), path))
            else:
                out.append(i * 3 + '<li><span class="nb-page-list__item"><span>%s<span class="nb-page-list__file">%s</span></span><span class="nb-badge">Phase %s</span></span></li>' % (
                    esc(label), path, phase))
        out += [i * 2 + '</ul>', i + '</article>']
    out.append('</div>')
    return out


# ---------------------------------------------------------------------------
def replace_block(text, name, lines):
    pat = re.compile(r"([ \t]*)<!-- nb:%s -->.*?<!-- /nb:%s -->" % (name, name), re.S)
    m = pat.search(text)
    if not m:
        return text, False
    ind = m.group(1)
    body = "\n".join((ind + l) if l else "" for l in lines)
    new = "%s<!-- nb:%s -->\n%s\n%s<!-- /nb:%s -->" % (ind, name, body, ind, name)
    return text[: m.start()] + new + text[m.end():], True


def main():
    check = "--check" in sys.argv
    changed = []
    for entry in PAGES:
        path = entry[1]
        full = os.path.join(ROOT, path)
        if not os.path.isfile(full):
            continue
        prefix = "../" * path.count("/")
        with open(full, encoding="utf-8") as f:
            text = f.read()
        orig = text
        text, _ = replace_block(text, "sidebar", build_sidebar(prefix))
        text, _ = replace_block(text, "topbar", build_topbar(entry, prefix))
        text, _ = replace_block(text, "crumbs", build_crumbs(entry, prefix))
        if entry[0] == "index":
            text, _ = replace_block(text, "progress", build_progress(prefix))
            text, _ = replace_block(text, "catalog", build_catalog(prefix))
        # Item sidebar yang disorot: halaman turunan memakai key induknya.
        nav_key = entry[6] or entry[0]
        text = re.sub(r'(<body[^>]*\bdata-page=")[^"]*(")', r"\g<1>%s\2" % nav_key, text, count=1)
        if text != orig:
            changed.append(path)
            if not check:
                with open(full, "w", encoding="utf-8") as f:
                    f.write(text)
    done = sum(1 for p in PAGES if exists(p[0]))
    verb = "Berbeda" if check else "Diperbarui"
    print("%s: %s" % (verb, ", ".join(changed) if changed else "(tidak ada)"))
    print("Halaman tersedia: %d / %d" % (done, len(PAGES)))
    return 1 if (check and changed) else 0


if __name__ == "__main__":
    sys.exit(main())
