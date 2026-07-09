// ============================================================================
// Google Apps Script — backend "database" untuk web Running Test.
// Deploy: Extensions > Apps Script > paste > Deploy > New deployment >
//   type Web app, Execute as: Me, Who has access: Anyone.
// Copy URL Web App ke config.js (RT_SHEET_WEBHOOK_URL).
// ============================================================================

// --- SESUAIKAN dengan posisi cell grid KFS di template kamu ---------------
// Grid 4 baris x 3 kolom. A1 notation. Ganti kalau posisi di sheet beda.
var KFS_SERING_A1 = 'U31:W34';      // "Letakan KFS (Yang sering dipakai)"
var KFS_KELEMAHAN_A1 = 'Y31:AA34';  // "Kelemahan Posisi KFS"

// Blok match: judul "MATCH n" ada di kolom A, mulai baris 28, tiap blok 33 baris.
var MATCH_FIRST_ROW = 28;
var MATCH_ROW_STRIDE = 33;
var MATCH_SCAN_LIMIT = 200;         // batas aman, biar gak loop selamanya
// --------------------------------------------------------------------------

// Hitung jumlah blok match dari isi kolom A: berhenti di blok kosong pertama.
// Sekali baca kolom A, jangan getValue() per blok (dipanggil tiap poll).
function countMatches(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < MATCH_FIRST_ROW) return 0;
  var colA = sheet.getRange(MATCH_FIRST_ROW, 1, lastRow - MATCH_FIRST_ROW + 1, 1).getValues();
  var n = 0;
  while (n < MATCH_SCAN_LIMIT) {
    var i = n * MATCH_ROW_STRIDE;
    if (i >= colA.length) break;
    if (!String(colA[i][0]).trim()) break;
    n++;
  }
  return n;
}

function getTeamSheet(ss, teamName, createIfMissing) {
  var sheet = ss.getSheetByName(teamName);
  if (!sheet && createIfMissing) {
    var template = ss.getSheetByName('Template');
    sheet = template.copyTo(ss).setName(teamName);
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(ss.getNumSheets());
  }
  return sheet;
}

function readGrid(sheet, a1) {
  var values = sheet.getRange(a1).getValues();
  return values.map(function (row) {
    return row.map(function (cell) { return cell === null || cell === undefined ? '' : String(cell); });
  });
}

function writeGrid(sheet, a1, grid) {
  var range = sheet.getRange(a1);
  var rows = range.getNumRows();
  var cols = range.getNumColumns();
  var out = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      row.push((grid[r] && grid[r][c]) ? grid[r][c] : '');
    }
    out.push(row);
  }
  range.setValues(out);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET ?type=teams            -> daftar nama tab (kecuali Template) untuk dropdown.
// GET ?type=kfs-sync&tim=TAB -> baca grid KFS + jumlah match dari tab.
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var type = e.parameter.type;

  if (type === 'teams') {
    var tabs = ss.getSheets()
      .map(function (s) { return s.getName(); })
      .filter(function (name) { return name !== 'Template'; });
    return json({ status: 'ok', tabs: tabs });
  }

  if (type === 'kfs-sync') {
    var teamName = e.parameter.tim || '';
    var sheet = getTeamSheet(ss, teamName, false);
    if (!sheet) return json({ status: 'no-tab' });
    return json({
      status: 'ok',
      matchCount: countMatches(sheet),
      kfsSeringGrid: readGrid(sheet, KFS_SERING_A1),
      kfsKelemahanGrid: readGrid(sheet, KFS_KELEMAHAN_A1)
    });
  }

  return json({ status: 'ok' });
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);

  // Sync grid KFS (dua arah) -> tulis ke cell tetap, bukan append row.
  if (data.type === 'kfs-sync') {
    var sheet = getTeamSheet(ss, data.tab || data.namaTim || 'Unknown', true);
    writeGrid(sheet, KFS_SERING_A1, data.kfsSeringGrid || []);
    writeGrid(sheet, KFS_KELEMAHAN_A1, data.kfsKelemahanGrid || []);
    return json({ status: 'ok' });
  }

  // Tulis satu cell (match live). { tab, range, value }
  if (data.type === 'cell-write') {
    var cwSheet = getTeamSheet(ss, data.tab || 'Unknown', true);
    if (!data.range) return json({ status: 'error', message: 'no range' });
    cwSheet.getRange(data.range).setValue(data.value == null ? '' : data.value);
    return json({ status: 'ok' });
  }

  // Default: append satu row log run (tombol "Kirim ke Sheet").
  var rt = data;
  var logSheet = getTeamSheet(ss, rt.tab || rt.namaTim || 'Unknown', true);
  var r1 = rt.run.r1;
  var r2 = rt.run.r2;
  logSheet.appendRow([
    new Date(),
    rt.universitas,
    rt.namaTim,
    rt.dominan,
    rt.kfm.terambil + ' / ' + rt.kfm.total,
    r1.staf.terambil + ' / ' + r1.staf.total,
    r1.waktuStaf, r1.waktuAssembly,
    r1.storageSpear, r1.storageKfs,
    r1.waktuMasukArena, r1.kesusahanIndex,
    r1.waktuForestArena, r1.urutanRak.join(','), r1.waktuTaruhRak,
    r1.waktuRetryZona3, r1.tusukRow, r1.deltaAngkatR2,
    r2.spearhead.terambil + ' / ' + r2.spearhead.total,
    r2.seringIndexSpearhead, r2.waktuSpearhead,
    r2.storageKfs, r2.waktuForest, r2.deltaForest, r2.seringErrorIndex,
    r2.waktuMasukArena, r2.urutanRak.join(','), r2.waktuTaruhRak
  ]);

  return json({ status: 'ok' });
}
