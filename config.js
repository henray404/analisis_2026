// Isi URL asli di sini. File ini di-gitignore, gak ke-commit.
var CONFIG = {
  RT_SHEET_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbzoXTIBhiD8Kvzkz7RwkZgLCD7hNTqvD-d77q4DrFTzh2uq3vIpu5hOGQzBjWUNo5Sz/exec',

  // ── Match live cell-write ────────────────────────────────────────────
  // Semua range = alamat utk MATCH 1.
  // Blok MATCH 1 = baris 28..57, lalu 3 baris kosong, MATCH 2 mulai baris 61.
  //   match N = baris + (N-1)*MATCH_ROW_STRIDE   (30 baris blok + 3 baris gap)
  // Merah/Biru bukan blok terpisah: cuma isi cell `sisi`.
  // Range kosong ('') = tombol itu gak ngirim apa-apa (aman, gak nimpa).
  // Jumlah slot = panjang array (boleh beda-beda ukuran cell).
  MATCH: {
    MATCH_MAX: 10,              // cadangan; angka aslinya dibaca dari sheet (matchCount)
    MATCH_ROW_STRIDE: 33,

    defs: {
      sisi: 'B28:T29',              // ditulis 'merah' / 'biru'

      // Peluang keberhasilan per mekanisme. Cell 2 baris: berhasil atas, total bawah.
      peluangR1: {
        staff: 'C8:C9', assembly: 'D8:D9', ngambilKfs: 'E8:E9',
        storageKfs: 'F8:F9', masukKfs: 'G8:G9', naikR2: 'H8:H9'
      },
      peluangR2: {
        spearhead: 'C18:C19', assembly: 'D18:D19', naik: 'E18:E19', ngambilKfs: 'F18:F19',
        storageKfs: 'G18:G19', masukKfs: 'H18:H19', naikR1: 'I18:I19'
      },

      // Arena 1 — Martial Club
      staff: ['A40:A41', 'A42:A43', 'A44:A45', 'A46:A47'],          // STAFF R1
      head: ['B40:B41', 'B42:B43', 'B44:B45', 'B46:B47'],           // HEAD R2
      assembly: ['A50:B51', 'A52:B53', 'A54:B55', 'A56:B57'],       // ASSEMBLY SPEARHEAD

      // Arena 2 — Meihua Forest
      masukMF: ['D38:D39', 'D40:D41', 'D42:D43', 'D44:D45', 'D46:D47',
                'D48:D49', 'D50:D51', 'D52:D53', 'D54:D55', 'D56:D57'],
      masukMFR2: ['E38:E39', 'E40:E41', 'E42:E43', 'E44:E45', 'E46:E47',
                  'E48:E49', 'E50:E51', 'E52:E53', 'E54:E55', 'E56:E57'],

      // Arena 3 — Tic Tac Toe
      arena: ['H39', 'H40', 'H41', 'H42'],                          // MASUK ARENA 3 R1
      arenaR2: ['I39', 'I40', 'I41', 'I42'],                        // MASUK ARENA 3 R2

      // Penempatan KFS 3x3 (kiri-atas -> kanan-bawah), tiap cell 5 baris
      pks: [
        'G43:G47', 'H43:H47', 'I43:I47',
        'G48:G52', 'H48:H52', 'I48:I52',
        'G53:G57', 'H53:H57', 'I53:I57'
      ],

      // Retry gak punya range sendiri: nulis ke slot berikutnya di range aksinya,
      // isinya "waktu\nRETRY".

      // Poin per arena
      poinArena1: 'Z48:AB49',
      poinArena2: 'AC48:AE49',
      poinArena3: 'AF48:AH49'
    }
  }
};
