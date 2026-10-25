/* ==========================================================================
   BLOK data.js — data contoh fiktif untuk chart & widget.
   Semua data bersifat demo; tidak ada koneksi ke server/database.
   ========================================================================== */
(function () {
  "use strict";

  var NB = (window.NB = window.NB || {});

  NB.data = {
    /* Peminjaman aset per rentang waktu. */
    loans: {
      "7h": {
        caption: "7 hari terakhir",
        unit: "peminjaman",
        labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
        values: [18, 24, 21, 31, 27, 9, 6],
        onTime: 94
      },
      "30h": {
        caption: "30 hari terakhir",
        unit: "peminjaman",
        labels: ["25 Sep", "30 Sep", "5 Okt", "10 Okt", "15 Okt", "20 Okt"],
        values: [62, 74, 58, 91, 86, 79],
        onTime: 91
      },
      "12b": {
        caption: "12 bulan terakhir",
        unit: "peminjaman",
        labels: ["Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
        values: [212, 168, 236, 251, 274, 238, 262, 190, 176, 318, 344, 331],
        onTime: 89
      }
    },

    /* Komposisi kategori aset (total = KPI "Total aset"). */
    categories: [
      { label: "Elektronik", value: 412, color: "yellow" },
      { label: "Furnitur", value: 356, color: "sage" },
      { label: "Alat laboratorium", value: 248, color: "lavender" },
      { label: "Peralatan olahraga", value: 140, color: "pink" },
      { label: "Kendaraan & lainnya", value: 128, color: "blue" }
    ],

    /* Tingkat pemakaian ruang (%) per bulan — dipakai line chart. */
    utilization: {
      caption: "Mei–Okt 2026",
      unit: "%",
      axisSuffix: "%",
      max: 100,
      labels: ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
      series: [
        { name: "Ruang rapat", values: [58, 52, 47, 69, 78, 74] },
        { name: "Laboratorium", values: [41, 36, 30, 55, 63, 67], alt: true }
      ]
    },

    /* Phase D — analitik: rasio pengajuan disetujui & kembali tepat waktu (%). */
    conversion: {
      caption: "Mei–Okt 2026",
      unit: "%",
      axisSuffix: "%",
      max: 100,
      labels: ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
      series: [
        { name: "Pengajuan disetujui", values: [81, 83, 80, 86, 85, 84] },
        { name: "Kembali tepat waktu", values: [88, 90, 87, 92, 91, 89], alt: true }
      ]
    },

    /* Peminjaman Oktober per unit peminjam (total 331 = bar "Okt" di 12b). */
    loansByUnit: [
      { label: "Laboratorium", value: 118, color: "lavender" },
      { label: "Kesiswaan & olahraga", value: 72, color: "pink" },
      { label: "Humas", value: 64, color: "yellow" },
      { label: "Tata Usaha", value: 41, color: "sage" },
      { label: "Unit lain", value: 36, color: "blue" }
    ],

    /* Phase D — laporan: tiket perawatan per bulan; onTime = selesai sesuai SLA. */
    tickets: {
      "6b": {
        caption: "6 bulan terakhir",
        unit: "tiket",
        labels: ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
        values: [17, 12, 9, 21, 19, 14],
        onTime: 86
      },
      "12b": {
        caption: "12 bulan terakhir",
        unit: "tiket",
        labels: ["Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
        values: [15, 11, 18, 16, 20, 13, 17, 12, 9, 21, 19, 14],
        onTime: 84
      }
    },

    /* Biaya perawatan per kategori, Okt 2026 (juta rupiah) — donut laporan. */
    maintenanceCost: [
      { label: "Elektronik", value: 46, color: "yellow" },
      { label: "Peralatan olahraga", value: 31, color: "pink" },
      { label: "Alat laboratorium", value: 18, color: "lavender" },
      { label: "Furnitur", value: 9, color: "sage" }
    ]
  };
})();
