# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.
Formatnya mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/), dan versinya mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Ditambahkan
- **Integrasi Laravel** (`documentation/laravel.html`, menu baru *Integrasi*): panduan memasang BLOK di Laravel 11/12 dengan struktur modular.
  - Isinya: penyalinan aset, `ModuleServiceProvider` (rute, view, migrasi, dan menu per modul), layout Blade, komponen `x-blok.field`/`x-blok.alert`, jembatan `data-server-submit` untuk form, toast dari flash session, view paginasi, chart dari data server, Fortify, dan halaman error.
  - Dilengkapi contoh modul Aset.

## [1.0.0] - 2026-10-25

Rilis publik pertama, dengan 47 halaman.

### Ditambahkan
- **Fondasi:**
  - design token (`tokens.css`), reset, layout aplikasi
  - sidebar yang bisa diciutkan dan berubah menjadi drawer di mobile
  - topbar dengan pencarian halaman, notifikasi, dan menu pengguna
  - breadcrumb dan katalog halaman
- **Dashboard:** Ringkasan, Analitik, dan Operasional, dengan KPI dan chart SVG tanpa library.
- **Pustaka komponen (14 halaman):**
  - tombol, kartu, badge, alert dan toast, modal dan drawer, dropdown dan popover
  - tab dan akordeon, navigasi, tabel, formulir, chart, timeline
  - empty/loading state, ikon dan tipografi
- **Demo CRUD:**
  - aset (daftar, tambah, ubah, detail), pengguna, ruangan, peminjaman, perawatan
  - tabel bisa diurutkan, difilter, dan dipaginasi
  - validasi form, wizard, serta konfirmasi hapus
- **Halaman bisnis:** kanban tugas, kalender bulanan, laporan (siap cetak), notifikasi, profil, pengaturan (preferensi tampilan), harga, dan pusat bantuan.
- **Autentikasi (demo visual):** masuk, daftar dengan meter kekuatan kata sandi, lupa kata sandi dengan hitung mundur kirim ulang, dan atur ulang kata sandi.
- **Halaman error:** 403, 404 (dengan pencarian halaman), dan 500 (dengan kode referensi yang bisa disalin).
- **Dokumentasi HTML:** panduan mulai, indeks komponen, design token, API JavaScript, dan aksesibilitas.
- **Alat:**
  - `tools/sync-shell.py` untuk sinkronisasi shell dan katalog
  - `tools/qa/check-static.py` untuk pemeriksaan statis
  - `tools/qa/sweep.js` untuk uji browser di 5 lebar layar
- **Aksesibilitas:**
  - target WCAG AA dan navigasi keyboard penuh
  - fokus terkunci di modal, pengumuman lewat `aria-live`
  - dukungan `prefers-reduced-motion` dan stylesheet print

[Unreleased]: https://github.com/ranitachi/blok-admin-ui-kit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ranitachi/blok-admin-ui-kit/releases/tag/v1.0.0
