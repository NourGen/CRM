/*  BSA — Monthly Backup  ────────────────────────────────────────────────
 *  Add this as a NEW file in the Apps Script project (e.g. "Backup.gs").
 *  It does NOT need a deployment — it runs from the editor / a time trigger.
 *
 *  SETUP (one time):
 *    1) Paste this file into the Apps Script project.
 *    2) Run  setupMonthlyBackupTrigger  once (authorize when asked).
 *       → from then on it backs up automatically on day 1 of every month ~2 AM.
 *    3) (Optional) Run  runBackupNow  any time to take a backup immediately.
 *
 *  WHERE IT SAVES:  Google Drive → "BSA Backups" → "YYYY-MM" → dated copies of
 *  all 4 system spreadsheets (Master = data + الأقساط + الكوميشن, Distribution,
 *  Payment, Invoice). You can download any of them as Excel from Drive anytime.
 * ───────────────────────────────────────────────────────────────────────── */

// The 4 spreadsheets the system uses. (Same IDs as in the main Code file.)
function _bsaBackupTargets() {
  return [
    { name: 'Master (Data+Aqsat+Commission)', id: '1qUKUQl4c_yyXdwIxJ3b8a3o49iIVvAiOkbGOAspdm_U' },
    { name: 'Distribution (Fresh Leads)',      id: '1FwFRDdwLApEeSiCGt-JnwnbKapmt9HmmP6xjTb4sLlg' },
    { name: 'Payment',                          id: '11yy2wJy6HWsrPVY3DoVDusi8K4NYKOoisEwYVejPG_M' },
    { name: 'Invoice',                          id: '1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA' }
  ];
}

function _bsaGetOrCreateFolder(parent, folderName) {
  var it = parent.getFoldersByName(folderName);
  return it.hasNext() ? it.next() : parent.createFolder(folderName);
}

// Main backup routine — copies every target spreadsheet into Drive/BSA Backups/YYYY-MM
function monthlyBackupAllData() {
  var tz    = Session.getScriptTimeZone() || 'GMT';
  var stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');   // file suffix
  var month = Utilities.formatDate(new Date(), tz, 'yyyy-MM');      // subfolder

  var root      = _bsaGetOrCreateFolder(DriveApp.getRootFolder(), 'BSA Backups');
  var monthFold = _bsaGetOrCreateFolder(root, month);

  var done = [], failed = [];
  _bsaBackupTargets().forEach(function (t) {
    try {
      var file = DriveApp.getFileById(t.id);
      file.makeCopy(t.name + ' — ' + stamp, monthFold);
      done.push(t.name);
    } catch (e) {
      failed.push(t.name + ' (' + e.toString() + ')');
    }
  });

  // email a summary + link to whoever owns/runs the script
  try {
    var to = Session.getEffectiveUser().getEmail();
    if (to) {
      MailApp.sendEmail(
        to,
        '✅ BSA Backup — ' + stamp,
        'تم أخذ النسخة الاحتياطية الشهرية.\n\n' +
        'نجح: ' + (done.join(' | ') || '—') + '\n' +
        (failed.length ? 'فشل: ' + failed.join(' | ') + '\n' : '') +
        '\nالمكان: Google Drive → BSA Backups → ' + month + '\n' +
        'الرابط: ' + monthFold.getUrl()
      );
    }
  } catch (mailErr) { /* email is best-effort */ }

  Logger.log('Backup done: ' + done.join(', ') + (failed.length ? ' | FAILED: ' + failed.join(', ') : ''));
  return { success: failed.length === 0, done: done, failed: failed, folder: monthFold.getUrl() };
}

// Run this ONCE to schedule the automatic monthly backup (day 1 of each month, ~2 AM).
function setupMonthlyBackupTrigger() {
  // remove any previous copy of this trigger first (avoid duplicates)
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'monthlyBackupAllData') ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('monthlyBackupAllData')
    .timeBased().onMonthDay(1).atHour(2).create();
  return '✅ تم تفعيل الباك أب الشهري التلقائي (أول كل شهر الساعة 2 صباحاً).';
}

// Manual: take a backup right now.
function runBackupNow() { return monthlyBackupAllData(); }
