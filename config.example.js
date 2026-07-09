// Copy jadi config.js, isi URL asli, jangan commit config.js.
var CONFIG = {
  RT_SHEET_WEBHOOK_URL: '',

  // ── Match live cell-write ────────────────────────────────────────────
  // Semua range di bawah = alamat utk MATCH 1.
  //   match N = baris + (N-1)*MATCH_ROW_STRIDE   (tinggi blok + baris kosong antar blok)
  // Merah/Biru bukan blok terpisah: cuma isi cell `sisi`.
  // Range kosong ('') = tombol itu gak ngirim apa-apa (aman, gak nimpa).
  // Jumlah slot = panjang array. Tiap cell boleh beda ukuran.
  MATCH: {
    MATCH_MAX: 10,              // cadangan; angka aslinya dibaca dari sheet (matchCount)
    MATCH_ROW_STRIDE: 33,

    defs: {
      sisi: '',                         // cell penanda merah/biru. contoh: 'B28:T29'

      // Arena 1 — Martial Club
      staff: ['', '', '', ''],          // STAFF R1. contoh: 'A40:A41'
      head: ['', '', '', ''],           // HEAD R2
      assembly: ['', '', '', ''],       // ASSEMBLY SPEARHEAD

      // Arena 2 — Meihua Forest
      masukMF: ['', '', '', '', '', '', '', '', '', ''],    // MASUK MF R1
      masukMFR2: ['', '', '', '', '', '', '', '', '', ''],  // MASUK MF R2

      // Arena 3 — Tic Tac Toe
      arena: ['', '', '', ''],          // MASUK ARENA 3 R1
      arenaR2: ['', '', '', ''],        // MASUK ARENA 3 R2

      // Penempatan KFS 3x3, kiri-atas -> kanan-bawah
      pks: [
        '', '', '',
        '', '', '',
        '', '', ''
      ],

      // Retry gak punya range sendiri: nulis ke slot berikutnya di range aksinya,
      // isinya "waktu\nRETRY".

      // Poin per arena (input angka)
      poinArena1: '',
      poinArena2: '',
      poinArena3: ''
    }
  }
};
