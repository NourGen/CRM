// ==========================================
// BSA Academy CRM - Code.gs v3.0
// ==========================================

function getSystemSetting(key, defaultValue) {
  try {
    var val = PropertiesService.getScriptProperties().getProperty(key);
    return val !== null ? val : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveSystemSetting(key, value) {
  try {
    PropertiesService.getScriptProperties().setProperty(key, value);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * SHA-256 hash of a password string.
 * Returns hex string (64 chars). Used for secure password storage.
 * Fallback: returns trimmed plain text if Utilities throws.
 */
function hashPassword(password) {
  try {
    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password.toString().trim(),
      Utilities.Charset.UTF_8
    );
    return bytes.map(function(b) {
      return ('0' + (b & 0xff).toString(16)).slice(-2);
    }).join('');
  } catch(e) {
    return password.toString().trim();
  }
}

var DISTRIBUTION_SHEET_ID = getSystemSetting("distributionSheetId", "1FwFRDdwLApEeSiCGt-JnwnbKapmt9HmmP6xjTb4sLlg");
var MASTER_SHEET_ID = getSystemSetting("masterSheetId", "1qUKUQl4c_yyXdwIxJ3b8a3o49iIVvAiOkbGOAspdm_U");
var PAYMENT_SHEET_ID = getSystemSetting("paymentSheetId", "11yy2wJy6HWsrPVY3DoVDusi8K4NYKOoisEwYVejPG_M");
var INVOICE_FORM_ID = "1FAIpQLSfukExqn6rQYzDRcoEd5j6C8EwtmqrWkYHkLkyYGP4sul0Www";

// range لكل سيلز في شيت الفريش
// startCol = 1-based, nameCol = offset من startCol
var AGENT_RANGES = {
  "Asmaa": { startRow: 3, endRow: 32, startCol: 2 },
  "Nour": { startRow: 34, endRow: 63, startCol: 2 },
  "Ansam": { startRow: 3, endRow: 32, startCol: 10 },
  "Habiba": { startRow: 34, endRow: 63, startCol: 10 },
  "Omar": { startRow: 65, endRow: 94, startCol: 10 }
};

// col offsets داخل كل range (0-based)
// 0=ليد تجريبي, 1=تم السحب, 2=تليفون, 3=مصدر, 4=منطقة, 5=نوع إعلان, 6=كورس
var COL_PULLED = 1;
var COL_PHONE = 2;
var COL_SOURCE = 3;
var COL_REGION = 4;
var COL_CAMP = 5;
var COL_COURSE = 6;

// صفحات النظام وأسماؤها
var ALL_PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "pull-fresh", label: "سحب فريش" },
  { id: "pull-recycle", label: "ريسيكل" },
  { id: "add-manual", label: "إضافة يدوي" },
  { id: "log-call", label: "تسجيل مكالمة" },
  { id: "search", label: "البحث" },
  { id: "followups", label: "Follow Ups" },
  { id: "my-leads", label: "عملائي" },
  { id: "waiting-list", label: "قائمة الانتظار" },
  { id: "tasks", label: "المهام" },
  { id: "payments", label: "Client Payments" },
  { id: "rounds", label: "الروندات" },
  { id: "attendance", label: "الحضور والتاسكات" },
  { id: "invoice", label: "الفواتير" },
  { id: "reports", label: "تقارير الأداء" },
  { id: "financial", label: "الكوميشن الشهري" },
  { id: "payment-gateway", label: "بوابة الدفع" },
  { id: "admin-users", label: "إدارة المستخدمين" },
  { id: "admin-leads", label: "كل الليدات" },
  { id: "admin-settings", label: "الإعدادات" },
  { id: "admin-log", label: "سجل النشاط" },
  { id: "academy-ledger", label: "دفتر الحسابات الرئيسي" },
  { id: "fresh-lead-manual", label: "تنزيل ليد فريش" },
  { id: "academy-mgmt", label: "إدارة الأكاديمية" }
];

// ==========================================
// WEB APP
// ==========================================
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  if (params.portal === 'academy') {
    var attendParam = (params.attend || '').toString().replace(/[^A-Za-z0-9_:\-]/g, '');
    if (attendParam) {
      var html = HtmlService.createHtmlOutputFromFile('Academy').getContent();
      html = html.replace('<head>', '<head><script>window._bsaAtt="' + attendParam + '";<' + '/script>');
      return HtmlService.createHtmlOutput(html)
        .setTitle('BSA Academy — بوابة الطلاب')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return HtmlService.createHtmlOutputFromFile('Academy')
      .setTitle('BSA Academy — بوابة الطلاب')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('BSA Academy CRM')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function showSidebar() {
  var url = ScriptApp.getService().getUrl();
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank");google.script.host.close();</script>'
  ).setWidth(1).setHeight(1);
  SpreadsheetApp.getUi().showModalDialog(html, '...');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏛️ سيستم الأكاديمية')
    .addItem('📱 فتح لوحة التحكم', 'showSidebar')
    .addItem('🔄 تهيئة ومزامنة الدفتر الشامل', 'menuSyncAllToLedger')
    .addItem('🛠️ إعداد مانع تكرار الفواتير', 'setupFormSubmitTrigger')
    .addItem('🔧 تصحيح وتسكين عملاء السيلز (بدل المدير)', 'fixManagerClientAssignments')
    .addItem('🔀 ترحيل OC Codes من M إلى N (مرة واحدة)', 'migrateRawDataOcCodesMenu')
    .addItem('🔧 إصلاح تكرار معرفات العملاء في السيستم', 'repairDuplicateIdsMenu')
    .addToUi();
  
  // Auto-setup trigger and sweep corrupted invoice rows
  try {
    setupFormSubmitTriggerSilent();
    cleanupCorruptedInvoiceRows();
    initRawDataColumns(); // Ensure Raw_Data schema has OC_Code column N
  } catch(e) {}
}

// ==========================================
// RAW_DATA SCHEMA INIT
// ==========================================
function initRawDataColumns() {
  try {
    var sh = getSheet("Raw_Data");
    if (!sh) return;
    var headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 15)).getValues()[0];
    // Column L (index 11) = Follow Up Date
    // Column M (index 12) = Campaign_Type
    // Column N (index 13) = LastModified
    // Column O (index 14) = OC CODE
    var colMHeader = (headers[12] || "").toString().trim();
    var colNHeader = (headers[13] || "").toString().trim();
    var colOHeader = (headers[14] || "").toString().trim();
    
    if (!colMHeader || colMHeader === "") {
      sh.getRange(1, 13).setValue("Campaign_Type");
    }
    if (!colNHeader || colNHeader === "") {
      sh.getRange(1, 14).setValue("LastModified");
    }
    if (!colOHeader || colOHeader === "") {
      sh.getRange(1, 15).setValue("OC CODE");
    }
  } catch(e) {
    Logger.log("initRawDataColumns error: " + e.toString());
  }
}

// ==========================================
// RAW_DATA MIGRATION - نقل OC Code من M/N إلى O
// ==========================================
function migrateRawDataOcCodes() {
  try {
    var sh = getSheet("Raw_Data");
    if (!sh) return { success: false, message: "Raw_Data sheet not found" };
    var data = sh.getDataRange().getValues();
    var migrated = 0;
    var updates = [];
    
    for (var i = 1; i < data.length; i++) {
      var colM = (data[i][12] || "").toString().trim(); // Campaign_Type (col M)
      var colN = (data[i][13] || "").toString().trim(); // LastModified/Legacy OC (col N)
      var colO = (data[i][14] || "").toString().trim(); // OC CODE (col O)
      
      // If col M has an OC code (starts with OC-) and col O is empty/not OC-
      if (colM && colM.toLowerCase().indexOf("oc-") === 0 && !(colO && colO.toLowerCase().indexOf("oc-") === 0)) {
        updates.push({ row: i + 1, ocCode: colM, clearCol: 13 });
        migrated++;
      }
      // If col N has legacy OC code and col O is empty/not OC-
      else if (colN && colN.toLowerCase().indexOf("oc-") === 0 && !(colO && colO.toLowerCase().indexOf("oc-") === 0)) {
        updates.push({ row: i + 1, ocCode: colN, clearCol: 14 });
        migrated++;
      }
    }
    
    // Apply updates in batch
    for (var u = 0; u < updates.length; u++) {
      sh.getRange(updates[u].row, 15).setValue(updates[u].ocCode); // Col O = OC CODE
      if (updates[u].clearCol) {
        sh.getRange(updates[u].row, updates[u].clearCol).setValue(""); // Clear legacy column
      }
    }
    
    // Ensure headers
    initRawDataColumns();
    
    return { success: true, message: "✅ تم نقل " + migrated + " كود OC إلى عمود O (OC CODE) في Raw_Data" };
  } catch(e) {
    return { success: false, message: "❌ خطأ: " + e.toString() };
  }
}

// Menu wrapper for migration
function migrateRawDataOcCodesMenu() {
  var result = migrateRawDataOcCodes();
  SpreadsheetApp.getUi().alert(result.message);
}

// ==========================================
// HELPERS
// ==========================================
// Bug #3 Fix: using a lock-aware cache mechanism to avoid concurrent read conflicts.
var ssCache = {};
function openSpreadsheetCached(id) {
  if (!id) return null;
  var idStr = id.toString().trim();
  if (!ssCache[idStr]) {
    ssCache[idStr] = SpreadsheetApp.openById(idStr);
  }
  return ssCache[idStr];
}

var _requestCache = null;
var _rawDataColumnsChecked = false; // performance: skip ensureRawDataColumns after first call
var _finSheetInitialized = false;   // performance: skip initFinancialSheet after first call
function getSheetDataCached(sheetName) {
  if (!_requestCache) _requestCache = {};
  if (!_requestCache[sheetName]) {
    var sh = getSheet(sheetName);
    if (!sh) return [];
    _requestCache[sheetName] = sh.getDataRange().getValues();
  }
  return _requestCache[sheetName];
}

function getMaster() { return openSpreadsheetCached(MASTER_SHEET_ID); }
function getSheet(name) {
  var ss = getMaster();
  var sh = ss.getSheetByName(name);
  if (sh) {
    if (name === "Raw_Data" || name === "Raw Data") ensureRawDataColumns(sh);
    return sh;
  }
  sh = ss.getSheetByName(name.replace(/_/g, " "));
  if (sh) {
    if (name === "Raw_Data" || name === "Raw Data") ensureRawDataColumns(sh);
    return sh;
  }
  sh = ss.getSheetByName(name.replace(/ /g, "_"));
  if (sh) {
    if (name === "Raw_Data" || name === "Raw Data") ensureRawDataColumns(sh);
  }
  return sh;
}

function ensureRawDataColumns(sh) {
  if (_rawDataColumnsChecked) return; // skip after first successful check
  try {
    var lastCol = sh.getLastColumn();
    if (lastCol < 10) { _rawDataColumnsChecked = true; return; }
    var headers = sh.getRange(1, 1, 1, Math.min(lastCol, 20)).getValues()[0];
    // Check if نيو اكشن already exists ANYWHERE in headers — prevent duplicate column insertion
    var hasNewAction = false;
    for (var h = 0; h < headers.length; h++) {
      var hv = (headers[h] || "").toString().trim();
      if (hv === "نيو اكشن" || hv === "New Action") { hasNewAction = true; break; }
    }
    if (hasNewAction) { _rawDataColumnsChecked = true; return; }
    // Only insert if column K (index 10) is genuinely empty
    var col11Header = (headers[10] || "").toString().trim();
    if (col11Header !== "") { _rawDataColumnsChecked = true; return; }
    sh.insertColumnBefore(11);
    sh.getRange(1, 11).setValue("نيو اكشن");
    SpreadsheetApp.flush();
    _rawDataColumnsChecked = true;
  } catch (e) { }
}

function ensureLastModifiedColumn(sheet) {
  try {
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) return 1;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var lastModIndex = headers.indexOf("LastModified");
    if (lastModIndex === -1) {
      var nextCol = lastCol + 1;
      sheet.getRange(1, nextCol).setValue("LastModified");
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var nowStr = new Date().toISOString();
        var vals = [];
        for (var i = 2; i <= lastRow; i++) {
          vals.push([nowStr]);
        }
        sheet.getRange(2, nextCol, lastRow - 1, 1).setValues(vals);
      }
      SpreadsheetApp.flush();
      return nextCol;
    }
    return lastModIndex + 1;
  } catch (e) {
    return sheet.getLastColumn();
  }
}

function appendRowWithTimestamp(sheet, rowArray) {
  sheet.appendRow(rowArray);
  try {
    var lastModCol = ensureLastModifiedColumn(sheet);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, lastModCol).setValue(new Date().toISOString());
  } catch(e) {}
}

function safeCall(fnName, args) {
  try {
    var fn = this[fnName];
    if (typeof fn !== 'function') {
      throw new Error("Function " + fnName + " not found or is not callable.");
    }
    return fn.apply(null, args);
  } catch(e) {
    logActivity("SYSTEM", "Error", "FUNCTION_ERROR", fnName + ": " + e.toString());
    return { success: false, message: "حدث خطأ غير متوقع، تواصل مع المدير.", error: e.toString() };
  }
}

// DEDICATED PHONE2 COLUMN (2026-07-06): Raw_Data used to store a second phone number by gluing it onto
// the primary phone cell ("01064227373 - 01098444785..."), which broke duplicate-detection whenever the
// first number wasn't the last thing in the cell (see [[project_combined_phone_cell_dup_check]]).
// Appended — never inserted — as a brand new column so no existing hardcoded column index elsewhere
// shifts. 1-indexed for getRange()/setValue(), i.e. column P. Existing rows with a combined primary-phone
// cell are NOT auto-migrated; the user is fixing those manually. Going forward, every write path below
// keeps the primary phone column single-number and puts any second number here instead.
var RAW_PHONE2_COL = 16; // 1-indexed (getRange) — column P
var RAW_PHONE2_IDX = 15; // 0-indexed (data[i][...])

// Reads a Raw_Data row's second phone number: prefers the dedicated column; falls back to splitting a
// legacy combined primary-phone cell ("num1 - num2...") for rows the user hasn't manually cleaned up yet.
function _rawRowPhone2(row) {
  var dedicated = (row[RAW_PHONE2_IDX] || "").toString().trim();
  if (dedicated) return dedicated;
  var primary = (row[3] || "").toString();
  var dashIdx = primary.indexOf(' - ');
  return dashIdx !== -1 ? primary.substring(dashIdx + 3).trim() : "";
}

// Raw_Data's header row is maintained by hand in the live sheet (this sheet predates the script and has
// no "create if missing" init function like the Academy_* sheets do) — so appending RAW_PHONE2_COL never
// puts a visible label on it by itself. Call this once before writing so column P actually shows
// "Phone2" as its header instead of looking blank/unlabeled.
function _ensureRawPhone2Header(sh) {
  try {
    var cell = sh.getRange(1, RAW_PHONE2_COL);
    if (!(cell.getValue() || "").toString().trim()) cell.setValue("Phone2");
  } catch (e) {}
}

function cleanPhone(p) {
  if (!p) return "";
  var val = p.toString().trim();
  var lower = val.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "—" || lower === "-") {
    return "";
  }
  var s = val.replace(/[\s\-\+\(\)']/g, '');
  var sLower = s.toLowerCase();
  if (sLower === "undefined" || sLower === "null" || sLower === "—" || sLower === "-") {
    return "";
  }
  if (s.startsWith("20")) s = s.substring(2);
  if (s.startsWith("0")) s = s.substring(1);
  return s.trim();
}

function phonesMatch(phoneA, phoneB) {
  if (!phoneA || !phoneB) return false;
  var strA = phoneA.toString().trim().toLowerCase();
  var strB = phoneB.toString().trim().toLowerCase();
  if (strA === "undefined" || strA === "null" || strA === "—" || strA === "-" || strA === "") return false;
  if (strB === "undefined" || strB === "null" || strB === "—" || strB === "-" || strB === "") return false;
  
  var cleanA = phoneA.toString().split("-").map(function(p) { return cleanPhone(p); }).filter(function(p) { return p; });
  var cleanB = phoneB.toString().split("-").map(function(p) { return cleanPhone(p); }).filter(function(p) { return p; });
  for (var i = 0; i < cleanA.length; i++) {
    for (var j = 0; j < cleanB.length; j++) {
      var a = cleanA[i];
      var b = cleanB[j];
      if (a === b || (a.length >= 9 && b.length >= 9 && a.slice(-9) === b.slice(-9))) {
        return true;
      }
    }
  }
  return false;
}


function formatEgyptianPhone(p) {
  if (!p) return "";
  var parts = p.toString().split(/\s*-\s*/);
  var formattedParts = parts.map(function(part) {
    var s = part.replace(/[\s\-\+\(\)']/g, '').trim();
    if (s.startsWith("20") && s.length === 12) {
      s = "0" + s.substring(2);
    }
    if (s.startsWith("1") && s.length === 10) {
      s = "0" + s;
    }
    return s;
  });
  return formattedParts.join(" - ");
}

function forceTextPhone(p) {
  if (!p) return "";
  var formatted = formatEgyptianPhone(p);
  if (formatted.toString().indexOf("-") === -1 && formatted.toString().startsWith("0") && !formatted.toString().startsWith("'")) {
    return "'" + formatted;
  }
  return formatted;
}

function idsMatch(idA, idB) {
  if (idA === undefined || idA === null || idB === undefined || idB === null) return false;
  var a = idA.toString().trim();
  var b = idB.toString().trim();
  if (a === b) return true;
  // Strip ".0" suffix (Google Sheets sometimes stores numbers as "42.0")
  if (a.indexOf('.') !== -1 && a.endsWith('.0')) a = a.substring(0, a.length - 2);
  if (b.indexOf('.') !== -1 && b.endsWith('.0')) b = b.substring(0, b.length - 2);
  if (a === b) return true;
  // Numeric comparison ONLY when BOTH strings are purely numeric (no letters/hex).
  // parseFloat("4175903cf0df...") = 4175903 which is WRONG — it would false-match
  // a UUID that starts with digits against an old sequential ID.
  var pureNumeric = /^\d+$/;
  if (pureNumeric.test(a) && pureNumeric.test(b)) {
    return parseInt(a, 10) === parseInt(b, 10);
  }
  return false;
}

// ============================================================
// ID GENERATION — SYSTEM-WIDE UNIQUENESS GUARANTEE
// ============================================================
// genId()      → full 32-char UUID hex (128-bit, zero collision risk)
// safeGenId(s) → genId() + checks against existing-ID set s
//                s is a plain object used as a HashSet {id: true}
//                Mutates s so the returned ID is immediately reserved.
// ============================================================
function genId() {
  // Full 128-bit UUID — NO truncation, NO sequential risk
  return Utilities.getUuid().replace(/-/g, '');  // 32 hex chars, e.g. "a3f7b2c1..."
}

/**
 * Returns a UUID that is NOT already in `usedSet`.
 * `usedSet` is a plain object {id: true, ...} — mutated in place.
 * Collision in 32-char UUID space is astronomically impossible,
 * but this gives a hard guarantee at the code level.
 */
function safeGenId(usedSet) {
  var id, tries = 0;
  do {
    id = genId();
    tries++;
  } while (usedSet && usedSet[id] && tries < 50);
  if (usedSet) usedSet[id] = true;
  return id;
}

/**
 * Build a HashSet of all existing IDs in column `colIndex` (0-based)
 * of a sheet's data array. Skips empty, soft-deleted rows.
 * `deletedColIndex` is optional (col index of is-deleted flag).
 */
function buildIdSet(data, colIndex, deletedColIndex) {
  var set = {};
  for (var i = 1; i < data.length; i++) {
    if (deletedColIndex !== undefined) {
      var del = data[i][deletedColIndex];
      if (del === true || del === "TRUE" || del === "true" || del === 1) continue;
    }
    var id = (data[i][colIndex] || "").toString().trim();
    if (id) set[id] = true;
  }
  return set;
}
function nowStr() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"); }
function todayStr() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }

// ════════════════════════════════════════════════════════════════════
// UNIFIED CLIENT HISTORY (2026-07-06): every consequential action on a client — round changes,
// transfers, cancellations, refunds, Support Me interactions, Exception requests — gets appended to
// the SAME Raw_Data notes/history column that call-logs already use (the "[date - agent] (tag): text"
// lines seen in the client's history). So opening a client ever again shows their COMPLETE story in
// one place, not just their call log. Matches the Raw_Data row by OC (preferred, unique) or phone
// (fallback, last-9-digit tolerant) since most callers only have one of the two handy.
function _histFmt(tag, agentName, text) {
  return "[" + nowStr() + " - " + (agentName || "System") + "] (" + tag + "): " + text;
}
function _appendClientHistory(phone, oc, entryText) {
  try {
    var rawSh = getSheet("Raw_Data");
    if (!rawSh) return false;
    var data = rawSh.getDataRange().getValues();
    var ocK = ocKey(oc);
    var phoneClean = phone ? cleanPhone(phone) : "";
    if (!ocK && !phoneClean) return false;
    for (var i = 1; i < data.length; i++) {
      var rowOc = ocKey(data[i][14]);
      var rowPhoneClean = cleanPhone(data[i][3]);
      var match = (ocK && rowOc && rowOc === ocK) ||
                  (phoneClean && rowPhoneClean && (rowPhoneClean === phoneClean || rowPhoneClean.slice(-9) === phoneClean.slice(-9)));
      if (match) {
        var old = (data[i][8] || "").toString().trim();
        var comb = old ? old + "\n" + entryText : entryText;
        rawSh.getRange(i + 1, 9).setValue(comb);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function logActivity(agentId, agentName, action, details) {
  try {
    var sh = getSheet("Activity_Log");
    var today = todayStr();
    // Deduplicate only LOGIN events to avoid dropping legitimate call logs
    if (action === "LOGIN") {
      var data = sh.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var d = data[i][0];
        var aid = (data[i][1] || "").toString();
        var act = (data[i][3] || "").toString();
        if (d instanceof Date) {
          var dStr = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
          if (dStr === today && aid === agentId.toString() && act === action) {
            return;
          }
        }
      }
    }
    var lastRow = sh.getLastRow();
    // FIX #13: استخدم setValues بدل appendRow للسرعة
    sh.getRange(lastRow + 1, 1, 1, 5).setValues([[new Date(), agentId, agentName, action, details]]);
  } catch (e) {
    // silent fail — ماتوقفش النظام لو الـ log فشل
  }
}

function getPages() { return ALL_PAGES; }

// ==========================================
// AUTH
// ==========================================
function initUsersSheet() {
  var sh = getSheet("Users");
  // لو الشيت مش موجودة خالص، انشئها
  if (!sh) {
    getMaster().insertSheet("Users");
    sh = getSheet("Users");
  }
  var data = sh.getDataRange().getValues();
  // فقط لو الشيت فاضية تماماً أو فيها header بس بدون بيانات
  var hasData = data.length >= 2 && data[1] && data[1][0];
  if (!hasData) {
    // لو مفيش headers، امسح وضيف
    if (data.length === 0 || data[0][0] !== "ID") {
      sh.clearContents();
      sh.appendRow(["ID", "Name", "Username", "Password", "Role", "Active", "Pages", "AgentKey", "CreatedAt"]);
      sh.getRange(1, 1, 1, 9).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    }
    // ضيف admin افتراضي بس لو مفيش يوزرز خالص
    var allPageIds = ALL_PAGES.map(function (p) { return p.id; }).join(",");
    sh.appendRow([genId(), "المدير", "admin", hashPassword("admin123"), "Manager", true, allPageIds, "", new Date()]);
  }
  // لو الشيت فيها بيانات — متعملش حاجة خالص
}

function login(username, password) {
  try {
    // تأكد من وجود شيت Users بدون حذف البيانات
    var sh = getSheet("Users");
    if (!sh) {
      initUsersSheet();
      sh = getSheet("Users");
    }
    var data = sh.getDataRange().getValues();
    // لو الشيت فاضية خالص، ابني هيكلها
    if (data.length < 2) {
      initUsersSheet();
      data = sh.getDataRange().getValues();
    }
    for (var i = 1; i < data.length; i++) {
      if ((data[i][2] || "").toString().trim() === username.trim()) {
        var storedPass = (data[i][3] || "").toString().trim();
        var inputTrimmed = password.trim();
        var inputHashed = hashPassword(inputTrimmed);
        // Accept hashed (new) OR plain text (migration period for old accounts)
        var passMatch = (storedPass === inputHashed) ||
                        (storedPass.length < 64 && storedPass === inputTrimmed);
        if (!passMatch) continue;
        var isActive = data[i][5];
        if (isActive === false || isActive === "FALSE" || isActive === 0) {
          return { success: false, message: "⛔ الحساب موقوف. تواصل مع المدير." };
        }
        var pages = data[i][6] ? data[i][6].toString().split(",") : [];
        var user = {
          id: data[i][0].toString(),
          name: data[i][1].toString(),
          username: data[i][2].toString(),
          role: data[i][4].toString(),
          pages: pages,
          agentKey: data[i][7] ? data[i][7].toString() : data[i][1].toString()
        };
        logActivity(user.id, user.name, "LOGIN", "تسجيل دخول");
        return { success: true, user: user };
      }
    }
    return { success: false, message: "❌ اسم المستخدم أو كلمة المرور غلط" };
  } catch (e) {
    return { success: false, message: "خطأ في السيستم: " + e.toString() };
  }
}

// ==========================================
// SESSION VALIDATION — called on page load/refresh
// Verifies that the stored user ID still exists and is active
// ==========================================
function validateSession(userId) {
  try {
    if (!userId) return { success: false, message: "No userId" };
    var sh = getSheet("Users");
    if (!sh) return { success: false, message: "Users sheet missing" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === userId.toString().trim()) {
        var isActive = data[i][5];
        if (isActive === false || isActive === "FALSE" || isActive === 0) {
          return { success: false, message: "Account deactivated" };
        }
        var pages = data[i][6] ? data[i][6].toString().split(",") : [];
        var user = {
          id: data[i][0].toString(),
          name: data[i][1].toString(),
          username: data[i][2].toString(),
          role: data[i][4].toString(),
          pages: pages,
          agentKey: data[i][7] ? data[i][7].toString() : data[i][1].toString()
        };
        return { success: true, user: user };
      }
    }
    return { success: false, message: "User not found" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// USERS MANAGEMENT
// ==========================================
function getUsers() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('bsa_users');
    if (cached) {
      try { return JSON.parse(cached); } catch(ce) {}
    }
    var sh = getSheet("Users");
    if (!sh) return [];
    var data = sh.getDataRange().getValues(), users = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || !row[0]) continue;
      users.push({
        id: row[0].toString().trim(),
        name: row[1] ? row[1].toString().trim() : "",
        username: row[2] ? row[2].toString().trim() : "",
        // SECURITY: never return password hash to client
        role: row[4] ? row[4].toString().trim() : "",
        active: row[5] === true || row[5] === "TRUE" || row[5] === "true",
        pages: row[6] ? row[6].toString().split(",") : [],
        agentKey: row[7] ? row[7].toString().trim() : ""
      });
    }
    try { cache.put('bsa_users', JSON.stringify(users), 300); } catch(ce) {}
    return users;
  } catch (e) {
    Logger.log("Error in getUsers: " + e.toString());
    return [];
  }
}

function invalidateUsersCache() {
  try { CacheService.getScriptCache().remove('bsa_users'); } catch(e) {}
}

function addUser(name, username, password, role, pages, agentKey) {
  try {
    var sh = getSheet("Users"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][2] || "").toString().trim() === username.trim())
        return { success: false, message: "اسم المستخدم موجود بالفعل" };
    }
    var pagesStr = Array.isArray(pages) ? pages.join(",") : (pages || "");
    var existingUserIds = buildIdSet(data, 0, -1);
    sh.appendRow([safeGenId(existingUserIds), name, username, hashPassword(password), role, true, pagesStr, agentKey || name, new Date()]);
    invalidateUsersCache();
    return { success: true, message: "✅ تم إضافة المستخدم" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// FIX #6: updateUserPages — تأكد إن pages array قبل الحفظ
function updateUserPages(userId, pages) {
  try {
    var sh = getSheet("Users");
    if (!sh) return { success: false, message: "شيت المستخدمين غير موجود" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var sheetId = (data[i][0] || "").toString().split('.')[0].trim();
      var targetId = userId.toString().split('.')[0].trim();
      if (sheetId === targetId) {
        var pagesStr = Array.isArray(pages) ? pages.join(",") : (pages || "");
        sh.getRange(i + 1, 7).setValue(pagesStr);
        invalidateUsersCache();
        return { success: true, message: "✅ تم تحديث الصلاحيات بنجاح" };
      }
    }
    return { success: false, message: "المستخدم غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function updateUserField(userId, field, value) {
  try {
    var sh = getSheet("Users");
    if (!sh) return { success: false, message: "شيت المستخدمين غير موجود" };
    var data = sh.getDataRange().getValues();
    var colMap = { name: 2, username: 3, password: 4, role: 5, active: 6, pages: 7, agentKey: 8 };
    for (var i = 1; i < data.length; i++) {
      var sheetId = (data[i][0] || "").toString().split('.')[0].trim();
      var targetId = userId.toString().split('.')[0].trim();
      if (sheetId === targetId) {
        if (colMap[field]) {
          // Hash password before saving
          var storedValue = (field === "password") ? hashPassword(value) : value;
          sh.getRange(i + 1, colMap[field]).setValue(storedValue);
        }
        invalidateUsersCache();
        return { success: true, message: "✅ تم التحديث" };
      }
    }
    return { success: false, message: "المستخدم غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function deleteUser(userId) {
  try {
    var sh = getSheet("Users"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) { sh.deleteRow(i + 1); invalidateUsersCache(); return { success: true }; }
    }
    return { success: false, message: "المستخدم غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function toggleUserActive(userId, active) { return updateUserField(userId, "active", active); }
function resetPassword(userId, newPass) { return updateUserField(userId, "password", newPass); }

// ==========================================
// PULL FRESH — كل سيلز من range بتاعته
// ==========================================
// ROOT FIX (2026-07-02): a fresh lead's owner is defined by WHICH agent-range it physically sits in
// on the day's tab — NOT by fragile string matching of names. The old checks compared the Raw_Data
// agent to the sales's DISPLAY name (CU.name), so "نور"/"Nour Fathy" ≠ range key "Nour" ≠ Raw_Data
// "Nour" all looked like different people → المتاح 0 and the pull refused. Now a lead in MY range is
// mine unless Raw_Data/My_Leads assigns it to a DIFFERENT *known* range agent.
function _freshOwnedByOtherAgent(ownerAgent, myKey, myName) {
  var a = (ownerAgent || "").toString().trim().toLowerCase();
  if (!a || a === "المدير") return false;               // unassigned / manager → available to me
  var mk = (myKey || "").toString().trim().toLowerCase();
  var mn = (myName || "").toString().trim().toLowerCase();
  if (a === mk || a === mn) return false;               // it's mine (by key or name)
  for (var k in AGENT_RANGES) { if (k.toString().toLowerCase() === a) return true; } // owned by another range agent
  return false; // any other/unknown string: the lead sits in MY range → treat as mine
}

function getAvailableFreshCount(agentId, agentName, agentKey, selectedDay) {
  try {
    var key   = agentKey || agentName;
    var range = AGENT_RANGES[key];
    if (!range) return { success: false, count: 0, message: "⚠️ لم يتم تحديد range لهذا الموظف." };

    var today = new Date();
    var day = selectedDay ? parseInt(selectedDay) : today.getDate();
    var tabName = (today.getMonth()+1) + "/" + day;
    var distSS  = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    var sheet   = distSS.getSheetByName(tabName);
    if (!sheet) return { success: true, count: 0, message: "لا يوجد شيت لهذا اليوم" };

    var data = sheet.getDataRange().getValues();

    // بناء map للأرقام الموجودة في Raw_Data مع مندوبيها — لاستبعاد المكررات من العداد
    var rawSh2 = getSheet("Raw_Data");
    var rawData2 = rawSh2 ? rawSh2.getDataRange().getValues() : [];
    var rawPhones2 = {}, rawAgents2 = {};
    for (var ri = 1; ri < rawData2.length; ri++) {
      var rp2 = cleanPhone((rawData2[ri][3]||"").toString());
      if (rp2) { rawPhones2[rp2] = true; rawAgents2[rp2] = (rawData2[ri][6]||"").toString().trim(); }
    }

    var count = 0;
    for (var r = range.startRow - 1; r < range.endRow; r++) {
      if (!data[r]) continue;
      var baseCol = range.startCol - 1; // 0-based
      var phone   = data[r][baseCol + COL_PHONE]  ? data[r][baseCol + COL_PHONE].toString().trim()  : "";
      var pulled  = data[r][baseCol + COL_PULLED] ? data[r][baseCol + COL_PULLED].toString().trim() : "";
      if (phone && !pulled) {
        var pc2 = cleanPhone(phone);
        var ag2 = rawAgents2[pc2] || "";
        // Available to me unless Raw_Data assigns this phone to a DIFFERENT known range agent.
        // (The lead already sits in MY range on the tab, so it's mine by distribution.)
        if (!_freshOwnedByOtherAgent(ag2, key, agentName)) {
          count++;
        }
      }
    }
    return { success: true, count: count };
  } catch(e) {
    return { success: false, count: 0, message: "خطأ: " + e.toString() };
  }
}

// LEAD-LEAK FIX (2026-06-27): build a phone → owning-agent map from My_Leads.
// Raw_Data and My_Leads can drift (a lead owned in My_Leads but blank agent in
// Raw_Data), which let an already-owned lead resurface in the pool and get pulled
// by a colleague — duplicate assignment. Both pull paths now also consult this map
// so a phone owned by ANY other agent is never handed out again.
function _myLeadsPhoneOwners() {
  var owners = {};
  var sh = getSheet("My_Leads");
  if (!sh) return owners;
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var ph = cleanPhone(data[i][3]);   // My_Leads: phone at index 3
    var ag = (data[i][7] || "").toString().trim(); // agentName at index 7
    if (ph && ag) owners[ph] = ag; // any non-empty owner blocks a cross-agent pull
  }
  return owners;
}

// REPAIR TOOL (2026-07-04): the OLD ownership check (before the range-based fix above) wrongly wrote
// a PERMANENT "مكرر مع X" text into the tab's PULLED cell for leads that were actually fine — because
// it compared the Raw_Data agent to the sales's display NAME instead of their range. That text sticks
// in the sheet forever (pullFreshLeadOnly treats any non-empty PULLED cell as "already handled"), so
// even after the logic fix, already-poisoned rows stay stuck and invisible/unavailable. This scans a
// tab and clears any "مكرر مع" mark that is NOT actually a duplicate under the corrected range-based
// rule — never touches real pulls ("تم السحب بواسطة ...").
function repairFreshDuplicateMarks(tabName) {
  try {
    var tz = Session.getScriptTimeZone();
    if (!tabName) tabName = Utilities.formatDate(new Date(), tz, "M/d");
    var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    var sheet = distSS ? distSS.getSheetByName(tabName) : null;
    if (!sheet) return { success: false, message: "لا يوجد تاب بهذا الاسم (" + tabName + ")" };

    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    var rawAgents = {};
    for (var idx = 1; idx < rawData.length; idx++) {
      var pClean = cleanPhone(rawData[idx][3]);
      if (pClean) rawAgents[pClean] = (rawData[idx][6] || "").toString().trim();
    }
    var myOwners = _myLeadsPhoneOwners();

    var rawNames = {};
    for (var idx2 = 1; idx2 < rawData.length; idx2++) {
      var pClean2 = cleanPhone(rawData[idx2][3]);
      if (pClean2) rawNames[pClean2] = (rawData[idx2][2] || "").toString().trim();
    }

    var data = sheet.getDataRange().getValues();
    var fixed = 0, keptAsReal = 0, keptDetails = [];
    for (var key in AGENT_RANGES) {
      var range = AGENT_RANGES[key];
      var baseCol = range.startCol - 1;
      for (var r = range.startRow - 1; r < range.endRow; r++) {
        if (!data[r]) continue;
        var pulledCellText = data[r][baseCol + COL_PULLED] ? data[r][baseCol + COL_PULLED].toString().trim() : "";
        if (pulledCellText.indexOf("مكرر مع") !== 0) continue; // only touch false-duplicate marks, never real pulls
        var phone = data[r][baseCol + COL_PHONE] ? data[r][baseCol + COL_PHONE].toString().trim() : "";
        var phoneClean = cleanPhone(phone);
        var rawOwner = rawAgents[phoneClean] || "";
        var mlOwner = myOwners[phoneClean] || "";
        var genuinelyDuplicate = _freshOwnedByOtherAgent(rawOwner, key, key) || _freshOwnedByOtherAgent(mlOwner, key, key);
        if (!genuinelyDuplicate) {
          sheet.getRange(r + 1, range.startCol + COL_PULLED).setValue(""); // release — this lead was never actually someone else's
          fixed++;
        } else {
          keptAsReal++;
          keptDetails.push({
            tab: tabName,
            phone: phone,
            name: rawNames[phoneClean] || "",
            inRangeOf: key,
            ownedBy: rawOwner || mlOwner || "؟",
            markText: pulledCellText
          });
        }
      }
    }
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم فحص تاب " + tabName + " — أُعيد إتاحة " + fixed + " ليد كان معلّم بالغلط، وتُرك " + keptAsReal + " تكرار حقيقي.", fixed: fixed, keptAsReal: keptAsReal, keptDetails: keptDetails };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// Convenience: repair today's tab plus the last N days back (covers the whole affected window at once).
function repairFreshDuplicateMarksRange(daysBack) {
  var tz = Session.getScriptTimeZone();
  var n = parseInt(daysBack) || 7;
  var totalFixed = 0, totalKept = 0, tabsChecked = 0, errors = [], allKeptDetails = [];
  for (var i = 0; i <= n; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var tabName = Utilities.formatDate(d, tz, "M/d");
    var r = repairFreshDuplicateMarks(tabName);
    if (r.success) {
      totalFixed += r.fixed || 0; totalKept += r.keptAsReal || 0; tabsChecked++;
      if (r.keptDetails && r.keptDetails.length) allKeptDetails = allKeptDetails.concat(r.keptDetails);
    }
    else if (r.message && r.message.indexOf("لا يوجد تاب") === -1) errors.push(tabName + ": " + r.message);
  }
  return { success: true, message: "✅ فُحص " + tabsChecked + " تاب (آخر " + n + " يوم) — أُعيد إتاحة " + totalFixed + " ليد، وتُرك " + totalKept + " تكرار حقيقي." + (errors.length ? " أخطاء: " + errors.join(" | ") : ""), fixed: totalFixed, keptAsReal: totalKept, tabsChecked: tabsChecked, keptDetails: allKeptDetails };
}

// REPAIR TOOL (2026-07-05): fix AgentID values that don't match any real ID in the Users sheet — e.g.
// leftover raw JS timestamps ("1780411826291" ≈ a new Date().getTime() value) sitting in the AgentID
// column instead of the sales's actual current ID. Investigated the write paths for the exact origin
// but couldn't pin it down with certainty within this pass — so instead of guessing at a root cause,
// this repairs the SYMPTOM safely: any AgentID that isn't a known Users-sheet ID gets resolved to the
// correct current ID by matching the row's own AgentName column against Users. Never guesses — a row
// whose name doesn't match anyone in Users is left untouched and reported for manual review.
function repairAgentIds(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح." };
  try {
    var users = getUsers();
    var validIds = {}, idByName = {};
    users.forEach(function (u) {
      validIds[u.id] = true;
      var nameKey = (u.name || "").toString().trim().toLowerCase();
      if (nameKey && !idByName[nameKey]) idByName[nameKey] = u.id;
      var keyKey = (u.agentKey || "").toString().trim().toLowerCase();
      if (keyKey && !idByName[keyKey]) idByName[keyKey] = u.id;
    });

    var targets = [
      { name: "Round_Members",   idCol: 10, nameCol: 11 }, // 1-based columns
      { name: "Financial_Data",  idCol: 1,  nameCol: 2 },
      { name: "Client_Payments", idCol: 8,  nameCol: 9 },
      { name: "My_Leads",        idCol: 7,  nameCol: 8 } // confirmed 2026-07-06: this is where the stale-session bug (see validateSession fix) was stamping a phantom AgentID
    ];
    var report = [], totalFixed = 0, totalUnresolved = 0;
    targets.forEach(function (t) {
      try {
        var sh = getSheet(t.name);
        if (!sh) { report.push(t.name + ": الشيت مش موجود"); return; }
        var data = sh.getDataRange().getValues();
        var fixed = 0, unresolved = 0;
        for (var i = 1; i < data.length; i++) {
          var idVal = (data[i][t.idCol - 1] || "").toString().trim();
          if (!idVal || validIds[idVal]) continue; // empty or already a real Users ID — leave it
          var nameVal = (data[i][t.nameCol - 1] || "").toString().trim().toLowerCase();
          var correctId = nameVal ? idByName[nameVal] : "";
          if (correctId) { sh.getRange(i + 1, t.idCol).setValue(correctId); fixed++; }
          else { unresolved++; }
        }
        report.push(t.name + ": أُصلح " + fixed + (unresolved ? "، تعذّر حل " + unresolved : ""));
        totalFixed += fixed; totalUnresolved += unresolved;
      } catch (e) { report.push(t.name + ": خطأ — " + e.toString()); }
    });
    SpreadsheetApp.flush();
    return {
      success: true,
      message: "✅ تم إصلاح " + totalFixed + " AgentID غير صالح" +
        (totalUnresolved ? " — و" + totalUnresolved + " تعذّر التعرف عليهم بالاسم (محتاجين مراجعة يدوية)" : "") +
        ". (" + report.join(" | ") + ")",
      fixed: totalFixed, unresolved: totalUnresolved
    };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// REPAIR TOOL (2026-07-04): merge the stray Arabic course name "ديجيتال ماركتينج" (had no basis in
// the Courses sheet — see the two fallback fixes above) back into the real course name "Digital
// Marketing" across every sheet that stores a course column, so old rows stop being split into two
// different "courses" for filtering/reporting.
function normalizeCourseNames() {
  var STRAY = "ديجيتال ماركتينج", REAL = "Digital Marketing";
  var targets = [
    { name: "Raw_Data",       col: 6  }, // 1-based col index
    { name: "My_Leads",       col: 6  },
    { name: "Client_Payments",col: 4  },
    { name: "Financial_Data", col: 10 }
  ];
  var report = [], total = 0;
  targets.forEach(function (t) {
    try {
      var sh = getSheet(t.name);
      if (!sh) { report.push(t.name + ": الشيت مش موجود"); return; }
      var data = sh.getDataRange().getValues();
      var fixed = 0;
      for (var i = 1; i < data.length; i++) {
        var v = (data[i][t.col - 1] || "").toString().trim();
        if (v === STRAY) { sh.getRange(i + 1, t.col).setValue(REAL); fixed++; }
      }
      report.push(t.name + ": " + fixed);
      total += fixed;
    } catch (e) { report.push(t.name + ": خطأ — " + e.toString()); }
  });
  SpreadsheetApp.flush();
  return { success: true, message: "✅ تم توحيد " + total + " صف من \"" + STRAY + "\" إلى \"" + REAL + "\" (" + report.join(" | ") + ")", total: total };
}

function pullFreshLeadOnly(agentId, agentName, agentKey, selectedDay) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    // تحديد الـ range بناءً على agentKey
    var key = agentKey || agentName;
    var range = AGENT_RANGES[key];
    if (!range) return { success: false, message: "⚠️ لم يتم تحديد range لهذا الموظف. تواصل مع المدير." };

    // اسم التاب = تاريخ اليوم أو اليوم المختار
    var today = new Date();
    var day = selectedDay ? parseInt(selectedDay) : today.getDate();
    var tabName = (today.getMonth() + 1) + "/" + day;
    var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    var sheet = distSS.getSheetByName(tabName);
    if (!sheet) return { success: false, message: "🚨 لا يوجد تاب بتاريخ اليوم (" + tabName + ") في شيت الفريش!" };

    var data = sheet.getDataRange().getValues();

    // تحميل أرقام الهواتف والوكلاء المسجلين بالفعل في Raw_Data لتجنب تكرار وسحب عميل لآخر
    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    var rawPhones = {};
    var rawAgents = {};
    for (var idx = 1; idx < rawData.length; idx++) {
      var pClean = cleanPhone(rawData[idx][3]);
      if (pClean) {
        rawPhones[pClean] = true;
        rawAgents[pClean] = (rawData[idx][6] || "").toString().trim();
      }
    }
    // LEAD-LEAK FIX: also block phones already owned by another agent in My_Leads.
    var myOwners = _myLeadsPhoneOwners();

    var targetRow = -1;
    // FIX #1: أضف leadName
    var leadPhone = "", leadSource = "", leadCamp = "", leadCourse = "", leadRegion = "", leadName = "";

    for (var r = range.startRow - 1; r < range.endRow; r++) {
      if (!data[r]) continue;
      var baseCol = range.startCol - 1; // 0-based
      var phone = data[r][baseCol + COL_PHONE] ? data[r][baseCol + COL_PHONE].toString().trim() : "";
      var pulled = data[r][baseCol + COL_PULLED] ? data[r][baseCol + COL_PULLED].toString().trim() : "";
      if (phone && !pulled) {
        var phoneClean = cleanPhone(phone);
        // The lead sits in MY range → mine, unless Raw_Data/My_Leads assigns it to a DIFFERENT known agent.
        if (rawPhones[phoneClean]) {
          var assignedAgent = rawAgents[phoneClean];
          if (_freshOwnedByOtherAgent(assignedAgent, key, agentName)) {
            var _dupCol = range.startCol + COL_PULLED;
            sheet.getRange(r + 1, _dupCol).setValue("مكرر مع " + assignedAgent);
            continue;
          }
        }
        // LEAD-LEAK FIX: skip if another agent already owns this phone in My_Leads
        // (covers the case where Raw_Data's agent cell is blank/stale but the lead is owned).
        var _mlOwner = myOwners[phoneClean];
        if (_freshOwnedByOtherAgent(_mlOwner, key, agentName)) {
          var _dupCol3 = range.startCol + COL_PULLED;
          sheet.getRange(r + 1, _dupCol3).setValue("مكرر مع " + _mlOwner);
          continue;
        }

        targetRow = r + 1; // 1-based للشيت
        leadPhone = forceTextPhone(phone);
        leadSource = data[r][baseCol + COL_SOURCE] || "فيس بوك";
        leadRegion = data[r][baseCol + COL_REGION] || "";
        leadCamp = data[r][baseCol + COL_CAMP] || "";
        // FIX (2026-07-04): the Courses sheet's actual default is "Digital Marketing" (English) — the
        // old Arabic fallback "ديجيتال ماركتينج" has no basis there, so empty-course rows silently
        // created a second, different course name in Raw_Data/My_Leads that never matched anything.
        leadCourse = data[r][baseCol + COL_COURSE] || "Digital Marketing";
        // FIX #1: اجيب الاسم من العمود الأول في الـ range (index 0)
        leadName = data[r][baseCol] ? data[r][baseCol].toString().trim() : "";
        break;
      }
    }

    if (targetRow === -1) return { success: false, message: "📢 تم سحب جميع الأرقام المخصصة لك اليوم." };

    // تسجيل السحب في عمود "تم السحب"
    var pulledCol = range.startCol + COL_PULLED; // 1-based
    sheet.getRange(targetRow, pulledCol).setValue("تم السحب بواسطة " + agentName + " - " + nowStr());

    // إضافة أو إيجاد في الماستر — FIX #1: مرّر leadName
    var masterInfo = findOrCreateInMaster(agentName, leadPhone, leadSource, leadCamp, leadCourse, leadName);
    saveToMyLeads([masterInfo.id, new Date(), masterInfo.name || leadName || "", leadPhone, leadSource, leadCourse, agentId, agentName, "Assigned", "", "", leadCamp]);
    logActivity(agentId, agentName, "PULL_FRESH", "فريش: " + leadPhone);

    SpreadsheetApp.flush();
    return { success: true, id: masterInfo.id, name: masterInfo.name || leadName || "", phone: formatEgyptianPhone(leadPhone), course: leadCourse, type: "Fresh", source: leadSource, campaign: leadCamp };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally { lock.releaseLock(); }
}

/**
 * DEPRECATED sequential ID generator — replaced by UUID-based genId().
 * Kept as a wrapper so existing call sites don't break, but now returns
 * a collision-safe UUID instead of a sequential integer.
 * @param {Array} data - Sheet data array (used to build existing-ID set)
 */
function getNextIdFromData(data) {
  // Build existing-ID set to guarantee the new UUID is not already in the sheet
  var existingIds = buildIdSet(data, 0, -1);
  return safeGenId(existingIds);
}

// FIX #1: findOrCreateInMaster يقبل leadName الآن
function findOrCreateInMaster(agentName, phone, source, campaign, course, leadName) {
  var sh = getSheet("Raw_Data");
  var data = sh.getDataRange().getValues();
  phone = forceTextPhone(phone);
  var clean = cleanPhone(phone);
  for (var i = 1; i < data.length; i++) {
    if (cleanPhone(data[i][3]) === clean && clean) {
      // CRITICAL FIX: Use genId() (UUID) — sequential IDs from getNextIdFromData collide with row indices.
      var eid = (data[i][0] || "").toString().trim();
      if (!eid) {
        eid = genId(); // UUID 18-char hex — never sequential, never collides
        sh.getRange(i + 1, 1).setValue(eid);
      }
      
      // لا نغير الموظف المسؤول في الماستر إلا لو كان فارغاً أو مسجلاً باسم "المدير" لحماية التخصيص
      var assignedAgent = (data[i][6] || "").toString().trim();
      if (!assignedAgent || assignedAgent === "المدير" || assignedAgent.toLowerCase() === agentName.toLowerCase()) {
        sh.getRange(i + 1, 7).setValue(agentName);
      }
      sh.getRange(i + 1, 8).setValue("Assigned");
      return { rowIndex: i + 1, id: eid, name: data[i][2] || leadName || "" };
    }
  }
  var newId = getNextIdFromData(data);
  // FIX #1: ضيف leadName بدل "" (13 elements: campaign at index 12)
  appendRowWithTimestamp(sh, [newId, new Date(), leadName || "", phone, source, course, agentName, "Assigned", "", "", "", "", campaign]);
  return { rowIndex: sh.getLastRow(), id: newId, name: leadName || "" };
}

// ==========================================
// ADD MANUAL LEAD
// ==========================================
function addManualLead(name, phone, course, source, agentId, agentName) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    phone = forceTextPhone(phone);
    // تحقق من التكرار
    var sh = getSheet("Raw_Data");
    var data = sh.getDataRange().getValues();
    var clean = cleanPhone(phone);
    for (var i = 1; i < data.length; i++) {
      if (cleanPhone(data[i][3]) === clean && clean) {
        lock.releaseLock();
        return { success: false, message: "⚠️ الرقم موجود بالفعل في قاعدة البيانات (ID: " + data[i][0] + ")" };
      }
    }
    var newId = getNextIdFromData(data);
    // 13 elements: Campaign/OC at index 12
    appendRowWithTimestamp(sh, [newId, new Date(), name, phone, source || "يدوي", course, agentName, "Assigned", "", "", "", "", ""]);
    saveToMyLeads([newId, new Date(), name, phone, source || "يدوي", course, agentId, agentName, "Assigned", "", "", ""]);
    logActivity(agentId, agentName, "ADD_MANUAL", name + " - " + phone);
    SpreadsheetApp.flush();
    lock.releaseLock();
    return { success: true, id: newId, name: name, phone: formatEgyptianPhone(phone), course: course };
  } catch (e) {
    return { success: false, message: e.toString() };
  } finally {
    try { lock.releaseLock(); } catch(le) {}
  }
}

// ==========================================
// INSTRUCTOR LIST (for Academy)
// ==========================================
function getInstructorList() {
  var val = PropertiesService.getScriptProperties().getProperty("instructorList");
  return val ? JSON.parse(val) : [];
}
function saveInstructorList(instructors) {
  PropertiesService.getScriptProperties().setProperty("instructorList", JSON.stringify(instructors || []));
  return { success: true, message: "✅ تم حفظ قائمة المحاضرين" };
}

// ==========================================
// CAMPAIGN LIST (managed from Settings)
// ==========================================
function getPlatformList() {
  var val = PropertiesService.getScriptProperties().getProperty("platformList");
  var list = val ? JSON.parse(val) : [];
  return { success: true, platforms: list };
}

function savePlatformList(platforms) {
  PropertiesService.getScriptProperties().setProperty("platformList", JSON.stringify(platforms || []));
  return { success: true, message: "✅ تم حفظ قائمة المنصات" };
}

function getCampaignList() {
  try {
    var val = PropertiesService.getScriptProperties().getProperty("campaignList");
    var list = val ? JSON.parse(val) : [];
    return { success: true, campaigns: list };
  } catch (e) {
    return { success: true, campaigns: [] };
  }
}

function saveCampaignList(campaigns) {
  try {
    PropertiesService.getScriptProperties().setProperty("campaignList", JSON.stringify(campaigns || []));
    return { success: true, message: "✅ تم حفظ قائمة الكامبينز" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// FRESH LEAD MANUAL ADD (Admin/Operation)
// ==========================================
function checkPhoneExists(phone) {
  try {
    var clean = cleanPhone(phone);
    if (!clean || clean.length < 8) return { success: true, found: false };
    var sh = getSheet("Raw_Data");
    if (!sh) return { success: false, found: null, error: "Raw_Data sheet not found" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      // BUG FIX (2026-07-06): Raw_Data's phone cell can hold MORE than one number in one cell (e.g.
      // "01064227373 - 01098444785رقم ابنها يوسف" — primary number + a relative's number, sometimes with
      // a label glued on with no separator). The old check ran cleanPhone() on the WHOLE cell as a single
      // blob, which glues both numbers' digits (and any stray Arabic letters) together into one string —
      // so comparing against just its last 9 characters only ever matches whichever number happens to
      // land last in the cell, silently missing the first one. A real client ("امل", pulled by Omar on
      // 2026-06-14, full call history since) showed up as "الرقم جديد — يمكن الإضافة" because her primary
      // number was the FIRST segment in a combined cell. Switched to phonesMatch(), which already exists
      // in this file specifically to split a "-"-joined multi-phone cell into its parts and clean/compare
      // each one individually — this is exactly the bug class it was built for, just not used here yet.
      var primaryMatch = (data[i][3] || "").toString().trim() && phonesMatch(phone, data[i][3]);
      // Also check the dedicated Phone2 column (2026-07-06) — a number already registered as someone's
      // SECOND number must still count as "already exists", not just their primary one.
      var phone2Match = (data[i][RAW_PHONE2_IDX] || "").toString().trim() && phonesMatch(phone, data[i][RAW_PHONE2_IDX]);
      if (primaryMatch || phone2Match) {
        return {
          success: true,
          found: true,
          client: {
            id: (data[i][0] || "").toString(),
            name: (data[i][2] || "غير معروف").toString(),
            phone: (data[i][3] || "").toString(),
            source: (data[i][4] || "").toString(),
            course: (data[i][5] || "").toString(),
            agent: (data[i][6] || "").toString(),
            status: (data[i][7] || "").toString(),
            campaign: (data[i][12] || "").toString()
          }
        };
      }
    }
    return { success: true, found: false };
  } catch (e) {
    // CRITICAL: do NOT return found:false on error — that would falsely show "رقم جديد"
    return { success: false, found: null, error: e.toString() };
  }
}

function addFreshLeadToSheet(agentKey, name, phone, source, campaign, course, addedById, addedByName, targetDate, phone2) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    phone = forceTextPhone(phone);
    var clean = cleanPhone(phone);

    // Check duplicate — uses phonesMatch() (see checkPhoneExists' 2026-07-06 fix note above) so a
    // combined "phone1 - phone2" Raw_Data cell can't hide a real duplicate in its first segment.
    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    for (var i = 1; i < rawData.length; i++) {
      var primaryDup = (rawData[i][3] || "").toString().trim() && phonesMatch(phone, rawData[i][3]);
      var phone2Dup = (rawData[i][RAW_PHONE2_IDX] || "").toString().trim() && phonesMatch(phone, rawData[i][RAW_PHONE2_IDX]);
      if (primaryDup || phone2Dup) {
        lock.releaseLock();
        var existName = (rawData[i][2] || "").toString().trim() || "غير معروف";
        var existAgent = (rawData[i][6] || "").toString().trim() || "—";
        return { success: false, alreadyExists: true, message: "⚠️ الرقم موجود بالفعل في النظام (العميل: " + existName + " | Agent: " + existAgent + ")" };
      }
    }

    // ADDITIONAL-PHONE FIX (2026-07-04): a second number for the SAME new client is fine, but it must
    // not already belong to a DIFFERENT existing client — otherwise "new number + registered number"
    // would silently attach someone else's number to this lead.
    var clean2 = phone2 ? cleanPhone(phone2.toString()) : "";
    if (clean2) {
      for (var i2 = 1; i2 < rawData.length; i2++) {
        var primaryDup2 = (rawData[i2][3] || "").toString().trim() && phonesMatch(phone2, rawData[i2][3]);
        var phone2Dup2 = (rawData[i2][RAW_PHONE2_IDX] || "").toString().trim() && phonesMatch(phone2, rawData[i2][RAW_PHONE2_IDX]);
        if (primaryDup2 || phone2Dup2) {
          lock.releaseLock();
          var existName2 = (rawData[i2][2] || "").toString().trim() || "غير معروف";
          return { success: false, alreadyExists: true, message: "⚠️ الرقم الإضافي مسجّل بالفعل لعميل آخر (" + existName2 + ") — لازم يكون رقم جديد فعلاً." };
        }
      }
    }

    // Get agent range for Fresh sheet
    var range = agentKey ? AGENT_RANGES[agentKey] : null;
    var addedToFreshSheet = false;
    if (range) {
      // Parse YYYY-MM-DD directly to avoid timezone issues
      var tabName;
      if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        var dp = targetDate.split('-');
        tabName = parseInt(dp[1]) + "/" + parseInt(dp[2]);
      } else {
        var tz = Session.getScriptTimeZone();
        tabName = Utilities.formatDate(new Date(), tz, "M/d");
      }
      var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
      var tab = distSS ? distSS.getSheetByName(tabName) : null;
      if (tab) {
        var data = tab.getDataRange().getValues();
        var baseCol = range.startCol - 1; // 0-based — defined HERE so it's valid in all branches
        // Find first empty row in agent's range
        for (var r = range.startRow - 1; r < range.endRow; r++) {
          var existingPhone = data[r] ? (data[r][baseCol + COL_PHONE] || "").toString().trim() : "";
          var existingPulled = data[r] ? (data[r][baseCol + COL_PULLED] || "").toString().trim() : "";
          if (!existingPhone && !existingPulled) {
            var freshRow = ["", "", "", "", "", "", ""];
            freshRow[0] = name || "";
            freshRow[COL_PHONE] = phone;
            freshRow[COL_SOURCE] = source || "يدوي";
            freshRow[COL_CAMP] = campaign || "";
            freshRow[COL_COURSE] = course || "Digital Marketing"; // FIX (2026-07-04): match the Courses sheet's real default — see note above
            tab.getRange(r + 1, range.startCol, 1, freshRow.length).setValues([freshRow]);
            SpreadsheetApp.flush();
            addedToFreshSheet = true;
            break;
          }
        }
      }
    }

    // Add to Raw_Data & My_Leads regardless
    var agentNameForRaw = agentKey || addedByName;
    var newId = getNextIdFromData(rawData);
    // 2026-07-06: phone2 used to be stuffed into the Notes text ("📱 رقم إضافي: ...") — now goes in its
    // own dedicated column (RAW_PHONE2_COL) instead, so it's a real, searchable/checkable value rather
    // than free text no duplicate-check ever looked at.
    appendRowWithTimestamp(rawSh, [newId, new Date(), name || "", phone, source || "يدوي", course || "", agentNameForRaw, "Assigned", "", "", "", "", campaign || ""]);
    if (clean2) { try { _ensureRawPhone2Header(rawSh); rawSh.getRange(rawSh.getLastRow(), RAW_PHONE2_COL).setValue(forceTextPhone(phone2)); } catch (e) {} }
    saveToMyLeads([newId, new Date(), name || "", phone, source || "يدوي", course || "", addedById, agentNameForRaw, "Assigned", "", "", campaign || ""]);
    logActivity(addedById, addedByName, "FRESH_MANUAL", "يدوي: " + phone + " → " + (agentKey || "—"));
    SpreadsheetApp.flush();
    lock.releaseLock();

    return {
      success: true,
      id: newId, name: name, phone: formatEgyptianPhone(phone),
      addedToFreshSheet: addedToFreshSheet,
      message: "✅ تم إضافة الليد" + (addedToFreshSheet ? " وأضيف لتاب الفريش الخاص بـ " + agentKey : " في Raw_Data فقط (رينج الموظف ممتلئ أو مش موجود)")
    };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally {
    try { lock.releaseLock(); } catch(le) {}
  }
}

function getAgentKeysForFresh() {
  return { keys: Object.keys(AGENT_RANGES) };
}

function getRoundMembersOrphans() {
  try {
    var rawData = getSheetDataCached("Raw_Data");
    var rawOcSet = {}, rawPhoneSet = {}, rawPhone8Set = {}, rawIdSet = {}, rawNameSet = {};
    for (var i = 1; i < rawData.length; i++) {
      var rId    = (rawData[i][0]  || "").toString().trim();
      var rName  = (rawData[i][2]  || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
      var rPhone = cleanPhone((rawData[i][3] || "").toString().trim());
      var rOc    = (rawData[i][14] || "").toString().trim().toUpperCase();
      if (rId)    rawIdSet[rId]    = true;
      if (rPhone) {
        rawPhoneSet[rPhone] = true;
        // last-8-digits fallback
        if (rPhone.length >= 8) rawPhone8Set[rPhone.slice(-8)] = true;
      }
      if (rOc && rOc.indexOf("OC-") === 0) rawOcSet[rOc] = true;
      if (rName.length > 3) rawNameSet[rName] = true;
    }

    var rmSh = getSheet("Round_Members");
    if (!rmSh) return { orphans: [], total: 0 };
    var rmData = rmSh.getDataRange().getValues();

    var orphans = [];
    for (var j = 1; j < rmData.length; j++) {
      var roundId   = (rmData[j][0]  || "").toString().trim();
      var ocCode    = (rmData[j][1]  || "").toString().trim();
      var name      = (rmData[j][2]  || "").toString().trim();
      var phone     = cleanPhone((rmData[j][3] || "").toString().trim());
      var agentName = (rmData[j][10] || "").toString().trim();
      var createdAt = rmData[j][11] ? rmData[j][11].toString() : "";

      if (!ocCode && !name && !phone) continue;

      var ocUpper   = ocCode.toUpperCase();
      var normName  = name.toLowerCase().replace(/\s+/g, " ");
      var phone8    = phone.length >= 8 ? phone.slice(-8) : "";

      var matched =
        (ocUpper && (rawOcSet[ocUpper] || rawIdSet[ocCode])) ||
        (phone   && rawPhoneSet[phone])                      ||
        (phone8  && rawPhone8Set[phone8])                    ||
        (normName.length > 3 && rawNameSet[normName]);

      if (!matched) {
        // Try to find the closest Raw_Data row by partial name for diagnosis
        var rawHint = "";
        if (normName.length > 3) {
          for (var ri = 1; ri < rawData.length; ri++) {
            var rdName = (rawData[ri][2] || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
            var rdPhone = cleanPhone((rawData[ri][3] || "").toString().trim());
            var rdOc    = (rawData[ri][14] || "").toString().trim();
            // partial match: first word of name
            var firstWord = normName.split(" ")[0];
            if (firstWord.length > 2 && rdName.indexOf(firstWord) !== -1) {
              rawHint = "Raw_Data صف " + (ri + 1) + ": تليفون=" + rdPhone + " | OC=" + rdOc;
              break;
            }
          }
        }
        orphans.push({
          row: j + 1,
          roundId: roundId,
          ocCode: ocCode,
          name: name,
          phone: phone,
          agentName: agentName,
          createdAt: createdAt,
          rawHint: rawHint
        });
      }
    }

    return { orphans: orphans, total: rmData.length - 1 };
  } catch (e) {
    return { error: e.toString(), orphans: [], total: 0 };
  }
}

function fixAllClientPaymentCalculations() {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    // Build transaction totals map: payId → total paid amount
    var txSh = getSheet("Payment_Transactions");
    var txMap = {};
    if (txSh) {
      var txData = txSh.getDataRange().getValues();
      for (var t = 1; t < txData.length; t++) {
        var pId = (txData[t][1] || "").toString().trim();
        var amt = parseFloat(txData[t][3]) || 0;
        if (pId && amt > 0) {
          txMap[pId] = (txMap[pId] || 0) + amt;
        }
      }
    }

    var cpSh = getSheet("Client_Payments");
    if (!cpSh) { lock.releaseLock(); return { error: "مفيش شيت Client_Payments", fixed: 0 }; }
    var data = cpSh.getDataRange().getValues();

    var fixed = 0;
    var skipped = 0;
    var details = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      var isDeleted = row[19];
      if (isDeleted === true || isDeleted === "TRUE" || isDeleted === "true" || isDeleted === 1) continue;

      var payId   = row[0].toString().trim();
      var name    = (row[2] || "").toString().trim();
      var total   = parseFloat(row[6]) || 0;
      var oldPaid = parseFloat(row[9]) || 0;
      var oldRem  = parseFloat(row[10]) || 0;

      // Sum of transactions for this payment
      var txPaid = txMap[payId] || 0;

      // If no transactions recorded, use stored paid (don't touch it)
      if (!txMap[payId]) { skipped++; continue; }

      var newPaid = txPaid;
      var newRem  = Math.max(0, total - newPaid);
      var newStatus = newRem <= 0 ? "Paid" : (row[12] === "Paid" ? "Installment" : (row[12] || "Installment"));

      // Only update if values changed
      var paidDiff = Math.abs(newPaid - oldPaid) > 0.01;
      var remDiff  = Math.abs(newRem - oldRem) > 0.01;
      var statusWrong = newRem <= 0 && row[12] !== "Paid";

      if (paidDiff || remDiff || statusWrong) {
        cpSh.getRange(i + 1, 10).setValue(newPaid);   // paid
        cpSh.getRange(i + 1, 11).setValue(newRem);    // remaining
        if (statusWrong) cpSh.getRange(i + 1, 13).setValue("Paid"); // status
        fixed++;
        details.push({
          name: name,
          payId: payId,
          oldPaid: oldPaid,
          newPaid: newPaid,
          oldRem: oldRem,
          newRem: newRem
        });
      }
    }

    lock.releaseLock();
    return { fixed: fixed, skipped: skipped, total: data.length - 1, details: details };
  } catch (e) {
    try { LockService.getScriptLock().releaseLock(); } catch (_) {}
    return { error: e.toString(), fixed: 0 };
  }
}

function migrateLeadDay(fromDay, toDay, operatorId, operatorName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var today = new Date();
    var month = today.getMonth() + 1;
    var fromTab = month + "/" + parseInt(fromDay);
    var toTab   = month + "/" + parseInt(toDay);

    var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    if (!distSS) return { success: false, message: "تعذّر فتح شيت التوزيع" };

    var srcSheet = distSS.getSheetByName(fromTab);
    if (!srcSheet) return { success: false, message: "التاب " + fromTab + " غير موجود" };

    // Create destination tab if missing
    var dstSheet = distSS.getSheetByName(toTab);
    if (!dstSheet) {
      dstSheet = srcSheet.copyTo(distSS);
      dstSheet.setName(toTab);
      // Clear all lead data in the new tab (keep formatting)
      for (var ak in AGENT_RANGES) {
        var rng = AGENT_RANGES[ak];
        dstSheet.getRange(rng.startRow, rng.startCol, rng.endRow - rng.startRow + 1, 7).clearContent();
      }
    }

    var srcData = srcSheet.getDataRange().getValues();
    var dstData = dstSheet.getDataRange().getValues();
    var moved = 0, skipped = 0;

    for (var agentKey in AGENT_RANGES) {
      var range = AGENT_RANGES[agentKey];
      var base = range.startCol - 1;

      for (var r = range.startRow - 1; r < range.endRow; r++) {
        if (!srcData[r]) continue;
        var phone  = (srcData[r][base + COL_PHONE]  || "").toString().trim();
        var pulled = (srcData[r][base + COL_PULLED] || "").toString().trim();
        if (!phone) continue;
        if (pulled) continue; // لا تنقل الليدات المسحوبة

        // Find first empty slot in destination for this agent
        var placed = false;
        for (var d = range.startRow - 1; d < range.endRow; d++) {
          if (!dstData[d]) continue;
          var destPhone  = (dstData[d][base + COL_PHONE]  || "").toString().trim();
          var destPulled = (dstData[d][base + COL_PULLED] || "").toString().trim();
          if (destPhone || destPulled) continue;

          // Copy the full row slice to destination
          var rowSlice = srcData[r].slice(base, base + 7);
          dstSheet.getRange(d + 1, range.startCol, 1, rowSlice.length).setValues([rowSlice]);
          // Mark slot as occupied in local copy so next iteration sees it
          dstData[d] = dstData[d].slice();
          for (var ci = 0; ci < rowSlice.length; ci++) dstData[d][base + ci] = rowSlice[ci];

          // Clear from source
          srcSheet.getRange(r + 1, range.startCol, 1, 7).clearContent();
          moved++;
          placed = true;
          break;
        }
        if (!placed) skipped++;
      }
    }

    SpreadsheetApp.flush();
    lock.releaseLock();
    logActivity(operatorId, operatorName, "MIGRATE_DAY",
      "نقل " + moved + " ليد من تاب " + fromTab + " → " + toTab + (skipped ? " | " + skipped + " تجاوز (مش لاقي فراغ)" : ""));
    return { success: true, moved: moved, skipped: skipped,
      message: "✅ تم نقل " + moved + " ليد من " + fromTab + " إلى " + toTab + (skipped ? "\n⚠️ " + skipped + " ليد لم يُنقل (الرنج ممتلئ)" : "") };
  } catch(e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally {
    try { lock.releaseLock(); } catch(le) {}
  }
}

function updateFreshLeadDetails(phone, newName, newSource, newCampaign, newCourse, operatorId, operatorName, selectedDay) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var clean = cleanPhone(phone);

    // 1. Update Raw_Data (name=col2, source=col4, campaign=col12, course=col5)
    var rawSh = getSheet("Raw_Data");
    var updated = false;
    if (rawSh) {
      var rawData = rawSh.getDataRange().getValues();
      for (var i = rawData.length - 1; i >= 1; i--) {
        var rp = cleanPhone((rawData[i][3] || "").toString());
        if (rp && (rp === clean || rp.slice(-9) === clean.slice(-9))) {
          if (newName)     rawSh.getRange(i + 1, 3).setValue(newName);
          if (newSource)   rawSh.getRange(i + 1, 5).setValue(newSource);
          if (newCourse)   rawSh.getRange(i + 1, 6).setValue(newCourse);
          rawSh.getRange(i + 1, 13).setValue(newCampaign || "");
          updated = true;
          break;
        }
      }
    }

    // 2. Update distribution sheet tab
    var today = new Date();
    var day = selectedDay ? parseInt(selectedDay) : today.getDate();
    var tz = Session.getScriptTimeZone();
    var tabName = Utilities.formatDate(new Date(today.getFullYear(), today.getMonth(), day), tz, "M/d");
    var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    var tab = distSS ? distSS.getSheetByName(tabName) : null;
    if (tab) {
      var tabData = tab.getDataRange().getValues();
      for (var k in AGENT_RANGES) {
        var range = AGENT_RANGES[k];
        var fBase = range.startCol - 1;
        for (var r = range.startRow - 1; r < range.endRow; r++) {
          if (!tabData[r]) continue;
          var rPhone = cleanPhone((tabData[r][fBase + COL_PHONE] || "").toString());
          if (rPhone && (rPhone === clean || rPhone.slice(-9) === clean.slice(-9))) {
            if (newName)     tab.getRange(r + 1, range.startCol).setValue(newName);
            if (newSource)   tab.getRange(r + 1, range.startCol + COL_SOURCE).setValue(newSource);
            if (newCampaign !== undefined) tab.getRange(r + 1, range.startCol + COL_CAMP).setValue(newCampaign || "");
            if (newCourse)   tab.getRange(r + 1, range.startCol + COL_COURSE).setValue(newCourse);
            break;
          }
        }
      }
    }

    logActivity(operatorId, operatorName, "EDIT_LEAD", "تعديل: " + phone + " — " + [newName, newSource, newCampaign, newCourse].filter(Boolean).join(" | "));
    SpreadsheetApp.flush();
    lock.releaseLock();
    // FIX-02 (S19a): report failure when the phone matched no Raw_Data row, instead of
    // returning success:true with only a warning text (a phantom "edit"). When a row was
    // found and updated, the response is unchanged ({success:true, "✅ ...").
    return { success: updated, message: updated ? "✅ تم تحديث بيانات الليد" : "⚠️ لم يُعثر على الرقم في Raw_Data" };
  } catch(e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally {
    try { lock.releaseLock(); } catch(le) {}
  }
}

function getFreshLeadAgentStats(selectedDay) {
  try {
    var today = new Date();
    var day = selectedDay ? parseInt(selectedDay) : today.getDate();
    var tabName = (today.getMonth() + 1) + "/" + day;
    var tz = Session.getScriptTimeZone();

    // PRIMARY source of truth: count the leads actually PRESENT in today's tab in the distribution
    // sheet. (FRESH-STATS FIX 2026-06-27: the old code counted Activity_Log FRESH_MANUAL by the
    // ACTION date, which over-counted — a lead added to a DIFFERENT day's tab today, or moved via
    // migrate/transfer, still showed under today. Counting the tab matches exactly what's in the sheet:
    // e.g. a lead added into the 6/27 tab no longer inflates the 6/28 counter.)
    var agentCounts = {};
    var countedFromTab = false;
    try {
      var _distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
      var _tab = _distSS ? _distSS.getSheetByName(tabName) : null;
      if (_tab) {
        var _tabData = _tab.getDataRange().getValues();
        for (var _k in AGENT_RANGES) {
          var _rng = AGENT_RANGES[_k];
          var _base = _rng.startCol - 1;
          var _cnt = 0;
          for (var _r = _rng.startRow - 1; _r < _rng.endRow; _r++) {
            if (!_tabData[_r]) continue;
            if ((_tabData[_r][_base + COL_PHONE] || "").toString().trim()) _cnt++;
          }
          agentCounts[_k] = _cnt;
        }
        countedFromTab = true;
      }
    } catch (_te) { /* fall back to Activity_Log below */ }

    // FALLBACK (only if the tab is missing/unreadable): approximate from Activity_Log by action-date.
    var targetDateStr = Utilities.formatDate(new Date(today.getFullYear(), today.getMonth(), day), tz, "yyyy-MM-dd");
    var logSh = !countedFromTab ? getSheet("Activity_Log") : null;
    if (logSh) {
      var logData = logSh.getDataRange().getValues();
      for (var i = logData.length - 1; i >= 1; i--) {
        var row = logData[i];
        if (!row[0]) continue;
        var action = (row[3] || "").toString().trim();
        if (action !== "FRESH_MANUAL" && action !== "TRANSFER_LEAD") continue;
        var rowDate = "";
        try { rowDate = Utilities.formatDate(new Date(row[0]), tz, "yyyy-MM-dd"); } catch(e) { continue; }
        if (rowDate !== targetDateStr) continue;
        var details = (row[4] || "").toString();
        var key = "";
        if (action === "FRESH_MANUAL") {
          var m = details.match(/يدوي:.+?→\s*(.+)/);
          if (m) key = m[1].trim();
        } else if (action === "TRANSFER_LEAD") {
          // نقل: phone من X → Y  — add to new agent, subtract from old
          var mt = details.match(/نقل:.+?من\s+(.+?)\s+→\s+(.+)/);
          if (mt) {
            var fromKey = mt[1].trim(), toKey = mt[2].trim();
            agentCounts[fromKey] = (agentCounts[fromKey] || 0) - 1;
            agentCounts[toKey]   = (agentCounts[toKey]   || 0) + 1;
          }
          continue;
        }
        if (key) agentCounts[key] = (agentCounts[key] || 0) + 1;
      }
    }

    var stats = [];
    for (var k in AGENT_RANGES) {
      var range = AGENT_RANGES[k];
      var total = range.endRow - range.startRow + 1;
      stats.push({ key: k, count: Math.max(0, agentCounts[k] || 0), total: total });
    }
    return { stats: stats, tabName: tabName, source: countedFromTab ? 'tab' : 'log' };
  } catch (e) {
    return { error: e.toString(), stats: [] };
  }
}

function transferFreshLead(phone, fromAgentKey, toAgentKey, operatorId, operatorName, selectedDay) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    if (!AGENT_RANGES[toAgentKey]) return { success: false, message: "الوكيل الجديد غير معرّف" };
    var clean = cleanPhone(phone);

    var today = new Date();
    var day = selectedDay ? parseInt(selectedDay) : today.getDate();
    var tabName = (today.getMonth() + 1) + "/" + day;
    var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    var tab = distSS ? distSS.getSheetByName(tabName) : null;
    var leadRowData = null;

    // Step 1: Find & remove from old agent's range in distribution sheet
    if (tab && fromAgentKey && AGENT_RANGES[fromAgentKey]) {
      var fRange = AGENT_RANGES[fromAgentKey];
      var tabData = tab.getDataRange().getValues();
      var fBase = fRange.startCol - 1;
      for (var r = fRange.startRow - 1; r < fRange.endRow; r++) {
        if (!tabData[r]) continue;
        var rPhone = cleanPhone((tabData[r][fBase + COL_PHONE] || "").toString());
        if (rPhone && (rPhone === clean || rPhone.slice(-9) === clean.slice(-9))) {
          leadRowData = tabData[r].slice(fBase, fBase + 7);
          tab.getRange(r + 1, fRange.startCol, 1, 7).clearContent();
          break;
        }
      }
    }

    // Step 2: Write to new agent's range
    var tRange = AGENT_RANGES[toAgentKey];
    if (tab && tRange) {
      var tabData2 = tab.getDataRange().getValues();
      var tBase = tRange.startCol - 1;
      for (var rr = tRange.startRow - 1; rr < tRange.endRow; rr++) {
        var ep = tabData2[rr] ? (tabData2[rr][tBase + COL_PHONE] || "").toString().trim() : "";
        var epu = tabData2[rr] ? (tabData2[rr][tBase + COL_PULLED] || "").toString().trim() : "";
        if (!ep && !epu) {
          var newRow = leadRowData ? leadRowData.slice() : ["","",forceTextPhone(phone),"","","",""];
          tab.getRange(rr + 1, tRange.startCol, 1, Math.max(newRow.length, 7)).setValues([newRow]);
          break;
        }
      }
    }

    // Step 3: Update Raw_Data agent
    var rawSh = getSheet("Raw_Data");
    if (rawSh) {
      var rawData = rawSh.getDataRange().getValues();
      for (var ri = rawData.length - 1; ri >= 1; ri--) {
        var rp = cleanPhone((rawData[ri][3] || "").toString());
        if (rp && (rp === clean || rp.slice(-9) === clean.slice(-9))) {
          rawSh.getRange(ri + 1, 7).setValue(toAgentKey);
          break;
        }
      }
    }

    // Step 4: Log
    logActivity(operatorId, operatorName, "TRANSFER_LEAD", "نقل: " + phone + " من " + (fromAgentKey || "—") + " → " + toAgentKey);
    SpreadsheetApp.flush();
    lock.releaseLock();
    return { success: true, message: "✅ تم نقل الليد من " + (fromAgentKey || "—") + " إلى " + toAgentKey };
  } catch(e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally {
    try { lock.releaseLock(); } catch(le) {}
  }
}

function getServerDate() {
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
}

function getTodayFreshLeads() {
  try {
    var logSheet = getSheet("Activity_Log");
    if (!logSheet) return { leads: [] };
    var data = logSheet.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var todayDate = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    var leads = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var row = data[i];
      if (!row[0]) continue;
      var action = (row[3] || "").toString().trim();
      if (action !== "FRESH_MANUAL") continue;
      var rowDate = "";
      try { rowDate = Utilities.formatDate(new Date(row[0]), tz, "yyyy-MM-dd"); } catch(e) { continue; }
      if (rowDate !== todayDate) continue;
      // details format: "يدوي: phone → agentKey"
      var details = (row[4] || "").toString();
      var phone = "", agentKey = "";
      var m = details.match(/يدوي:\s*(.+?)\s*→\s*(.+)/);
      if (m) { phone = m[1].trim(); agentKey = m[2].trim(); }
      leads.push({
        addedBy: (row[2] || "").toString(),
        phone: phone,
        agentKey: agentKey,
        time: Utilities.formatDate(new Date(row[0]), tz, "HH:mm"),
        details: details
      });
    }
    // Enrich with name/campaign from Raw_Data
    if (leads.length) {
      var rawSh = getSheet("Raw_Data");
      var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
      leads.forEach(function (l) {
        var cleanP = cleanPhone(l.phone);
        for (var j = rawData.length - 1; j >= 1; j--) {
          var rp = cleanPhone((rawData[j][3] || "").toString());
          if (rp === cleanP && cleanP) {
            l.name     = (rawData[j][2]  || "").toString();
            l.source   = (rawData[j][4]  || "").toString();
            l.course   = (rawData[j][5]  || "").toString();
            l.campaign = (rawData[j][12] || "").toString();
            break;
          }
        }
      });
    }
    return { leads: leads, todayDate: todayDate, todayDay: parseInt(Utilities.formatDate(new Date(), tz, "d")) };
  } catch (e) {
    return { leads: [], error: e.toString() };
  }
}

// NEW (2026-07-06): full live view of a sales's own range in today's (or a selected day's) distribution
// tab — every name in their block, not just the ones added manually — with a pulled/not-pulled flag so
// the "آخر الليدات المضافة اليوم" card can show a strikethrough on already-pulled names and let the
// sales see at a glance who's pulled, who isn't yet, and who's new.
function getTodayRangeLeadsForAgent(agentKey, agentName, selectedDay) {
  try {
    var key = agentKey || agentName;
    var range = AGENT_RANGES[key];
    if (!range) return { success: false, leads: [], message: "⚠️ لم يتم تحديد range لهذا الموظف." };

    var tz = Session.getScriptTimeZone();
    var today = new Date();
    var day = selectedDay ? parseInt(selectedDay) : today.getDate();
    var tabName = (today.getMonth() + 1) + "/" + day;
    var distSS = openSpreadsheetCached(DISTRIBUTION_SHEET_ID);
    var sheet = distSS.getSheetByName(tabName);
    if (!sheet) return { success: true, leads: [], tabName: tabName, todayDay: day };

    var data = sheet.getDataRange().getValues();
    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    var rawNames = {};
    for (var idx = 1; idx < rawData.length; idx++) {
      var pClean = cleanPhone(rawData[idx][3]);
      if (pClean) rawNames[pClean] = (rawData[idx][2] || "").toString().trim();
    }

    var baseCol = range.startCol - 1;
    var leads = [];
    for (var r = range.startRow - 1; r < range.endRow; r++) {
      if (!data[r]) continue;
      var phone = data[r][baseCol + COL_PHONE] ? data[r][baseCol + COL_PHONE].toString().trim() : "";
      if (!phone) continue;
      var pulledText = data[r][baseCol + COL_PULLED] ? data[r][baseCol + COL_PULLED].toString().trim() : "";
      leads.push({
        phone: phone,
        name: rawNames[cleanPhone(phone)] || "",
        campaign: data[r][baseCol + COL_CAMP] ? data[r][baseCol + COL_CAMP].toString().trim() : "",
        pulled: !!pulledText,
        pulledText: pulledText
      });
    }
    return { success: true, leads: leads, tabName: tabName, todayDay: day };
  } catch (e) {
    return { success: false, leads: [], message: "خطأ: " + e.toString() };
  }
}

// ==========================================
// PULL RECYCLE
// ==========================================
function getRecyclePullCount(agentId) {
  try {
    var count = 0;
    var logSheet = getSheet("Activity_Log");
    if (logSheet) {
      var logData = logSheet.getDataRange().getValues();
      var today = todayStr();
      for (var k = logData.length - 1; k >= 1; k--) {
        var logRow = logData[k];
        if (!logRow[0]) continue;
        var logDateStr = "";
        try {
          logDateStr = Utilities.formatDate(new Date(logRow[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
        } catch(e) { continue; }
        if (logDateStr < today) {
          break;
        }
        if (logRow[3] === "PULL_RECYCLE" && logRow[1].toString().trim() === agentId.toString().trim()) {
          if (logDateStr === today) {
            count++;
          }
        }
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

function pullRecycledLeadRandomly(agentId, agentName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var count = getRecyclePullCount(agentId);
    if (count >= 20) return { success: false, message: "🚨 وصلت للحد الأقصى اليومي (20 ليد ريسيكل)." };

    var sh = getSheet("Raw_Data");
    var data = sh.getDataRange().getValues();
    var eligible = [];
    var targets = ["closed lost", "follow up", "delayed", "no answer", "لم يرد"];
    var agentNameLower = (agentName || "").toString().trim().toLowerCase();
    // LEAD-LEAK FIX: a lead owned by another agent in My_Leads must never be
    // recycled to a colleague, even if its Raw_Data agent cell is blank/stale.
    var myOwners = _myLeadsPhoneOwners();

    for (var i = 1; i < data.length; i++) {
      var act = (data[i][10] || data[i][9] || "").toString().toLowerCase(); // Check new action, fallback to action
      var stat = (data[i][7] || "").toString().toLowerCase();
      var agent = (data[i][6] || "").toString().trim();
      var agentLower = agent.toLowerCase();
      // Only eligible if: (action/status matches recycle targets) AND no agent assigned at all.
      // Once a lead has any agent assigned (fresh or recycle pull), it stays with that agent
      // and is managed through My_Leads — it should NOT re-enter the recycle pool.
      var agentMatch = (agent === "");
      // …and not already owned by a DIFFERENT agent in My_Leads (drift guard).
      var _mlOwner = myOwners[cleanPhone(data[i][3])];
      var ownedElsewhere = _mlOwner && _mlOwner !== "المدير" && _mlOwner.toLowerCase() !== agentNameLower;
      if (targets.some(function (t) { return act.indexOf(t) !== -1 || stat.indexOf(t) !== -1; }) && agentMatch && !ownedElsewhere) {
        eligible.push({ rowIndex: i + 1, rowData: data[i] });
      }
    }
    if (!eligible.length) return { success: false, message: "🚨 لا توجد ليدات متاحة للريسيكل." };

    var sel = eligible[Math.floor(Math.random() * eligible.length)];
    var ld = sel.rowData;
    // CRITICAL FIX: Never use row index as ID — row indices can collide with other clients' numeric IDs.
    // Always generate a fresh UUID when the lead has no ID.
    var masterId = (ld[0] || "").toString().trim();
    if (!masterId) {
      masterId = genId();
      sh.getRange(sel.rowIndex, 1).setValue(masterId);
    }
    sh.getRange(sel.rowIndex, 7).setValue(agentName);
    sh.getRange(sel.rowIndex, 8).setValue("Recycled Assigned");

    var lastNote = ld[8] ? ld[8].toString().split("\n").filter(function (l) { return l.trim(); }).pop() : "";
    // FIX: Sanitize Follow Up Date to prevent epoch 1970/1985/2000 date corruption
    var fuDateVal = ld[11]; // index 11 is Follow Up Date
    var fuDateSafe = "";
    if (fuDateVal) {
      var fuParsed = (fuDateVal instanceof Date) ? fuDateVal : new Date(fuDateVal);
      if (!isNaN(fuParsed.getTime()) && fuParsed.getFullYear() > 2000) {
        fuDateSafe = fuParsed;
      }
    }
    // Campaign is at index 11 (Col L)
    saveToMyLeads([masterId, new Date(), ld[2], forceTextPhone(ld[3]), ld[4], ld[5], agentId, agentName, "Recycled Assigned", ld[8] || "", fuDateSafe || "", ld[12] || ""]);
    logActivity(agentId, agentName, "PULL_RECYCLE", "ريسيكل: " + ld[2]);

    SpreadsheetApp.flush();
    return { success: true, id: masterId, name: ld[2], phone: formatEgyptianPhone(ld[3]), course: ld[5], lastNote: lastNote, remaining: 20 - count - 1, source: ld[4] || "", campaign: ld[12] || "" };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally { lock.releaseLock(); }
}

// Bug #4 Fix: deduplicate before appending or update existing record to avoid duplicate IDs in My_Leads.
function saveToMyLeads(row) {
  var sh = getSheet("My_Leads");
  var clientId = row[0] ? row[0].toString() : "";
  if (clientId) {
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (idsMatch(data[i][0], clientId)) {
        // Update the existing row in My_Leads — preserve notes and FU date if new values are empty
        sh.getRange(i + 1, 2).setValue(row[1]); // Date
        if (row[2] && row[2].toString().trim()) sh.getRange(i + 1, 3).setValue(row[2]); // Name — only if not empty
        sh.getRange(i + 1, 4).setValue(row[3]); // Phone
        sh.getRange(i + 1, 5).setValue(row[4]); // Source
        sh.getRange(i + 1, 6).setValue(row[5]); // Course
        sh.getRange(i + 1, 7).setValue(row[6]); // AgentID
        sh.getRange(i + 1, 8).setValue(row[7]); // AgentName
        sh.getRange(i + 1, 9).setValue(row[8]); // Status
        // Append to notes instead of overwriting to prevent lead data loss
        if (row[9] !== undefined && row[9] !== null && row[9].toString().trim() !== "") {
          var existingNotes = (data[i][9] || "").toString().trim();
          var newNote = row[9].toString().trim();
          if (existingNotes.indexOf(newNote) === -1) {
            sh.getRange(i + 1, 10).setValue(existingNotes ? existingNotes + "\n" + newNote : newNote);
          }
        }
        // Preserve existing FU date if new value is empty
        if (row[10] !== undefined && row[10] !== null && row[10] !== "") {
          sh.getRange(i + 1, 11).setValue(row[10]);
        }
        if (row[11] !== undefined && row[11] !== null) sh.getRange(i + 1, 12).setValue(row[11]); // Campaign
        SpreadsheetApp.flush();
        return;
      }
    }
  }
  sh.appendRow(row);
  SpreadsheetApp.flush();
}

// ==========================================
// SAVE CALL
// ==========================================
function updateLeadWithFollowUp(clientId, action, comment, fuDate, agentId, agentName, roundId, roundName, price, paid, method, phone1, phone2, inst1, inst2, inst3, offer, newClientName, inst1Date, inst2Date, inst3Date, clientType, finAction, expectedLastModified) {
  _requestCache = {}; // reset cache for this request
  var cleanClientId = (clientId || "").toString().trim();
  if (cleanClientId === "—" || cleanClientId === "-" || cleanClientId.toLowerCase() === "null" || cleanClientId.toLowerCase() === "undefined" || !cleanClientId) {
    return { success: false, message: "لم يتم تحديد كود العميل!" };
  }
  clientId = cleanClientId;
  
  // التحقق من صلاحيات العميل ومنع تداخل السيلز مع عملاء بعضهم البعض
  var isManager = isUserAdminOrManager(agentId);
  if (!isManager) {
    var rawSh = getSheet("Raw_Data");
    if (rawSh) {
      var rawData = getSheetDataCached("Raw_Data");
      for (var r = 1; r < rawData.length; r++) {
        if (idsMatch(rawData[r][0], clientId)) {
          var assignedAgent = (rawData[r][6] || "").toString().trim();
          if (assignedAgent && assignedAgent !== "المدير" && assignedAgent.toLowerCase() !== agentName.toString().trim().toLowerCase()) {
            return { success: false, message: "🚨 عذراً، هذا العميل مخصص لموظف آخر وهو (" + assignedAgent + ") ولا يمكنك التعديل عليه أو تسجيل إجراء!" };
          }
          break;
        }
      }
    }
  }
  
  // Check if round is active for Closed Won / Reservation
  var wonActions = ["Closed Won", "Closed Won Recommendation", "Reservation"];
  if (wonActions.indexOf(actionBase) !== -1 && roundId) {
    try {
      var roundsSh = getSheet("Rounds");
      if (roundsSh) {
        var rData = roundsSh.getDataRange().getValues();
        var isRoundActive = true;
        for (var r = 1; r < rData.length; r++) {
          if ((rData[r][0]||"").toString() === roundId.toString()) {
            var rStatus = (rData[r][6] || "Active").toString().trim().toLowerCase();
            if (rStatus !== "active") {
              isRoundActive = false;
            }
            break;
          }
        }
        if (!isRoundActive) {
          return { success: false, message: "⚠️ الحجز مغلق على هذه المجموعة حالياً ولا يمكن تسجيل عملاء بها." };
        }
      }
    } catch(e) {}
  }

  // Extract base action and optional lost reason (format: "Closed Lost::Price")
  var actionBase = action.split('::')[0].trim();
  var lostReasonLabel = action.indexOf('::') !== -1 ? action.split('::')[1].trim() : '';

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ts = nowStr();
    var isPaymentAction = (["Closed Won", "Closed Won Recommendation", "Reservation"].indexOf(actionBase) !== -1);
    var fmt = "[" + ts + " - " + agentName + "] (" + actionBase + ")" +
      (lostReasonLabel ? " [سبب: " + lostReasonLabel + "]" : "") + ": " + comment;
    if (fuDate) fmt += " | 📅 FU: " + fuDate;
    if (roundId) fmt += " | 🎓 Round: " + roundName;
    // Only include payment details for payment actions, not No Answer / Delayed etc.
    if (isPaymentAction) {
      if (price) fmt += " | 💰 Price: " + price + " EGP";
      if (paid) fmt += " | ✅ Paid: " + paid + " EGP";
      if (method) fmt += " | 💳 Method: " + method;
    }

    var clientName = "";
    var clientPhone = "";
    var courseName = "";
    var ocCode = "";
    var campaignTypeVal = "";

    // 1. Determine phone1/phone2 to write — kept as TWO separate values now (see RAW_PHONE2_COL note
    // above), never glued into one cell with " - " like before.
    var phone1Formatted = phone1 ? formatEgyptianPhone(phone1) : "";
    var phone2Formatted = phone2 ? formatEgyptianPhone(phone2) : "";

    // My_Leads
    var lsh = getSheet("My_Leads");
    var ldata = getSheetDataCached("My_Leads");
    for (var i = 1; i < ldata.length; i++) {
      if (idsMatch(ldata[i][0], clientId) &&
        (ldata[i][6] || "").toString().trim() === agentId.toString().trim()) {
        var old = (ldata[i][9] || "").toString().trim(); // Column J (Notes, index 9)
        var comb = old ? old + "\n" + fmt : fmt;
        lsh.getRange(i + 1, 9).setValue(actionBase);        // Column I (Action, index 8)
        lsh.getRange(i + 1, 10).setValue(comb);            // Column J (Notes, index 9)
        if (fuDate) lsh.getRange(i + 1, 11).setValue(new Date(fuDate)); // Column K (Follow Up Date, index 10)
        else lsh.getRange(i + 1, 11).setValue("");
        if (phone1Formatted) lsh.getRange(i + 1, 4).setValue(phone1Formatted);
        if (newClientName && newClientName.toString().trim() && newClientName.toString().trim() !== (ldata[i][2] || "").toString().trim()) {
          lsh.getRange(i + 1, 3).setValue(newClientName.toString().trim());
        }
      }
    }

    // Raw_Data
    var msh = getSheet("Raw_Data");
    var lastModColM = ensureLastModifiedColumn(msh);
    var mdata = getSheetDataCached("Raw_Data");
    // FIX-02 (S1): track whether the clientId actually matched a Raw_Data row.
    // The write block below runs only inside the idsMatch branch; without this flag
    // a no-match save was silently logged as success and the call was lost.
    var rawRowFound = false;
    for (var j = 1; j < mdata.length; j++) {
      if (idsMatch(mdata[j][0], clientId)) {
        
        // CHECK Row Versioning CONFLICT
        // Normalize both values to ISO strings for reliable comparison
        // (Google Sheets may store ISO strings as Date objects when read back)
        var currentModified = mdata[j][lastModColM - 1] || "";
        var _normCurrent = currentModified ? (currentModified instanceof Date ? currentModified.toISOString() : currentModified.toString().trim()) : "";
        var _normExpected = expectedLastModified ? expectedLastModified.toString().trim() : "";
        // Also compare as timestamps to handle minor format differences
        var _conflict = false;
        if (_normExpected && _normCurrent) {
          if (_normCurrent !== _normExpected) {
            // Try numeric comparison as a fallback (both parsed as dates)
            var _tsC = new Date(_normCurrent).getTime();
            var _tsE = new Date(_normExpected).getTime();
            if (!isNaN(_tsC) && !isNaN(_tsE) && _tsC !== _tsE) {
              _conflict = true;
            } else if (isNaN(_tsC) || isNaN(_tsE)) {
              // Not parseable dates — fall back to string comparison
              _conflict = true;
            }
          }
        }
        if (_conflict) {
          lock.releaseLock();
          return { success: false, message: "⚠️ عذراً، تم تعديل بيانات هذا العميل بواسطة مستخدم آخر في نفس الوقت. يرجى تحديث الصفحة والمحاولة مرة أخرى." };
        }
        
        clientName = mdata[j][2] || "";
        if (newClientName && newClientName.toString().trim() && newClientName.toString().trim() !== clientName) {
          var targetNewName = newClientName.toString().trim();
          msh.getRange(j + 1, 3).setValue(targetNewName);
          clientName = targetNewName;
        }
        if (phone1Formatted) {
          msh.getRange(j + 1, 4).setValue(phone1Formatted);
          clientPhone = phone1Formatted;
        } else {
          clientPhone = mdata[j][3] || "";
        }
        // Second number goes in its OWN column now — never glued onto the primary phone cell.
        if (phone2Formatted) { _ensureRawPhone2Header(msh); msh.getRange(j + 1, RAW_PHONE2_COL).setValue(phone2Formatted); }
        courseName = mdata[j][5] || "";
        
        var colValM = (mdata[j][12] || "").toString().trim();
        if (colValM && colValM.toLowerCase().indexOf("oc-") !== 0) {
          campaignTypeVal = colValM;
        }
        // Column O (index 14) is dedicated OC_Code column
        var rawOcO = (mdata[j][14] || "").toString().trim();
        var ocCode = ensureOcCode(rawOcO, clientId, clientPhone || mdata[j][3], clientName || mdata[j][2]);
        if (ocCode && ocCode !== rawOcO) {
          msh.getRange(j + 1, 15).setValue(ocCode);
        }

        var oldM = (mdata[j][8] || "").toString().trim();
        var combM = oldM ? oldM + "\n" + fmt : fmt;
        msh.getRange(j + 1, 7).setValue(agentName);
        msh.getRange(j + 1, 8).setValue("Contacted");
        msh.getRange(j + 1, 9).setValue(combM);

        // Write action: original action remains unchanged if already present. New action always goes to Col K.
        var originalAction = mdata[j][9] || "";
        if (!originalAction) {
          msh.getRange(j + 1, 10).setValue(actionBase); // Col J (Action)
        }
        msh.getRange(j + 1, 11).setValue(actionBase); // Col K (New Action)

        // Always write follow-up date — clear it when not provided so client doesn't remain in dashboard
        if (fuDate) {
          msh.getRange(j + 1, 12).setValue(new Date(fuDate)); // Col L (Follow Up Date)
        } else {
          msh.getRange(j + 1, 12).setValue(""); // Clear stale follow-up date
        }

        // Update timestamp
        msh.getRange(j + 1, lastModColM).setValue(new Date().toISOString());
        rawRowFound = true; // FIX-02 (S1): a real Raw_Data row was found and updated
        break;
      }
    }

    // FIX-02 (S1): if the clientId matched no Raw_Data row, nothing was written above.
    // Previously the code continued to logActivity/flush/return success — silently losing
    // the call. Surface it as a failure BEFORE the success path. (No-match path only;
    // a matched row set rawRowFound=true, so the normal save flow is unchanged.)
    if (!rawRowFound) {
      try { lock.releaseLock(); } catch (e) {}
      return { success: false, message: "⚠️ تعذّر حفظ المكالمة: لم يتم العثور على هذا العميل في قاعدة البيانات الرئيسية. يرجى تحديث الصفحة والمحاولة مرة أخرى." };
    }

    // FIX-10 (S17a): collect any name-propagation failures (below) so they can be
    // surfaced additively in the success response instead of being swallowed silently.
    var _nameSyncWarnings = [];

    // Propagate Name Change to other sheets
    if (newClientName && newClientName.toString().trim()) {
      var targetNewName = newClientName.toString().trim();
      var isRealOc = ocCode && ocCode.toString().trim().toLowerCase().indexOf("oc-") === 0;
      
      // Update Client_Payments
      try {
        var cpSh = getSheet("Client_Payments");
        if (cpSh) {
          var cpData = getSheetDataCached("Client_Payments");
          for (var c = 1; c < cpData.length; c++) {
            var rowClientId = (cpData[c][1] || "").toString().trim();
            var matched = false;
            if (ocEq(rowClientId, ocCode)) matched = true; // FIX-07: ocKey-normalized OC join
            else if (clientId && cpData[c][0].toString() === clientId.toString()) matched = true;
            
            if (matched) {
              var oldVal = (cpData[c][2] || "").toString().trim();
              if (oldVal !== targetNewName) {
                cpSh.getRange(c + 1, 3).setValue(targetNewName); // Column C is Name
              }
            }
          }
        }
      } catch(e) { _nameSyncWarnings.push("Client_Payments name: " + e.toString()); } // FIX-10 (S17a): record instead of swallow
      
      // Update Round_Members
      try {
        var rmSh = getSheet("Round_Members");
        if (rmSh) {
          var rmData = getSheetDataCached("Round_Members");
          for (var rm = 1; rm < rmData.length; rm++) {
            var rowOc = (rmData[rm][1] || "").toString().trim();
            var matched = false;
            if (ocEq(rowOc, ocCode)) matched = true; // FIX-07: ocKey-normalized OC join
            else if (clientId && rmData[rm][0].toString() === clientId.toString()) matched = true;
            
            if (matched) {
              var oldVal = (rmData[rm][2] || "").toString().trim();
              if (oldVal !== targetNewName) {
                rmSh.getRange(rm + 1, 3).setValue(targetNewName); // Column C is Name
              }
            }
          }
        }
      } catch(e) { _nameSyncWarnings.push("Round_Members name: " + e.toString()); } // FIX-10 (S17a): record instead of swallow

      // Update Financial_Data
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = getSheetDataCached("Financial_Data");
          for (var f = 1; f < finData.length; f++) {
            var rowOc = (finData[f][6] || "").toString().trim();
            var matched = false;
            if (ocEq(rowOc, ocCode)) matched = true; // FIX-07: ocKey-normalized OC join
            else if (clientId && rowOc === clientId.toString()) matched = true;
            
            if (matched) {
              var oldVal = (finData[f][7] || "").toString().trim();
              if (oldVal !== targetNewName) {
                finSh.getRange(f + 1, 8).setValue(targetNewName); // Column H is Name
              }
            }
          }
        }
      } catch(e) { _nameSyncWarnings.push("Financial_Data name: " + e.toString()); } // FIX-10 (S17a): record instead of swallow
    }

    logActivity(agentId, agentName, "CALL_SAVED", clientId + " - " + action + " - " + (clientType || "New"));
    SpreadsheetApp.flush(); // commit Raw_Data / My_Leads writes before releasing lock
    lock.releaseLock(); // RELEASE LOCK EARLY BEFORE CALLING SUB-FUNCTIONS!

    // AUTOMATION FOR CLOSED WON / RESERVATION
    var wonActionsAuto = ["Closed Won", "Closed Won Recommendation", "Reservation"];
    if (wonActionsAuto.indexOf(actionBase) !== -1 && price) {
      var resolvedFinAction = finAction || ((roundId && roundId !== "") ? "Round" : "Wait");
      var isRound = (resolvedFinAction === "Round") && roundId;
      var cpRoundId = isRound ? roundId : "";
      var cpRoundName = isRound ? roundName : resolvedFinAction;

      var roundStartDateVal = isRound ? getRoundStartDate(roundId) : "";

      // 1. Add Round Member (when assigned to a round — it handles Client_Payments internally)
      //    Otherwise add Client Payment directly (no round → addRoundMember not called)
      if (isRound) {
        try {
          addRoundMember(roundId, {
            ocCode: ocCode,
            name: clientName,
            phone: clientPhone,
            action: actionBase,
            price: price,
            paid: paid,
            method: method,
            attendance: roundStartDateVal,
            agentId: agentId,
            agentName: agentName,
            inst1: inst1, inst2: inst2, inst3: inst3,
            inst1Date: inst1Date, inst2Date: inst2Date, inst3Date: inst3Date,
            nextDueDate: fuDate || ""
          });
        } catch (e) { Logger.log("addRoundMember error in updateLeadWithFollowUp: " + e.toString()); }
      } else {
        // No round assignment — create Client_Payments record directly
        try {
          addClientPayment(ocCode || clientId, clientName, clientPhone || "", courseName, cpRoundId, cpRoundName, price, agentId, agentName, paid, fuDate || "", comment, inst1, inst2, inst3, inst1Date, inst2Date, inst3Date);
        } catch (e) { Logger.log("addClientPayment error in updateLeadWithFollowUp: " + e.toString()); }
      }

      // 3. Add to Monthly Financial Accounts
      try {
        addFinancialClient(agentId, agentName, new Date().getMonth() + 1, new Date().getFullYear(), {
          action: resolvedFinAction,
          ocCode: ocCode,
          clientId: clientId,
          name: clientName,
          phone: clientPhone || "",
          course: courseName,
          reservation: todayStr(),
          attendance: roundStartDateVal,
          roundName: isRound ? roundName : "",
          method: method,
          offer: offer || "",
          price: price,
          paid: paid,
          clientType: clientType || "New",
          campaignType: campaignTypeVal
        });
      } catch (e) { Logger.log("addFinancialClient error in updateLeadWithFollowUp: " + e.toString()); }
    }

    SpreadsheetApp.flush();
    var msgActions = ["Closed Won", "Closed Won Recommendation"];
    if (msgActions.indexOf(action) !== -1) {
      try {
        triggerCelebration(agentName);
      } catch(e) {}
      // FIX-10 (S17a): attach name-propagation warnings only if any occurred;
      // when none, the response is identical to the original success shape.
      var _r1 = { success: true, message: "✅ تم حفظ المكالمة وتسجيل العميل في الحسابات والأقساط والراوند تلقائياً!" };
      if (_nameSyncWarnings.length) _r1.warnings = _nameSyncWarnings;
      return _r1;
    } else {
      var _r2 = { success: true, message: "✅ تم حفظ تفاصيل المكالمة بنجاح" };
      if (_nameSyncWarnings.length) _r2.warnings = _nameSyncWarnings; // FIX-10 (S17a)
      return _r2;
    }
  } catch (e) {
    try { lock.releaseLock(); } catch (err) { }
    logActivity("SYSTEM", "Error", "updateLeadWithFollowUp", e.toString());
    return { success: false, message: "خطأ غير متوقع: " + e.toString() };
  }
}

// ==========================================
// SEARCH - (Duplicate definition removed, using unified fast search at line 1007)
// ==========================================

function claimSearchedLead(clientId, rowIndex, agentId, agentName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    // Check if the agent has reached their daily recycle pull limit (including search claims)
    var count = getRecyclePullCount(agentId);
    if (count >= 20) {
      return { success: false, message: "🚨 لقد وصلت للحد الأقصى اليومي لسحب الليدات (20 ليد)." };
    }

    var sh = getSheet("Raw_Data");
    var row = parseInt(rowIndex);
    var rd = sh.getRange(row, 1, 1, 13).getValues()[0]; // Read 13 columns to include Campaign (index 12)
    // Verify rowIndex is not stale (rows may have shifted after search)
    var rowStoredId = (rd[0] || "").toString().trim();
    if (rowStoredId && clientId && rowStoredId !== clientId.toString().trim()) {
      var rawAllData = sh.getDataRange().getValues();
      for (var ri = 1; ri < rawAllData.length; ri++) {
        if ((rawAllData[ri][0] || "").toString().trim() === clientId.toString().trim()) {
          rd = rawAllData[ri];
          row = ri + 1;
          break;
        }
      }
    }
    var cur = sh.getRange(row, 7).getValue().toString().trim();
    if (cur) return { success: false, message: "🚨 تم سحب هذا العميل بالفعل!" };
    sh.getRange(row, 7).setValue(agentName);
    sh.getRange(row, 8).setValue("Assigned");
    if (!sh.getRange(row, 1).getValue()) sh.getRange(row, 1).setValue(clientId);
    // FIX: Sanitize Follow Up Date to prevent epoch 1970/1985/2000 date corruption
    var rdFuDateVal = rd[11]; // index 11 is Follow Up Date
    var rdFuDateSafe = "";
    if (rdFuDateVal) {
      var rdFuParsed = (rdFuDateVal instanceof Date) ? rdFuDateVal : new Date(rdFuDateVal);
      if (!isNaN(rdFuParsed.getTime()) && rdFuParsed.getFullYear() > 2000) {
        rdFuDateSafe = rdFuParsed;
      }
    }
    // Campaign is at index 11 (Col L)
    saveToMyLeads([clientId, new Date(), rd[2], rd[3], rd[4], rd[5], agentId, agentName, "Assigned", rd[8] || "", rdFuDateSafe || "", rd[12] || ""]);
    // Log as PULL_RECYCLE to increment their daily count
    logActivity(agentId, agentName, "PULL_RECYCLE", "سحب من البحث: " + rd[2]);
    return { success: true, id: clientId, name: rd[2] };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  } finally { lock.releaseLock(); }
}

// ==========================================
// FOLLOW UPS
// ==========================================
function isUserAdminOrManager(agentId) {
  try {
    if (!agentId) return false;
    var sh = getSheet("Users");
    if (!sh) return false;
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === agentId.toString().trim()) {
        var role = (data[i][4] || "").toString().trim().toLowerCase();
        return role === "manager" || role === "admin" || role === "operation";
      }
    }
  } catch (e) {}
  return false;
}

// 2026-07-06: standing rule from the user — "أي حاجة تعديل في السيستم خليها مقتصرة عليا بس" (anything
// that modifies the system should be restricted to me only, to keep the system safe). Manager and Admin
// are the SAME person/account in this system, so this is Manager/Admin-only — deliberately EXCLUDES
// Operation, unlike isUserAdminOrManager() above (which most features correctly still use). Use this
// helper for any NEW system-modification feature going forward instead of loosening
// isUserAdminOrManager() itself — that function is shared by dozens of unrelated features.
function isUserManagerOnly(agentId) {
  try {
    if (!agentId) return false;
    var sh = getSheet("Users");
    if (!sh) return false;
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === agentId.toString().trim()) {
        var role = (data[i][4] || "").toString().trim().toLowerCase();
        return role === "manager" || role === "admin";
      }
    }
  } catch (e) {}
  return false;
}

function getDueFollowUps(agentId) {
  var data = getSheetDataCached("My_Leads"); // request-level cache: shared with getLiveKPIs in getDashboardData
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var due = [], upcoming = [];
  var agentIdStr = (agentId !== undefined && agentId !== null) ? agentId.toString() : "";
  var isAdmin = isUserAdminOrManager(agentIdStr);
  // My_Leads columns: 0=id,1=date,2=name,3=phone,4=source,5=course,6=agentId,7=agentName,8=status/lastAction,9=notes,10=fuDate,11=campaign
  var fuActions = ["follow up", "need follow", "delayed"];
  for (var i = 1; i < data.length; i++) {
    if (!isAdmin && (data[i][6] || "").toString() !== agentIdStr) continue;
    var act = (data[i][8] || "").toString().toLowerCase();
    var fuRaw = data[i][10];
    if (!fuRaw) continue;
    var fuFull = (fuRaw instanceof Date) ? fuRaw : new Date(fuRaw);
    var fuTime = (fuRaw instanceof Date && (fuRaw.getHours() !== 0 || fuRaw.getMinutes() !== 0))
      ? Utilities.formatDate(fuRaw, Session.getScriptTimeZone(), "HH:mm") : "";
    var fuDay = new Date(fuFull); fuDay.setHours(0, 0, 0, 0);
    var diff = Math.round((fuDay - today) / 86400000);
    var isFu = fuActions.some(function (x) { return act.includes(x); });
    if (!isFu) continue;
    var item = {
      name: data[i][2], phone: data[i][3], course: data[i][5], id: (data[i][0] || "").toString(),
      diffDays: diff, overdue: diff < 0, fuTime: fuTime,
      daysText: diff === 0 ? (fuTime ? "اليوم " + fuTime : "اليوم") : diff < 0 ? "متأخر " + Math.abs(diff) + " يوم" : "بعد " + diff + " يوم",
      agentName: data[i][7] || "—"
    };
    if (diff <= 0) due.push(item);
    else if (diff <= 3) upcoming.push(item);
  }
  return { due: due, upcoming: upcoming };
}

function getFuAlertsNow(agentId) {
  var sh = getSheet("My_Leads");
  var data = sh.getDataRange().getValues();
  var tz = Session.getScriptTimeZone();
  var now = new Date();
  var todayStr = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  var agentIdStr = (agentId !== undefined && agentId !== null) ? agentId.toString() : "";
  // Operation role: sees no FU alerts (they don't manage leads)
  var callerRole = '';
  try {
    var uSh = getSheet("Users");
    if (uSh) {
      var uData = uSh.getDataRange().getValues();
      for (var u = 1; u < uData.length; u++) {
        if ((uData[u][0] || '').toString().trim() === agentIdStr) {
          callerRole = (uData[u][4] || '').toString().trim().toLowerCase();
          break;
        }
      }
    }
  } catch(e) {}
  if (callerRole === 'operation') return { alerts: [] };
  var isAdmin = (callerRole === 'manager' || callerRole === 'admin');
  var fuActions = ["follow up", "need follow", "waiting client", "delayed"];
  var alerts = [];
  for (var i = 1; i < data.length; i++) {
    if (!isAdmin && (data[i][6] || "").toString() !== agentIdStr) continue;
    var act = (data[i][8] || "").toString().toLowerCase();
    var fuRaw = data[i][10];
    if (!fuRaw) continue;
    var isFu = fuActions.some(function(x) { return act.includes(x); });
    if (!isFu) continue;
    var fuDate = (fuRaw instanceof Date) ? fuRaw : new Date(fuRaw);
    if (isNaN(fuDate.getTime())) continue;
    var fuDayStr = Utilities.formatDate(fuDate, tz, "yyyy-MM-dd");
    if (fuDayStr !== todayStr) continue;
    // only include if has a specific time (not midnight/09:00 default)
    var localH = parseInt(Utilities.formatDate(fuDate, tz, "HH"));
    var localM = parseInt(Utilities.formatDate(fuDate, tz, "mm"));
    if (localH === 0 && localM === 0) continue; // no time set (date-only), skip
    var fuMs = fuDate.getTime();
    var diffMs = fuMs - now.getTime();
    if (diffMs > 36 * 60000) continue; // more than 36 min away → skip
    if (diffMs < -10 * 60000) continue; // more than 10 min past → skip
    alerts.push({
      id: (data[i][0] || "").toString(),
      name: data[i][2], phone: data[i][3], course: data[i][5],
      agentName: data[i][7] || "—",
      fuTime: Utilities.formatDate(fuDate, tz, "HH:mm"),
      fuDateTime: fuDayStr + "T" + Utilities.formatDate(fuDate, tz, "HH:mm"),
      fuMs: fuMs
    });
  }
  return { alerts: alerts };
}

// ==========================================
// DASHBOARD — combined call (performance: 4 calls → 1)
// ==========================================
function getDashboardData(agentId) {
  try {
    _requestCache = {}; // reset request-level sheet cache for this combined call
    var kpis    = getLiveKPIs(agentId);
    var fuData  = getDueFollowUps(agentId);
    var tasks   = getTasks(agentId);
    var team    = getTeamPerformance();
    return { kpis: kpis, fuData: fuData, tasks: tasks, team: team };
  } catch(e) {
    return { kpis: {}, fuData: { due: [], upcoming: [] }, tasks: [], team: [] };
  }
}

// ==========================================
// KPIs
// ==========================================
function getLiveKPIs(agentId) {
  var isAdmin = isUserAdminOrManager(agentId);
  var today = todayStr(); // "yyyy-MM-dd"
  var calls = 0, won = 0, lost = 0, fu = 0, na = 0, delayed = 0, waiting = 0, reservation = 0, notInterested = 0, wrongNumber = 0, rec = 0;

  if (isAdmin) {
    // Admin/Manager: read from Activity_Log — use cached copy (shared with getTeamPerformance in getDashboardData)
    var logData = getSheetDataCached("Activity_Log");
    if (logData && logData.length > 0) {
      for (var i = 1; i < logData.length; i++) {
        var d = logData[i][0];
        if (!(d instanceof Date)) continue;
        var dStr = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
        if (dStr !== today) continue;
        var actType = (logData[i][3] || "").toString();
        if (actType !== "CALL_SAVED") continue;
        calls++;
        var details = (logData[i][4] || "").toString().toLowerCase();
        var parts = details.split(" - ");
        // Format: "clientId - action - clientType" — action is always parts[1], not the last part
        var callRes = parts.length > 1 ? parts[1].trim() : details;
        if (callRes.indexOf("closed won recommendation") !== -1 || callRes.indexOf("recommendation") !== -1) {
          rec++;
        } else if (callRes.indexOf("closed won") !== -1) {
          won++;
        } else if (callRes.indexOf("reservation") !== -1) {
          reservation++;
        } else if (callRes.indexOf("need follow up") !== -1 || callRes.indexOf("follow up") !== -1) {
          fu++;
        } else if (callRes.indexOf("no answer") !== -1) {
          na++;
        } else if (callRes.indexOf("waiting client") !== -1 || callRes.indexOf("waiting") !== -1) {
          waiting++;
        } else if (callRes.indexOf("delayed") !== -1) {
          delayed++;
        } else if (callRes.indexOf("closed lost") !== -1) {
          lost++;
        } else if (callRes.indexOf("not interested") !== -1) {
          notInterested++;
        } else if (callRes.indexOf("wrong number") !== -1) {
          wrongNumber++;
        }
      }
    }
  } else {
    // Agent: read from My_Leads notes (only their own clients)
    var data = getSheetDataCached("My_Leads"); // shared cache with getDueFollowUps
    var seenLines = {};
    for (var j = 1; j < data.length; j++) {
      if ((data[j][6] || "").toString() !== agentId.toString()) continue;
      var notesStr = (data[j][9] || "").toString();
      if (notesStr.indexOf("[" + today) === -1) continue;
      var lines = notesStr.split("\n");
      lines.forEach(function (line) {
        if (line.indexOf("[" + today) !== -1) {
          var key = line + "#" + j;
          if (seenLines[key]) return;
          seenLines[key] = true;
          calls++;
          var actMatch = line.match(/\]\s*\(([^)]+)\)/);
          var actClean = actMatch ? actMatch[1].trim().toLowerCase() : (data[j][8] || "").toString().toLowerCase();
          if (actClean.indexOf("closed won recommendation") !== -1 || actClean.indexOf("recommendation") !== -1) {
            rec++;
          } else if (actClean === "closed won") {
            won++;
          } else if (actClean.indexOf("reservation") !== -1) {
            reservation++;
          } else if (actClean.indexOf("follow") !== -1) {
            fu++;
          } else if (actClean.indexOf("no answer") !== -1 || actClean === "لم يرد") {
            na++;
          } else if (actClean.indexOf("delayed") !== -1) {
            delayed++;
          } else if (actClean.indexOf("waiting") !== -1) {
            waiting++;
          } else if (actClean.indexOf("not interested") !== -1) {
            notInterested++;
          } else if (actClean.indexOf("wrong number") !== -1) {
            wrongNumber++;
          } else if (actClean.indexOf("closed lost") !== -1) {
            lost++;
          }
        }
      });
    }
  }
  return {
    calls: calls,
    won: won + rec,
    lost: lost,
    fu: fu,
    na: na,
    delayed: delayed,
    rate: calls > 0 ? Math.round((won + rec) / calls * 100) : 0,
    dist: {
      won: won,
      lost: lost,
      fu: fu,
      na: na,
      delayed: delayed,
      waiting: waiting,
      reservation: reservation,
      notInterested: notInterested,
      wrongNumber: wrongNumber,
      rec: rec
    }
  };
}

function isInDateRange(date, range) {
  if (!(date instanceof Date)) return false;
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (range === 'today') {
    return checkDate.getTime() === today.getTime();
  } else if (range === 'yesterday') {
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return checkDate.getTime() === yesterday.getTime();
  } else if (range === 'last7') {
    var limit = new Date(today);
    limit.setDate(limit.getDate() - 7);
    return checkDate >= limit && checkDate <= today;
  } else if (range === 'last30') {
    var limit = new Date(today);
    limit.setDate(limit.getDate() - 30);
    return checkDate >= limit && checkDate <= today;
  } else if (range === 'thisMonth') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  } else if (range === 'all') {
    return true;
  } else if (typeof range === 'string' && range.indexOf('custom:') === 0) {
    var parts = range.split(':');
    // format: custom:YYYY-MM-DD:YYYY-MM-DD
    var fp = parts[1].split('-');
    var tp = parts[2].split('-');
    var fromD = new Date(parseInt(fp[0]), parseInt(fp[1])-1, parseInt(fp[2]));
    var toD   = new Date(parseInt(tp[0]), parseInt(tp[1])-1, parseInt(tp[2]));
    return checkDate >= fromD && checkDate <= toD;
  }
  return checkDate.getTime() === today.getTime();
}

function getTeamPerformance(range, viewerId, viewerName) {
  range = range || 'today';
  var data = getSheetDataCached("Activity_Log"); // shared with getLiveKPIs in getDashboardData
  var agents = {};
  // Pre-pass: build full call-history for Follow-up Completion tracking (not range-filtered)
  var clientCallHistory = {};
  for (var p = 1; p < data.length; p++) {
    if ((data[p][3] || '').toString() !== 'CALL_SAVED') continue;
    var dp = data[p][0];
    if (!(dp instanceof Date)) continue;
    var aidp = (data[p][1] || 'unknown').toString();
    var cidp = (data[p][4] || '').toString().split(' - ')[0].trim();
    if (!cidp) continue;
    if (!clientCallHistory[cidp]) clientCallHistory[cidp] = [];
    clientCallHistory[cidp].push({agentId: aidp, date: dp});
  }
  for (var i = 1; i < data.length; i++) {
    var d = data[i][0]; // Column A is Date
    if (!(d instanceof Date)) continue;
    if (!isInDateRange(d, range)) continue;

    var actType = (data[i][3] || "").toString(); // Column D is Action
    if (actType !== "CALL_SAVED") continue;

    var aid = (data[i][1] || "unknown").toString(); // Column B is agentId
    var aname = (data[i][2] || aid).toString(); // Column C is agentName

    if (!agents[aid]) {
      agents[aid] = {
        id: aid, name: aname,
        calls: 0, won: 0, won_rec: 0, reservation: 0, follow_up: 0, waiting: 0, no_answer: 0, delayed: 0, lost: 0, not_interested: 0, wrong_number: 0,
        fresh_calls: 0, fresh_won: 0, fresh_follow_up: 0, fresh_waiting: 0, fresh_no_answer: 0, fresh_delayed: 0, fresh_lost: 0, fresh_not_interested: 0, fresh_wrong_number: 0,
        rec_calls:   0, rec_won:   0, rec_follow_up:   0, rec_waiting:   0, rec_no_answer:   0, rec_delayed:   0, rec_lost:   0, rec_not_interested:   0, rec_wrong_number:   0,
        lost_price: 0, lost_timing: 0, lost_budget: 0, lost_competitor: 0, lost_notdm: 0, lost_noneed: 0, lost_other: 0,
        fu_completed: 0, fu_pending: 0,
        _fu_entries: []
      };
    }
    agents[aid].calls++;

    var details = (data[i][4] || "").toString();
    var parts = details.split(" - ");
    var callRes, leadType;
    if (parts.length >= 3) {
      callRes   = parts[parts.length - 2].toLowerCase().trim();
      leadType  = parts[parts.length - 1].trim();
    } else if (parts.length === 2) {
      callRes   = parts[1].toLowerCase().trim();
      leadType  = "New";
    } else {
      callRes   = details.toLowerCase();
      leadType  = "New";
    }

    var isRec = (leadType === "Rec") || (leadType === "Renew");
    var clientId = parts.length > 0 ? parts[0].trim() : '';
    if (isRec) { agents[aid].rec_calls++; } else { agents[aid].fresh_calls++; }

    if (callRes.indexOf("closed won recommendation") !== -1) {
      agents[aid].won_rec++; agents[aid].won++;
      if (isRec) { agents[aid].rec_won++; } else { agents[aid].fresh_won++; }
    } else if (callRes.indexOf("closed won") !== -1) {
      agents[aid].won++;
      if (isRec) { agents[aid].rec_won++; } else { agents[aid].fresh_won++; }
    } else if (callRes.indexOf("reservation") !== -1) {
      agents[aid].reservation++; agents[aid].won++;
      if (isRec) { agents[aid].rec_won++; } else { agents[aid].fresh_won++; }
    } else if (callRes.indexOf("need follow up") !== -1 || callRes.indexOf("follow up") !== -1) {
      agents[aid].follow_up++;
      if (isRec) { agents[aid].rec_follow_up++; } else { agents[aid].fresh_follow_up++; }
      // Track for FU completion analysis
      if (clientId) agents[aid]._fu_entries.push({clientId: clientId, date: d});
    } else if (callRes.indexOf("waiting client") !== -1 || callRes.indexOf("waiting") !== -1) {
      agents[aid].waiting++;
      if (isRec) { agents[aid].rec_waiting++; } else { agents[aid].fresh_waiting++; }
    } else if (callRes.indexOf("no answer") !== -1) {
      agents[aid].no_answer++;
      if (isRec) { agents[aid].rec_no_answer++; } else { agents[aid].fresh_no_answer++; }
    } else if (callRes.indexOf("delayed") !== -1) {
      agents[aid].delayed++;
      if (isRec) { agents[aid].rec_delayed++; } else { agents[aid].fresh_delayed++; }
    } else if (callRes.indexOf("closed lost") !== -1) {
      agents[aid].lost++;
      if (isRec) { agents[aid].rec_lost++; } else { agents[aid].fresh_lost++; }
      // Parse lost reason from "closed lost::price" format
      var lrIdx = callRes.indexOf('::');
      var lostReas = lrIdx !== -1 ? callRes.substring(lrIdx + 2).trim() : '';
      if      (lostReas === 'price')       agents[aid].lost_price++;
      else if (lostReas === 'timing')      agents[aid].lost_timing++;
      else if (lostReas === 'budget')      agents[aid].lost_budget++;
      else if (lostReas === 'competitor')  agents[aid].lost_competitor++;
      else if (lostReas === 'notdm')       agents[aid].lost_notdm++;
      else if (lostReas === 'noneed')      agents[aid].lost_noneed++;
      else if (lostReas)                   agents[aid].lost_other++;
    } else if (callRes.indexOf("not interested") !== -1) {
      agents[aid].not_interested++;
      if (isRec) { agents[aid].rec_not_interested++; } else { agents[aid].fresh_not_interested++; }
    } else if (callRes.indexOf("wrong number") !== -1) {
      agents[aid].wrong_number++;
      if (isRec) { agents[aid].rec_wrong_number++; } else { agents[aid].fresh_wrong_number++; }
    }
  }
  // Calculate FU completion per agent-id (before merge, using full call history)
  Object.keys(agents).forEach(function(aid) {
    var a = agents[aid];
    var fuEntries = a._fu_entries || [];
    var comp = 0, pend = 0;
    fuEntries.forEach(function(fu) {
      var history = clientCallHistory[fu.clientId] || [];
      var calledBack = history.some(function(h) { return h.agentId === aid && h.date > fu.date; });
      if (calledBack) { comp++; } else { pend++; }
    });
    a.fu_completed = comp;
    a.fu_pending   = pend;
    delete a._fu_entries;
  });
  // Merge agents with the same name (handles agents who logged under 2 different IDs)
  var AGENT_KEYS = [
    'calls','won','won_rec','reservation','follow_up','waiting','no_answer','delayed','lost','not_interested','wrong_number',
    'fresh_calls','fresh_won','fresh_follow_up','fresh_waiting','fresh_no_answer','fresh_delayed','fresh_lost','fresh_not_interested','fresh_wrong_number',
    'rec_calls','rec_won','rec_follow_up','rec_waiting','rec_no_answer','rec_delayed','rec_lost','rec_not_interested','rec_wrong_number',
    'lost_price','lost_timing','lost_budget','lost_competitor','lost_notdm','lost_noneed','lost_other',
    'fu_completed','fu_pending'
  ];
  var byName = {};
  Object.values(agents).forEach(function(a) {
    var key = (a.name || '').toString().trim().toLowerCase();
    if (!key || key === 'unknown') key = a.id;
    if (byName[key]) {
      var m = byName[key];
      AGENT_KEYS.forEach(function(k) { m[k] += (a[k] || 0); });
    } else {
      byName[key] = a;
    }
  });
  var _team = Object.values(byName).map(function (a) {
    // ── Fresh KPIs ──
    var fc = a.fresh_calls || 0;
    var fCont = Math.max(0, fc - (a.fresh_no_answer||0) - (a.fresh_wrong_number||0));
    var fInt  = (a.fresh_follow_up||0) + (a.fresh_waiting||0) + (a.fresh_delayed||0) + (a.fresh_won||0);
    a.fresh_contacted     = fCont;
    a.fresh_interested    = fInt;
    a.fresh_contact_rate  = fc   > 0 ? Math.round(fCont / fc   * 100) : 0;
    a.fresh_interest_rate = fCont > 0 ? Math.round(fInt  / fCont * 100) : 0;
    a.fresh_closing_rate  = fInt  > 0 ? Math.round((a.fresh_won||0) / fInt * 100) : 0;
    // ── Rec KPIs ──
    var rc = a.rec_calls || 0;
    var rCont = Math.max(0, rc - (a.rec_no_answer||0) - (a.rec_wrong_number||0));
    var rInt  = (a.rec_follow_up||0) + (a.rec_waiting||0) + (a.rec_delayed||0) + (a.rec_won||0);
    a.rec_contacted       = rCont;
    a.rec_interested      = rInt;
    a.rec_contact_rate    = rc   > 0 ? Math.round(rCont / rc   * 100) : 0;
    a.rec_interest_rate   = rCont > 0 ? Math.round(rInt  / rCont * 100) : 0;
    a.rec_closing_rate    = rInt  > 0 ? Math.round((a.rec_won||0) / rInt * 100) : 0;
    // ── Overall rates ──
    var totalCalls = a.calls || 0;
    var totCont = fCont + rCont;
    var totInt  = fInt  + rInt;
    a.overall_contact_rate  = totalCalls > 0 ? Math.round(totCont / totalCalls * 100) : 0;
    a.overall_interest_rate = totCont > 0    ? Math.round(totInt  / totCont    * 100) : 0;
    a.overall_closing_rate  = totInt  > 0    ? Math.round((a.won||0) / totInt  * 100) : 0;
    a.followup_rate         = totCont > 0    ? Math.round((a.follow_up||0) / totCont * 100) : 0;
    a.fresh_fup_rate        = fCont   > 0    ? Math.round((a.fresh_follow_up||0) / fCont * 100) : 0;
    a.rec_fup_rate          = rCont   > 0    ? Math.round((a.rec_follow_up||0)   / rCont * 100) : 0;
    a.rate = totalCalls > 0 ? Math.round((a.won||0) / totalCalls * 100) : 0;
    // ── Follow-up Completion Rate ──
    var fuTotal = (a.fu_completed||0) + (a.fu_pending||0);
    a.fu_completion_rate = fuTotal > 0 ? Math.round((a.fu_completed||0) / fuTotal * 100) : null;
    // ── Lost Reason Breakdown ──
    var lostBd = [];
    if (a.lost_price      > 0) lostBd.push({reason:'السعر مرتفع',      count:a.lost_price,      color:'#c62828'});
    if (a.lost_timing     > 0) lostBd.push({reason:'التوقيت',           count:a.lost_timing,     color:'#e65100'});
    if (a.lost_budget     > 0) lostBd.push({reason:'ميزانية غير كافية', count:a.lost_budget,     color:'#bf360c'});
    if (a.lost_competitor > 0) lostBd.push({reason:'اختار منافس',      count:a.lost_competitor,  color:'#b71c1c'});
    if (a.lost_notdm      > 0) lostBd.push({reason:'مش صاحب قرار',     count:a.lost_notdm,       color:'#4a148c'});
    if (a.lost_noneed     > 0) lostBd.push({reason:'مش محتاج',         count:a.lost_noneed,       color:'#1a237e'});
    if (a.lost_other      > 0) lostBd.push({reason:'سبب آخر',          count:a.lost_other,        color:'#546e7a'});
    lostBd.sort(function(x,y){return y.count - x.count;});
    a.lost_breakdown = lostBd;
    // ── Funnel data ──
    a.fresh_in_pipeline    = (a.fresh_follow_up||0) + (a.fresh_waiting||0) + (a.fresh_delayed||0);
    a.fresh_lost_total     = (a.fresh_lost||0) + (a.fresh_not_interested||0);
    a.rec_in_pipeline      = (a.rec_follow_up||0)   + (a.rec_waiting||0)   + (a.rec_delayed||0);
    a.rec_lost_total       = (a.rec_lost||0)   + (a.rec_not_interested||0);
    // ── KPI Score (Fresh 70% + Reskill 30%) ──
    // Fresh weights: Contact 25% | Interest 20% | Closing 40% | FollowUp 15%  — targets: 70/50/25/70
    // FollowUp: use completion rate if available (real data), else raw followup rate (proxy)
    var fuScoreInput = (a.fu_completion_rate !== null) ? a.fu_completion_rate : (a.fresh_fup_rate || 0);
    var freshScore = 0, reskillScore = 0;
    if (fc > 0) {
      var nFC  = Math.min(1, (a.fresh_contact_rate||0)  / 70);
      var nFI  = Math.min(1, (a.fresh_interest_rate||0) / 50);
      var nFCL = Math.min(1, (a.fresh_closing_rate||0)  / 25);
      var nFFU = Math.min(1, fuScoreInput               / 70);
      freshScore = nFC*25 + nFI*20 + nFCL*40 + nFFU*15;
    }
    // Reskill weights: Reactivation 35% | FollowUp 25% | Closing 40% — targets: 70/70/25
    if (rc > 0) {
      var nRC  = Math.min(1, (a.rec_contact_rate||0)  / 70);
      var nRFU = Math.min(1, fuScoreInput              / 70);
      var nRCL = Math.min(1, (a.rec_closing_rate||0)  / 25);
      reskillScore = nRC*35 + nRFU*25 + nRCL*40;
    }
    if (fc > 0 && rc > 0) {
      a.kpi_score = Math.round(freshScore * 0.70 + reskillScore * 0.30);
    } else if (fc > 0) {
      a.kpi_score = Math.round(freshScore);
    } else if (rc > 0) {
      a.kpi_score = Math.round(reskillScore);
    } else {
      a.kpi_score = 0;
    }
    a.kpi_breakdown = {
      fresh_score:   Math.round(freshScore),
      reskill_score: Math.round(reskillScore),
      fresh_calls:   fc,
      rec_calls:     rc
    };
    // ── Stage Funnel (overall) ──
    a.stage_funnel = {
      assigned:     totalCalls,
      contacted:    totCont,
      contact_pct:  totalCalls > 0 ? Math.round(totCont / totalCalls * 100) : 0,
      interested:   totInt,
      interest_pct: totCont  > 0 ? Math.round(totInt  / totCont  * 100) : 0,
      won:          a.won || 0,
      won_pct:      totInt  > 0 ? Math.round((a.won||0) / totInt  * 100) : 0
    };
    // ── Decision Tree Diagnosis ──
    var FCR = a.fresh_contact_rate  || 0;
    var FIR = a.fresh_interest_rate || 0;
    var FCL = a.fresh_closing_rate  || 0;
    var pipelineRatio = totCont > 0 ? ((a.fresh_in_pipeline + a.rec_in_pipeline) / totCont * 100) : 0;
    var totalLost     = (a.lost||0) + (a.not_interested||0);
    a.issues = [];
    a.strengths = [];
    a.primary_issue  = null;
    a.not_enough_data = false;
    if (totalCalls >= 5) {
      if (totCont < 15) {
        a.not_enough_data = true;
      } else {
        var candidateIssues = [];
        // Rule 1 — Contact < 60% → Communication (root cause)
        if (FCR < 60) {
          candidateIssues.push({type:'communication', icon:'📞', label:'Communication Issue', priority:1,
            detail:'Contact ' + FCR + '% — target 60%+',
            recs:['زيادة عدد المكالمات اليومية', 'مراجعة جودة الليدات', 'تسريع وقت الرد على الليد الجديد'],
            color:'#1565c0'});
        }
        // Rule 2 — Contact >= 60% but Interest < 40% → Discovery
        if (FCR >= 60 && FIR < 40) {
          candidateIssues.push({type:'discovery', icon:'🔍', label:'Discovery Issue', priority:2,
            detail:'Interest ' + FIR + '% رغم Contact ' + FCR + '%',
            recs:['تدريب على Needs Discovery Questions', 'مراجعة أول 30 ثانية من المكالمة', 'تحسين Opening Script'],
            color:'#e65100'});
        }
        // Rule 3 — Interest >= 50% + Lost > Won (confirmed by >= 3 lost cases)
        if (FIR >= 50 && totalLost > (a.won||0) && totalLost >= 3) {
          candidateIssues.push({type:'pitch', icon:'🎯', label:'Pitch / Objection Handling', priority:3,
            detail:'Lost ' + totalLost + ' vs Won ' + (a.won||0) + ' رغم Interest ' + FIR + '%',
            recs:['تدريب على Objection Handling', 'مراجعة Value Proposition', 'عرض Success Stories للعميل'],
            color:'#b71c1c', lost_breakdown: lostBd});
        }
        // Rule 4 — Follow-up Completion < 70%
        if (a.fu_completion_rate !== null && a.fu_completion_rate < 70 && fuTotal >= 3) {
          candidateIssues.push({type:'fu_discipline', icon:'📋', label:'Follow-up Discipline', priority:4,
            detail:'تم تنفيذ ' + (a.fu_completed||0) + ' من ' + fuTotal + ' Follow-ups (' + a.fu_completion_rate + '%)',
            recs:['مراجعة قائمة Follow-ups كل صباح', 'استخدام تنبيهات الموعد', 'الالتزام بالمواعيد المحددة للعميل'],
            color:'#f57f17'});
        }
        // Rule 5 — Pipeline > 50% of contacted → Leads Stuck
        if (pipelineRatio > 50 && totCont >= 4) {
          candidateIssues.push({type:'stuck', icon:'⏳', label:'Leads Stuck in Pipeline', priority:5,
            detail:Math.round(pipelineRatio) + '% من الليدات لسه معلقة',
            recs:['تحديد Deadline لكل عميل', 'مراجعة أسلوب الإغلاق', 'استخدام Urgency & Scarcity'],
            color:'#7b1fa2'});
        }
        candidateIssues.sort(function(x,y){ return x.priority - y.priority; });
        if (candidateIssues.length > 0) {
          a.primary_issue = candidateIssues[0];
          a.issues = candidateIssues.slice(1);
        }
      }
      // Strengths
      if (FCR >= 70)                                              a.strengths.push('Contact Rate ممتاز (' + FCR + '%)');
      if (FIR >= 50)                                              a.strengths.push('Interest Rate ممتاز (' + FIR + '%)');
      if (FCL >= 25)                                              a.strengths.push('Closing Rate ممتاز (' + FCL + '%)');
      if (a.fu_completion_rate !== null && a.fu_completion_rate >= 70) a.strengths.push('Follow-up Commitment ممتاز (' + a.fu_completion_rate + '%)');
      if (rc >= 5 && a.rec_contact_rate >= 65)                   a.strengths.push('Reskill Reactivation ممتاز (' + a.rec_contact_rate + '%)');
      if (rc >= 5 && a.rec_closing_rate >= 25)                   a.strengths.push('Reskill Closing ممتاز (' + a.rec_closing_rate + '%)');
      if (!a.primary_issue && !a.issues.length)                  a.strengths.push('أداء متوازن — لا توجد مشاكل واضحة');
    }
    return a;
  }).sort(function (a, b) { return b.kpi_score - a.kpi_score; });

  // ROLE GATE (2026-06-27): a non-elevated agent may have permission to OPEN the performance page
  // but must only see THEIR OWN row — never the whole team. Filter server-side so colleagues' data
  // never even reaches their browser. Elevated (manager/admin/operation/senior) get the full team.
  if (viewerId && !_isElevatedUser(viewerId)) {
    var _vid = (viewerId || "").toString().trim();
    var _vn  = (viewerName || "").toString().trim().toLowerCase();
    _team = _team.filter(function (a) {
      return (a.id || "").toString().trim() === _vid ||
             (_vn && (a.name || "").toString().trim().toLowerCase() === _vn);
    });
  }
  return _team;
}

function getMyPerformance(agentId, range) {
  range = range || 'today';
  var sh = getSheet("Activity_Log");
  var data = sh.getDataRange().getValues();
  var s = {
    calls: 0, won: 0, won_rec: 0, reservation: 0, follow_up: 0, waiting: 0, no_answer: 0, delayed: 0, lost: 0, not_interested: 0, wrong_number: 0,
    rate: 0, dist: {}, week: [0, 0, 0, 0, 0, 0, 0], topClients: []
  };

  var totalWins = 0;

  for (var i = 1; i < data.length; i++) {
    var aid = (data[i][1] || "").toString();
    if (aid !== agentId.toString()) continue;

    var d = data[i][0]; // Column A is Date
    if (!(d instanceof Date)) continue;

    var diff = Math.floor((new Date() - d) / 86400000);
    if (diff >= 0 && diff < 7 && data[i][3] === "CALL_SAVED") {
      s.week[d.getDay()]++;
    }

    if (!isInDateRange(d, range)) continue;

    var actType = (data[i][3] || "").toString();
    if (actType !== "CALL_SAVED") continue;

    s.calls++;
    var details = (data[i][4] || "").toString().toLowerCase();
    var callRes = details;
    var parts = details.split(" - ");
    if (parts.length > 1) {
      callRes = parts[parts.length - 1];
    }

    if (callRes.indexOf("closed won recommendation") !== -1) {
      s.won_rec++;
      totalWins++;
    } else if (callRes.indexOf("closed won") !== -1) {
      s.won++;
      totalWins++;
    } else if (callRes.indexOf("reservation") !== -1) {
      s.reservation++;
      totalWins++;
    } else if (callRes.indexOf("need follow up") !== -1 || callRes.indexOf("follow up") !== -1) {
      s.follow_up++;
    } else if (callRes.indexOf("waiting client") !== -1 || callRes.indexOf("waiting") !== -1) {
      s.waiting++;
    } else if (callRes.indexOf("no answer") !== -1) {
      s.no_answer++;
    } else if (callRes.indexOf("delayed") !== -1) {
      s.delayed++;
    } else if (callRes.indexOf("closed lost") !== -1) {
      s.lost++;
    } else if (callRes.indexOf("not interested") !== -1) {
      s.not_interested++;
    } else if (callRes.indexOf("wrong number") !== -1) {
      s.wrong_number++;
    }
  }
  s.rate = s.calls > 0 ? Math.round(totalWins / s.calls * 100) : 0;
  s.dist = {
    won: s.won,
    won_rec: s.won_rec,
    reservation: s.reservation,
    follow_up: s.follow_up,
    waiting: s.waiting,
    no_answer: s.no_answer,
    delayed: s.delayed,
    lost: s.lost,
    not_interested: s.not_interested,
    wrong_number: s.wrong_number
  };
  s.topClients = [];
  return s;
}

function getTodayCalls(agentId) {
  var sh = getSheet("My_Leads");
  var data = sh.getDataRange().getValues();
  var today = todayStr(); // "yyyy-MM-dd"
  var calls = [];
  var timeZone = "GMT";
  try {
    timeZone = Session.getScriptTimeZone() || "GMT";
  } catch(e) {}

  for (var i = 1; i < data.length; i++) {
    if ((data[i][6] || "").toString() !== agentId.toString()) continue;
    var notesStr = (data[i][9] || "").toString(); // Column J (Notes, index 9)
    var hasTodayNote = notesStr.indexOf("[" + today) !== -1;

    // Check if assigned today
    var assignedDateStr = "";
    var dateVal = data[i][1]; // Column B (Date, index 1)
    if (dateVal) {
      if (dateVal instanceof Date) {
        try {
          assignedDateStr = Utilities.formatDate(dateVal, timeZone, "yyyy-MM-dd");
        } catch(e) {}
      } else {
        assignedDateStr = dateVal.toString().substring(0, 10);
      }
    }
    var isAssignedToday = (assignedDateStr === today);

    if (hasTodayNote) {
      var lines = notesStr.split("\n");
      lines.forEach(function (line) {
        if (line.indexOf("[" + today) !== -1) {
          var timePart = "—";
          var timeMatch = line.match(/\[\d{4}-\d{2}-\d{2}\s+(\d{2}:\d{2})/);
          if (timeMatch) timePart = timeMatch[1];

          var act = "—";
          var actMatch = line.match(/\]\s*\(([^)]+)\)/);
          if (actMatch) {
            act = actMatch[1];
          } else {
            act = data[i][8] || "—"; // index 8 = Action
          }

          calls.push({
            name: data[i][2] || "—",
            action: act,
            time: timePart
          });
        }
      });
    } else if (isAssignedToday) {
      var timePart = "—";
      if (dateVal instanceof Date) {
        try {
          timePart = Utilities.formatDate(dateVal, timeZone, "HH:mm");
        } catch(e) {}
      }
      calls.push({
        name: data[i][2] || "—",
        action: data[i][8] || "Assigned",
        time: timePart
      });
    }
  }
  return calls.reverse();
}

// ==========================================
// TASKS
// ==========================================
function getTasks(agentId) {
  var isAdmin = isUserAdminOrManager(agentId);
  var data = getSheetDataCached("Tasks"); // request-level cache
  var tasks = [];

  // Create user lookup cache to display agent name next to team tasks for manager
  var userMap = {};
  try {
    var uSh = getSheet("Users");
    if (uSh) {
      var uData = getSheetDataCached("Users");
      for (var k = 1; k < uData.length; k++) {
        userMap[(uData[k][0] || "").toString().trim()] = (uData[k][1] || "").toString().trim();
      }
    }
  } catch(e){}

  for (var i = 1; i < data.length; i++) {
    var taskAgentId = (data[i][4] || "").toString().trim();
    if (data[i][2] !== "Done" && (isAdmin || taskAgentId === agentId.toString().trim())) {
      var taskText = data[i][1];
      if (isAdmin) {
        var agentName = userMap[taskAgentId] || "غير محدد";
        taskText += " (" + agentName + ")";
      }
      tasks.push({ id: i + 1, task: taskText, priority: data[i][3] || "normal" });
    }
  }
  return tasks;
}
function addTask(text, priority, agentId) {
  if (!text) return false;
  getSheet("Tasks").appendRow([genId(), text, "Open", priority || "normal", agentId, new Date()]);
  return true;
}
function completeTask(rowId) { getSheet("Tasks").getRange(rowId, 3).setValue("Done"); return true; }
function deleteTask(rowId) { getSheet("Tasks").deleteRow(rowId); return true; }

// ==========================================
// INVOICE — prefill Google Form URL
// ==========================================
// FIX #9: buildInvoiceUrl يقبل nameEn الآن
// ==========================================
// INVOICE — prefill Google Form URL
// ==========================================
// FIX #9: buildInvoiceUrl يقبل nameEn و salesEmail الآن
function buildInvoiceUrl(clientName, phone, course, price, paid, remaining, method, offer, attendanceDate, nameEn, salesEmail) {
  var base = "https://docs.google.com/forms/d/e/" + INVOICE_FORM_ID + "/viewform?usp=pp_url";
  function enc(v) { return encodeURIComponent(v || ""); }
  var url = base +
    "&entry.1397890666=" + enc(nameEn || clientName) +   // Name
    "&entry.1065046570=" + enc(phone) +                // Phone
    "&entry.1362574000=" + enc(course || "Digital Marketing") + // Course
    "&entry.742225424=" + enc(offer || "Cash") +        // Offer
    "&entry.1073793381=" + enc(price) +                // Price
    "&entry.2126494=" + enc(paid) +                 // Paid
    "&entry.2031693=" + enc(remaining) +            // Remaining
    "&entry.1573765=" + enc(method || "Cash") +       // Method
    "&entry.123456789=" + enc(attendanceDate || "") +   // Attendance
    "&entry.111111111=" + enc(salesEmail || "");        // Fallback placeholder for Sales Email
  return url;
}

// FIX #9: getInvoiceFormUrl يقبل nameEn و salesEmail ويقوم بالتعبئة الديناميكية الذكية
function getInvoiceFormUrl(clientName, phone, course, price, paid, remaining, method, offer, attendanceDate, nameEn, agentId, agentName, salesEmail, roundName, nextDueDate) {
  try {
    var billingSheetId = getSystemSetting("billingSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    var ss = SpreadsheetApp.openById(billingSheetId);
    var formUrl = ss.getFormUrl();

    if (formUrl) {
      try {
        var form = FormApp.openByUrl(formUrl);
        var items = form.getItems();
        var response = form.createResponse();

        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var title = item.getTitle().toLowerCase().trim();
          var type = item.getType();

          var val = "";
          if (title.indexOf("name") !== -1 || title.indexOf("اسم") !== -1) {
            val = nameEn || clientName;
          } else if (title.indexOf("phone") !== -1 || title.indexOf("تليفون") !== -1 || title.indexOf("هاتف") !== -1 || title.indexOf("رقم") !== -1) {
            val = phone;
          } else if (title.indexOf("course") !== -1 || title.indexOf("كورس") !== -1) {
            val = course || "Digital Marketing";
          } else if (title.indexOf("offer") !== -1 || title.indexOf("عرض") !== -1) {
            val = offer || "Cash";
          } else if (title.indexOf("price") !== -1 || title.indexOf("سعر") !== -1 || title.indexOf("إجمالي") !== -1 || title.indexOf("total") !== -1) {
            val = price;
          } else if (title.indexOf("paid") !== -1 || title.indexOf("مدفوع") !== -1) {
            val = paid;
          } else if (title.indexOf("remaining") !== -1 || title.indexOf("متبقي") !== -1) {
            val = remaining;
          } else if (title.indexOf("method") !== -1 || title.indexOf("طريقة") !== -1) {
            val = method || "Cash";
          } else if (title.indexOf("attendance") !== -1 || title.indexOf("حضور") !== -1) {
            val = attendanceDate;
          } else if (title.indexOf("email") !== -1 || title.indexOf("بريد") !== -1 || title.indexOf("إيميل") !== -1 || title.indexOf("سيلز") !== -1) {
            val = salesEmail;
          } else if (title.indexOf("round") !== -1 || title.indexOf("راوند") !== -1 || title.indexOf("مجموعة") !== -1 || title.indexOf("المجموعة") !== -1) {
            val = roundName || "";
          } else if (title.indexOf("next") !== -1 || title.indexOf("قسط") !== -1 || title.indexOf("ميعاد") !== -1 || title.indexOf("تاريخ القسط") !== -1) {
            val = nextDueDate || "";
          }

          if (val === "" || val === undefined || val === null) {
            if (title.indexOf("next") === -1 && title.indexOf("قسط") === -1 && title.indexOf("ميعاد") === -1 && 
               (title.indexOf("date") !== -1 || title.indexOf("تاريخ") !== -1)) {
              val = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
            }
          }

          if (val !== "" && val !== undefined && val !== null) {
            try {
              if (type === FormApp.ItemType.TEXT) {
                response.withItemResponse(item.asTextItem().createResponse(val.toString()));
              } else if (type === FormApp.ItemType.PARAGRAPH_TEXT) {
                response.withItemResponse(item.asParagraphTextItem().createResponse(val.toString()));
              } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
                response.withItemResponse(item.asMultipleChoiceItem().createResponse(val.toString()));
              } else if (type === FormApp.ItemType.LIST) {
                response.withItemResponse(item.asListItem().createResponse(val.toString()));
              } else if (type === FormApp.ItemType.CHECKBOX) {
                response.withItemResponse(item.asCheckboxItem().createResponse([val.toString()]));
              } else if (type === FormApp.ItemType.DATE) {
                var d = new Date(val);
                if (!isNaN(d.getTime())) {
                  response.withItemResponse(item.asDateItem().createResponse(d));
                }
              }
            } catch (e) { }
          }
        }
        var prefilledUrl = response.toPrefilledUrl();
        logActivity(agentId, agentName, "INVOICE_FORM_OPENED", clientName + " - " + price + " EGP");
        return { success: true, url: prefilledUrl, name: clientName, method: "dynamic" };
      } catch (formErr) {
        // Fallback to manual if FormApp fails (e.g. permission issues)
        var url = buildInvoiceUrl(clientName, phone, course, price, paid, remaining, method, offer, attendanceDate, nameEn, salesEmail);
        logActivity(agentId, agentName, "INVOICE_FORM_OPENED_FALLBACK", clientName + " - " + price + " EGP");
        return { success: true, url: url, name: clientName, method: "fallback", error: formErr.toString() };
      }
    } else {
      var url = buildInvoiceUrl(clientName, phone, course, price, paid, remaining, method, offer, attendanceDate, nameEn, salesEmail);
      logActivity(agentId, agentName, "INVOICE_FORM_OPENED_FALLBACK", clientName + " - " + price + " EGP");
      return { success: true, url: url, name: clientName, method: "fallback" };
    }
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// PAYMENT GATEWAY - (Duplicate definition removed, using consolidated gateway link function at line 1250)
// ==========================================

// FIX #8: getPaymentLinks — تصحيح أعمدة اللينك (Agent=B, Client=C, Amount=D, Date=E, Hours=F, Status=G, Link=H)
function getPaymentLinks(agentId, agentName, isManager) {
  try {
    var paySS = SpreadsheetApp.openById(PAYMENT_SHEET_ID);
    var sh = paySS.getSheets()[0];
    var data = sh.getDataRange().getValues();
    var links = [];
    for (var i = 1; i < data.length; i++) {
      var agentVal = (data[i][1] || "").toString().trim(); // Agent is Col B (index 1)
      if (!isManager && agentVal.toLowerCase() !== agentName.toLowerCase()) continue;

      var colG = (data[i][6] || "").toString().trim(); // Col G
      var colH = (data[i][7] || "").toString().trim(); // Col H
      var linkVal = "";
      var statusVal = "نشط";

      if (colG.startsWith("http://") || colG.startsWith("https://")) {
        linkVal = colG;
        statusVal = colH || "نشط";
      } else if (colH.startsWith("http://") || colH.startsWith("https://")) {
        linkVal = colH;
        statusVal = colG || "نشط";
      } else {
        linkVal = colH;
        statusVal = colG || "نشط";
      }

      links.push({
        clientName: data[i][2] || "", // C = Client Name (index 2)
        agent: agentVal,        // B = Agent (index 1)
        amount: data[i][3] || 0,  // D = Amount (index 3)
        hours: data[i][5] || 24, // F = Hours/Time (index 5)
        date: data[i][4] ? safeFormatDate(data[i][4], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : "",
        phone: "",              // No phone column needed
        link: linkVal,
        status: statusVal
      });
    }
    return links.reverse().slice(0, 50);
  } catch (e) { return []; }
}

// ==========================================
// PAYMENTS — Client Payments
// ==========================================
var _invoiceOcCodeMap = null;
function getInvoiceOcCodeMap() {
  if (_invoiceOcCodeMap !== null) return _invoiceOcCodeMap;
  // PERF FIX (2026-07-04): `var _invoiceOcCodeMap` only lives for the CURRENT execution — GAS runs
  // every google.script.run call in its own isolate, so this never actually persisted between the
  // user's separate actions. In practice EVERY OC lookup re-opened the invoice spreadsheet and
  // rescanned every row (and every column, in the fallback branch) from scratch — the real cause of
  // the reported slowness. CacheService persists across requests (5 min TTL here), so repeat lookups
  // within that window are instant.
  try {
    var _cachedMap = CacheService.getScriptCache().get('invoice_oc_map_v1');
    if (_cachedMap) { _invoiceOcCodeMap = JSON.parse(_cachedMap); return _invoiceOcCodeMap; }
  } catch (_ce) { /* cache miss/corrupt — fall through to a fresh scan */ }
  var tempMap = {}; // Build in a temp var — only assign to cache on success
  try {
    var INVOICE_SHEET_ID = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    var invoiceSS = openSpreadsheetCached(INVOICE_SHEET_ID) || SpreadsheetApp.openById(INVOICE_SHEET_ID);
    if (invoiceSS) {
      var sheets = invoiceSS.getSheets();
      var sh = null;
      var commonNames = ["Form Responses 1", "ردود النموذج 1", "Form_Responses", "Form Responses"];
      for (var k = 0; k < commonNames.length; k++) {
        sh = invoiceSS.getSheetByName(commonNames[k]);
        if (sh) break;
      }
      if (!sh) {
        for (var s = 0; s < sheets.length; s++) {
          var nameLower = sheets[s].getName().toLowerCase();
          if (nameLower.indexOf("response") !== -1 || nameLower.indexOf("ردود") !== -1 || nameLower.indexOf("فاتور") !== -1) {
            sh = sheets[s];
            break;
          }
        }
      }
      if (!sh && sheets.length > 0) {
        sh = sheets[0];
        var firstSheetName = sh.getName().toLowerCase();
        if (firstSheetName.indexOf("حساب") !== -1 || firstSheetName.indexOf("dash") !== -1 || firstSheetName.indexOf("الرئيسية") !== -1 || firstSheetName.indexOf("setting") !== -1) {
          if (sheets.length > 1) {
            sh = sheets[1];
          }
        }
      }

      if (sh) {
        var data = sh.getDataRange().getValues();
        var headers = data[0] || [];
        // Auto-detect phone column and OC code column by header name
        var phoneColIdx = 3; // default Column D
        for (var h = 0; h < headers.length; h++) {
          var hLow = (headers[h] || "").toString().toLowerCase();
          if (hLow.indexOf("phone") !== -1 || hLow.indexOf("تليف") !== -1 || hLow.indexOf("هاتف") !== -1 || hLow.indexOf("mobile") !== -1 || hLow.indexOf("رقم") !== -1) {
            phoneColIdx = h;
            break;
          }
        }
        for (var i = 1; i < data.length; i++) {
          var rowPhone = cleanPhone(data[i][phoneColIdx]);
          if (!rowPhone) rowPhone = cleanPhone(data[i][3]); // fallback to column D
          if (rowPhone) {
            var ocValR = (data[i][17] || "").toString().trim(); // Column R (index 17) — primary source per user spec
            var ocValM = (data[i][12] || "").toString().trim(); // Column M (index 12)
            // Also scan all columns for any OC- code pattern as last resort
            var matchedOc = "";
            if (ocValR && ocValR.toLowerCase().indexOf("oc-") === 0) {
              matchedOc = ocValR;
            } else if (ocValM && ocValM.toLowerCase().indexOf("oc-") === 0) {
              matchedOc = ocValM;
            } else {
              for (var col = 0; col < data[i].length; col++) {
                var colVal = (data[i][col] || "").toString().trim();
                if (colVal.toLowerCase().indexOf("oc-") === 0) { matchedOc = colVal; break; }
              }
            }
            if (matchedOc) {
              tempMap[rowPhone] = "OC-" + matchedOc.substring(3).toUpperCase().trim();
            }
          }
        }
      }
    }
    _invoiceOcCodeMap = tempMap; // Only cache after successful population
    try { CacheService.getScriptCache().put('invoice_oc_map_v1', JSON.stringify(tempMap), 300); } catch (_pe) { /* e.g. map too large for the 100KB cache slot — silently skip, in-memory only */ }
  } catch(e) {
    Logger.log("Error in getInvoiceOcCodeMap: " + e.toString());
    // Do NOT cache on failure — allow retry next call
    return tempMap;
  }
  return _invoiceOcCodeMap;
}

// ==========================================
// AUTO-SYNC MISSING OC CODES FROM INVOICE SHEET
// Scans Client_Payments + Raw_Data for rows without OC code
// and tries to match from invoice spreadsheet by phone
// ==========================================
function autoSyncMissingOcCodes(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح." };
  try {
    var map = getInvoiceOcCodeMap();
    if (!map || Object.keys(map).length === 0) {
      return { success: false, message: "⚠️ شيت الفواتير فارغ أو تعذّر الوصول إليه — لا يوجد أكواد OC لمزامنتها." };
    }

    var updatedRaw = 0, updatedPay = 0;
    var lock = LockService.getScriptLock(); lock.waitLock(20000);

    // 1. Sync Raw_Data column O (OC_Code)
    try {
      var rawSh = getSheet("Raw_Data");
      if (rawSh) {
        var rawData = rawSh.getDataRange().getValues();
        for (var i = 1; i < rawData.length; i++) {
          var existOc = (rawData[i][14] || "").toString().trim();
          if (existOc && existOc.toLowerCase().indexOf("oc-") === 0) continue; // already has OC
          var rPhone = cleanPhone(rawData[i][3]);
          if (!rPhone) continue;
          var foundOc = map[rPhone];
          if (foundOc) {
            rawSh.getRange(i + 1, 15).setValue(foundOc);
            updatedRaw++;
          }
        }
      }
    } catch(e1) { Logger.log("autoSync raw error: " + e1); }

    // 2. Sync Client_Payments column B (OC code field)
    try {
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = cpSh.getDataRange().getValues();
        // Also load Raw_Data for phone lookup
        var rawSh2 = getSheet("Raw_Data");
        var rawData2 = rawSh2 ? rawSh2.getDataRange().getValues() : [];
        for (var j = 1; j < cpData.length; j++) {
          if (!cpData[j][0]) continue;
          var isDeleted = cpData[j][19];
          if (isDeleted === true || isDeleted === "TRUE") continue; // skip deleted
          var payOc = (cpData[j][1] || "").toString().trim();
          if (payOc && payOc.toLowerCase().indexOf("oc-") === 0) continue; // already has OC
          var clientName = (cpData[j][2] || "").toString().trim();
          // Try to find phone via client name match in Raw_Data
          var matchedPhone = "";
          for (var ri = 1; ri < rawData2.length; ri++) {
            if ((rawData2[ri][2] || "").toString().trim() === clientName) {
              matchedPhone = cleanPhone(rawData2[ri][3]);
              break;
            }
          }
          if (!matchedPhone) continue;
          var foundOc2 = map[matchedPhone];
          if (foundOc2) {
            cpSh.getRange(j + 1, 2).setValue(foundOc2);
            updatedPay++;
          }
        }
      }
    } catch(e2) { Logger.log("autoSync cp error: " + e2); }

    SpreadsheetApp.flush();
    lock.releaseLock();
    _invoiceOcCodeMap = null; // reset in-memory cache so next call re-reads fresh data
    try { CacheService.getScriptCache().remove('invoice_oc_map_v1'); } catch (_rce) {} // also clear the persistent cache

    var msg = "✅ تمت المزامنة: " + updatedRaw + " سجل في Raw_Data | " + updatedPay + " سجل في Client_Payments";
    Logger.log(msg);
    return { success: true, message: msg, updatedRaw: updatedRaw, updatedPay: updatedPay };
  } catch(e) {
    try { LockService.getScriptLock().releaseLock(); } catch(le) {}
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

function getInvoiceOcCodeByPhone(cPhone) {
  if (!cPhone) return "";
  var map = getInvoiceOcCodeMap();
  return map[cPhone] || "";
}

// FIX-07: unified OC join key. Strips an "OC-" prefix + leading zeros + uppercases so every OC
// comparison agrees ("OC-1000388" == "1000388" == "oc-1000388"). Returns "" for blank/placeholder.
// This is the single normalizer all OC joins/lookups must use.
function ocKey(v) {
  var s = (v == null ? "" : v).toString().trim();
  if (s.toUpperCase().indexOf("OC-") === 0) s = s.substring(3);
  s = s.replace(/^0+/, "").toUpperCase().trim();
  if (s === "—" || s === "-" || s === "NULL" || s === "UNDEFINED") s = "";
  return s;
}

// FIX-07: canonical OC equality for ALL joins — normalizes both sides via ocKey and refuses to
// match on blank (two OC-less rows must never join). Use this everywhere an OC is compared.
function ocEq(a, b) {
  var ka = ocKey(a);
  return ka !== "" && ka === ocKey(b);
}

function ensureOcCode(ocCode, clientId, clientPhone, clientName) {
  var code = (ocCode || "").toString().trim();
  if (code === "—" || code === "-" || code.toLowerCase() === "null" || code.toLowerCase() === "undefined") {
    code = "";
  }
  if (code && code.toLowerCase().indexOf("oc-") === 0) {
    return "OC-" + code.substring(3).toUpperCase().trim();
  }
  var cId = (clientId || "").toString().trim();
  if (cId === "—" || cId === "-" || cId.toLowerCase() === "null" || cId.toLowerCase() === "undefined") {
    cId = "";
  }
  if (cId && cId.toLowerCase().indexOf("oc-") === 0) {
    return "OC-" + cId.substring(3).toUpperCase().trim();
  }

  var cPhone = cleanPhone(clientPhone);
  if (!cPhone && cId) {
    if (cId.match(/^\+?[0-9]{8,15}$/)) {
      cPhone = cleanPhone(cId);
    } else {
      try {
        var rawSh = getSheet("Raw_Data");
        if (rawSh) {
          var rawData = rawSh.getDataRange().getValues();
          for (var i = 1; i < rawData.length; i++) {
            var rowId = (rawData[i][0] || "").toString().trim();
            if (rowId === cId) {
              cPhone = cleanPhone(rawData[i][3]);
              break;
            }
          }
        }
      } catch(e) {}
    }
  }

  if (cPhone) {
    var invoiceOc = getInvoiceOcCodeByPhone(cPhone);
    if (invoiceOc) {
      return invoiceOc;
    }
  }

  // If not found in the Invoice Issuing System sheet, leave it empty in the master sheet
  return "";
}


function getClientByPhone(phone) {
  try {
    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    var cleanPhone = phone.toString().trim();
    if (!cleanPhone) return { success: false, message: "أدخل رقم هاتف صحيح" };

    for (var i = 1; i < rawData.length; i++) {
      var rowPhone = (rawData[i][3] || "").toString().trim();
      // Match exact phone or matching last 9 digits to handle country code variants
      if (rowPhone && (rowPhone === cleanPhone || rowPhone.slice(-9) === cleanPhone.slice(-9))) {
        var notes = (rawData[i][8] || "").toString().split("\n").filter(function (l) { return l.trim(); });
        var agentNameRaw = (rawData[i][6] || "").toString().trim();
        var agentIdRaw = "";
        try {
          var uSh2 = getSheet("Users");
          if (uSh2 && agentNameRaw) {
            var uData2 = uSh2.getDataRange().getValues();
            for (var u2 = 1; u2 < uData2.length; u2++) {
              if ((uData2[u2][1] || "").toString().trim() === agentNameRaw) {
                agentIdRaw = (uData2[u2][0] || "").toString().trim();
                break;
              }
            }
          }
        } catch(e2) {}
        return {
          success: true,
          client: {
            id: (rawData[i][0] || (i + 1)).toString(),
            rowIndex: i + 1,
            name: rawData[i][2] || "",
            phone: rowPhone,
            course: rawData[i][5] || "",
            agent: agentNameRaw,
            agentId: agentIdRaw,
            status: rawData[i][7] || "",
            lastAction: rawData[i][10] || rawData[i][9] || "",
            ocCode: ensureOcCode(rawData[i][14], (rawData[i][0] || "").toString(), rowPhone, rawData[i][2]),
            campaignType: rawData[i][12] || "",
            notes: notes
          }
        };
      }
    }
    return { success: false, message: "لم يتم العثور على عميل بهذا الرقم" };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// PERF FIX (2026-07-06): getClientPayments() reads Raw_Data + Payment_Transactions + Client_Payments
// in FULL on every single call — with the "Client Payments" page reported as taking 10-13s to open
// live, and the result being IDENTICAL for every caller (this function doesn't actually filter by
// agentId/isManager at all), a short-TTL cache means repeat opens within the window are near-instant
// instead of paying for 3 full-sheet reads every time. Every function that mutates Client_Payments
// calls invalidateClientPaymentsCache() at its real success path, so a change is visible again within
// one write — the TTL is only a safety net for any spot that isn't covered, kept short on purpose.
var CLIENT_PAYMENTS_CACHE_KEY = 'bsa_client_payments_v1';
function invalidateClientPaymentsCache() {
  try { CacheService.getScriptCache().remove(CLIENT_PAYMENTS_CACHE_KEY); } catch (e) {}
}
function getClientPayments(agentId, isManager) {
  try {
    var _cached = CacheService.getScriptCache().get(CLIENT_PAYMENTS_CACHE_KEY);
    if (_cached) { return JSON.parse(_cached); }
  } catch (_ce) {}
  _requestCache = {}; // reset for this request
  try {
    var rawData = getSheetDataCached("Raw_Data");
    var clientMap = {};
    for (var j = 1; j < rawData.length; j++) {
      var cId = (rawData[j][0] || "").toString().trim();
      var rawOcO = (rawData[j][14] || "").toString().trim(); // Column O
      var oc = (rawOcO && rawOcO.toLowerCase().indexOf("oc-") === 0) ? rawOcO : "";
      if (!oc) {
        oc = ensureOcCode(rawOcO, cId, rawData[j][3], rawData[j][2]);
      }
      var ph = rawData[j][3] || "";
      if (cId) {
        clientMap[cId] = { phone: ph, ocCode: oc };
      }
      if (oc) {
        clientMap[oc] = { phone: ph, ocCode: oc };
      }
    }

    // Load transactions from Payment_Transactions to map payments to their PYMT 1, 2, 3, 4 values
    var txData = getSheetDataCached("Payment_Transactions");
    var txMap = {};
    for (var k = 1; k < txData.length; k++) {
      var pId = (txData[k][1] || "").toString().trim();
      if (pId) {
        var txAmt = parseFloat(txData[k][3]) || 0;
        if (!txMap[pId]) txMap[pId] = [];
        txMap[pId].push(txAmt);
      }
    }

    var sh = getSheet("Client_Payments");
    if (!sh) return [];
    var lastModCol = ensureLastModifiedColumn(sh);
    var data = getSheetDataCached("Client_Payments");
    var payments = [];
    var tz = Session.getScriptTimeZone();

    // Look up current user to enable robust agent matching by name/key
    var currentUserObj = null;
    try {
      var users = getUsers();
      for (var u = 0; u < users.length; u++) {
        if (users[u].id.toString().trim() === agentId.toString().trim()) {
          currentUserObj = users[u];
          break;
        }
      }
    } catch (userErr) { }

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      // Skip soft-deleted records (col 20, index 19)
      var isDeleted = data[i][19];
      if (isDeleted === true || isDeleted === "TRUE" || isDeleted === "true" || isDeleted === 1) continue;

      var pid = data[i][0].toString().trim();
      var clientId = (data[i][1] || "").toString().trim();
      var info = clientMap[clientId] || { phone: "", ocCode: "" };
      var txs = txMap[pid] || [];
      var lastModVal = data[i][lastModCol - 1] || "";
      // installPaid = paid minus the down payment (total - inst1 - inst2 - inst3)
      var _t  = parseFloat(data[i][6])  || 0;
      var _p  = parseFloat(data[i][9])  || 0;
      var _i1 = parseFloat(data[i][15]) || 0;
      var _i2 = parseFloat(data[i][16]) || 0;
      var _i3 = parseFloat(data[i][17]) || 0;
      var installPaid = Math.max(0, _p - Math.max(0, _t - _i1 - _i2 - _i3));

      payments.push({
        id: pid,
        clientId: clientId,
        clientName: data[i][2] || "",
        phone: info.phone,
        ocCode: info.ocCode,
        course: data[i][3] || "",
        roundId: data[i][4] ? data[i][4].toString().trim() : "",
        roundName: data[i][5] || "",
        total: data[i][6] || 0,
        agentId: (data[i][7] || "").toString(),
        agentName: data[i][8] || "",
        paid: data[i][9] || 0,
        remaining: data[i][10] || 0,
        nextDue: data[i][11] ? safeFormatDate(data[i][11], tz, "yyyy-MM-dd") : "",
        status: data[i][12] || "Pending",
        notes: data[i][13] || "",
        createdAt: data[i][14] ? safeFormatDate(data[i][14], tz, "yyyy-MM-dd") : "",
        inst1: parseFloat(data[i][15]) || 0,
        inst2: parseFloat(data[i][16]) || 0,
        inst3: parseFloat(data[i][17]) || 0,
        pymts: txs,          // all transactions (amounts only)
        installPaid: installPaid, // sum of "قسط" transactions only
        lastModified: lastModVal ? lastModVal.toString() : ""
      });
    }

    // Filter out Wait/Other/empty-round clients moved to frontend for better flex
    try { CacheService.getScriptCache().put(CLIENT_PAYMENTS_CACHE_KEY, JSON.stringify(payments), 20); } catch (_pe) { /* e.g. over the 100KB cache-value limit — skip, in-memory only for this call */ }
    return payments;
  } catch (e) {
    Logger.log("Error in getClientPayments: " + e.toString());
    throw new Error(e.toString());
  }
}

function addClientPayment(clientId, clientName, clientPhone, course, roundId, roundName, total, agentId, agentName, firstPay, nextDue, notes, inst1, inst2, inst3, inst1Date, inst2Date, inst3Date) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    
    // Deduplication check: check if a payment already exists for this client in this round/status
    var shPay = getSheet("Client_Payments");
    var payData = shPay.getDataRange().getValues();
    var cleanRoundId = (roundId || "").toString().trim();
    var cleanClientName = (clientName || "").toString().trim().toLowerCase();
    var cleanTotal = parseFloat(total) || 0;
    var now = new Date().getTime();
    // FIX-08/DUP-1: compute these up front so the Wait→Round promote can run inside the dedup loop
    // (before the time-window tier), which is what actually prevents the 55 Wait+Round duplicates.
    var tot = parseFloat(total) || 0;
    var paid = parseFloat(firstPay) || 0;
    var finalClientId = ensureOcCode("", clientId, clientPhone || "", "") || "";
    for (var i = 1; i < payData.length; i++) {
      var rowOc   = (payData[i][1] || "").toString().trim();
      var rowName = (payData[i][2] || "").toString().trim().toLowerCase();
      var rowRound = (payData[i][4] || "").toString().trim();
      var rowTotal = parseFloat(payData[i][6]) || 0;
      var rowIsDeleted = payData[i][19];
      if (rowIsDeleted === true || rowIsDeleted === "TRUE") continue; // skip deleted rows from dedup
      // FIX-08/DUP-1: Wait→Round promote — if we're registering to a REAL round and this is an
      // active "Wait" row (empty round) for the same client, UPDATE it in place instead of letting
      // a second row be appended later. Runs BEFORE the time-window tier so it works at any age.
      if (cleanRoundId && rowRound === "") {
        var _wm = false;
        if (ocEq(rowOc, finalClientId) || ocEq(rowOc, clientId)) _wm = true; // FIX-07: ocKey-normalized OC join
        else if (!rowOc && cleanClientName && rowName === cleanClientName) _wm = true; // blank-OC fallback
        if (_wm) {
          var _wRem = tot - paid; if (_wRem < 0) _wRem = 0;
          shPay.getRange(i + 1, 5).setValue(roundId || "");   // roundId
          shPay.getRange(i + 1, 6).setValue(roundName || ""); // roundName
          shPay.getRange(i + 1, 7).setValue(tot);             // total
          shPay.getRange(i + 1, 10).setValue(paid);           // paid
          shPay.getRange(i + 1, 11).setValue(_wRem);          // remaining
          shPay.getRange(i + 1, 13).setValue(_wRem <= 0 ? "Paid" : "Installment"); // status
          if (finalClientId && !rowOc) shPay.getRange(i + 1, 2).setValue(finalClientId); // backfill OC if resolved
          lock.releaseLock();
          invalidateClientPaymentsCache();
          return { success: true, message: "✅ تم تحويل حجز الانتظار إلى راوند (بدون تكرار)", payId: payData[i][0].toString(), promoted: true };
        }
      }
      // Primary match: OC code + round (strong dedup)
      if (ocEq(rowOc, clientId) && rowRound === cleanRoundId) { // FIX-07: ocKey-normalized OC join
        lock.releaseLock();
        return { success: true, message: "✅ الدفعة مسجلة بالفعل", payId: payData[i][0].toString() };
      }
      // Fallback match: name + round (for clients without OC code yet)
      if (!rowOc && cleanClientName && rowName === cleanClientName && rowRound === cleanRoundId) {
        lock.releaseLock();
        return { success: true, message: "✅ الدفعة مسجلة بالفعل", payId: payData[i][0].toString() };
      }
      // Time-window dedup: same name + same total within 3 minutes → prevent double-click duplicates
      var rowCreated = payData[i][14] ? new Date(payData[i][14]).getTime() : 0;
      if (cleanClientName && rowName === cleanClientName && cleanTotal > 0 && rowTotal === cleanTotal &&
          rowCreated > 0 && (now - rowCreated) < 3 * 60 * 1000) {
        lock.releaseLock();
        Logger.log("addClientPayment dedup: time-window match for " + clientName);
        return { success: true, message: "✅ الدفعة مسجلة بالفعل (تم تجاهل التكرار)", payId: payData[i][0].toString() };
      }
    }

    var rem = tot - paid; // tot/paid computed above (FIX-08)

    // --- Collision-safe Pay_ID: build set of existing IDs then pick unique one ---
    var existingPayIds = buildIdSet(payData, 0, 19); // col 0 = Pay_ID, col 19 = is_deleted
    var pid = safeGenId(existingPayIds);

    // finalClientId computed above (FIX-08). Wait→Round promote handled inside the dedup loop.
    var valInst1 = (inst1 !== undefined && inst1 !== "") ? parseFloat(inst1) || 0 : (rem > 0 ? rem : 0);
    var valInst2 = (inst2 !== undefined && inst2 !== "") ? parseFloat(inst2) || 0 : 0;
    var valInst3 = (inst3 !== undefined && inst3 !== "") ? parseFloat(inst3) || 0 : 0;
    appendRowWithTimestamp(getSheet("Client_Payments"), [
      pid, finalClientId, clientName, course, roundId||"", roundName||"",
      tot, agentId, agentName, paid, rem<0?0:rem,
      nextDue?new Date(nextDue):"", rem<=0?"Paid":"Installment", notes||"", new Date(),
      valInst1, valInst2, valInst3
    ]);

    // Collision-safe Transaction_ID
    var txSh = getSheet("Payment_Transactions");
    var txData = txSh ? txSh.getDataRange().getValues() : [[]];
    var existingTxIds = buildIdSet(txData, 0, -1);
    txSh.appendRow([
      safeGenId(existingTxIds), pid, clientName, paid, new Date(), "أول دفعة", agentId, agentName
    ]);
    lock.releaseLock();
    logActivity(agentId, agentName, "ADD_PAYMENT", clientName + " - " + tot + " EGP");
    try {
      syncClientPaymentToLedger(pid);
    } catch (ledgerErr) { }
    SpreadsheetApp.flush();
    invalidateClientPaymentsCache();
    return { success: true, message: "✅ تم تسجيل الدفعة بنجاح", payId: pid };
  } catch (e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

function addInstallment(payId, amount, agentId, agentName, nextDue) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    var sh = getSheet("Client_Payments"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === payId.toString()) {
        var paid = (data[i][9] || 0) + parseFloat(amount);
        var rem = (data[i][6] || 0) - paid;
        sh.getRange(i + 1, 10).setValue(paid);
        sh.getRange(i + 1, 11).setValue(rem < 0 ? 0 : rem);
        sh.getRange(i + 1, 12).setValue(nextDue ? new Date(nextDue) : "");
        sh.getRange(i + 1, 13).setValue(rem <= 0 ? "Paid" : "Installment");
        // transaction log
        getSheet("Payment_Transactions").appendRow([
          genId(), payId, data[i][2], amount, new Date(), "قسط", agentId, agentName
        ]);

        // Auto-sync payment to Financial_Data — record in current month AND update old client row
        try {
          var currentMonth = new Date().getMonth() + 1;
          var currentYear  = new Date().getFullYear();
          var instClientAgentId   = (data[i][7] || "").toString().trim() || agentId;
          var instClientAgentName = (data[i][8] || "").toString().trim() || agentName;
          var instOcCode = (data[i][1] || "").toString().trim();
          var instName   = (data[i][2] || "").toString().trim();

          // Find original registration month/year in Financial_Data to update the old "Paid" balance
          var origMonth = 0, origYear = 0;
          try {
            var finSh = getSheet("Financial_Data");
            if (finSh) {
              var finData = finSh.getDataRange().getValues();
              for (var ff = 1; ff < finData.length; ff++) {
                if ((finData[ff][4]||"").toString().trim().toLowerCase() !== "client") continue;
                var finOc   = (finData[ff][6]||"").toString().trim();
                var finName = (finData[ff][7]||"").toString().trim().toLowerCase();
                if (ocEq(finOc, instOcCode) || finName === instName.toLowerCase()) { // FIX-07: ocKey join (was raw === → cross-format installment desync)
                  origMonth = parseInt(finData[ff][2]) || 0;
                  origYear  = parseInt(finData[ff][3]) || 0;
                  break;
                }
              }
            }
          } catch(fe) {}

          addFinancialPayment(instClientAgentId, instClientAgentName, currentMonth, currentYear, {
            ocCode: instOcCode,
            name:   instName,
            phone:  "",
            date:   Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
            amount: parseFloat(amount),
            originalMonth: origMonth || undefined,
            originalYear:  origYear  || undefined
          });
        } catch (e) { }

        lock.releaseLock();
        logActivity(agentId, agentName, "INSTALLMENT", payId + " - " + amount + " EGP");
        try {
          syncClientPaymentToLedger(payId);
        } catch (ledgerErr) { }
        invalidateClientPaymentsCache();
        return { success: true, message: "✅ تم تسجيل القسط وتحديث حسابات السيلز" };
      }
    }
    lock.releaseLock();
    return { success: false, message: "السجل غير موجود" };
  } catch (e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

function updateClientPayment(payId, total, paid, inst1, inst2, inst3, nextDue, notes, roundId, roundName, expectedLastModified) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    var sh = getSheet("Client_Payments");
    var lastModCol = ensureLastModifiedColumn(sh);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === payId.toString()) {
        
        // CHECK Row Versioning CONFLICT
        var currentModified = data[i][lastModCol - 1] || "";
        if (expectedLastModified && currentModified && currentModified.toString() !== expectedLastModified.toString()) {
          lock.releaseLock();
          return { success: false, message: "⚠️ عذراً، تم تعديل بيانات هذا القسط بواسطة مستخدم آخر في نفس الوقت. يرجى تحديث الصفحة والمحاولة مرة أخرى." };
        }

        var tot = parseFloat(total) || 0;
        var newPaid = parseFloat(paid) || 0;
        var i1 = parseFloat(inst1) || 0;
        var i2 = parseFloat(inst2) || 0;
        var i3 = parseFloat(inst3) || 0;

        // Sum paid transactions to calculate current paid
        var pid = data[i][0].toString();
        var clientName = data[i][2] || "";
        var txSh = getSheet("Payment_Transactions");
        var txData = txSh ? txSh.getDataRange().getValues() : [];
        var firstTxIndex = -1;
        var totalPaidFromTxs = 0;
        for (var k = 1; k < txData.length; k++) {
          if ((txData[k][1] || "").toString().trim() === pid.trim()) {
            if (firstTxIndex === -1) {
              firstTxIndex = k + 1; // 1-based row index
            }
            totalPaidFromTxs += parseFloat(txData[k][3]) || 0;
          }
        }

        // Sync transactions with the new paid amount
        if (newPaid !== totalPaidFromTxs) {
          if (txSh) {
            var diff = newPaid - totalPaidFromTxs;
            if (firstTxIndex === -1) {
              // No transactions exist at all — create initial payment
              txSh.appendRow([genId(), pid, clientName, newPaid, new Date(), "أول دفعة", "SYSTEM", "System"]);
            } else if (diff > 0) {
              // Paid increased → new installment received, add a "قسط" transaction for the difference
              txSh.appendRow([genId(), pid, clientName, diff, new Date(), "قسط", "SYSTEM", "System"]);
            } else {
              // Paid decreased (correction) → adjust the first transaction
              var oldFirstTxVal = parseFloat(txData[firstTxIndex - 1][3]) || 0;
              var adjustedVal = oldFirstTxVal + diff; // diff is negative here
              if (adjustedVal < 0) adjustedVal = 0;
              txSh.getRange(firstTxIndex, 4).setValue(adjustedVal);
            }
            totalPaidFromTxs = newPaid;
          }
        }

        var rem = tot - totalPaidFromTxs;
        if (rem < 0) rem = 0;

        sh.getRange(i + 1, 5).setValue(roundId || ""); // roundId
        sh.getRange(i + 1, 6).setValue(roundName || ""); // roundName

        sh.getRange(i + 1, 7).setValue(tot); // total
        sh.getRange(i + 1, 10).setValue(totalPaidFromTxs); // paid
        sh.getRange(i + 1, 11).setValue(rem); // remaining
        sh.getRange(i + 1, 12).setValue(nextDue ? new Date(nextDue) : ""); // nextDue
        sh.getRange(i + 1, 13).setValue(rem <= 0 ? "Paid" : "Installment"); // status
        sh.getRange(i + 1, 14).setValue(notes || ""); // notes

        // Write installments to columns 16, 17, 18
        sh.getRange(i + 1, 16).setValue(i1);
        sh.getRange(i + 1, 17).setValue(i2);
        sh.getRange(i + 1, 18).setValue(i3);

        // Update timestamp
        sh.getRange(i + 1, lastModCol).setValue(new Date().toISOString());

        // Auto-enroll in Round_Members if assigned
        if (roundId) {
          var clientOc = (data[i][1] || "").toString().trim();
          if (clientOc === "—" || clientOc === "-" || clientOc.toLowerCase() === "null" || clientOc.toLowerCase() === "undefined") {
            clientOc = "";
          }
          var courseVal = data[i][3] || "";
          var agentIdVal = data[i][7] || "";
          var agentNameVal = data[i][8] || "";
          var phoneVal = "";

          if (clientOc) {
            try {
              var rawSh = getSheet("Raw_Data");
              if (rawSh) {
                var rawValues = rawSh.getDataRange().getValues();
                for (var r = 1; r < rawValues.length; r++) {
                  var rawOc = (rawValues[r][14] || "").toString().trim(); // Column O (OC CODE) is index 14
                  var rawId = (rawValues[r][0] || "").toString().trim();
                  if (ocEq(rawOc, clientOc) || rawId === clientOc) { // FIX-07
                    phoneVal = rawValues[r][3] || "";
                    break;
                  }
                }
              }
            } catch (rawErr) { }
          }

          var memSh = getSheet("Round_Members");
          var alreadyEnrolled = false;
          var enrolledRowIndex = -1;
          if (memSh) {
            var memData = memSh.getDataRange().getValues();
            for (var m = 1; m < memData.length; m++) {
              if (memData[m][0].toString() === roundId.toString() &&
                ocEq(memData[m][1], clientOc)) { // FIX-07: ocKey-normalized OC join
                alreadyEnrolled = true;
                enrolledRowIndex = m + 1;
                break;
              }
            }
          }

          if (!alreadyEnrolled) {
            addRoundMember(roundId, {
              ocCode: clientOc,
              name: clientName,
              phone: phoneVal,
              action: "New",
              price: tot,
              paid: totalPaidFromTxs,
              method: "Cash",
              attendance: "",
              agentId: agentIdVal,
              agentName: agentNameVal
            });
          } else {
            // Update the existing member's price and paid amount in Round_Members
            memSh.getRange(enrolledRowIndex, 6).setValue(tot); // Price
            memSh.getRange(enrolledRowIndex, 7).setValue(totalPaidFromTxs); // Paid
          }
        }

        // FIX-SYNC-1: propagate the new total/paid into the matching Financial_Data client row(s)
        // so the accounts table (reads Financial_Data Price col O) no longer desyncs from Client_Payments
        // (the هاجر case). Match by OC when present, else exact name (blank-OC fallback); 'client' rows only.
        // Price is the course total (consistent across the client's rows) → always synced; Paid is synced
        // only when the match is unambiguous (a single row) to avoid corrupting per-month Paid figures.
        var _fdSynced = 0;
        try {
          var _ocKey = ocKey; // FIX-07: use canonical ocKey
          var _cpOc = (data[i][1] || "").toString().trim();
          if (_cpOc === "—" || _cpOc === "-" || _cpOc.toLowerCase() === "null" || _cpOc.toLowerCase() === "undefined") _cpOc = "";
          var _cpOcKey = _ocKey(_cpOc);
          var _cpNameKey = (clientName || "").toString().trim().toLowerCase();
          var _finSh = getSheet("Financial_Data");
          if (_finSh) {
            var _finData = _finSh.getDataRange().getValues();
            var _matchRows = [];
            for (var _f = 1; _f < _finData.length; _f++) {
              var _fType = (_finData[_f][4] || "").toString().trim().toLowerCase();
              if (_fType && _fType !== "client") continue;
              var _fOcKey = _ocKey(_finData[_f][6]);
              var _fNameKey = (_finData[_f][7] || "").toString().trim().toLowerCase();
              if ((_cpOcKey && _fOcKey && _fOcKey === _cpOcKey) || (!_cpOcKey && _cpNameKey && _fNameKey === _cpNameKey)) {
                _matchRows.push(_f + 1);
              }
            }
            for (var _mr = 0; _mr < _matchRows.length; _mr++) {
              _finSh.getRange(_matchRows[_mr], 15).setValue(tot); // Price (col O / idx14)
            }
            if (_matchRows.length === 1) {
              _finSh.getRange(_matchRows[0], 16).setValue(totalPaidFromTxs); // Paid (col P / idx15) — only when unambiguous
            }
            _fdSynced = _matchRows.length;
          }
        } catch (finErr) { _fdSynced = -1; }

        lock.releaseLock();
        try {
          syncClientPaymentToLedger(payId);
        } catch (ledgerErr) { }
        var _ucpResult = { success: true, message: "✅ تم تحديث بيانات الدفع والعميل بنجاح" };
        if (_fdSynced === 0) _ucpResult.warnings = ["Financial_Data: لم يُعثر على صف مطابق لمزامنة الإجمالي (قد يكون العميل بلا سجل في الحسابات أو الاسم مختلف)"];
        else if (_fdSynced === -1) _ucpResult.warnings = ["Financial_Data: خطأ أثناء مزامنة الإجمالي"];
        return _ucpResult;
      }
    }
    lock.releaseLock();
    return { success: false, message: "السجل غير موجود" };
  } catch (e) {
    try { lock.releaseLock(); } catch (err) {}
    logActivity("SYSTEM", "Error", "updateClientPayment", e.toString());
    return { success: false, message: "حدث خطأ غير متوقع: " + e.toString() };
  }
}

// Snapshot + remove a client's Round_Members row (used when a payment is soft-deleted so the round
// roster stays in sync — see deleteClientPaymentRecord below). Returns the removed row (array) so it
// can be restored later, or null if the client had no round membership.
function _snapshotAndRemoveRoundMember(roundId, ocCode, clientName, phone) {
  if (!roundId || roundId === "Wait") return null;
  try {
    var sh = getSheet("Round_Members");
    if (!sh) return null;
    var data = sh.getDataRange().getValues();
    var ocK = ocKey(ocCode);
    var phoneClean = phone ? cleanPhone(phone) : "";
    var nameLower = (clientName || "").toString().trim().toLowerCase();
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0].toString() !== roundId.toString()) continue;
      var rowOc = ocKey(data[i][1]);
      var rowPhoneClean = cleanPhone(data[i][3]);
      var rowNameLower = (data[i][2] || "").toString().trim().toLowerCase();
      var match =
        (ocK && rowOc && rowOc === ocK) ||
        (phoneClean && rowPhoneClean && (rowPhoneClean === phoneClean || rowPhoneClean.slice(-9) === phoneClean.slice(-9))) ||
        (!ocK && !phoneClean && nameLower && rowNameLower === nameLower);
      if (match) {
        var snapshot = data[i].slice();
        sh.deleteRow(i + 1);
        try {
          var rsh = getSheet("Rounds");
          var rdata = rsh.getDataRange().getValues();
          for (var j = 1; j < rdata.length; j++) {
            if ((rdata[j][0] || "").toString() === roundId.toString()) {
              var current = parseInt(rdata[j][5]) || 0;
              rsh.getRange(j + 1, 6).setValue(Math.max(0, current - 1));
              break;
            }
          }
          invalidateRoundsCache();
        } catch (rcErr) {}
        return snapshot;
      }
    }
  } catch (e) {}
  return null;
}

// Restore a previously-removed Round_Members row from a snapshot (mirror of the function above),
// re-incrementing the round's enrolled count. Returns false (no-op) if the round no longer exists.
function _restoreRoundMemberFromSnapshot(snapshot) {
  if (!snapshot || !snapshot[0]) return false;
  try {
    var roundId = snapshot[0].toString();
    var rsh = getSheet("Rounds");
    var rdata = rsh ? rsh.getDataRange().getValues() : [];
    var roundRowIdx = -1;
    for (var j = 1; j < rdata.length; j++) {
      if ((rdata[j][0] || "").toString() === roundId) { roundRowIdx = j; break; }
    }
    if (roundRowIdx === -1) return false; // round was deleted meanwhile — nothing to restore into
    var sh = getSheet("Round_Members");
    if (!sh) return false;
    sh.appendRow(snapshot);
    var current = parseInt(rdata[roundRowIdx][5]) || 0;
    rsh.getRange(roundRowIdx + 1, 6).setValue(current + 1);
    invalidateRoundsCache();
    return true;
  } catch (e) { return false; }
}

function deleteClientPaymentRecord(payId, agentId, isManager) {
  if (!isManager) {
    return { success: false, message: "عفواً، لا تملك الصلاحية لحذف بيانات الدفع." };
  }
  if (!payId || payId.toString().trim() === "") {
    return { success: false, message: "معرّف الدفعة غير صالح." };
  }
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sh = getSheet("Client_Payments");
    if (!sh) {
      lock.releaseLock();
      return { success: false, message: "شيت Client_Payments غير موجود." };
    }
    var data = sh.getDataRange().getValues();
    var rowIndex = -1;
    var clientId = "";
    var clientName = "";
    var roundId = "";
    var ocCode = "";
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === payId.toString().trim()) {
        rowIndex = i + 1;
        clientId = (data[i][1] || "").toString().trim();
        if (clientId === "—" || clientId === "-" || clientId.toLowerCase() === "null" || clientId.toLowerCase() === "undefined") {
          clientId = "";
        }
        clientName = (data[i][2] || "").toString().trim();
        roundId = (data[i][4] || "").toString().trim();
        break;
      }
    }
    if (rowIndex === -1) {
      lock.releaseLock();
      return { success: false, message: "السجل غير موجود." };
    }

    // Retrieve OC code + phone for this client from Raw_Data if possible
    var ocCodePhone = "";
    var rawSh = getSheet("Raw_Data");
    if (rawSh) {
      var rawData = rawSh.getDataRange().getValues();
      for (var r = 1; r < rawData.length; r++) {
        var rId = (rawData[r][0] || "").toString().trim();
        var rOc = (rawData[r][14] || "").toString().trim(); // Column O is index 14
        if (rOc === "—" || rOc === "-" || rOc.toLowerCase() === "null" || rOc.toLowerCase() === "undefined") {
          rOc = "";
        }
        if ((clientId && rId === clientId) || (rOc && rOc === clientId)) {
          ocCode = rOc;
          ocCodePhone = (rawData[r][3] || "").toString().trim();
          break;
        }
      }
    }

    var cleanOcCode = (ocCode || "").toString().trim();
    if (cleanOcCode === "—" || cleanOcCode === "-" || cleanOcCode.toLowerCase() === "null" || cleanOcCode.toLowerCase() === "undefined") {
      cleanOcCode = "";
    }

    // ROUND-SYNC FIX (2026-07-04, per user decision "أ"): deleting a payment record used to leave the
    // client's Round_Members membership untouched, so "9 مقعد" in the round kept not matching "8 عملاء"
    // in Client Payments. Now the round membership is snapshotted (for restore) and removed together —
    // mirroring what the Refund flow already does — so the two counts stay in sync both ways.
    var _removedRoundSnapshot = _snapshotAndRemoveRoundMember(roundId, cleanOcCode, clientName, ocCodePhone);
    if (_removedRoundSnapshot) {
      try { sh.getRange(rowIndex, 23).setValue(JSON.stringify(_removedRoundSnapshot)); } catch (snapErr) {}
    }

    // SOFT DELETE: mark as deleted instead of hard delete — recoverable from recycle bin
    // Columns 20=Is_Deleted, 21=Deleted_By, 22=Deleted_At, 23=RoundMemberBackup (1-indexed)
    var deletedByName = "Admin";
    try {
      var usrs = getUsers();
      for (var uu = 0; uu < usrs.length; uu++) {
        if (usrs[uu].id.toString().trim() === agentId.toString().trim()) { deletedByName = usrs[uu].name; break; }
      }
    } catch(e2){}
    sh.getRange(rowIndex, 20).setValue(true);
    sh.getRange(rowIndex, 21).setValue(deletedByName);
    sh.getRange(rowIndex, 22).setValue(new Date());
    SpreadsheetApp.flush(); // commit writes before releasing lock
    lock.releaseLock();
    logActivity(agentId, "Admin", "SOFT_DELETE_PAYMENT", clientName + " (قابل للاسترداد)");
    try { _appendClientHistory(ocCodePhone, cleanOcCode, _histFmt("Delete Payment", deletedByName, "اتشال سجل القسط (نقل لسلة المحذوفات)" + (_removedRoundSnapshot ? " + اتشال من الراوند" : ""))); } catch (he) {}
    var _msg = "🗑️ تم نقل السجل إلى سلة المحذوفات. يمكن استرداده لاحقاً من قائمة المحذوفات."
      + (_removedRoundSnapshot ? " كما تم إزالته من الراوند (سيتم إرجاعه تلقائياً عند الاسترداد)." : "");
    invalidateClientPaymentsCache();
    return { success: true, message: _msg, softDeleted: true };
  } catch (e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// RESTORE SOFT-DELETED PAYMENT
// ==========================================
function restoreClientPaymentRecord(payId, adminId) {
  if (!payId || payId.toString().trim() === "") return { success: false, message: "معرّف الدفعة غير صالح." };
  var isManager = isUserAdminOrManager(adminId);
  if (!isManager) return { success: false, message: "عفواً، لا تملك صلاحية الاسترداد." };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sh = getSheet("Client_Payments");
    if (!sh) { lock.releaseLock(); return { success: false, message: "الشيت غير موجود." }; }
    var data = sh.getDataRange().getValues();
    var rowIndex = -1;
    var clientName = "";
    var roundBackupRaw = "";
    var restoreOcCode = "";
    for (var i = 1; i < data.length; i++) {
      var rowId = (data[i][0] || "").toString().trim();
      if (!rowId) continue;
      if (rowId === payId.toString().trim()) {
        rowIndex = i + 1;
        clientName = (data[i][2] || "").toString().trim();
        restoreOcCode = (data[i][1] || "").toString().trim();
        roundBackupRaw = (data[i][22] || "").toString().trim(); // col 23 = RoundMemberBackup
        break;
      }
    }
    if (rowIndex === -1) { lock.releaseLock(); return { success: false, message: "السجل غير موجود." }; }
    // Clear soft-delete columns
    sh.getRange(rowIndex, 20).setValue("");
    sh.getRange(rowIndex, 21).setValue("");
    sh.getRange(rowIndex, 22).setValue("");
    // ROUND-SYNC FIX (2026-07-04): mirror deleteClientPaymentRecord — if this payment's deletion had
    // also removed the client from their round, put them back so the round & payment counts stay in sync.
    var roundRestored = false;
    if (roundBackupRaw) {
      try { roundRestored = _restoreRoundMemberFromSnapshot(JSON.parse(roundBackupRaw)); } catch (parseErr) {}
      sh.getRange(rowIndex, 23).setValue(""); // clear the backup either way — one-shot restore
    }
    SpreadsheetApp.flush(); // commit writes before releasing lock
    lock.releaseLock();
    logActivity(adminId, "Admin", "RESTORE_PAYMENT", clientName);
    var _restoreAdminName = "Admin";
    try { var _u = getUsers(); for (var _ui = 0; _ui < _u.length; _ui++) { if (_u[_ui].id.toString().trim() === adminId.toString().trim()) { _restoreAdminName = _u[_ui].name; break; } } } catch (_ue) {}
    try { _appendClientHistory("", restoreOcCode, _histFmt("Restore Payment", _restoreAdminName, "اترجّع سجل القسط من سلة المحذوفات" + (roundRestored ? " + اترجّع للراوند" : ""))); } catch (he) {}
    var _rMsg = "✅ تم استرداد سجل " + clientName + " بنجاح." + (roundRestored ? " وتم إرجاعه للراوند كمان." : (roundBackupRaw ? " (تعذّر إرجاعه للراوند — الراوند لم يعد موجوداً)." : ""));
    invalidateClientPaymentsCache();
    return { success: true, message: _rMsg };
  } catch(e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// GET DELETED PAYMENTS (Recycle Bin)
// ==========================================
function getDeletedPayments(adminId) {
  if (!isUserAdminOrManager(adminId)) return [];
  try {
    var sh = getSheet("Client_Payments");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var deleted = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var isDeleted = data[i][19];
      if (isDeleted !== true && isDeleted !== "TRUE" && isDeleted !== "true" && isDeleted !== 1) continue;
      deleted.push({
        id: data[i][0].toString().trim(),
        clientName: data[i][2] || "",
        course: data[i][3] || "",
        total: data[i][6] || 0,
        paid: data[i][9] || 0,
        agentName: data[i][8] || "",
        status: data[i][12] || "",
        deletedBy: data[i][20] || "",
        deletedAt: data[i][21] ? safeFormatDate(data[i][21], tz, "yyyy-MM-dd HH:mm") : ""
      });
    }
    return deleted;
  } catch(e) {
    Logger.log("getDeletedPayments error: " + e.toString());
    return [];
  }
}

// ==========================================
// GET ARCHIVED CLIENTS (Recycle Bin — clients tab)
// ==========================================
function getArchivedClients(adminId) {
  if (!isUserAdminOrManager(adminId)) return [];
  try {
    var sh = getSheet("Raw_Data");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var archived = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var status = (data[i][7] || "").toString().trim();   // col H = Status
      var action = (data[i][10] || "").toString().trim();  // col K = Action
      if (status !== "Archived" && action !== "Archived") continue;
      // Extract archive date from notes (appended by archiveClientRecord)
      var notes = (data[i][8] || "").toString();
      var archivedAt = "";
      var matchDate = notes.match(/🗄️ مؤرشف بواسطة .+ \| ([^|]+)/);
      if (matchDate) archivedAt = matchDate[1].trim();
      archived.push({
        id: data[i][0].toString().trim(),
        name: data[i][2] || "",
        phone: data[i][3] || "",
        course: data[i][4] || "",
        agentName: data[i][6] || "",
        archivedAt: archivedAt
      });
    }
    return archived;
  } catch(e) {
    Logger.log("getArchivedClients error: " + e.toString());
    return [];
  }
}

// ==========================================
// ADMIN EDIT CLIENT RECORD
// ==========================================
function adminEditClientRecord(clientId, fields, adminId, adminName) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "عفواً، لا تملك الصلاحية لتعديل بيانات العملاء." };
  if (!clientId || clientId.toString().trim() === "") return { success: false, message: "معرّف العميل غير صالح." };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var msh = getSheet("Raw_Data");
    if (!msh) { lock.releaseLock(); return { success: false, message: "Raw_Data غير موجود." }; }
    var mdata = msh.getDataRange().getValues();
    var rowIndex = -1;
    var oldName = "", oldAgent = "", oldPhone = "";
    for (var j = 1; j < mdata.length; j++) {
      if (idsMatch(mdata[j][0], clientId)) {
        rowIndex = j + 1;
        oldName  = (mdata[j][2] || "").toString().trim();
        oldPhone = (mdata[j][3] || "").toString().trim();
        oldAgent = (mdata[j][6] || "").toString().trim();
        break;
      }
    }
    if (rowIndex === -1) { lock.releaseLock(); return { success: false, message: "العميل غير موجود في قاعدة البيانات." }; }

    // FIX-10 (S17b): collect any propagation failures so they can be surfaced additively
    // instead of being swallowed by the per-sheet empty catches (e3..e8) below.
    var _editSyncWarnings = [];

    var newName   = fields.name   !== undefined ? fields.name.toString().trim()   : oldName;
    var newPhone  = fields.phone  !== undefined ? forceTextPhone(fields.phone)    : oldPhone;
    // 2026-07-06: phone2 is now a SEPARATE field sent from the frontend (not glued onto `phone` with
    // " - " anymore — that was the exact bug pattern this whole change set fixes). Written to its own
    // dedicated column so it can never break duplicate-detection on the primary phone again.
    var newPhone2 = fields.phone2 !== undefined ? forceTextPhone(fields.phone2) : undefined;
    var newCourse = fields.course !== undefined ? fields.course.toString().trim()  : (mdata[rowIndex-1][5] || "").toString().trim();
    var newAgent  = fields.agent  !== undefined ? fields.agent.toString().trim()   : oldAgent;
    var newAction = fields.action !== undefined ? fields.action.toString().trim()  : "";
    var newNotes  = fields.notes  !== undefined ? fields.notes.toString().trim()   : "";
    var editReason = (fields.reason || "تعديل إداري").toString().trim();

    // Update Raw_Data
    if (newName && newName !== oldName) msh.getRange(rowIndex, 3).setValue(newName);
    if (newPhone && newPhone !== oldPhone) msh.getRange(rowIndex, 4).setValue(newPhone);
    if (newPhone2 !== undefined) { _ensureRawPhone2Header(msh); msh.getRange(rowIndex, RAW_PHONE2_COL).setValue(newPhone2); }
    if (newCourse) msh.getRange(rowIndex, 6).setValue(newCourse);
    if (newAgent)  msh.getRange(rowIndex, 7).setValue(newAgent);
    if (newAction) msh.getRange(rowIndex, 11).setValue(newAction); // col K (New Action)
    if (newNotes) {
      var existingNotes = (mdata[rowIndex-1][8] || "").toString().trim();
      var editNote = "[تعديل بواسطة " + adminName + " | " + nowStr() + " | السبب: " + editReason + "]\n" + (newNotes !== existingNotes ? newNotes : "");
      msh.getRange(rowIndex, 9).setValue(existingNotes ? existingNotes + "\n" + editNote : editNote);
    } else {
      // Always log the edit even without new notes
      var editLogNote = "[تعديل بواسطة " + adminName + " | " + nowStr() + " | السبب: " + editReason + "]";
      var existingN = (mdata[rowIndex-1][8] || "").toString().trim();
      msh.getRange(rowIndex, 9).setValue(existingN ? existingN + "\n" + editLogNote : editLogNote);
    }
    // Update LastModified
    var lastModCol = ensureLastModifiedColumn(msh);
    msh.getRange(rowIndex, lastModCol).setValue(new Date().toISOString());

    // Propagate name change to other sheets
    if (newName && newName !== oldName) {
      try {
        var lsh = getSheet("My_Leads");
        if (lsh) {
          var ldata = lsh.getDataRange().getValues();
          for (var li = 1; li < ldata.length; li++) {
            if (idsMatch(ldata[li][0], clientId)) lsh.getRange(li + 1, 3).setValue(newName);
          }
        }
      } catch(e3){ _editSyncWarnings.push("My_Leads name: " + e3.toString()); } // FIX-10 (S17b)
      try {
        var cpSh = getSheet("Client_Payments");
        if (cpSh) {
          var cpData = cpSh.getDataRange().getValues();
          var ocCode = (mdata[rowIndex-1][14] || "").toString().trim();
          for (var ci = 1; ci < cpData.length; ci++) {
            var cpOc = (cpData[ci][1] || "").toString().trim();
            if (ocEq(cpOc, ocCode) || idsMatch(cpData[ci][0], clientId)) { // FIX-07: ocKey-normalized OC join
              cpSh.getRange(ci + 1, 3).setValue(newName);
            }
          }
        }
      } catch(e4){ _editSyncWarnings.push("Client_Payments name: " + e4.toString()); } // FIX-10 (S17b)
      try {
        var rmSh = getSheet("Round_Members");
        if (rmSh) {
          var rmData = rmSh.getDataRange().getValues();
          var ocCode2 = (mdata[rowIndex-1][14] || "").toString().trim();
          for (var ri2 = 1; ri2 < rmData.length; ri2++) {
            if (ocEq(rmData[ri2][1], ocCode2)) rmSh.getRange(ri2+1, 3).setValue(newName); // FIX-07
          }
        }
      } catch(e5){ _editSyncWarnings.push("Round_Members name: " + e5.toString()); } // FIX-10 (S17b)
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = finSh.getDataRange().getValues();
          var ocCode3 = (mdata[rowIndex-1][14] || "").toString().trim();
          for (var fi = 1; fi < finData.length; fi++) {
            if (ocEq(finData[fi][6], ocCode3)) finSh.getRange(fi+1, 8).setValue(newName); // FIX-07
          }
        }
      } catch(e6){ _editSyncWarnings.push("Financial_Data name: " + e6.toString()); } // FIX-10 (S17b)
    }
    // Propagate phone to My_Leads
    if (newPhone && newPhone !== oldPhone) {
      try {
        var lsh2 = getSheet("My_Leads");
        if (lsh2) {
          var ldata2 = lsh2.getDataRange().getValues();
          for (var li2 = 1; li2 < ldata2.length; li2++) {
            if (idsMatch(ldata2[li2][0], clientId)) lsh2.getRange(li2 + 1, 4).setValue(newPhone);
          }
        }
      } catch(e7){ _editSyncWarnings.push("My_Leads phone: " + e7.toString()); } // FIX-10 (S17b)
    }
    // Propagate agent to My_Leads
    if (newAgent && newAgent !== oldAgent) {
      try {
        var lsh3 = getSheet("My_Leads");
        if (lsh3) {
          var ldata3 = lsh3.getDataRange().getValues();
          for (var li3 = 1; li3 < ldata3.length; li3++) {
            if (idsMatch(ldata3[li3][0], clientId)) lsh3.getRange(li3 + 1, 8).setValue(newAgent);
          }
        }
      } catch(e8){ _editSyncWarnings.push("My_Leads agent: " + e8.toString()); } // FIX-10 (S17b)
    }

    SpreadsheetApp.flush();
    lock.releaseLock();
    logActivity(adminId, adminName, "ADMIN_EDIT_CLIENT", "تعديل: " + (newName || oldName) + " | سبب: " + editReason);
    // FIX-10 (S17b): if any sheet propagation failed, surface it instead of claiming
    // "updated in all tables". Clean edits (no warnings) return the original response shape.
    var _editResult = { success: true, message: "✅ تم تعديل بيانات العميل بنجاح وتحديثها في جميع الجداول." };
    if (_editSyncWarnings.length) {
      _editResult.warnings = _editSyncWarnings;
      _editResult.message = "⚠️ تم تعديل بيانات العميل لكن تعذّر تحديث بعض الجداول: " + _editSyncWarnings.join(" | ");
    }
    return _editResult;
  } catch(e) {
    try { lock.releaseLock(); } catch(err){}
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ==========================================
// ARCHIVE CLIENT (Soft Delete for Raw_Data)
// ==========================================
function archiveClientRecord(clientId, adminId, adminName, reason) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "عفواً، لا تملك الصلاحية." };
  if (!clientId) return { success: false, message: "معرّف العميل غير صالح." };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sh = getSheet("Raw_Data");
    if (!sh) { lock.releaseLock(); return { success: false, message: "Raw_Data غير موجود." }; }
    var data = sh.getDataRange().getValues();
    var rowIndex = -1;
    var clientName = "";
    for (var j = 1; j < data.length; j++) {
      if (idsMatch(data[j][0], clientId)) { rowIndex = j + 1; clientName = data[j][2] || ""; break; }
    }
    if (rowIndex === -1) { lock.releaseLock(); return { success: false, message: "العميل غير موجود." }; }
    var archiveNote = "\n[🗄️ مؤرشف بواسطة " + adminName + " | " + nowStr() + (reason ? " | السبب: " + reason : "") + "]";
    var existingNotes = (data[rowIndex-1][8] || "").toString().trim();
    sh.getRange(rowIndex, 8).setValue("Archived");    // Status col H
    sh.getRange(rowIndex, 11).setValue("Archived");   // New Action col K
    sh.getRange(rowIndex, 9).setValue(existingNotes + archiveNote); // Notes col I
    var lastModCol = ensureLastModifiedColumn(sh);
    sh.getRange(rowIndex, lastModCol).setValue(new Date().toISOString());
    // Also update My_Leads status
    try {
      var lsh = getSheet("My_Leads");
      if (lsh) {
        var ldata = lsh.getDataRange().getValues();
        for (var li = 1; li < ldata.length; li++) {
          if (idsMatch(ldata[li][0], clientId)) {
            lsh.getRange(li+1, 9).setValue("Archived");
          }
        }
      }
    } catch(e2){}
    SpreadsheetApp.flush();
    lock.releaseLock();
    logActivity(adminId, adminName, "ARCHIVE_CLIENT", clientName + (reason ? " | " + reason : ""));
    return { success: true, message: "🗄️ تم أرشفة العميل " + clientName + ". يمكن استرداده من سجل الإدارة." };
  } catch(e) {
    try { lock.releaseLock(); } catch(err){}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// RESTORE ARCHIVED CLIENT
// ==========================================
function restoreClientRecord(clientId, adminId, adminName) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "عفواً، لا تملك الصلاحية." };
  if (!clientId) return { success: false, message: "معرّف العميل غير صالح." };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sh = getSheet("Raw_Data");
    if (!sh) { lock.releaseLock(); return { success: false, message: "Raw_Data غير موجود." }; }
    var data = sh.getDataRange().getValues();
    var rowIndex = -1;
    var clientName = "";
    for (var j = 1; j < data.length; j++) {
      if (idsMatch(data[j][0], clientId)) { rowIndex = j + 1; clientName = data[j][2] || ""; break; }
    }
    if (rowIndex === -1) { lock.releaseLock(); return { success: false, message: "العميل غير موجود." }; }
    sh.getRange(rowIndex, 8).setValue("Contacted");   // Status → Contacted
    sh.getRange(rowIndex, 11).setValue("No Answer");  // New Action → No Answer (neutral)
    var restoreNote = "\n[✅ تم الاسترداد بواسطة " + adminName + " | " + nowStr() + "]";
    var existingNotes = (data[rowIndex-1][8] || "").toString().trim();
    sh.getRange(rowIndex, 9).setValue(existingNotes + restoreNote);
    var lastModCol = ensureLastModifiedColumn(sh);
    sh.getRange(rowIndex, lastModCol).setValue(new Date().toISOString());
    try {
      var lsh = getSheet("My_Leads");
      if (lsh) {
        var ldata = lsh.getDataRange().getValues();
        for (var li = 1; li < ldata.length; li++) {
          if (idsMatch(ldata[li][0], clientId)) lsh.getRange(li+1, 9).setValue("Contacted");
        }
      }
    } catch(e2){}
    SpreadsheetApp.flush();
    lock.releaseLock();
    logActivity(adminId, adminName, "RESTORE_CLIENT", clientName);
    return { success: true, message: "✅ تم استرداد العميل " + clientName + " بنجاح." };
  } catch(e) {
    try { lock.releaseLock(); } catch(err){}
    return { success: false, message: e.toString() };
  }
}

// PARTIAL-RECEIVE + AUTO-RESCHEDULE (2026-07-06): the confirm flow used to accept only the FULL due
// amount, and never touched the next-due-date at all — an admin who genuinely received LESS than what
// was due (client paying part now, the rest on a later date) had no way to log that partial receipt or
// tell the system when to expect the remainder; the due-date just stayed stale. newDueDate is optional
// and ONLY applied when there's still a remaining balance after this receipt (rem > 0) — a full payoff
// needs no future due date.
function confirmInstallmentReceipt(payId, amount, agentId, agentName, newDueDate) {
  try {
    // Guard: payId must be a non-empty string to prevent accidental match on blank IDs
    var cleanPayId = (payId || "").toString().trim();
    if (!cleanPayId) return { success: false, message: "معرّف الدفعة غير صالح." };

    var lock = LockService.getScriptLock(); lock.waitLock(15000);
    var amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      lock.releaseLock();
      return { success: false, message: "المبلغ يجب أن يكون أكبر من الصفر" };
    }

    var sh = getSheet("Client_Payments");
    if (!sh) { lock.releaseLock(); return { success: false, message: "شيت Client_Payments غير موجود" }; }
    var data = sh.getDataRange().getValues();
    var totalRows = data.length - 1;
    for (var i = 1; i < data.length; i++) {
      var rowId = (data[i][0] || "").toString().trim();
      if (!rowId) continue; // skip rows with blank ID — never match on empty
      if (rowId === cleanPayId) {
        var clientName = (data[i][2] || "").toString().trim();
        var ocCode = (data[i][1] || "").toString().trim();
        if (ocCode === "—" || ocCode === "-" || ocCode.toLowerCase() === "null" || ocCode.toLowerCase() === "undefined") {
          ocCode = "";
        }
        var course = (data[i][3] || "").toString().trim();
        // Phone not stored in Client_Payments — look up from Raw_Data via OC code
        var phone = "";
        try {
          var rdSh = getSheet("Raw_Data");
          var rdData = rdSh.getDataRange().getValues();
          for (var ri = 1; ri < rdData.length; ri++) {
            if (ocEq(rdData[ri][14], ocCode)) { // FIX-07: ocKey-normalized OC join
              phone = (rdData[ri][3] || "").toString().trim();
              break;
            }
          }
        } catch(pe) {}
        var currentPaid = parseFloat(data[i][9]) || 0;
        var totalVal = parseFloat(data[i][6]) || 0;

        // ── Anti-doubling guard: reject if already fully paid ──────────────
        if (totalVal > 0 && currentPaid >= totalVal) {
          lock.releaseLock();
          return { success: false, message: "⚠️ هذا العميل مسجّل كـ خالص بالفعل — الإجمالي: " + totalVal.toLocaleString() + " EGP، المحصّل: " + currentPaid.toLocaleString() + " EGP. لا داعي لتأكيد مرة أخرى." };
        }
        // Cap the amount so it never exceeds remaining balance
        var remaining0 = Math.max(0, totalVal - currentPaid);
        if (amt > remaining0 && remaining0 > 0) {
          amt = remaining0; // trim the amount to exactly what's left
        }

        var newPaid = currentPaid + amt;
        var rem = totalVal - newPaid;
        if (rem < 0) rem = 0;

        sh.getRange(i + 1, 10).setValue(newPaid); // paid
        sh.getRange(i + 1, 11).setValue(rem); // remaining
        sh.getRange(i + 1, 13).setValue(rem <= 0 ? "Paid" : "Installment"); // status
        var dueDateUpdated = false;
        if (rem > 0 && newDueDate) {
          try {
            var _ndd = new Date(newDueDate);
            if (!isNaN(_ndd.getTime())) { sh.getRange(i + 1, 12).setValue(_ndd); dueDateUpdated = true; }
          } catch (nde) {}
        }
        // NO intermediate flush — batch all writes, single flush at end

        // Append payment transaction
        try {
          var txSheet = getSheet("Payment_Transactions");
          if (txSheet) {
            txSheet.appendRow([genId(), payId, clientName, amt, new Date(), "قسط مؤكد", agentId, agentName, "Cash"]);
          }
        } catch(txErr) { Logger.log("Payment_Transactions append error: " + txErr.toString()); }

        // Read Financial_Data ONCE — reused for month lookup + row update
        var _finShared = null, _finDataShared = null;
        try { _finShared = getSheet("Financial_Data"); if (_finShared) _finDataShared = _finShared.getDataRange().getValues(); } catch(_fce) {}

        // Financial sync rule: same month vs older month
        // الاستراتيجية: ابحث في Financial_Data أولاً عن أقدم "client" row بنفس الـ OC code
        // (الأكثر موثوقية من قراءة column index من Client_Payments)
        // لو ملقتيش → fallback لـ Client_Payments[14] → لو فاضي كمان → الشهر الحالي
        var createdMonth = new Date().getMonth() + 1;
        var createdYear  = new Date().getFullYear();
        var createdFoundInFin = false;

        if (ocCode) {
          try {
            var finShLookup = _finShared;
            if (finShLookup) {
              var finLookupData = _finDataShared;
              var foundM = 0, foundY = 0;
              for (var fl = 1; fl < finLookupData.length; fl++) {
                var flType = (finLookupData[fl][4] || "").toString().trim().toLowerCase();
                var flOc   = (finLookupData[fl][6] || "").toString().trim();
                var flM    = parseInt(finLookupData[fl][2]);
                var flY    = parseInt(finLookupData[fl][3]);
                if (flType !== "client" || flOc !== ocCode) continue;
                if (isNaN(flM) || isNaN(flY)) continue;
                // خذ الأقدم شهر/سنة = تاريخ تسجيل العميل الأصلي
                if (foundY === 0 || flY < foundY || (flY === foundY && flM < foundM)) {
                  foundM = flM;
                  foundY = flY;
                }
              }
              if (foundY > 0) {
                createdMonth = foundM;
                createdYear  = foundY;
                createdFoundInFin = true;
                Logger.log("createdMonth from Financial_Data: " + foundM + "/" + foundY + " OC=" + ocCode);
              }
            }
          } catch(fe) { Logger.log("Financial_Data createdMonth lookup error: " + fe.toString()); }
        }

        // Fallback: لو Financial_Data مردتش نتيجة → جرب Client_Payments[14]
        if (!createdFoundInFin) {
          var createdAtVal = data[i][14];
          if (createdAtVal) {
            var createdDate = new Date(createdAtVal);
            if (!isNaN(createdDate.getTime())) {
              createdMonth = createdDate.getMonth() + 1;
              createdYear  = createdDate.getFullYear();
              Logger.log("createdMonth from Client_Payments[14]: " + createdMonth + "/" + createdYear);
            }
          }
        }

        var today = new Date();
        var currentMonth = today.getMonth() + 1;
        var currentYear = today.getFullYear();

        var syncSuccess = false;
        var syncMsg = "";

        // ─── دايماً اعزب القسط للوكيل المسؤول عن العميل ───────────
        // مش اللي ضغط الزرار (ممكن يكون مدير أو أوبريشن)
        // data[i][7] = Agent_ID    (col H في Client_Payments)
        // data[i][8] = Agent_Name  (col I في Client_Payments)
        // Fallback: لو العميل مسجّلش وكيل خد اللي ضغط
        var clientAgentId   = (data[i][7] || "").toString().trim() || agentId;
        var clientAgentName = (data[i][8] || "").toString().trim() || agentName;

        // Helper: find a "client" row in Financial_Data by OC code OR name match.
        // Returns { idx, strategy } or { idx: -1 }.
        // Strategies (in order of priority):
        //   1. OC exact match + exact month/year
        //   2. Name match + exact month/year
        //   3. OC exact match in ANY month/year (picks row closest to targetMonth/targetYear)
        //   4. Name match in ANY month/year (picks closest row)
        var _findFinClientRow = function(finData, targetMonth, targetYear, ocCodeVal, nameVal) {
          var cleanName = (nameVal || "").toString().trim().toLowerCase();
          var cleanOc   = (ocCodeVal || "").toString().trim();

          var bestIdxOc   = -1, bestDistOc   = 9999;
          var bestIdxName = -1, bestDistName = 9999;

          for (var f = 1; f < finData.length; f++) {
            var fType = (finData[f][4] || "").toString().trim().toLowerCase();
            if (fType !== "client") continue;

            var fM  = parseInt(finData[f][2]);
            var fY  = parseInt(finData[f][3]);
            var fOc = (finData[f][6] || "").toString().trim();
            var fN  = (finData[f][7] || "").toString().trim().toLowerCase();
            if (isNaN(fM) || isNaN(fY)) continue;

            var exactMonth = (fM === targetMonth && fY === targetYear);
            var dist = Math.abs((fY - targetYear) * 12 + (fM - targetMonth));

            var ocMatch   = ocEq(fOc, cleanOc); // FIX-07: ocKey-normalized OC join
            var nameMatch = cleanName && fN === cleanName;
            var ocEmptyRow = !fOc || fOc === "—" || fOc === "-";

            // Strategy 1 & 3: OC match (exact month preferred, else closest)
            if (ocMatch) {
              if (exactMonth) return f;   // strategy 1 — immediate return
              if (dist < bestDistOc) { bestDistOc = dist; bestIdxOc = f; }
            }
            // Strategy 2 & 4: Name match (OC code absent in row or no OC given)
            if (nameMatch && (ocEmptyRow || !cleanOc)) {
              if (exactMonth) {
                // strategy 2 — prefer over cross-month name match
                if (bestIdxOc === -1) return f;  // only if no OC match exists
              }
              if (dist < bestDistName) { bestDistName = dist; bestIdxName = f; }
            }
          }

          // Return best OC cross-month match before best name cross-month match
          if (bestIdxOc !== -1)   return bestIdxOc;
          if (bestIdxName !== -1) return bestIdxName;
          return -1;
        };

        if (createdMonth === currentMonth && createdYear === currentYear) {
          // Sync Rule 1: Same month — find client row and increment Paid field
          var finSh = _finShared;
          if (finSh) {
            var finData = _finDataShared || [];
            var rowMatched = _findFinClientRow(finData, currentMonth, currentYear, ocCode, clientName);

            if (rowMatched !== -1) {
              var fCurrentPaid = parseFloat(finData[rowMatched][15]) || 0; // index 15 = Column 16 (Paid)
              finSh.getRange(rowMatched + 1, 16).setValue(fCurrentPaid + amt);
              syncSuccess = true;
              syncMsg = "تحديث عميل نفس الشهر";
            } else {
              // استخدم وكيل العميل الأصلي (مش اللي ضغط الزرار)
              addFinancialPayment(clientAgentId, clientAgentName, currentMonth, currentYear, {
                ocCode: ocCode,
                name: clientName,
                phone: phone,
                date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
                amount: amt
              });
              syncSuccess = true;
              syncMsg = "تحديث كقسط (عميل غير موجود في Financial_Data للشهر الحالي)";
            }
          }
        } else {
          // Sync Rule 2: Older month — add payment row to current month AND update old month Paid field
          // clientAgentId/Name = وكيل العميل الأصلي دايماً (مش اللي دوس الزرار)
          addFinancialPayment(clientAgentId, clientAgentName, currentMonth, currentYear, {
            ocCode: ocCode,
            name: clientName,
            phone: phone,
            date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
            amount: amt
          });

          // Update the client's original month Paid so old month commissions show correct numbers
          var oldMonthUpdated = false;
          try {
            var finSh2 = _finShared;
            if (finSh2) {
              var finData2 = _finDataShared || [];
              var oldRowMatch = _findFinClientRow(finData2, createdMonth, createdYear, ocCode, clientName);
              if (oldRowMatch !== -1) {
                var oldPaid = parseFloat(finData2[oldRowMatch][15]) || 0;
                finSh2.getRange(oldRowMatch + 1, 16).setValue(oldPaid + amt);
                oldMonthUpdated = true;
                Logger.log("Old month Financial_Data updated: row " + (oldRowMatch+1) + " → Paid=" + (oldPaid+amt));
              } else {
                Logger.log("Old month Financial_Data NOT found: month=" + createdMonth + " year=" + createdYear + " OC=" + ocCode + " name=" + clientName);
              }
            }
          } catch (e) { Logger.log("Old month Financial_Data update error: " + e.toString()); }

          syncSuccess = true;
          var monthNames = ["","يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
          var curMonthName = monthNames[currentMonth] || currentMonth;
          syncMsg = oldMonthUpdated
            ? "تم ترحيل القسط كـ 'قسط من شهر سابق' في " + curMonthName + " " + currentYear + " ✔️ وتحديث سجل شهر " + createdMonth + "/" + createdYear
            : "تم ترحيل القسط كـ 'قسط من شهر سابق' في " + curMonthName + " " + currentYear + " ✔️ (سجل الشهر الأصلي " + createdMonth + "/" + createdYear + " مش موجود في Financial_Data)";
        }

        SpreadsheetApp.flush(); // single flush — commits all writes at once
        lock.releaseLock();
        logActivity(agentId, agentName, "CONFIRM_INSTALLMENT", payId + " - " + amt + " EGP (" + syncMsg + ")");
        try {
          syncClientPaymentToLedger(payId);
        } catch (ledgerErr) { }
        var _confirmMsg = "✅ تم استلام وتأكيد القسط بنجاح! [" + clientName + "]\n" + syncMsg;
        if (dueDateUpdated) _confirmMsg += "\n📅 اتسجّل الباقي (" + rem.toLocaleString() + " ج.م) مستحق بتاريخ " + Utilities.formatDate(new Date(newDueDate), Session.getScriptTimeZone(), "yyyy-MM-dd");
        return { success: true, message: _confirmMsg, remaining: rem, dueDateUpdated: dueDateUpdated };
      }
    }

    lock.releaseLock();
    return { success: false, message: "السجل غير موجود — تم البحث في " + totalRows + " صف، payId المطلوب: [" + cleanPayId + "]" };
  } catch (e) {
    try { lock.releaseLock(); } catch (err) { }
    return { success: false, message: "خطأ داخلي: " + e.toString() };
  }
}

function confirmInstallmentWithWallet(payId, amount, agentId, agentName, walletName, newDueDate) {
  var result = confirmInstallmentReceipt(payId, amount, agentId, agentName, newDueDate);
  if (result && result.success && walletName) {
    try {
      var walletsRes = getWallets(agentId);
      if (walletsRes && walletsRes.success) {
        var wallet = null;
        for (var w = 0; w < walletsRes.wallets.length; w++) {
          if (walletsRes.wallets[w].name === walletName) { wallet = walletsRes.wallets[w]; break; }
        }
        if (wallet) {
          var newBal = wallet.balance + (parseFloat(amount) || 0);
          setWalletBalance(agentId, walletName, newBal);
          var sh = _getOrCreateWalletIncomeSheet();
          sh.appendRow(['INC-'+new Date().getTime(), new Date(), 'أقساط عملاء', 'قسط عميل — Pay#'+payId, parseFloat(amount)||0, walletName, 'كاش', agentName||agentId, '', new Date()]);
        }
      }
    } catch(we) { Logger.log('wallet credit error: ' + we.toString()); }
  }
  return result;
}

function rejectInstallmentReceipt(payId, reason, agentId, agentName) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    var sh = getSheet("Client_Payments"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === payId.toString()) {
        var oldNotes = data[i][13] || "";
        // Clean out old accountant rejections first to prevent compounding rejections
        var cleanNotes = oldNotes.toString().replace(/\[تنبيه محاسب - خطأ\]: [^\n]+/g, "").trim();
        var alertMsg = "[تنبيه محاسب - خطأ]: " + reason;
        var newNotes = cleanNotes ? alertMsg + "\n" + cleanNotes : alertMsg;

        sh.getRange(i + 1, 14).setValue(newNotes);

        lock.releaseLock();
        logActivity(agentId, agentName, "REJECT_INSTALLMENT", payId + " - Reason: " + reason);
        return { success: true, message: "✅ تم تسجيل تنبيه الرفض بنجاح" };
      }
    }
    lock.releaseLock();
    return { success: false, message: "السجل غير موجود" };
  } catch (e) {
    try { lock.releaseLock(); } catch (err) { }
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// ROUNDS
// ==========================================
// PERF FIX (2026-07-06): the original loop called Range.setValue() ONE ROW AT A TIME for every
// mismatched round — each call is its own synchronous Sheets API round-trip, so N mismatched
// rounds meant N sequential round-trips. This runs on every getRounds() cache miss (every 2
// minutes), which is exactly why opening "Client Payments" felt heavy — it chains getClientPayments
// then getRounds, and a cold getRounds could be stuck here for seconds. Now builds the full
// "Enrolled" column in memory and writes it in ONE setValues() call — same final values, one
// round-trip instead of many. Untouched rounds keep their existing value, so the resulting sheet
// content is byte-for-byte identical to before; only the number of API calls changed.
function recalculateRoundsEnrolled() {
  try {
    var roundSh = getSheet("Rounds");
    var memberSh = getSheet("Round_Members");
    if (!roundSh || !memberSh) return;

    var roundsData = roundSh.getDataRange().getValues();
    var membersData = memberSh.getDataRange().getValues();
    if (roundsData.length < 2) return;

    var counts = {};
    for (var j = 1; j < membersData.length; j++) {
      var rId = (membersData[j][0] || "").toString().trim();
      if (rId) {
        counts[rId] = (counts[rId] || 0) + 1;
      }
    }

    var newCol = [];
    var changed = false;
    for (var i = 1; i < roundsData.length; i++) {
      var roundId = (roundsData[i][0] || "").toString().trim();
      var currentEnrolled = parseInt(roundsData[i][5]) || 0;
      if (!roundId) { newCol.push([roundsData[i][5]]); continue; }
      var actualEnrolled = counts[roundId] || 0;
      if (actualEnrolled !== currentEnrolled) changed = true;
      newCol.push([actualEnrolled]);
    }
    if (changed) {
      roundSh.getRange(2, 6, newCol.length, 1).setValues(newCol);
    }
  } catch (e) { }
}

function getRounds() {
  // Check cache FIRST — skip the expensive recalculate if data is fresh
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('bsa_rounds');
    if (cached) {
      try { return JSON.parse(cached); } catch(ce) {}
    }
  } catch(ce) {}
  // Cache miss: recalculate enrolled counts then read sheet
  try { recalculateRoundsEnrolled(); } catch (e) { }
  var sh = getSheet("Rounds");
  if (!sh) return [];
  var data = sh.getDataRange().getValues(), rounds = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    if ((data[i][6] || "").toString() === "Deleted") continue; // skip soft-deleted rounds
    rounds.push({
      id: data[i][0].toString(),
      name: data[i][1] || "",
      startDate: data[i][2] ? safeFormatDate(data[i][2], Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
      schedule: data[i][3] || "",
      maxSeats: data[i][4] || 15,
      enrolled: data[i][5] || 0,
      status: data[i][6] || "Active",
      type: data[i][8] || "Online",
      instructor: (data[i][9] || "").toString(),
      // PROMO OFFER (2026-07-06): cols 11/12 (index 10/11) — appended at the END of the sheet so
      // existing column-index reads elsewhere are completely unaffected. Lets an admin flag a round
      // with a special price so sales can screenshot it for a client.
      offerPrice:  parseFloat(data[i][10]) || 0,
      offerExpiry: data[i][11] ? safeFormatDate(data[i][11], Session.getScriptTimeZone(), "yyyy-MM-dd") : ""
    });
  }
  try { CacheService.getScriptCache().put('bsa_rounds', JSON.stringify(rounds), 120); } catch(ce) {}
  return rounds;
}

// Sets (or clears, by passing 0/"") a promotional offer price on a round — shown prominently on the
// round card so sales can screenshot it for a client. adminId is required (Manager/Operation only).
function setRoundOffer(roundId, offerPrice, offerExpiry, adminId) {
  // 2026-07-06: restricted to Manager/Admin only (NOT Operation) per explicit user request — see
  // isUserManagerOnly() note above.
  if (!isUserManagerOnly(adminId)) return { success: false, message: "غير مصرح." };
  try {
    var sh = getSheet("Rounds");
    if (!sh) return { success: false, message: "شيت الروندات غير موجود." };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString()) {
        sh.getRange(i + 1, 11).setValue(parseFloat(offerPrice) || 0);
        sh.getRange(i + 1, 12).setValue(offerExpiry ? new Date(offerExpiry) : "");
        invalidateRoundsCache();
        var price = parseFloat(offerPrice) || 0;
        return { success: true, message: price > 0 ? "✅ اتسجّل العرض بسعر " + price.toLocaleString() + " ج.م" : "✅ اتشال العرض من الراوند ده" };
      }
    }
    return { success: false, message: "الراوند مش موجود." };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function invalidateRoundsCache() {
  try { CacheService.getScriptCache().remove('bsa_rounds'); } catch(e) {}
}

function addRound(name, startDate, schedule, maxSeats, type, status, instructor) {
  try {
    // Collision-safe Round ID
    var roundSh = getSheet("Rounds");
    var roundData = roundSh ? roundSh.getDataRange().getValues() : [[]];
    var existingRoundIds = buildIdSet(roundData, 0, -1);
    var newId = safeGenId(existingRoundIds);
    roundSh.appendRow([newId, name, new Date(startDate), schedule, maxSeats || 15, 0, status || "Active", new Date(), type || "Online", (instructor || "").toString().trim()]);
    invalidateRoundsCache();
    // Auto-create lecturer salary card if instructor is provided
    var inst = (instructor || "").toString().trim();
    if (inst) {
      try {
        var salSh = getOrCreateSalarySheet();
        salSh.appendRow([genId(), newId, name, type || "Online", inst, "", "pending", "", "", "pending", "", false, false, "", new Date()]);
      } catch(se) { Logger.log("Salary auto-create error: " + se.toString()); }
    }
    return { success: true, message: "✅ تم إنشاء الراوند بنجاح" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ──────────────────────────────────────────────────────────────────
// LECTURER SALARIES SYSTEM
// ──────────────────────────────────────────────────────────────────
function getOrCreateSalarySheet() {
  var sh = getSheet("Lecturer_Salaries"); // uses cached master spreadsheet
  if (!sh) {
    sh = getMaster().insertSheet("Lecturer_Salaries");
    sh.appendRow(["ID","Round_ID","Round_Name","Round_Type","Instructor_Name",
                  "Pay1_Amount","Pay1_Status","Pay1_PaidDate",
                  "Pay2_Amount","Pay2_Status","Pay2_PaidDate",
                  "Alert1_Triggered","Alert2_Triggered","Notes","CreatedAt"]);
    sh.getRange(1,1,1,15).setBackground("#2d1b4e").setFontColor("#fff").setFontWeight("bold");
  }
  return sh;
}

function getLecturerSalaries() {
  try {
    var sh = getOrCreateSalarySheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var a1 = data[i][11], a2 = data[i][12];
      result.push({
        id:         data[i][0].toString(),
        roundId:    (data[i][1] || "").toString(),
        roundName:  (data[i][2] || "").toString(),
        roundType:  (data[i][3] || "Online").toString(),
        instructor: (data[i][4] || "").toString(),
        pay1Amount: (data[i][5] || "").toString(),
        pay1Status: (data[i][6] || "pending").toString(),
        pay1Date:   data[i][7]  ? safeFormatDate(data[i][7],  tz, "yyyy-MM-dd") : "",
        pay2Amount: (data[i][8] || "").toString(),
        pay2Status: (data[i][9] || "pending").toString(),
        pay2Date:   data[i][10] ? safeFormatDate(data[i][10], tz, "yyyy-MM-dd") : "",
        alert1:     (a1 === true || a1 === "true" || a1 === "TRUE"),
        alert2:     (a2 === true || a2 === "true" || a2 === "TRUE"),
        notes:      (data[i][13] || "").toString(),
        createdAt:  data[i][14] ? safeFormatDate(data[i][14], tz, "yyyy-MM-dd") : ""
      });
    }
    return result;
  } catch(e) { return []; }
}

function updateLecturerSalaryPayment(data) {
  try {
    var sh = getOrCreateSalarySheet();
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if ((rows[i][0] || "").toString() !== data.id.toString()) continue;
      if (data.instructor  !== undefined) sh.getRange(i+1,  5).setValue(data.instructor);
      if (data.pay1Amount  !== undefined) sh.getRange(i+1,  6).setValue(data.pay1Amount);
      if (data.pay1Status  !== undefined) sh.getRange(i+1,  7).setValue(data.pay1Status);
      if (data.pay1Date    !== undefined && data.pay1Date)   sh.getRange(i+1,  8).setValue(new Date(data.pay1Date));
      else if (data.pay1Date === "")     sh.getRange(i+1,  8).setValue("");
      if (data.pay2Amount  !== undefined) sh.getRange(i+1,  9).setValue(data.pay2Amount);
      if (data.pay2Status  !== undefined) sh.getRange(i+1, 10).setValue(data.pay2Status);
      if (data.pay2Date    !== undefined && data.pay2Date)   sh.getRange(i+1, 11).setValue(new Date(data.pay2Date));
      else if (data.pay2Date === "")     sh.getRange(i+1, 11).setValue("");
      if (data.clearAlert1 === true)     sh.getRange(i+1, 12).setValue(false);
      if (data.clearAlert2 === true)     sh.getRange(i+1, 13).setValue(false);
      if (data.notes       !== undefined) sh.getRange(i+1, 14).setValue(data.notes);
      return { success: true };
    }
    return { success: false, message: "السجل غير موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function deleteLecturerSalary(id) {
  try {
    var sh = getOrCreateSalarySheet();
    var rows = sh.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if ((rows[i][0] || "").toString() === id.toString()) {
        sh.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: "السجل غير موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function addLecturerSalaryManual(data) {
  try {
    var sh = getOrCreateSalarySheet();
    var p1 = (data.pay1Amount !== undefined && data.pay1Amount !== '') ? data.pay1Amount : "";
    var p2 = (data.pay2Amount !== undefined && data.pay2Amount !== '') ? data.pay2Amount : "";
    sh.appendRow([genId(), data.roundId || "", data.roundName || "", data.roundType || "Online",
                  data.instructor || "", p1, "pending", "", p2, "pending", "",
                  false, false, data.notes || "", new Date()]);
    return { success: true };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getCurrentLectureNumForRound(roundId) {
  try {
    var masterSS = getMaster(); // use cached connection
    var sh = masterSS.getSheetByName("Rounds_Attendance");
    if (!sh) return 0;
    var data = sh.getDataRange().getValues();
    var maxLec = 0;
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() !== roundId.toString()) continue;
      var attended = (data[i][3] || "").toString().split(",").filter(Boolean);
      for (var j = 0; j < attended.length; j++) {
        var n = parseInt(attended[j]);
        if (!isNaN(n) && n > maxLec) maxLec = n;
      }
    }
    return maxLec;
  } catch(e) { return 0; }
}

function checkSalaryAlertForRound(roundId) {
  try {
    var currentLec = getCurrentLectureNumForRound(roundId);
    if (currentLec === 0) return null;

    // Get round info
    var roundType = "Online", roundName = "";
    try {
      var rdData = getSheet("Rounds").getDataRange().getValues();
      for (var r = 1; r < rdData.length; r++) {
        if ((rdData[r][0] || "").toString() === roundId.toString()) {
          roundType = (rdData[r][8] || "Online").toString();
          roundName = (rdData[r][1] || "").toString();
          break;
        }
      }
    } catch(e) {}

    // Thresholds: notify 1 lecture BEFORE payment lecture
    // Offline(10): pay at lec 5 & 10 → alert at 4 & 9
    // Online(12):  pay at lec 6 & 12 → alert at 5 & 11
    var isOffline   = (roundType.toLowerCase().indexOf("offline") !== -1);
    var alert1Lec   = isOffline ? 4 : 5;
    var alert2Lec   = isOffline ? 9 : 11;
    var payLec1     = isOffline ? 5 : 6;
    var payLec2     = isOffline ? 10 : 12;
    var paymentNum  = (currentLec === alert1Lec) ? 1 : (currentLec === alert2Lec) ? 2 : 0;
    if (!paymentNum) return null;

    // Check Lecturer_Salaries
    try {
      var salSh = getOrCreateSalarySheet();
      var salData = salSh.getDataRange().getValues();
      for (var s = 1; s < salData.length; s++) {
        if ((salData[s][1] || "").toString() !== roundId.toString()) continue;
        var alertColIdx = (paymentNum === 1) ? 11 : 12; // 0-based → col12 / col13
        var alreadyDone = salData[s][alertColIdx];
        if (alreadyDone === true || alreadyDone === "true" || alreadyDone === "TRUE") return null;
        // Mark triggered
        salSh.getRange(s + 1, alertColIdx + 1).setValue(true);
        return {
          roundId:    roundId,
          roundName:  (salData[s][2] || roundName).toString(),
          instructor: (salData[s][4] || "").toString(),
          paymentNum: paymentNum,
          currentLec: currentLec,
          nextPayLec: (paymentNum === 1) ? payLec1 : payLec2,
          pay1Amount: (salData[s][5] || "").toString(),
          pay2Amount: (salData[s][8] || "").toString(),
          salaryId:   salData[s][0].toString()
        };
      }
    } catch(se) { Logger.log("Salary alert error: " + se.toString()); }
    return null;
  } catch(e) { return null; }
}

function deleteRound(roundId, adminId, adminName) {
  try {
    var sh = getSheet("Rounds"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString()) {
        var now = new Date();
        var deletedBy = adminName || adminId || "Unknown";
        sh.getRange(i + 1, 7).setValue("Deleted");     // col G = Status
        sh.getRange(i + 1, 11).setValue(deletedBy);    // col K = Deleted_By
        sh.getRange(i + 1, 12).setValue(now);          // col L = Deleted_At
        SpreadsheetApp.flush();
        invalidateRoundsCache();
        return { success: true };
      }
    }
    return { success: false, message: "الراوند غير موجودة" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function getDeletedRounds(adminId) {
  try {
    var sh = getSheet("Rounds");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var status = (data[i][6] || "").toString();
      if (status !== "Deleted") continue;
      var deletedAt = "";
      try {
        if (data[i][11]) deletedAt = safeFormatDate(data[i][11], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
      } catch(fe) {}
      result.push({
        id: data[i][0].toString(),
        name: (data[i][1] || "").toString(),
        startDate: data[i][2] ? safeFormatDate(data[i][2], Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        type: (data[i][8] || "Online").toString(),
        instructor: (data[i][9] || "").toString(),
        deletedBy: (data[i][10] || "").toString(),
        deletedAt: deletedAt
      });
    }
    return result;
  } catch(e) { return []; }
}

function restoreRound(roundId, adminId, adminName) {
  try {
    var sh = getSheet("Rounds");
    if (!sh) return { success: false, message: "شيت Rounds مش موجود" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString()) {
        sh.getRange(i + 1, 7).setValue("Active");  // Restore status
        sh.getRange(i + 1, 11).setValue("");        // Clear Deleted_By
        sh.getRange(i + 1, 12).setValue("");        // Clear Deleted_At
        SpreadsheetApp.flush();
        invalidateRoundsCache();
        return { success: true };
      }
    }
    return { success: false, message: "الراوند غير موجودة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function updateRound(roundId, name, startDate, schedule, maxSeats, status, type, instructor) {
  try {
    var sh = getSheet("Rounds"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString()) {
        sh.getRange(i + 1, 2).setValue(name);
        sh.getRange(i + 1, 3).setValue(new Date(startDate));
        sh.getRange(i + 1, 4).setValue(schedule);
        sh.getRange(i + 1, 5).setValue(parseInt(maxSeats) || 15);
        sh.getRange(i + 1, 7).setValue(status || "Active");
        sh.getRange(i + 1, 9).setValue(type || "Online");
        if (instructor !== undefined) sh.getRange(i + 1, 10).setValue((instructor || "").toString().trim());

        // Update roundName in Client_Payments
        try {
          var cpSh = getSheet("Client_Payments");
          if (cpSh) {
            var cpData = cpSh.getDataRange().getValues();
            for (var cp = 1; cp < cpData.length; cp++) {
              if ((cpData[cp][4] || "").toString() === roundId.toString()) {
                cpSh.getRange(cp + 1, 6).setValue(name);
              }
            }
          }
        } catch(e) {}

        // Update in Lecturer_Salaries
        try {
          var salSh = getOrCreateSalarySheet();
          var salData = salSh.getDataRange().getValues();
          var found = false;
          for (var s = 1; s < salData.length; s++) {
            if ((salData[s][1] || "").toString() === roundId.toString()) {
              salSh.getRange(s + 1, 3).setValue(name);
              salSh.getRange(s + 1, 4).setValue(type || "Online");
              if (instructor !== undefined) salSh.getRange(s + 1, 5).setValue((instructor || "").toString().trim());
              found = true;
              break;
            }
          }
          // If not found and instructor provided, create entry
          var inst = (instructor || "").toString().trim();
          if (!found && inst) {
            salSh.appendRow([genId(), roundId, name, type || "Online", inst,
                             "", "pending", "", "", "pending", "", false, false, "", new Date()]);
          }
        } catch(se) { Logger.log("Salary sync error: " + se.toString()); }

        invalidateRoundsCache();
        return { success: true, message: "✅ تم تعديل الراوند بنجاح" };
      }
    }
    return { success: false, message: "الراوند غير موجودة" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function updateClientBookingStatus(payId, newState, targetRoundId, expectedLastModified, performedById, performedByName) {
  var _histAgent = performedByName || "Admin";
  _requestCache = {}; // reset cache for this request
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var cpSh = getSheet("Client_Payments");
    if (!cpSh) return { success: false, message: "شيت المدفوعات غير موجود" };
    var lastModCol = ensureLastModifiedColumn(cpSh);
    var cpData = getSheetDataCached("Client_Payments");
    var cpRowIdx = -1;
    for (var i = 1; i < cpData.length; i++) {
      if (cpData[i][0].toString() === payId.toString()) {
        cpRowIdx = i + 1;
        break;
      }
    }
    if (cpRowIdx === -1) return { success: false, message: "لم يتم العثور على سجل الدفع للعميل" };

    // CHECK Row Versioning CONFLICT
    var currentModified = cpData[cpRowIdx - 1][lastModCol - 1] || "";
    if (expectedLastModified && currentModified && currentModified.toString() !== expectedLastModified.toString()) {
      lock.releaseLock();
      return { success: false, message: "⚠️ عذراً، تم تعديل بيانات هذا الحجز بواسطة مستخدم آخر في نفس الوقت. يرجى تحديث الصفحة والمحاولة مرة أخرى." };
    }
    
    var ocCode = (cpData[cpRowIdx - 1][1] || "").toString().trim();
    if (ocCode === "—" || ocCode === "-" || ocCode.toLowerCase() === "null" || ocCode.toLowerCase() === "undefined") {
      ocCode = "";
    }
    // If ocCode is a numeric ID (not OC-), resolve it from Raw_Data column O
    if (ocCode && ocCode.toLowerCase().indexOf("oc-") !== 0) {
      var numericId = ocCode;
      try {
        var rawShTmp = getSheet("Raw_Data");
        if (rawShTmp) {
          var rawDataTmp = rawShTmp.getDataRange().getValues();
          for (var rr = 1; rr < rawDataTmp.length; rr++) {
            var rrId = (rawDataTmp[rr][0] || "").toString().trim();
            if (rrId === numericId) {
              var rrOc = (rawDataTmp[rr][14] || "").toString().trim();
              if (rrOc && rrOc.toLowerCase().indexOf("oc-") === 0) {
                ocCode = rrOc;
                // Fix the corrupted Client_Payments record
                cpSh.getRange(cpRowIdx, 2).setValue(ocCode);
              }
              break;
            }
          }
        }
      } catch(e) {}
    }
    var clientName = cpData[cpRowIdx - 1][2];
    var course = cpData[cpRowIdx - 1][3];
    var oldRoundId = cpData[cpRowIdx - 1][4];
    var oldRoundName = cpData[cpRowIdx - 1][5];
    var totalPrice = parseFloat(cpData[cpRowIdx - 1][6]) || 0;
    var agentId = cpData[cpRowIdx - 1][7];
    var agentName = cpData[cpRowIdx - 1][8];
    var paidAmount = parseFloat(cpData[cpRowIdx - 1][9]) || 0;
    var remainingAmount = parseFloat(cpData[cpRowIdx - 1][10]) || 0;
    var nextDue = cpData[cpRowIdx - 1][11];
    var method = cpData[cpRowIdx - 1][12];
    
    // Get phone number from Raw_Data or Round_Members
    var phone = "";
    var rawSh = getSheet("Raw_Data");
    if (rawSh) {
      var rawData = getSheetDataCached("Raw_Data");
      var cleanTargetOc = (ocCode || "").toString().trim().toUpperCase();
      for (var r = 1; r < rawData.length; r++) {
        var rOcO = (rawData[r][14] || "").toString().trim().toUpperCase(); // Column O
        var rOcN = (rawData[r][13] || "").toString().trim().toUpperCase(); // Column N
        var rOcM = (rawData[r][12] || "").toString().trim().toUpperCase(); // Column M (legacy)
        var rOc = (rOcO && rOcO.indexOf("OC-") === 0) ? rOcO :
                  (rOcN && rOcN.indexOf("OC-") === 0) ? rOcN :
                  (rOcM && rOcM.indexOf("OC-") === 0) ? rOcM : "";
        var rId = (rawData[r][0] || "").toString().trim();
        
        var isMatch = false;
        if (cleanTargetOc && (rOc === cleanTargetOc || rId === cleanTargetOc)) isMatch = true;
        
        if (isMatch) {
          phone = rawData[r][3] || "";
          break;
        }
      }
    }
    
    // Normalize OC code for matching (strips OC- prefix and leading zeros)
    function _normOc(v) { return ocKey(v); } // FIX-07: delegate to canonical ocKey
    var normOcCode = _normOc(ocCode);

    if (newState === "Wait") {
      // 1. Remove from old round if was in one
      if (oldRoundId && oldRoundId !== "Wait") {
        removeRoundMemberInternal(oldRoundId, ocCode, clientName, phone);
      }

      // 2. Set roundId = "" and roundName = "Wait" in Client_Payments
      cpSh.getRange(cpRowIdx, 5).setValue("");
      cpSh.getRange(cpRowIdx, 6).setValue("Wait");

      // Update LastModified timestamp
      cpSh.getRange(cpRowIdx, lastModCol).setValue(new Date().toISOString());

      // Update Financial_Data
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = getSheetDataCached("Financial_Data");
          for (var f = 1; f < finData.length; f++) {
            var fOc = (finData[f][6] || "").toString().trim();
            if (ocCode && (_normOc(fOc) === normOcCode)) {
              finSh.getRange(f + 1, 6).setValue("Wait"); // Column F is Action (6th column)
              finSh.getRange(f + 1, 12).setValue("ويت"); // Column L is Attendance (12th column)
            }
          }
        }
      } catch (finErr) {}
      
      lock.releaseLock();
      try { syncClientPaymentToLedger(payId); } catch(e) {}
      try { _appendClientHistory(phone, ocCode, _histFmt("Wait", _histAgent, "اتنقل لقائمة الانتظار (Wait)" + (oldRoundName ? " — كان في: " + oldRoundName : ""))); } catch(e) {}
      invalidateClientPaymentsCache();
      return { success: true, message: "✅ تم نقل العميل بنجاح لقائمة الانتظار (Wait)" };

    } else if (newState === "Round" || newState === "Transfer") {
      if (!targetRoundId) {
        lock.releaseLock();
        return { success: false, message: "الرجاء تحديد الراوند المستهدف" };
      }
      
      // Get target round info
      var rSh = getSheet("Rounds");
      var rData = rSh.getDataRange().getValues();
      var targetRoundName = "";
      var roundStartDateStr = "";
      for (var r = 1; r < rData.length; r++) {
        if (rData[r][0].toString() === targetRoundId.toString()) {
          targetRoundName = rData[r][1] || "";
          var sDate = rData[r][2];
          if (sDate) {
            var sd = (sDate instanceof Date) ? sDate : new Date(sDate);
            if (!isNaN(sd.getTime())) {
              roundStartDateStr = Utilities.formatDate(sd, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
            }
          }
          break;
        }
      }
      if (!targetRoundName) {
        lock.releaseLock();
        return { success: false, message: "الراوند المستهدف غير موجود" };
      }
      
      // 1. Remove from old round if was in one
      if (oldRoundId && oldRoundId !== "Wait" && oldRoundId !== "") {
        removeRoundMemberInternal(oldRoundId, ocCode, clientName, phone);
        
        // Migrate attendance and tasks in Rounds_Attendance to the new round
        if (targetRoundId) {
          try {
            var attSh = getSheet("Rounds_Attendance");
            if (attSh) {
              var attData = attSh.getDataRange().getValues();
              for (var a = 1; a < attData.length; a++) {
                var attRoundId = (attData[a][0] || "").toString().trim();
                var attPhone = (attData[a][1] || "").toString().trim();
                if (attRoundId === oldRoundId.toString().trim() && phone && phonesMatch(attPhone, phone)) {
                  attSh.getRange(a + 1, 1).setValue(targetRoundId);
                  attSh.getRange(a + 1, 6).setValue(new Date()); // Update timestamp
                }
              }
            }
          } catch (attMigrateErr) {
            Logger.log("Error migrating attendance: " + attMigrateErr.toString());
          }
        }
      }
      
      // 2. Add to new round members
      addRoundMember(targetRoundId, {
        ocCode: ocCode,
        name: clientName,
        phone: phone,
        action: "New",
        price: totalPrice,
        paid: paidAmount,
        method: method,
        agentId: agentId,
        agentName: agentName
      });
      
      // 3. Update Client_Payments
      cpSh.getRange(cpRowIdx, 5).setValue(targetRoundId);
      cpSh.getRange(cpRowIdx, 6).setValue(targetRoundName);
      
      // Update LastModified timestamp
      cpSh.getRange(cpRowIdx, lastModCol).setValue(new Date().toISOString());

      // Update Financial_Data
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = getSheetDataCached("Financial_Data");
          for (var f = 1; f < finData.length; f++) {
            var fOc = (finData[f][6] || "").toString().trim();
            if (ocCode && (_normOc(fOc) === normOcCode)) {
              finSh.getRange(f + 1, 6).setValue("Round"); // Column F is Action (6th column)
              finSh.getRange(f + 1, 12).setValue(roundStartDateStr || targetRoundName); // Column L is Attendance (12th column)
            }
          }
        }
      } catch (finErr) {}

      lock.releaseLock();
      try { syncClientPaymentToLedger(payId); } catch(e) {}
      try { _appendClientHistory(phone, ocCode, _histFmt(newState, _histAgent, (newState === "Transfer" ? "اتنقل" : "اتسكن") + " في راوند: " + targetRoundName + (oldRoundName && oldRoundName !== "Wait" ? " (كان في: " + oldRoundName + ")" : ""))); } catch(e) {}
      invalidateClientPaymentsCache();
      return { success: true, message: "✅ تم تسكين العميل بنجاح في راوند: " + targetRoundName };

    } else if (newState === "Refund") {
      // S16 FIX: track each refund sub-step and surface partial failures instead of a misleading
      // full-success (or a bare error after some rows were already changed → silent half-refund).
      var _refundWarn = [];
      // 1. Remove from old round if was in one
      if (oldRoundId && oldRoundId !== "Wait") {
        removeRoundMemberInternal(oldRoundId, ocCode, clientName, phone);
      }

      // 2. CRITICAL irreversible op first — delete Client_Payments row (fail-fast before zeroing the rest)
      try {
        cpSh.deleteRow(cpRowIdx);
      } catch (cpErr) {
        lock.releaseLock();
        return { success: false, message: "تعذّر حذف صف الأقساط — لم يتم تنفيذ أي تصفير. أعد المحاولة. (" + cpErr + ")" };
      }

      // 3. Delete from Attendance
      try {
        var attSh = getSheet("Rounds_Attendance");
        if (attSh) {
          var attData = attSh.getDataRange().getValues();
          for (var a = attData.length - 1; a >= 1; a--) {
            if ((attData[a][0] || "").toString() === (oldRoundId || "").toString() &&
                (phone && attData[a][1] === phone)) {
              attSh.deleteRow(a + 1);
            }
          }
        }
      } catch (attErr) { _refundWarn.push("الحضور (Attendance): " + attErr); }

      // 4. Delete from Payment_Transactions
      try {
        var txSh = getSheet("Payment_Transactions");
        if (txSh) {
          var txData = txSh.getDataRange().getValues();
          for (var t = txData.length - 1; t >= 1; t--) {
            if (txData[t][1].toString() === payId.toString()) {
              txSh.deleteRow(t + 1);
            }
          }
        }
      } catch (txErr) { _refundWarn.push("المعاملات (Transactions): " + txErr); }

      // 5. Zero out Price & Paid & update Action/Attendance in Financial_Data
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = getSheetDataCached("Financial_Data");
          for (var f = 1; f < finData.length; f++) {
            var fOc = (finData[f][6] || "").toString().trim();
            var fName = (finData[f][7] || "").toString().trim();
            if (ocEq(fOc, ocCode)) { // FIX-07: ocKey-normalized OC join
              finSh.getRange(f + 1, 6).setValue("Refund"); // Column F is Action (6th column)
              finSh.getRange(f + 1, 12).setValue("تم الاسترداد"); // Column L is Attendance (12th column)
              finSh.getRange(f + 1, 15).setValue(0); // Price
              finSh.getRange(f + 1, 16).setValue(0); // Paid
            }
          }
        }
      } catch (finErr) { _refundWarn.push("الحسابات (Financial_Data): " + finErr); }

      // 6. Delete or update Ledger
      try {
        var ledgerSh = getSheet("Academy_Ledger");
        if (ledgerSh) {
          var ledgerData = ledgerSh.getDataRange().getValues();
          for (var l = ledgerData.length - 1; l >= 1; l--) {
            var rowOc = (ledgerData[l][1] || "").toString().trim();
            if (ocEq(rowOc, ocCode)) { // FIX-07: ocKey-normalized OC join
              ledgerSh.deleteRow(l + 1);
            }
          }
        }
      } catch (ledgerErr) { _refundWarn.push("الليدجر (Academy_Ledger): " + ledgerErr); }

      lock.releaseLock();
      invalidateRoundsCache(); // FIX-19: refresh seat cache after refund removes a member
      invalidateClientPaymentsCache();
      try { _appendClientHistory(phone, ocCode, _histFmt("Refund", _histAgent, "اتعمل مرتجع (Refund) وتصفير الحساب" + (oldRoundName && oldRoundName !== "Wait" ? " — كان في: " + oldRoundName : ""))); } catch(e) {}
      if (_refundWarn.length) {
        return { success: true, partial: true, warnings: _refundWarn,
                 message: "⚠️ تم حذف العميل وتصفير صف الأقساط، لكن لم تكتمل بعض الخطوات: " + _refundWarn.join(" | ") + ". راجعها يدوياً." };
      }
      return { success: true, message: "✅ تم إثبات مرتجع (Refund) للعميل وتصفير حساباته وحذفه من الراوند والحضور بنجاح!" };

    } else if (newState === "Cancel") {
      // CANCEL (new, 2026-07-05 — per user spec): the client was in a round and won't continue, but
      // this is NOT a refund. Financial rule: collapse the total price down to exactly what was
      // already paid, so "Unpaid" becomes 0 — the paid amount itself is never touched.
      // Example: price 4000, paid 2000, remaining 2000 → price becomes 2000, paid stays 2000, remaining 0.
      // Structurally mirrors the "Wait" branch (roundId cleared, roundName holds a sentinel label) since
      // the client is no longer an active round member.
      if (oldRoundId && oldRoundId !== "Wait") {
        removeRoundMemberInternal(oldRoundId, ocCode, clientName, phone);
      }

      var cancelPrice = paidAmount; // price collapses to what was actually paid — paid stays as-is
      cpSh.getRange(cpRowIdx, 5).setValue("");        // roundId cleared — no longer an active member
      cpSh.getRange(cpRowIdx, 6).setValue("Cancel");  // roundName column doubles as the status sentinel
      cpSh.getRange(cpRowIdx, 7).setValue(cancelPrice); // Price
      cpSh.getRange(cpRowIdx, 11).setValue(0);          // Remaining

      cpSh.getRange(cpRowIdx, lastModCol).setValue(new Date().toISOString());

      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = getSheetDataCached("Financial_Data");
          for (var f = 1; f < finData.length; f++) {
            var fOc = (finData[f][6] || "").toString().trim();
            if (ocCode && ocEq(fOc, ocCode)) {
              finSh.getRange(f + 1, 6).setValue("Cancel");    // Column F is Action
              finSh.getRange(f + 1, 12).setValue("ملغي");     // Column L is Attendance
              finSh.getRange(f + 1, 15).setValue(cancelPrice); // Price
              // Column P (16) is Paid — intentionally left untouched
            }
          }
        }
      } catch (finErr) {}

      lock.releaseLock();
      invalidateRoundsCache();
      try { syncClientPaymentToLedger(payId); } catch (e) {}
      try { _appendClientHistory(phone, ocCode, _histFmt("Cancel", _histAgent, "اتلغى — السعر اتظبط على " + cancelPrice + " ج.م (يساوي المدفوع)" + (oldRoundName && oldRoundName !== "Wait" ? " — كان في: " + oldRoundName : ""))); } catch(e) {}
      invalidateClientPaymentsCache();
      return { success: true, message: "✅ تم إلغاء حجز العميل — السعر اتظبط على " + cancelPrice + " ج.م (يساوي المدفوع) والمتبقي بقى صفر." };
    }
    lock.releaseLock();
    return { success: false, message: "حالة غير معروفة" };
  } catch (e) {
    try { lock.releaseLock(); } catch (err) {}
    logActivity("SYSTEM", "Error", "updateClientBookingStatus", e.toString());
    return { success: false, message: "حدث خطأ غير متوقع: " + e.toString() };
  }
}

// ROOT FIX (2026-07-04): this required a truthy ocCode to do ANYTHING (`if (sh && ocCode)`) — if the
// client's OC was missing/blank at the moment of a round move (a known, separate data-quality issue),
// this silently removed NOTHING while the caller still added the client to the new round. Result: the
// client stayed in the OLD round's member list AND appeared in the NEW one — a duplicate booking that
// looked like the move "half-worked". Now it falls back to phone (very rarely missing) and, as a last
// resort, exact name match, so a move actually removes the old membership even when OC is blank.
function removeRoundMemberInternal(roundId, ocCode, clientName, phone) {
  try {
    var sh = getSheet("Round_Members");
    var deletedCount = 0;
    if (sh) {
      var data = sh.getDataRange().getValues();
      var ocK = ocKey(ocCode);
      var phoneClean = phone ? cleanPhone(phone) : "";
      var nameLower = (clientName || "").toString().trim().toLowerCase();
      // Iterate backwards so row deletions don't shift unprocessed indices
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][0].toString() !== roundId.toString()) continue;
        var rowOc = ocKey(data[i][1]);
        var rowPhoneClean = cleanPhone(data[i][3]);
        var rowNameLower = (data[i][2] || "").toString().trim().toLowerCase();
        var match =
          (ocK && rowOc && rowOc === ocK) ||
          (phoneClean && rowPhoneClean && (rowPhoneClean === phoneClean || rowPhoneClean.slice(-9) === phoneClean.slice(-9))) ||
          (!ocK && !phoneClean && nameLower && rowNameLower === nameLower); // last resort only if OC and phone are BOTH missing
        if (match) {
          sh.deleteRow(i + 1);
          deletedCount++;
        }
      }
    }
    // Update enrolled count by actual deleted rows (handles duplicates correctly)
    if (deletedCount > 0) {
      var rsh = getSheet("Rounds");
      var rdata = rsh.getDataRange().getValues();
      for (var j = 1; j < rdata.length; j++) {
        if ((rdata[j][0] || "").toString() === roundId.toString()) {
          var current = parseInt(rdata[j][5]) || 0;
          rsh.getRange(j + 1, 6).setValue(Math.max(0, current - deletedCount));
          break;
        }
      }
    }
    if (deletedCount > 0) { invalidateRoundsCache(); } // FIX-19: invalidate stale seat-count cache after unenroll
  } catch(e) {
    Logger.log("removeRoundMemberInternal error: " + e.toString());
  }
}

function getRoundStartDate(roundId) {
  if (!roundId) return "";
  try {
    var sh = getSheet("Rounds");
    if (!sh) return "";
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === roundId.toString().trim()) {
        var sDate = data[i][2];
        if (sDate) {
          var sd = (sDate instanceof Date) ? sDate : new Date(sDate);
          if (!isNaN(sd.getTime())) {
            var timeZone = "GMT";
            try { timeZone = Session.getScriptTimeZone() || "GMT"; } catch(e) {}
            return Utilities.formatDate(sd, timeZone, "yyyy-MM-dd");
          }
          return sDate.toString();
        }
        break;
      }
    }
  } catch(e) {}
  return "";
}

// ==========================================
// ADMIN - (Duplicate definition removed, using unified leads fetcher at line 1050)
// ==========================================

function adminTransferLead(clientId, newAgentName, performedById, performedByName) {
  try {
    var sh = getSheet("Raw_Data");
    var data = sh.getDataRange().getValues();
    var found = false;
    var oldAgentName = "", clientPhone = "", clientOc = "";
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === clientId.toString()) {
        oldAgentName = (data[i][6] || "").toString().trim();
        clientPhone = (data[i][3] || "").toString().trim();
        clientOc = (data[i][14] || "").toString().trim();
        sh.getRange(i + 1, 7).setValue(newAgentName); // Raw_Data Agent (col G)
        found = true;
        break;
      }
    }
    if (!found) return { success: false, message: "العميل غير موجود" };

    // S10 FIX: cascade ownership to My_Leads. getMyLeads filters by AgentID (idx6); without this the
    // lead stays under the OLD owner and the new agent never sees it (the Waiting / My-Leads desync).
    var newAgentId = "";
    try {
      var users = getUsers();
      for (var u = 0; u < users.length; u++) {
        if ((users[u].name || "").toString().trim().toLowerCase() === newAgentName.toString().trim().toLowerCase()) {
          newAgentId = (users[u].id || "").toString();
          break;
        }
      }
    } catch (ue) {}
    var mlUpdated = false;
    try {
      var mlSh = getSheet("My_Leads");
      if (mlSh) {
        var mlData = mlSh.getDataRange().getValues();
        for (var m = 1; m < mlData.length; m++) {
          if (idsMatch(mlData[m][0], clientId)) {
            if (newAgentId) mlSh.getRange(m + 1, 7).setValue(newAgentId); // AgentID (idx6)
            mlSh.getRange(m + 1, 8).setValue(newAgentName);               // AgentName (idx7)
            mlUpdated = true;
            break;
          }
        }
      }
    } catch (me) {}
    SpreadsheetApp.flush();
    try { _appendClientHistory(clientPhone, clientOc, _histFmt("Transfer Lead", performedByName || "Admin", "اتنقل من " + (oldAgentName || "—") + " إلى " + newAgentName)); } catch (he) {}

    var msg = "✅ تم النقل إلى " + newAgentName;
    if (!newAgentId) msg += " ⚠️ (تعذّر إيجاد ID للموظف الجديد — حُدِّث الاسم فقط؛ راجع شيت Users)";
    else if (!mlUpdated) msg += " (ℹ️ لا يوجد سجل My_Leads لهذا العميل — حُدِّث الماستر فقط)";
    return { success: true, message: msg, myLeadsUpdated: mlUpdated, newAgentId: newAgentId };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function getActivityLog(limit) {
  try {
    var ss = getMaster();
    var masterId = ss.getId();
    var sh = getSheet("Activity_Log");

    if (!sh) {
      // Diagnostic check: get all sheet names to display to user
      var sheets = ss.getSheets();
      var names = sheets.map(function (s) { return s.getName(); }).join(", ");
      return [{
        date: "",
        agentName: "System",
        action: "DIAGNOSTIC",
        details: "شيت Activity_Log غير موجود. الشيتات المتوفرة في الماستر هي: " + names + " | معرّف الملف: " + masterId
      }];
    }

    var data = sh.getDataRange().getValues(), logs = [];
    if (data.length <= 1) {
      return [{
        date: "",
        agentName: "System",
        action: "DIAGNOSTIC",
        details: "شيت Activity_Log موجود ولكنه فارغ تماماً (لا يحتوي على صفوف) | معرّف الملف: " + masterId
      }];
    }

    var tz = "UTC";
    try {
      tz = Session.getScriptTimeZone();
    } catch (e) { }

    for (var i = data.length - 1; i >= 1 && logs.length < (limit || 100); i--) {
      var row = data[i];
      var dateVal = "";
      var agentNameVal = "";
      var actionVal = "";
      var detailsVal = "";

      // Auto-detect layout based on whether row[0] contains a valid date
      var dateInColA = false;
      if (row[0]) {
        var dTest = new Date(row[0]);
        if (!isNaN(dTest.getTime())) {
          dateInColA = true;
        }
      }

      if (dateInColA) {
        // Standard layout: Date in A, ID in B, Name in C, Action in D, Details in E
        dateVal = safeFormatDate(row[0], tz, "yyyy-MM-dd HH:mm");
        agentNameVal = row[2] ? row[2].toString() : "";
        actionVal = row[3] ? row[3].toString() : "";
        detailsVal = row[4] ? row[4].toString() : "";
      } else {
        // Shifted layout: A is empty, Date in B, ID in C, Name in D, Action in E, Details in F
        dateVal = row[1] ? safeFormatDate(row[1], tz, "yyyy-MM-dd HH:mm") : "";
        agentNameVal = row[3] ? row[3].toString() : "";
        actionVal = row[4] ? row[4].toString() : "";
        detailsVal = row[5] ? row[5].toString() : "";
      }

      logs.push({
        date: dateVal,
        agentName: agentNameVal,
        action: actionVal,
        details: detailsVal
      });
    }
    return logs;
  } catch (e) {
    return [{
      date: "",
      agentName: "System",
      action: "ERROR",
      details: "خطأ في قراءة سجل النشاط: " + e.toString()
    }];
  }
}

// ==========================================
// QUIZ BANK SHEET — إنشاء واستيراد
// ==========================================
function initQuizBankSheet() {
  try {
    var ss = getMaster();
    var sh = ss.getSheetByName('Quiz_Bank');
    if (!sh) sh = ss.insertSheet('Quiz_Bank');
    if (sh.getLastRow() === 0) {
      var headers = ['Lecture_ID','Lecture_Name','Instructor','Question','Option_A','Option_B','Option_C','Option_D','Correct (1-4)','Notes'];
      sh.appendRow(headers);
      sh.getRange(1,1,1,headers.length).setBackground('#4a2c2a').setFontColor('#fff').setFontWeight('bold').setFontSize(11);
      // Example row
      sh.appendRow(['L001','المحاضرة 1 - مقدمة','اسم الدكتور','ما هو تعريف الـ CRM؟','إدارة علاقات العملاء','برنامج محاسبة','منصة تواصل اجتماعي','نظام مخزون','1','مثال']);
      sh.getRange(2,1,1,10).setBackground('#fef9ee').setFontColor('#7b5c00');
      sh.setColumnWidth(1,110); sh.setColumnWidth(2,180); sh.setColumnWidth(3,130);
      sh.setColumnWidth(4,260); sh.setColumnWidth(5,160); sh.setColumnWidth(6,160);
      sh.setColumnWidth(7,160); sh.setColumnWidth(8,160); sh.setColumnWidth(9,110); sh.setColumnWidth(10,140);
      sh.setFrozenRows(1);
      // Add data validation for Correct column (1-4)
      var corrRule = SpreadsheetApp.newDataValidation().requireNumberBetween(1,4).setAllowInvalid(false).build();
      sh.getRange('I2:I1000').setDataValidation(corrRule);
    }
    return { success: true, message: '✅ تم إنشاء شيت Quiz_Bank في الـ Spreadsheet — افتحه وأضف أسئلتك' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function importQuestionsFromBank() {
  try {
    var sh = getMaster().getSheetByName('Quiz_Bank');
    if (!sh) return { success: false, message: 'مفيش شيت اسمه Quiz_Bank — اضغط "إنشاء شيت الأسئلة" الأول' };
    var data = sh.getDataRange().getValues();
    if (data.length <= 2) return { success: false, message: 'الشيت فاضي أو فيه بس الصف المثال — أضف أسئلة حقيقية الأول' };
    // Group by lectureId
    var byLecture = {};
    var skipped = 0, total = 0;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var lecId   = (row[0]||'').toString().trim();
      var lecName = (row[1]||'').toString().trim();
      var q       = (row[3]||'').toString().trim();
      var opts    = [row[4],row[5],row[6],row[7]].map(function(o){ return (o||'').toString().trim(); });
      var correct = parseInt((row[8]||'').toString().trim()) - 1; // 0-indexed
      if (!lecId || !q || opts.some(function(o){ return !o; }) || isNaN(correct) || correct < 0 || correct > 3) { skipped++; continue; }
      if (!byLecture[lecId]) byLecture[lecId] = { name: lecName, questions: [] };
      byLecture[lecId].questions.push({ q: q, options: opts, correct: correct });
      total++;
    }
    var imported = 0, errors = [];
    var lecIds = Object.keys(byLecture);
    for (var j = 0; j < lecIds.length; j++) {
      var lid = lecIds[j];
      var entry = byLecture[lid];
      var r = saveQuizForLecture(lid, 'ALL', entry.name, entry.questions, 70, 20);
      if (r.success) imported++; else errors.push(lid);
    }
    var msg = '✅ تم استيراد ' + imported + ' محاضرة — ' + total + ' سؤال';
    if (skipped > 0) msg += ' — ⚠️ تجاهل ' + skipped + ' صف ناقص';
    if (errors.length > 0) msg += ' — ❌ فشل: ' + errors.join(', ');
    return { success: imported > 0, message: msg, imported: imported, total: total, skipped: skipped };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ==========================================
// AGENT LIST (for report filter)
// ==========================================
function getAgentNames() {
  try {
    var sh = getSheet("Users");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var id   = (data[i][0]||'').toString().trim();
      var name = (data[i][1]||'').toString().trim();
      var role = (data[i][4]||'').toString().toLowerCase().trim();
      var active = data[i][5];
      if (!id || !name) continue;
      if (role === 'admin' || role === 'manager') continue;
      if (active === false || active === 'false' || active === 0) continue;
      result.push({ id: id, name: name });
    }
    return result;
  } catch(e) { return []; }
}

// ==========================================
// REPORTS & REMINDERS
// ==========================================
function sendPerformanceReport(fromDate, toDate, agentId) {
  try {
    var NAMED = ['today','yesterday','last7','last30','thisMonth','all'];
    var range, periodLabel;
    if (fromDate && toDate) {
      // Custom date range
      range = 'custom:' + fromDate + ':' + toDate;
      periodLabel = fromDate + ' → ' + toDate;
    } else if (fromDate && NAMED.indexOf(fromDate) !== -1) {
      // Named range passed as first param
      range = fromDate;
      var labelMap = {today:'اليوم',yesterday:'أمس',last7:'آخر 7 أيام',last30:'آخر 30 يوم',thisMonth:'هذا الشهر',all:'كل الأوقات'};
      periodLabel = (labelMap[range] || range) + ' — ' + todayStr();
    } else {
      range = 'today';
      periodLabel = 'اليوم — ' + todayStr();
    }
    var agents = getTeamPerformance(range);
    if (!agents || !agents.length) return { success: false, message: "لا توجد بيانات للفترة المحددة" };
    // Filter by agent if specified
    if (agentId && agentId !== 'all') {
      agents = agents.filter(function(a) { return a.id === agentId; });
      if (!agents.length) return { success: false, message: "لا توجد بيانات لهذا الموظف في الفترة المحددة" };
    }
    var rows = agents.map(function(a, idx) {
      var scoreColor = a.kpi_score >= 70 ? '#2e7d32' : a.kpi_score >= 45 ? '#e65100' : '#c62828';
      var issue = a.primary_issue ? (a.primary_issue.icon + ' ' + a.primary_issue.label) : (a.not_enough_data ? '⚪ Not Enough Data' : '✅ لا مشاكل');
      return '<tr style="border-bottom:1px solid #eee">' +
        '<td style="padding:8px 12px;font-weight:700">' + (idx+1) + '</td>' +
        '<td style="padding:8px 12px;font-weight:700">' + (a.name||'') + '</td>' +
        '<td style="padding:8px 12px;text-align:center;font-weight:800;color:' + scoreColor + '">' + (a.kpi_score||0) + '/100</td>' +
        '<td style="padding:8px 12px;text-align:center">' + (a.calls||0) + '</td>' +
        '<td style="padding:8px 12px;text-align:center">' + (a.won||0) + '</td>' +
        '<td style="padding:8px 12px;text-align:center">' + (a.fresh_contact_rate||0) + '%</td>' +
        '<td style="padding:8px 12px;text-align:center">' + (a.fresh_interest_rate||0) + '%</td>' +
        '<td style="padding:8px 12px;text-align:center">' + (a.fresh_closing_rate||0) + '%</td>' +
        '<td style="padding:8px 12px;font-size:12px">' + issue + '</td>' +
      '</tr>';
    }).join('');

    var html = '<div dir="rtl" style="font-family:Arial,sans-serif;max-width:900px;margin:auto">' +
      '<h2 style="color:#4a2c2a;border-bottom:3px solid #c9a84c;padding-bottom:8px">📊 تقرير أداء المبيعات — ' + periodLabel + '</h2>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:#4a2c2a;color:#fff">' +
          '<th style="padding:10px 12px">#</th>' +
          '<th style="padding:10px 12px">الوكيل</th>' +
          '<th style="padding:10px 12px">KPI Score</th>' +
          '<th style="padding:10px 12px">مكالمات</th>' +
          '<th style="padding:10px 12px">Closed Won</th>' +
          '<th style="padding:10px 12px">Contact %</th>' +
          '<th style="padding:10px 12px">Interest %</th>' +
          '<th style="padding:10px 12px">Closing %</th>' +
          '<th style="padding:10px 12px">التشخيص</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';

    MailApp.sendEmail({
      to: "bsa.academy.co.2025@gmail.com",
      subject: "تقرير أداء المبيعات — " + periodLabel,
      htmlBody: html
    });
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function initPaymentTransactionsSheet() {
  var sh = getSheet("Payment_Transactions");
  if (!sh) {
    getMaster().insertSheet("Payment_Transactions");
    sh = getSheet("Payment_Transactions");
  }
  var data = sh.getDataRange().getValues();
  if (data.length < 1 || data[0][0] !== "TransactionID") {
    sh.clearContents();
    sh.appendRow(["TransactionID", "PaymentID", "ClientName", "Amount", "Date", "Type", "AgentID", "AgentName"]);
    sh.getRange(1, 1, 1, 8).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
  }
}

// ==========================================
// OC CODE - تحديث كود العميل
// ==========================================
function updateClientOCCode(clientId, ocCode, agentId, agentName) {
  var cleanClientId = (clientId || "").toString().trim();
  if (cleanClientId === "—" || cleanClientId === "-" || cleanClientId.toLowerCase() === "null" || cleanClientId.toLowerCase() === "undefined" || !cleanClientId) {
    return { success: false, message: "كود العميل غير صالح" };
  }
  var cleanOcCode = (ocCode || "").toString().trim();
  if (cleanOcCode === "—" || cleanOcCode === "-" || cleanOcCode.toLowerCase() === "null" || cleanOcCode.toLowerCase() === "undefined" || !cleanOcCode) {
    return { success: false, message: "كود OC غير صالح" };
  }
  clientId = cleanClientId;
  ocCode = cleanOcCode;
  try {
    var sh = getSheet("Raw_Data");
    var data = sh.getDataRange().getValues();
    // OC Code goes to column O (index 14, column 15).
    // Column M (index 12, column 13) is reserved for Campaign_Type only.
    var ocColNum = 15; // Column O
    for (var i = 1; i < data.length; i++) {
      if (idsMatch(data[i][0], clientId)) {
        sh.getRange(i + 1, ocColNum).setValue(ocCode); // Column N = OC Code
        
        // Propagate manual OC Code to all other sheets
        var phone = (data[i][3] || "").toString().trim();
        var name = (data[i][2] || "").toString().trim();
        syncOcCodeEverywhere(clientId, ocCode, phone, name);
        
        logActivity(agentId, agentName, "UPDATE_OC", clientId + " → " + ocCode);
        return { success: true, message: "✅ تم حفظ OC Code: " + ocCode };
      }
    }
    return { success: false, message: "العميل غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ==========================================
// DELETE LEAD - حذف ليد من My_Leads
// ==========================================
function deleteLeadFromMyLeads(clientId, agentId, isManager) {
  var cleanClientId = (clientId || "").toString().trim();
  if (cleanClientId === "—" || cleanClientId === "-" || cleanClientId.toLowerCase() === "null" || cleanClientId.toLowerCase() === "undefined" || !cleanClientId) {
    return { success: false, message: "كود العميل غير صالح" };
  }
  clientId = cleanClientId;
  try {
    var sh = getSheet("My_Leads");
    var data = sh.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (idsMatch(data[i][0], clientId)) {
        if (!isManager && (data[i][6] || "").toString() !== agentId.toString()) {
          return { success: false, message: "يمكنك فقط حذف عملاءك" };
        }
        var agentName = data[i][7] || "";
        sh.deleteRow(i + 1);

        // Update Raw_Data status to "Deleted" and set Agent to agentName
        var msh = getSheet("Raw_Data");
        var masterUpdated = false; // FIX-02 (S19b): track whether the master row was actually found
        if (msh) {
          var mdata = msh.getDataRange().getValues();
          for (var j = 1; j < mdata.length; j++) {
            if (idsMatch(mdata[j][0], clientId)) {
              msh.getRange(j + 1, 7).setValue(agentName); // Col G (Agent)
              msh.getRange(j + 1, 8).setValue("Deleted");   // Col H (Status)
              masterUpdated = true;
              break;
            }
          }
        }

        logActivity(agentId, agentName, "DELETE_LEAD", clientId);
        // FIX-02 (S19b): the My_Leads row WAS removed (success stays true), but only claim the
        // master sheet was updated when it actually was — the old message always said so.
        return { success: true, message: masterUpdated ? "تم الحذف بنجاح وتحديث شيت الماستر" : "تم الحذف من قائمتك (لم يُعثر على السجل في شيت الماستر)" };
      }
    }
    return { success: false, message: "العميل غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ADMIN DELETE LEAD - حذف نهائي من Raw_Data و My_Leads
// ==========================================
function adminDeleteLead(clientId) {
  var cleanClientId = (clientId || "").toString().trim();
  if (cleanClientId === "—" || cleanClientId === "-" || cleanClientId.toLowerCase() === "null" || cleanClientId.toLowerCase() === "undefined" || !cleanClientId) {
    return { success: false, message: "كود العميل غير صالح" };
  }
  clientId = cleanClientId;
  try {
    // 1. Delete from Raw_Data
    var shRaw = getSheet("Raw_Data");
    var dataRaw = shRaw.getDataRange().getValues();
    var deletedFromRaw = false;
    for (var i = dataRaw.length - 1; i >= 1; i--) {
      if (idsMatch(dataRaw[i][0], clientId)) {
        shRaw.deleteRow(i + 1);
        deletedFromRaw = true;
        break;
      }
    }

    // 2. Delete from My_Leads
    var shMy = getSheet("My_Leads");
    var deletedFromMy = false; // FIX-02 (S19b): track My_Leads deletion for honest reporting
    if (shMy) {
      var dataMy = shMy.getDataRange().getValues();
      for (var i = dataMy.length - 1; i >= 1; i--) {
        if (idsMatch(dataMy[i][0], clientId)) {
          shMy.deleteRow(i + 1);
          deletedFromMy = true;
          break;
        }
      }
    }

    if (deletedFromRaw) {
      logActivity("admin", "Admin", "ADMIN_DELETE", clientId);
      // FIX-02 (S19b): report accurately whether a My_Leads row was also removed.
      // (Cascade cleanup of payment/financial/round rows is intentionally out of Wave-1 scope.)
      return { success: true, message: deletedFromMy ? "تم الحذف نهائياً من السيستم" : "تم الحذف من شيت الماستر (لم يُعثر على سجل في قائمة الموظف)" };
    }
    return { success: false, message: "العميل غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function updateLeadDetailsDirectly(clientId, newName, newPhone, newCourse, newStatus, newNextDue, newNotesText, agentId, agentName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    clientId = (clientId || "").toString().trim();
    if (!clientId || clientId === "—" || clientId === "-" || clientId.toLowerCase() === "null" || clientId.toLowerCase() === "undefined") {
      lock.releaseLock();
      return { success: false, message: "كود العميل غير صالح" };
    }
    
    var isAdmin = isUserAdminOrManager(agentId);
    
    // 1. Open My_Leads and search row
    var shMy = getSheet("My_Leads");
    var dataMy = shMy ? shMy.getDataRange().getValues() : [];
    var myRowIdx = -1;
    var oldPhone = "";
    var oldName = "";
    
    for (var i = 1; i < dataMy.length; i++) {
      if ((dataMy[i][0] || "").toString().trim() === clientId) {
        if (!isAdmin && (dataMy[i][6] || "").toString().trim() !== agentId.toString().trim()) {
          lock.releaseLock();
          return { success: false, message: "ليس لديك صلاحية لتعديل هذا العميل" };
        }
        myRowIdx = i + 1;
        oldPhone = cleanPhone(dataMy[i][3]);
        oldName = (dataMy[i][2] || "").toString().trim();
        break;
      }
    }
    
    // 2. Open Raw_Data and search row
    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    var rawRowIdx = -1;
    var ocCode = "";
    
    for (var j = 1; j < rawData.length; j++) {
      if ((rawData[j][0] || "").toString().trim() === clientId) {
        rawRowIdx = j + 1;
        if (!oldPhone) {
          oldPhone = cleanPhone(rawData[j][3]);
        }
        if (!oldName) {
          oldName = (rawData[j][2] || "").toString().trim();
        }
        
        // Retrieve ocCode
        var rawOcO = (rawData[j][14] || "").toString().trim();
        var rawOcN = (rawData[j][13] || "").toString().trim();
        if (rawOcO && rawOcO.toLowerCase().indexOf("oc-") === 0) {
          ocCode = rawOcO;
        } else if (rawOcN && rawOcN.toLowerCase().indexOf("oc-") === 0) {
          ocCode = rawOcN;
        } else {
          ocCode = rawOcO || rawOcN || "";
        }
        break;
      }
    }
    
    var cleanNewPhone = cleanPhone(newPhone);
    var targetNewName = (newName || "").toString().trim();
    
    // Update My_Leads
    if (myRowIdx !== -1) {
      shMy.getRange(myRowIdx, 3).setValue(targetNewName); // Column C (Name)
      shMy.getRange(myRowIdx, 4).setValue(newPhone);      // Column D (Phone)
      shMy.getRange(myRowIdx, 6).setValue(newCourse);     // Column F (Course)
      shMy.getRange(myRowIdx, 9).setValue(newStatus);     // Column I (Status/Action)
      shMy.getRange(myRowIdx, 10).setValue(newNotesText);  // Column J (Notes)
      if (newNextDue) {
        shMy.getRange(myRowIdx, 11).setValue(new Date(newNextDue)); // Column K (Follow Up Date)
      } else {
        shMy.getRange(myRowIdx, 11).setValue("");
      }
    }
    
    // Update Raw_Data
    if (rawRowIdx !== -1) {
      rawSh.getRange(rawRowIdx, 3).setValue(targetNewName); // Column C (Name)
      rawSh.getRange(rawRowIdx, 4).setValue(newPhone);      // Column D (Phone)
      rawSh.getRange(rawRowIdx, 6).setValue(newCourse);     // Column F (Course)
      rawSh.getRange(rawRowIdx, 9).setValue(newNotesText);  // Column I (Notes)
      rawSh.getRange(rawRowIdx, 10).setValue(newStatus);    // Column J (Action)
      rawSh.getRange(rawRowIdx, 11).setValue(newStatus);    // Column K (New Action)
      if (newNextDue) {
        rawSh.getRange(rawRowIdx, 12).setValue(new Date(newNextDue)); // Column L (Follow Up Date)
      } else {
        rawSh.getRange(rawRowIdx, 12).setValue("");
      }
      var lastModColM = ensureLastModifiedColumn(rawSh);
      rawSh.getRange(rawRowIdx, lastModColM).setValue(new Date().toISOString());
    }
    
    var isRealOc = ocCode && ocCode.toString().trim().toLowerCase().indexOf("oc-") === 0;
    
    // Propagate Name Change
    if (targetNewName && targetNewName !== oldName) {
      // Client_Payments
      try {
        var cpSh = getSheet("Client_Payments");
        if (cpSh) {
          var cpData = cpSh.getDataRange().getValues();
          for (var c = 1; c < cpData.length; c++) {
            var cpOc = (cpData[c][1] || "").toString().trim();
            if (ocEq(cpOc, ocCode) || (clientId && cpOc.toString() === clientId)) { // FIX-07
              cpSh.getRange(c + 1, 3).setValue(targetNewName); // Column C is Name
            }
          }
        }
      } catch(e) {}
      
      // Round_Members
      try {
        var rmSh = getSheet("Round_Members");
        if (rmSh) {
          var rmData = rmSh.getDataRange().getValues();
          for (var rm = 1; rm < rmData.length; rm++) {
            var rmOc = (rmData[rm][1] || "").toString().trim();
            if (ocEq(rmOc, ocCode) || (clientId && rmOc.toString() === clientId)) { // FIX-07
              rmSh.getRange(rm + 1, 3).setValue(targetNewName); // Column C is Name
            }
          }
        }
      } catch(e) {}
      
      // Financial_Data
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = finSh.getDataRange().getValues();
          for (var f = 1; f < finData.length; f++) {
            var fOc = (finData[f][6] || "").toString().trim();
            if (ocEq(fOc, ocCode) || (clientId && fOc === clientId)) { // FIX-07
              finSh.getRange(f + 1, 8).setValue(targetNewName); // Column H is Name
            }
          }
        }
      } catch(e) {}
    }
    
    // Propagate Phone Change
    if (cleanNewPhone && cleanNewPhone !== oldPhone) {
      // Round_Members
      try {
        var rmSh = getSheet("Round_Members");
        if (rmSh) {
          var rmData = rmSh.getDataRange().getValues();
          for (var rm = 1; rm < rmData.length; rm++) {
            var rmOc = (rmData[rm][1] || "").toString().trim();
            var rmPhone = cleanPhone(rmData[rm][3]);
            var matched = false;
            if (ocEq(rmOc, ocCode)) matched = true; // FIX-07: ocKey-normalized OC join
            else if (clientId && rmOc.toString() === clientId) matched = true;
            else if (oldPhone && rmPhone && phonesMatch(rmPhone, oldPhone)) matched = true;
            
            if (matched) {
              rmSh.getRange(rm + 1, 4).setValue(newPhone); // Column D is Phone
            }
          }
        }
      } catch(e) {}
      
      // Financial_Data
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var finData = finSh.getDataRange().getValues();
          for (var f = 1; f < finData.length; f++) {
            var fOc = (finData[f][6] || "").toString().trim();
            var fPhone = cleanPhone(finData[f][8]);
            var matched = false;
            if (ocEq(fOc, ocCode)) matched = true; // FIX-07: ocKey-normalized OC join
            else if (clientId && fOc === clientId) matched = true;
            else if (oldPhone && fPhone && phonesMatch(fPhone, oldPhone)) matched = true;
            
            if (matched) {
              finSh.getRange(f + 1, 9).setValue(newPhone); // Column I is Phone
            }
          }
        }
      } catch(e) {}
      
      // Rounds_Attendance
      try {
        var attSh = getSheet("Rounds_Attendance");
        if (attSh) {
          var attData = attSh.getDataRange().getValues();
          for (var a = 1; a < attData.length; a++) {
            var attPhone = cleanPhone(attData[a][1]);
            if (oldPhone && attPhone && phonesMatch(attPhone, oldPhone)) {
              attSh.getRange(a + 1, 2).setValue(newPhone); // Column B is StudentPhone
            }
          }
        }
      } catch(e) {}
    }
    
    // BUG FIX (2026-07-06): this function DOES propagate a name/phone change into Client_Payments (and
    // Round_Members/Financial_Data) above, but — unlike every other place in this file that touches
    // Client_Payments (9 other call sites) — it never invalidated the 20-second Client_Payments cache
    // afterward. The sheet itself got updated correctly, but any page reading through
    // getClientPayments()/the payments cache (monthly clients widget, the payment detail card, the
    // Client_Payments ledger) kept serving the stale cached name until that cache happened to expire on
    // its own — looking exactly like "updated in عملائي, nowhere else."
    invalidateClientPaymentsCache();
    logActivity(agentId, agentName, "EDIT_LEAD_DIRECT", targetNewName + " (" + clientId + ")");
    lock.releaseLock();
    return { success: true, message: "✅ تم تحديث تفاصيل العميل بنجاح في جميع الشيتات." };
    
  } catch (e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// searchHistoryFast - updated to include OC Code
// ==========================================
function searchHistoryFast(phoneNumber, agentId, agentName) {
  if (!phoneNumber) return { found: false, message: "أدخل رقم الهاتف" };
  try {
    var sh = getSheet("Raw_Data");
    var data = sh.getDataRange().getValues();
    var clean = cleanPhone(phoneNumber);
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (!cleanPhone(data[i][3]).includes(clean) || !clean) continue;
      var notes = (data[i][8] || "").toString().split("\n").filter(function (l) { return l.trim(); });
      results.push({
        id: (data[i][0] || (i + 1)).toString(),
        rowIndex: i + 1,
        name: data[i][2] || "غير معروف",
        phone: formatEgyptianPhone(data[i][3]),
        course: data[i][5] || "",
        agent: data[i][6] || "",
        status: data[i][7] || "",
        lastAction: data[i][10] || data[i][9] || "", // Check new action, fallback to action
        ocCode: data[i][14] || "", // Column O (index 14)
        source: data[i][4] || "",
        campaign: data[i][12] || "",
        phone2: _rawRowPhone2(data[i]),
        notes: notes,
        lastNote: notes.length ? notes[notes.length - 1] : "",
        isFree: !(data[i][6] || "").toString().trim()
      });
    }
    return { found: results.length > 0, results: results };
  } catch (e) { return { found: false, message: "خطأ: " + e.toString() }; }
}

function getClientById(clientId) {
  try {
    var sh = getSheet("Raw_Data");
    var lastModCol = ensureLastModifiedColumn(sh);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (idsMatch(data[i][0], clientId)) {
        var notes = (data[i][8] || "").toString().split("\n").filter(function (l) { return l.trim(); });
        var lastModVal = data[i][lastModCol - 1] || "";
        // Always return lastModified as ISO string for consistent conflict detection
        var lastModIso = "";
        if (lastModVal) {
          if (lastModVal instanceof Date) {
            lastModIso = lastModVal.toISOString();
          } else {
            var _d = new Date(lastModVal.toString());
            lastModIso = !isNaN(_d.getTime()) ? _d.toISOString() : lastModVal.toString();
          }
        }
        return {
          success: true,
          client: {
            id: (data[i][0] || (i + 1)).toString(),
            rowIndex: i + 1,
            name: data[i][2] || "غير معروف",
            phone: formatEgyptianPhone(data[i][3]),
            course: data[i][5] || "",
            agent: data[i][6] || "",
            status: data[i][7] || "",
            lastAction: data[i][10] || data[i][9] || "", // Check new action, fallback to action
            ocCode: ensureOcCode(data[i][14], (data[i][0] || "").toString(), data[i][3], data[i][2]),
            source: data[i][4] || "",
            campaign: data[i][12] || "",
            phone2: _rawRowPhone2(data[i]),
            notes: notes,
            lastNote: notes.length ? notes[notes.length - 1] : "",
            isFree: !(data[i][6] || "").toString().trim(),
            lastModified: lastModIso
          }
        };
      }
    }
    return { success: false, message: "العميل غير موجود" };
  } catch (e) {
    return { success: false, message: "خطأ: " + e.toString() };
  }
}

// ==========================================
// CLIENT HISTORY PAGE (2026-07-06) — dedicated lookup: pull up a client by phone/OC/name and see
// their COMPLETE history (the same unified log every other feature already writes to — round changes,
// transfers, Support Me, Exception requests, call logs — see [[project_universal_history_and_exception_upgrade]]),
// plus a free-text comment box. The comment is intentionally NOT a "call": it only touches Raw_Data via
// _appendClientHistory() — it never writes to My_Leads notes or logs a CALL_SAVED Activity_Log entry, so
// it can never inflate an agent's daily call count in getLiveKPIs()/getTeamPerformance() (those only
// count My_Leads "[today] (...)"-lines and Activity_Log CALL_SAVED rows respectively).
// ==========================================
function searchClientHistoryCandidates(query) {
  try {
    query = (query || "").toString().trim();
    if (!query) return { found: false, results: [] };
    var sh = getSheet("Raw_Data");
    if (!sh) return { found: false, results: [] };
    var data = sh.getDataRange().getValues();
    var qClean = cleanPhone(query);
    var qOc = ocKey(query);
    var qLower = query.toLowerCase();
    var isPhoneLike = qClean.length >= 4;
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var rowPhone = cleanPhone(data[i][3]);
      var rowOc = ocKey(data[i][14]);
      var rowName = (data[i][2] || "").toString().toLowerCase();
      var match = (isPhoneLike && rowPhone && rowPhone.indexOf(qClean) !== -1) ||
                  (qOc && rowOc && rowOc === qOc) ||
                  (qLower.length >= 3 && rowName.indexOf(qLower) !== -1);
      if (!match) continue;
      results.push({
        id: (data[i][0] || (i + 1)).toString(),
        name: data[i][2] || "غير معروف",
        phone: formatEgyptianPhone(data[i][3]),
        ocCode: data[i][14] || "",
        agent: data[i][6] || "",
        status: data[i][7] || ""
      });
      if (results.length >= 30) break; // cap — this is a lookup tool, not a report
    }
    return { found: results.length > 0, results: results };
  } catch (e) { return { found: false, results: [], message: "خطأ: " + e.toString() }; }
}

// Adds a free-text note to a client's unified history. Deliberately NOT a "call": does not touch
// My_Leads and does not log CALL_SAVED, so it can never be miscounted as a call in performance reports.
function addClientHistoryComment(agentId, agentName, clientId, commentText) {
  try {
    commentText = (commentText || "").toString().trim();
    if (!commentText) return { success: false, message: "اكتب ملاحظة الأول" };
    var sh = getSheet("Raw_Data");
    if (!sh) return { success: false, message: "خطأ في النظام" };
    var data = sh.getDataRange().getValues();
    var phone = "", oc = "";
    for (var i = 1; i < data.length; i++) {
      if (idsMatch(data[i][0], clientId)) { phone = data[i][3]; oc = data[i][14]; break; }
    }
    if (!phone && !oc) return { success: false, message: "العميل غير موجود" };
    var entry = _histFmt("ملاحظة", agentName, commentText);
    var ok = _appendClientHistory(phone, oc, entry);
    if (!ok) return { success: false, message: "تعذّر إضافة الملاحظة" };
    return { success: true, message: "✅ تمت إضافة الملاحظة", entry: entry };
  } catch (e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

// ==========================================
// adminGetAllLeads - updated with OC Code and month filtering
// ==========================================
function adminGetAllLeads(selectedMonth) {
  selectedMonth = selectedMonth || "current";
  var sh = getSheet("Raw_Data");
  var data = sh.getDataRange().getValues(), leads = [];
  var tz = Session.getScriptTimeZone();
  var currentMonthStr = safeFormatDate(new Date(), tz, "yyyy-MM");

  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;

    var rowDate = data[i][1] ? safeFormatDate(data[i][1], tz, "yyyy-MM-dd") : "";
    var rowMonth = rowDate.substring(0, 7); // "yyyy-MM"

    if (selectedMonth !== "all") {
      var targetMonth = (selectedMonth === "current") ? currentMonthStr : selectedMonth;
      if (rowMonth !== targetMonth) continue;
    }

    leads.push({
      id: data[i][0].toString(), rowIndex: i + 1,
      name: data[i][2] || "", phone: formatEgyptianPhone(data[i][3]),
      course: data[i][5] || "", agent: data[i][6] || "",
      status: data[i][7] || "", lastAction: data[i][10] || data[i][9] || "", // Check new action, fallback to action
      ocCode: data[i][14] || "", // Column O (index 14)
      createdAt: rowDate
    });
  }

  leads.reverse();
  if (selectedMonth === "all") {
    return leads.slice(0, 2000);
  }
  return leads;
}

function getMyLeads(agentId, agentName, role) {
  try {
    var sh = getSheet("My_Leads");
    var data = sh.getDataRange().getValues(), leads = [];
    var tz = Session.getScriptTimeZone();
    var isMgr = false;
    if (role) {
      var rClean = role.toString().trim().toLowerCase();
      isMgr = rClean === "manager" || rClean === "admin" || rClean === "operation";
    }
    if (!isMgr && agentId) {
      isMgr = isUserAdminOrManager(agentId);
    }
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      if (!isMgr && (data[i][6] || "").toString() !== agentId.toString()) continue;

      var rowDate = data[i][1] ? safeFormatDate(data[i][1], tz, "yyyy-MM-dd") : "";

      leads.push({
        id: (data[i][0] || "").toString(),
        name: data[i][2] || "",
        phone: formatEgyptianPhone(data[i][3]),
        course: data[i][5] || "",
        agent: data[i][7] || "",
        status: data[i][8] || "",      // Action (Col I)
        lastAction: data[i][8] || "",      // Action (Col I)
        notes: (data[i][9] || "").toString().split("\n").filter(function (l) { return l.trim(); }), // Notes (Col J)
        fuDate: data[i][10] ? safeFormatDate(data[i][10], tz, "yyyy-MM-dd") : "", // fuDate (Col K)
        createdAt: rowDate
      });
    }
    return leads.reverse();
  } catch (e) {
    return [];
  }
}

// ==========================================
// ROUNDS - Add Member & Get Detail
// ==========================================
function findClientForRoundPull(phone) {
  try {
    if (!phone) return { success: false, message: "رقم الهاتف فارغ" };
    var query = sanitizePhoneForSearch(phone);
    if (!query) return { success: false, message: "رقم هاتف غير صالح" };

    var finSh = getSheet("Financial_Data");
    if (!finSh) return { success: false, message: "شيت الحسابات غير موجود" };

    var finData = finSh.getDataRange().getValues();
    var foundClient = null;

    for (var i = 1; i < finData.length; i++) {
      var type = (finData[i][4] || "").toString().trim().toLowerCase();
      if (type !== "client") continue;

      var clientPhone = (finData[i][8] || "").toString().trim();
      if (!clientPhone) continue;

      var phones = clientPhone.split(" - ");
      var match = false;
      for (var pIdx = 0; pIdx < phones.length; pIdx++) {
        var sanitized = sanitizePhoneForSearch(phones[pIdx]);
        if (sanitized && (sanitized === query || sanitized.indexOf(query) !== -1 || query.indexOf(sanitized) !== -1)) {
          match = true;
          break;
        }
      }

      if (match) {
        var ocCodeVal = (finData[i][6] || "").toString().trim();
        var nameVal = (finData[i][7] || "").toString().trim();
        var courseVal = (finData[i][9] || "").toString().trim();
        var actionVal = (finData[i][5] || "").toString().trim();
        var priceVal = parseFloat(finData[i][14]) || 0;
        var paidVal = parseFloat(finData[i][15]) || 0;
        var methodVal = (finData[i][12] || "").toString().trim();
        var attendanceVal = finData[i][11]; // date
        var tz = "GMT";
        try { tz = Session.getScriptTimeZone() || "GMT"; } catch(e){}
        var attendanceStr = "";
        if (attendanceVal) {
          if (attendanceVal instanceof Date) {
            attendanceStr = Utilities.formatDate(attendanceVal, tz, "yyyy-MM-dd");
          } else {
            attendanceStr = attendanceVal.toString();
          }
        }

        foundClient = {
          ocCode: ocCodeVal,
          name: nameVal,
          phone: formatEgyptianPhone(clientPhone),
          course: courseVal,
          action: actionVal,
          price: priceVal,
          paid: paidVal,
          method: methodVal,
          attendance: attendanceStr,
          agentId:   (finData[i][0] || "").toString().trim(),
          agentName: (finData[i][1] || "").toString().trim(),
          rowIndex: i + 1,
          foundIn: "Financial_Data"
        };
        break;
      }
    }

    if (foundClient) {
      // Check if there is an existing payment record in Client_Payments
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = cpSh.getDataRange().getValues();
        var finalOcCode = ensureOcCode(foundClient.ocCode, "", foundClient.phone, foundClient.name);
        for (var j = 1; j < cpData.length; j++) {
          var ocVal = (cpData[j][1] || "").toString().trim();
          var nameVal = (cpData[j][2] || "").toString().trim().toLowerCase();
          if (ocEq(ocVal, finalOcCode) || (nameVal && nameVal === foundClient.name.toLowerCase().trim())) { // FIX-07
            foundClient.payId = cpData[j][0] || "";
            foundClient.price = parseFloat(cpData[j][6]) || foundClient.price;
            foundClient.paid = parseFloat(cpData[j][9]) || foundClient.paid;
            
            var tz = "GMT";
            try { tz = Session.getScriptTimeZone() || "GMT"; } catch(e){}
            
            var nextDueVal = cpData[j][11];
            foundClient.nextDueDate = "";
            if (nextDueVal) {
              if (nextDueVal instanceof Date) {
                foundClient.nextDueDate = Utilities.formatDate(nextDueVal, tz, "yyyy-MM-dd");
              } else {
                foundClient.nextDueDate = nextDueVal.toString();
              }
            }

            foundClient.inst1 = parseFloat(cpData[j][15]) || 0;
            foundClient.inst2 = parseFloat(cpData[j][16]) || 0;
            foundClient.inst3 = parseFloat(cpData[j][17]) || 0;
            break;
          }
        }
      }
      return { success: true, client: foundClient };
    }

    return { success: false, message: "لم يتم العثور على أي عميل بهذا الرقم في حسابات السيلز" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function sanitizePhoneForSearch(phone) {
  if (!phone) return "";
  var p = phone.toString().replace(/[\s\-\+\(\)]/g, "");
  if (p.startsWith("20")) p = p.substring(2);
  if (p.startsWith("0")) p = p.substring(1);
  return p;
}

function addRoundMember(roundId, memberData) {
  try {
    var sh = getSheet("Round_Members");
    if (!sh) {
      getMaster().insertSheet("Round_Members");
      sh = getSheet("Round_Members");
      sh.appendRow(["RoundID", "OC_Code", "Name", "Phone", "Action", "Price", "Paid", "Method", "Attendance", "AgentID", "AgentName", "CreatedAt"]);
      sh.getRange(1, 1, 1, 12).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    }
    
    // Deduplication check: check if the client is already added to this round
    // IMPORTANT: only dedup by OC code when ocCode is non-empty — idsMatch("","") returns true and causes false dedup
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === (roundId || "").toString().trim() &&
          ocEq(data[i][1], memberData.ocCode)) { // FIX-07: ocKey-normalized OC join
        return { success: true, message: "✅ العميل مسجل في هذا الراوند بالفعل" };
      }
    }

    var finalOcCode = ensureOcCode(memberData.ocCode, "", memberData.phone, memberData.name);
    // If no OC code found, leave empty — do NOT fall back to clientId (different concept)
    if (finalOcCode === "—" || finalOcCode === "-" || finalOcCode === "null" || finalOcCode === "undefined") {
      finalOcCode = "";
    }
    sh.appendRow([
      roundId, finalOcCode, memberData.name, formatEgyptianPhone(memberData.phone) || "",
      memberData.action || "New", memberData.price || 0, memberData.paid || 0,
      memberData.method || "Cash", memberData.attendance || "",
      memberData.agentId, memberData.agentName, new Date()
    ]);
    
    // Update enrolled count — wrapped in try-catch so Client_Payments sync always runs even if Rounds sheet is unavailable
    var roundName = "";
    try {
      var rsh = getSheet("Rounds");
      if (rsh) {
        var rdata = rsh.getDataRange().getValues();
        for (var i = 1; i < rdata.length; i++) {
          if ((rdata[i][0] || "").toString() === roundId.toString()) {
            roundName = rdata[i][1] || "";
            rsh.getRange(i + 1, 6).setValue((rdata[i][5] || 0) + 1);
            break;
          }
        }
      }
    } catch (roundsErr) { Logger.log("addRoundMember — Rounds sheet update failed: " + roundsErr.toString()); }

    // 1. Update Pulled client details in Financial_Data (status and attendance date)
    if (memberData.pulledRowIndex) {
      try {
        var finSh = getSheet("Financial_Data");
        if (finSh) {
          var rIdx = parseInt(memberData.pulledRowIndex);
          if (rIdx > 1 && rIdx <= finSh.getLastRow()) {
            var rowVals = finSh.getRange(rIdx, 1, 1, 12).getValues()[0];
            var rowType = (rowVals[4] || "").toString().trim().toLowerCase();
            if (rowType === "client") {
              // Update status/action in Column 6 (index 5)
              finSh.getRange(rIdx, 6).setValue(memberData.action || "Round");
              // Update attendance in Column 12 (index 11)
              if (memberData.attendance) {
                finSh.getRange(rIdx, 12).setValue(new Date(memberData.attendance));
              } else {
                finSh.getRange(rIdx, 12).setValue("");
              }
            }
          }
        }
      } catch (finErr) { }
    }

    // 2. Sync / Create / Update record in Client_Payments
    try {
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = cpSh.getDataRange().getValues();
        var existingRow = -1;
        for (var k = 1; k < cpData.length; k++) {
          var ocVal = (cpData[k][1] || "").toString().trim();
          // Match by OC code only — name matching removed to prevent data mixing
          if (ocEq(ocVal, finalOcCode)) { // FIX-07: ocKey-normalized OC join
            existingRow = k + 1;
            break;
          }
        }

        var price = parseFloat(memberData.price) || 0;
        var paid = parseFloat(memberData.paid) || 0;
        var rem = price - paid;
        var nextDue = memberData.nextDueDate ? new Date(memberData.nextDueDate) : "";
        var status = rem <= 0 ? "Paid" : "Installment";

        if (existingRow !== -1) {
          // Update existing payment record
          cpSh.getRange(existingRow, 5).setValue(roundId || "");
          cpSh.getRange(existingRow, 6).setValue(roundName || "");
          cpSh.getRange(existingRow, 7).setValue(price);
          cpSh.getRange(existingRow, 10).setValue(paid);
          cpSh.getRange(existingRow, 11).setValue(rem < 0 ? 0 : rem);
          cpSh.getRange(existingRow, 12).setValue(nextDue);
          cpSh.getRange(existingRow, 13).setValue(status);
          
          // Update installments columns (Column 16, 17, 18)
          if (rem > 0) {
            cpSh.getRange(existingRow, 16).setValue(parseFloat(memberData.inst1) || paid);
            cpSh.getRange(existingRow, 17).setValue(parseFloat(memberData.inst2) || 0);
            cpSh.getRange(existingRow, 18).setValue(parseFloat(memberData.inst3) || 0);
          } else {
            cpSh.getRange(existingRow, 16).setValue(price);
            cpSh.getRange(existingRow, 17).setValue(0);
            cpSh.getRange(existingRow, 18).setValue(0);
          }
          
          try {
            syncClientPaymentToLedger(cpData[existingRow - 1][0]);
          } catch (ledgErr) { }
        } else {
          // Create a new payment record
          var courseName = memberData.course || "";
          if (!courseName && memberData.pulledRowIndex) {
            try {
              var finSh = getSheet("Financial_Data");
              courseName = finSh.getRange(parseInt(memberData.pulledRowIndex), 10).getValue() || "";
            } catch(e) {}
          }
          addClientPayment(
            finalOcCode, memberData.name, memberData.phone || "", courseName, roundId, roundName, price,
            memberData.agentId, memberData.agentName, paid, memberData.nextDueDate,
            "تمت الإضافة عبر مجموعات الراوندات",
            memberData.inst1 || paid, memberData.inst2 || 0, memberData.inst3 || 0,
            memberData.inst1Date, memberData.inst2Date, memberData.inst3Date
          );
        }
      }
    } catch (paymentErr) { }

    SpreadsheetApp.flush();
    invalidateRoundsCache(); // FIX-19: invalidate stale seat-count cache after enroll
    logActivity(memberData.agentId, memberData.agentName, "ADD_ROUND_MEMBER", memberData.name + " → Round " + roundId);
    return { success: true, message: "✅ تم إضافة العميل للراوند وتحديث الحسابات والأقساط" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function getRoundDetail(roundId) {
  try {
    // Skip recalculate here — getRounds() already handles it on cache miss
    // try { recalculateRoundsEnrolled(); } catch (e) { }
    var tz = "GMT";
    try {
      tz = Session.getScriptTimeZone() || "GMT";
    } catch (tzErr) { }

    var rsh = getSheet("Rounds"), rdata = rsh.getDataRange().getValues();
    var roundInfo = null;
    for (var i = 1; i < rdata.length; i++) {
      if ((rdata[i][0] || "").toString() === roundId.toString()) {
        roundInfo = {
          id: rdata[i][0].toString(), name: rdata[i][1] || "",
          startDate: rdata[i][2] ? safeFormatDate(rdata[i][2], tz, "yyyy-MM-dd") : "",
          schedule: rdata[i][3] || "", maxSeats: rdata[i][4] || 15, enrolled: rdata[i][5] || 0,
          status: rdata[i][6] || "Active", type: rdata[i][8] || "Online"
        };
        break;
      }
    }
    if (!roundInfo) return null;

    var msh = getSheet("Round_Members");
    if (!msh) { roundInfo.members = []; return roundInfo; }
    var mdata = msh.getDataRange().getValues();
    var members = [];
    for (var j = 1; j < mdata.length; j++) {
      if ((mdata[j][0] || "").toString() === roundId.toString()) {
        members.push({
          ocCode: mdata[j][1] || "",
          name: mdata[j][2] || "",
          phone: mdata[j][3] || "",
          action: mdata[j][4] || "New",
          price: parseFloat(mdata[j][5]) || 0,
          paid: parseFloat(mdata[j][6]) || 0,
          method: mdata[j][7] || "",
          attendance: mdata[j][8] ? safeFormatDate(mdata[j][8], tz, "yyyy-MM-dd") : "",
          agentName: mdata[j][10] || ""
        });
      }
    }
    roundInfo.members = members;
    return roundInfo;
  } catch (e) {
    return null;
  }
}

// ==========================================
// FINANCIAL STATEMENT
// ==========================================
function initFinancialSheet() {
  if (_finSheetInitialized) return; // skip after first call — headers don't change mid-execution
  var sh = getSheet("Financial_Data");
  if (!sh) {
    getMaster().insertSheet("Financial_Data");
    sh = getSheet("Financial_Data");
    sh.appendRow(["AgentID", "AgentName", "Month", "Year", "Type", "Action", "OC_Code", "Name", "Phone", "Course", "Reservation", "Attendance", "Method", "Offer", "Price", "Paid", "CreatedAt", "ClientType", "Campaign_Type"]);
    sh.getRange(1, 1, 1, 19).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    _finSheetInitialized = true;
    return;
  }
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var phoneIdx = headers.indexOf("Phone");
  if (phoneIdx === -1) {
    sh.insertColumnBefore(9);
    sh.getRange(1, 9).setValue("Phone");
    sh.getRange(1, 1, 1, 17).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      var range = sh.getRange(2, 1, lastRow - 1, 17);
      var values = range.getValues();
      for (var i = 0; i < values.length; i++) {
        var type = (values[i][4] || "").toString().trim().toLowerCase();
        if (type === "payment") {
          values[i][8] = values[i][9];
          values[i][9] = "";
        }
      }
      range.setValues(values);
    }
    // Reload headers after modifications
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }
  
  var clientTypeIdx = headers.indexOf("ClientType");
  if (clientTypeIdx === -1) {
    var lastCol = sh.getLastColumn();
    sh.insertColumnAfter(lastCol);
    sh.getRange(1, lastCol + 1).setValue("ClientType");
    sh.getRange(1, 1, 1, lastCol + 1).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    // Reload headers
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }
  var campaignTypeIdx = headers.indexOf("Campaign_Type");
  if (campaignTypeIdx === -1) {
    var lastCol2 = sh.getLastColumn();
    sh.insertColumnAfter(lastCol2);
    sh.getRange(1, lastCol2 + 1).setValue("Campaign_Type");
    sh.getRange(1, 1, 1, lastCol2 + 1).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
  }
  _finSheetInitialized = true; // mark as done — skip on subsequent calls this execution
}

function fillMissingFinancialCampaignTypes() {
  try {
    var finSh = getSheet("Financial_Data");
    var rawSh = getSheet("Raw_Data");
    if (!finSh || !rawSh) return { resolved: 0, stillUnresolved: 0 };

    var finData = finSh.getDataRange().getValues();
    if (finData.length <= 1) return { resolved: 0, stillUnresolved: 0 };
    
    var rawData = rawSh.getDataRange().getValues();
    
    // Build lookup maps from Raw_Data
    var phoneToCampaign = {};
    var nameToCampaign = {};
    
    for (var r = 1; r < rawData.length; r++) {
      var phone = (rawData[r][3] || "").toString().trim();
      var name = (rawData[r][2] || "").toString().trim().toLowerCase();
      var campaign = (rawData[r][12] || "").toString().trim();
      if (campaign && campaign.toLowerCase().indexOf("oc-") !== 0) {
        if (phone) {
          var splitPhones = phone.split("-").map(function(p) { return cleanPhone(p); }).filter(function(p) { return p; });
          splitPhones.forEach(function(sp) {
            phoneToCampaign[sp] = campaign;
          });
        }
        if (name) nameToCampaign[name] = campaign;
      }
    }
    
    var updated = false, resolved = 0, stillUnresolved = 0;
    // We only need to write to Column S (index 18)
    var colSValues = finSh.getRange(1, 19, finData.length, 1).getValues();

    for (var f = 1; f < finData.length; f++) {
      var type = (finData[f][4] || "").toString().trim().toLowerCase();
      if (type !== "client") continue;

      var currentCampaign = (colSValues[f][0] || "").toString().trim();
      if (!currentCampaign || currentCampaign === "" || currentCampaign === "—") {
        var phone = (finData[f][8] || "").toString().trim();
        var name = (finData[f][7] || "").toString().trim().toLowerCase();

        var foundCampaign = "";
        if (phone) {
          var splitPhones = phone.split("-").map(function(p) { return cleanPhone(p); }).filter(function(p) { return p; });
          for (var pIdx = 0; pIdx < splitPhones.length; pIdx++) {
            if (phoneToCampaign[splitPhones[pIdx]]) {
              foundCampaign = phoneToCampaign[splitPhones[pIdx]];
              break;
            }
          }
        }
        if (!foundCampaign && name && nameToCampaign[name]) {
          foundCampaign = nameToCampaign[name];
        }

        if (foundCampaign) {
          colSValues[f][0] = foundCampaign;
          updated = true;
          resolved++;
        } else {
          stillUnresolved++;
          if (currentCampaign !== "—") {
            colSValues[f][0] = "—";
            updated = true;
          }
        }
      }
    }

    if (updated) {
      finSh.getRange(1, 19, finData.length, 1).setValues(colSValues);
    }
    return { resolved: resolved, stillUnresolved: stillUnresolved };
  } catch (e) {
    Logger.log("Error in fillMissingFinancialCampaignTypes: " + e.toString());
    return { resolved: 0, stillUnresolved: 0, error: e.toString() };
  }
}

// Manual admin-triggered re-sync (2026-07-06): the auto-fill above only ever ran as a side-effect of
// adding a NEW financial client, so a row whose campaign lookup failed at creation time (e.g. Raw_Data's
// Campaign_Type wasn't filled in yet at that moment) stayed stuck on "—" forever unless someone
// happened to add another client later. This lets an admin force a full re-scan/re-match on demand
// instead of having to open the sheet and fix it by hand.
function syncFinancialCampaignTypes(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح." };
  var r = fillMissingFinancialCampaignTypes();
  if (r && r.error) return { success: false, message: "خطأ: " + r.error };
  var msg = "✅ تمت المزامنة — تم حل " + (r.resolved || 0) + " صف";
  if (r && r.stillUnresolved) msg += "، وفضل " + r.stillUnresolved + " صف من غير كامبين معروف في Raw_Data (يحتاج مراجعة يدوية لبيانات العميل نفسه)";
  msg += ".";
  return { success: true, message: msg, resolved: r.resolved || 0, stillUnresolved: r.stillUnresolved || 0 };
}

// MONTH-FREEZE (2026-07-06): once a month is no longer the current calendar month, its "الحسابات
// الشهرية" totals must never change again, no matter how many old-client installments get logged
// later (those correctly count toward the NEW month instead — this only freezes what a CLOSED
// month's own numbers were). Mechanism: the full (unfiltered, all-agents) {clients,payments} for a
// month is snapshotted into Financial_Month_Snapshots the first time that month is queried AFTER it
// stops being the current month — from then on, that month is always served from the frozen
// snapshot, never recomputed live. The CURRENT month is always recomputed live (and its snapshot kept
// in sync) since it's still "open". agentId/isManager filtering is applied AFTER retrieving the
// (live or frozen) full data, so every viewer — manager or a specific sales agent — sees a
// consistently filtered slice of the exact same frozen figures for a closed month.
var FIN_SNAPSHOT_SHEET = 'Financial_Month_Snapshots';
function _getOrCreateFinSnapshotSheet() {
  var sh = getSheet(FIN_SNAPSHOT_SHEET);
  if (!sh) {
    getMaster().insertSheet(FIN_SNAPSHOT_SHEET);
    sh = getSheet(FIN_SNAPSHOT_SHEET);
    sh.appendRow(['MonthKey', 'DataJSON', 'SnapshotAt']);
    sh.getRange(1, 1, 1, 3).setBackground('#3d2a1e').setFontColor('#fff').setFontWeight('bold');
  }
  return sh;
}
function _readFinSnapshot(monthKey) {
  try {
    var sh = _getOrCreateFinSnapshotSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString() === monthKey) {
        return JSON.parse(data[i][1]);
      }
    }
  } catch (e) {}
  return null;
}
function _writeFinSnapshot(monthKey, fullData) {
  try {
    var sh = _getOrCreateFinSnapshotSheet();
    var data = sh.getDataRange().getValues();
    var json = JSON.stringify(fullData);
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString() === monthKey) {
        sh.getRange(i + 1, 2).setValue(json);
        sh.getRange(i + 1, 3).setValue(new Date());
        return;
      }
    }
    sh.appendRow([monthKey, json, new Date()]);
  } catch (e) {}
}

// REPAIR TOOL (2026-07-06): cleans up the duplicate rows the race-condition bug above left behind —
// removes (a) every row for the REAL current month (never needed going forward, since the current
// month is now always computed live and never snapshotted), and (b) any duplicate rows for the SAME
// past month, keeping only the most recently-written one. Safe to run any time; a clean sheet is a
// no-op.
function cleanupFinancialSnapshotDuplicates(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح." };
  try {
    var sh = getSheet(FIN_SNAPSHOT_SHEET);
    if (!sh) return { success: true, message: "لا يوجد شيت Financial_Month_Snapshots بعد — لا شيء لتنظيفه.", removed: 0 };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: true, message: "الشيت فاضي بالفعل.", removed: 0 };

    var now = new Date();
    var curMonthKey = now.getFullYear() + '-' + (now.getMonth() + 1);

    // Keep only the LAST (most recent SnapshotAt) row per MonthKey, and drop the current month
    // entirely — scan bottom-up so the first occurrence we keep per key is the most recent one.
    var seen = {};
    var rowsToDelete = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var key = (data[i][0] || '').toString();
      if (!key || key === curMonthKey || seen[key]) {
        rowsToDelete.push(i + 1); // 1-based row index
      } else {
        seen[key] = true;
      }
    }
    // Delete from the bottom up so earlier indices stay valid as rows are removed.
    rowsToDelete.sort(function (a, b) { return b - a; });
    rowsToDelete.forEach(function (r) { sh.deleteRow(r); });

    return { success: true, message: "✅ اتشال " + rowsToDelete.length + " صف مكرر/غير محتاج.", removed: rowsToDelete.length };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function getFinancialData(agentId, agentName, month, year, isManager) {
  var now = new Date();
  var realCurMonth = now.getMonth() + 1, realCurYear = now.getFullYear();
  var monthKey = year + '-' + month;
  var isCurrentMonth = (parseInt(month) === realCurMonth && parseInt(year) === realCurYear);

  var fullData;
  if (isCurrentMonth) {
    // BUG FIX (2026-07-06): this used to ALSO write a snapshot for the current (still "open") month
    // on every single view, with no lock around the read-check-write — every concurrent page load
    // (or even just repeated normal visits) raced past the "does a row already exist?" check and each
    // appended its OWN duplicate row, filling Financial_Month_Snapshots with dozens of rows all for
    // the SAME current month (which never even gets read back — only PAST months are). The current
    // month is always computed live anyway, so it never needed a persisted snapshot in the first
    // place; removed entirely. Freezing now only ever happens for a month that's genuinely CLOSED
    // (see the else branch below), which is visited far less often and is now lock-protected too.
    fullData = _computeFinancialDataFull(month, year);
  } else {
    fullData = _readFinSnapshot(monthKey);
    if (!fullData) {
      // First time this now-past month has ever been viewed since it closed — compute once and
      // freeze it permanently from this point on. Locked so two near-simultaneous first-views of the
      // same newly-closed month can't both pass the "no snapshot yet" check and each write their own
      // duplicate row.
      var _snapLock = LockService.getScriptLock();
      try {
        _snapLock.waitLock(10000);
        fullData = _readFinSnapshot(monthKey); // re-check inside the lock — another request may have just written it
        if (!fullData) {
          fullData = _computeFinancialDataFull(month, year);
          _writeFinSnapshot(monthKey, fullData);
        }
      } finally {
        try { _snapLock.releaseLock(); } catch (rle) {}
      }
    }
  }

  var clients = (fullData.clients || []).filter(function (c) {
    if (isManager) return true;
    var matchesAgent = false;
    if (agentId && c.agentId) matchesAgent = matchesAgent || c.agentId.toString().trim() === agentId.toString().trim();
    if (agentName && c.agentName) matchesAgent = matchesAgent || c.agentName.toString().trim().toLowerCase() === agentName.toString().trim().toLowerCase();
    return matchesAgent;
  });
  var payments = (fullData.payments || []).filter(function (p) {
    if (isManager) return true;
    var matchesAgent = false;
    if (agentId && p.agentId) matchesAgent = matchesAgent || p.agentId.toString().trim() === agentId.toString().trim();
    if (agentName && p.agentName) matchesAgent = matchesAgent || p.agentName.toString().trim().toLowerCase() === agentName.toString().trim().toLowerCase();
    return matchesAgent;
  });

  // salesTargets/defaultTarget are current admin SETTINGS, not month data — always fresh, never frozen.
  var salesTargets = getSystemSetting("salesTargets", "{}");
  var defaultTarget = getSystemSetting("targetPerAgent", "50000");
  return { clients: clients, payments: payments, salesTargets: salesTargets, defaultTarget: defaultTarget };
}

// The original getFinancialData body, unchanged except: no agentId/agentName/isManager params and no
// per-row agent filtering — always returns the FULL month's data (every agent), which the wrapper
// above then filters AFTER retrieving (live or frozen). This is what actually gets snapshotted.
function _computeFinancialDataFull(month, year) {
  try {
    initFinancialSheet();
    // fillMissingFinancialCampaignTypes is no longer called here (was reading 2 full sheets on every page load).
    // It now runs only after addFinancialClient() — which is the only time new data needs campaign-type filling.
    var sh = getSheet("Financial_Data");
    if (!sh) return { clients: [], payments: [] };
    var data = sh.getDataRange().getValues();
    var clients = [], payments = [];
    var timeZone = "GMT";
    try {
      timeZone = Session.getScriptTimeZone() || "GMT";
    } catch (e) { }

    function formatDateStr(val) {
      if (!val) return "";
      if (val instanceof Date) {
        if (isNaN(val.getTime())) return "";
        try {
          return Utilities.formatDate(val, timeZone, "yyyy-MM-dd");
        } catch (e) {
          var y = val.getFullYear();
          var m = ("0" + (val.getMonth() + 1)).slice(-2);
          var d = ("0" + val.getDate()).slice(-2);
          return y + "-" + m + "-" + d;
        }
      }
      var str = val.toString().trim();
      if (str.indexOf("GMT") !== -1 || str.indexOf("UTC") !== -1) {
        try {
          var dt = new Date(str);
          if (!isNaN(dt.getTime())) {
            var y = dt.getFullYear();
            var m = ("0" + (dt.getMonth() + 1)).slice(-2);
            var d = ("0" + dt.getDate()).slice(-2);
            return y + "-" + m + "-" + d;
          }
        } catch (err) { }
      }
      return str;
    }

    // Pre-load transactions and client payments to lookup initial paid amount
    function isPlaceholder(val) {
      if (!val) return true;
      var s = val.toString().trim().toLowerCase();
      return s === "" || s === "—" || s === "-" || s === "null" || s === "undefined";
    }

    var initialPaidMap = {};
    var nameCourseToPayId = {};
    var ocToPayId = {};
    var cpRoundNameMap = {};
    // Declare outside try so references below (inside if-guards) are safe even if try throws
    var cpSh = null;
    var cpData = null;
    var txData = null;
    // Normalize OC code: remove "OC-" prefix and leading zeros for consistent matching
    function normalizeOc(oc) {
      return ocKey(oc); // FIX-07: delegate to canonical ocKey
    }

    try {
      cpSh = getSheet("Client_Payments");
      var txSh = getSheet("Payment_Transactions");
      if (cpSh && txSh) {
        cpData = getSheetDataCached("Client_Payments");      // use request-level cache
        txData = getSheetDataCached("Payment_Transactions"); // use request-level cache

        for (var cp = 1; cp < cpData.length; cp++) {
          var cpId = cpData[cp][0];
          var cpOc = (cpData[cp][1] || "").toString().trim();
          var cpName = (cpData[cp][2] || "").toString().trim().toLowerCase();
          var cpCourse = (cpData[cp][3] || "").toString().trim().toLowerCase();
          var cpRoundName = (cpData[cp][5] || "").toString().trim();

          if (cpId) {
            if (!isPlaceholder(cpOc)) {
              ocToPayId[cpOc] = cpId;                        // exact
              ocToPayId[normalizeOc(cpOc)] = cpId;           // normalized fallback
              cpRoundNameMap[cpOc] = cpRoundName;
              cpRoundNameMap[normalizeOc(cpOc)] = cpRoundName;
            }
            if (!isPlaceholder(cpName) && !isPlaceholder(cpCourse)) {
              nameCourseToPayId[cpName + "_" + cpCourse] = cpId;
            }
          }
        }
        
        // Map from payId to first payment amount
        var payIdToFirstPay = {};
        for (var tx = 1; tx < txData.length; tx++) {
          var txPayId = txData[tx][1];
          var txType = txData[tx][5];
          var txAmt = parseFloat(txData[tx][3]) || 0;
          if (txPayId && txType === "أول دفعة") {
            payIdToFirstPay[txPayId] = txAmt;
          }
        }
        
        // Build initialPaidMap from both ocCode and Name + Course
        for (var cp = 1; cp < cpData.length; cp++) {
          var cpId = cpData[cp][0];
          var cpOc = (cpData[cp][1] || "").toString().trim();
          var cpName = (cpData[cp][2] || "").toString().trim().toLowerCase();
          var cpCourse = (cpData[cp][3] || "").toString().trim().toLowerCase();
          
          var initialPaid = payIdToFirstPay[cpId] !== undefined ? payIdToFirstPay[cpId] : 0;
          
          if (!isPlaceholder(cpOc)) {
            initialPaidMap[cpOc] = initialPaid;
          }
          if (!isPlaceholder(cpName) && !isPlaceholder(cpCourse)) {
            initialPaidMap[cpName + "_" + cpCourse] = initialPaid;
          }
        }
      }
    } catch (preloadErr) { }

    // Build payId → cp row lookup map (avoids O(n²) inner loops below)
    var payIdToRow = {};
    if (cpData) {
      for (var cpx = 1; cpx < cpData.length; cpx++) {
        var cpxId = (cpData[cpx][0] || "").toString();
        if (cpxId) payIdToRow[cpxId] = cpData[cpx];
      }
    }

    for (var i = 1; i < data.length; i++) {
      if (!data[i] || data[i].length < 5) continue;

      // NOTE: agent filtering used to happen right here — it now happens in the getFinancialData
      // wrapper AFTER retrieving this full (unfiltered, all-agents) month data, so the exact same
      // frozen figures can be filtered consistently for any viewer (manager or a specific agent).

      var type = (data[i][4] || "").toString().trim().toLowerCase();
      if (type !== "client" && type !== "payment") continue;

      var rowMonth = parseInt((data[i][2] || "").toString().trim());
      var rowYear = parseInt((data[i][3] || "").toString().trim());
      if (isNaN(rowMonth) || isNaN(rowYear)) continue;
      if (rowMonth !== month || rowYear !== year) continue;

      if (type === "client") {
        var price = parseFloat(data[i][14]) || 0; // index 14 (Column 15, Price)
        var paid = parseFloat(data[i][15]) || 0; // index 15 (Column 16, Paid)
        
        var ocCodeVal = (data[i][6] || "").toString().trim();
        var nameVal = (data[i][7] || "").toString().trim().toLowerCase();
        var courseVal = (data[i][9] || "").toString().trim().toLowerCase();
        var nameKey = nameVal + "_" + courseVal;
        
        var initialPaid = paid;
        if (!isPlaceholder(ocCodeVal) && initialPaidMap[ocCodeVal] !== undefined) {
          initialPaid = initialPaidMap[ocCodeVal];
        } else if (!isPlaceholder(nameVal) && !isPlaceholder(courseVal) && initialPaidMap[nameKey] !== undefined) {
          initialPaid = initialPaidMap[nameKey];
        }
        
        var payId = "";
        var roundIdVal = "";
        var roundNameVal = "";
        
        var ocLookupKey = (!isPlaceholder(ocCodeVal) && ocToPayId[ocCodeVal] !== undefined)
          ? ocCodeVal
          : (!isPlaceholder(ocCodeVal) && ocToPayId[normalizeOc(ocCodeVal)] !== undefined ? normalizeOc(ocCodeVal) : null);
        if (ocLookupKey !== null) {
          payId = ocToPayId[ocLookupKey];
          roundNameVal = cpRoundNameMap[ocLookupKey] || "";
        } else if (!isPlaceholder(nameVal) && !isPlaceholder(courseVal) && nameCourseToPayId[nameKey] !== undefined) {
          payId = nameCourseToPayId[nameKey];
          // Use O(1) lookup map instead of inner loop
          var cpRowByName = payId ? payIdToRow[payId.toString()] : null;
          if (cpRowByName) roundNameVal = cpRowByName[5] || "";
        }

        // Find roundIdVal using payId — O(1) lookup
        if (payId) {
          var cpRowById = payIdToRow[payId.toString()];
          if (cpRowById) roundIdVal = (cpRowById[4] || "").toString().trim();
        }

        // ── Auto-resolve action: if empty and no round assigned → "Wait" ──
        var rawAction = (data[i][5] || "").toString().trim();
        if (!rawAction || rawAction === "New") {
          // Check Client_Payments: if no roundId assigned, treat as Wait — O(1) lookup
          var cpRoundCheck = "";
          if (payId) {
            var cpRowForAction = payIdToRow[payId.toString()];
            if (cpRowForAction) cpRoundCheck = (cpRowForAction[4] || "").toString().trim();
          }
          rawAction = (cpRoundCheck && cpRoundCheck !== "" && cpRoundCheck !== "Wait") ? "Round" : "Wait";
        }

        clients.push({
          agentId: (data[i][0] || "").toString().trim(),
          agentName: (data[i][1] || "").toString().trim(),
          action: rawAction,
          clientType: data[i][17] || "", // Col 18 (index 17) is ClientType
          campaignType: data[i][18] || "", // Col 19 (index 18) is Campaign_Type
          ocCode: ocCodeVal,
          name: data[i][7] || "",
          phone: data[i][8] || "",              // index 8 (Column 9, Phone)
          course: data[i][9] || "",              // index 9 (Column 10, Course)
          reservation: formatDateStr(data[i][10]),  // index 10 (Column 11, Reservation)
          attendance: formatDateStr(data[i][11]),  // index 11 (Column 12, Attendance)
          method: data[i][12] || "",              // index 12 (Column 13, Method)
          offer: data[i][13] || 0,               // index 13 (Column 14, Offer)
          price: price,
          paid: paid,
          initialPaid: initialPaid,
          unpaid: Math.max(0, price - paid),
          payId: payId,
          roundId: roundIdVal,
          roundName: roundNameVal,
          rowIndex: i + 1
        });
      } else if (type === "payment") {
        payments.push({
          agentId: (data[i][0] || "").toString().trim(),
          agentName: (data[i][1] || "").toString().trim(),
          ocCode: data[i][6] || "",
          name: data[i][7] || "",
          phone: data[i][8] || "",              // index 8 (Column 9, Phone)
          amount: parseFloat(data[i][15]) || 0, // index 15 (Column 16, Amount/Paid)
          date: formatDateStr(data[i][10]), // index 10 (Column 11, Date)
          rowIndex: i + 1
        });
      }
    }
    var salesTargets = getSystemSetting("salesTargets", "{}");
    var defaultTarget = getSystemSetting("targetPerAgent", "50000");
    return { 
      clients: clients, 
      payments: payments, 
      salesTargets: salesTargets, 
      defaultTarget: defaultTarget 
    };
  } catch (e) {
    return { clients: [], payments: [] };
  }
}

function addFinancialClient(agentId, agentName, month, year, clientData) {
  try {
    initFinancialSheet();
    var sh = getSheet("Financial_Data");
    // Use phone+id based lookup only (not name) to prevent wrong OC code matching
    // Do NOT fall back to clientId if no OC code found — leave empty so it doesn't confuse data
    var finalOcCode = ensureOcCode(clientData.ocCode, clientData.clientId || "", clientData.phone || "", "");
    if (!finalOcCode || finalOcCode.toString().indexOf("OC-") === -1) {
      // Fallback: allow name match only if we already have ocCode starting with OC-
      if (clientData.ocCode && clientData.ocCode.toString().trim().toLowerCase().indexOf("oc-") === 0) {
        finalOcCode = clientData.ocCode;
      } else {
        // Try with name — but still do NOT fall back to clientId
        finalOcCode = ensureOcCode(clientData.ocCode, clientData.clientId || "", clientData.phone || "", clientData.name) || "";
      }
    }

    // Deduplication check: check if this client is already in the Financial_Data sheet for this month/year
    // IMPORTANT: only dedup when finalOcCode is non-empty — idsMatch("","") returns true and causes false dedup
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (finalOcCode &&
          (data[i][0] || "").toString().trim() === agentId.toString().trim() &&
          (data[i][2] || "").toString().trim() === month.toString().trim() &&
          (data[i][3] || "").toString().trim() === year.toString().trim() &&
          (data[i][4] || "").toString().trim() === "client" &&
          ocEq(data[i][6], finalOcCode)) { // FIX-07: ocKey-normalized OC join
        // Row already exists — if Action column is empty or "New", write the correct action now
        var existingAction = (data[i][5] || "").toString().trim();
        if (!existingAction || existingAction === "New") {
          var targetAction = (clientData.action || "Wait").toString().trim();
          sh.getRange(i + 1, 6).setValue(targetAction);
          SpreadsheetApp.flush();
        }
        return { success: true, message: "✅ العميل مسجل في الحسابات المالية بالفعل" };
      }
    }

    // Campaign type: must be the SOURCE/TYPE of the ad (Digital marketing, Facebook, etc.)
    // NOT the round name. Round name goes in the roundName column only.
    var campaignTypeVal = (clientData.campaignType || "").toString().trim();
    if (!campaignTypeVal) {
      try {
        var rawSh = getSheet("Raw_Data");
        if (rawSh) {
          var rawData = getSheetDataCached("Raw_Data");
          for (var r = 1; r < rawData.length; r++) {
            var rowPhone = (rawData[r][3] || "").toString().trim();
            var rowName = (rawData[r][2] || "").toString().trim();
            var rowId = (rawData[r][0] || "").toString().trim();
            var isMatch = false;
            if (clientData.clientId && rowId === clientData.clientId.toString().trim()) isMatch = true;
            else if (clientData.phone && phonesMatch(rowPhone, clientData.phone)) isMatch = true;
            else if (clientData.name && rowName.toLowerCase() === clientData.name.toString().trim().toLowerCase()) isMatch = true;
            
            if (isMatch) {
              var colValM = (rawData[r][12] || "").toString().trim();
              if (colValM && colValM.toLowerCase().indexOf("oc-") !== 0) {
                campaignTypeVal = colValM;
                break;
              }
            }
          }
        }
      } catch (e) { }
    }
    if (!campaignTypeVal) campaignTypeVal = "—";

    // Auto-fill attendance date from round start date if not provided
    var attendanceFinal = (clientData.attendance || "").toString().trim();
    if (!attendanceFinal && clientData.roundId) {
      try {
        var rndShFin = getSheet("Rounds");
        if (rndShFin) {
          var rndDataFin = rndShFin.getDataRange().getValues();
          for (var rIdx = 1; rIdx < rndDataFin.length; rIdx++) {
            if ((rndDataFin[rIdx][0] || "").toString() === clientData.roundId.toString()) {
              var rStartFin = rndDataFin[rIdx][2];
              if (rStartFin) {
                var rSdFin = (rStartFin instanceof Date) ? rStartFin : new Date(rStartFin);
                if (!isNaN(rSdFin.getTime())) {
                  attendanceFinal = Utilities.formatDate(rSdFin, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
                }
              }
              break;
            }
          }
        }
      } catch(e) {}
    }

    sh.appendRow([
      agentId, agentName, month, year, "client",
      clientData.action || "Wait", finalOcCode,
      clientData.name, clientData.phone || "", clientData.course || "",
      clientData.reservation || "", attendanceFinal || clientData.attendance || "",
      clientData.method || "Cash", clientData.offer || 0,
      parseFloat(clientData.price) || 0, parseFloat(clientData.paid) || 0,
      new Date(),
      clientData.clientType || "New", // ClientType goes in column 18 (index 17)
      campaignTypeVal                 // Campaign_Type goes in column 19 (index 18)
    ]);
    logActivity(agentId, agentName, "ADD_FIN_CLIENT", clientData.name + " - " + month + "/" + year);
    SpreadsheetApp.flush();
    // Fill campaign type for the new row (and any missing rows) — run here not on every read
    try { fillMissingFinancialCampaignTypes(); } catch(e) {}
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// Find a client in Financial_Data by phone or OC code
// Returns their info + which month/year they're registered in
function findClientForOldPayment(agentId, query) {
  if (!isUserAdminOrManager(agentId) && !agentId) return { success: false, message: "غير مصرح" };
  if (!query || !query.toString().trim()) return { success: false, message: "أدخل رقم تليفون أو OC Code" };
  var q = query.toString().trim();
  var sh = getSheet("Financial_Data");
  if (!sh) return { success: false, message: "Financial_Data غير موجود" };
  var data = sh.getDataRange().getValues();
  var results = [];
  var isOc = q.toLowerCase().indexOf('oc-') === 0;
  var qClean = isOc ? q : cleanPhone(q);
  for (var i = 1; i < data.length; i++) {
    var type = (data[i][4] || "").toString().trim().toLowerCase();
    if (type !== "client") continue;
    var rowOc = (data[i][6] || "").toString().trim();
    var rowPhone = (data[i][8] || "").toString().trim();
    var rowName = (data[i][7] || "").toString().trim();
    var matched = false;
    if (isOc) {
      matched = rowOc.toLowerCase() === q.toLowerCase();
    } else {
      matched = phonesMatch(qClean, rowPhone);
    }
    if (matched) {
      results.push({
        name: rowName,
        phone: rowPhone,
        ocCode: rowOc,
        month: parseInt(data[i][2]) || 0,
        year: parseInt(data[i][3]) || 0,
        totalPrice: parseFloat(data[i][14]) || 0,
        totalPaid: parseFloat(data[i][15]) || 0,
        agentName: (data[i][1] || "").toString().trim(),
        rowIndex: i + 1
      });
    }
  }
  if (!results.length) return { success: false, message: "مش لاقي العميل ده في Financial_Data" };
  // Return best match (most recent month)
  results.sort(function(a, b) { return (b.year * 12 + b.month) - (a.year * 12 + a.month); });
  var best = results[0];
  best.remaining = best.totalPrice - best.totalPaid;
  return { success: true, client: best };
}

function addFinancialPayment(agentId, agentName, month, year, payData) {
  try {
    initFinancialSheet();
    var sh = getSheet("Financial_Data");
    var finalOcCode = ensureOcCode(payData.ocCode, "", payData.phone, payData.name);
    var amt = parseFloat(payData.amount) || 0;

    // DATA FIX (2026-07-06): an installment ("payment") row used to hardcode Course/Method/
    // ClientType/Campaign_Type as blank — every installment row in Financial_Data showed up with no
    // context at all, unlike the original "client" (booking) row. Look up the client's own most
    // recent "client" row (same OC) BEFORE appending, and carry those fields over — they describe the
    // CLIENT/booking, not this specific installment, so they don't change from one installment to the
    // next. Method now comes from the caller (the "إضافة دفعة" form gained a وسيلة الدفع dropdown).
    var origMonth = parseInt(payData.originalMonth) || 0;
    var origYear = parseInt(payData.originalYear) || 0;
    var data = sh.getDataRange().getValues();
    var carriedCourse = "", carriedClientType = "", carriedCampaign = "", carriedAttendance = "";
    var oldRowUpdated = false;
    for (var i = 1; i < data.length; i++) {
      if ((data[i][4] || "").toString().trim().toLowerCase() !== "client") continue;
      var rowOc = (data[i][6] || "").toString().trim();
      var rowName = (data[i][7] || "").toString().trim().toLowerCase();
      var isSameClient = (finalOcCode && ocEq(rowOc, finalOcCode)) || (!finalOcCode && rowName === payData.name.toString().trim().toLowerCase());
      if (!isSameClient) continue;
      // Course/ClientType/Campaign/Attendance (the round's booking date — the closest thing this
      // sheet has to a "which round" field) don't change month to month — first match is fine.
      if (!carriedCourse) carriedCourse = (data[i][9] || "").toString().trim();
      if (!carriedAttendance) carriedAttendance = data[i][11] || "";
      if (!carriedClientType) carriedClientType = (data[i][17] || "").toString().trim();
      if (!carriedCampaign) carriedCampaign = (data[i][18] || "").toString().trim();
      if (origMonth && origYear && parseInt(data[i][2]) === origMonth && parseInt(data[i][3]) === origYear && !oldRowUpdated) {
        var oldPaid = parseFloat(data[i][15]) || 0;
        sh.getRange(i + 1, 16).setValue(oldPaid + amt);
        oldRowUpdated = true;
      }
    }

    var methodVal = (payData.method || "Cash").toString().trim();
    sh.appendRow([
      agentId, agentName, month, year, "payment",
      "", finalOcCode, payData.name, payData.phone || "",
      carriedCourse, payData.date || "", carriedAttendance, methodVal, 0, 0,
      amt, new Date(),
      carriedClientType, carriedCampaign
    ]);

    logActivity(agentId, agentName, "ADD_FIN_PAYMENT", payData.name + " - " + amt + " EGP" + (oldRowUpdated ? " (شهر " + origMonth + "/" + origYear + " اتحدث)" : ""));
    SpreadsheetApp.flush();
    var _resp = { success: true, oldRowUpdated: oldRowUpdated };
    if (origMonth && origYear && finalOcCode && !oldRowUpdated) { // S20: surface silent no-match instead of hiding it
      _resp.warning = "تم تسجيل الدفعة، لكن لم يتم العثور على صف العميل الأصلي للشهر " + origMonth + "/" + origYear + " لتحديث إجمالي المدفوع. تحقّق من الشهر/السنة أو كود OC.";
    }
    return _resp;
  } catch (e) { return { success: false, message: e.toString() }; }
}

// REPAIR TOOL (2026-07-06): backfills the SAME context fields addFinancialPayment now carries over
// for NEW installment rows, but across every EXISTING "payment" row already sitting blank in
// Financial_Data. Deliberately only touches descriptive columns it can derive with certainty from the
// client's own matching "client" row (Course, Attendance/booking-date, ClientType, Campaign_Type) —
// it NEVER touches Price/Paid/Offer, so it cannot invent or duplicate a single EGP of revenue. Method
// is the one exception: a genuinely blank Method is set to "Cash" (the same default new rows already
// get) ONLY if it's empty — an existing value, right or wrong, is never overwritten, since which
// method was actually used for an old installment can't be recovered with certainty.
function repairFinancialPaymentRowsCarryover(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح." };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var sh = getSheet("Financial_Data");
    if (!sh) { lock.releaseLock(); return { success: false, message: "شيت Financial_Data غير موجود." }; }
    var data = sh.getDataRange().getValues();
    if (data.length < 2) { lock.releaseLock(); return { success: true, message: "لا توجد بيانات لإصلاحها.", fixed: 0, stillEmpty: 0 }; }

    // Build a lookup from every "client" row: OC (preferred) or lowercase name (fallback) -> its info.
    var byOc = {}, byName = {};
    for (var i = 1; i < data.length; i++) {
      if ((data[i][4] || "").toString().trim().toLowerCase() !== "client") continue;
      var oc = (data[i][6] || "").toString().trim();
      var nm = (data[i][7] || "").toString().trim().toLowerCase();
      var info = {
        course: (data[i][9] || "").toString().trim(),
        attendance: data[i][11] || "",
        clientType: (data[i][17] || "").toString().trim(),
        campaign: (data[i][18] || "").toString().trim()
      };
      if (oc && !byOc[oc]) byOc[oc] = info;
      if (nm && !byName[nm]) byName[nm] = info;
    }

    // Collect only the 5 columns we might touch (Course=J/10, Attendance=L/12, Method=M/13,
    // ClientType=R/18, Campaign_Type=S/19 — 1-based) as separate column arrays, so the write can
    // never reach Price/Paid/Offer even by mistake.
    var colCourse = [], colAttendance = [], colMethod = [], colClientType = [], colCampaign = [];
    var fixed = 0, stillEmpty = 0, anyChange = false;
    for (var r = 1; r < data.length; r++) {
      var course = data[r][9], attendance = data[r][11], method = data[r][12], clientType = data[r][17], campaign = data[r][18];
      if ((data[r][4] || "").toString().trim().toLowerCase() === "payment") {
        var rOc = (data[r][6] || "").toString().trim();
        var rNm = (data[r][7] || "").toString().trim().toLowerCase();
        var info = (rOc && byOc[rOc]) || (rNm && byName[rNm]) || null;
        var rowChanged = false;
        if (!(course || "").toString().trim() && info && info.course) { course = info.course; rowChanged = true; }
        if (!attendance && info && info.attendance) { attendance = info.attendance; rowChanged = true; }
        if (!(method || "").toString().trim()) { method = "Cash"; rowChanged = true; }
        if (!(clientType || "").toString().trim() && info && info.clientType) { clientType = info.clientType; rowChanged = true; }
        if (!(campaign || "").toString().trim() && info && info.campaign) { campaign = info.campaign; rowChanged = true; }
        if (rowChanged) { fixed++; anyChange = true; }
        if (!info) stillEmpty++; // no matching client row — Course/ClientType/Campaign couldn't be resolved, even if Method still got its Cash default
      }
      colCourse.push([course]); colAttendance.push([attendance]); colMethod.push([method]);
      colClientType.push([clientType]); colCampaign.push([campaign]);
    }

    if (anyChange) {
      sh.getRange(2, 10, colCourse.length, 1).setValues(colCourse);
      sh.getRange(2, 12, colAttendance.length, 1).setValues(colAttendance);
      sh.getRange(2, 13, colMethod.length, 1).setValues(colMethod);
      sh.getRange(2, 18, colClientType.length, 1).setValues(colClientType);
      sh.getRange(2, 19, colCampaign.length, 1).setValues(colCampaign);
      SpreadsheetApp.flush();
    }
    lock.releaseLock();
    logActivity(adminId, "Admin", "REPAIR_FIN_PAYMENT_ROWS", "أُصلح " + fixed + " صف قسط، وتُرك " + stillEmpty + " صف من غير صف حجز مطابق");
    return {
      success: true,
      fixed: fixed, stillEmpty: stillEmpty,
      message: "✅ تم إصلاح " + fixed + " صف قسط ناقص" + (stillEmpty ? "، وفضل " + stillEmpty + " صف اتعذّر حلّه (مفيش صف حجز مطابق لنفس العميل — يحتاج مراجعة يدوية)" : "") + ". لم يتم تعديل أي مبلغ مالي (السعر/المدفوع) في أي صف."
    };
  } catch (e) {
    try { lock.releaseLock(); } catch (le) {}
    return { success: false, message: e.toString() };
  }
}

// تعديل مباشر لصف في Financial_Data بدون Client_Payments
function updateFinancialRowDirect(rowIndex, fields) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sh = getSheet("Financial_Data");
    if (!sh) return { success: false, message: "مفيش شيت Financial_Data" };
    var data = sh.getDataRange().getValues();
    if (!rowIndex || rowIndex < 2 || rowIndex > data.length) return { success: false, message: "رقم الصف غير صحيح" };
    // Financial_Data columns (1-based): 3=Month, 4=Year, 6=Action, 8=Name, 9=Phone, 10=Course,
    // 13=Method, 14=Offer, 15=Price, 16=Paid. (Action is col 6 — NOT col 3, which is Month.)
    var r = sh.getRange(rowIndex, 1, 1, sh.getLastColumn()).getValues()[0];
    // FIX-03: verify the row still belongs to the same client before writing (guards a stale rowIndex from row shifts)
    if (fields.expectedName !== undefined && fields.expectedName !== null && fields.expectedName.toString().trim() !== "") {
      var _curName = (r[7] || "").toString().trim().toLowerCase();
      var _expName = fields.expectedName.toString().trim().toLowerCase();
      if (_curName !== _expName) {
        lock.releaseLock();
        return { success: false, message: "⚠️ تغيّر ترتيب الصفوف منذ فتح الشاشة (الصف الآن لـ \"" + (r[7] || "") + "\" بدل \"" + fields.expectedName + "\"). أغلق النافذة وأعد فتحها ثم احفظ." };
      }
    }
    if (fields.name    !== undefined) sh.getRange(rowIndex, 8).setValue(fields.name);
    if (fields.phone   !== undefined) sh.getRange(rowIndex, 9).setValue(fields.phone);
    if (fields.course  !== undefined) sh.getRange(rowIndex, 10).setValue(fields.course);
    if (fields.method  !== undefined) sh.getRange(rowIndex, 13).setValue(fields.method);
    if (fields.offer   !== undefined) sh.getRange(rowIndex, 14).setValue(fields.offer);
    if (fields.price   !== undefined) sh.getRange(rowIndex, 15).setValue(parseFloat(fields.price)||0);
    if (fields.paid    !== undefined) sh.getRange(rowIndex, 16).setValue(parseFloat(fields.paid)||0);
    if (fields.action  !== undefined) sh.getRange(rowIndex, 6).setValue(fields.action); // FIX: Action is col 6 — was wrongly writing col 3 (Month), which wiped the month and hid the client from the commission view
    SpreadsheetApp.flush();
    lock.releaseLock();
    return { success: true, message: "✅ تم الحفظ" };
  } catch(e) {
    try { lock.releaseLock(); } catch(le){}
    return { success: false, message: e.toString() };
  }
}

function deleteFinancialClient(agentId, month, year, idx, rowIndex) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sh = getSheet("Financial_Data");
    var data = sh.getDataRange().getValues();
    var targetRowIdx = -1;
    if (rowIndex && rowIndex > 0 && rowIndex <= data.length) {
      targetRowIdx = rowIndex;
    } else {
      var count = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === agentId.toString() &&
          parseInt(data[i][2]) === month && parseInt(data[i][3]) === year &&
          data[i][4] === "client") {
          count++;
          if (count === idx) {
            targetRowIdx = i + 1;
            break;
          }
        }
      }
    }
    
    if (targetRowIdx === -1) {
      lock.releaseLock();
      return { success: false, message: "السجل غير موجود" };
    }
    
    // Retrieve identifiers from the target Financial_Data row
    var ocCode = (data[targetRowIdx - 1][6] || "").toString().trim();
    if (ocCode === "—" || ocCode === "-" || ocCode.toLowerCase() === "null" || ocCode.toLowerCase() === "undefined") {
      ocCode = "";
    }
    var clientName = (data[targetRowIdx - 1][7] || "").toString().trim();
    var phone = cleanPhone(data[targetRowIdx - 1][8]);
    
    // Find additional details/clientId from Raw_Data if possible
    var clientId = "";
    var rawSh = getSheet("Raw_Data");
    if (rawSh) {
      var rawData = rawSh.getDataRange().getValues();
      for (var r = 1; r < rawData.length; r++) {
        var rId = (rawData[r][0] || "").toString().trim();
        var rOc = (rawData[r][14] || "").toString().trim(); // dedicated OC CODE is Column O (index 14)
        if (rOc === "—" || rOc === "-" || rOc.toLowerCase() === "null" || rOc.toLowerCase() === "undefined") {
          rOc = "";
        }
        var rPhone = cleanPhone(rawData[r][3]);
        
        var isMatch = false;
        if (ocEq(rOc, ocCode)) isMatch = true; // FIX-07: ocKey-normalized OC join
        else if (phone && rPhone && phonesMatch(rPhone, phone)) isMatch = true;
        
        if (isMatch) {
          clientId = rId;
          if (!ocCode) ocCode = rOc;
          break;
        }
      }
    }
    
    var cleanOcCode = (ocCode || "").toString().trim();
    if (cleanOcCode === "—" || cleanOcCode === "-" || cleanOcCode.toLowerCase() === "null" || cleanOcCode.toLowerCase() === "undefined") {
      cleanOcCode = "";
    }
    var cleanClientId = (clientId || "").toString().trim();
    if (cleanClientId === "—" || cleanClientId === "-" || cleanClientId.toLowerCase() === "null" || cleanClientId.toLowerCase() === "undefined") {
      cleanClientId = "";
    }

    // 1. Delete the client row from Financial_Data
    sh.deleteRow(targetRowIdx);
    
    // 2. Delete any other matching rows in Financial_Data (e.g. type="payment" or other duplicates)
    var updatedFinData = sh.getDataRange().getValues();
    for (var f = updatedFinData.length - 1; f >= 1; f--) {
      var fOc = (updatedFinData[f][6] || "").toString().trim();
      if (fOc === "—" || fOc === "-" || fOc.toLowerCase() === "null" || fOc.toLowerCase() === "undefined") {
        fOc = "";
      }
      var fPhone = cleanPhone(updatedFinData[f][8]);
      
      var isMatch = false;
      if (ocEq(fOc, cleanOcCode)) isMatch = true; // FIX-07: ocKey-normalized OC join
      else if (cleanClientId && fOc === cleanClientId) isMatch = true;
      else if (phone && fPhone && phonesMatch(fPhone, phone)) isMatch = true;
      
      if (isMatch) {
        sh.deleteRow(f + 1);
      }
    }
    
    // 3. Delete from Client_Payments
    try {
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = cpSh.getDataRange().getValues();
        for (var cp = cpData.length - 1; cp >= 1; cp--) {
          var cpOc = (cpData[cp][1] || "").toString().trim();
          if (cpOc === "—" || cpOc === "-" || cpOc.toLowerCase() === "null" || cpOc.toLowerCase() === "undefined") {
            cpOc = "";
          }
          if (ocEq(cpOc, cleanOcCode) || (cleanClientId && cpOc === cleanClientId)) { // FIX-07
            cpSh.deleteRow(cp + 1);
          }
        }
      }
    } catch(e) {}
    
    // 4. Delete from Round_Members & update enrolled counts
    try {
      var rmSh = getSheet("Round_Members");
      if (rmSh) {
        var rmData = rmSh.getDataRange().getValues();
        for (var rm = rmData.length - 1; rm >= 1; rm--) {
          var rmRoundId = (rmData[rm][0] || "").toString().trim();
          var rmOc = (rmData[rm][1] || "").toString().trim();
          if (rmOc === "—" || rmOc === "-" || rmOc.toLowerCase() === "null" || rmOc.toLowerCase() === "undefined") {
            rmOc = "";
          }
          var rmPhone = cleanPhone(rmData[rm][3]);
          
          var isMatch = false;
          if (ocEq(rmOc, cleanOcCode)) isMatch = true; // FIX-07: ocKey-normalized OC join
          else if (cleanClientId && rmOc === cleanClientId) isMatch = true;
          else if (phone && rmPhone && phonesMatch(rmPhone, phone)) isMatch = true;
          
          if (isMatch) {
            rmSh.deleteRow(rm + 1);
            // Decrement enrolled count in Rounds
            try {
              var rsh = getSheet("Rounds");
              var rdata = rsh.getDataRange().getValues();
              for (var j = 1; j < rdata.length; j++) {
                if ((rdata[j][0] || "").toString() === rmRoundId) {
                  var current = parseInt(rdata[j][5]) || 0;
                  rsh.getRange(j + 1, 6).setValue(Math.max(0, current - 1));
                  break;
                }
              }
            } catch(rcErr) {}
          }
        }
      }
    } catch(e) {}
    invalidateRoundsCache(); // FIX-19: refresh seat cache after full member-removal cascade

    // 5. Delete from Rounds_Attendance
    try {
      var attSh = getSheet("Rounds_Attendance");
      if (attSh) {
        var attData = attSh.getDataRange().getValues();
        for (var a = attData.length - 1; a >= 1; a--) {
          var attPhone = cleanPhone(attData[a][1]);
          
          var isMatch = false;
          if (phone && attPhone && phonesMatch(attPhone, phone)) isMatch = true;
          
          if (isMatch) {
            attSh.deleteRow(a + 1);
          }
        }
      }
    } catch(e) {}
    
    // 6. Delete from Academy_Ledger
    try {
      var ledgerSh = getSheet("Academy_Ledger");
      if (ledgerSh) {
        var ledgerData = ledgerSh.getDataRange().getValues();
        for (var l = ledgerData.length - 1; l >= 1; l--) {
          var rowOc = (ledgerData[l][1] || "").toString().trim();
          if (rowOc === "—" || rowOc === "-" || rowOc.toLowerCase() === "null" || rowOc.toLowerCase() === "undefined") {
            rowOc = "";
          }
          if (ocEq(rowOc, cleanOcCode) || (cleanClientId && rowOc === cleanClientId)) { // FIX-07
            ledgerSh.deleteRow(l + 1);
          }
        }
      }
    } catch(e) {}
    
    // 7. Delete from My_Leads
    try {
      var shMy = getSheet("My_Leads");
      if (shMy) {
        var dataMy = shMy.getDataRange().getValues();
        for (var m = dataMy.length - 1; m >= 1; m--) {
          var mId = (dataMy[m][0] || "").toString().trim();
          var mPhone = cleanPhone(dataMy[m][3]);
          
          var isMatch = false;
          if (cleanClientId && mId === cleanClientId) isMatch = true;
          else if (phone && mPhone && phonesMatch(mPhone, phone)) isMatch = true;
          
          if (isMatch) {
            shMy.deleteRow(m + 1);
          }
        }
      }
    } catch(e) {}
    
    // 8. Delete from Raw_Data
    try {
      if (rawSh) {
        var updatedRawData = rawSh.getDataRange().getValues();
        for (var r = updatedRawData.length - 1; r >= 1; r--) {
          var rId = (updatedRawData[r][0] || "").toString().trim();
          var rOc = (updatedRawData[r][14] || "").toString().trim(); // Column O
          if (rOc === "—" || rOc === "-" || rOc.toLowerCase() === "null" || rOc.toLowerCase() === "undefined") {
            rOc = "";
          }
          var rPhone = cleanPhone(updatedRawData[r][3]);
          
          var isMatch = false;
          if (cleanClientId && rId === cleanClientId) isMatch = true;
          else if (ocEq(rOc, cleanOcCode)) isMatch = true; // FIX-07: ocKey-normalized OC join
          else if (phone && rPhone && phonesMatch(rPhone, phone)) isMatch = true;
          
          if (isMatch) {
            rawSh.deleteRow(r + 1);
          }
        }
      }
    } catch(e) {}
    
    lock.releaseLock();
    logActivity(agentId, "System", "DELETE_FIN_CLIENT_CASCADE", clientName);
    return { success: true };
  } catch (e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

function deleteFinancialPayment(agentId, month, year, idx, rowIndex) {
  try {
    var sh = getSheet("Financial_Data");
    var data = sh.getDataRange().getValues();
    if (rowIndex && rowIndex > 0 && rowIndex <= data.length) {
      sh.deleteRow(rowIndex);
      return { success: true };
    }
    var count = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === agentId.toString() &&
        parseInt(data[i][2]) === month && parseInt(data[i][3]) === year &&
        data[i][4] === "payment") {
        count++;
        if (count === idx) { sh.deleteRow(i + 1); return { success: true }; }
      }
    }
    return { success: false, message: "السجل غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ==========================================
// PAYMENT GATEWAY - FIXED (B=User, C=Client, D=Amount, F=Time)
// ==========================================
function sendPaymentLink(clientId, clientName, phone, amount, hours, agentId, agentName) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(15000);
    var paySS = SpreadsheetApp.openById(PAYMENT_SHEET_ID);
    var sh = paySS.getSheets()[0];

    // Generate clean unique ID like ORD-123456
    var ordId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    var payLink = "https://www.b-s-a.co/pay?id=" + ordId;

    // Exact 8-column layout matching the Google Sheet:
    // A: ID (ordId)
    // B: Agent Name (agentName)
    // C: Client Name (clientName)
    // D: Amount (parseFloat(amount))
    // E: Date (new Date())
    // F: Time/Hours (parseFloat(hours))
    // G: Status ("نشط")
    // H: Link (payLink)
    sh.appendRow([
      ordId,
      agentName,
      clientName,
      parseFloat(amount) || 0,
      new Date(),
      parseFloat(hours) || 24,
      "نشط",
      payLink
    ]);
    lock.releaseLock();

    logActivity(agentId, agentName, "PAYMENT_LINK", clientName + " - " + amount + " EGP");
    return { success: true, message: "✅ تم إرسال بيانات الدفع — اللينك سيظهر في شيت بوابة الدفع خلال ثوانٍ" };
  } catch (e) { return { success: false, message: e.toString() }; }
}


// ==========================================
// ACADEMY TARGET - Dashboard
// ==========================================
function getAcademyTarget() {
  try {
    var month = new Date().getMonth();
    var year = new Date().getFullYear();
    var totalPaid = 0; // This acts as the total achieved invoice amount
    var fsh = getSheet("Financial_Data");
    if (fsh) {
      var fdata = fsh.getDataRange().getValues();
      for (var i = 1; i < fdata.length; i++) {
        if (parseInt(fdata[i][2]) === month + 1 && parseInt(fdata[i][3]) === year) {
          // Calculate target based on the total invoice price (Column 15, index 14) of client rows
          if (fdata[i][4] === "client") {
            totalPaid += parseFloat(fdata[i][14]) || 0;
          }
        }
      }
    }
    
    // Calculate totalTarget dynamically as the sum of all individual targets of active sales agents
    var defaultTarget = parseFloat(getSystemSetting("targetPerAgent", "50000"));
    var salesTargetsStr = getSystemSetting("salesTargets", "{}");
    var salesTargets = {};
    try {
      salesTargets = JSON.parse(salesTargetsStr);
    } catch (e) {
      salesTargets = {};
    }
    
    var users = getUsers();
    var activeSales = users.filter(function(u) { return u.role === 'Sales' && u.active; });
    
    var totalTarget = 0;
    activeSales.forEach(function(u) {
      var tVal = salesTargets[u.name];
      if (tVal === undefined || tVal === null || tVal === '') {
        totalTarget += defaultTarget;
      } else {
        totalTarget += parseFloat(tVal) || defaultTarget;
      }
    });
    
    if (activeSales.length === 0) {
      var agentCount = parseFloat(getSystemSetting("agentCount", "5"));
      totalTarget = defaultTarget * agentCount;
    }
    
    var pct = totalTarget > 0 ? Math.min(100, Math.round(totalPaid / totalTarget * 100)) : 0;
    return { totalPaid: totalPaid, totalTarget: totalTarget, pct: pct, remaining: Math.max(0, totalTarget - totalPaid) };
  } catch (e) { 
    return { totalPaid: 0, totalTarget: 250000, pct: 0, remaining: 250000 }; 
  }
}

// ==========================================
// BREAK SYSTEM
// ==========================================
// Break_Log sheet columns (1-indexed):
// 1:AgentID  2:AgentName  3:Date  4:ClockIn  5:ClockOut
// 6:Break1_Start  7:Break1_End  8:Break2_Start  9:Break2_End  10:Break3_Start  11:Break3_End
// 12:Work_Duration  13:Total_Break  14:Overtime  15:Early_Logout_Reason

function _ensureBreakLogSheet() {
  var sh = getSheet("Break_Log");
  if (!sh) {
    getMaster().insertSheet("Break_Log");
    sh = getSheet("Break_Log");
    sh.appendRow(["AgentID","AgentName","Date","Clock_In","Clock_Out",
                  "Break1_Start","Break1_End","Break2_Start","Break2_End","Break3_Start","Break3_End",
                  "Work_Duration","Total_Break","Overtime","Early_Logout_Reason"]);
    sh.getRange(1,1,1,15).setBackground("#1a1a2e").setFontColor("#fff").setFontWeight("bold");
  } else if (sh.getLastColumn() < 15) {
    // Patch old sheet: rename headers to new naming
    try {
      sh.getRange(1,4,1,12).setValues([["Clock_In","Clock_Out",
        "Break1_Start","Break1_End","Break2_Start","Break2_End","Break3_Start","Break3_End",
        "Work_Duration","Total_Break","Overtime","Early_Logout_Reason"]]);
    } catch(e){}
  }
  return sh;
}

function getBreakStatus() {
  try {
    var users = getUsers();
    if (!users || !users.length) throw new Error("قائمة المستخدمين فارغة!");
    var sh = _ensureBreakLogSheet();
    var today = todayStr();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();

    function rawTime(val) {
      if (!val) return null;
      if (val instanceof Date) return val.getTime();
      var d = new Date(val); return isNaN(d.getTime()) ? null : d.getTime();
    }
    function fmtDur(val) {
      if (!val) return "";
      if (val instanceof Date) {
        return [val.getHours(),val.getMinutes(),val.getSeconds()].map(function(n){return n.toString().padStart(2,'0');}).join(':');
      }
      var s = val.toString().trim();
      if (s.indexOf("GMT")!==-1||s.indexOf("1899")!==-1) {
        var d=new Date(s);
        if(!isNaN(d.getTime())) return [d.getHours(),d.getMinutes(),d.getSeconds()].map(function(n){return n.toString().padStart(2,'0');}).join(':');
      }
      return s;
    }

    var statusMap = {};
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || !row[0]) continue;
      var rowDate = row[2] ? safeFormatDate(row[2], tz, "yyyy-MM-dd") : "";
      if (rowDate !== today) continue;
      var aid = row[0].toString().trim();

      // Build break sessions from cols 6-11 (indices 5-10)
      var breakSessions = [];
      var breakCols = [[5,6],[7,8],[9,10]]; // 0-based pairs [start, end]
      breakCols.forEach(function(pair) {
        var s = row[pair[0]], e = row[pair[1]];
        if (s || e) {
          breakSessions.push({
            start:    s ? safeFormatDate(s, tz, "HH:mm:ss") : "",
            startRaw: rawTime(s),
            end:      e ? safeFormatDate(e, tz, "HH:mm:ss") : "",
            endRaw:   rawTime(e)
          });
        }
      });
      // Determine onBreak: last session has start but no end
      var onBreak = breakSessions.length > 0 && !!breakSessions[breakSessions.length-1].startRaw && !breakSessions[breakSessions.length-1].endRaw;

      statusMap[aid] = {
        agentId: aid,
        agentName: row[1] ? row[1].toString().trim() : "",
        loginTime:  row[3] ? safeFormatDate(row[3], tz, "HH:mm:ss") : "",
        loginRaw:   rawTime(row[3]),
        logoutTime: row[4] ? safeFormatDate(row[4], tz, "HH:mm:ss") : "",
        logoutRaw:  rawTime(row[4]),
        breakSessions: breakSessions,
        onBreak:    onBreak,
        workDuration: fmtDur(row[11]),
        totalBreak:   fmtDur(row[12]),
        overtime:     fmtDur(row[13]),
        earlyReason:  row[14] ? row[14].toString() : "",
        rowIndex: i + 1
      };
    }

    return users.filter(function(u){return u.role !== 'Manager';}).map(function(u) {
      return statusMap[u.id] || {
        agentId: u.id, agentName: u.name,
        loginTime: "", loginRaw: null, logoutTime: "", logoutRaw: null,
        breakSessions: [], onBreak: false,
        workDuration: "", totalBreak: "", overtime: "", earlyReason: "", rowIndex: -1
      };
    });
  } catch(e) {
    Logger.log("Error in getBreakStatus: " + e.toString());
    throw new Error("خطأ في قراءة بيانات الشيفت: " + e.toString());
  }
}

function logBreakAction(agentId, agentName, action, workDuration, totalBreak, overtime, earlyReason) {
  try {
    var sh = _ensureBreakLogSheet();
    var today = todayStr();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var rowIndex = -1;
    var rowData = null;
    for (var i = 1; i < data.length; i++) {
      if (!data[i] || !data[i][0]) continue;
      var rowDate = data[i][2] ? safeFormatDate(data[i][2], tz, "yyyy-MM-dd") : "";
      if (rowDate === today && data[i][0].toString().trim() === agentId.toString().trim()) {
        rowIndex = i + 1;
        rowData = data[i];
        break;
      }
    }
    var now = new Date();

    // Resolve action aliases (backward compat: login→clock_in, logout→clock_out)
    if (action === "login")  action = "clock_in";
    if (action === "logout") action = "clock_out";

    // Determine target column
    var targetCol = null;
    if (action === "clock_in")  targetCol = 4;
    if (action === "clock_out") targetCol = 5;
    if (action === "break_start") {
      // Find first empty break start slot (cols 6, 8, 10)
      var startCols = [6, 8, 10];
      for (var s = 0; s < startCols.length; s++) {
        var colVal = rowData ? rowData[startCols[s] - 1] : null;
        if (!colVal) { targetCol = startCols[s]; break; }
      }
      if (!targetCol) return { success: false, message: "Maximum breaks reached for today (3 breaks)" };
    }
    if (action === "break_end") {
      // Find last started-but-not-ended break slot
      var startCols2 = [6, 8, 10], endCols2 = [7, 9, 11];
      for (var e2 = startCols2.length - 1; e2 >= 0; e2--) {
        var sv = rowData ? rowData[startCols2[e2] - 1] : null;
        var ev = rowData ? rowData[endCols2[e2] - 1] : null;
        if (sv && !ev) { targetCol = endCols2[e2]; break; }
      }
      if (!targetCol) return { success: false, message: "No active break to end" };
    }

    if (rowIndex === -1) {
      var newRow = [agentId, agentName, new Date(), null, null, null, null, null, null, null, null, workDuration||"", totalBreak||"", overtime||"", earlyReason||""];
      if (targetCol) newRow[targetCol - 1] = now;
      sh.appendRow(newRow);
    } else {
      if (targetCol) sh.getRange(rowIndex, targetCol).setValue(now);
      if (action === "clock_out") {
        sh.getRange(rowIndex, 12).setValue(workDuration || "");
        sh.getRange(rowIndex, 13).setValue(totalBreak || "");
        sh.getRange(rowIndex, 14).setValue(overtime || "");
        sh.getRange(rowIndex, 15).setValue(earlyReason || "");
      }
    }
    logActivity(agentId, agentName, "SHIFT_" + action.toUpperCase(), safeFormatDate(now, tz, "HH:mm"));
    return { success: true };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// Admin-only: returns all pending alerts (salary + extendable in future)
function getAdminAlerts() {
  try {
    var alerts = [];
    // Salary payment alerts
    try {
      var salaries = getLecturerSalaries();
      salaries.forEach(function(s) {
        var isOffline = s.roundType.toLowerCase().indexOf('offline') !== -1;
        var pay1Lec = isOffline ? 5 : 6;
        var pay2Lec = isOffline ? 10 : 12;
        if (s.alert1) {
          alerts.push({ type: 'salary', id: s.id, payNum: 1, instructor: s.instructor, roundName: s.roundName, roundType: s.roundType, payLec: pay1Lec, amount: s.pay1Amount, status: s.pay1Status });
        }
        if (s.alert2) {
          alerts.push({ type: 'salary', id: s.id, payNum: 2, instructor: s.instructor, roundName: s.roundName, roundType: s.roundType, payLec: pay2Lec, amount: s.pay2Amount, status: s.pay2Status });
        }
      });
    } catch(se) { Logger.log("salary alerts error: " + se); }
    return alerts;
  } catch(e) { return []; }
}

// ==========================================
// DAILY REPORT - Auto PDF
// ==========================================
function generateDailyReport() {
  try {
    var today = todayStr();
    var sh = getSheet("My_Leads");
    var data = sh.getDataRange().getValues();
    var todayDate = new Date().toDateString();
    var agentStats = {};

    for (var i = 1; i < data.length; i++) {
      var notesStr = (data[i][9] || "").toString(); // Column J (Notes, index 9)
      if (notesStr.indexOf("[" + today) === -1) continue; // today is todayStr() "yyyy-MM-dd"

      var aid = (data[i][6] || "").toString();
      var aname = (data[i][7] || aid).toString();
      if (!agentStats[aid]) agentStats[aid] = { name: aname, calls: 0, won: 0, lost: 0, fu: 0, na: 0, delayed: 0 };

      var lines = notesStr.split("\n");
      lines.forEach(function (line) {
        if (line.indexOf("[" + today) !== -1) {
          agentStats[aid].calls++;
          var act = "";
          var actMatch = line.match(/\]\s*\(([^)]+)\)/);
          if (actMatch) {
            act = actMatch[1].toLowerCase();
          } else {
            act = (data[i][8] || "").toString().toLowerCase(); // index 8 = Action
          }
          if (act.includes("closed won") || act.includes("recommendation")) agentStats[aid].won++;
          else if (act.includes("closed lost")) agentStats[aid].lost++;
          else if (act.includes("follow") || act.includes("need follow")) agentStats[aid].fu++;
          else if (act.includes("no answer") || act.includes("لم يرد")) agentStats[aid].na++;
          else if (act.includes("delayed")) agentStats[aid].delayed++;
        }
      });
    }

    var target = getAcademyTarget();
    var html = "<div style='font-family:Arial;direction:rtl;padding:20px;'>";
    html += "<h1 style='color:#3d2a1e;border-bottom:3px solid #c8a064;padding-bottom:10px'>📊 تقرير الأداء اليومي — " + today + "</h1>";
    html += "<div style='background:#f5f0ea;padding:14px;border-radius:8px;margin:14px 0'>";
    html += "<h3>🎯 تارجت الأكاديمية</h3>";
    html += "<p>إجمالي المحصّل: <strong>" + target.totalPaid.toLocaleString() + " EGP</strong></p>";
    html += "<p>إجمالي التارجت: <strong>" + target.totalTarget.toLocaleString() + " EGP</strong></p>";
    html += "<p>نسبة الإنجاز: <strong style='color:" + (target.pct >= 80 ? '#2e7d32' : '#c04040') + "'>" + target.pct + "%</strong></p></div>";

    html += "<h2 style='margin-top:20px;color:#3d2a1e'>👥 أداء الفريق</h2>";
    html += "<table style='width:100%;border-collapse:collapse;'><thead><tr style='background:#3d2a1e;color:#fff'><th style='padding:8px;text-align:right'>الموظف</th><th>مكالمات</th><th>Won</th><th>Lost</th><th>FU</th><th>NA</th><th>نسبة الإغلاق</th></tr></thead><tbody>";

    Object.values(agentStats).forEach(function (a, i) {
      var rate = a.calls > 0 ? Math.round(a.won / a.calls * 100) : 0;
      html += "<tr style='background:" + (i % 2 === 0 ? '#fff' : '#faf6f0') + "'>";
      html += "<td style='padding:8px;font-weight:bold'>" + a.name + "</td>";
      html += "<td style='text-align:center'>" + a.calls + "</td><td style='text-align:center;color:#2e7d32;font-weight:bold'>" + a.won + "</td>";
      html += "<td style='text-align:center;color:#c62828'>" + a.lost + "</td><td style='text-align:center;color:#a57a00'>" + a.fu + "</td>";
      html += "<td style='text-align:center'>" + a.na + "</td><td style='text-align:center;font-weight:bold;color:" + (rate >= 20 ? '#2e7d32' : '#c04040') + "'>" + rate + "%</td></tr>";
    });
    html += "</tbody></table>";
    html += "</div>";

    try {
      MailApp.sendEmail({
        to: "bsa.academy.co.2025@gmail.com",
        subject: "📊 تقرير الأداء اليومي — " + today,
        htmlBody: html
      });
    } catch (e) { }
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function createDirectInvoice(clientId, clientName, clientPhone, course, price, paid, remaining, method, offer, attendanceDate, nameEn, agentId, agentName, agentEmail, bookingType, roundId, roundName, nextDueDate, clientType, finAction) {
  // Check if round is active for round booking
  var resolvedFinAction = finAction || ((roundId && roundId !== "") ? "Round" : "Wait");
  var isRound = (resolvedFinAction === "Round") && roundId;

  if (isRound) {
    try {
      var roundsSh = getSheet("Rounds");
      if (roundsSh) {
        var rData = roundsSh.getDataRange().getValues();
        var isRoundActive = true;
        for (var r = 1; r < rData.length; r++) {
          if ((rData[r][0]||"").toString() === roundId.toString()) {
            var rStatus = (rData[r][6] || "Active").toString().trim().toLowerCase();
            if (rStatus !== "active") {
              isRoundActive = false;
            }
            break;
          }
        }
        if (!isRoundActive) {
          return { success: false, message: "⚠️ الحجز مغلق على هذه المجموعة حالياً ولا يمكن تسجيل عملاء بها." };
        }
      }
    } catch(e) {}
  }

  try {
    var lock = LockService.getScriptLock(); lock.waitLock(15000);

    var INVOICE_SHEET_ID = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    var invoiceSS = SpreadsheetApp.openById(INVOICE_SHEET_ID);

    // Smart and defensive sheet selector to prevent corrupting Accounts or Dashboard tabs
    var sh = null;
    var sheets = invoiceSS.getSheets();

    // 1. Check common exact names
    var commonNames = ["Form Responses 1", "ردود النموذج 1", "Form_Responses", "Form Responses"];
    for (var k = 0; k < commonNames.length; k++) {
      sh = invoiceSS.getSheetByName(commonNames[k]);
      if (sh) break;
    }

    // 2. Check names containing "response", "ردود", or "invoice"
    if (!sh) {
      for (var s = 0; s < sheets.length; s++) {
        var nameLower = sheets[s].getName().toLowerCase();
        if (nameLower.indexOf("response") !== -1 || nameLower.indexOf("ردود") !== -1 || nameLower.indexOf("فاتور") !== -1) {
          sh = sheets[s];
          break;
        }
      }
    }

    // 3. Fallback: use first sheet but avoid if it looks like a dashboard/accounts tab
    if (!sh) {
      sh = sheets[0];
      var firstSheetName = sh.getName().toLowerCase();
      if (firstSheetName.indexOf("حساب") !== -1 || firstSheetName.indexOf("dash") !== -1 || firstSheetName.indexOf("الرئيسية") !== -1 || firstSheetName.indexOf("setting") !== -1) {
        if (sheets.length > 1) {
          sh = sheets[1]; // Use second sheet
        }
      }
    }

    // Check for recent duplicate to prevent duplicate submissions from double clicks
    var lastRow = sh.getLastRow();
    if (lastRow >= 1) {
      var startRow = Math.max(1, lastRow - 10);
      var numRows = lastRow - startRow + 1;
      var prevData = sh.getRange(startRow, 1, numRows, 13).getValues();
      var cleanClientPhone = cleanPhone(clientPhone);
      
      for (var i = 0; i < prevData.length; i++) {
        var prevTimestamp = new Date(prevData[i][0]);
        var prevName = (prevData[i][2] || "").toString().trim();
        var prevPhone = cleanPhone(prevData[i][3]);
        var prevCourse = (prevData[i][4] || "").toString().trim();
        var prevPrice = parseFloat(prevData[i][7]) || 0;
        
        if (prevName === clientName && 
            prevPhone === cleanClientPhone && 
            prevCourse === course && 
            prevPrice === parseFloat(price) &&
            prevTimestamp.getTime() > 0 &&
            Math.abs(new Date().getTime() - prevTimestamp.getTime()) < 5 * 60 * 1000) {
          
          lock.releaseLock();
          return { success: false, message: "⚠️ تم تسجيل هذه الفاتورة بالفعل مؤخراً لتفادي التكرار." };
        }
      }
    }

    // FIX-07: the external invoice system is the SOLE OC source — never fabricate (no last-9 / random).
    // If no OC is resolved, leave it blank → this invoice is Pending OC (quarantined from OC-keyed sync).
    var invoiceId = ensureOcCode(clientId, clientId, clientPhone, clientName) || "";
    if (invoiceId && invoiceId.toLowerCase().indexOf("oc-") !== 0) invoiceId = "OC-" + ocKey(invoiceId);
    if (!ocKey(invoiceId)) invoiceId = "";
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd");

    // ----- Build row data including booking type -----
    var rowData = [
      new Date(),                               // Timestamp
      today,                                    // اليوم
      clientName,
      clientPhone ? forceTextPhone(clientPhone) : "",
      course,
      offer || "Cash",
      attendanceDate || "",
      parseFloat(price) || 0,
      parseFloat(paid) || 0,
      parseFloat(remaining) || 0,
      method || "Cash",
      agentEmail || "",
      invoiceId,
      isRound ? "round" : "waiting",            // نوع الحجز (waiting أو round)
      isRound ? roundId : "",
      isRound ? roundName : resolvedFinAction,
      nextDueDate || "",
      resolvedFinAction || "",
      clientType || "New"                       // نوع العميل
    ];

    // ----- Save invoice based on booking type -----
    if (isRound) {
      // حجز راوند → تُسجل مباشرةً في ورقة الفواتير التي يراها السيلز
      sh.appendRow(rowData);
    } else {
      // حجز waiting → نحتفظ به في ورشة Pending_Invoices حتى يتم اختيار راوند
      var pendingSh = invoiceSS.getSheetByName('Pending_Invoices');
      if (!pendingSh) {
        // إنشاء الورقة إذا لم تكن موجودة
        pendingSh = invoiceSS.insertSheet('Pending_Invoices');
        pendingSh.appendRow([
          'Timestamp','Today','Client Name','Phone','Course','Offer','Attendance',
          'Price','Paid','Remaining','Method','Agent Email','Invoice ID',
          'Booking Type','Round ID','Round Name','Next Due','Fin Action','Client Type'
        ]);
      }
      pendingSh.appendRow(rowData);
    }

    // FIX-04 (S4): collect any swallowed downstream-write failures so they can be
    // surfaced to the caller instead of silently leaving an invoice with no
    // financial / round / payment record. (Reporting-only; success path unchanged.)
    var _invoiceSyncErrors = [];

    // 1. Save to Financial Accounts (الحسابات الشهرية)
    try {
      var currentMonth = new Date().getMonth() + 1;
      var currentYear = new Date().getFullYear();
      addFinancialClient(agentId, agentName, currentMonth, currentYear, {
        action: resolvedFinAction,
        ocCode: invoiceId,
        name: clientName,
        phone: clientPhone || "",
        course: course,
        reservation: today,
        attendance: isRound ? attendanceDate : "",
        roundName: isRound ? roundName : "",
        method: method,
        price: parseFloat(price) || 0,
        paid: parseFloat(paid) || 0,
        offer: offer || "Cash",
        clientType: clientType || "New"
      });
    } catch (e) { _invoiceSyncErrors.push("Financial_Data: " + e.toString()); } // FIX-04 (S4): record instead of swallow

    // 2. If Round booking: save to Round_Members sheet
    if (isRound) {
      try {
        addRoundMember(roundId, {
          ocCode: invoiceId,
          name: clientName,
          phone: clientPhone || "",
          action: "New",
          price: parseFloat(price) || 0,
          paid: parseFloat(paid) || 0,
          method: method || "Cash",
          attendance: attendanceDate || "",
          agentId: agentId,
          agentName: agentName
        });
      } catch (e) { _invoiceSyncErrors.push("Round_Members: " + e.toString()); } // FIX-04 (S4): record instead of swallow
    }

    // 3. Save to Client Payments (شيت الكلاينت بايمنت)
    try {
      var cpRoundId = isRound ? roundId : "";
      var cpRoundName = isRound ? roundName : resolvedFinAction;
      var dueDate = (parseFloat(remaining) > 0 && nextDueDate) ? nextDueDate : "";
      addClientPayment(
        invoiceId, clientName, clientPhone || "", course,
        cpRoundId, cpRoundName,
        parseFloat(price) || 0, agentId, agentName,
        parseFloat(paid) || 0,
        dueDate,
        isRound ? "حجز راوند" : resolvedFinAction
      );
    } catch (e) { _invoiceSyncErrors.push("Client_Payments: " + e.toString()); } // FIX-04 (S4): record instead of swallow

    lock.releaseLock();

    // Premium Vertical Arabic Printed Invoice Template
    var emailBody = '<div style="direction:rtl; text-align:right; font-family:\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5ede3; padding:20px; display:flex; justify-content:center;">' +
      '<div style="background-color:#fff; width:650px; border:1px solid #dcd1c4; box-shadow:0 8px 24px rgba(0,0,0,0.15); display:flex; border-radius:12px; overflow:hidden; position:relative; min-height:850px;">' +
      '<div style="background-color:#3d2a1e; width:170px; color:#f0e6d3; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:30px 15px; position:relative; box-sizing:border-box;">' +
      '<div style="text-align:center; width:100%;">' +
      '<div style="font-size:24px; font-weight:bold; color:#c8a064; border:2px solid #c8a064; padding:5px 10px; border-radius:8px; display:inline-block; margin-bottom:8px; font-family:\'Georgia\', serif; font-style:italic;">BSA</div>' +
      '<div style="font-size:9px; color:#c8a064; text-transform:uppercase; letter-spacing:1px; margin-top:2px; font-weight:bold;">BIBLIOTHECA</div>' +
      '<div style="font-size:7px; color:#9d856f; text-transform:uppercase; letter-spacing:1px;">SCIENTIARUM AGENCY</div>' +
      '</div>' +
      '<div style="transform: rotate(-90deg); transform-origin: center center; font-size:38px; font-weight:800; color:rgba(200,160,100,0.1); letter-spacing:10px; margin: 30px 0; white-space:nowrap; text-transform:uppercase;">INVOICE</div>' +
      '<div style="text-align:center; width:100%; font-size:10px; color:#9d856f; display:flex; flex-direction:column; align-items:center; gap:8px;">' +
      '<svg style="width:50px; height:50px; background:#fff; padding:3px; border-radius:4px;" viewBox="0 0 100 100">' +
      '<rect x="10" y="10" width="20" height="20" fill="#3d2a1e" />' +
      '<rect x="70" y="10" width="20" height="20" fill="#3d2a1e" />' +
      '<rect x="10" y="70" width="20" height="20" fill="#3d2a1e" />' +
      '<rect x="35" y="35" width="30" height="30" fill="#3d2a1e" />' +
      '<rect x="75" y="75" width="15" height="15" fill="#3d2a1e" />' +
      '</svg>' +
      '<div style="font-size:8px; line-height:1.4; color:#dcd1c4; margin-top:4px;">' +
      '📍 6 أكتوبر - ميدان الحصري<br>برج الثورة 1 - الدور الرابع<br>' +
      '🌐 www.b-s-a.co<br>' +
      '✉️ info@b-s-a.co' +
      '</div>' +
      '<div style="margin-top:10px; width:70px; height:70px; border-radius:50%; border:2px dashed #0f52ba; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#0f52ba; font-weight:bold; font-size:8px; line-height:1.2; text-align:center; transform: rotate(-8deg); background:rgba(15,82,186,0.05); box-sizing:border-box;">' +
      '<div style="font-size:7px; font-weight:bold; border-bottom:1px solid #0f52ba; padding-bottom:1px; margin-bottom:1px;">وكالة مكتبة العلوم</div>' +
      '<div>BSA AGENCY</div>' +
      '<div style="font-size:5px; margin-top:1px; font-weight:normal;">مـعـتـمـد OFFICIAL</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div style="flex:1; padding:30px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between; background-color:#fff;">' +
      '<div>' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #f5ede3; padding-bottom:15px; margin-bottom:20px;">' +
      '<div>' +
      '<h1 style="color:#3d2a1e; font-size:32px; font-weight:800; margin:0; letter-spacing:1px; line-height:1;">INVOICE</h1>' +
      '<div style="color:#c8a064; font-size:12px; font-weight:700; margin-top:4px;">فاتورة إلكترونية معتمدة</div>' +
      '</div>' +
      '<div style="text-align:left; font-size:11px; color:#7a624d; line-height:1.5;">' +
      '<div>رقم الفاتورة: <strong style="color:#c8a064; font-size:13px;">' + invoiceId + '</strong></div>' +
      '<div>التاريخ: <strong>' + today + '</strong></div>' +
      '</div>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px; margin-bottom:25px;">' +
      '<div style="background-color:#faf8f5; border:1px solid #f0e8dc; border-radius:8px; padding:12px; font-size:12px; box-sizing:border-box;">' +
      '<div style="color:#c8a064; font-weight:bold; font-size:11px; margin-bottom:8px; border-bottom:1px solid #f0e8dc; padding-bottom:4px; text-transform:uppercase;">👤 بيانات العميل / Client Info</div>' +
      '<div style="margin-bottom:6px;"><span style="color:#7a624d;">الاسم (عربي):</span> <strong style="color:#3d2a1e;">' + clientName + '</strong></div>' +
      '<div style="margin-bottom:6px;"><span style="color:#7a624d;">الاسم (En):</span> <strong style="color:#3d2a1e;">' + (nameEn || '—') + '</strong></div>' +
      '<div style="margin-bottom:6px;"><span style="color:#7a624d;">رقم الهاتف:</span> <strong style="color:#3d2a1e;">' + clientPhone + '</strong></div>' +
      '<div style="margin-bottom:6px;"><span style="color:#7a624d;">الكورس:</span> <strong style="color:#3d2a1e;">' + course + '</strong></div>' +
      '<div style="margin-bottom:6px;"><span style="color:#7a624d;">العرض:</span> <strong style="color:#3d2a1e;">' + (offer || 'Cash') + '</strong></div>' +
      '<div><span style="color:#7a624d;">تاريخ الحضور:</span> <strong style="color:#3d2a1e;">' + (attendanceDate || '—') + '</strong></div>' +
      '</div>' +
      '<div style="background-color:#faf8f5; border:1px solid #f0e8dc; border-radius:8px; padding:12px; font-size:12px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">' +
      '<div>' +
      '<div style="color:#c8a064; font-weight:bold; font-size:11px; margin-bottom:8px; border-bottom:1px solid #f0e8dc; padding-bottom:4px; text-transform:uppercase;">💰 الدفعات والرسوم / Financials</div>' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:6px;">' +
      '<span style="color:#7a624d;">سعر الكورس:</span>' +
      '<strong style="color:#3d2a1e;">' + Number(price).toLocaleString() + ' L.E</strong>' +
      '</div>' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#3a7d44;">' +
      '<span style="font-weight:bold;">المدفوع:</span>' +
      '<strong>' + Number(paid).toLocaleString() + ' L.E</strong>' +
      '</div>' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#c62828; border-bottom:1px dashed #f0e8dc; padding-bottom:6px;">' +
      '<span style="font-weight:bold;">المتبقي:</span>' +
      '<strong>' + Number(remaining).toLocaleString() + ' L.E</strong>' +
      '</div>' +
      '</div>' +
      '<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-top:4px;">' +
      '<span style="color:#7a624d;">طريقة الدفع:</span>' +
      '<span style="background:#c8a064; color:#3d2a1e; padding:2px 8px; border-radius:4px; font-weight:bold;">' + method + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div style="border:1px solid #e0d0bc; border-radius:8px; padding:12px 15px; font-size:9.5px; line-height:1.5; color:#5d4037; background-color:#fffcf9;">' +
      '<div style="font-size:11px; font-weight:bold; color:#3d2a1e; margin-bottom:8px; text-align:center; border-bottom:1px solid #e0d0bc; padding-bottom:4px;">📜 شروط وسياسات التسجيل والالتزام (Policies)</div>' +
      '<div style="display:flex; flex-direction:column; gap:5px;">' +
      '<div>• <strong>الالتزام بالمواعيد:</strong> يلتزم المتدرب بالحضور في المواعيد المحددة للكورس. لا يُسمح بالتأخر أو الانصراف المبكر.</div>' +
      '<div>• <strong>الغياب:</strong> يجب إخطار الإدارة مسبقاً في حالة الغياب. لا يحق للمتدرب استرداد قيمة المحاضرة أو تعويضها إلا في حال إلغائها من المركز.</div>' +
      '<div>• <strong>الانضباط والسلوك:</strong> يلتزم المتدرب بالاحترام المتبادل مع المحاضرين والزملاء. يُمنع أي سلوك غير لائق يعرض صاحبه للاستبعاد الفوري دون استرداد الرسوم.</div>' +
      '<div>• <strong>سياسة التغيير والإلغاء:</strong> رسوم الكورس غير قابلة للاسترداد بعد بدء الدراسة لأي سبب كان. في حال طلب إلغاء الاشتراك قبل بدء الكورس بـ 15 يوماً، يتم خصم 750 جنيه رسوم حجز إدارية.</div>' +
      '<div>• <strong>التاسكات والتقييم:</strong> تنفيذ المشاريع والمهام (Tasks) جزء أساسي ولا يُعتبر الحضور مكتملاً أو تؤخذ الشهادة بدون إتمامها بنسبة 100%.</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #f5ede3; padding-top:15px; margin-top:20px; font-size:11px; color:#7a624d;">' +
      '<div>' +
      '<div>مبيعات الأكاديمية: <strong>' + agentName + '</strong></div>' +
      '<div style="font-size:9px; color:#aaa; margin-top:2px;">BSA Academy CRM · نظام الفواتير الإلكترونية المعتمد</div>' +
      '</div>' +
      '<div style="text-align:center; border-top:1px solid #c8a064; width:120px; padding-top:4px;">' +
      '<div style="font-family:\'Georgia\', serif; font-style:italic; font-size:12px; color:#3d2a1e; margin-bottom:2px; letter-spacing:1px;">BSA Bibliotheca</div>' +
      '<div style="font-size:9px; color:#aaa; text-transform:uppercase;">Authorised Sign</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    var emailRecipients = ["bsa.academy.co.2025@gmail.com"];
    if (agentEmail && agentEmail.indexOf("@") !== -1) {
      emailRecipients.push(agentEmail.trim());
    }

    try {
      MailApp.sendEmail({
        to: emailRecipients.join(","),
        subject: "🧾 فاتورة إلكترونية جديدة #" + invoiceId + " — العميل: " + clientName,
        htmlBody: emailBody
      });
    } catch (e) { }

    try {
      triggerCelebration(agentName);
    } catch(e) {}
    logActivity(agentId, agentName, "DIRECT_INVOICE", clientName + " - " + price + " EGP");
    SpreadsheetApp.flush();
    // FIX-04 (S4): if any downstream write failed above, attach a non-fatal `warnings`
    // field so the caller knows the invoice is only partially recorded. When everything
    // synced cleanly (_invoiceSyncErrors empty) the response is identical to before.
    var _invResult = { success: true, message: "✅ تم تسجيل الفاتورة بنجاح وإرسال الإيميل!", invoiceId: invoiceId, html: emailBody };
    if (_invoiceSyncErrors.length) {
      _invResult.warnings = _invoiceSyncErrors;
      _invResult.message = "⚠️ تم تسجيل الفاتورة لكن تعذّر تحديث بعض السجلات: " + _invoiceSyncErrors.join(" | ");
    }
    return _invResult;
  } catch (e) {
    try { lock.releaseLock(); } catch(le) {}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// WAITING LIST - العملاء الانتظار
// ==========================================
function getWaitingClients(agentId, agentName, isManager) {
  try {
    var today = new Date(); today.setHours(0, 0, 0, 0);

    // ════════════════════════════════════════════════════════════════
    // WAIT-FIX-2 (business rule): "Waiting Client" = a customer who took the action
    // that he WILL PAY but is NOT yet booked into a round (pre-booking). A customer who is
    // already enrolled/studying in a round (post-booking) — even with a Wait/overdue payment —
    // is NOT a waiting client and must be EXCLUDED here. So we first build an "enrolled" set
    // from Round_Members + any Client_Payments row that already has a round, and skip those.
    // ════════════════════════════════════════════════════════════════
    var enrolledOc = {}, enrolledName = {}, enrolledPhone = {};
    function _markEnrolled(oc, name, phone) {
      var k = ocKey(oc); if (k) enrolledOc[k] = true;
      var n = (name || "").toString().trim().toLowerCase(); if (n) enrolledName[n] = true;
      var p = (phone || "").toString().replace(/\D/g, ''); if (p) enrolledPhone[p.slice(-9)] = true;
    }
    function _isEnrolled(oc, name, phone) {
      var k = ocKey(oc); if (k && enrolledOc[k]) return true;
      var n = (name || "").toString().trim().toLowerCase(); if (n && enrolledName[n]) return true;
      var p = (phone || "").toString().replace(/\D/g, ''); if (p && enrolledPhone[p.slice(-9)]) return true;
      return false;
    }
    // sane-date helper (an empty/epoch date must NOT render as "متأخر 20628 يوم")
    function _dateInfo(raw) {
      var out = { diff: null, overdue: false, daysText: "بدون تاريخ", str: "" };
      if (!raw) return out;
      var dt = new Date(raw);
      if (isNaN(dt.getTime()) || dt.getFullYear() < 2015 || dt.getFullYear() > 2100) return out;
      dt.setHours(0, 0, 0, 0);
      out.diff = Math.round((dt - today) / 86400000);
      out.overdue = out.diff < 0;
      out.daysText = out.diff === 0 ? "اليوم" : out.diff < 0 ? "متأخر " + Math.abs(out.diff) + " يوم" : "بعد " + out.diff + " يوم";
      try { out.str = safeFormatDate(raw, Session.getScriptTimeZone(), "yyyy-MM-dd"); } catch (e) {}
      return out;
    }
    // enrolled from Round_Members (anyone in a round = studying)
    try {
      var rmSh = getSheet("Round_Members");
      if (rmSh) {
        var rmData = rmSh.getDataRange().getValues();
        for (var r = 1; r < rmData.length; r++) {
          if (!(rmData[r][0] || "").toString().trim()) continue; // must have a roundId
          _markEnrolled(rmData[r][1], rmData[r][2], rmData[r][3]);
        }
      }
    } catch (eRM) {}

    // Client_Payments: a row WITH a round → that customer is enrolled (mark for exclusion).
    // Build a payId lookup for the Promote button. IMPORTANT: a Client_Payments "Wait" booking is
    // NOT listed on the Waiting-Client page — a Wait/payment booking lives ONLY on the monthly
    // commission (payments) page until it is promoted to a round. The Waiting-Client page is strictly
    // the pre-booking "will pay" leads (My_Leads Action='waiting').
    var payIdMap = {};
    try {
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = getSheetDataCached("Client_Payments");
        for (var k = 1; k < cpData.length; k++) {
          if (cpData[k][19] === true || cpData[k][19] === "TRUE") continue; // skip soft-deleted
          var cpOc = (cpData[k][1] || "").toString().trim();
          var cpName = (cpData[k][2] || "").toString();
          var cpRoundId = (cpData[k][4] || "").toString().trim();
          var cpPid = (cpData[k][0] || "").toString().trim();
          if (cpRoundId && cpRoundId.toLowerCase() !== "wait") { _markEnrolled(cpOc, cpName, ""); }
          if (cpPid && cpOc && !payIdMap[cpOc]) payIdMap[cpOc] = cpPid;
        }
      }
    } catch (e2) {}

    // ── Source 1: My_Leads with Action='waiting' (the true "will pay" pre-booking clients) ──
    var waiting = [];
    var sh = getSheet("My_Leads");
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (!isManager && (data[i][6] || "").toString() !== agentId.toString()) continue;
      var lastAction = (data[i][8] || "").toString();
      if (lastAction.toLowerCase().indexOf("waiting") === -1) continue;
      var clientId = (data[i][0] || "").toString();
      var nm = data[i][2] || "", ph = data[i][3] || "";
      if (_isEnrolled(clientId, nm, ph)) continue; // already booked/studying → not a waiting client
      var di = _dateInfo(data[i][10]);
      waiting.push({
        id: clientId, payId: payIdMap[clientId] || payIdMap[ocKey(clientId)] || "",
        name: nm, phone: ph, course: data[i][5] || "",
        agent: data[i][7] || "", agentName: data[i][7] || "",
        lastAction: lastAction, notes: (data[i][9] || "").toString(),
        createdAt: data[i][1] ? safeFormatDate(data[i][1], Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        fuDate: di.str, diffDays: di.diff, overdue: di.overdue, daysText: di.daysText
      });
    }

    return waiting;
  } catch (e) { return []; }
}

// ==========================================
// ATTENDANCE & TASKS TRACKING
// ==========================================
function _normAttPhone(p) {
  // Normalize phone for comparison: strip non-digits, remove leading zeros → bare digits
  return (p||'').toString().replace(/\D/g,'').replace(/^0+/,'');
}

function getAttendanceData(roundId) {
  try {
    var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    var sh = masterSS.getSheetByName("Rounds_Attendance");
    if (!sh) {
      masterSS.insertSheet("Rounds_Attendance");
      sh = masterSS.getSheetByName("Rounds_Attendance");
      sh.appendRow(["RoundID", "StudentPhone", "StudentName", "AttendedList", "TasksList", "LastUpdated"]);
      sh.getRange(1, 1, 1, 6).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    }

    var data = sh.getDataRange().getValues();
    var attendance = [];
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString()) {
        attendance.push({
          phone: (data[i][1] || "").toString().trim(),
          phoneNorm: _normAttPhone(data[i][1]),
          name: (data[i][2] || "").toString(),
          attended: (data[i][3] || "").toString().split(",").map(function(x){return x.trim();}).filter(Boolean),
          tasks: (data[i][4] || "").toString().split(",").map(function(x){return x.trim();}).filter(Boolean)
        });
      }
    }

    // PORTAL-TASK LINK (2026-06-27): auto-tick a lecture's task when the student passed it on the
    // academy portal. Join: Round_Member phone → OC → academy student (by OC) → approved Academy_Tasks
    // → lecture order number (this round's content). Best-effort: any failure leaves manual data intact.
    try {
      var _rmSh = getSheet("Round_Members");
      var _content = getRoundContent(roundId).lectures; // sorted by order
      if (_rmSh && _content && _content.length) {
        var _lecNumById = {}; // academy lectureId → 1-based lecture number (grid column)
        for (var _ci = 0; _ci < _content.length; _ci++) _lecNumById[_content[_ci].id] = _ci + 1;

        var _stuSh = getSheet(ACAD_STUDENTS); var _sidByOc = {}; // ocKey → academy studentId
        if (_stuSh) { var _sd = _stuSh.getDataRange().getValues();
          for (var _s = 1; _s < _sd.length; _s++) { var _ok = ocKey(_sd[_s][10]); if (_ok) _sidByOc[_ok] = (_sd[_s][0]||"").toString(); } }

        var _tSh = getSheet(ACAD_TASKS); var _doneByStudent = {}; // studentId → {lectureNum: true}
        if (_tSh) { var _td = _tSh.getDataRange().getValues();
          for (var _t = 1; _t < _td.length; _t++) {
            var _stat = (_td[_t][9] || "").toString().toLowerCase();      // admin Status (unlock gate)
            var _ist  = (_td[_t][13] || "").toString().toLowerCase();     // instructor status
            if (_stat !== "approved" && _ist !== "approved") continue;    // only tasks done correctly
            var _sid = (_td[_t][1] || "").toString();
            var _num = _lecNumById[(_td[_t][4] || "").toString()];
            if (!_sid || !_num) continue;
            (_doneByStudent[_sid] = _doneByStudent[_sid] || {})[_num] = true;
          }
        }

        var _recByPhone = {};
        for (var _a = 0; _a < attendance.length; _a++) _recByPhone[attendance[_a].phoneNorm] = attendance[_a];

        var _rm = _rmSh.getDataRange().getValues();
        for (var _m = 1; _m < _rm.length; _m++) {
          if ((_rm[_m][0] || "").toString() !== roundId.toString()) continue;
          var _np = _normAttPhone(_rm[_m][3]);
          var _sid2 = _sidByOc[ocKey(_rm[_m][1])];
          if (!_np || !_sid2 || !_doneByStudent[_sid2]) continue;
          var _rec = _recByPhone[_np];
          if (!_rec) { _rec = { phone: (_rm[_m][3]||"").toString().trim(), phoneNorm: _np, name: (_rm[_m][2]||"").toString(), attended: [], tasks: [] }; attendance.push(_rec); _recByPhone[_np] = _rec; }
          if (!_rec.portalTasks) _rec.portalTasks = [];
          var _nums = _doneByStudent[_sid2];
          for (var _k in _nums) {
            if (_rec.tasks.indexOf(_k) === -1) _rec.tasks.push(_k);          // auto-tick the task
            if (_rec.portalTasks.indexOf(_k) === -1) _rec.portalTasks.push(_k); // flag its source = portal
          }
          _rec.tasks.sort(function (a, b) { return parseInt(a) - parseInt(b); });
        }
      }
    } catch (_pe) { /* portal merge is best-effort — never break attendance load */ }

    return attendance;
  } catch (e) { return []; }
}

function saveAttendanceData(roundId, phone, name, lectureNum, type, status) {
  // ATTENDANCE-VANISH FIX (2026-06-27): the grid fires one google.script.run save per
  // checkbox; marking several students/lectures quickly ran these as CONCURRENT executions
  // that each read the same comma-list, mutated it, and wrote back — last writer wins, so
  // earlier marks disappeared. Serialize the read-modify-write under a script lock + flush.
  var _attLock = LockService.getScriptLock();
  try {
    _attLock.waitLock(20000);
    var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    var sh = masterSS.getSheetByName("Rounds_Attendance");
    if (!sh) {
      masterSS.insertSheet("Rounds_Attendance");
      sh = masterSS.getSheetByName("Rounds_Attendance");
      sh.appendRow(["RoundID", "StudentPhone", "StudentName", "AttendedList", "TasksList", "LastUpdated"]);
      sh.getRange(1, 1, 1, 6).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    }

    var data = sh.getDataRange().getValues();
    var rowIndex = -1;
    var normPhone = _normAttPhone(phone);
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString() &&
        _normAttPhone(data[i][1]) === normPhone) {
        rowIndex = i + 1;
        break;
      }
    }

    var lec = lectureNum.toString().trim();
    if (rowIndex === -1) {
      // Create new row
      var attendedStr = (type === "attendance" && status) ? lec : "";
      var tasksStr = (type === "task" && status) ? lec : "";
      sh.appendRow([roundId, phone, name, attendedStr, tasksStr, new Date()]);
    } else {
      // Update existing row
      var colIdx = (type === "attendance") ? 4 : 5; // D = AttendedList (col 4), E = TasksList (col 5)
      var currentStr = (data[rowIndex - 1][colIdx - 1] || "").toString().trim();
      var currentArr = currentStr.split(",").filter(Boolean);

      var idx = currentArr.indexOf(lec);
      if (status) {
        if (idx === -1) currentArr.push(lec);
      } else {
        if (idx !== -1) currentArr.splice(idx, 1);
      }

      currentArr.sort(function (a, b) { return parseInt(a) - parseInt(b); });
      sh.getRange(rowIndex, colIdx).setValue(currentArr.join(","));
      sh.getRange(rowIndex, 6).setValue(new Date()); // Update timestamp
    }
    SpreadsheetApp.flush(); // commit the write before releasing the lock so the next save reads it

    // Check if this save triggers a salary payment alert
    if (status) { // Only check when marking attendance (not unmarking)
      try {
        var salAlert = checkSalaryAlertForRound(roundId);
        if (salAlert) return { success: true, salaryAlert: salAlert };
      } catch(ae) { Logger.log("Salary alert check error: " + ae.toString()); }
    }

    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
  finally { try { _attLock.releaseLock(); } catch (_e) {} }
}

// ==========================================
// SAFE DATE FORMAT UTILITY
// ==========================================
function safeFormatDate(val, timeZone, format) {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    try {
      return Utilities.formatDate(val, timeZone, format);
    } catch (e) {
      return "";
    }
  }
  
  // Try to parse spreadsheet date serial numbers (e.g. 46205)
  var num = parseFloat(val);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    var d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      try {
        // Adjust for timezone offset if necessary
        return Utilities.formatDate(d, timeZone, format);
      } catch (e) {}
    }
  }

  var str = val.toString().trim();
  if (!str) return "";
  
  // Try standard parse
  var d = new Date(str);
  if (!isNaN(d.getTime())) {
    try {
      return Utilities.formatDate(d, timeZone, format);
    } catch (e) {}
  }
  
  // Try dd/MM/yyyy or dd-MM-yyyy
  var match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10) - 1;
    var year = parseInt(match[3], 10);
    var customD = new Date(year, month, day);
    if (!isNaN(customD.getTime())) {
      try {
        return Utilities.formatDate(customD, timeZone, format);
      } catch (e) {}
    }
  }
  
  // Try yyyy/MM/dd or yyyy-MM-dd
  var match2 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (match2) {
    var year = parseInt(match2[1], 10);
    var month = parseInt(match2[2], 10) - 1;
    var day = parseInt(match2[3], 10);
    var customD = new Date(year, month, day);
    if (!isNaN(customD.getTime())) {
      try {
        return Utilities.formatDate(customD, timeZone, format);
      } catch (e) {}
    }
  }
  
  return "";
}

// ==========================================
// GET IDLE LEADS
// ==========================================
function getIdleLeads(agentId, daysLimit) {
  try {
    var sh = getSheet("My_Leads");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var idle = [];
    var today = new Date();
    var limit = daysLimit || 3;

    for (var i = 1; i < data.length; i++) {
      if ((data[i][6] || "").toString() !== agentId.toString()) continue;
      var lastDate = data[i][1];
      if (!(lastDate instanceof Date)) {
        lastDate = new Date(lastDate);
      }
      if (isNaN(lastDate.getTime())) continue;

      var diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= limit) {
        var lastAction = (data[i][8] || "").toString().toLowerCase(); // index 8 = Action
        if (lastAction.indexOf("won") !== -1 || lastAction.indexOf("lost") !== -1) continue;

        idle.push({
          id: (data[i][0] || "").toString(),
          name: data[i][2] || "",
          phone: data[i][3] || "",
          daysAgo: diffDays
        });
      }
    }
    return idle.sort(function (a, b) { return b.daysAgo - a.daysAgo; });
  } catch (e) {
    return [];
  }
}

// ==========================================
// MASTER ACADEMY LEDGER & HISTORICAL IMPORT
// ==========================================

function initAcademyLedgerSheet() {
  var sh = getSheet("Academy_Ledger");
  if (!sh) {
    getMaster().insertSheet("Academy_Ledger");
    sh = getSheet("Academy_Ledger");
    var headers = [
      "تاريخ الحجز", 
      "كود الOC", 
      "اسم العميل", 
      "رقم الهاتف", 
      "الكورس", 
      "اسم المجموعة", 
      "الحالة", 
      "السعر الكلي", 
      "طريقة الدفع", 
      "المبلغ المدفوع", 
      "المبلغ المتبقي", 
      "تفاصيل القسط 1", 
      "تفاصيل القسط 2", 
      "تفاصيل القسط 3", 
      "موظف السيلز"
    ];
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, 15).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    SpreadsheetApp.flush();
  }
  return sh;
}

function syncClientPaymentToLedger(payId) {
  try {
    var paySh = getSheet("Client_Payments");
    if (!paySh) return { success: false, message: "Client_Payments sheet not found" };
    var payData = paySh.getDataRange().getValues();
    
    var rowIdx = -1;
    for (var i = 1; i < payData.length; i++) {
      if ((payData[i][0] || "").toString().trim() === payId.toString().trim()) {
        rowIdx = i;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, message: "Payment record not found" };
    
    var r = payData[rowIdx];
    var pId = r[0].toString();
    var ocCode = r[1] || "";
    // FIX-07 (Quarantine): a payment with no OC is Pending — skip ledger sync entirely so we never
    // append blank-OC ledger rows (the unbounded-duplicate source, D7). Runs again once OC is resolved.
    if (!ocKey(ocCode)) {
      return { success: true, skipped: true, pendingOc: true, message: "تم التخطّي: العميل بدون OC (Pending) — لم تتم مزامنة الليدجر" };
    }
    var clientName = r[2] || "";
    var course = r[3] || "";
    var roundId = r[4] || "";
    var roundName = r[5] || "";
    var total = parseFloat(r[6]) || 0;
    var agentId = r[7] || "";
    var agentName = r[8] || "";
    var paid = parseFloat(r[9]) || 0;
    var remaining = parseFloat(r[10]) || 0;
    
    var nextDueVal = r[11];
    var nextDueStr = "";
    if (nextDueVal) {
      var nextDueDate = (nextDueVal instanceof Date) ? nextDueVal : new Date(nextDueVal);
      if (!isNaN(nextDueDate.getTime())) {
        nextDueStr = safeFormatDate(nextDueDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
    }
    
    var status = r[12] || "";
    var notes = r[13] || "";
    
    var createdAtVal = r[14];
    var createdAtStr = "";
    if (createdAtVal) {
      var crDate = (createdAtVal instanceof Date) ? createdAtVal : new Date(createdAtVal);
      if (!isNaN(crDate.getTime())) {
        createdAtStr = safeFormatDate(crDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
    }
    
    var inst1 = parseFloat(r[15]) || 0;
    var inst2 = parseFloat(r[16]) || 0;
    var inst3 = parseFloat(r[17]) || 0;
    
    // Load phone from Raw_Data
    var phone = "";
    try {
      var rawSh = getSheet("Raw_Data");
      var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
      for (var j = 1; j < rawData.length; j++) {
        var rowId = (rawData[j][0] || "").toString().trim();
        var rowOc = (rawData[j][14] || "").toString().trim();
        if (ocEq(rowOc, ocCode) || rowId === ocCode) { // FIX-07: ocKey-normalized OC join
          phone = rawData[j][3] || "";
          break;
        }
      }
    } catch (e) { }
    
    // Load transactions from Payment_Transactions
    var txSh = getSheet("Payment_Transactions");
    var txData = txSh ? txSh.getDataRange().getValues() : [];
    var txs = [];
    for (var k = 1; k < txData.length; k++) {
      if ((txData[k][1] || "").toString().trim() === pId.trim()) {
        var txDateVal = txData[k][4];
        var txDateStr = "";
        if (txDateVal) {
          var txd = (txDateVal instanceof Date) ? txDateVal : new Date(txDateVal);
          if (!isNaN(txd.getTime())) txDateStr = safeFormatDate(txd, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        txs.push({
          amount: parseFloat(txData[k][3]) || 0,
          date: txDateStr,
          method: txData[k][8] || "Cash",
          type: txData[k][5] || ""
        });
      }
    }
    
    // Format installment details L, M, N
    var inst1Detail = "";
    var inst2Detail = "";
    var inst3Detail = "";
    
    // Installment 1
    if (inst1 > 0) {
      if (txs.length > 0) {
        inst1Detail = inst1 + " - " + txs[0].date + " - " + txs[0].method + " - Paid";
      } else {
        inst1Detail = inst1 + " - " + (createdAtStr || todayStr()) + " - Cash - Paid";
      }
    }
    
    // Installment 2
    if (inst2 > 0) {
      if (txs.length > 1) {
        inst2Detail = inst2 + " - " + txs[1].date + " - " + txs[1].method + " - Paid";
      } else {
        inst2Detail = inst2 + " - " + (nextDueStr || "") + " - Cash - Pending";
      }
    }
    
    // Installment 3
    if (inst3 > 0) {
      if (txs.length > 2) {
        inst3Detail = inst3 + " - " + txs[2].date + " - " + txs[2].method + " - Paid";
      } else {
        inst3Detail = inst3 + " - " + (nextDueStr || "") + " - Cash - Pending";
      }
    }
    
    // Default main payment method to the first transaction's method
    var mainMethod = txs.length > 0 ? txs[0].method : "Cash";
    
    // Synchronize to Academy_Ledger
    var ledgerSh = initAcademyLedgerSheet();
    var ledgerData = ledgerSh.getDataRange().getValues();
    var matchedLedgerRow = -1;
    
    for (var l = 1; l < ledgerData.length; l++) {
      var rowOc = (ledgerData[l][1] || "").toString().trim();
      if (ocEq(rowOc, ocCode)) { // FIX-07: ocKey-normalized OC join (ledger upsert)
        matchedLedgerRow = l + 1;
        break;
      }
    }
    
    var rowValues = [
      createdAtStr || todayStr(),      // A: تاريخ الحجز
      ocCode,                          // B: كود الOC
      clientName,                      // C: اسم العميل
      phone,                           // D: رقم الهاتف
      course,                          // E: الكورس
      roundName || "Wait",             // F: اسم المجموعة
      remaining <= 0 ? "خالص" : "تقسيط", // G: الحالة
      total,                           // H: السعر الكلي
      mainMethod,                      // I: طريقة الدفع
      paid,                            // J: المبلغ المدفوع
      remaining,                       // K: المبلغ المتبقي
      inst1Detail,                     // L: تفاصيل القسط 1
      inst2Detail,                     // M: تفاصيل القسط 2
      inst3Detail,                     // N: تفاصيل القسط 3
      agentName                        // O: اسم موظف السيلز
    ];
    
    if (matchedLedgerRow !== -1) {
      ledgerSh.getRange(matchedLedgerRow, 1, 1, 15).setValues([rowValues]);
    } else {
      ledgerSh.appendRow(rowValues);
    }
    SpreadsheetApp.flush();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function getAcademyLedgerData(agentId, isManager) {
  try {
    initAcademyLedgerSheet();
    var sh = getSheet("Academy_Ledger");
    var data = sh.getDataRange().getValues();
    var ledger = [];
    var tz = Session.getScriptTimeZone();
    
    // Look up current user to enable robust agent matching by name/key
    var currentUserObj = null;
    try {
      var users = getUsers();
      for (var u = 0; u < users.length; u++) {
        if (users[u].id.toString().trim() === agentId.toString().trim()) {
          currentUserObj = users[u];
          break;
        }
      }
    } catch (userErr) { }
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][2]) continue; // Skip empty name rows
      
      var rowAgentName = (data[i][14] || "").toString().trim().toLowerCase(); // Col O is Sales Agent Name (index 14)
      
      if (!isManager) {
        var matches = false;
        if (currentUserObj) {
          var uName = currentUserObj.name.trim().toLowerCase();
          var uKey = (currentUserObj.agentKey || "").trim().toLowerCase();
          if (rowAgentName === uName) matches = true;
          if (uKey && rowAgentName === uKey) matches = true;
        }
        if (!matches) continue;
      }
      
      var dateStr = "";
      var dateVal = data[i][0]; // Col A (index 0)
      if (dateVal) {
        if (dateVal instanceof Date) {
          dateStr = safeFormatDate(dateVal, tz, "yyyy-MM-dd");
        } else {
          dateStr = dateVal.toString();
        }
      }
      
      ledger.push({
        reservationDate: dateStr,
        ocCode: data[i][1] || "",
        clientName: data[i][2] || "",
        phone: data[i][3] || "",
        course: data[i][4] || "",
        roundName: data[i][5] || "",
        status: data[i][6] || "",
        totalPrice: parseFloat(data[i][7]) || 0,
        paymentMethod: data[i][8] || "",
        paidAmount: parseFloat(data[i][9]) || 0,
        remainingAmount: parseFloat(data[i][10]) || 0,
        inst1Detail: data[i][11] || "",
        inst2Detail: data[i][12] || "",
        inst3Detail: data[i][13] || "",
        agentName: data[i][14] || ""
      });
    }
    return ledger;
  } catch (e) {
    return [];
  }
}

function importAcademyFinancialData(sourceSpreadsheetId) {
  try {
    var sourceSS = SpreadsheetApp.openById(sourceSpreadsheetId);
    var sourceSh = sourceSS.getSheets()[0];
    var sourceData = sourceSh.getDataRange().getValues();
    
    var rawSh = getSheet("Raw_Data");
    var paySh = getSheet("Client_Payments");
    var txSh = getSheet("Payment_Transactions");
    var ledgerSh = initAcademyLedgerSheet();
    
    var count = 0;
    
    for (var i = 1; i < sourceData.length; i++) {
      var row = sourceData[i];
      var reservationDate = row[0];
      var ocCode = (row[1] || "").toString().trim();
      var clientName = (row[2] || "").toString().trim();
      var phone = (row[3] || "").toString().trim();
      var course = (row[4] || "").toString().trim();
      var roundName = (row[5] || "").toString().trim();
      var status = (row[6] || "").toString().trim();
      var totalPrice = parseFloat(row[7]) || 0;
      var paymentMethod = (row[8] || "").toString().trim() || "Cash";
      var paidAmount = parseFloat(row[9]) || 0;
      var remainingAmount = parseFloat(row[10]) || 0;
      var inst1Detail = (row[11] || "").toString().trim();
      var inst2Detail = (row[12] || "").toString().trim();
      var inst3Detail = (row[13] || "").toString().trim();
      var agentName = (row[14] || "").toString().trim();
      
      if (!ocCode && !clientName) continue;
      
      // Parse reservation date nicely
      var resDate = null;
      if (reservationDate) {
        resDate = (reservationDate instanceof Date) ? reservationDate : new Date(reservationDate);
        if (isNaN(resDate.getTime())) resDate = new Date();
      } else {
        resDate = new Date();
      }
      
      // 1. Sync to Raw_Data
      var rawData = rawSh.getDataRange().getValues();
      var rawRowIdx = -1;
      var cleanPh = cleanPhone(phone);
      for (var j = 1; j < rawData.length; j++) {
        var rowId = (rawData[j][0] || "").toString().trim();
        var rowOc = (rawData[j][14] || "").toString().trim();
        if (ocEq(rowOc, ocCode) || (cleanPh && cleanPhone(rawData[j][3]) === cleanPh)) { // FIX-07
          rawRowIdx = j + 1;
          break;
        }
      }
      
      var finalId = rawRowIdx !== -1 ? rawData[rawRowIdx - 1][0] : getNextIdFromData(rawData);
      if (rawRowIdx !== -1) {
        // Update Raw_Data
        rawSh.getRange(rawRowIdx, 3).setValue(clientName);
        rawSh.getRange(rawRowIdx, 4).setValue(phone);
        rawSh.getRange(rawRowIdx, 6).setValue(course);
        rawSh.getRange(rawRowIdx, 7).setValue(agentName);
        rawSh.getRange(rawRowIdx, 8).setValue("Closed Won");
        rawSh.getRange(rawRowIdx, 15).setValue(ocCode);
      } else {
        // Append to Raw_Data
        rawSh.appendRow([finalId, resDate, clientName, phone, "استيراد تاريخي", course, agentName, "Closed Won", "", "Closed Won", "", "", "", "", ocCode]);
      }
      
      // 2. Sync to Client_Payments
      var payData = paySh.getDataRange().getValues();
      var payRowIdx = -1;
      for (var p = 1; p < payData.length; p++) {
        var rowOc = (payData[p][1] || "").toString().trim();
        if (ocEq(rowOc, ocCode)) { // FIX-07: ocKey-normalized OC join
          payRowIdx = p + 1;
          break;
        }
      }
      
      var payId = payRowIdx !== -1 ? payData[payRowIdx - 1][0] : genId();
      
      function parseInstAmount(detail) {
        if (!detail) return 0;
        var p = detail.split(" - ");
        return parseFloat(p[0]) || 0;
      }
      var inst1 = parseInstAmount(inst1Detail);
      var inst2 = parseInstAmount(inst2Detail);
      var inst3 = parseInstAmount(inst3Detail);
      
      var payRowValues = [
        payId, 
        ocCode, 
        clientName, 
        course, 
        "", // roundId
        roundName, 
        totalPrice, 
        "", // agentId
        agentName, 
        paidAmount, 
        remainingAmount, 
        "", // nextDue
        remainingAmount <= 0 ? "Paid" : "Installment", 
        "استيراد تاريخي", 
        resDate, 
        inst1, 
        inst2, 
        inst3
      ];
      
      if (payRowIdx !== -1) {
        paySh.getRange(payRowIdx, 1, 1, 18).setValues([payRowValues]);
      } else {
        paySh.appendRow(payRowValues);
      }
      
      // 3. Sync to Payment_Transactions
      var txData = txSh.getDataRange().getValues();
      for (var t = txData.length - 1; t >= 1; t--) {
        if ((txData[t][1] || "").toString().trim() === payId.toString().trim()) {
          txSh.deleteRow(t + 1);
        }
      }
      
      function addTxFromDetail(detail, type) {
        if (!detail) return;
        var p = detail.split(" - ");
        var amt = parseFloat(p[0]) || 0;
        var dateStr = p[1] || "";
        var method = p[2] || "Cash";
        var isPaid = (p[3] || "").toLowerCase().indexOf("paid") !== -1 || (p[3] || "").indexOf("مدفوع") !== -1 || (p[3] || "") === "";
        
        if (amt > 0 && isPaid) {
          var txDate = new Date(dateStr);
          if (isNaN(txDate.getTime())) txDate = resDate;
          txSh.appendRow([genId(), payId, clientName, amt, txDate, type, "", agentName, method]);
        }
      }
      addTxFromDetail(inst1Detail, "أول دفعة");
      addTxFromDetail(inst2Detail, "قسط");
      addTxFromDetail(inst3Detail, "قسط");
      
      // 4. Write to Academy_Ledger
      var ledgerData = ledgerSh.getDataRange().getValues();
      var ledgerRowIdx = -1;
      for (var l = 1; l < ledgerData.length; l++) {
        var rowOc = (ledgerData[l][1] || "").toString().trim();
        if (ocEq(rowOc, ocCode)) { // FIX-07: ocKey-normalized OC join
          ledgerRowIdx = l + 1;
          break;
        }
      }
      
      var ledgerRowValues = [
        safeFormatDate(resDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
        ocCode,
        clientName,
        phone,
        course,
        roundName || "Wait",
        remainingAmount <= 0 ? "خالص" : "تقسيط",
        totalPrice,
        paymentMethod,
        paidAmount,
        remainingAmount,
        inst1Detail,
        inst2Detail,
        inst3Detail,
        agentName
      ];
      
      if (ledgerRowIdx !== -1) {
        ledgerSh.getRange(ledgerRowIdx, 1, 1, 15).setValues([ledgerRowValues]);
      } else {
        ledgerSh.appendRow(ledgerRowValues);
      }
      
      count++;
    }
    
    SpreadsheetApp.flush();
    return { success: true, count: count, message: "✅ تم استيراد " + count + " سجل بنجاح!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function importHistoricalData(spreadsheetId) {
  try {
    if (!spreadsheetId) {
      return { success: false, message: "لم يتم تقديم معرف أو رابط الشيت" };
    }
    
    var sourceSS = SpreadsheetApp.openById(spreadsheetId);
    var sheets = sourceSS.getSheets();
    
    var rawSh = getSheet("Raw_Data");
    var paySh = getSheet("Client_Payments");
    var txSh = getSheet("Payment_Transactions");
    var ledgerSh = initAcademyLedgerSheet();
    
    var count = 0;
    var tz = Session.getScriptTimeZone();
    
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var name = sheet.getName();
      
      // Filter only 2026 sheets, ignore 2025
      if (name.indexOf("2026") === -1 || name.indexOf("2025") !== -1) {
        continue;
      }
      
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) continue;
      
      // Dynamic header mapping
      var headers = data[0].map(function(h) { return (h || "").toString().trim().toLowerCase(); });
      
      var nameIdx = -1, phoneIdx = -1, emailIdx = -1, salesIdx = -1, priceIdx = -1;
      var paidIdx = -1, unpaidIdx = -1, methodIdx = -1, dateIdx = -1, numIdx = -1;
      
      // Keep track of multiple "الراوند" or group/course columns
      var roundIndices = [];
      var courseIndices = [];
      
      var instIndices = {};
      var instDateIndices = {};
      
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        
        // Exact or partial match for columns
        if (h.indexOf("الاس") === 0 || h === "الاسم" || h === "name" || h === "client") {
          nameIdx = c;
        } else if (h.indexOf("هاتف") !== -1 || h.indexOf("موبايل") !== -1 || h.indexOf("تليفون") !== -1 || h === "phone") {
          phoneIdx = c;
        } else if (h === "gmail" || h.indexOf("البريد") !== -1 || h === "email") {
          emailIdx = c;
        } else if (h.indexOf("سيلز") !== -1 || h.indexOf("sales") !== -1 || h.indexOf("الموظف") !== -1) {
          salesIdx = c;
        } else if (h.indexOf("سعر") !== -1 || h === "price" || h.indexOf("سعر الكورس") !== -1) {
          priceIdx = c;
        } else if (h === "paid" || h === "المدفوع") {
          paidIdx = c;
        } else if (h === "unpaid" || h === "المتبقي" || h === "الرصيد") {
          unpaidIdx = c;
        } else if (h.indexOf("طريقة") !== -1 || h === "method") {
          methodIdx = c;
        } else if (h === "التاريخ" || h === "تاريخ" || h === "date" || h === "تاريخ الحجز") {
          dateIdx = c;
        } else if (h === "الرقم" || h === "الرقم المسلسل" || h === "id" || h === "no") {
          numIdx = c;
        }
        
        if (h.indexOf("راوند") !== -1 || h === "الراوند" || h === "round" || h === "المجموعة") {
          roundIndices.push(c);
        }
        if (h.indexOf("كورس") !== -1 || h === "الكورس" || h === "course" || h === "نوع الكورس") {
          courseIndices.push(c);
        }
        
        // Dynamic installments: e.g. "دفعة 1" or "قسط 1"
        if ((h.indexOf("دفعة") === 0 || h.indexOf("قسط") === 0) && h.indexOf("تاريخ") === -1) {
          var numStr = h.replace("دفعة", "").replace("قسط", "").trim();
          var num = parseInt(numStr);
          if (!isNaN(num)) {
            instIndices[num] = c;
          }
        }
        // Dynamic installment dates: e.g. "تاريخ دفعة 1" or "تاريخ قسط 1"
        if (h.indexOf("تاريخ") !== -1 && (h.indexOf("دفعة") !== -1 || h.indexOf("قسط") !== -1)) {
          var numStr = h.replace("تاريخ", "").replace("دفعة", "").replace("قسط", "").trim();
          var num = parseInt(numStr);
          if (!isNaN(num)) {
            instDateIndices[num] = c;
          }
        }
      }
      
      // Process rows
      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        
        // Skip if client name is empty
        var clientName = nameIdx !== -1 ? (row[nameIdx] || "").toString().trim() : "";
        if (!clientName) continue;
        
        var phone = phoneIdx !== -1 ? (row[phoneIdx] || "").toString().trim() : "";
        var email = emailIdx !== -1 ? (row[emailIdx] || "").toString().trim() : "";
        var sheetAgentName = salesIdx !== -1 ? (row[salesIdx] || "").toString().trim() : "";
        var totalPrice = priceIdx !== -1 ? parseFloat(row[priceIdx]) || 0 : 0;
        var paidAmount = paidIdx !== -1 ? parseFloat(row[paidIdx]) || 0 : 0;
        var remainingAmount = unpaidIdx !== -1 ? parseFloat(row[unpaidIdx]) || 0 : (totalPrice - paidAmount);
        var paymentMethod = methodIdx !== -1 ? (row[methodIdx] || "").toString().trim() : "Cash";
        var serialNum = numIdx !== -1 ? (row[numIdx] || "").toString().trim() : "";
        
        // Combine round columns if multiple exist (e.g. Round Month and Round Type/Details)
        var roundParts = [];
        for (var ri = 0; ri < roundIndices.length; ri++) {
          var val = (row[roundIndices[ri]] || "").toString().trim();
          if (val) roundParts.push(val);
        }
        var roundName = roundParts.join(" - ") || "Wait";
        
        // Combine course name
        var courseParts = [];
        for (var ci = 0; ci < courseIndices.length; ci++) {
          var val = (row[courseIndices[ci]] || "").toString().trim();
          if (val) courseParts.push(val);
        }
        var course = courseParts.join(" - ") || "ديجيتال ماركتنج";
        
        // Reservation date
        var reservationDate = dateIdx !== -1 ? row[dateIdx] : null;
        var resDate = null;
        if (reservationDate) {
          resDate = (reservationDate instanceof Date) ? reservationDate : new Date(reservationDate);
          if (isNaN(resDate.getTime())) resDate = new Date();
        } else {
          resDate = new Date();
        }
        
        // Resolve agent details
        var agentDetails = resolveAgentDetails(sheetAgentName);
        var agentId = agentDetails.id || "";
        var agentName = agentDetails.name || sheetAgentName;
        
        // FIX-07: external invoice system is the SOLE OC source — do NOT fabricate (no serial / last-9 / random).
        // If no OC resolved, leave it blank → the imported row is Pending OC (quarantined).
        var ocCode = ensureOcCode("", "", phone, clientName) || "";
        if (ocCode && ocCode.toLowerCase().indexOf("oc-") !== 0) {
          ocCode = "OC-" + ocCode.toUpperCase();
        }
        
        // 1. Sync to Raw_Data
        var rawData = rawSh.getDataRange().getValues();
        var rawRowIdx = -1;
        var cleanPh = cleanPhone(phone);
        for (var j = 1; j < rawData.length; j++) {
          var rowId = (rawData[j][0] || "").toString().trim();
          var rowOc = (rawData[j][14] || "").toString().trim();
          if (ocEq(rowOc, ocCode) || (cleanPh && cleanPhone(rawData[j][3]) === cleanPh)) { // FIX-07
            rawRowIdx = j + 1;
            break;
          }
        }
        
        var finalId = rawRowIdx !== -1 ? rawData[rawRowIdx - 1][0] : getNextIdFromData(rawData);
        if (rawRowIdx !== -1) {
          rawSh.getRange(rawRowIdx, 3).setValue(clientName);
          rawSh.getRange(rawRowIdx, 4).setValue(phone);
          rawSh.getRange(rawRowIdx, 6).setValue(course);
          rawSh.getRange(rawRowIdx, 7).setValue(agentName);
          rawSh.getRange(rawRowIdx, 8).setValue("Closed Won");
          rawSh.getRange(rawRowIdx, 15).setValue(ocCode);
        } else {
          rawSh.appendRow([
            finalId, resDate, clientName, phone, 
            "استيراد تاريخي", course, agentName, 
            "Closed Won", "", "Closed Won", "", "", "", "", ocCode
          ]);
        }
        
        // Parse Installments
        var inst1 = instIndices[1] !== undefined ? parseFloat(row[instIndices[1]]) || 0 : 0;
        var inst2 = instIndices[2] !== undefined ? parseFloat(row[instIndices[2]]) || 0 : 0;
        var inst3 = instIndices[3] !== undefined ? parseFloat(row[instIndices[3]]) || 0 : 0;
        
        var inst1Date = instDateIndices[1] !== undefined ? row[instDateIndices[1]] : null;
        var inst2Date = instDateIndices[2] !== undefined ? row[instDateIndices[2]] : null;
        var inst3Date = instDateIndices[3] !== undefined ? row[instDateIndices[3]] : null;
        
        // Fallbacks if no installment values found, but paid/remaining exist
        if (inst1 === 0 && paidAmount > 0) {
          inst1 = paidAmount;
        }
        if (inst2 === 0 && remainingAmount > 0) {
          inst2 = remainingAmount;
        }
        
        // 2. Sync to Client_Payments
        var payData = paySh.getDataRange().getValues();
        var payRowIdx = -1;
        for (var p = 1; p < payData.length; p++) {
          var rowOc = (payData[p][1] || "").toString().trim();
          if (ocEq(rowOc, ocCode)) { // FIX-07: ocKey-normalized OC join
            payRowIdx = p + 1;
            break;
          }
        }
        
        var payId = payRowIdx !== -1 ? payData[payRowIdx - 1][0] : genId();
        
        var payRowValues = [
          payId, 
          ocCode, 
          clientName, 
          course, 
          "", // roundId
          roundName, 
          totalPrice, 
          agentId, 
          agentName, 
          paidAmount, 
          remainingAmount, 
          "", // nextDue
          remainingAmount <= 0 ? "Paid" : "Installment", 
          "استيراد تاريخي", 
          resDate, 
          inst1, 
          inst2, 
          inst3
        ];
        
        if (payRowIdx !== -1) {
          paySh.getRange(payRowIdx, 1, 1, 18).setValues([payRowValues]);
        } else {
          paySh.appendRow(payRowValues);
        }
        
        // 3. Sync to Payment_Transactions
        var txData = txSh.getDataRange().getValues();
        for (var t = txData.length - 1; t >= 1; t--) {
          if ((txData[t][1] || "").toString().trim() === payId.toString().trim()) {
            txSh.deleteRow(t + 1);
          }
        }
        
        function formatImportedInstDetail(amt, dateVal, method) {
          if (!amt || amt <= 0) return "";
          var dateStr = "";
          var status = "Paid";
          if (dateVal) {
            if (dateVal instanceof Date) {
              dateStr = safeFormatDate(dateVal, tz, "yyyy-MM-dd");
              if (dateVal.getTime() > new Date().getTime()) {
                status = "Pending";
              }
            } else {
              dateStr = dateVal.toString().trim();
              var parsedDate = new Date(dateStr);
              if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > new Date().getTime()) {
                status = "Pending";
              }
            }
          } else {
            dateStr = safeFormatDate(new Date(), tz, "yyyy-MM-dd");
          }
          return amt + " - " + dateStr + " - " + method + " - " + status;
        }
        
        var inst1Detail = formatImportedInstDetail(inst1, inst1Date || resDate, paymentMethod);
        var inst2Detail = formatImportedInstDetail(inst2, inst2Date, paymentMethod);
        var inst3Detail = formatImportedInstDetail(inst3, inst3Date, paymentMethod);
        
        function addTxFromDetail(detail, type) {
          if (!detail) return;
          var p = detail.split(" - ");
          var amt = parseFloat(p[0]) || 0;
          var dateStr = p[1] || "";
          var method = p[2] || "Cash";
          var isPaid = (p[3] || "").toLowerCase().indexOf("paid") !== -1 || (p[3] || "").indexOf("مدفوع") !== -1 || (p[3] || "") === "";
          
          if (amt > 0 && isPaid) {
            var txDate = new Date(dateStr);
            if (isNaN(txDate.getTime())) txDate = resDate;
            txSh.appendRow([genId(), payId, clientName, amt, txDate, type, agentId, agentName, method]);
          }
        }
        
        addTxFromDetail(inst1Detail, "أول دفعة");
        addTxFromDetail(inst2Detail, "قسط");
        addTxFromDetail(inst3Detail, "قسط");
        
        // 4. Write to Academy_Ledger
        var ledgerData = ledgerSh.getDataRange().getValues();
        var ledgerRowIdx = -1;
        for (var l = 1; l < ledgerData.length; l++) {
          var rowOc = (ledgerData[l][1] || "").toString().trim();
          if (ocEq(rowOc, ocCode)) { // FIX-07: ocKey-normalized OC join
            ledgerRowIdx = l + 1;
            break;
          }
        }
        
        var ledgerRowValues = [
          safeFormatDate(resDate, tz, "yyyy-MM-dd"),
          ocCode,
          clientName,
          phone,
          course,
          roundName || "Wait",
          remainingAmount <= 0 ? "خالص" : "تقسيط",
          totalPrice,
          paymentMethod,
          paidAmount,
          remainingAmount,
          inst1Detail,
          inst2Detail,
          inst3Detail,
          agentName
        ];
        
        if (ledgerRowIdx !== -1) {
          ledgerSh.getRange(ledgerRowIdx, 1, 1, 15).setValues([ledgerRowValues]);
        } else {
          ledgerSh.appendRow(ledgerRowValues);
        }
        
        count++;
      }
    }
    
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم استيراد ومزامنة " + count + " سجل بنجاح!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function resolveAgentDetails(sheetAgentName) {
  var name = (sheetAgentName || "").toString().trim();
  if (!name) return { id: "", name: "" };
  try {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (u.name.toLowerCase() === name.toLowerCase() || 
          (u.agentKey && u.agentKey.toLowerCase() === name.toLowerCase()) ||
          u.username.toLowerCase() === name.toLowerCase()) {
        return { id: u.id, name: u.name };
      }
    }
  } catch(e){}
  return { id: "", name: name };
}

function menuSyncAllToLedger() {
  var ui = SpreadsheetApp.getUi();
  try {
    initAcademyLedgerSheet();
    var paySh = getSheet("Client_Payments");
    if (!paySh) {
      ui.alert("خطأ", "شيت Client_Payments غير موجود!", ui.ButtonSet.OK);
      return;
    }
    var payData = paySh.getDataRange().getValues();
    var count = 0;
    for (var i = 1; i < payData.length; i++) {
      var payId = payData[i][0];
      if (payId) {
        syncClientPaymentToLedger(payId);
        count++;
      }
    }
    ui.alert("نجاح", "تمت تهيئة الدفتر الشامل ومزامنة " + count + " عميل بنجاح!", ui.ButtonSet.OK);
  } catch (e) {
    ui.alert("خطأ", e.toString(), ui.ButtonSet.OK);
  }
}

// ============================================================
// NEW INVOICING & OC CODE SYNC FUNCTIONS
// ============================================================

function searchExternalInvoiceOcCode(phone) {
  try {
    if (!phone) return "";
    var searchPhone = phone.toString().trim();
    if (!searchPhone) return "";
    
    var invoiceSheetId = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    var invoiceSS = SpreadsheetApp.openById(invoiceSheetId);
    
    var sh = null;
    var sheets = invoiceSS.getSheets();
    
    // Try known sheet names first — including the exact Arabic name
    var knownNames = [
      "نظام إصدار فواتير الأكاديمية (الردود)",
      "Form Responses 1", "ردود النموذج 1", "Form_Responses", "Form Responses",
      "فواتير", "Invoice", "Invoices"
    ];
    for (var k = 0; k < knownNames.length; k++) {
      sh = invoiceSS.getSheetByName(knownNames[k]);
      if (sh) break;
    }
    // Fallback: search by partial name
    if (!sh) {
      for (var s = 0; s < sheets.length; s++) {
        var nameLower = sheets[s].getName().toLowerCase();
        if (nameLower.indexOf("ردود") !== -1 || nameLower.indexOf("response") !== -1 || nameLower.indexOf("فاتور") !== -1 || nameLower.indexOf("فواتير") !== -1) {
          sh = sheets[s];
          break;
        }
      }
    }
    // Last resort: first sheet
    if (!sh) sh = sheets[0];
    if (!sh) return "";
    
    var data = sh.getDataRange().getValues();
    var headers = data[0] || [];
    
    // Detect phone column by header keywords
    var phoneColIdx = -1;
    var ocColIdx = -1;
    for (var h = 0; h < headers.length; h++) {
      var hdr = (headers[h] || "").toString().toLowerCase();
      if (phoneColIdx === -1 && (hdr.indexOf("phone") !== -1 || hdr.indexOf("تليف") !== -1 || hdr.indexOf("هاتف") !== -1 || hdr.indexOf("mobile") !== -1 || hdr.indexOf("موبايل") !== -1)) phoneColIdx = h;
      if (ocColIdx === -1 && (hdr.indexOf("oc") !== -1 || hdr.indexOf("كود") !== -1)) ocColIdx = h;
    }
    // Defaults if headers not detected
    if (phoneColIdx === -1) phoneColIdx = 2; // Column C (index 2) — phone in this sheet
    if (ocColIdx === -1) ocColIdx = 3;       // Column D (index 3) — OC code in this sheet
    
    // Scan from bottom to top for latest matching invoice
    for (var i = data.length - 1; i >= 1; i--) {
      var rowPhoneVal = data[i][phoneColIdx];
      if (phonesMatch(rowPhoneVal, searchPhone)) {
        // First try the detected OC column
        var ocCode = (data[i][ocColIdx] || "").toString().trim();
        if (ocCode && ocCode.toLowerCase().indexOf("oc-") === 0) {
          return "OC-" + ocCode.substring(3).toUpperCase().trim();
        }
        // Scan the whole row for any OC- value
        for (var c = 0; c < data[i].length; c++) {
          var candidate = (data[i][c] || "").toString().trim();
          if (candidate && candidate.toLowerCase().indexOf("oc-") === 0) {
            return "OC-" + candidate.substring(3).toUpperCase().trim();
          }
        }
      }
    }
  } catch (e) {
    Logger.log("Error in searchExternalInvoiceOcCode: " + e.toString());
  }
  return "";
}
function syncOcCodeEverywhere(clientId, newOcCode, phone, name) {
  if (!newOcCode) return;
  newOcCode = newOcCode.toString().trim();
  if (newOcCode.toLowerCase().indexOf("oc-") !== 0) {
    newOcCode = "OC-" + newOcCode.toUpperCase();
  }
  
  var cleanClientId = (clientId || "").toString().trim();
  if (cleanClientId === "—" || cleanClientId === "-" || cleanClientId.toLowerCase() === "null" || cleanClientId.toLowerCase() === "undefined") {
    cleanClientId = "";
  }
  var cleanPhoneVal = cleanPhone(phone);
  var lowerName = (name || "").toString().trim().toLowerCase();
  if (lowerName === "—" || lowerName === "-" || lowerName === "null" || lowerName === "undefined") {
    lowerName = "";
  }

  // FIX-10 (S11): collect per-sheet sync failures so the function can RETURN a status
  // (previously it returned nothing and every tab error was only Logger.log'd, letting the
  // caller claim "updated in all sheets" even when some failed).
  var _ocSyncErrors = [];

  // 1. Update Raw_Data
  try {
    var rawSh = getSheet("Raw_Data");
    if (rawSh) {
      var rawData = rawSh.getDataRange().getValues();
      for (var i = 1; i < rawData.length; i++) {
        var rowId = (rawData[i][0] || "").toString().trim();
        var rowPhone = (rawData[i][3] || "").toString().trim();
        
        var matched = false;
        if (cleanClientId && rowId === cleanClientId) matched = true;
        else if (cleanPhoneVal && phonesMatch(rowPhone, cleanPhoneVal)) matched = true;
        
        if (matched) {
          // Write OC Code to dedicated column O (index 14, column 15) 
          rawSh.getRange(i + 1, 15).setValue(newOcCode);
        }
      }
    }
  } catch (e) {
    Logger.log("Error updating Raw_Data: " + e.toString());
    _ocSyncErrors.push("Raw_Data: " + e.toString()); // FIX-10 (S11)
  }

  // 2. Update Client_Payments
  try {
    var cpSh = getSheet("Client_Payments");
    if (cpSh) {
      var cpData = cpSh.getDataRange().getValues();
      for (var i = 1; i < cpData.length; i++) {
        var rowClientId = (cpData[i][1] || "").toString().trim(); // Column B (index 1)
        var rowName = (cpData[i][2] || "").toString().trim().toLowerCase(); // Column C (index 2)
        if (rowClientId === "—" || rowClientId === "-" || rowClientId.toLowerCase() === "null" || rowClientId.toLowerCase() === "undefined") {
          rowClientId = "";
        }
        
        var matched = false;
        if (cleanClientId && rowClientId === cleanClientId) matched = true;
        else if (cleanPhoneVal && phonesMatch(rowClientId, cleanPhoneVal)) matched = true;
        // NOTE: name-based matching removed — causes data mixing between clients with same name

        if (matched) {
          cpSh.getRange(i + 1, 2).setValue(newOcCode); // Column B
        }
      }
    }
  } catch (e) {
    Logger.log("Error updating Client_Payments: " + e.toString());
    _ocSyncErrors.push("Client_Payments: " + e.toString()); // FIX-10 (S11)
  }

  // 3. Update Financial_Data
  try {
    var finSh = getSheet("Financial_Data");
    if (finSh) {
      var finData = finSh.getDataRange().getValues();
      for (var i = 1; i < finData.length; i++) {
        var rowOc = (finData[i][6] || "").toString().trim(); // Column G (index 6)
        var rowName = (finData[i][7] || "").toString().trim().toLowerCase(); // Column H (index 7)
        var rowPhone = (finData[i][8] || "").toString().trim(); // Column I (index 8)
        if (rowOc === "—" || rowOc === "-" || rowOc.toLowerCase() === "null" || rowOc.toLowerCase() === "undefined") {
          rowOc = "";
        }
        
        var matched = false;
        if (cleanClientId && rowOc === cleanClientId) matched = true;
        else if (cleanPhoneVal && phonesMatch(rowPhone, cleanPhoneVal)) matched = true;
        // NOTE: name-based matching removed — causes data mixing between clients with same name

        if (matched) {
          finSh.getRange(i + 1, 7).setValue(newOcCode); // Column G
        }
      }
    }
  } catch (e) {
    Logger.log("Error updating Financial_Data: " + e.toString());
    _ocSyncErrors.push("Financial_Data: " + e.toString()); // FIX-10 (S11)
  }

  // 4. Update Round_Members
  try {
    var rmSh = getSheet("Round_Members");
    if (rmSh) {
      var rmData = rmSh.getDataRange().getValues();
      for (var i = 1; i < rmData.length; i++) {
        var rowOc = (rmData[i][1] || "").toString().trim(); // Column B (index 1)
        var rowName = (rmData[i][2] || "").toString().trim().toLowerCase(); // Column C (index 2)
        var rowPhone = (rmData[i][3] || "").toString().trim(); // Column D (index 3)
        if (rowOc === "—" || rowOc === "-" || rowOc.toLowerCase() === "null" || rowOc.toLowerCase() === "undefined") {
          rowOc = "";
        }
        
        var matched = false;
        if (cleanClientId && rowOc === cleanClientId) matched = true;
        else if (cleanPhoneVal && phonesMatch(rowPhone, cleanPhoneVal)) matched = true;
        // NOTE: name-based matching removed — causes data mixing between clients with same name

        if (matched) {
          rmSh.getRange(i + 1, 2).setValue(newOcCode); // Column B
        }
      }
    }
  } catch (e) {
    Logger.log("Error updating Round_Members: " + e.toString());
    _ocSyncErrors.push("Round_Members: " + e.toString()); // FIX-10 (S11)
  }

  // FIX-10 (S11): return a status so callers can tell whether ALL sheets synced.
  // Additive — the early `return;` (no OC) and existing callers that ignore this value
  // (e.g. updateClientOCCode) are unaffected.
  return { ok: _ocSyncErrors.length === 0, errors: _ocSyncErrors };
}

function syncClientOcCodeFromExternal(clientId, phone, name) {
  try {
    var cleanPhoneVal = cleanPhone(phone);
    
    // Resolve clientId and name using phone if missing
    if ((!clientId || !name) && cleanPhoneVal) {
      var rawSh = getSheet("Raw_Data");
      if (rawSh) {
        var rawData = rawSh.getDataRange().getValues();
        for (var i = 1; i < rawData.length; i++) {
          var rowPhone = cleanPhone(rawData[i][3]);
          if (rowPhone && phonesMatch(rowPhone, cleanPhoneVal)) {
            if (!clientId) clientId = (rawData[i][0] || "").toString().trim();
            if (!name) name = rawData[i][2];
            break;
          }
        }
      }
    }
    
    if (!cleanPhoneVal && clientId) {
      var rawSh = getSheet("Raw_Data");
      if (rawSh) {
        var rawData = rawSh.getDataRange().getValues();
        for (var i = 1; i < rawData.length; i++) {
          if ((rawData[i][0] || "").toString().trim() === clientId.toString().trim()) {
            cleanPhoneVal = cleanPhone(rawData[i][3]);
            if (!name) name = rawData[i][2];
            break;
          }
        }
      }
    }
    
    if (!cleanPhoneVal) {
      return { success: false, message: "⚠️ لم يتم العثور على رقم تليفون للعميل للبحث به." };
    }
    
    var ocCode = searchExternalInvoiceOcCode(phone || cleanPhoneVal);
    if (!ocCode) {
      return { success: false, message: "⚠️ لم يتم العثور على كود OC لهذا الرقم في شيت الفواتير الخارجي." };
    }
    
    // FIX-10 (S11): inspect the per-sheet sync result; only claim "updated in all sheets"
    // when that is actually true. On partial failure, surface a warning (success stays true
    // because the OC code WAS fetched, but the message no longer lies).
    var _ocSyncRes = syncOcCodeEverywhere(clientId, ocCode, cleanPhoneVal, name);
    if (_ocSyncRes && _ocSyncRes.errors && _ocSyncRes.errors.length) {
      return { success: true, message: "⚠️ تم جلب كود الـ OC (" + ocCode + ") لكن تعذّر تحديث بعض الشيتات: " + _ocSyncRes.errors.join(" | "), ocCode: ocCode, warnings: _ocSyncRes.errors };
    }
    return { success: true, message: "✅ تم جلب كود الـ OC بنجاح وتحديثه في جميع الشيتات: " + ocCode, ocCode: ocCode };
  } catch (e) {
    return { success: false, message: "حدث خطأ: " + e.toString() };
  }
}


function getClientInvoicePdf(clientId, ocCode, phone, name) {
  try {
    var folderId = "1CDyIJoxvVSiFevCDvobK0KSheoATnMVW";
    var folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (err) {
      return { success: false, message: "⚠️ لا يمكن الوصول لمجلد الفواتير في جوجل درايف. تأكد من صلاحيات الحساب." };
    }
    
    var cleanPhoneVal = cleanPhone(phone);
    if ((!ocCode || !cleanPhoneVal) && clientId) {
      var rawSh = getSheet("Raw_Data");
      if (rawSh) {
        var rawData = rawSh.getDataRange().getValues();
        for (var i = 1; i < rawData.length; i++) {
          if ((rawData[i][0] || "").toString().trim() === clientId.toString().trim()) {
            if (!ocCode) {
              var ocValO = (rawData[i][14] || "").toString().trim();
              var ocValN = (rawData[i][13] || "").toString().trim();
              ocCode = (ocValO && ocValO.toLowerCase().indexOf("oc-") === 0) ? ocValO : ocValN;
            }
            if (!cleanPhoneVal) cleanPhoneVal = cleanPhone(rawData[i][3]);
            if (!name) name = rawData[i][2];
            break;
          }
        }
      }
    }
    
    // التحقق من القيم المستلمة وتجنب مقارنة الفراغات أو كلمات نائبة مثل "—" لتفادي تسريب فواتير لآخرين
    var searchOc = (ocCode && ocCode !== "—" && ocCode !== "-" && ocCode.toLowerCase() !== "null" && ocCode.toLowerCase() !== "undefined") ? ocCode.toString().trim().toLowerCase() : "";
    var searchPhone = (cleanPhoneVal && cleanPhoneVal !== "—" && cleanPhoneVal !== "-") ? cleanPhoneVal.toString().trim() : "";
    var searchName = (name && name !== "—" && name !== "-" && name !== "المدير" && name.toLowerCase() !== "null" && name.toLowerCase() !== "undefined") ? name.toString().trim().toLowerCase() : "";
    
    // 1. Try to find in the Invoice sheet first
    try {
      var invoiceSheetId = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
      var invoiceSS = SpreadsheetApp.openById(invoiceSheetId);
      var sh = null;
      var sheets = invoiceSS.getSheets();
      var commonNames = ["Form Responses 1", "ردود النموذج 1", "Form_Responses", "Form Responses"];
      for (var k = 0; k < commonNames.length; k++) {
        sh = invoiceSS.getSheetByName(commonNames[k]);
        if (sh) break;
      }
      if (!sh) {
        for (var s = 0; s < sheets.length; s++) {
          var nameLower = sheets[s].getName().toLowerCase();
          if (nameLower.indexOf("response") !== -1 || nameLower.indexOf("ردود") !== -1 || nameLower.indexOf("فاتور") !== -1) {
            sh = sheets[s];
            break;
          }
        }
      }
      if (!sh) sh = sheets[0];
      
      var data = sh.getDataRange().getValues();
      for (var idx = data.length - 1; idx >= 1; idx--) {
        var rowOc = (data[idx][12] || "").toString().trim().toLowerCase(); // Column M
        var rowOcR = (data[idx][17] || "").toString().trim().toLowerCase(); // Column R (Invoice No)
        var rowPhone = cleanPhone(data[idx][3]); // Column D
        
        var isMatch = false;
        if (searchOc && (rowOc === searchOc || rowOcR === searchOc)) {
          isMatch = true;
        } else if (searchPhone && rowPhone && (rowPhone === searchPhone || rowPhone.slice(-9) === searchPhone.slice(-9))) {
          isMatch = true;
        }
        
        if (isMatch) {
          var docId = (data[idx][13] || "").toString().trim(); // Column N (Merged Doc ID)
          var docUrl = (data[idx][14] || "").toString().trim(); // Column O (Merged Doc URL)
          var docLink = (data[idx][15] || "").toString().trim(); // Column P (Link to merged Doc)
          
          if (data[idx][2]) {
            searchName = data[idx][2].toString().trim().toLowerCase();
          }
          
          if (docId) {
            return {
              success: true,
              file: {
                name: docLink || ("Invoice - " + (data[idx][2] || "Client")),
                url: docUrl || ("https://drive.google.com/file/d/" + docId + "/view"),
                id: docId
              }
            };
          } else if (docUrl) {
            var match = docUrl.match(/[-\w]{25,}/);
            var extractedId = match ? match[0] : "";
            if (extractedId) {
              return {
                success: true,
                file: {
                  name: docLink || ("Invoice - " + (data[idx][2] || "Client")),
                  url: docUrl,
                  id: extractedId
                }
              };
            }
          }
          break; // Found row, stop checking
        }
      }
    } catch (sheetErr) {
      Logger.log("Error in getClientInvoicePdf sheet scan: " + sheetErr.toString());
    }
    
    var files = folder.getFiles();
    var possibleMatches = [];
    
    while (files.hasNext()) {
      var file = files.next();
      var fileName = file.getName().toLowerCase();
      var matched = false;
      var score = 0;
      
      if (searchOc && searchOc.indexOf("oc-") === 0 && fileName.indexOf(searchOc) !== -1) {
        matched = true;
        score += 100;
      }
      
      if (searchPhone && searchPhone.length >= 9 && fileName.indexOf(searchPhone.slice(-9)) !== -1) {
        matched = true;
        score += 80;
      }
      
      if (searchName) {
        var parts = searchName.split(/\s+/).filter(function(p) { return p.length > 2; });
        var matchesParts = 0;
        for (var p = 0; p < parts.length; p++) {
          if (fileName.indexOf(parts[p]) !== -1) {
            matchesParts++;
          }
        }
        if (matchesParts >= 2) {
          matched = true;
          score += 40 + (matchesParts * 5);
        } else if (parts.length === 1 && matchesParts === 1) {
          matched = true;
          score += 30;
        }
      }
      
      if (matched) {
        possibleMatches.push({
          name: file.getName(),
          url: file.getUrl(),
          id: file.getId(),
          score: score
        });
      }
    }
    
    if (possibleMatches.length > 0) {
      possibleMatches.sort(function(a, b) { return b.score - a.score; });
      return { success: true, file: possibleMatches[0] };
    }
    
    return { success: false, message: "⚠️ لم يتم العثور على ملف فاتورة PDF للعميل في مجلد جوجل درايف." };
  } catch (e) {
    return { success: false, message: "حدث خطأ أثناء البحث في درايف: " + e.toString() };
  }
}

function setupFormSubmitTriggerSilent() {
  try {
    var invoiceSheetId = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    if (!invoiceSheetId) return;
    var ss = SpreadsheetApp.openById(invoiceSheetId);
    var triggers = ScriptApp.getProjectTriggers();
    var exists = false;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === "preventDuplicateSubmissions") {
        exists = true;
        break;
      }
    }
    if (!exists) {
      ScriptApp.newTrigger("preventDuplicateSubmissions")
        .forSpreadsheet(ss)
        .onFormSubmit()
        .create();
    }
  } catch(e) {
    Logger.log("Error in setupFormSubmitTriggerSilent: " + e.toString());
  }
}

function cleanupCorruptedInvoiceRows() {
  try {
    var invoiceSheetId = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    if (!invoiceSheetId) return;
    var ss = SpreadsheetApp.openById(invoiceSheetId);
    var sh = null;
    var sheets = ss.getSheets();
    var commonNames = ["Form Responses 1", "ردود النموذج 1", "Form_Responses", "Form Responses"];
    for (var k = 0; k < commonNames.length; k++) {
      sh = ss.getSheetByName(commonNames[k]);
      if (sh) break;
    }
    if (!sh) return;
    
    var lastRow = sh.getLastRow();
    if (lastRow < 2) return;
    
    var data = sh.getRange(2, 1, lastRow - 1, Math.min(sh.getLastColumn(), 6)).getValues();
    var rowsToDelete = [];
    for (var i = 0; i < data.length; i++) {
      var timestamp = data[i][0];
      var name = (data[i][2] || "").toString().trim();
      var phone = (data[i][3] || "").toString().trim();
      if (timestamp && !name && !phone) {
        rowsToDelete.push(i + 2);
      }
    }
    
    for (var r = rowsToDelete.length - 1; r >= 0; r--) {
      sh.deleteRow(rowsToDelete[r]);
    }
    if (rowsToDelete.length > 0) {
      Logger.log("Cleaned up " + rowsToDelete.length + " corrupted empty invoice rows.");
    }
  } catch(e) {
    Logger.log("Error in cleanupCorruptedInvoiceRows: " + e.toString());
  }
}

// ==========================================
// DAILY REPORT TRIGGER SETUP
// ==========================================
function setupDailyReportTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'generateDailyReport') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    ScriptApp.newTrigger('generateDailyReport')
      .timeBased()
      .atHour(23)
      .nearMinute(59)
      .everyDays(1)
      .inTimezone('Africa/Cairo')
      .create();
    return { success: true, message: '✅ تم تفعيل التقرير اليومي الساعة 11:59 مساءً' };
  } catch (e) {
    return { success: false, message: '❌ خطأ: ' + e.toString() };
  }
}

function setupFormSubmitTrigger() {
  var ui = SpreadsheetApp.getUi();
  var invoiceSheetId = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
  if (!invoiceSheetId) {
    ui.alert("خطأ", "لم يتم العثور على معرّف شيت الفواتير (invoiceSheetId) في الإعدادات.", ui.ButtonSet.OK);
    return;
  }
  
  try {
    var ss = SpreadsheetApp.openById(invoiceSheetId);
    var triggers = ScriptApp.getProjectTriggers();
    var exists = false;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === "preventDuplicateSubmissions") {
        exists = true;
        break;
      }
    }
    
    if (exists) {
      ui.alert("تنبيه", "مُشغّل مانع التكرار (Form Submit Trigger) مُعدّ بالفعل ولا يحتاج لإعادة الإعداد.", ui.ButtonSet.OK);
      return;
    }
    
    ScriptApp.newTrigger("preventDuplicateSubmissions")
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();
      
    ui.alert("نجاح", "تم تثبيت مُشغّل مانع تكرار الفواتير بنجاح على شيت الفواتير!", ui.ButtonSet.OK);
  } catch (e) {
    ui.alert("خطأ أثناء الإعداد", "حدث خطأ أثناء محاولة إعداد المُشغّل: " + e.toString() + "\nيرجى التأكد من صلاحيات الوصول لشيت الفواتير.", ui.ButtonSet.OK);
  }
}

function preventDuplicateSubmissions(e) {
  try {
    var invoiceSheetId = getSystemSetting("invoiceSheetId", "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA");
    var ss = SpreadsheetApp.openById(invoiceSheetId);
    
    var sh = null;
    var sheets = ss.getSheets();
    var commonNames = ["Form Responses 1", "ردود النموذج 1", "Form_Responses", "Form Responses"];
    for (var k = 0; k < commonNames.length; k++) {
      sh = ss.getSheetByName(commonNames[k]);
      if (sh) break;
    }
    if (!sh) {
      for (var s = 0; s < sheets.length; s++) {
        var nameLower = sheets[s].getName().toLowerCase();
        if (nameLower.indexOf("response") !== -1 || nameLower.indexOf("ردود") !== -1 || nameLower.indexOf("فاتور") !== -1) {
          sh = sheets[s];
          break;
        }
      }
    }
    if (!sh) sh = sheets[0];
    
    var lastRow = sh.getLastRow();
    if (lastRow < 2) return;
    
    // Acquire Lock to prevent race conditions from simultaneous submissions
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (lockErr) {
      Logger.log("Could not acquire lock in preventDuplicateSubmissions: " + lockErr.toString());
      return;
    }
    
    var lastRowRange = sh.getRange(lastRow, 1, 1, Math.min(sh.getLastColumn(), 18));
    var lastRowValues = lastRowRange.getValues()[0];
    
    var clientName = (lastRowValues[2] || "").toString().trim(); // Column C
    var clientPhone = cleanPhone(lastRowValues[3]); // Column D
    var course = (lastRowValues[4] || "").toString().trim(); // Column E
    var price = parseFloat(lastRowValues[7]) || 0; // Column H
    var timestampStr = lastRowValues[0]; // Column A (timestamp)
    
    // Clean up any existing corrupted empty rows first
    try {
      cleanupCorruptedInvoiceRows();
      // Refetch lastRow since it might have changed
      lastRow = sh.getLastRow();
      lastRowRange = sh.getRange(lastRow, 1, 1, Math.min(sh.getLastColumn(), 18));
      lastRowValues = lastRowRange.getValues()[0];
      clientName = (lastRowValues[2] || "").toString().trim();
      clientPhone = cleanPhone(lastRowValues[3]);
      course = (lastRowValues[4] || "").toString().trim();
      price = parseFloat(lastRowValues[7]) || 0;
      timestampStr = lastRowValues[0];
    } catch(sweepErr) {
      Logger.log("Sweep error: " + sweepErr.toString());
    }

    // Format the phone number in the sheet if it's missing the leading zero
    var formattedPhone = forceTextPhone(lastRowValues[3]);
    if (formattedPhone && formattedPhone !== lastRowValues[3].toString()) {
      sh.getRange(lastRow, 4).setValue(formattedPhone);
      lastRowValues[3] = formattedPhone; // Update cached value
      clientPhone = cleanPhone(formattedPhone); // Update clean phone
    }
    
    if (!clientName && !clientPhone) {
      try {
        sh.deleteRow(lastRow);
        Logger.log("Deleted corrupted empty row at " + lastRow);
      } catch (delErr) {
        Logger.log("Failed to delete corrupted row: " + delErr.toString());
      }
      if (lock.hasLock()) lock.releaseLock();
      return;
    }
    
    if (!clientName || !clientPhone) {
      if (lock.hasLock()) lock.releaseLock();
      return;
    }
    
    var timestamp = new Date(timestampStr);
    if (isNaN(timestamp.getTime())) {
      timestamp = new Date();
    }
    
    var startRow = Math.max(1, lastRow - 10);
    var numRows = lastRow - startRow;
    if (numRows <= 0) {
      if (lock.hasLock()) lock.releaseLock();
      return;
    }
    
    var prevData = sh.getRange(startRow, 1, numRows, Math.min(sh.getLastColumn(), 18)).getValues();
    
    for (var i = 0; i < prevData.length; i++) {
      var prevRowIndex = startRow + i;
      var prevTimestamp = new Date(prevData[i][0]);
      var prevName = (prevData[i][2] || "").toString().trim();
      var prevPhone = cleanPhone(prevData[i][3]);
      var prevCourse = (prevData[i][4] || "").toString().trim();
      var prevPrice = parseFloat(prevData[i][7]) || 0;
      
      // Compare (excluding the last row itself)
      if (prevRowIndex !== lastRow &&
          prevName === clientName && 
          prevPhone === clientPhone && 
          prevCourse === course && 
          prevPrice === price &&
          prevTimestamp.getTime() > 0 &&
          Math.abs(timestamp.getTime() - prevTimestamp.getTime()) < 5 * 60 * 1000) {
        
        // This is a duplicate submission! Delete the newly added row.
        sh.deleteRow(lastRow);
        Logger.log("Deleted duplicate form submission for client: " + clientName + " at row: " + lastRow);
        
        // Log activity in the CRM log
        logActivity("SYSTEM", "Auto-Cleanup", "PREVENT_DUPLICATE_INVOICE", "Deleted duplicate row " + lastRow + " for " + clientName);
        break;
      }
    }
    
    if (lock.hasLock()) lock.releaseLock();
  } catch(err) {
    Logger.log("Error in preventDuplicateSubmissions: " + err.toString());
  }
}

function removeRoundMember(roundId, ocCode, clientName) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    removeRoundMemberInternal(roundId, ocCode, clientName);
    
    // Also, update the client's status in Client_Payments and Financial_Data if they are removed
    // Set them back to "Wait" (waiting list)
    try {
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = cpSh.getDataRange().getValues();
        for (var i = 1; i < cpData.length; i++) {
          var ocVal = (cpData[i][1] || "").toString().trim();
          if (ocEq(ocVal, ocCode)) { // FIX-07: ocKey-normalized OC join
            cpSh.getRange(i + 1, 5).setValue(""); // Clear roundId
            cpSh.getRange(i + 1, 6).setValue("Wait"); // Clear roundName / Set status

            // Also, update Financial_Data status to "Wait" and attendance to "ويت"
            var finSh = getSheet("Financial_Data");
            if (finSh) {
              var finData = finSh.getDataRange().getValues();
              for (var f = 1; f < finData.length; f++) {
                var fOc = (finData[f][6] || "").toString().trim();
                if (ocEq(fOc, ocCode)) { // FIX-07: ocKey-normalized OC join
                  finSh.getRange(f + 1, 6).setValue("Wait");
                  finSh.getRange(f + 1, 12).setValue("ويت");
                }
              }
            }
            break;
          }
        }
      }
    } catch (syncErr) {}

    lock.releaseLock();
    return { success: true, message: "✅ تم إزالة العميل من الراوند وإعادته لقائمة الانتظار بنجاح." };
  } catch(e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

function updateRoundMemberDetails(roundId, ocCode, clientName, price, paid, method, attendance) {
  try {
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    var sh = getSheet("Round_Members");
    if (!sh) {
      lock.releaseLock();
      return { success: false, message: "جدول أعضاء الراوند غير موجود." };
    }
    
    var data = sh.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === roundId.toString() &&
          ocEq(data[i][1], ocCode)) { // FIX-07: ocKey-normalized OC join

        // Update Round_Members row
        sh.getRange(i + 1, 6).setValue(parseFloat(price) || 0); // Price
        sh.getRange(i + 1, 7).setValue(parseFloat(paid) || 0);  // Paid
        sh.getRange(i + 1, 8).setValue(method || "");           // Method
        sh.getRange(i + 1, 9).setValue(attendance ? new Date(attendance) : ""); // Attendance
        found = true;
        break;
      }
    }
    
    if (!found) {
      lock.releaseLock();
      return { success: false, message: "لم يتم العثور على سجل العميل في هذا الراوند." };
    }
    
    // Also sync the price, paid, method, and attendance date to Client_Payments and Financial_Data
    try {
      var cpSh = getSheet("Client_Payments");
      if (cpSh) {
        var cpData = cpSh.getDataRange().getValues();
        for (var i = 1; i < cpData.length; i++) {
          var ocVal = (cpData[i][1] || "").toString().trim();
          if (ocEq(ocVal, ocCode)) { // FIX-07: ocKey-normalized OC join
            var pr = parseFloat(price) || 0;
            var pd = parseFloat(paid) || 0;
            var rem = pr - pd;

            cpSh.getRange(i + 1, 7).setValue(pr); // Total price
            cpSh.getRange(i + 1, 10).setValue(pd); // Paid
            cpSh.getRange(i + 1, 11).setValue(rem < 0 ? 0 : rem); // Remaining
            cpSh.getRange(i + 1, 13).setValue(rem <= 0 ? "Paid" : "Installment"); // Status

            // Also, update Financial_Data price, paid, method, and attendance.
            // D17 FIX: a customer can have multiple Financial_Data rows (one per course). Updating EVERY
            // OC-matching row would overwrite the customer's other courses with this round's price/paid.
            // So: if there is a single FD row for the OC → update it (unchanged behavior); if there are
            // several → scope to the row(s) matching THIS round's course (from the Client_Payments row).
            var finSh = getSheet("Financial_Data");
            if (finSh) {
              var finData = finSh.getDataRange().getValues();
              var _ocRows = [];
              for (var f = 1; f < finData.length; f++) {
                if (ocEq((finData[f][6] || "").toString().trim(), ocCode)) _ocRows.push(f); // FIX-07 join
              }
              var _cpCourse = (cpData[i][3] || "").toString().trim().toLowerCase();
              var _targetRows = _ocRows;
              if (_ocRows.length > 1 && _cpCourse) {
                var _scoped = _ocRows.filter(function(rf){ return (finData[rf][9] || "").toString().trim().toLowerCase() === _cpCourse; });
                _targetRows = _scoped.length > 0 ? _scoped : []; // no course match → skip FD (don't corrupt sibling courses)
              }
              for (var _t = 0; _t < _targetRows.length; _t++) {
                var _fr = _targetRows[_t];
                finSh.getRange(_fr + 1, 13).setValue(method || ""); // Method (col 13)
                finSh.getRange(_fr + 1, 15).setValue(pr);           // Price  (col 15)
                finSh.getRange(_fr + 1, 16).setValue(pd);           // Paid   (col 16)
                if (attendance) {
                  finSh.getRange(_fr + 1, 12).setValue(new Date(attendance)); // Attendance (col 12)
                }
              }
            }
            
            // Sync to Ledger
            try {
              syncClientPaymentToLedger(cpData[i][0]);
            } catch (ledgErr) {}
            
            break;
          }
        }
      }
    } catch(syncErr) {}
    
    lock.releaseLock();
    return { success: true, message: "✅ تم تحديث بيانات العميل ومزامنتها مع الحسابات والأقساط بنجاح." };
  } catch(e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

function fixManagerClientAssignments() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      "🔄 بدء عملية تسكين وتصحيح عملاء السيلز",
      "سيقوم هذا الإجراء بالبحث عن كافة العملاء المسجلين باسم 'المدير' في شيتات الحسابات والأقساط، وإعادة ربطهم وتسكينهم تحت حساب السيلز المخصص لكل منهم في شيت الماستر (Raw_Data).\n\nهل تريد الاستمرار؟",
      ui.ButtonSet.YES_NO
    );
    if (response !== ui.Button.YES) return;

    var rawSh = getSheet("Raw_Data");
    var cpSh = getSheet("Client_Payments");
    var finSh = getSheet("Financial_Data");
    var txSh = getSheet("Payment_Transactions");

    if (!rawSh || !cpSh) {
      ui.alert("❌ خطأ: شيت الماستر أو شيت الأقساط غير موجود!");
      return;
    }

    var rawData = rawSh.getDataRange().getValues();
    var cpData = cpSh.getDataRange().getValues();
    var finData = finSh ? finSh.getDataRange().getValues() : [];
    var txData = txSh ? txSh.getDataRange().getValues() : [];
    var users = getUsers();

    // خريطة لتسريع البحث عن المستخدمين بأسماءهم
    var usersMap = {};
    for (var u = 0; u < users.length; u++) {
      var uName = users[u].name.trim().toLowerCase();
      var uKey = (users[u].agentKey || "").trim().toLowerCase();
      usersMap[uName] = users[u];
      if (uKey) usersMap[uKey] = users[u];
    }

    // خريطة لتسريع البحث في Raw_Data بالاسم أو كود OC للحصول على السيلز الحقيقي
    var clientRealAgentMap = {};
    for (var r = 1; r < rawData.length; r++) {
      var cName = (rawData[r][2] || "").toString().trim().toLowerCase();
      var cOc = (rawData[r][14] || "").toString().trim().toLowerCase();
      var realAgent = (rawData[r][6] || "").toString().trim(); // Agent in Raw_Data
      if (realAgent && realAgent !== "المدير") {
        if (cName) clientRealAgentMap[cName] = realAgent;
        if (cOc) clientRealAgentMap[cOc] = realAgent;
      }
    }

    var fixCount = 0;

    // 1. تصحيح شيت Client_Payments
    for (var i = 1; i < cpData.length; i++) {
      var payId = cpData[i][0];
      if (!payId) continue;
      var cpOc = (cpData[i][1] || "").toString().trim().toLowerCase();
      var cpName = (cpData[i][2] || "").toString().trim().toLowerCase();
      var currentAgentName = (cpData[i][8] || "").toString().trim();

      // إذا كان مسجلاً باسم المدير، نقوم بتصحيحه
      if (currentAgentName === "المدير") {
        var realAgentName = clientRealAgentMap[cpOc] || clientRealAgentMap[cpName] || "";
        if (realAgentName && realAgentName !== "المدير") {
          var userObj = usersMap[realAgentName.toLowerCase()];
          var realAgentId = userObj ? userObj.id : realAgentName;

          // تحديث شيت الأقساط (عمود H للمعرف، وعمود I للاسم)
          cpSh.getRange(i + 1, 8).setValue(realAgentId);
          cpSh.getRange(i + 1, 9).setValue(realAgentName);
          fixCount++;

          // 2. تصحيح شيت Financial_Data للعميل المعني
          if (finSh) {
            for (var f = 1; f < finData.length; f++) {
              var finAgent = (finData[f][1] || "").toString().trim();
              var finOc = (finData[f][6] || "").toString().trim().toLowerCase();
              var finName = (finData[f][7] || "").toString().trim().toLowerCase();

              if (finAgent === "المدير" && (ocEq(finOc, cpOc) || (cpName && finName === cpName))) { // FIX-07
                finSh.getRange(f + 1, 1).setValue(realAgentId); // AgentID
                finSh.getRange(f + 1, 2).setValue(realAgentName); // AgentName
              }
            }
          }

          // 3. تصحيح شيت Payment_Transactions للعميل المعني
          if (txSh) {
            for (var t = 1; t < txData.length; t++) {
              var txPayId = (txData[t][1] || "").toString().trim();
              var txAgent = (txData[t][7] || "").toString().trim();

              if (txAgent === "المدير" && txPayId === payId.toString().trim()) {
                txSh.getRange(t + 1, 7).setValue(realAgentId); // AgentID
                txSh.getRange(t + 1, 8).setValue(realAgentName); // AgentName
              }
            }
          }
        }
      }
    }

    ui.alert("✅ اكتمال التسكين بنجاح", "تمت العملية بنجاح! تم تصحيح وتسكين عدد " + fixCount + " عميل/دفعة وتعديل السيلز الخاص بهم بناءً على بيانات شيت الماستر.");
    logActivity("admin", "المدير", "MIGRATE_AGENT_ASSIGNMENTS", "تم تصحيح " + fixCount + " عميل");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ حدث خطأ أثناء التسكين: " + e.toString());
  }
}

// ==========================================
// COURSES MANAGEMENT
// ==========================================
function initCoursesSheet() {
  var sh = getSheet("Courses");
  if (!sh) {
    getMaster().insertSheet("Courses");
    sh = getSheet("Courses");
    sh.appendRow(["ID", "Name", "CreatedAt"]);
    sh.getRange(1, 1, 1, 3).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    // Default courses
    var defaults = ["Digital Marketing", "Graphic Design", "UI/UX", "Social Media", "إدارة أعمال", "Motion Graphics", "Video Editing", "SEO", "E-Commerce"];
    defaults.forEach(function(c) {
      sh.appendRow([genId(), c, new Date()]);
    });
    SpreadsheetApp.flush();
  }
  return sh;
}

function getCourses() {
  try {
    var sh = initCoursesSheet();
    var data = sh.getDataRange().getValues();
    var courses = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][1]) continue;
      courses.push({ id: data[i][0].toString(), name: data[i][1].toString().trim(), rowIndex: i + 1 });
    }
    return courses;
  } catch (e) { return []; }
}

function addCourse(name) {
  try {
    if (!name || !name.trim()) return { success: false, message: "اسم الكورس مطلوب" };
    var sh = initCoursesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1] || "").toString().trim().toLowerCase() === name.trim().toLowerCase()) {
        return { success: false, message: "الكورس موجود بالفعل" };
      }
    }
    sh.appendRow([genId(), name.trim(), new Date()]);
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم إضافة الكورس: " + name };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function deleteCourse(rowIndex) {
  try {
    var sh = initCoursesSheet();
    sh.deleteRow(parseInt(rowIndex));
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم حذف الكورس" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ==========================================
// OFFERS MANAGEMENT
// ==========================================
function initOffersSheet() {
  var sh = getSheet("Offers");
  if (!sh) {
    getMaster().insertSheet("Offers");
    sh = getSheet("Offers");
    sh.appendRow(["ID", "Name", "Expiry", "Active", "CreatedAt"]);
    sh.getRange(1, 1, 1, 5).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
    SpreadsheetApp.flush();
  }
  return sh;
}

function getOffers() {
  try {
    var sh = initOffersSheet();
    var data = sh.getDataRange().getValues();
    var offers = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][1]) continue;
      offers.push({
        id: data[i][0].toString(),
        name: data[i][1].toString().trim(),
        expiry: data[i][2] ? safeFormatDate(data[i][2], Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        active: data[i][3] !== false && data[i][3] !== "FALSE" && data[i][3] !== false,
        rowIndex: i + 1
      });
    }
    return offers;
  } catch (e) { return []; }
}

function addOffer(name, expiry) {
  try {
    if (!name || !name.trim()) return { success: false, message: "اسم العرض مطلوب" };
    var sh = initOffersSheet();
    var expiryDate = expiry ? new Date(expiry) : "";
    sh.appendRow([genId(), name.trim(), expiryDate, true, new Date()]);
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم إضافة العرض: " + name };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function deleteOffer(rowIndex) {
  try {
    var sh = initOffersSheet();
    sh.deleteRow(parseInt(rowIndex));
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم حذف العرض" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ==========================================
// GET ALL SYSTEM SETTINGS (for admin panel)
// ==========================================
function getAllSystemSettings() {
  try {
    var props = PropertiesService.getScriptProperties().getProperties();
    return {
      masterSheetId: props.masterSheetId || MASTER_SHEET_ID,
      distributionSheetId: props.distributionSheetId || DISTRIBUTION_SHEET_ID,
      invoiceSheetId: props.invoiceSheetId || "1RLPcmeBQxj6lY8hKBvII4RQmYM2rdK5PEO_1RZl_mZA",
      paymentSheetId: props.paymentSheetId || PAYMENT_SHEET_ID,
      academyTarget: props.academyTarget || "50000",
      brandName: props.brandName || "BSA Academy",
      supportEmail: props.supportEmail || "bsa.academy.co.2025@gmail.com"
    };
  } catch (e) {
    return {};
  }
}

function saveAllSystemSettings(settings) {
  try {
    var props = PropertiesService.getScriptProperties();
    var keys = ["masterSheetId", "distributionSheetId", "invoiceSheetId", "paymentSheetId", "academyTarget", "brandName", "supportEmail"];
    keys.forEach(function(k) {
      if (settings[k] !== undefined && settings[k] !== null) {
        props.setProperty(k, settings[k].toString());
      }
    });
    return { success: true, message: "✅ تم حفظ الإعدادات بنجاح!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// PROMOTE PENDING CLIENT TO ROUND
// ==========================================
function promotePendingToRound(payId, roundId, roundName, agentId, agentName) {
  try {
    if (!payId || !roundId) {
      return { success: false, message: "بيانات غير مكتملة: payId أو roundId مفقود" };
    }

    // Verify round is active
    var roundsSh = getSheet("Rounds");
    var roundInfo = null;
    if (roundsSh) {
      var rData = roundsSh.getDataRange().getValues();
      for (var r = 1; r < rData.length; r++) {
        if ((rData[r][0] || "").toString() === roundId.toString()) {
          var rStatus = (rData[r][6] || "Active").toString().trim().toLowerCase();
          if (rStatus !== "active") {
            return { success: false, message: "⚠️ الراوند المحدد غير نشط ومغلق للحجز." };
          }
          roundInfo = { id: rData[r][0], name: rData[r][1] || roundName, startDate: rData[r][2] };
          break;
        }
      }
    }
    if (!roundInfo) {
      return { success: false, message: "⚠️ لم يتم العثور على الراوند المحدد." };
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);

    // Update Client_Payments — set roundId and roundName
    var cpSh = getSheet("Client_Payments");
    if (!cpSh) {
      lock.releaseLock();
      return { success: false, message: "شيت Client_Payments غير موجود" };
    }

    var cpData = cpSh.getDataRange().getValues();
    var cpRowIdx = -1;
    var clientName = "", clientPhone = "", course = "", price = 0, paid = 0;

    for (var i = 1; i < cpData.length; i++) {
      if ((cpData[i][0] || "").toString().trim() === payId.toString().trim()) {
        cpRowIdx = i + 1;
        clientName = (cpData[i][2] || "").toString();
        course = (cpData[i][3] || "").toString();
        price = parseFloat(cpData[i][6]) || 0;
        paid = parseFloat(cpData[i][9]) || 0;
        break;
      }
    }

    if (cpRowIdx === -1) {
      lock.releaseLock();
      return { success: false, message: "لم يتم العثور على سجل الدفع بهذا الـ ID" };
    }

    // Set roundId and roundName in Client_Payments
    cpSh.getRange(cpRowIdx, 5).setValue(roundId);
    cpSh.getRange(cpRowIdx, 6).setValue(roundInfo.name || roundName);

    // Get client phone from Raw_Data via OC code
    var ocCode = (cpData[cpRowIdx - 1][1] || "").toString();
    try {
      var rawSh = getSheet("Raw_Data");
      if (rawSh) {
        var rawData = rawSh.getDataRange().getValues();
        for (var j = 1; j < rawData.length; j++) {
          if (ocEq(rawData[j][14], ocCode) ||
              (rawData[j][0] || "").toString().trim() === ocCode) { // FIX-07
            clientPhone = (rawData[j][3] || "").toString();
            break;
          }
        }
      }
    } catch (e) {}

    // Update Financial_Data — change "Wait" to "Round"
    try {
      var finSh = getSheet("Financial_Data");
      if (finSh) {
        var finData = finSh.getDataRange().getValues();
        for (var f = 1; f < finData.length; f++) {
          var fOc = (finData[f][6] || "").toString().trim();
          var fName = (finData[f][7] || "").toString().trim().toLowerCase();
          if (ocEq(fOc, ocCode) || (clientName && fName === clientName.toLowerCase())) { // FIX-07
            finSh.getRange(f + 1, 6).setValue("Round");                           // Col F = action
            finSh.getRange(f + 1, 12).setValue(roundInfo.startDate || new Date()); // Col L = attendance
          }
        }
      }
    } catch (finErr) {}

    // Add to Round_Members
    var roundStartDate = roundInfo.startDate || "";
    try {
      addRoundMember(roundId, {
        ocCode: ocCode,
        name: clientName,
        phone: clientPhone,
        action: "New",
        price: price,
        paid: paid,
        method: "Cash",
        attendance: roundStartDate,
        agentId: agentId,
        agentName: agentName
      });
    } catch (rmErr) {}

    // Sync to Ledger
    try {
      syncClientPaymentToLedger(payId);
    } catch (ledgErr) {}

    SpreadsheetApp.flush();
    lock.releaseLock();

    logActivity(agentId, agentName, "PROMOTE_TO_ROUND", clientName + " => " + (roundInfo.name || roundName));
    return { success: true, message: "✅ تم تأكيد تسكين العميل في الراوند: " + (roundInfo.name || roundName) };
  } catch (e) {
    try { lock.releaseLock(); } catch (err) {}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// GET MY LEADS DATA (for my-leads page)
// ==========================================
function getMyLeadsData(agentId, agentName, isManager) {
  try {
    var sh = getSheet("My_Leads");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var leads = [];
    var tz = Session.getScriptTimeZone();
    for (var i = 1; i < data.length; i++) {
      if (!isManager && (data[i][6] || "").toString() !== agentId.toString()) continue;
      if (!data[i][0]) continue;
      var dateStr = "";
      try {
        var dv = data[i][1];
        if (dv instanceof Date) dateStr = safeFormatDate(dv, tz, "yyyy-MM-dd");
        else dateStr = dv ? dv.toString() : "";
      } catch (e2) {}
      leads.push({
        id: (data[i][0] || "").toString(),
        date: dateStr,
        name: (data[i][2] || "").toString(),
        phone: (data[i][3] || "").toString(),
        source: (data[i][4] || "").toString(),
        course: (data[i][5] || "").toString(),
        agentId: (data[i][6] || "").toString(),
        agentName: (data[i][7] || "").toString(),
        action: (data[i][8] || "").toString(),
        notes: (data[i][9] || "").toString(),
        fuDate: (data[i][10] || "").toString(),
        campaign: (data[i][11] || "").toString()
      });
    }
    return leads;
  } catch (e) { return []; }
}

function toggleRoundStatusDirectly(roundId, newStatus) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sh = getSheet("Rounds"), data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString() === roundId.toString()) {
        sh.getRange(i + 1, 7).setValue(newStatus || "Active");
        invalidateRoundsCache();
        lock.releaseLock();
        return { success: true, message: "✅ تم تحديث حالة الراوند بنجاح" };
      }
    }
    lock.releaseLock();
    return { success: false, message: "الراوند غير موجودة" };
  } catch (e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: e.toString() };
  }
}

function triggerCelebration(agentName) {
  try {
    var sh = getSheet("Celebrations");
    if (!sh) {
      getMaster().insertSheet("Celebrations");
      sh = getSheet("Celebrations");
      sh.appendRow(["AgentName", "Timestamp", "Seen"]);
      sh.getRange(1, 1, 1, 3).setBackground("#ec4899").setFontColor("#fff").setFontWeight("bold");
    }
    // Dedup: skip if same agent triggered a celebration within the last 120 seconds
    var lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      var last = sh.getRange(lastRow, 1, 1, 2).getValues()[0];
      var lastAgent = (last[0] || "").toString().trim();
      var lastTs = parseFloat(last[1].toString()) || 0;
      var nowMs = new Date().getTime();
      if (lastAgent === agentName && (nowMs - lastTs) < 120000) {
        return; // Skip duplicate celebration within 2 minutes for same agent
      }
    }
    sh.appendRow([agentName, new Date().getTime().toString(), "no"]);
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log("Error in triggerCelebration: " + e.toString());
  }
}

function getLatestCelebration(lastSeenTime) {
  try {
    var sh = getSheet("Celebrations");
    var nowMs = new Date().getTime();
    if (!sh) return { serverTime: nowMs.toString() };
    
    // If not initialized yet, return server time
    if (!lastSeenTime || lastSeenTime === "0") {
      return {
        serverTime: nowMs.toString()
      };
    }
    
    var lastRow = sh.getLastRow();
    if (lastRow < 2) return null;
    
    var last = sh.getRange(lastRow, 1, 1, 2).getValues()[0];
    var agentName = last[0];
    var timestamp = last[1];
    if (!timestamp) return null;
    
    var timeMs = 0;
    if (timestamp instanceof Date) {
      timeMs = timestamp.getTime();
    } else if (timestamp) {
      var parsed = parseFloat(timestamp);
      if (!isNaN(parsed) && parsed > 1000000000000) {
        timeMs = parsed;
      } else {
        var dt = new Date(timestamp.toString());
        timeMs = !isNaN(dt.getTime()) ? dt.getTime() : 0;
      }
    }
    if (timeMs === 0) return null;
    
    if (timeMs > parseFloat(lastSeenTime)) {
      return {
        agentName: agentName,
        timestamp: timeMs.toString()
      };
    }
    return null;
  } catch(e) {
    return null;
  }
}

function repairDuplicateIdsMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('تأكيد الإصلاح', 'هل ترغب في تشغيل عملية فحص وإصلاح المعرفات المكررة (Duplicate IDs) للعملاء وتصحيحها في كامل السيستم؟', ui.ButtonSet.YES_NO);
  if (response === ui.ButtonSet.YES) {
    var result = repairDuplicateIds();
    if (result.success) {
      ui.alert('✅ تم الإصلاح بنجاح', result.message, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ فشل الإصلاح', result.message, ui.ButtonSet.OK);
    }
  }
}

function repairDuplicateIds() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    var rawSh = getSheet("Raw_Data");
    if (!rawSh) return { success: false, message: "تعذر العثور على شيت Raw_Data" };
    
    var rawData = rawSh.getDataRange().getValues();
    var idMap = {}; // mapping from ID to list of rowIndices (0-based array index)
    var duplicateIdsFound = false;
    
    for (var i = 1; i < rawData.length; i++) {
      var idVal = (rawData[i][0] || "").toString().trim();
      if (!idVal) continue;
      if (!idMap[idVal]) idMap[idVal] = [];
      idMap[idVal].push(i);
    }
    
    var repairedCount = 0;
    var details = [];
    
    // We will scan idMap for keys with length > 1
    // To generate new unique IDs, we need to know the max ID in the system first
    var maxId = 0;
    for (var idVal in idMap) {
      var num = parseInt(idVal, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
    
    var mySh = getSheet("My_Leads");
    var myData = mySh ? mySh.getDataRange().getValues() : [];
    
    var cpSh = getSheet("Client_Payments");
    var cpData = cpSh ? cpSh.getDataRange().getValues() : [];
    
    var finSh = getSheet("Financial_Data");
    var finData = finSh ? finSh.getDataRange().getValues() : [];
    
    for (var idVal in idMap) {
      var indices = idMap[idVal];
      if (indices.length > 1) {
        duplicateIdsFound = true;
        // Keep the first one (indices[0]), change subsequent ones (from index 1 onwards)
        for (var j = 1; j < indices.length; j++) {
          var rowIndex = indices[j]; // 0-based array index
          var oldId = idVal;
          maxId++;
          var newId = maxId;
          
          var clientName = rawData[rowIndex][2] || "";
          var clientPhone = rawData[rowIndex][3] || "";
          var cleanPh = cleanPhone(clientPhone);
          
          // 1. Update Raw_Data
          rawSh.getRange(rowIndex + 1, 1).setValue(newId);
          repairedCount++;
          details.push("تم تغيير معرف العميل '" + clientName + "' من " + oldId + " إلى " + newId);
          
          // 2. Update My_Leads
          if (mySh) {
            for (var k = 1; k < myData.length; k++) {
              var myId = (myData[k][0] || "").toString().trim();
              var myPhone = cleanPhone(myData[k][3]);
              if (myId === oldId && (cleanPh && myPhone === cleanPh)) {
                mySh.getRange(k + 1, 1).setValue(newId);
              }
            }
          }
          
          // 3. Update Client_Payments
          if (cpSh) {
            for (var k = 1; k < cpData.length; k++) {
              var cpClientId = (cpData[k][1] || "").toString().trim(); // Column B
              var cpName = (cpData[k][2] || "").toString().trim().toLowerCase();
              if (cpClientId === oldId && cpName === clientName.toString().trim().toLowerCase()) {
                cpSh.getRange(k + 1, 2).setValue(newId);
              }
            }
          }
          
          // 4. Update Financial_Data
          if (finSh) {
            for (var k = 1; k < finData.length; k++) {
              var finOc = (finData[k][6] || "").toString().trim(); // Column G
              var finName = (finData[k][7] || "").toString().trim().toLowerCase();
              if (finOc === oldId && finName === clientName.toString().trim().toLowerCase()) {
                finSh.getRange(k + 1, 7).setValue(newId);
              }
            }
          }
        }
      }
    }
    
    lock.releaseLock();
    SpreadsheetApp.flush();
    
    if (repairedCount > 0) {
      logActivity("admin", "Admin", "REPAIR_DUPLICATE_IDS", "Repaired " + repairedCount + " duplicates.");
      return { 
        success: true, 
        message: "تم إصلاح وتغيير عدد " + repairedCount + " معرف مكرر بنجاح.\nالتفاصيل:\n" + details.join("\n").substring(0, 1000)
      };
    } else {
      return { success: true, message: "فحص مكتمل: لم يتم العثور على أي معرفات مكررة في السيستم حالياً." };
    }
  } catch(e) {
    try { lock.releaseLock(); } catch(err) {}
    return { success: false, message: "حدث خطأ أثناء الإصلاح: " + e.toString() };
  }
}

// ==========================================
// AUDIT + FIX SUSPECT ROW-INDEX IDs
// شغّل auditSuspectIds أول — لو فيه نتايج شغّل fixSuspectIds
// ==========================================

function auditSuspectIds() {
  var ss = SpreadsheetApp.openById('1qUKUQl4c_yyXdwIxJ3b8a3o49iIVvAiOkbGOAspdm_U');
  var sh = ss.getSheetByName('Raw_Data');
  var data = sh.getDataRange().getValues();
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var id = (data[i][0] || '').toString().trim();
    var num = parseInt(id);
    // ID مشبوه: رقم تسلسلي صغير (أقل من 10,000) وليس UUID
    if (id && !isNaN(num) && num < 10000 && id.length < 10) {
      Logger.log('صف ' + (i + 1) + ' | ID: ' + id + ' | اسم: ' + data[i][2] + ' | أجنت: ' + data[i][6]);
      count++;
    }
  }
  Logger.log('══════════════════════════════');
  Logger.log('إجمالي الصفوف المشبوهة: ' + count);
  if (count === 0) {
    Logger.log('✅ كل البيانات سليمة — مفيش IDs غلط');
  } else {
    Logger.log('⚠️ فيه ' + count + ' صف عنده ID غلط — شغّل fixSuspectIds لإصلاحهم');
  }
}

function fixSuspectIds() {
  var ss = SpreadsheetApp.openById('1qUKUQl4c_yyXdwIxJ3b8a3o49iIVvAiOkbGOAspdm_U');
  var rawSh  = ss.getSheetByName('Raw_Data');
  var leadSh = ss.getSheetByName('My_Leads');
  var rawData  = rawSh.getDataRange().getValues();
  var leadData = leadSh ? leadSh.getDataRange().getValues() : [];
  var fixed = 0;

  // Build global ID set to prevent assigning the same UUID to multiple suspect rows
  var usedIds = buildIdSet(rawData, 0, -1);

  for (var i = 1; i < rawData.length; i++) {
    var oldId = (rawData[i][0] || '').toString().trim();
    var num = parseInt(oldId);
    if (!oldId || isNaN(num) || num >= 10000 || oldId.length >= 10) continue;

    // توليد UUID كامل فريد (collision-safe)
    var newId = safeGenId(usedIds);  // 32-char UUID, guaranteed unique

    // تحديث Raw_Data
    rawSh.getRange(i + 1, 1).setValue(newId);
    rawData[i][0] = newId; // تحديث الـ cache

    // تحديث My_Leads
    if (leadSh) {
      for (var j = 1; j < leadData.length; j++) {
        if ((leadData[j][0] || '').toString().trim() === oldId) {
          leadSh.getRange(j + 1, 1).setValue(newId);
          leadData[j][0] = newId; // تحديث الـ cache
        }
      }
    }

    Logger.log('✅ صف ' + (i + 1) + ': ID تغير من [' + oldId + '] إلى [' + newId + '] — ' + rawData[i][2]);
    fixed++;
  }

  SpreadsheetApp.flush();
  Logger.log('══════════════════════════════');
  Logger.log('تم إصلاح: ' + fixed + ' صف');
  if (fixed === 0) Logger.log('مفيش حاجة محتاجة إصلاح');
}

// ============================================================
// FIX ALL DUPLICATE IDs — SYSTEM-WIDE
// يفحص ويصلح كل ID مكرر أو فاضي في كل شيت في السيستم:
//   Raw_Data          → col A (Client ID)
//   Client_Payments   → col A (Pay_ID)       — soft-delete col 19
//   Users             → col A (User ID)
//   Rounds            → col A (Round ID)
//   Payment_Transactions → col A (Tx ID)
// ضمانة: بعد تشغيل الفانكشن ديه، كل ID في السيستم فريد 100%
// ============================================================
function fixAllDuplicateIds(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح" };

  var lock = LockService.getScriptLock();
  lock.waitLock(60000);

  try {
    var totalFixed = 0;
    var allReports = {};

    // ─── Helper ───────────────────────────────────────────────────
    // Scans one sheet, fixes empty + duplicate IDs in col `idColIdx` (0-based).
    // `labelColIdx` = column to read for human-readable label in report.
    // `deletedColIdx` = column with soft-delete flag (or -1 if none).
    // `globalSet` = cross-sheet set to prevent even cross-sheet collisions.
    // ─────────────────────────────────────────────────────────────
    var fixSheet = function(sheetName, idColIdx, labelColIdx, deletedColIdx, globalSet) {
      var sh = getSheet(sheetName);
      if (!sh) return { fixed: 0, rows: [], skipped: "شيت غير موجود" };

      var data = sh.getDataRange().getValues();
      var seenInSheet = {};   // per-sheet seen IDs (first occurrence wins)
      var fixed = 0;
      var rows = [];

      for (var i = 1; i < data.length; i++) {
        // Skip soft-deleted rows — they keep their (possibly duplicate) ID
        // because they're invisible to all lookups anyway.
        if (deletedColIdx >= 0) {
          var del = data[i][deletedColIdx];
          if (del === true || del === "TRUE" || del === "true" || del === 1) continue;
        }

        var pid = (data[i][idColIdx] || "").toString().trim();
        var label = (data[i][labelColIdx] || "صف " + (i + 1)).toString().trim();
        var needsNewId = false;
        var reason = "";

        if (!pid) {
          needsNewId = true;
          reason = "ID فاضي";
        } else if (seenInSheet[pid]) {
          needsNewId = true;
          reason = "مكرر [" + pid + "]";
        } else if (globalSet[pid]) {
          // ID exists in another sheet — cross-sheet collision
          needsNewId = true;
          reason = "تعارض cross-sheet [" + pid + "]";
        }

        if (needsNewId) {
          var newId = safeGenId(globalSet); // unique globally
          sh.getRange(i + 1, idColIdx + 1).setValue(newId);
          seenInSheet[newId] = true;
          rows.push("صف " + (i + 1) + ": [" + label + "] — " + reason + " → " + newId);
          fixed++;
        } else {
          seenInSheet[pid] = true;
          globalSet[pid] = true;
        }
      }

      return { fixed: fixed, rows: rows };
    };

    // ─── Shared global ID set — prevents cross-sheet collisions ───
    var globalIdSet = {};

    // Process sheets in order: most critical first
    var sheets = [
      { name: "Raw_Data",             idCol: 0, labelCol: 2, delCol: -1 },
      { name: "Client_Payments",      idCol: 0, labelCol: 2, delCol: 19 },
      { name: "Payment_Transactions", idCol: 0, labelCol: 2, delCol: -1 },
      { name: "Users",                idCol: 0, labelCol: 1, delCol: -1 },
      { name: "Rounds",               idCol: 0, labelCol: 1, delCol: -1 }
    ];

    for (var s = 0; s < sheets.length; s++) {
      var cfg = sheets[s];
      var res = fixSheet(cfg.name, cfg.idCol, cfg.labelCol, cfg.delCol, globalIdSet);
      allReports[cfg.name] = res;
      totalFixed += res.fixed;
    }

    SpreadsheetApp.flush();
    lock.releaseLock();

    // Build summary message
    var summaryLines = [];
    for (var sn in allReports) {
      var r = allReports[sn];
      if (r.skipped) {
        summaryLines.push("  • " + sn + ": " + r.skipped);
      } else {
        summaryLines.push("  • " + sn + ": " + (r.fixed > 0 ? "✅ " + r.fixed + " ID تم إصلاحه" : "✔ سليم"));
      }
    }

    // Flatten detail rows for report
    var detailRows = [];
    for (var dn in allReports) {
      if (allReports[dn].rows && allReports[dn].rows.length > 0) {
        detailRows.push("=== " + dn + " ===");
        detailRows = detailRows.concat(allReports[dn].rows);
      }
    }

    return {
      success: true,
      fixed: totalFixed,
      message: totalFixed > 0
        ? "✅ تم إصلاح " + totalFixed + " ID مكرر أو فاضي في السيستم\n\n" + summaryLines.join("\n")
        : "✅ كل IDs في السيستم فريدة وسليمة\n\n" + summaryLines.join("\n"),
      report: detailRows
    };

  } catch (e) {
    try { lock.releaseLock(); } catch(_) {}
    return { success: false, message: e.toString() };
  }
}

// backward-compat alias: الفرونت إند بيستدعي fixDuplicatePayIds
function fixDuplicatePayIds(adminId) {
  return fixAllDuplicateIds(adminId);
}

// ==========================================
// REPAIR MY_LEADS IDs AFTER fixAllDuplicateIds
// ==========================================
// fixAllDuplicateIds assigns new UUIDs to Raw_Data & Users rows,
// but does NOT cascade to My_Leads or Financial_Data.
// This function rebuilds those references using phone (for clients)
// and agent-name (for agents) as stable match keys.
function repairMyLeadsAfterIdFix(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, message: "غير مصرح" };

  var lock = LockService.getScriptLock();
  lock.waitLock(60000);

  try {
    var rawSh   = getSheet("Raw_Data");
    var leadSh  = getSheet("My_Leads");
    var usersSh = getSheet("Users");
    var finSh   = getSheet("Financial_Data");

    if (!rawSh || !leadSh || !usersSh) {
      lock.releaseLock();
      return { success: false, message: "شيت مفقود (Raw_Data أو My_Leads أو Users)" };
    }

    var rawData   = rawSh.getDataRange().getValues();
    var leadData  = leadSh.getDataRange().getValues();
    var usersData = usersSh.getDataRange().getValues();
    var finData   = finSh ? finSh.getDataRange().getValues() : null;

    // ── 1. phone → Raw_Data UUID ─────────────────────────────────────
    // Raw_Data: col A(0)=ID, col D(3)=Phone
    // Split multi-phone fields (e.g. "01023055518 - 01000479400") and map each part
    var phoneToClientId = {};
    for (var r = 1; r < rawData.length; r++) {
      var rawId = (rawData[r][0] || "").toString().trim();
      if (!rawId) continue;
      var rawPhoneRaw = (rawData[r][3] || "").toString();
      var rawPhoneParts = rawPhoneRaw.split(/\s*[-–]\s*/);
      for (var rp = 0; rp < rawPhoneParts.length; rp++) {
        var cleaned = cleanPhone(rawPhoneParts[rp]);
        if (cleaned && cleaned.length >= 9 && !phoneToClientId[cleaned]) {
          phoneToClientId[cleaned] = rawId;
        }
      }
    }

    // Helper: look up a phone (or multi-phone field) in the map
    // Matches by exact cleaned number OR last-9-digits fallback
    var lookupPhoneInMap = function(phoneField) {
      if (!phoneField) return null;
      var parts = phoneField.toString().split(/\s*[-–]\s*/);
      for (var pi = 0; pi < parts.length; pi++) {
        var c = cleanPhone(parts[pi]);
        if (!c || c.length < 9) continue;
        if (phoneToClientId[c]) return phoneToClientId[c];
        // last-9-digits fallback: find any key whose last 9 match
        var tail = c.slice(-9);
        for (var key in phoneToClientId) {
          if (key.slice(-9) === tail) return phoneToClientId[key];
        }
      }
      return null;
    };

    // ── 2. agentName (lowercase) → User UUID ─────────────────────────
    // Users: col A(0)=ID, col B(1)=Name
    var nameToAgentId = {};
    for (var u = 1; u < usersData.length; u++) {
      var uid   = (usersData[u][0] || "").toString().trim();
      var uname = (usersData[u][1] || "").toString().trim().toLowerCase();
      if (uid && uname) nameToAgentId[uname] = uid;
    }

    // ── 3. Fix My_Leads ───────────────────────────────────────────────
    // col A(0)=ClientID, col D(3)=Phone, col G(6)=AgentID, col H(7)=AgentName
    var leadClientFixed = 0, leadAgentFixed = 0, leadNotFound = 0;
    var leadChanged = false;

    for (var j = 1; j < leadData.length; j++) {
      if (!leadData[j][0] && !leadData[j][2] && !leadData[j][3]) continue; // skip blank rows

      var leadAgentName = (leadData[j][7] || "").toString().trim().toLowerCase();

      // Fix Client ID via phone lookup (handles multi-phone fields + format variants)
      var leadPhoneRaw = (leadData[j][3] || "").toString();
      if (leadPhoneRaw) {
        var correctClientId = lookupPhoneInMap(leadPhoneRaw);
        if (correctClientId) {
          var currentClientId = (leadData[j][0] || "").toString().trim();
          if (currentClientId !== correctClientId) {
            leadData[j][0] = correctClientId;
            leadClientFixed++;
            leadChanged = true;
          }
        } else {
          leadNotFound++;
        }
      }

      // Fix Agent ID via name lookup
      if (leadAgentName) {
        var correctAgentId = nameToAgentId[leadAgentName] || null;
        if (correctAgentId) {
          var currentAgentId = (leadData[j][6] || "").toString().trim();
          if (currentAgentId !== correctAgentId) {
            leadData[j][6] = correctAgentId;
            leadAgentFixed++;
            leadChanged = true;
          }
        }
      }
    }

    if (leadChanged && leadData.length > 1) {
      leadSh.getRange(1, 1, leadData.length, leadData[0].length).setValues(leadData);
    }

    // ── 4. Fix Financial_Data AgentID ─────────────────────────────────
    // Financial_Data: col A(0)=AgentID, col B(1)=AgentName
    var finAgentFixed = 0;
    var finChanged = false;

    if (finData && finData.length > 1) {
      for (var f = 1; f < finData.length; f++) {
        var finAgentName = (finData[f][1] || "").toString().trim().toLowerCase();
        if (!finAgentName) continue;
        var correctFinAgentId = nameToAgentId[finAgentName] || null;
        if (correctFinAgentId) {
          var currentFinAgentId = (finData[f][0] || "").toString().trim();
          if (currentFinAgentId !== correctFinAgentId) {
            finData[f][0] = correctFinAgentId;
            finAgentFixed++;
            finChanged = true;
          }
        }
      }
      if (finChanged) {
        finSh.getRange(1, 1, finData.length, finData[0].length).setValues(finData);
      }
    }

    SpreadsheetApp.flush();
    lock.releaseLock();

    var msg = "✅ إصلاح My_Leads & Financial_Data اكتمل:\n" +
      "• My_Leads — Client IDs: " + leadClientFixed + " تم إصلاحهم\n" +
      "• My_Leads — Agent IDs: " + leadAgentFixed + " تم إصلاحهم\n" +
      (leadNotFound > 0 ? "• My_Leads — " + leadNotFound + " عميل مش موجود في Raw_Data (رقم تليفون جديد ربما)\n" : "") +
      "• Financial_Data — Agent IDs: " + finAgentFixed + " تم إصلاحهم\n\n" +
      "الأجنتات دلوقتي المفروض يشوفوا عملاؤهم تاني ✔️";

    return {
      success: true,
      leadClientFixed: leadClientFixed,
      leadAgentFixed: leadAgentFixed,
      leadNotFound: leadNotFound,
      finAgentFixed: finAgentFixed,
      message: msg
    };

  } catch (e) {
    try { lock.releaseLock(); } catch(_) {}
    return { success: false, message: e.toString() };
  }
}

// ==========================================
// FIND MY_LEADS ORPHANS (phone not in Raw_Data)
// ==========================================
function getMyLeadsOrphans(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, orphans: [] };
  var rawSh  = getSheet("Raw_Data");
  var leadSh = getSheet("My_Leads");
  if (!rawSh || !leadSh) return { success: false, orphans: [] };

  var rawData  = rawSh.getDataRange().getValues();
  var leadData = leadSh.getDataRange().getValues();

  // Build all Raw_Data phones — split multi-phone fields and store last-9 for fuzzy match
  var rawPhones = {};       // cleaned full number → true
  var rawPhonesTail = {};   // last 9 digits → true
  for (var r = 1; r < rawData.length; r++) {
    var parts = (rawData[r][3] || "").toString().split(/\s*[-–]\s*/);
    for (var rp = 0; rp < parts.length; rp++) {
      var p = cleanPhone(parts[rp]);
      if (p && p.length >= 9) {
        rawPhones[p] = true;
        rawPhonesTail[p.slice(-9)] = true;
      }
    }
  }

  // Check if a My_Leads phone (possibly multi-phone) exists in Raw_Data
  var phoneExistsInRaw = function(phoneField) {
    var pParts = phoneField.toString().split(/\s*[-–]\s*/);
    for (var pi = 0; pi < pParts.length; pi++) {
      var c = cleanPhone(pParts[pi]);
      if (!c || c.length < 9) continue;
      if (rawPhones[c]) return true;           // exact match
      if (rawPhonesTail[c.slice(-9)]) return true; // last-9 fuzzy match
    }
    return false;
  };

  var orphans = [];
  for (var j = 1; j < leadData.length; j++) {
    if (!leadData[j][2] && !leadData[j][3]) continue; // blank row
    var leadPhone = (leadData[j][3] || "").toString();
    if (!leadPhone.trim() || !phoneExistsInRaw(leadPhone)) {
      orphans.push({
        name:      (leadData[j][2] || "—").toString().trim(),
        phone:     leadPhone.trim() || "—",
        agent:     (leadData[j][7] || "—").toString().trim(),
        clientId:  (leadData[j][0] || "—").toString().trim()
      });
    }
  }
  return { success: true, orphans: orphans };
}

// ==========================================
// SYSTEM HEALTH CHECK — callable from frontend
// ==========================================
function systemHealthCheck(adminId) {
  if (!isUserAdminOrManager(adminId)) return { success: false, issues: [], summary: "غير مصرح." };
  var issues = [];
  var warnings = [];

  try {
    // 1. Check Raw_Data IDs
    var rawSh = getSheet("Raw_Data");
    var rawData = rawSh ? rawSh.getDataRange().getValues() : [];
    var idSet = {};
    var suspectCount = 0, dupCount = 0, emptyIdCount = 0;
    for (var i = 1; i < rawData.length; i++) {
      var rid = (rawData[i][0] || "").toString().trim();
      if (!rid) { emptyIdCount++; continue; }
      var num = parseInt(rid);
      if (!isNaN(num) && num < 10000 && rid.length < 10) suspectCount++;
      if (idSet[rid]) { dupCount++; issues.push("🔴 ID مكرر في Raw_Data: " + rid + " (صف " + (i+1) + ")"); }
      idSet[rid] = true;
    }
    if (emptyIdCount > 0) warnings.push("⚠️ " + emptyIdCount + " صف في Raw_Data بدون ID — سيتم توليد ID لهم تلقائياً عند أول حفظ");
    if (suspectCount > 0) issues.push("🔴 " + suspectCount + " صف في Raw_Data عنده ID رقمي صغير (قديم) — شغّل fixSuspectIds");
    if (dupCount === 0 && suspectCount === 0) warnings.push("✅ Raw_Data: كل الـ IDs فريدة وصحيحة");

    // 2. Check Client_Payments
    var cpSh = getSheet("Client_Payments");
    var cpData = cpSh ? cpSh.getDataRange().getValues() : [];
    var cpMissingOc = 0, cpDup = 0, cpIdSet = {};
    for (var j = 1; j < cpData.length; j++) {
      if (!cpData[j][0]) continue;
      var isDeleted = cpData[j][19];
      if (isDeleted === true || isDeleted === "TRUE") continue;
      var payId = (cpData[j][0] || "").toString().trim();
      var oc = (cpData[j][1] || "").toString().trim();
      if (!oc || oc.toLowerCase().indexOf("oc-") !== 0) cpMissingOc++;
      if (cpIdSet[payId]) { cpDup++; issues.push("🔴 Pay ID مكرر في Client_Payments: " + payId); }
      cpIdSet[payId] = true;
    }
    if (cpMissingOc > 0) warnings.push("⚠️ " + cpMissingOc + " دفعة في Client_Payments بدون كود OC — استخدم زر 'مزامنة OC'");
    else warnings.push("✅ Client_Payments: كل الدفعات عندها كود OC");
    if (cpDup > 0) issues.push("🔴 " + cpDup + " Pay ID مكرر في Client_Payments — اضغط زر 'إصلاح IDs'");
    else warnings.push("✅ Client_Payments: لا يوجد Pay IDs مكررة");

    // 2b. Check Rounds IDs for duplicates
    var rndSh = getSheet("Rounds");
    var rndData = rndSh ? rndSh.getDataRange().getValues() : [];
    var rndDup = 0, rndIdSet = {};
    for (var r2 = 1; r2 < rndData.length; r2++) {
      var rndId = (rndData[r2][0] || "").toString().trim();
      if (!rndId) continue;
      if ((rndData[r2][6] || "").toString() === "Deleted") continue; // skip soft-deleted
      if (rndIdSet[rndId]) { rndDup++; issues.push("🔴 Round ID مكرر: " + rndId); }
      rndIdSet[rndId] = true;
    }
    if (rndDup === 0) warnings.push("✅ Rounds: كل الـ IDs فريدة");
    else issues.push("🔴 " + rndDup + " Round IDs مكررة — اضغط 'إصلاح IDs'");

    // 2c. Check Payment_Transactions IDs
    var ptSh = getSheet("Payment_Transactions");
    var ptData = ptSh ? ptSh.getDataRange().getValues() : [];
    var ptDup = 0, ptIdSet = {};
    for (var t = 1; t < ptData.length; t++) {
      var tid = (ptData[t][0] || "").toString().trim();
      if (!tid) continue;
      if (ptIdSet[tid]) { ptDup++; }
      ptIdSet[tid] = true;
    }
    if (ptDup === 0) warnings.push("✅ Payment_Transactions: كل الـ IDs فريدة");
    else issues.push("🔴 " + ptDup + " Transaction IDs مكررة — اضغط 'إصلاح IDs'");

    // 3. Check Round_Members consistency (same logic as getRoundMembersOrphans)
    var rmSh2 = getSheet("Round_Members");
    var rmData2 = rmSh2 ? rmSh2.getDataRange().getValues() : [];
    var rawOcSet2 = {}, rawPhoneSet2 = {}, rawPhone8Set2 = {}, rawIdSet2 = {}, rawNameSet2 = {};
    for (var ri2 = 1; ri2 < rawData.length; ri2++) {
      var rId2   = (rawData[ri2][0]  || "").toString().trim();
      var rName2 = (rawData[ri2][2]  || "").toString().trim().toLowerCase().replace(/\s+/g," ");
      var rPh2   = cleanPhone((rawData[ri2][3] || "").toString().trim());
      var rOc2   = (rawData[ri2][14] || "").toString().trim().toUpperCase();
      if (rId2)  rawIdSet2[rId2]  = true;
      if (rPh2)  { rawPhoneSet2[rPh2] = true; if (rPh2.length>=8) rawPhone8Set2[rPh2.slice(-8)] = true; }
      if (rOc2 && rOc2.indexOf("OC-")===0) rawOcSet2[rOc2] = true;
      if (rName2.length > 3) rawNameSet2[rName2] = true;
    }
    var rmOrphans = 0;
    for (var k = 1; k < rmData2.length; k++) {
      var rmOc2   = (rmData2[k][1] || "").toString().trim();
      var rmName2 = (rmData2[k][2] || "").toString().trim();
      var rmPh2   = cleanPhone((rmData2[k][3] || "").toString().trim());
      if (!rmOc2 && !rmName2 && !rmPh2) continue;
      var rmOcUp2 = rmOc2.toUpperCase();
      var rmNorm2 = rmName2.toLowerCase().replace(/\s+/g," ");
      var rmPh82  = rmPh2.length >= 8 ? rmPh2.slice(-8) : "";
      var found2  = (rmOcUp2 && (rawOcSet2[rmOcUp2] || rawIdSet2[rmOc2])) ||
                    (rmPh2   && rawPhoneSet2[rmPh2])  ||
                    (rmPh82  && rawPhone8Set2[rmPh82]) ||
                    (rmNorm2.length > 3 && rawNameSet2[rmNorm2]);
      if (!found2) rmOrphans++;
    }
    if (rmOrphans > 0) warnings.push("⚠️ " + rmOrphans + " سجل في Round_Members لا يطابق أي عميل في Raw_Data");
    else warnings.push("✅ Round_Members: كل السجلات مربوطة بعملاء موجودين");

    // 4. Check for pending dup call — if isSubmittingDirectInvoice stuck? (frontend only — skip)
    // 5. Summarize
    var status = issues.length === 0 ? "🟢 السيستم سليم" : "🔴 فيه " + issues.length + " مشكلة تحتاج تدخل";
    var allLines = issues.concat(warnings);
    return {
      success: true,
      issues: issues,
      warnings: warnings,
      summary: status,
      details: allLines
    };
  } catch(e) {
    return { success: false, issues: ["خطأ في الفحص: " + e.toString()], summary: "❌ فشل الفحص" };
  }
}

// =============================================
// ACADEMY PORTAL — BACKEND
// =============================================
var ACAD_STUDENTS     = "Academy_Students";
var ACAD_SESSIONS     = "Academy_Sessions";
var ACAD_ENROLL       = "Academy_Enrollments";
var ACAD_CONTENT      = "Academy_Content";
var ACAD_TASKS        = "Academy_Tasks";
var ACAD_PROGRESS     = "Academy_Progress";
var ACAD_QUIZZES      = "Academy_Quizzes";
var ACAD_QUIZ_RESULTS = "Academy_Quiz_Results";
var ACAD_INSTRUCTORS  = "Academy_Instructors";
var ACAD_COMMENTS     = "Academy_Comments";
var ACAD_COMMUNITY    = "Academy_Community";
var ACAD_NOTIFS       = "Academy_Notifications";
// Academy_Instructors:  [0:ID, 1:Name, 2:Username, 3:Password, 4:Active, 5:CreatedAt, 6:ProfilePic(base64/url), 7:IsBSA]
// Academy_Comments:     [0:ID, 1:LectureID, 2:AuthorID, 3:AuthorType(student/instructor/bsa), 4:AuthorName, 5:Content, 6:ParentID, 7:LikeCount, 8:CreatedAt, 9:Deleted]
// Academy_Community:    [0:ID, 1:AuthorID, 2:AuthorType, 3:AuthorName, 4:Content, 5:ParentID, 6:LikeCount, 7:CreatedAt, 8:Deleted]
// Academy_Notifications:[0:ID, 1:RecipientID, 2:RecipientType, 3:Type, 4:Message, 5:RefID, 6:IsRead, 7:CreatedAt]

// Academy_Students cols:  [0:ID, 1:Name, 2:Username, 3:Password, 4:Phone, 5:Active, 6:TaskFolderID, 7:CreatedAt, 8:InstructorTag]
// Academy_Content cols:   [0:ID, 1:RoundID, 2:RoundName, 3:LectureOrder, 4:LectureName, 5:VideoFileID, 6:FileType, 7:IsLocked, 8:TaskRequired, 9:Notes, 10:CreatedAt, 11:InstructorTag, 12:PdfFileID]
// Academy_Quizzes cols:   [0:ID, 1:LectureID, 2:RoundID, 3:LectureName, 4:QuestionsJSON, 5:PassScore, 6:CreatedAt]
// Academy_Quiz_Results:   [0:ID, 1:StudentID, 2:LectureID, 3:Score, 4:Passed, 5:AttemptAt, 6:TotalQ, 7:CorrectQ]

function initAcademySheets() {
  try {
    var headers = {
      "Academy_Students":    ["ID","Name","Username","Password","Phone","Active","TaskFolderID","CreatedAt","InstructorTag"],
      "Academy_Enrollments": ["ID","StudentID","RoundID","RoundName","EnrolledAt","Status"],
      "Academy_Content":     ["ID","RoundID","RoundName","LectureOrder","LectureName","VideoFileID","FileType","IsLocked","TaskRequired","Notes","CreatedAt","InstructorTag","PdfFileID"],
      "Academy_Tasks":       ["ID","StudentID","StudentName","RoundID","LectureID","LectureName","DriveFileID","FileName","SubmittedAt","Status","ReviewedAt","ReviewedBy","ReviewNotes","InstructorStatus","InstructorReviewedAt","InstructorReviewedBy","InstructorReviewNotes"],
      "Academy_Progress":    ["ID","StudentID","LectureID","WatchedAt","Completed"],
      "Academy_Quizzes":      ["ID","LectureID","RoundID","LectureName","QuestionsJSON","PassScore","CreatedAt","QuizSize"],
      "Academy_Quiz_Attempts":["AttemptID","StudentID","LectureID","QuestionsJSON","CreatedAt","Status"],
      "Academy_Quiz_Results": ["ID","StudentID","LectureID","Score","Passed","AttemptAt","TotalQ","CorrectQ"],
      "Academy_Instructors":  ["ID","Name","Username","Password","Active","CreatedAt","ProfilePic","IsBSA"],
      // Academy_Students col 10 = ProfilePic, col 11 = OC_Code
      "Academy_Comments":     ["ID","LectureID","AuthorID","AuthorType","AuthorName","Content","ParentID","LikeCount","CreatedAt","Deleted"],
      "Academy_Community":    ["ID","AuthorID","AuthorType","AuthorName","Content","ParentID","LikeCount","CreatedAt","Deleted"],
      "Academy_Notifications":["ID","RecipientID","RecipientType","Type","Message","RefID","IsRead","CreatedAt"],
      "Academy_Sessions":     ["Token","UserID","Role","IsBSA","CreatedAt"]
    };
    Object.keys(headers).forEach(function(name) {
      var sh = getSheet(name);
      if (!sh) { getMaster().insertSheet(name); sh = getSheet(name); }
      if (sh.getLastRow() === 0) {
        sh.appendRow(headers[name]);
        sh.getRange(1,1,1,headers[name].length).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
      }
    });
    return { success: true, message: "✅ تم إنشاء شيتات الأكاديمية بنجاح" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// Transliterate a single Arabic/Latin character
function _transliterate(ch) {
  var map = {'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh',
             'د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d',
             'ط':'t','ظ':'z','ع':'a','غ':'g','ف':'f','ق':'q','ك':'k','ل':'l',
             'م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'y','ة':'a','ئ':'y','ؤ':'w'};
  return map[ch] || (/[a-zA-Z0-9]/.test(ch) ? ch.toLowerCase() : '');
}

// Generate a unique @bsa username from Arabic/Latin name
function _generateUsername(name, existingUsernames) {
  var clean = (name||"").toString().trim();
  // Split into words and skip honorific prefixes (م/ د/ أ/ م. د. أ. etc.)
  var words = clean.split(/\s+/);
  var first = "student";
  for (var wi = 0; wi < words.length; wi++) {
    var w = words[wi].replace(/[./\s]/g, "");
    // Skip if it's only 1-2 Arabic chars (honorific like م، د، أ، ع)
    if (w.length >= 2 || !/^[؀-ۿ]/.test(words[wi])) { first = words[wi]; break; }
  }
  if (!first || first === "student") first = words[words.length - 1] || "student";
  // Transliterate Arabic letters → simple Latin
  var map = {'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh',
             'د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d',
             'ط':'t','ظ':'z','ع':'a','غ':'g','ف':'f','ق':'q','ك':'k','ل':'l',
             'م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'y','ة':'a','ئ':'y','ؤ':'w'};
  var lat = '';
  for (var i = 0; i < first.length; i++) {
    var c = first[i];
    if (map[c]) lat += map[c];
    else if (/[a-zA-Z0-9]/.test(c)) lat += c.toLowerCase();
  }
  if (!lat) lat = 'student';
  // existingUsernames is an Array — check with indexOf
  var existing = existingUsernames || [];
  var base = lat + '@bsa';
  if (existing.indexOf(base.toLowerCase()) === -1) return base;
  for (var n = 2; n < 999; n++) {
    var candidate = lat + n + '@bsa';
    if (existing.indexOf(candidate.toLowerCase()) === -1) return candidate;
  }
  return lat + new Date().getTime() % 100000 + '@bsa';
}

// ---- Student Auth ----
function studentLogin(username, password) {
  try {
    // Accept "name" or "name@bsa" — normalise to lowercase
    username = (username||"").toString().trim().toLowerCase();
    if (username && username.indexOf('@') === -1) username = username + '@bsa';
    password = (password||"").toString().trim();
    if (!username || !password) return { success: false, message: "أدخل اسم المستخدم والباسورد" };
    var sh = getSheet(ACAD_STUDENTS);
    if (!sh) return { success: false, message: "النظام غير مهيأ — تواصل مع الأكاديمية" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      if ((row[2]||"").toString().trim().toLowerCase() === username && (row[3]||"").toString().trim() === password) {
        if (!row[5]) return { success: false, message: "حسابك موقوف، تواصل مع الأكاديمية" };
        var token = Utilities.getUuid();
        CacheService.getScriptCache().put("acad_" + token, row[0].toString(), 28800);
        return { success: true, token: token, student: { id: row[0].toString(), name: row[1].toString(), username: (row[2]||"").toString() } };
      }
    }
    return { success: false, message: "اسم المستخدم أو الباسورد غلط" };
  } catch(e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

function validateAcadToken(token) {
  if (!token) return null;
  return CacheService.getScriptCache().get("acad_" + token);
}

function studentLogout(token) {
  try { CacheService.getScriptCache().remove("acad_" + token); } catch(e) {}
  return { success: true };
}

// ---- Admin: Students ----
// addStudent(name, username, password, phone, instructorTag, roundId, roundName, accessMode)
// username: if blank, auto-generates from name as "name@bsa"
function addStudent(name, username, password, phone, instructorTag, roundId, roundName, accessMode, ocCode) {
  try {
    var sh = getSheet(ACAD_STUDENTS);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_STUDENTS); }
    var data = sh.getDataRange().getValues();
    // Build list of existing usernames for uniqueness check
    var existingUsernames = [];
    for (var j = 1; j < data.length; j++) {
      var u = (data[j][2]||"").toString().toLowerCase();
      if (u) existingUsernames.push(u);
    }

    // Build username
    var cleanUser = (username||"").toString().trim().toLowerCase();
    if (!cleanUser) {
      cleanUser = _generateUsername(name, existingUsernames);
    } else {
      if (cleanUser.indexOf('@') === -1) cleanUser = cleanUser + '@bsa';
      if (existingUsernames.indexOf(cleanUser) !== -1)
        return { success: false, message: "⚠️ اسم المستخدم ده موجود بالفعل" };
    }

    var mode = (accessMode||"sequential").toString().trim();
    var id = "STU_" + new Date().getTime();
    // cols: [0:id, 1:name, 2:username, 3:password, 4:phone, 5:active, 6:folderId, 7:createdAt, 8:instructorTag, 9:accessMode, 10:OC_Code]
    sh.appendRow([id, name||"", cleanUser, password||"", phone||"", true, "", new Date(), instructorTag||"", mode, (ocCode||"").toString().trim()]);

    // Enroll in round if specified (creates Drive folder with round/student structure)
    if (roundId) {
      try { enrollStudent(id, roundId, roundName||""); } catch(ee) {}
    } else {
      // No round — create standalone Drive folder by student name
      try { _ensureStudentDriveFolder(id, "", ""); } catch(ee) {}
    }

    _invalidateAcadStats();
    return { success: true, message: "✅ تم إضافة الطالب: " + name + " (username: " + cleanUser + ")" + (roundId ? " وتسجيله في الراوند" : ""), id: id, username: cleanUser };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// Returns all non-admin-locked lectures for admin manual unlock picker
// FIX (2026-07-06): the manual-unlock dropdown used to list every lecture from every instructor —
// a real risk of unlocking the WRONG doctor's lecture for a student by mistake. Now takes the
// student's own ID and, when the student has an instructorTag assigned, filters the list down to
// ONLY that instructor's lectures (case-insensitive, matching the established pattern used
// throughout the academy portal for instructor filtering). Falls back to the full unfiltered list
// if the student can't be found or has no instructor assigned yet, so nothing breaks either way.
function getContentForUnlock(studentId) {
  try {
    var sh = getSheet(ACAD_CONTENT); if (!sh) return { items: [] };
    var data = sh.getDataRange().getValues();

    var studentTag = "";
    if (studentId) {
      try {
        var stuSh = getSheet(ACAD_STUDENTS);
        if (stuSh) {
          var stuData = stuSh.getDataRange().getValues();
          for (var s = 1; s < stuData.length; s++) {
            if ((stuData[s][0] || "").toString() === studentId.toString()) {
              studentTag = (stuData[s][8] || "").toString().trim();
              break;
            }
          }
        }
      } catch (se) {}
    }
    var studentTagLower = studentTag.toLowerCase();

    var items = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0] || data[i][7]) continue; // skip empty / admin-locked
      var rowInstructor = (data[i][11]||"").toString();
      if (studentTagLower && rowInstructor.trim().toLowerCase() !== studentTagLower) continue;
      items.push({
        id:         data[i][0].toString(),
        order:      parseInt(data[i][3])||1,
        name:       (data[i][4]||"").toString(),
        instructor: rowInstructor
      });
    }
    // Sort by instructor then order
    items.sort(function(a,b){ return a.instructor.localeCompare(b.instructor) || a.order - b.order; });
    return { items: items };
  } catch(e) { return { items: [] }; }
}

// Public session validator — called from portal on page reload
function validateAcadSessionPublic(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { id: null };
    return { id: sess.id, role: sess.role };
  } catch(e) { return { id: null }; }
}

function getAcademyStudents() {
  try {
    var sh = getSheet(ACAD_STUDENTS);
    if (!sh) return { students: [] };
    var data = sh.getDataRange().getValues();

    // Build Raw_Data OC_Code→phone map for reliable fallback (OC code is unique, no name collision)
    var phoneByOC = {};
    try {
      var rdSh = getSheet("Raw_Data");
      if (rdSh) {
        var rdData = rdSh.getDataRange().getValues();
        for (var r = 1; r < rdData.length; r++) {
          var oc = ocKey(rdData[r][14]); // FIX: normalize OC so "1000330" ↔ "OC-1000330" match
          var rp = (rdData[r][3]||"").toString().trim();
          if (oc && rp && !phoneByOC[oc]) phoneByOC[oc] = rp;
        }
      }
    } catch(re) {}

    // PROGRESS (2026-07-04): "فتح لحد محاضرة كام من أصل كام" — count each student's watched lectures
    // against the total lecture count for their assigned instructor tag (case-insensitive), so the
    // admin can tell at a glance how far each student got, and knows how many are left to open.
    var lecCountByTag = {}; // instructorTag(lower) → total non-hidden lecture count
    try {
      var contentSh = getSheet(ACAD_CONTENT);
      if (contentSh) {
        var contentData = contentSh.getDataRange().getValues();
        for (var c = 1; c < contentData.length; c++) {
          if (!contentData[c][0] || contentData[c][7]) continue; // skip empty / admin-hidden
          var tagKey = (contentData[c][11] || "").toString().trim().toLowerCase();
          lecCountByTag[tagKey] = (lecCountByTag[tagKey] || 0) + 1;
        }
      }
    } catch (cErr) {}
    var watchedByStudent = {}; // studentId → count of distinct watched lectures
    try {
      var progSh = getSheet(ACAD_PROGRESS);
      if (progSh) {
        var progData = progSh.getDataRange().getValues();
        var seenPair = {};
        for (var p = 1; p < progData.length; p++) {
          var psid = (progData[p][1] || "").toString();
          var plid = (progData[p][2] || "").toString();
          if (!psid || !plid) continue;
          var pk = psid + "|" + plid;
          if (seenPair[pk]) continue; // guard against duplicate progress rows
          seenPair[pk] = true;
          watchedByStudent[psid] = (watchedByStudent[psid] || 0) + 1;
        }
      }
    } catch (pErr) {}

    // ROUND FILTER (2026-07-06): the student list needed a "filter by round" option alongside the
    // existing name/number/username search. Join against Academy_Enrollments so each student carries
    // their currently-enrolled round (skips "removed" enrollments; the last active one found wins if
    // a student has more than one, which normally shouldn't happen in practice).
    var roundByStudent = {};
    try {
      var enrSh2 = getSheet(ACAD_ENROLL);
      if (enrSh2) {
        var enrData2 = enrSh2.getDataRange().getValues();
        for (var e = 1; e < enrData2.length; e++) {
          if (!enrData2[e][0] || (enrData2[e][5]||"").toString() === "removed") continue;
          var eStuId = (enrData2[e][1]||"").toString();
          if (eStuId) roundByStudent[eStuId] = { roundId: (enrData2[e][2]||"").toString(), roundName: (enrData2[e][3]||"").toString() };
        }
      }
    } catch (eErr) {}

    var students = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var storedPhone = (data[i][4]||"").toString().trim();
      var stuOcCode   = (data[i][10]||"").toString().trim(); // col 11 = OC_Code
      // Fallback: look up phone by normalized OC code (unique) — only if phone missing
      if (!storedPhone && stuOcCode && phoneByOC[ocKey(stuOcCode)]) {
        storedPhone = phoneByOC[ocKey(stuOcCode)];
        try { sh.getRange(i+1, 5).setValue(storedPhone); } catch(we) {}
      }
      var sId = data[i][0].toString();
      var sTag = (data[i][8]||"").toString().trim().toLowerCase();
      var lecturesTotal = lecCountByTag[sTag] || 0;
      var lecturesDone = Math.min(watchedByStudent[sId] || 0, lecturesTotal || (watchedByStudent[sId] || 0));
      var sRound = roundByStudent[sId] || { roundId: "", roundName: "" };
      students.push({
        id:             sId,
        name:           data[i][1].toString().trim(),
        username:       (data[i][2]||"").toString(),
        password:       (data[i][3]||"").toString(),
        phone:          storedPhone,
        active:         !!data[i][5],
        createdAt:      data[i][7] ? Utilities.formatDate(new Date(data[i][7]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        instructorTag:  (data[i][8]||"").toString(),
        accessMode:     (data[i][9]||"sequential").toString(),
        ocCode:         stuOcCode,
        lecturesDone:   lecturesDone,
        lecturesTotal:  lecturesTotal,
        roundId:        sRound.roundId,
        roundName:      sRound.roundName
      });
    }
    return { students: students };
  } catch(e) { return { students: [] }; }
}

function toggleStudentActive(studentId, active) {
  var sh = getSheet(ACAD_STUDENTS); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === studentId.toString()) { sh.getRange(i+1,6).setValue(active); return { success: true }; }
  }
  return { success: false };
}

function setStudentAccessMode(studentId, mode) {
  var allowed = ["sequential","open","locked"];
  var isFreeN = mode && mode.toString().indexOf('free:') === 0 && parseInt(mode.split(':')[1]) > 0;
  if (allowed.indexOf(mode) === -1 && !isFreeN) return { success: false, message: "قيمة غير صحيحة" };
  var sh = getSheet(ACAD_STUDENTS); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === studentId.toString()) {
      sh.getRange(i+1, 10).setValue(mode); // col 10 = accessMode (index 9)
      return { success: true, message: "✅ تم تحديث صلاحية الوصول" };
    }
  }
  return { success: false, message: "الطالب مش موجود" };
}

function updateStudentPassword(studentId, newPassword) {
  var sh = getSheet(ACAD_STUDENTS); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === studentId.toString()) { sh.getRange(i+1,4).setValue(newPassword); return { success: true, message: "✅ تم تغيير الباسورد" }; }
  }
  return { success: false };
}

// ---- Full student edit ----
function updateStudent(studentId, name, username, phone, instructorTag, newPassword, ocCode) {
  try {
    var sh = getSheet(ACAD_STUDENTS); if (!sh) return { success: false, message: "Sheet غير موجود" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() !== studentId.toString()) continue;
      // Username handling
      var cleanUser = (username||"").toString().trim().toLowerCase();
      if (!cleanUser) cleanUser = (data[i][2]||"").toString();
      if (cleanUser && cleanUser.indexOf('@') === -1) cleanUser += '@bsa';
      // Uniqueness check (skip current row)
      for (var j = 1; j < data.length; j++) {
        if (j !== i && (data[j][2]||"").toString().toLowerCase() === cleanUser)
          return { success: false, message: "⚠️ Username '" + cleanUser + "' موجود لطالب آخر" };
      }
      sh.getRange(i+1, 2).setValue((name||data[i][1]).toString());
      sh.getRange(i+1, 3).setValue(cleanUser);
      if (newPassword && newPassword.trim()) sh.getRange(i+1, 4).setValue(newPassword.trim());
      sh.getRange(i+1, 5).setValue((phone||"").toString().trim() || (data[i][4]||"").toString());
      sh.getRange(i+1, 9).setValue((instructorTag||"").toString());
      if (ocCode !== undefined && ocCode !== null) sh.getRange(i+1, 11).setValue((ocCode||"").toString().trim()); // col 11 = OC_Code
      return { success: true, message: "✅ تم تعديل بيانات الطالب" };
    }
    return { success: false, message: "الطالب مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Lookup phone from Raw_Data by OC code (exact) or partial name fallback ----
function lookupStudentPhone(ocCodeOrName) {
  try {
    var sh = getSheet("Raw_Data"); if (!sh) return { results: [] };
    var data = sh.getDataRange().getValues();
    var q = (ocCodeOrName||"").toString().trim();
    if (!q) return { results: [] };
    var qLow = q.toLowerCase();
    var results = [];
    // Pass 1: exact OC code match (highest priority — guaranteed unique)
    for (var i = 1; i < data.length; i++) {
      var ocCode = (data[i][14]||"").toString().trim();
      if (ocCode && ocCode.toLowerCase() === qLow) {
        results.push({ name: (data[i][2]||"").toString().trim(), phone: (data[i][3]||"").toString().trim(), ocCode: ocCode, matchType: 'OC Code مطابق تماماً ✅' });
      }
    }
    // Pass 2: if no exact OC match, try partial OC or partial name
    if (!results.length) {
      for (var j = 1; j < data.length; j++) {
        var rName  = (data[j][2]||"").toString().trim();
        var rPhone = (data[j][3]||"").toString().trim();
        var rOC    = (data[j][14]||"").toString().trim();
        if (!rName) continue;
        var matchOC   = rOC && rOC.toLowerCase().indexOf(qLow) !== -1;
        var matchName = rName.toLowerCase().indexOf(qLow) !== -1;
        if (matchOC || matchName) {
          results.push({ name: rName, phone: rPhone, ocCode: rOC, matchType: matchOC ? 'OC Code' : 'اسم' });
          if (results.length >= 6) break;
        }
      }
    }
    return { results: results };
  } catch(e) { return { results: [] }; }
}

function deleteStudent(studentId) {
  var sh = getSheet(ACAD_STUDENTS); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === studentId.toString()) { sh.deleteRow(i+1); return { success: true }; }
  }
  return { success: false };
}

// ---- Admin: Enrollment ----
function enrollStudent(studentId, roundId, roundName) {
  try {
    var sh = getSheet(ACAD_ENROLL);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_ENROLL); }
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString()===studentId.toString() && data[i][2].toString()===roundId.toString() && data[i][5].toString()!=='removed')
        return { success: false, message: "⚠️ الطالب ده متسجل في الراوند ده بالفعل" };
    }
    var id = "ENR_" + new Date().getTime();
    sh.appendRow([id, studentId, roundId, roundName||"", new Date(), "active"]);
    _ensureStudentDriveFolder(studentId, roundId, roundName||"");
    return { success: true, message: "✅ تم تسجيل الطالب في الراوند" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function _ensureStudentDriveFolder(studentId, roundId, roundName) {
  try {
    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) return null;
    var data = stuSh.getDataRange().getValues();
    var studentName = "", existingFolder = "";
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === studentId.toString()) {
        studentName = data[i][1].toString();
        existingFolder = (data[i][6]||"").toString();
        break;
      }
    }
    // Root folder
    var rootId = PropertiesService.getScriptProperties().getProperty("academyDriveFolderID");
    var rootFolder;
    if (rootId) { try { rootFolder = DriveApp.getFolderById(rootId); } catch(e) { rootFolder = null; } }
    if (!rootFolder) {
      rootFolder = DriveApp.createFolder("BSA Academy — Tasks");
      PropertiesService.getScriptProperties().setProperty("academyDriveFolderID", rootFolder.getId());
    }
    // Round folder (or "بدون راوند" if no round)
    var folderLabel = (roundName && roundName.trim()) ? roundName.trim()
                    : (roundId  && roundId.trim())   ? roundId.trim()
                    : "بدون راوند";
    var rFolders = rootFolder.getFoldersByName(folderLabel);
    var roundFolder = rFolders.hasNext() ? rFolders.next() : rootFolder.createFolder(folderLabel);
    // Student folder (name only, no id suffix for cleanliness)
    var stuFolderName = studentName || studentId;
    var sFolders = roundFolder.getFoldersByName(stuFolderName);
    var stuFolder = sFolders.hasNext() ? sFolders.next() : roundFolder.createFolder(stuFolderName);
    // Save
    for (var j = 1; j < data.length; j++) {
      if (data[j][0].toString() === studentId.toString()) { stuSh.getRange(j+1,7).setValue(stuFolder.getId()); break; }
    }
    return stuFolder.getId();
  } catch(e) { Logger.log("Drive folder error: "+e); return null; }
}

function getEnrolledStudents(roundId) {
  try {
    var enrSh = getSheet(ACAD_ENROLL); var stuSh = getSheet(ACAD_STUDENTS);
    if (!enrSh) return { students: [] };
    var enrData = enrSh.getDataRange().getValues();
    var stuData = stuSh ? stuSh.getDataRange().getValues() : [];
    var stuMap = {};
    for (var i = 1; i < stuData.length; i++) if (stuData[i][0]) stuMap[stuData[i][0].toString()] = { name: stuData[i][1].toString(), email: stuData[i][2].toString(), active: !!stuData[i][5] };
    var result = [];
    for (var j = 1; j < enrData.length; j++) {
      if (!enrData[j][0] || enrData[j][2].toString()!==roundId.toString() || enrData[j][5].toString()==='removed') continue;
      var stu = stuMap[enrData[j][1].toString()] || {};
      result.push({ enrollId: enrData[j][0].toString(), studentId: enrData[j][1].toString(), name: stu.name||"", email: stu.email||"", active: stu.active!==false,
        enrolledAt: enrData[j][4] ? Utilities.formatDate(new Date(enrData[j][4]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "", status: enrData[j][5].toString() });
    }
    return { students: result };
  } catch(e) { return { students: [] }; }
}

function unenrollStudent(enrollId) {
  var sh = getSheet(ACAD_ENROLL); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString()===enrollId.toString()) { sh.getRange(i+1,6).setValue("removed"); return { success: true }; }
  }
  return { success: false };
}

// ---- Admin: Content ----
function addLectureContent(roundId, roundName, lectureOrder, lectureName, driveFileId, fileType, taskRequired, notes, instructorTag, pdfFileId) {
  try {
    var sh = getSheet(ACAD_CONTENT);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_CONTENT); }
    var id = "CON_" + new Date().getTime();
    sh.appendRow([id, roundId||"", roundName||"", parseInt(lectureOrder)||1, lectureName||"", driveFileId||"",
                  fileType||"video", false, taskRequired!==false, notes||"", new Date(), instructorTag||"", pdfFileId||""]);
    return { success: true, message: "✅ تم إضافة المحاضرة: " + lectureName, id: id };
  } catch(e) { return { success: false, message: e.toString() }; }
}

/*
  batchImportContent — إضافة محاضرات وكويزات دفعة واحدة
  items = [{
    roundId, roundName, lectureOrder, lectureName,
    videoFileId, pdfFileId, fileType,       // fileType default "video"
    taskRequired,                            // true/false, default true
    instructorTag,                           // اسم الدكتور
    notes,
    quiz: {                                  // اختياري
      passScore,                             // default 70
      questions: [{ q:"...", options:["أ","ب","ج","د"], correct:0 }]
    }
  }, ...]
*/
function batchImportContent(items) {
  try {
    if (!items || !items.length) return { success: false, message: "مفيش بيانات" };
    var conSh = getSheet(ACAD_CONTENT);
    if (!conSh) { initAcademySheets(); conSh = getSheet(ACAD_CONTENT); }
    var qzSh = getSheet(ACAD_QUIZZES);
    if (!qzSh) { initAcademySheets(); qzSh = getSheet(ACAD_QUIZZES); }
    var addedLec = 0, addedQuiz = 0, errors = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      try {
        var lecId = "CON_" + new Date().getTime() + "_" + i;
        conSh.appendRow([
          lecId,
          it.roundId    || "",
          it.roundName  || "",
          parseInt(it.lectureOrder) || (i+1),
          it.lectureName|| "",
          it.videoFileId|| it.driveFileId || "",
          it.fileType   || "video",
          false,                                   // IsLocked
          it.taskRequired !== false,               // TaskRequired
          it.notes       || "",
          new Date(),
          it.instructorTag || "",
          it.pdfFileId   || ""
        ]);
        addedLec++;
        // Add quiz if provided
        if (it.quiz && it.quiz.questions && it.quiz.questions.length) {
          var qzId = "QZ_" + new Date().getTime() + "_" + i;
          qzSh.appendRow([
            qzId, lecId,
            it.roundId || "",
            it.lectureName || "",
            JSON.stringify(it.quiz.questions),
            parseFloat(it.quiz.passScore) || 70,
            new Date()
          ]);
          addedQuiz++;
        }
      } catch(ie) { errors.push("محاضرة "+(it.lectureName||i)+": "+ie.toString()); }
    }
    return { success: true,
      message: "✅ تم إضافة "+addedLec+" محاضرة و "+addedQuiz+" كويز"+
               (errors.length ? "\n⚠️ أخطاء: "+errors.join(" | ") : ""),
      addedLectures: addedLec, addedQuizzes: addedQuiz };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getRoundContent(roundId) {
  try {
    var sh = getSheet(ACAD_CONTENT); if (!sh) return { lectures: [] };
    var data = sh.getDataRange().getValues();
    var lectures = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] || row[1].toString()!==roundId.toString()) continue;
      lectures.push({ id: row[0].toString(), roundId: row[1].toString(), roundName: row[2].toString(),
        order: parseInt(row[3])||1, name: row[4].toString(), driveFileId: (row[5]||"").toString(),
        fileType: (row[6]||"video").toString(), isLocked: !!row[7],
        taskRequired: row[8]!==false && row[8]!=='false', notes: (row[9]||"").toString(),
        instructorTag: (row[11]||"").toString() });
    }
    lectures.sort(function(a,b){ return a.order-b.order; });
    return { lectures: lectures };
  } catch(e) { return { lectures: [] }; }
}

// Returns ALL content from Academy_Content grouped by instructorTag.
// Lectures with no instructor go under key "" (مشترك للكل).
// Used by the CRM content tab to display lectures by doctor.
function getAllContentGroupedByInstructor() {
  try {
    var sh = getSheet(ACAD_CONTENT); if (!sh) return { groups: [] };
    // Also need quiz existence per lecture
    var qzSh  = getSheet(ACAD_QUIZZES);
    var qzData = qzSh ? qzSh.getDataRange().getValues() : [];
    var quizExists = {};
    for (var q = 1; q < qzData.length; q++) {
      if (qzData[q][0] && qzData[q][1]) quizExists[qzData[q][1].toString()] = true;
    }

    var data = sh.getDataRange().getValues();
    var map  = {};   // instructorTag → [lectures]
    var order = []; // track insertion order of instructor tags
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      var ins = (row[11] || "").toString().trim();
      if (!map[ins]) { map[ins] = []; order.push(ins); }
      map[ins].push({
        id:           row[0].toString(),
        roundId:      row[1].toString(),
        roundName:    row[2].toString(),
        order:        parseInt(row[3]) || 1,
        name:         row[4].toString(),
        driveFileId:  (row[5] || "").toString(),
        fileType:     (row[6] || "video").toString(),
        isLocked:     !!row[7],
        taskRequired: row[8] !== false && row[8] !== 'false',
        notes:        (row[9] || "").toString(),
        instructorTag: ins,
        hasQuiz:      !!quizExists[row[0].toString()],
        pdfFileId:    (row[12] || "").toString()
      });
    }
    // Sort each group by order
    var groups = order.map(function(ins) {
      var lecs = map[ins];
      lecs.sort(function(a, b) { return a.order - b.order; });
      return { instructor: ins || "مشترك للكل", lecs: lecs };
    });
    // Named instructors first, then "مشترك"
    groups.sort(function(a, b) {
      if (!a.instructor || a.instructor === "مشترك للكل") return 1;
      if (!b.instructor || b.instructor === "مشترك للكل") return -1;
      return a.instructor.localeCompare(b.instructor, 'ar');
    });
    return { groups: groups };
  } catch(e) { return { groups: [], error: e.toString() }; }
}

function updateLectureContent(contentId, lectureName, driveFileId, fileType, taskRequired, isLocked, notes, pdfFileId, instructorTag) {
  var sh = getSheet(ACAD_CONTENT); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString()===contentId.toString()) {
      if (lectureName !== undefined) sh.getRange(i+1,5).setValue(lectureName);
      if (driveFileId !== undefined) sh.getRange(i+1,6).setValue(driveFileId);
      if (fileType !== undefined) sh.getRange(i+1,7).setValue(fileType);
      if (isLocked !== undefined) sh.getRange(i+1,8).setValue(isLocked);
      if (taskRequired !== undefined) sh.getRange(i+1,9).setValue(taskRequired);
      if (notes !== undefined) sh.getRange(i+1,10).setValue(notes);
      if (instructorTag !== undefined) sh.getRange(i+1,12).setValue(instructorTag);
      if (pdfFileId !== undefined) sh.getRange(i+1,13).setValue(pdfFileId);
      return { success: true, message: "✅ تم التعديل" };
    }
  }
  return { success: false };
}

function deleteLectureContent(contentId) {
  var sh = getSheet(ACAD_CONTENT); if (!sh) return { success: false };
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString()===contentId.toString()) { sh.deleteRow(i+1); return { success: true }; }
  }
  return { success: false };
}

// ---- Student: Dashboard ----
function getStudentDashboard(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    var conSh  = getSheet(ACAD_CONTENT);
    var proSh  = getSheet(ACAD_PROGRESS);
    var taskSh = getSheet(ACAD_TASKS);
    var qrSh   = getSheet(ACAD_QUIZ_RESULTS);
    var conData  = conSh  ? conSh.getDataRange().getValues()  : [];
    var proData  = proSh  ? proSh.getDataRange().getValues()  : [];
    var taskData = taskSh ? taskSh.getDataRange().getValues() : [];
    var qrData   = qrSh   ? qrSh.getDataRange().getValues()   : [];

    // Watched set + last watched timestamp
    var watched = {};
    var lastTs = null, lastLecId = null;
    for (var p = 1; p < proData.length; p++) {
      if (proData[p][1].toString() !== studentId) continue;
      var lid = proData[p][2].toString();
      watched[lid] = true;
      var ts = proData[p][3] ? new Date(proData[p][3]) : null;
      if (ts && (!lastTs || ts > lastTs)) { lastTs = ts; lastLecId = lid; }
    }

    // Read student's assigned instructor (col 8 = InstructorTag) — same as getStudentRounds
    var stuInsTag = "";
    var stuSh3 = getSheet(ACAD_STUDENTS);
    if (stuSh3) {
      var stuDataR3 = stuSh3.getDataRange().getValues();
      for (var si3 = 1; si3 < stuDataR3.length; si3++) {
        if (stuDataR3[si3][0].toString() === studentId) {
          stuInsTag = (stuDataR3[si3][8] || "").toString().trim();
          break;
        }
      }
    }
    var stuInsTagLow = stuInsTag.toLowerCase();

    // Build rounds grouped by instructor tag (same logic as getStudentRounds)
    // roundId = "INS:instructorName" — consistent with _loadMyRounds frontend
    // Filter to student's assigned instructor only (case-insensitive)
    var insGroups = {}, insOrder = [], lecIndex = {};
    for (var c = 1; c < conData.length; c++) {
      var row = conData[c];
      if (!row[0] || row[7]) continue;
      var insTag = (row[11] || '').toString().trim() || 'BSA Academy';
      // If student has an assigned instructor, only show that instructor's content
      if (stuInsTag && insTag.toLowerCase() !== stuInsTagLow) continue;
      if (!insGroups[insTag]) { insGroups[insTag] = { total: 0, done: 0 }; insOrder.push(insTag); }
      insGroups[insTag].total++;
      if (watched[row[0].toString()]) insGroups[insTag].done++;
      lecIndex[row[0].toString()] = {
        roundId: 'INS:' + insTag,
        roundName: insTag,
        lectureName: (row[4] || row[3] || '').toString()
      };
    }
    var rounds = [];
    for (var ii = 0; ii < insOrder.length; ii++) {
      var tag = insOrder[ii];
      var grp = insGroups[tag];
      rounds.push({ roundId: 'INS:' + tag, roundName: tag, lecturesTotal: grp.total, lecturesDone: grp.done });
    }

    // Quiz passed
    var totalQuizPassed = 0;
    for (var q = 1; q < qrData.length; q++) {
      if (qrData[q][1].toString() === studentId) {
        var p4 = qrData[q][4];
        if (p4 === true || p4 === 'true' || p4 === 'TRUE' || p4 === 1) totalQuizPassed++;
      }
    }
    // Tasks approved
    var totalTasksApproved = 0;
    for (var t = 1; t < taskData.length; t++) {
      if (taskData[t][1].toString() === studentId && taskData[t][9].toString() === 'approved') totalTasksApproved++;
    }
    // Last lecture
    var lastLecture = null;
    if (lastLecId && lecIndex[lastLecId]) {
      var inf = lecIndex[lastLecId];
      lastLecture = { lectureId: lastLecId, roundId: inf.roundId, roundName: inf.roundName, lectureName: inf.lectureName };
    }
    var totalLecDone = 0; rounds.forEach(function(rd) { totalLecDone += rd.lecturesDone; });
    var totalPoints = totalLecDone * 10 + totalQuizPassed * 20 + totalTasksApproved * 30;
    return { success: true, rounds: rounds, lastLecture: lastLecture,
             totalQuizPassed: totalQuizPassed, totalTasksApproved: totalTasksApproved, totalPoints: totalPoints };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Student: Certificates ----
function getStudentCertificates(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    var sh = getSheet("Academy_Certificates");
    if (!sh) return { success: true, certificates: [] };
    var data = sh.getDataRange().getValues();
    var certs = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0] || data[i][1].toString() !== studentId) continue;
      certs.push({
        id: data[i][0].toString(), courseName: data[i][3].toString(),
        issueDate: data[i][4] ? Utilities.formatDate(new Date(data[i][4]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        fileId: data[i][5].toString(), status: data[i][6].toString()
      });
    }
    return { success: true, certificates: certs };
  } catch(e) { return { success: true, certificates: [] }; }
}

// ---- Support Ticket ----
function submitSupportTicket(token, subject, message) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  try {
    var sh = getSheet("Academy_Support");
    if (!sh) {
      getMaster().insertSheet("Academy_Support").appendRow(["ID","StudentID","StudentName","Subject","Message","Status","CreatedAt"]);
      sh = getSheet("Academy_Support");
    }
    var ticketId = genId();
    sh.appendRow([ticketId, sess.id, sess.name, subject, message, "open", new Date()]);

    // Notify all BSA users about new ticket
    var nSh = getSheet(ACAD_NOTIFS);
    if (nSh) {
      var insSh = getSheet(ACAD_INSTRUCTORS);
      if (insSh) {
        var insData = insSh.getDataRange().getValues();
        var ts = new Date().getTime();
        for (var ii = 1; ii < insData.length; ii++) {
          var isBSA = insData[ii][7] === true || insData[ii][7] === 'TRUE' || insData[ii][7] === 1;
          if (!isBSA) continue;
          nSh.appendRow(["NTF_SUP_"+ts+"_"+ii, insData[ii][0].toString(), "bsa", "support_ticket",
                         "🎧 طلب دعم جديد من " + sess.name + ": " + subject, ticketId, false, new Date()]);
        }
      }
    }
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم إرسال طلب الدعم بنجاح، سيتواصل معك الفريق قريباً" };
  } catch(e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

// ---- Student Quiz History ----
function getStudentQuizHistory(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  try {
    var qrSh = getSheet(ACAD_QUIZ_RESULTS);
    if (!qrSh) return { success: true, quizzes: [] };
    var data = qrSh.getDataRange().getValues();
    // [0:ID, 1:StudentID, 2:LectureID, 3:Score, 4:Passed, 5:AttemptAt, 6:TotalQ, 7:CorrectQ]
    var conSh = getSheet(ACAD_CONTENT);
    var lecNames = {};
    if (conSh) {
      var conData = conSh.getDataRange().getValues();
      for (var c = 1; c < conData.length; c++) {
        lecNames[conData[c][0].toString()] = conData[c][3] ? conData[c][3].toString() : conData[c][4].toString();
      }
    }
    var quizzes = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] || row[1].toString() !== sess.id.toString()) continue;
      var p = row[4];
      var passed = (p === true || p === 'TRUE' || p === 'true' || p === 1 || p === '1');
      quizzes.push({
        id: row[0].toString(),
        lectureId: row[2].toString(),
        lectureName: lecNames[row[2].toString()] || '',
        score: Number(row[3]) || 0,
        passed: passed,
        attemptAt: row[5] ? Utilities.formatDate(new Date(row[5]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
        totalQ: Number(row[6]) || 0,
        correctQ: Number(row[7]) || 0
      });
    }
    quizzes.reverse();
    return { success: true, quizzes: quizzes };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Student Task History ----
function getStudentTaskHistory(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  try {
    var sh = getSheet(ACAD_TASKS);
    if (!sh) return { success: true, tasks: [] };
    var data = sh.getDataRange().getValues();
    var tasks = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] || row[1].toString() !== sess.id.toString()) continue;
      tasks.push({
        id: row[0].toString(),
        lectureId: row[4].toString(),
        lectureName: row[5] ? row[5].toString() : '',
        roundId: row[3] ? row[3].toString() : '',
        fileName: row[7] ? row[7].toString() : '',
        driveFileId: row[6] ? row[6].toString() : '',
        driveUrl: row[6] ? 'https://drive.google.com/file/d/' + row[6] + '/view' : '',
        submittedAt: row[8] ? Utilities.formatDate(new Date(row[8]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
        status: row[9] ? row[9].toString() : 'pending',
        reviewedAt: row[10] ? Utilities.formatDate(new Date(row[10]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
        reviewerName: row[11] ? row[11].toString() : '',
        feedback: row[12] ? row[12].toString() : ''
      });
    }
    tasks.reverse();
    return { success: true, tasks: tasks };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Admin: Get Support Tickets ----
function getSupportTickets(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  if (!sess.isBSA) return { success: false, message: "غير مصرح" };
  try {
    var sh = getSheet("Academy_Support");
    if (!sh) return { success: true, tickets: [] };
    var data = sh.getDataRange().getValues();
    var tickets = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      tickets.push({
        id: row[0].toString(),
        studentId: row[1] ? row[1].toString() : '',
        studentName: row[2] ? row[2].toString() : '',
        subject: row[3] ? row[3].toString() : '',
        message: row[4] ? row[4].toString() : '',
        status: row[5] ? row[5].toString() : 'open',
        createdAt: row[6] ? Utilities.formatDate(new Date(row[6]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
        adminReply: row[7] ? row[7].toString() : '',
        repliedAt: row[8] ? Utilities.formatDate(new Date(row[8]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : ''
      });
    }
    tickets.reverse();
    return { success: true, tickets: tickets };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Admin: Reply to Support Ticket ----
function replyToSupportTicket(token, ticketId, reply) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  if (!sess.isBSA) return { success: false, message: "غير مصرح" };
  try {
    var sh = getSheet("Academy_Support");
    if (!sh) return { success: false, message: "الشيت غير موجود" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() !== ticketId.toString()) continue;
      sh.getRange(i + 1, 6).setValue('answered');
      sh.getRange(i + 1, 8).setValue(reply);
      sh.getRange(i + 1, 9).setValue(new Date());
      // Notify the student
      var studentId = (data[i][1]||'').toString();
      var subject   = (data[i][3]||'').toString();
      if (studentId) {
        var nSh = getSheet(ACAD_NOTIFS);
        if (nSh) {
          nSh.appendRow(["NTF_SUP_REP_"+new Date().getTime(), studentId, "student", "support_reply",
                         "🎧 BSA Team ردّ على طلبك \"" + subject + "\": " + reply.slice(0, 80) + (reply.length > 80 ? '…' : ''),
                         ticketId, false, new Date()]);
        }
      }
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, message: "التذكرة غير موجودة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Get Mentionable Users (instructors + BSA team) ----
function getMentionableUsers(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, users: [] };
  try {
    var insSh = getSheet(ACAD_INSTRUCTORS);
    var users = [];
    if (insSh) {
      var insData = insSh.getDataRange().getValues();
      // [0:ID, 1:Name, 2:Username, 3:Password, 4:Active, 5:CreatedAt, 6:ProfilePic, 7:IsBSA]
      for (var i = 1; i < insData.length; i++) {
        var row = insData[i];
        if (!row[0] || row[4] === false || row[4] === 'FALSE' || row[4] === 0) continue;
        var isBSA = row[7] === true || row[7] === 'TRUE' || row[7] === 1;
        users.push({ name: row[1] ? row[1].toString().trim() : '', type: isBSA ? 'bsa' : 'instructor' });
      }
    }
    return { success: true, users: users.filter(function(u){ return u.name; }) };
  } catch(e) { return { success: true, users: [] }; }
}

function getRoundLectures(token, roundId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    // New: instructor-group roundIds start with "INS:"
    var isInsGroup = roundId && roundId.indexOf("INS:") === 0;
    var insFilter  = isInsGroup ? roundId.substring(4) : null;

    var roundName = isInsGroup ? insFilter : "";
    // Everyone can access instructor groups — no enrollment check needed
    if (!isInsGroup) {
      // Legacy round check (kept for backwards compat)
      var enrSh = getSheet(ACAD_ENROLL);
      var enrData = enrSh ? enrSh.getDataRange().getValues() : [];
      var enrolled = false;
      if (sess.role === 'instructor') {
        enrolled = true;
      } else {
        for (var e = 1; e < enrData.length; e++) {
          if (enrData[e][1].toString()===studentId && enrData[e][2].toString()===roundId && enrData[e][5].toString()!=='removed') { enrolled=true; roundName=enrData[e][3].toString(); break; }
        }
      }
      if (!enrolled) return { success: false, message: "مش مسجل في الراوند ده" };
    }

    // stuInstructor only used in legacy (non-INS) mode
    var stuInstructor = "";

    // Load manual unlocks for this student
    var manualUnlocks = {};
    var ulkSh = getSheet(ACAD_UNLOCKS);
    if (ulkSh) {
      var ulkData = ulkSh.getDataRange().getValues();
      for (var u = 1; u < ulkData.length; u++) {
        if (ulkData[u][1].toString() === studentId) manualUnlocks[ulkData[u][2].toString()] = true;
      }
    }

    // Fetch student's accessMode from Academy_Students
    var stuAccessMode = "sequential";
    if (sess.role !== 'instructor') {
      var stuSh2 = getSheet(ACAD_STUDENTS);
      if (stuSh2) {
        var stuData2 = stuSh2.getDataRange().getValues();
        for (var si = 1; si < stuData2.length; si++) {
          if (stuData2[si][0].toString() === studentId) {
            stuAccessMode = (stuData2[si][9]||"sequential").toString() || "sequential";
            break;
          }
        }
      }
    }

    var conSh  = getSheet(ACAD_CONTENT);
    var taskSh = getSheet(ACAD_TASKS);
    var proSh  = getSheet(ACAD_PROGRESS);
    var qzSh   = getSheet(ACAD_QUIZZES);
    var qrSh   = getSheet(ACAD_QUIZ_RESULTS);

    var conData  = conSh  ? conSh.getDataRange().getValues()  : [];
    var taskData = taskSh ? taskSh.getDataRange().getValues() : [];
    var proData  = proSh  ? proSh.getDataRange().getValues()  : [];
    var qzData   = qzSh   ? qzSh.getDataRange().getValues()   : [];
    var qrData   = qrSh   ? qrSh.getDataRange().getValues()   : [];

    // Watched set
    var watched = {};
    for (var pp = 1; pp < proData.length; pp++) if (proData[pp][1].toString()===studentId) watched[proData[pp][2].toString()]=true;

    // Task status per lecture — use highest-priority status (approved > pending > rejected)
    var submittedTasks = {};
    var _stPriority = { approved: 3, pending: 2, rejected: 1 };
    for (var t = 1; t < taskData.length; t++) {
      if (taskData[t][1].toString() !== studentId) continue;
      var _tid = taskData[t][4].toString();
      var _tst = (taskData[t][9]||'').toString();
      var _cur = submittedTasks[_tid];
      if (!_cur || (_stPriority[_tst]||0) > (_stPriority[_cur]||0)) submittedTasks[_tid] = _tst;
    }

    // Quiz existence per lecture and pass status
    var quizExists = {};  // lectureId → true
    for (var q = 1; q < qzData.length; q++) if (qzData[q][0] && qzData[q][1]) quizExists[qzData[q][1].toString()] = true;

    var quizPassed = {};  // lectureId → true if student passed
    for (var r = 1; r < qrData.length; r++) {
      if (qrData[r][1].toString()===studentId && qrData[r][4]) quizPassed[qrData[r][2].toString()] = true;
    }

    var lectures = [];
    for (var i = 1; i < conData.length; i++) {
      var row = conData[i];
      if (!row[0]) continue;
      if (isInsGroup) {
        // Filter by instructor name (case-insensitive)
        var lecIns2 = (row[11]||"").toString().trim() || "BSA Academy";
        if (insFilter && lecIns2.toLowerCase() !== insFilter.toString().toLowerCase()) continue;
      } else {
        // Legacy: filter by round OR shared "ALL" lectures
        var lecRound = row[1].toString();
        if (lecRound !== roundId && lecRound !== "ALL") continue;
        // Filter by instructor tag (student's assigned instructor)
        var lecInstructor = (row[11]||"").toString().trim();
        if (lecInstructor && stuInstructor && lecInstructor.toLowerCase() !== stuInstructor.toString().trim().toLowerCase()) continue; // case-insensitive instructor tag
      }
      lectures.push({
        id:             row[0].toString(),
        order:          parseInt(row[3])||1,
        name:           row[4].toString(),
        driveFileId:    (row[5]||"").toString(),
        fileType:       (row[6]||"video").toString(),
        isAdminLocked:  !!row[7],
        taskRequired:   row[8]!==false && row[8]!=='false',
        notes:          (row[9]||"").toString(),
        instructorTag:  lecInstructor,
        hasQuiz:        !!quizExists[row[0].toString()],
        pdfFileId:      (row[12]||"").toString()
      });
    }
    lectures.sort(function(a,b){ return a.order-b.order; });

    for (var k = 0; k < lectures.length; k++) {
      var lec = lectures[k];
      lec.watched     = !!watched[lec.id];
      lec.taskStatus  = submittedTasks[lec.id] || null;
      lec.quizPassed  = !!quizPassed[lec.id];

      // Instructors can access all lectures freely
      if (sess.role === 'instructor') { lec.accessible=true; continue; }

      // Manual admin unlock overrides everything
      if (manualUnlocks[lec.id]) { lec.accessible=true; lec.manualUnlock=true; continue; }

      // Student access mode: open / locked / free:N / sequential (default)
      if (stuAccessMode === 'open')   { lec.accessible=true; continue; }
      if (stuAccessMode === 'locked') { lec.accessible=false; lec.lockReason="محتاج إذن من الأدمين"; continue; }
      // free:N — first N lectures freely accessible, rest follow sequential logic
      if (stuAccessMode && stuAccessMode.indexOf('free:') === 0) {
        var freeN = parseInt((stuAccessMode.split(':')[1])||0) || 0;
        if (k < freeN) { lec.accessible=true; continue; }
        // k >= freeN: fall through to sequential logic
      }

      if (lec.isAdminLocked) { lec.accessible=false; lec.lockReason="مش متاحة دلوقتي"; continue; }
      if (k===0) { lec.accessible=true; continue; }

      var prev = lectures[k-1];
      if (!prev.watched) { lec.accessible=false; lec.lockReason='اتفرج على "'+prev.name+'" الأول'; continue; }
      if (prev.taskRequired && prev.taskStatus !== 'approved') {
        var tReason = !prev.taskStatus
          ? 'ارفع تاسك "'+prev.name+'" وانتظر موافقة الأدمين'
          : prev.taskStatus === 'pending'
            ? '⏳ تاسك "'+prev.name+'" في انتظار مراجعة الأدمين'
            : '❌ تاسك "'+prev.name+'" اترفض — ارفعه تاني بعد التعديل';
        lec.accessible=false; lec.lockReason=tReason; continue;
      }
      if (prev.hasQuiz && !prev.quizPassed) {
        lec.accessible=false; lec.lockReason='ادي كويز "'+prev.name+'" وانجح بـ 70% الأول'; continue;
      }
      lec.accessible = true;
    }
    return { success: true, roundName: roundName, lectures: lectures };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getSecureFileUrl(token, lectureId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    var sh = getSheet(ACAD_CONTENT); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString()===lectureId) {
        if (data[i][7]) return { success: false, message: "المحاضرة دي مش متاحة" };
        var rawVideo = (data[i][5]||"").toString().trim();
        var rawPdf   = (data[i][12]||"").toString().trim();
        var notes    = (data[i][9]||"").toString();
        // Parse comma-separated video IDs
        var videoIds = rawVideo ? rawVideo.split(',').map(function(v){return v.trim();}).filter(Boolean) : [];
        var pdfIds   = rawPdf   ? rawPdf.split(',').map(function(v){return v.trim();}).filter(Boolean) : [];
        // Backward compat: extract extra video from notes
        var m2 = notes.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (m2 && m2[1] && videoIds.indexOf(m2[1]) === -1) videoIds.push(m2[1]);
        var urls    = videoIds.map(function(id){ return "https://drive.google.com/file/d/"+id+"/preview"; });
        var pdfUrls = pdfIds.map(function(id){   return "https://drive.google.com/file/d/"+id+"/preview"; });
        if (!urls.length && !pdfUrls.length) return { success: false, message: "لينك الملف مش موجود" };
        // Mark watched for students only
        if (sess.role === 'student') _markWatched(studentId, lectureId);
        return { success: true, urls: urls, pdfUrls: pdfUrls,
                 url: urls[0]||"", pdfUrl: pdfUrls[0]||"", url2: urls[1]||"",  // backward compat
                 fileType: "video" };
      }
    }
    return { success: false, message: "المحاضرة مش موجودة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function _markWatched(studentId, lectureId) {
  try {
    var sh = getSheet(ACAD_PROGRESS); if (!sh) return;
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) if (data[i][1].toString()===studentId && data[i][2].toString()===lectureId) return;
    sh.appendRow(["PRO_"+new Date().getTime(), studentId, lectureId, new Date(), true]);
  } catch(e) {}
}

// ---- Student: Task Submission ----
function submitStudentTask(token, lectureId, roundId, lectureName, fileName, fileBase64) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    var taskSh = getSheet(ACAD_TASKS);
    if (!taskSh) { initAcademySheets(); taskSh = getSheet(ACAD_TASKS); }
    var taskData = taskSh.getDataRange().getValues();
    for (var i = 1; i < taskData.length; i++) {
      if (taskData[i][1].toString()===studentId && taskData[i][4].toString()===lectureId && taskData[i][9].toString()==='approved')
        return { success: false, message: "⚠️ التاسك ده اتقبل بالفعل" };
    }
    var stuSh = getSheet(ACAD_STUDENTS);
    var stuData = stuSh ? stuSh.getDataRange().getValues() : [];
    var studentName="", taskFolderId="";
    for (var s=1;s<stuData.length;s++) { if(stuData[s][0].toString()===studentId){studentName=stuData[s][1].toString(); taskFolderId=(stuData[s][6]||"").toString(); break;} }
    if (!taskFolderId) taskFolderId = _ensureStudentDriveFolder(studentId, roundId, "") || "";
    var driveFileId = "";
    if (taskFolderId && fileBase64) {
      try {
        var folder = DriveApp.getFolderById(taskFolderId);
        var ext = (fileName||"").split('.').pop().toLowerCase();
        var mimes = {pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',zip:'application/zip'};
        var mime = mimes[ext] || 'application/octet-stream';
        // Strip data URL prefix if present (readAsDataURL sends "data:mime;base64,<data>")
        var rawB64 = fileBase64.indexOf(',') !== -1 ? fileBase64.split(',')[1] : fileBase64;
        var blob = Utilities.newBlob(Utilities.base64Decode(rawB64), mime, fileName);
        driveFileId = folder.createFile(blob).getId();
      } catch(fe) { Logger.log("Task upload err: "+fe); }
    }
    var taskId = "TSK_"+new Date().getTime();
    taskSh.appendRow([taskId, studentId, studentName, roundId, lectureId, lectureName||"", driveFileId, fileName||"", new Date(), "pending","","",""]);
    return { success: true, message: "✅ تم رفع التاسك بنجاح! هيتراجع قريباً" };
  } catch(e) { return { success: false, message: "خطأ: "+e.toString() }; }
}

function getStudentTasks(token) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false };
  var studentId = sess.id;
  var sh = getSheet(ACAD_TASKS); if (!sh) return { success: true, tasks: [] };
  var data = sh.getDataRange().getValues();
  var tasks = [];
  for (var i=1;i<data.length;i++) {
    if (data[i][1].toString()!==studentId) continue;
    tasks.push({ id:data[i][0].toString(), lectureId:data[i][4].toString(), lectureName:data[i][5].toString(),
      fileName:data[i][7].toString(), submittedAt:data[i][8]?Utilities.formatDate(new Date(data[i][8]),Session.getScriptTimeZone(),"dd/MM HH:mm"):"",
      status:data[i][9].toString(), reviewNotes:(data[i][12]||"").toString() });
  }
  return { success: true, tasks: tasks };
}

// ---- Admin: Task Review ----
function _buildTasksList(statusFilter) {
  // statusFilter: 'pending' | 'approved' | 'rejected' | null (all except approved for backwards compat)
  var sh = getSheet(ACAD_TASKS); if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var conSh = getSheet(ACAD_CONTENT);
  var conData = conSh ? conSh.getDataRange().getValues() : [];
  var conMap = {};
  for (var c = 1; c < conData.length; c++) {
    if (conData[c][0]) conMap[conData[c][0].toString()] = { order: parseInt(conData[c][3])||1, roundId: conData[c][1].toString(), insTag: (conData[c][11]||"").toString() };
  }
  var tasks = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var st = row[9].toString();
    if (statusFilter && st !== statusFilter) continue;
    if (!statusFilter && st === 'approved') continue; // backwards compat: exclude approved when no filter
    var lectureId = row[4].toString();
    var roundId   = row[3].toString();
    var curLec = conMap[lectureId];
    var nextLecId = "", nextLecName = "";
    if (curLec) {
      var nextOrder = curLec.order + 1;
      for (var n = 1; n < conData.length; n++) {
        if (!conData[n][0]) continue;
        var nRound = conData[n][1].toString();
        var nOrder = parseInt(conData[n][3])||1;
        var nIns   = (conData[n][11]||"").toString();
        var sameGroup = (nRound === roundId) || (curLec.insTag && nIns === curLec.insTag);
        if (sameGroup && nOrder === nextOrder) { nextLecId = conData[n][0].toString(); nextLecName = conData[n][4].toString(); break; }
      }
    }
    tasks.push({ id:row[0].toString(), studentId:row[1].toString(), studentName:row[2].toString(),
      roundId:roundId, lectureId:lectureId, lectureName:row[5].toString(),
      driveFileId:row[6].toString(), fileName:row[7].toString(),
      submittedAt:row[8]?Utilities.formatDate(new Date(row[8]),Session.getScriptTimeZone(),"dd/MM HH:mm"):"",
      status:st, reviewNotes:(row[12]||"").toString(),
      driveUrl:row[6]?"https://drive.google.com/file/d/"+row[6]+"/view":"",
      nextLectureId:nextLecId, nextLectureName:nextLecName,
      instructorStatus:(row[13]||"").toString(),
      instructorReviewedBy:(row[15]||"").toString(),
      instructorNotes:(row[16]||"").toString() });
  }
  return tasks;
}

function getPendingTasks() {
  try { return { tasks: _buildTasksList(null) }; } catch(e) { return { tasks: [] }; }
}

function getAllAcadTasks(status) {
  // status: 'pending' | 'approved' | 'rejected'
  try { return { tasks: _buildTasksList(status || 'pending') }; } catch(e) { return { tasks: [] }; }
}

function _autoRegisterTaskInAttendance(studentId, studentName, roundId, lectureId) {
  try {
    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) return;
    var stuData = stuSh.getDataRange().getValues();
    var phone = '';
    for (var s = 1; s < stuData.length; s++) {
      if (stuData[s][0].toString() === studentId.toString()) { phone = (stuData[s][4] || '').toString().trim(); break; }
    }
    if (!phone) return;
    var conSh = getSheet(ACAD_CONTENT);
    if (!conSh) return;
    var conData = conSh.getDataRange().getValues();
    var lectureOrder = 0;
    for (var c = 1; c < conData.length; c++) {
      if (conData[c][0].toString() === lectureId.toString()) { lectureOrder = parseInt(conData[c][3]) || 0; break; }
    }
    if (!lectureOrder) return;
    saveAttendanceData(roundId, phone, studentName, lectureOrder, 'task', true);
  } catch(e) { Logger.log('_autoRegisterTaskInAttendance: ' + e); }
}

function reviewStudentTask(taskId, action, reviewerName, notes) {
  try {
    var sh = getSheet(ACAD_TASKS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i=1;i<data.length;i++) {
      if (data[i][0].toString()!==taskId.toString()) continue;
      sh.getRange(i+1,10).setValue(action);
      sh.getRange(i+1,11).setValue(new Date());
      sh.getRange(i+1,12).setValue(reviewerName||"");
      sh.getRange(i+1,13).setValue(notes||"");
      // Auto-register approved task in Rounds_Attendance
      if (action === 'approved') {
        _autoRegisterTaskInAttendance(data[i][1].toString(), data[i][2].toString(), data[i][3].toString(), data[i][4].toString());
      }
      // Send notification to student
      var studentId  = data[i][1].toString();
      var lectureName= (data[i][5]||"").toString();
      var nSh = getSheet(ACAD_NOTIFS);
      if (nSh) {
        var ntfId = "NTF_"+new Date().getTime();
        var ntfType, ntfMsg;
        if (action === 'approved') {
          ntfType = "task_approved";
          ntfMsg  = "✅ تم قبول تاسك محاضرة \""+lectureName+"\" — يمكنك الآن فتح المحاضرة التالية";
        } else {
          ntfType = "task_rejected";
          ntfMsg  = "❌ تم رفض تاسك محاضرة \""+lectureName+"\""+(notes?"\n📝 السبب: "+notes:"")+" — راجع التاسك وأعد رفعه";
        }
        nSh.appendRow([ntfId, studentId, "student", ntfType, ntfMsg, taskId, false, new Date()]);
        // Send lecture_unlock notification if there's a next lecture
        if (action === 'approved') {
          var nextId2 = "", nextName2 = "";
          var conSh2 = getSheet(ACAD_CONTENT);
          if (conSh2) {
            var conData2 = conSh2.getDataRange().getValues();
            var conMap2 = {};
            for (var cc = 1; cc < conData2.length; cc++) {
              if (conData2[cc][0]) conMap2[conData2[cc][0].toString()] = { order: parseInt(conData2[cc][3])||1, roundId: conData2[cc][1].toString(), insTag: (conData2[cc][11]||"").toString() };
            }
            var lecId2 = (data[i][4]||"").toString();
            var rId2   = (data[i][3]||"").toString();
            var cur2   = conMap2[lecId2];
            if (cur2) {
              var nOrd2 = cur2.order + 1;
              for (var nn = 1; nn < conData2.length; nn++) {
                if (!conData2[nn][0]) continue;
                var sg = (conData2[nn][1].toString()===rId2) || (cur2.insTag && conData2[nn][11].toString()===cur2.insTag);
                if (sg && (parseInt(conData2[nn][3])||1) === nOrd2) { nextId2=conData2[nn][0].toString(); nextName2=conData2[nn][4].toString(); break; }
              }
            }
          }
          if (nextName2) {
            var ulkId = "NTF_ULK_"+new Date().getTime();
            nSh.appendRow([ulkId, studentId, "student", "lecture_unlock", "🔓 المحاضرة التالية \""+nextName2+"\" مفتوحة دلوقتي — ابدأ!", nextId2||taskId, false, new Date()]);
          }
        }
      }
      _invalidateAcadStats();
      return { success: true, message: action==='approved'?"✅ تم قبول التاسك":"❌ تم رفض التاسك" };
    }
    return { success: false, message: "التاسك مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ---- Instructor Task Review ----
function instructorReviewTask(token, taskId, action, notes) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, message: "مش محاضر" };

    // Get instructor name/username (cached read)
    var insName = '', insUsername = '';
    var insData = getSheetDataCached(ACAD_INSTRUCTORS);
    for (var ii = 1; ii < insData.length; ii++) {
      if (insData[ii][0].toString() === sess.id) {
        insName = insData[ii][1].toString().trim();
        insUsername = insData[ii][2].toString().trim();
        break;
      }
    }
    if (!insName) return { success: false, message: "لم يُعثر على بيانات المحاضر" };

    // Build set of lecture IDs belonging to this instructor (fresh read — avoid stale cache)
    var insLecSet = {};
    var _conSh = getSheet(ACAD_CONTENT);
    var conData = _conSh ? _conSh.getDataRange().getValues() : [];
    var _inNL = insName.toLowerCase(), _inUL = insUsername.toLowerCase(), _inIdL = (sess.id||'').toString().toLowerCase();
    for (var c = 1; c < conData.length; c++) {
      if (!conData[c][0]) continue;
      var tag = (conData[c][11]||'').toString().trim().toLowerCase();
      if (tag === _inNL || tag === _inUL || tag === _inIdL) {
        insLecSet[conData[c][0].toString()] = true;
      }
    }

    var sh = getSheet(ACAD_TASKS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() !== taskId.toString()) continue;
      // Verify lecture belongs to this instructor (BSA Team can review any)
      var lecId = (data[i][4]||"").toString();
      if (!sess.isBSA && !insLecSet[lecId]) return { success: false, message: "التاسك ده مش لمحاضراتك" };

      sh.getRange(i+1, 14).setValue(action);          // InstructorStatus
      sh.getRange(i+1, 15).setValue(new Date());      // InstructorReviewedAt
      sh.getRange(i+1, 16).setValue(insName);         // InstructorReviewedBy
      sh.getRange(i+1, 17).setValue(notes||"");       // InstructorReviewNotes
      // OPTION A: the instructor's decision is authoritative — also set the admin Status (col 10 / idx9),
      // which is the lecture-unlock gate, so the next lecture opens IMMEDIATELY without a second CRM
      // approval. (Admin can still override later from the CRM.) Removes the double-approval delay.
      sh.getRange(i+1, 10).setValue(action);          // Status — unlock gate

      var lecName = (data[i][5]||"").toString();
      var stuId   = data[i][1].toString();
      var nSh = getSheet(ACAD_NOTIFS);
      if (action === 'approved') {
        // Notify student that instructor approved — awaiting admin confirmation
        if (nSh) {
          var ntfId2 = "NTF_INS_APR_"+new Date().getTime();
          var ntfMsg2 = "✅ تم قبول تاسك محاضرة \""+lecName+"\""+(notes?" — 📝 "+notes:"")+" — المحاضرة التالية مفتوحة دلوقتي 🎉";
          nSh.appendRow([ntfId2, stuId, "student", "task_approved", ntfMsg2, taskId, false, new Date()]);
        }
      } else if (action === 'rejected') {
        // Notify student immediately on instructor rejection
        if (nSh) {
          var ntfId3  = "NTF_INS_REJ_"+new Date().getTime();
          var ntfMsg3 = "❌ المحاضر رفض تاسك محاضرة \""+lecName+"\""+(notes?"\n📝 السبب: "+notes:"")+" — راجع التاسك وأعد رفعه";
          nSh.appendRow([ntfId3, stuId, "student", "task_rejected", ntfMsg3, taskId, false, new Date()]);
        }
      }
      var retMsg = action==='approved' ? "✅ تم قبول التاسك — المحاضرة التالية فتحت للطالب فورًا"
                 : action==='pending'  ? "↩ تم التراجع عن مراجعتك"
                 : "❌ تم رفض التاسك وتم إبلاغ المتدرب";
      try { CacheService.getScriptCache().remove('ins_stats_' + sess.id); } catch (e) {} // refresh instructor counters now
      return { success: true, message: retMsg };
    }
    return { success: false, message: "التاسك مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getInstructorPendingTasks(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, tasks: [] };

    var insName = '', insUsername = '';
    var insData2 = getSheetDataCached(ACAD_INSTRUCTORS);
    for (var ii = 1; ii < insData2.length; ii++) {
      if (insData2[ii][0].toString() === sess.id) {
        insName = insData2[ii][1].toString().trim();
        insUsername = insData2[ii][2].toString().trim();
        break;
      }
    }
    if (!insName) return { success: false, tasks: [] };

    var insLecSet = {};
    var _conSh2 = getSheet(ACAD_CONTENT);
    var conData2 = _conSh2 ? _conSh2.getDataRange().getValues() : [];
    var _insNL = insName.toLowerCase(), _insUL = insUsername.toLowerCase(), _insIL = (sess.id||'').toString().toLowerCase();
    for (var c = 1; c < conData2.length; c++) {
      if (!conData2[c][0]) continue;
      var tag2 = (conData2[c][11]||'').toString().trim().toLowerCase();
      if (tag2 === _insNL || tag2 === _insUL || tag2 === _insIL) {
        insLecSet[conData2[c][0].toString()] = true;
      }
    }

    var sh = getSheet(ACAD_TASKS); if (!sh) return { success: true, tasks: [] };
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var tasks = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      var lecId = (row[4]||"").toString();
      if (!sess.isBSA && !insLecSet[lecId]) continue;
      var st = (row[9]||"").toString();
      if (st === 'approved') continue; // hide already fully approved
      tasks.push({
        id: row[0].toString(),
        studentId: row[1].toString(),
        studentName: row[2].toString(),
        lectureId: lecId,
        lectureName: (row[5]||"").toString(),
        driveFileId: (row[6]||"").toString(),
        fileName: (row[7]||"").toString(),
        submittedAt: row[8] ? Utilities.formatDate(new Date(row[8]), tz, "dd/MM HH:mm") : "",
        status: st,
        driveUrl: row[6] ? "https://drive.google.com/file/d/"+row[6]+"/view" : "",
        instructorStatus: (row[13]||"").toString(),
        instructorNotes: (row[16]||"").toString()
      });
    }
    // Sort: pending instructor review first
    tasks.sort(function(a,b){
      var aP = (!a.instructorStatus || a.instructorStatus==='pending') ? 0 : 1;
      var bP = (!b.instructorStatus || b.instructorStatus==='pending') ? 0 : 1;
      return aP - bP;
    });
    return { success: true, tasks: tasks };
  } catch(e) { return { success: false, tasks: [] }; }
}

function getInstructorAllTasks(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, tasks: [] };

    var insName = '', insUsername = '';
    var insData2 = getSheetDataCached(ACAD_INSTRUCTORS);
    for (var ii = 1; ii < insData2.length; ii++) {
      if (insData2[ii][0].toString() === sess.id) {
        insName = insData2[ii][1].toString().trim();
        insUsername = insData2[ii][2].toString().trim();
        break;
      }
    }
    if (!insName) return { success: false, tasks: [] };

    var insLecSet = {};
    var _conSh2 = getSheet(ACAD_CONTENT);
    var conData2 = _conSh2 ? _conSh2.getDataRange().getValues() : [];
    var _insNL = insName.toLowerCase(), _insUL = insUsername.toLowerCase(), _insIL = (sess.id||'').toString().toLowerCase();
    for (var c = 1; c < conData2.length; c++) {
      if (!conData2[c][0]) continue;
      var tag2 = (conData2[c][11]||'').toString().trim().toLowerCase();
      if (tag2 === _insNL || tag2 === _insUL || tag2 === _insIL) {
        insLecSet[conData2[c][0].toString()] = true;
      }
    }

    var sh = getSheet(ACAD_TASKS); if (!sh) return { success: true, tasks: [] };
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var tasks = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      var lecId = (row[4]||"").toString();
      if (!sess.isBSA && !insLecSet[lecId]) continue;
      // Include ALL statuses (no filtering)
      var st = (row[9]||"").toString();
      tasks.push({
        id: row[0].toString(),
        studentId: row[1].toString(),
        studentName: row[2].toString(),
        lectureId: lecId,
        lectureName: (row[5]||"").toString(),
        driveFileId: (row[6]||"").toString(),
        fileName: (row[7]||"").toString(),
        submittedAt: row[8] ? Utilities.formatDate(new Date(row[8]), tz, "dd/MM HH:mm") : "",
        status: st,
        driveUrl: row[6] ? "https://drive.google.com/file/d/"+row[6]+"/view" : "",
        instructorStatus: (row[13]||"").toString(),
        instructorNotes: (row[16]||"").toString()
      });
    }
    tasks.sort(function(a,b){
      var aP = (!a.instructorStatus || a.instructorStatus==='pending') ? 0 : 1;
      var bP = (!b.instructorStatus || b.instructorStatus==='pending') ? 0 : 1;
      return aP - bP;
    });
    return { success: true, tasks: tasks };
  } catch(e) { return { success: false, tasks: [] }; }
}

// ---- Instructor: Quiz Results Per Student ----
function getInstructorStudentQuizResults(token, studentId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, message: "مش محاضر" };

    var insName = '', insUsername = '';
    var insData = getSheetDataCached(ACAD_INSTRUCTORS);
    for (var ii = 1; ii < insData.length; ii++) {
      if (insData[ii][0].toString() === sess.id) {
        insName = insData[ii][1].toString().trim();
        insUsername = insData[ii][2].toString().trim();
        break;
      }
    }

    // Build set of lecture IDs belonging to this instructor (fresh read)
    var insLecSet = {};
    var insLecNames = {};
    var _cSh = getSheet(ACAD_CONTENT);
    var conData = _cSh ? _cSh.getDataRange().getValues() : [];
    var _iNL4 = insName.toLowerCase(), _iUL4 = insUsername.toLowerCase(), _iIdL4 = (sess.id||'').toString().toLowerCase();
    for (var c = 1; c < conData.length; c++) {
      if (!conData[c][0]) continue;
      var tag = (conData[c][11]||'').toString().trim().toLowerCase();
      if (sess.isBSA || tag === _iNL4 || tag === _iUL4 || tag === _iIdL4) {
        insLecSet[conData[c][0].toString()] = true;
        insLecNames[conData[c][0].toString()] = (conData[c][4]||'').toString();
      }
    }

    var qrSh = getSheet(ACAD_QUIZ_RESULTS);
    if (!qrSh) return { success: true, results: [] };
    var tz = Session.getScriptTimeZone();
    var qrData = qrSh.getDataRange().getValues();
    var results = [];
    for (var i = 1; i < qrData.length; i++) {
      var row = qrData[i];
      if (!row[0]) continue;
      if (row[1].toString() !== studentId.toString()) continue;
      var lecId = row[2].toString();
      if (!insLecSet[lecId]) continue;
      results.push({
        lectureId: lecId,
        lectureName: insLecNames[lecId] || lecId,
        score: parseInt(row[3])||0,
        passed: !!row[4],
        attemptAt: row[5] ? Utilities.formatDate(new Date(row[5]), tz, "dd/MM/yyyy HH:mm") : "",
        totalQ: parseInt(row[6])||0,
        correctQ: parseInt(row[7])||0
      });
    }
    // Sort by attempt date desc
    results.sort(function(a,b){ return b.attemptAt > a.attemptAt ? 1 : -1; });
    return { success: true, results: results };
  } catch(e) { return { success: false, results: [] }; }
}

// ---- Manual Unlock ----
var ACAD_UNLOCKS = "Academy_Unlocks";

function manualUnlockLecture(studentId, lectureId, adminName) {
  try {
    if (!studentId || !lectureId) return { success: false, message: "بيانات ناقصة" };
    var sh = getSheet(ACAD_UNLOCKS);
    if (!sh) { getMaster().insertSheet(ACAD_UNLOCKS); sh = getSheet(ACAD_UNLOCKS);
      sh.appendRow(["ID","StudentID","LectureID","UnlockedBy","UnlockedAt"]); }
    // Check if already unlocked
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString()===studentId && data[i][2].toString()===lectureId)
        return { success: true, message: "✅ المحاضرة كانت مفتوحة بالفعل" };
    }
    sh.appendRow(["ULK_"+new Date().getTime(), studentId, lectureId, adminName||"admin", new Date()]);
    return { success: true, message: "✅ تم فتح المحاضرة يدوياً للطالب" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// =============================================
// ---- Quiz Management (Admin) ----
// =============================================
// questionsArr: [{q:"...", options:["أ","ب","ج","د"], correct:0}, ...]
function saveQuizForLecture(lectureId, roundId, lectureName, questionsArr, passScore, quizSize) {
  try {
    if (!lectureId) return { success: false, message: "مفيش lectureId" };
    var sh = getSheet(ACAD_QUIZZES);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_QUIZZES); }
    var data = sh.getDataRange().getValues();
    var questionsJSON = JSON.stringify(questionsArr || []);
    var ps = parseFloat(passScore) || 70;
    var qs = parseInt(quizSize) || 20;
    // Update existing row if found
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1]||"").toString() === lectureId.toString()) {
        sh.getRange(i+1, 5).setValue(questionsJSON);
        sh.getRange(i+1, 6).setValue(ps);
        sh.getRange(i+1, 8).setValue(qs);
        return { success: true, message: "✅ تم تحديث الكويز" };
      }
    }
    // Create new
    sh.appendRow(["QZ_"+new Date().getTime(), lectureId, roundId||"", lectureName||"", questionsJSON, ps, new Date(), qs]);
    return { success: true, message: "✅ تم حفظ الكويز" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getQuizForLecture(lectureId) {
  try {
    var sh = getSheet(ACAD_QUIZZES); if (!sh) return { found: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1]||"").toString() === lectureId.toString()) {
        var q = [];
        try { q = JSON.parse(data[i][4]||"[]"); } catch(e) { q = []; }
        return { found: true, id: data[i][0].toString(), questions: q, passScore: parseFloat(data[i][5])||70, quizSize: parseInt(data[i][7])||20 };
      }
    }
    return { found: false };
  } catch(e) { return { found: false }; }
}

// Read-only quiz review — returns questions WITH correct answer index (for history view)
function getQuizQuestionsReadOnly(token, lectureId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, questions: [] };
  try {
    var quiz = getQuizForLecture(lectureId);
    if (!quiz.found) return { success: false, questions: [] };
    return { success: true, questions: quiz.questions || [] };
  } catch(e) { return { success: false, questions: [] }; }
}

// Shared by getStudentQuizReview (student, own attempts only) and getInstructorQuizReview
// (instructor, any of their own students' attempts) — finds the latest scored attempt for
// studentId+lectureId and builds review items: question + options + correct index + chosen index.
function _buildQuizReviewForStudent(studentId, lectureId) {
  var atSh = getSheet('Academy_Quiz_Attempts');
  if (!atSh) return { success: false, questions: [], noAttempt: true };
  var atData = atSh.getDataRange().getValues();
  var bestRow = null;
  for (var a = atData.length - 1; a >= 1; a--) {
    if ((atData[a][1]||'').toString() === studentId.toString() &&
        (atData[a][2]||'').toString() === lectureId.toString() &&
        (atData[a][5]||'').toString() === 'scored') {
      bestRow = atData[a]; break;
    }
  }
  if (!bestRow) return { success: false, questions: [], noAttempt: true };

  var questions = [];
  try { questions = JSON.parse(bestRow[3] || '[]'); } catch(e) { questions = []; }
  var answersArr = [];
  try { answersArr = JSON.parse(bestRow[6] || '[]'); } catch(e) { answersArr = []; }

  var reviewItems = questions.map(function(q, idx) {
    return {
      q: q.q,
      options: q.options,
      correct: parseInt(q.correct),
      chosen: answersArr[idx] !== undefined ? parseInt(answersArr[idx]) : -1
    };
  });
  return { success: true, questions: reviewItems };
}

// Returns only the questions the student actually answered with their choices + correct answers marked
function getStudentQuizReview(token, lectureId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, questions: [] };
  try {
    return _buildQuizReviewForStudent(sess.id, lectureId);
  } catch(e) { return { success: false, questions: [] }; }
}

// Instructor-facing: preview a specific student's actual answers for a lecture's quiz (not just the
// score), so the instructor can see exactly which questions were answered wrong. Gated to the
// instructor's own lectures (same tag-matching rule used by getInstructorStudentQuizResults).
function getInstructorQuizReview(token, studentId, lectureId) {
  var sess = validateAcadSession(token);
  if (!sess || sess.role !== 'instructor') return { success: false, questions: [], message: "مش محاضر" };
  try {
    var insName = '', insUsername = '';
    var insData = getSheetDataCached(ACAD_INSTRUCTORS);
    for (var ii = 1; ii < insData.length; ii++) {
      if (insData[ii][0].toString() === sess.id) {
        insName = insData[ii][1].toString().trim();
        insUsername = insData[ii][2].toString().trim();
        break;
      }
    }
    var _iNL = insName.toLowerCase(), _iUL = insUsername.toLowerCase(), _iIdL = (sess.id||'').toString().toLowerCase();
    var _cSh = getSheet(ACAD_CONTENT);
    var conData = _cSh ? _cSh.getDataRange().getValues() : [];
    var belongsToInstructor = false;
    for (var c = 1; c < conData.length; c++) {
      if (!conData[c][0] || conData[c][0].toString() !== lectureId.toString()) continue;
      var tag = (conData[c][11]||'').toString().trim().toLowerCase();
      if (sess.isBSA || tag === _iNL || tag === _iUL || tag === _iIdL) belongsToInstructor = true;
      break;
    }
    if (!belongsToInstructor) return { success: false, questions: [], message: "المحاضرة دي مش ليك" };
    return _buildQuizReviewForStudent(studentId, lectureId);
  } catch(e) { return { success: false, questions: [] }; }
}

function deleteQuizForLecture(lectureId) {
  try {
    var sh = getSheet(ACAD_QUIZZES); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1]||"").toString() === lectureId.toString()) { sh.deleteRow(i+1); return { success: true }; }
    }
    return { success: false };
  } catch(e) { return { success: false }; }
}

// ---- Quiz: Student ----
// Returns randomly selected questions WITHOUT correct answers, plus an attemptId for secure scoring
function getStudentQuiz(token, lectureId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    var quiz = getQuizForLecture(lectureId);
    if (!quiz.found) return { success: false, message: "مفيش كويز لهذه المحاضرة" };
    // Check if already passed
    var qrSh = getSheet(ACAD_QUIZ_RESULTS); var alreadyPassed = false;
    if (qrSh) {
      var qrData = qrSh.getDataRange().getValues();
      for (var i = 1; i < qrData.length; i++) {
        if (qrData[i][1].toString()===studentId && qrData[i][2].toString()===lectureId && qrData[i][4]) { alreadyPassed=true; break; }
      }
    }
    // Fisher-Yates shuffle then pick quizSize questions
    var allQ = (quiz.questions || []).slice();
    for (var s = allQ.length - 1; s > 0; s--) {
      var r = Math.floor(Math.random() * (s + 1));
      var tmp = allQ[s]; allQ[s] = allQ[r]; allQ[r] = tmp;
    }
    var selected = allQ.slice(0, Math.min(quiz.quizSize || 20, allQ.length));
    // Create attempt record with full questions (including correct answers) stored server-side
    // BUG INVESTIGATION (2026-07-06): user reported quizzes occasionally marking correct answers as
    // wrong and vice versa. Root cause candidate found: attemptId used to be just 'QA_'+timestamp
    // (millisecond resolution) — two quiz-starts landing in the same millisecond (a double-tap on
    // "start quiz", or two rapid students) got the SAME attemptId, and submitQuizAnswers below matches
    // by attemptId+studentId only, taking the FIRST row with that id — silently scoring against
    // whichever of the two (differently shuffled!) question sets happened to be appended first,
    // not necessarily the one the student actually answered. Added a random suffix to make collisions
    // effectively impossible.
    var attemptId = 'QA_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1e9);
    var atSh = getSheet('Academy_Quiz_Attempts');
    if (!atSh) { initAcademySheets(); atSh = getSheet('Academy_Quiz_Attempts'); }
    atSh.appendRow([attemptId, studentId, lectureId, JSON.stringify(selected), new Date(), 'pending']);
    // Strip correct answers before sending to student
    var safeQ = selected.map(function(q, idx) {
      return { idx: idx, q: q.q, options: q.options };
    });
    return { success: true, questions: safeQ, passScore: quiz.passScore, totalQ: safeQ.length, alreadyPassed: alreadyPassed, attemptId: attemptId };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// answersArr: [0, 2, 1, 3, ...] — index of chosen option per question
// attemptId: from getStudentQuiz response — enables random-pool scoring
function submitQuizAnswers(token, lectureId, answersArr, attemptId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, message: "انتهت الجلسة" };
  var studentId = sess.id;
  try {
    var quizData = getQuizForLecture(lectureId);
    var passScore = quizData.found ? (quizData.passScore || 70) : 70;
    var questions;
    if (attemptId) {
      // New path: score against server-saved attempt questions (prevents re-use of same questions)
      var atSh = getSheet('Academy_Quiz_Attempts');
      if (!atSh) return { success: false, message: "خطأ: سجل المحاولة غير موجود" };
      var atData = atSh.getDataRange().getValues();
      var attemptRow = -1;
      for (var a = 1; a < atData.length; a++) {
        if ((atData[a][0]||'').toString() === attemptId && (atData[a][1]||'').toString() === studentId) {
          attemptRow = a; break;
        }
      }
      if (attemptRow === -1) return { success: false, message: "خطأ: محاولة غير صالحة" };
      try { questions = JSON.parse(atData[attemptRow][3] || '[]'); } catch(e2) { questions = []; }
      // Save student answers for later review
      atSh.getRange(attemptRow + 1, 6).setValue('scored');
      atSh.getRange(attemptRow + 1, 7).setValue(JSON.stringify(answersArr));
    } else {
      // BUG FIX (2026-07-06): this "legacy" path used to silently score answersArr against
      // quizData.questions — the FULL question bank in its ORIGINAL stored order — even though what
      // the student actually saw (via getStudentQuiz) is a per-attempt SHUFFLED subset. Since the
      // current frontend always supplies attemptId, this branch should never fire in practice, but if
      // it ever did (attemptId lost/cleared client-side), answersArr[i] would be checked against the
      // WRONG question at index i — correct answers marked wrong and wrong ones marked correct,
      // matching exactly the reported symptom. Fail safely instead of guessing.
      return { success: false, message: "انتهت صلاحية المحاولة — من فضلك ابدأ الكويز من جديد" };
    }
    var correct = 0;
    for (var i = 0; i < questions.length; i++) {
      if (parseInt(answersArr[i]) === parseInt(questions[i].correct)) correct++;
    }
    var score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    var passed = score >= passScore;
    var qrSh = getSheet(ACAD_QUIZ_RESULTS);
    if (!qrSh) { initAcademySheets(); qrSh = getSheet(ACAD_QUIZ_RESULTS); }
    qrSh.appendRow(["QR_"+new Date().getTime(), studentId, lectureId, score, passed, new Date(), questions.length, correct]);
    var msg = passed
      ? "🎉 أحسنت! إجابتك صح " + correct + "/" + questions.length + " — درجتك " + score + "% — المحاضرة الجاية اتفتحت!"
      : "😕 درجتك " + score + "% — محتاج " + passScore + "% عشان تعدي — حاول تاني";
    return { success: true, score: score, passed: passed, correct: correct, total: questions.length, message: msg };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// (addLectureContent defined earlier with full instructorTag support)

// ---- Academy Stats ----
function _invalidateAcadStats() { try { CacheService.getScriptCache().remove('acad_stats_v1'); } catch(e) {} }
function getAcademyStats() {
  try {
    // Short cache so the counters appear instantly on every visit instead of waiting for a cold
    // full scan of enrollments+tasks each time (invalidated by addStudent/syncRound/reviewTask).
    try { var c = CacheService.getScriptCache().get('acad_stats_v1'); if (c) return JSON.parse(c); } catch(e) {}
    var stuCount=0, enrCount=0, taskPending=0, taskApproved=0;
    var sh1=getSheet(ACAD_STUDENTS); if(sh1) stuCount=Math.max(0,sh1.getLastRow()-1);
    var sh2=getSheet(ACAD_ENROLL);
    if(sh2){ var ed=sh2.getDataRange().getValues(); for(var i=1;i<ed.length;i++) if(ed[i][0]&&ed[i][5].toString()!=='removed') enrCount++; }
    var sh3=getSheet(ACAD_TASKS);
    if(sh3){ var td=sh3.getDataRange().getValues(); for(var j=1;j<td.length;j++){ if(!td[j][0]) continue; if(td[j][9].toString()==='pending') taskPending++; if(td[j][9].toString()==='approved') taskApproved++; } }
    var result = { students: stuCount, enrollments: enrCount, pendingTasks: taskPending, approvedTasks: taskApproved };
    try { CacheService.getScriptCache().put('acad_stats_v1', JSON.stringify(result), 45); } catch(e) {}
    return result;
  } catch(e) { return { students:0, enrollments:0, pendingTasks:0, approvedTasks:0 }; }
}

// =============================================
// ---- Sync Round → Academy ----
// Reads Client_Payments for a round, creates Academy student accounts
// and enrollments for every client who doesn't have one yet.
// =============================================
function syncRoundToAcademy(roundId, instructorTag, accessMode, freeN) {
  try {
    if (!roundId) return { success: false, message: "مفيش Round ID" };
    var mode = (accessMode || "sequential").toString().trim();
    var tag  = (instructorTag || "").toString().trim();

    // -- Load Client_Payments --
    var cpSh = getSheet("Client_Payments");
    if (!cpSh) return { success: false, message: "مفيش شيت Client_Payments" };
    var cpData = cpSh.getDataRange().getValues();

    // -- Load Raw_Data for phone lookup --
    var rdSh = getSheet("Raw_Data");
    var rdData = rdSh ? rdSh.getDataRange().getValues() : [];
    // Build map: OC_CODE → { phone, name }
    var phoneMap = {};
    for (var r = 1; r < rdData.length; r++) {
      var ocRaw = (rdData[r][14] || "").toString().trim();
      if (ocRaw) phoneMap[ocRaw] = { phone: (rdData[r][3]||"").toString().trim(), name: (rdData[r][2]||"").toString().trim() };
    }

    // -- Load Academy_Students --
    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) { initAcademySheets(); stuSh = getSheet(ACAD_STUDENTS); }
    var stuData = stuSh.getDataRange().getValues();
    // Map: username.lower → studentId  |  collect existing usernames for uniqueness
    var emailToId = {};
    var existingUsernames = [];
    for (var s = 1; s < stuData.length; s++) {
      if (stuData[s][0]) {
        var uname = (stuData[s][2]||"").toString().toLowerCase();
        emailToId[uname] = stuData[s][0].toString();
        existingUsernames.push(uname);
      }
    }

    // -- Load Academy_Enrollments --
    var enrSh = getSheet(ACAD_ENROLL);
    if (!enrSh) { initAcademySheets(); enrSh = getSheet(ACAD_ENROLL); }
    var enrData = enrSh.getDataRange().getValues();
    // Set: "studentId|roundId"
    var enrolled = {};
    for (var e = 1; e < enrData.length; e++) {
      if (enrData[e][0] && enrData[e][5].toString() !== 'removed') {
        enrolled[enrData[e][1].toString() + "|" + enrData[e][2].toString()] = true;
      }
    }

    var roundName = "";
    var added = 0, alreadyEnrolled = 0, skipped = 0;
    var createdStudents = [];
    var processedOc = {}; // لمنع تكرار نفس العميل (أقساط متعددة في CP)

    // Build candidate list from Client_Payments
    var candidates = []; // [{ocCode, clientName, phone, source}]
    for (var i = 1; i < cpData.length; i++) {
      var row = cpData[i];
      if (!row[0]) continue;
      var cpRoundId = (row[4] || "").toString().trim();
      if (cpRoundId !== roundId.toString()) continue;
      if (!(row[5]||"").toString().trim()) continue; // skip if no round name stored yet
      roundName = roundName || (row[5] || "").toString().trim();
      var ocCode   = (row[1] || "").toString().trim();
      var clientName = (row[2] || "").toString().trim();
      if (!clientName) continue;
      var dedupKey = ocCode || clientName;
      if (!processedOc[dedupKey]) {
        processedOc[dedupKey] = true;
        var pd = phoneMap[ocCode] || {};
        candidates.push({ ocCode: ocCode, clientName: clientName, phone: pd.phone || "" });
      }
    }

    // Fallback: also check Financial_Data for students in this round not found in Client_Payments
    var finSh = getSheet("Financial_Data");
    if (finSh) {
      var finData = finSh.getDataRange().getValues();
      for (var fi = 1; fi < finData.length; fi++) {
        var fRow = finData[fi];
        // Financial_Data: col5=action, col6=OC_Code, col7=Name, col8=Phone, col10=Reservation(roundId)
        var fAction = (fRow[5] || "").toString().trim();
        if (fAction !== "Round") continue;
        var fRoundId = (fRow[10] || "").toString().trim();
        if (fRoundId !== roundId.toString()) continue;
        var fOc = (fRow[6] || "").toString().trim();
        var fName = (fRow[7] || "").toString().trim();
        if (!fName) continue;
        var dedupKeyF = fOc || fName;
        if (!processedOc[dedupKeyF]) {
          processedOc[dedupKeyF] = true;
          var fPhone = (fRow[8] || "").toString().trim() || (phoneMap[fOc] || {}).phone || "";
          candidates.push({ ocCode: fOc, clientName: fName, phone: fPhone });
          if (!roundName) roundName = (fRow[11] || "").toString().trim();
        }
      }
    }

    for (var ci = 0; ci < candidates.length; ci++) {
      var cand = candidates[ci];
      var ocCode = cand.ocCode;
      var clientName = cand.clientName;
      var phone = cand.phone || "";
      if (!clientName) { skipped++; continue; }

      // جلب رقم الهاتف من Raw_Data كـ fallback لو مش موجود من المصدر
      if (!phone) {
        var phoneData = phoneMap[ocCode] || {};
        phone = phoneData.phone || "";
      }
      if (!phone && clientName) {
        for (var rr = 1; rr < rdData.length; rr++) {
          var rdName = (rdData[rr][2]||"").toString().trim();
          if (rdName && rdName === clientName) { phone = (rdData[rr][3]||"").toString().trim(); break; }
        }
      }

      // Build username in name@bsa format
      var generatedUsername = _generateUsername(clientName, existingUsernames);

      // إيجاد أو إنشاء حساب الطالب — البحث بالتليفون أولاً ثم باليوزرنيم
      var studentId = null;
      if (phone) {
        for (var si = 1; si < stuData.length; si++) {
          if (stuData[si][4] && stuData[si][4].toString().trim() === phone) {
            studentId = stuData[si][0].toString();
            break;
          }
        }
      }
      if (!studentId) studentId = emailToId[generatedUsername.toLowerCase()];

      var generatedPass = "";
      if (!studentId) {
        // كلمة المرور: الحرف الأول + آخر 4 أرقام من التليفون + @BSA
        var digits = phone.replace(/\D/g,"");
        var suffix = digits.length >= 4 ? digits.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
        var firstLetter = _transliterate(clientName.charAt(0)).toUpperCase() || "S";
        generatedPass = firstLetter + suffix + "@BSA";
        var newId = "STU_" + new Date().getTime() + "_" + ci;
        // col: [ID, Name, Username, Password, Phone, Active, TaskFolderID, CreatedAt, InstructorTag, AccessMode, OC_Code]
        stuSh.appendRow([newId, clientName, generatedUsername, generatedPass, phone, true, "", new Date(), tag, mode, ocCode]);
        studentId = newId;
        emailToId[generatedUsername.toLowerCase()] = newId;
        existingUsernames.push(generatedUsername.toLowerCase());
        createdStudents.push({ id: newId, name: clientName, username: generatedUsername, password: generatedPass, phone: phone });
      }

      // Enroll if not already enrolled
      var key = studentId + "|" + roundId;
      if (!enrolled[key]) {
        var enrId = "ENR_" + new Date().getTime() + "_" + i;
        enrSh.appendRow([enrId, studentId, roundId, roundName, new Date(), "active"]);
        enrolled[key] = true;
        _ensureStudentDriveFolder(studentId, roundId, roundName);
        added++;
      } else {
        alreadyEnrolled++;
      }
    }

    _invalidateAcadStats();
    return {
      success: true,
      message: "✅ تم المزامنة — " + added + " طالب جديد" + (alreadyEnrolled ? " · " + alreadyEnrolled + " مسجلين مسبقاً" : "") + (skipped ? " · " + skipped + " تم تخطيه" : ""),
      roundName: roundName,
      added: added,
      alreadyEnrolled: alreadyEnrolled,
      skipped: skipped,
      students: createdStudents
    };
  } catch(e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

// =============================================
// ---- Send Batch Credentials Email ----
// Sends login email to all students enrolled in a round.
// Requires the Academy_Students email to be a real address.
// =============================================
function sendBatchCredentials(roundId) {
  try {
    if (!roundId) return { success: false, message: "مفيش Round ID" };

    var enrSh = getSheet(ACAD_ENROLL);
    if (!enrSh) return { success: false, message: "النظام غير مهيأ" };
    var enrData = enrSh.getDataRange().getValues();

    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) return { success: false, message: "النظام غير مهيأ" };
    var stuData = stuSh.getDataRange().getValues();
    // Build map: studentId → { name, email, password }
    var stuMap = {};
    for (var s = 1; s < stuData.length; s++) {
      if (stuData[s][0]) stuMap[stuData[s][0].toString()] = { name: stuData[s][1], email: stuData[s][2], password: stuData[s][3] };
    }

    // Get the deployed web app URL for the Academy portal
    var portalUrl = ScriptApp.getService().getUrl() + "?portal=academy";

    var sent = 0, failed = 0, roundName = "";
    for (var i = 1; i < enrData.length; i++) {
      if (!enrData[i][0]) continue;
      if (enrData[i][2].toString() !== roundId.toString()) continue;
      if (enrData[i][5].toString() === 'removed') continue;
      roundName = enrData[i][3].toString();

      var stu = stuMap[enrData[i][1].toString()];
      if (!stu) continue;

      var email = (stu.email || "").toString().trim();
      // Skip placeholder emails (generated @bsa.academy)
      if (!email || email.indexOf("@bsa.academy") !== -1) { failed++; continue; }

      try {
        var subject = "🎓 BSA Academy — بيانات دخولك لـ " + roundName;
        var body =
          "أهلاً " + stu.name + "،\n\n" +
          "تم تسجيلك في راوند: " + roundName + "\n\n" +
          "بيانات الدخول لبوابة الطلاب:\n" +
          "   🔗 الرابط: " + portalUrl + "\n" +
          "   📧 الإيميل: " + email + "\n" +
          "   🔑 الباسورد: " + stu.password + "\n\n" +
          "برجاء حفظ هذه البيانات واستخدامها للدخول على المنصة.\n\n" +
          "مع تحيات فريق BSA Academy 🎓";

        MailApp.sendEmail({ to: email, subject: subject, body: body });
        sent++;
      } catch(mailErr) { failed++; }
    }

    return {
      success: true,
      message: "✅ تم إرسال " + sent + " إيميل بنجاح" + (failed > 0 ? " (" + failed + " فشل أو بدون إيميل حقيقي)" : ""),
      sent: sent, failed: failed, roundName: roundName
    };
  } catch(e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

// =============================================
// ---- Get Batch Credentials for WhatsApp ----
// Returns student list with username/password/phone for a round
// =============================================
function getBatchCredentials(roundId) {
  try {
    if (!roundId) return { success: false, message: "مفيش Round ID" };

    var enrSh = getSheet(ACAD_ENROLL);
    if (!enrSh) return { success: false, message: "النظام غير مهيأ" };
    var enrData = enrSh.getDataRange().getValues();

    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) return { success: false, message: "النظام غير مهيأ" };
    var stuData = stuSh.getDataRange().getValues();
    // Academy_Students cols: [0:ID, 1:Name, 2:Username, 3:Password, 4:Phone, 5:Active, ...]
    var stuMap = {};
    for (var s = 1; s < stuData.length; s++) {
      if (stuData[s][0]) stuMap[stuData[s][0].toString()] = {
        name:     (stuData[s][1]||"").toString(),
        username: (stuData[s][2]||"").toString(),
        password: (stuData[s][3]||"").toString(),
        phone:    (stuData[s][4]||"").toString()
      };
    }

    var students = [];
    var roundName = "";
    for (var i = 1; i < enrData.length; i++) {
      if (!enrData[i][0]) continue;
      if (enrData[i][2].toString() !== roundId.toString()) continue;
      if (enrData[i][5].toString() === 'removed') continue;
      roundName = enrData[i][3].toString();
      var stu = stuMap[enrData[i][1].toString()];
      if (!stu) continue;
      students.push(stu);
    }

    return { success: true, students: students, roundName: roundName };
  } catch(e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

// =============================================
// ---- Get Rounds for Academy Sync Dropdown ----
// Returns list of rounds from the Rounds sheet
// =============================================
function getAcademyRoundsList() {
  try {
    var sh = getSheet("Rounds");
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      list.push({ id: data[i][0].toString(), name: (data[i][1]||"").toString(), status: (data[i][6]||"").toString() });
    }
    return list;
  } catch(e) { return []; }
}

// ═══════════════════════════════════════════════════
// ═══  UNIFIED ACADEMY LOGIN (Student + Instructor) ═══
// ═══════════════════════════════════════════════════
function academyLogin(username, password) {
  try {
    username = (username||"").toString().trim().toLowerCase();
    if (username && username.indexOf('@') === -1) username += '@bsa';
    password = (password||"").toString().trim();
    if (!username || !password) return { success: false, message: "أدخل اسم المستخدم والباسورد" };

    var cache = CacheService.getScriptCache();

    // --- Check Students ---
    var stuSh = getSheet(ACAD_STUDENTS);
    if (stuSh) {
      var stuData = stuSh.getDataRange().getValues();
      for (var i = 1; i < stuData.length; i++) {
        var row = stuData[i];
        if (!row[0]) continue;
        if ((row[2]||"").toString().trim().toLowerCase() === username && (row[3]||"").toString().trim() === password) {
          if (!row[5]) return { success: false, message: "حسابك موقوف، تواصل مع الأكاديمية" };
          var token = Utilities.getUuid();
          // BUG FIX (2026-07-06): CacheService's real hard cap is 6 hours (21600s) — the 28800 (8h)
          // requested here was silently being capped, so a student's session died on its own after ~6
          // hours even though nothing looked wrong client-side (localStorage still had the token — the
          // app just started getting "انتهت الجلسة" on every call and had no choice but to force a
          // logout). The user wants sessions to stay open indefinitely until an explicit manual logout.
          // Cache is now just a fast-path warm cache; Academy_Sessions sheet is the real, non-expiring
          // source of truth that validateAcadSession() falls back to on a cache miss.
          cache.put("acad_" + token, row[0].toString(), 21600);
          _saveAcadSessionRow(token, row[0].toString(), 'student', false);
          return {
            success: true, token: token, role: 'student',
            user: { id: row[0].toString(), name: row[1].toString(), username: (row[2]||"").toString(),
                    phone: (row[4]||"").toString(), pic: (row[9]||"").toString() }
          };
        }
      }
    }

    // --- Check Instructors ---
    var insSh = getSheet(ACAD_INSTRUCTORS);
    if (insSh) {
      var insData = insSh.getDataRange().getValues();
      for (var j = 1; j < insData.length; j++) {
        var ins = insData[j];
        if (!ins[0]) continue;
        var insUser = (ins[2]||"").toString().trim().toLowerCase();
        if (insUser.indexOf('@') === -1) insUser += '@bsa';
        if (insUser === username && (ins[3]||"").toString().trim() === password) {
          if (!ins[4]) return { success: false, message: "حساب المحاضر موقوف" };
          var isBSA = !!ins[7];
          var insToken = Utilities.getUuid();
          // Cache format: "BSA:" prefix for BSA accounts to preserve role in validation
          cache.put("acad_ins_" + insToken, (isBSA ? "BSA:" : "") + ins[0].toString(), 21600);
          _saveAcadSessionRow(insToken, ins[0].toString(), 'instructor', isBSA);
          return {
            success: true, token: insToken, role: 'instructor',
            user: { id: ins[0].toString(), name: ins[1].toString(), username: (ins[2]||"").toString(),
                    pic: (ins[6]||"").toString(), isBSA: isBSA }
          };
        }
      }
    }

    return { success: false, message: "اسم المستخدم أو الباسورد غلط" };
  } catch(e) { return { success: false, message: "خطأ: " + e.toString() }; }
}

// Persist a login to Academy_Sessions — the non-expiring source of truth. CacheService (6h hard cap)
// is only ever a fast-path warm cache on top of this; see validateAcadSession() below.
function _saveAcadSessionRow(token, userId, role, isBSA) {
  try {
    var sh = getSheet(ACAD_SESSIONS);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_SESSIONS); }
    sh.appendRow([token, userId, role, !!isBSA, new Date()]);
  } catch (e) { /* session still works via cache for this instance; sheet write is best-effort */ }
}

// Validate any academy session — returns { id, role, isBSA } or null
function validateAcadSession(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var stuId = cache.get("acad_" + token);
  if (stuId) return { id: stuId, role: 'student', isBSA: false };
  var insRaw = cache.get("acad_ins_" + token);
  if (insRaw) {
    var isBSA = insRaw.indexOf("BSA:") === 0;
    var insId  = isBSA ? insRaw.substring(4) : insRaw;
    return { id: insId, role: 'instructor', isBSA: isBSA };
  }
  // BUG FIX (2026-07-06): cache entries expire after 6 hours max (GAS hard limit) — that used to be
  // the ONLY place a session lived, so any student/instructor who kept the portal open (or came back)
  // more than ~6 hours later got silently force-logged-out with no way to "stay logged in". Fall back
  // to the persistent Academy_Sessions sheet (written once at login, never expires on its own) and
  // re-warm the cache so subsequent calls in this same window are fast again.
  try {
    var sh = getSheet(ACAD_SESSIONS);
    if (sh) {
      var data = sh.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if ((data[i][0] || '').toString() === token) {
          var uid = data[i][1].toString(), role = (data[i][2] || '').toString(), isBSA2 = !!data[i][3];
          if (role === 'instructor') cache.put("acad_ins_" + token, (isBSA2 ? "BSA:" : "") + uid, 21600);
          else cache.put("acad_" + token, uid, 21600);
          return { id: uid, role: role || 'student', isBSA: isBSA2 };
        }
      }
    }
  } catch (e) { /* fall through to null below */ }
  return null;
}

// Explicit manual logout — invalidates the session everywhere (cache + the persistent sheet row) so
// it can never be resumed, matching "session stays open until the user logs out themselves, and logout
// really means logged out." Best-effort: any failure here just leaves the cache entry to expire on its
// own (max 6h) rather than blocking the client-side logout.
function academyLogout(token) {
  try {
    if (!token) return { success: true };
    try { CacheService.getScriptCache().remove("acad_" + token); } catch (e) {}
    try { CacheService.getScriptCache().remove("acad_ins_" + token); } catch (e) {}
    var sh = getSheet(ACAD_SESSIONS);
    if (sh) {
      var data = sh.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if ((data[i][0] || '').toString() === token) { sh.deleteRow(i + 1); break; }
      }
    }
    return { success: true };
  } catch (e) { return { success: true }; }
}

// Get name + pic for a session user
function _getSessionUserInfo(sess) {
  if (!sess) return { name: 'مجهول', pic: '', authorType: 'student' };
  try {
    if (sess.role === 'instructor') {
      var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { name: 'محاضر', pic: '', authorType: 'instructor' };
      var d = sh.getDataRange().getValues();
      for (var i = 1; i < d.length; i++) {
        if (d[i][0].toString() === sess.id) {
          var aType = (!!d[i][7] || sess.isBSA) ? 'bsa' : 'instructor';
          return { name: d[i][1].toString(), pic: (d[i][6]||"").toString(), authorType: aType };
        }
      }
    } else {
      var sh2 = getSheet(ACAD_STUDENTS); if (!sh2) return { name: 'طالب', pic: '', authorType: 'student' };
      var d2 = sh2.getDataRange().getValues();
      for (var j = 1; j < d2.length; j++) if (d2[j][0].toString() === sess.id) return { name: d2[j][1].toString(), pic: (d2[j][9]||"").toString(), authorType: 'student' };
    }
  } catch(e) {}
  return { name: 'مجهول', pic: '', authorType: sess.role };
}

// ═══════════════════════════════════════════════════
// ═══  PROFILE PIC  ═══
// ═══════════════════════════════════════════════════
// Academy_Students col 9 = ProfilePic (base64 small avatar)
// Academy_Instructors col 6 = ProfilePic
function saveProfilePic(token, base64Data) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    if ((base64Data||"").length > 1500000) return { success: false, message: "الصورة كبيرة جداً — اختار صورة أصغر" };

    if (sess.role === 'instructor') {
      var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { success: false };
      var d = sh.getDataRange().getValues();
      for (var i = 1; i < d.length; i++) {
        if (d[i][0].toString() === sess.id) { sh.getRange(i+1, 7).setValue(base64Data); _invalidatePicMapCache(); return { success: true }; }
      }
    } else {
      var sh2 = getSheet(ACAD_STUDENTS); if (!sh2) return { success: false };
      var d2 = sh2.getDataRange().getValues();
      for (var j = 1; j < d2.length; j++) {
        if (d2[j][0].toString() === sess.id) { sh2.getRange(j+1, 10).setValue(base64Data); _invalidatePicMapCache(); return { success: true }; }
      }
    }
    return { success: false, message: "المستخدم مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════
// ═══  INSTRUCTOR MANAGEMENT (Admin CRM)  ═══
// ═══════════════════════════════════════════════════
function addAcademyInstructor(name, username, password, isBSA, phone) {
  try {
    if (!name || !password) return { success: false, message: "الاسم والباسورد مطلوبين" };
    var sh = getSheet(ACAD_INSTRUCTORS);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_INSTRUCTORS); }
    var data = sh.getDataRange().getValues();
    var uname = (username || _generateUsername(name, [])).toString().trim().toLowerCase();
    if (uname.indexOf('@') === -1) uname += '@bsa';
    for (var i = 1; i < data.length; i++) {
      var existing = (data[i][2]||"").toString().toLowerCase();
      if (existing.indexOf('@') === -1) existing += '@bsa';
      if (existing === uname) return { success: false, message: "Username موجود بالفعل" };
    }
    var id = "INS_" + new Date().getTime();
    sh.appendRow([id, name, uname, password, true, new Date(), "", !!isBSA, (phone||"").toString().trim()]);
    return { success: true, message: "✅ تم إضافة " + (isBSA?"حساب BSA":"المحاضر") + ": " + name, id: id, username: uname };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function updateAcademyInstructor(id, name, username, phone, newPassword) {
  try {
    var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { success: false, message: "Sheet غير موجود" };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() !== id.toString()) continue;
      var uname = (username||data[i][2]).toString().trim().toLowerCase();
      if (uname.indexOf('@') === -1) uname += '@bsa';
      for (var j = 1; j < data.length; j++) {
        if (j !== i && (data[j][2]||"").toString().toLowerCase() === uname)
          return { success: false, message: "Username موجود بالفعل" };
      }
      sh.getRange(i+1, 2).setValue((name||data[i][1]).toString());
      sh.getRange(i+1, 3).setValue(uname);
      sh.getRange(i+1, 9).setValue((phone||"").toString().trim());
      var np = (newPassword||"").toString().trim();
      if (np) sh.getRange(i+1, 4).setValue(np);
      return { success: true, message: "✅ تم تعديل بيانات المحاضر" };
    }
    return { success: false, message: "المحاضر مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function updateAcadPassword(token, currentPassword, newPassword) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' };
    currentPassword = (currentPassword || '').toString().trim();
    newPassword = (newPassword || '').toString().trim();
    if (!currentPassword) return { success: false, message: 'أدخل الباسورد الحالي' };
    if (!newPassword) return { success: false, message: 'أدخل الباسورد الجديد' };
    if (newPassword.length < 6) return { success: false, message: 'الباسورد الجديد لازم يكون 6 أحرف على الأقل' };
    if (newPassword === currentPassword) return { success: false, message: 'الباسورد الجديد مختلفش عن الحالي' };
    if (sess.role === 'student' || !sess.role) {
      var shS = getSheet(ACAD_STUDENTS); if (!shS) return { success: false, message: 'خطأ في النظام' };
      var dataS = shS.getDataRange().getValues();
      for (var i = 1; i < dataS.length; i++) {
        if (dataS[i][0].toString() !== sess.id) continue;
        if ((dataS[i][3] || '').toString().trim() !== currentPassword) return { success: false, message: 'الباسورد الحالي غلط' };
        shS.getRange(i + 1, 4).setValue(newPassword);
        return { success: true, message: '✅ تم تغيير الباسورد بنجاح' };
      }
    }
    if (sess.role === 'instructor') {
      var shI = getSheet(ACAD_INSTRUCTORS); if (!shI) return { success: false, message: 'خطأ في النظام' };
      var dataI = shI.getDataRange().getValues();
      for (var j = 1; j < dataI.length; j++) {
        if (dataI[j][0].toString() !== sess.id) continue;
        if ((dataI[j][3] || '').toString().trim() !== currentPassword) return { success: false, message: 'الباسورد الحالي غلط' };
        shI.getRange(j + 1, 4).setValue(newPassword);
        return { success: true, message: '✅ تم تغيير الباسورد بنجاح' };
      }
    }
    return { success: false, message: 'لم يتم العثور على حسابك' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getAcademyInstructors() {
  try {
    var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { instructors: [] };
    var data = sh.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      list.push({ id: data[i][0].toString(), name: data[i][1].toString(),
                  username: (data[i][2]||"").toString(), password: (data[i][3]||"").toString(),
                  active: !!data[i][4],
                  createdAt: data[i][5] ? data[i][5].toString() : "",
                  isBSA: !!data[i][7], phone: (data[i][8]||"").toString() });
    }
    return { instructors: list };
  } catch(e) { return { instructors: [] }; }
}

function deleteAcademyInstructor(instructorId) {
  try {
    var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === instructorId.toString()) { sh.deleteRow(i+1); return { success: true }; }
    }
    return { success: false, message: "مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function toggleAcademyInstructor(instructorId, active) {
  try {
    var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === instructorId.toString()) { sh.getRange(i+1,5).setValue(!!active); return { success: true }; }
    }
    return { success: false };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function updateInstructorPassword(instructorId, newPassword) {
  try {
    if (!newPassword) return { success: false, message: "الباسورد فارغ" };
    var sh = getSheet(ACAD_INSTRUCTORS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === instructorId.toString()) {
        sh.getRange(i+1, 4).setValue(newPassword.toString().trim());
        return { success: true, message: "✅ تم تغيير الباسورد" };
      }
    }
    return { success: false, message: "المحاضر مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════
// ═══  COMMENTS (per Lecture)  ═══
// ═══════════════════════════════════════════════════
function _buildPicMap() {
  var cache = CacheService.getScriptCache();
  var ckey = 'acad_pic_map_v1';
  try {
    var hit = cache.get(ckey);
    if (hit) return JSON.parse(hit);
  } catch(e) {}

  var map = {};
  var stuSh = getSheet(ACAD_STUDENTS);
  if (stuSh) {
    var lastRow = stuSh.getLastRow();
    if (lastRow > 1) {
      // Read only col A (ID) and col J (ProfilePic=10) — avoid transferring all other columns
      var stuIds = stuSh.getRange(2, 1, lastRow - 1, 1).getValues();
      var stuPics = stuSh.getRange(2, 10, lastRow - 1, 1).getValues();
      for (var s = 0; s < stuIds.length; s++) {
        var p = (stuPics[s][0] || '').toString();
        if (p.length > 10) map[stuIds[s][0].toString()] = p;
      }
    }
  }
  var insSh = getSheet(ACAD_INSTRUCTORS);
  if (insSh) {
    var lastRowI = insSh.getLastRow();
    if (lastRowI > 1) {
      // Read only col A (ID) and col G (ProfilePic=7)
      var insIds = insSh.getRange(2, 1, lastRowI - 1, 1).getValues();
      var insPics = insSh.getRange(2, 7, lastRowI - 1, 1).getValues();
      for (var ins = 0; ins < insIds.length; ins++) {
        var p2 = (insPics[ins][0] || '').toString();
        if (p2.length > 10) map[insIds[ins][0].toString()] = p2;
      }
    }
  }
  try { cache.put(ckey, JSON.stringify(map), 300); } catch(e) {} // 5-min cache, fail silently if too large
  return map;
}

// Call after saveProfilePic so next request gets fresh map
function _invalidatePicMapCache() {
  try { CacheService.getScriptCache().remove('acad_pic_map_v1'); } catch(e) {}
}

function getLectureComments(token, lectureId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    var sh = getSheet(ACAD_COMMENTS); if (!sh) return { success: true, comments: [] };
    var data = sh.getDataRange().getValues();
    var picMap = _buildPicMap();
    var all = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[0] || r[1].toString() !== lectureId.toString()) continue;
      if (r[9]) continue; // deleted
      var aid = r[2].toString();
      all.push({
        id: r[0].toString(), lectureId: r[1].toString(),
        authorId: aid, authorType: r[3].toString(), authorName: r[4].toString(),
        content: r[5].toString(), parentId: (r[6]||"").toString(),
        likes: parseInt(r[7])||0, createdAt: r[8] ? r[8].toString() : "",
        isMe: aid === sess.id, pic: picMap[aid] || ''
      });
    }
    // Enrich with per-reaction counts
    var ids = all.map(function(c){ return c.id; });
    var rdata = _getReactionsForItems('comment', ids, sess.id);
    all.forEach(function(c){
      c.reactionCounts = rdata.countsMap[c.id] || {};
      c.myReaction     = rdata.myMap[c.id]     || '';
    });
    return { success: true, comments: all };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function postComment(token, lectureId, content, parentCommentId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    content = (content||"").toString().trim();
    if (!content) return { success: false, message: "الكومنت فارغ" };
    var info = _getSessionUserInfo(sess);
    var sh = getSheet(ACAD_COMMENTS);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_COMMENTS); }
    var id = "CMT_" + new Date().getTime();
    sh.appendRow([id, lectureId||"", sess.id, info.authorType, info.name, content,
                  parentCommentId||"", 0, new Date(), false]);

    // Notify original commenter if this is a reply
    if (parentCommentId) {
      _notifyCommentReply(sess.id, info.authorType, info.name, parentCommentId, lectureId, id);
    }

    // Notify @mentioned instructors/BSA
    _notifyMentions(sess.id, info.name, info.authorType, content, lectureId, 'comment');

    // Notify lecture owner (instructor) when a student comments — if not already the poster
    _notifyInstructorOnComment(sess.id, info.name, lectureId, id);

    return { success: true, id: id,
             comment: { id: id, authorId: sess.id, authorType: info.authorType,
                        authorName: info.name, content: content,
                        parentId: parentCommentId||"", likes: 0, isMe: true,
                        createdAt: new Date().toString() } };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function likeComment(token, commentId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    var sh = getSheet(ACAD_COMMENTS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === commentId.toString()) {
        var newLikes = (parseInt(data[i][7])||0) + 1;
        sh.getRange(i+1, 8).setValue(newLikes);
        return { success: true, likes: newLikes };
      }
    }
    return { success: false };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function deleteComment(token, commentId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    var sh = getSheet(ACAD_COMMENTS); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === commentId.toString()) {
        // Only author or instructor can delete
        if (data[i][2].toString() !== sess.id && sess.role !== 'instructor') return { success: false, message: "مش مسموح" };
        sh.getRange(i+1, 10).setValue(true);
        return { success: true };
      }
    }
    return { success: false };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// internal: create notification when someone replies to a comment
function _notifyCommentReply(replierId, replierType, replierName, parentCommentId, lectureId, newCommentId) {
  try {
    var sh = getSheet(ACAD_COMMENTS); if (!sh) return;
    var data = sh.getDataRange().getValues();
    var recipientId = "", recipientType = "";
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === parentCommentId.toString()) {
        recipientId = data[i][2].toString();
        recipientType = data[i][3].toString();
        break;
      }
    }
    // Don't notify yourself
    if (!recipientId || recipientId === replierId) return;
    var nSh = getSheet(ACAD_NOTIFS);
    if (!nSh) return;
    var msg = replierName + ' ردّ على تعليقك';
    if (replierType === 'instructor') msg = '👨‍🏫 المحاضر ' + replierName + ' ردّ على تعليقك';
    nSh.appendRow(["NTF_"+new Date().getTime(), recipientId, recipientType, 'comment_reply', msg, lectureId, false, new Date()]);
  } catch(e) {}
}

// ═══════════════════════════════════════════════════
// ═══  INSTRUCTOR STATS  ═══
// ═══════════════════════════════════════════════════
function getInstructorStats(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, message: "مش محاضر" };

    // Get instructor name + username for content matching
    var insSh = getSheet(ACAD_INSTRUCTORS);
    var insName = '', insUsername = '';
    if (insSh) {
      var insData = insSh.getDataRange().getValues();
      for (var ii = 1; ii < insData.length; ii++) {
        if (insData[ii][0].toString() === sess.id) {
          insName = insData[ii][1].toString().trim();
          insUsername = insData[ii][2].toString().trim();
          break;
        }
      }
    }
    if (!insName) return { success: false, message: "لم يُعثر على بيانات المحاضر" };

    // Short per-instructor cache so the dashboard counters appear instantly instead of waiting for a
    // cold full scan of content/progress/tasks/quizzes on every visit. (Stale ≤45s — fine for counters;
    // invalidated immediately when this instructor reviews a task.)
    var _statsCacheKey = 'ins_stats_' + sess.id;
    try { var _c = CacheService.getScriptCache().get(_statsCacheKey); if (_c) return JSON.parse(_c); } catch (_e) {}

    // Find all lectures belonging to this instructor (col 11 = InstructorTag)
    var conSh = getSheet(ACAD_CONTENT);
    var lecIds = [], lecIndex = {}; // id → name
    if (conSh) {
      var conData = conSh.getDataRange().getValues();
      var _insNameLow2 = insName.toLowerCase(), _insUserLow2 = insUsername.toLowerCase(), _insIdLow2 = (sess.id||'').toString().toLowerCase();
      for (var c = 1; c < conData.length; c++) {
        var row = conData[c];
        if (!row[0] || row[7]) continue; // skip empty/hidden
        var tag = (row[11] || '').toString().trim().toLowerCase();
        if (tag === _insNameLow2 || tag === _insUserLow2 || tag === _insIdLow2) {
          lecIds.push(row[0].toString());
          lecIndex[row[0].toString()] = (row[4] || row[3] || '').toString();
        }
      }
    }
    var lecIdSet = {};
    lecIds.forEach(function(id){ lecIdSet[id] = true; });

    // Progress: Academy_Progress [PRO_id, studentId, lectureId, date, watched]
    var progSh = getSheet(ACAD_PROGRESS);
    var stuProgress = {}; // studentId → {lectureId: true}
    if (progSh) {
      var progData = progSh.getDataRange().getValues();
      for (var p = 1; p < progData.length; p++) {
        var pr = progData[p];
        if (!pr[1] || !pr[2]) continue;              // pr[1]=studentId, pr[2]=lectureId
        if (!lecIdSet[pr[2].toString()]) continue;    // filter to instructor's lectures
        var psid = pr[1].toString();                  // studentId
        if (!stuProgress[psid]) stuProgress[psid] = {};
        stuProgress[psid][pr[2].toString()] = true;   // lectureId
      }
    }

    // Quiz results: [id, studentId, lectureId, score, passed, attemptAt, totalQ, correctQ]
    var quizSh = getSheet(ACAD_QUIZ_RESULTS);
    var stuScores = {}; // studentId → {total, count}
    if (quizSh) {
      var qData = quizSh.getDataRange().getValues();
      for (var q = 1; q < qData.length; q++) {
        var qr = qData[q];
        if (!qr[0] || !qr[2]) continue;
        if (!lecIdSet[qr[2].toString()]) continue;
        var qsid = qr[1].toString();
        if (!stuScores[qsid]) stuScores[qsid] = { total: 0, count: 0, passed: 0 };
        stuScores[qsid].total += parseFloat(qr[3]) || 0;
        stuScores[qsid].count++;
        if (qr[4] === true || qr[4] === 'TRUE' || qr[4] === 1) stuScores[qsid].passed++;
      }
    }

    // Tasks: [taskId, studentId, studentName, roundId, lectureId, lectureName, ...]
    var taskSh = getSheet(ACAD_TASKS);
    var taskStats = { submitted: 0, approved: 0, rejected: 0, pending: 0 };
    var stuTasks = {}; // studentId → count
    if (taskSh) {
      var tData = taskSh.getDataRange().getValues();
      for (var t = 1; t < tData.length; t++) {
        var tr = tData[t];
        if (!tr[0] || !tr[4]) continue;
        if (!lecIdSet[tr[4].toString()]) continue;
        var tsid = tr[1].toString();
        taskStats.submitted++;
        stuTasks[tsid] = (stuTasks[tsid] || 0) + 1;
        var st = (tr[9] || '').toString().toLowerCase();
        if (st === 'approved') taskStats.approved++;
        else if (st === 'rejected') taskStats.rejected++;
        else taskStats.pending++;
      }
    }

    // Get student names + phones — only students assigned to this instructor
    var stuSh = getSheet(ACAD_STUDENTS);
    var stuNames = {}, stuPhones = {};
    if (stuSh) {
      var stuData = stuSh.getDataRange().getValues();
      for (var s = 1; s < stuData.length; s++) {
        var sid0 = (stuData[s][0] || '').toString();
        if (!sid0) continue;
        // Filter: only include students whose InstructorTag matches this instructor (case-insensitive)
        var stuInsTagVal = (stuData[s][8]||"").toString().trim().toLowerCase();
        var insNameLow = insName.toLowerCase(), insUserLow = insUsername.toLowerCase(), insIdLow = (sess.id||"").toString().toLowerCase();
        if (stuInsTagVal && stuInsTagVal !== insNameLow && stuInsTagVal !== insUserLow && stuInsTagVal !== insIdLow) continue;
        stuNames[sid0]  = (stuData[s][1] || '').toString();
        stuPhones[sid0] = (stuData[s][4] || '').toString();
      }
    }

    // Get student enrollments (rounds)
    var enrSh = getSheet(ACAD_ENROLL);
    var stuRounds = {}; // studentId → [{id, name}]
    var allRoundsMap = {};
    if (enrSh) {
      var enrData = enrSh.getDataRange().getValues();
      for (var e = 1; e < enrData.length; e++) {
        var er = enrData[e];
        var esid = (er[1] || '').toString();
        if (!esid) continue;
        var rId = (er[2] || '').toString();
        var rName = (er[3] || '').toString() || rId;
        if (rId) {
          if (!stuRounds[esid]) stuRounds[esid] = [];
          stuRounds[esid].push({ id: rId, name: rName });
          allRoundsMap[rId] = rName;
        }
      }
    }
    var allRounds = Object.keys(allRoundsMap).map(function(rId){ return { id: rId, name: allRoundsMap[rId] }; });

    // Build student list — include ALL students, even those with no activity yet
    var students = Object.keys(stuNames).map(function(sid) {
      var watched = stuProgress[sid] ? Object.keys(stuProgress[sid]).length : 0;
      var sc = stuScores[sid];
      return {
        id: sid,
        name: stuNames[sid] || sid,
        phone: stuPhones[sid] || '',
        rounds: stuRounds[sid] || [],
        watchedCount: watched,
        totalLectures: lecIds.length,
        pct: lecIds.length > 0 ? Math.round(watched / lecIds.length * 100) : 0,
        avgScore: sc && sc.count ? Math.round(sc.total / sc.count) : null,
        quizPassed: sc ? sc.passed : 0,
        quizTotal: sc ? sc.count : 0,
        taskCount: stuTasks[sid] || 0
      };
    });
    students.sort(function(a, b){ return b.pct - a.pct; });
    var avgCompletion = students.length
      ? Math.round(students.reduce(function(s, st){ return s + st.pct; }, 0) / students.length) : 0;

    var _result = {
      success: true,
      instructorName: insName,
      totalLectures: lecIds.length,
      totalStudents: students.length,
      avgCompletion: avgCompletion,
      taskStats: taskStats,
      students: students,
      allRounds: allRounds
    };
    try { var _js = JSON.stringify(_result); if (_js.length < 95000) CacheService.getScriptCache().put(_statsCacheKey, _js, 45); } catch (_e) {}
    return _result;
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════
// ═══  BSA TEAM ALL-STUDENT STATS  ═══
// ═══════════════════════════════════════════════════
function getBSAStudentStats(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !sess.isBSA) return { success: false, message: "غير مصرح" };

    // All lectures
    var conSh = getSheet(ACAD_CONTENT);
    var lecIds = [], lecIndex = {};
    if (conSh) {
      var conData = conSh.getDataRange().getValues();
      for (var c = 1; c < conData.length; c++) {
        var row = conData[c];
        if (!row[0] || row[7]) continue;
        lecIds.push(row[0].toString());
        lecIndex[row[0].toString()] = (row[4] || row[3] || '').toString();
      }
    }
    var lecIdSet = {};
    lecIds.forEach(function(id){ lecIdSet[id] = true; });

    // Progress
    var progSh = getSheet(ACAD_PROGRESS);
    var stuProgress = {};
    if (progSh) {
      var progData = progSh.getDataRange().getValues();
      for (var p = 1; p < progData.length; p++) {
        var pr = progData[p];
        if (!pr[1] || !pr[2]) continue;
        var psid = pr[1].toString();
        if (!stuProgress[psid]) stuProgress[psid] = {};
        stuProgress[psid][pr[2].toString()] = true;
      }
    }

    // Quiz results
    var quizSh = getSheet(ACAD_QUIZ_RESULTS);
    var stuScores = {};
    if (quizSh) {
      var qData = quizSh.getDataRange().getValues();
      for (var q = 1; q < qData.length; q++) {
        var qr = qData[q];
        if (!qr[0]) continue;
        var qsid = qr[1].toString();
        if (!stuScores[qsid]) stuScores[qsid] = { total: 0, count: 0, passed: 0 };
        stuScores[qsid].total += parseFloat(qr[3]) || 0;
        stuScores[qsid].count++;
        if (qr[4] === true || qr[4] === 'TRUE' || qr[4] === 1) stuScores[qsid].passed++;
      }
    }

    // Tasks
    var taskSh = getSheet(ACAD_TASKS);
    var taskStats = { submitted: 0, approved: 0, rejected: 0, pending: 0 };
    var stuTasks = {};
    if (taskSh) {
      var tData = taskSh.getDataRange().getValues();
      for (var t = 1; t < tData.length; t++) {
        var tr = tData[t];
        if (!tr[0]) continue;
        var tsid = tr[1].toString();
        taskStats.submitted++;
        stuTasks[tsid] = (stuTasks[tsid] || 0) + 1;
        var st = (tr[9] || '').toString().toLowerCase();
        if (st === 'approved') taskStats.approved++;
        else if (st === 'rejected') taskStats.rejected++;
        else taskStats.pending++;
      }
    }

    // Students + phones
    var stuSh = getSheet(ACAD_STUDENTS);
    var stuNames = {}, stuPhones = {};
    if (stuSh) {
      var stuData = stuSh.getDataRange().getValues();
      for (var s = 1; s < stuData.length; s++) {
        var sid0 = (stuData[s][0] || '').toString();
        if (sid0) { stuNames[sid0] = (stuData[s][1] || '').toString(); stuPhones[sid0] = (stuData[s][4] || '').toString(); }
      }
    }

    // Enrollments
    var enrSh = getSheet(ACAD_ENROLL);
    var stuRounds = {}, allRoundsMap = {};
    if (enrSh) {
      var enrData = enrSh.getDataRange().getValues();
      for (var e = 1; e < enrData.length; e++) {
        var er = enrData[e];
        var esid = (er[1] || '').toString(); if (!esid) continue;
        var rId = (er[2] || '').toString(), rName = (er[3] || '').toString() || rId;
        if (rId) {
          if (!stuRounds[esid]) stuRounds[esid] = [];
          stuRounds[esid].push({ id: rId, name: rName });
          allRoundsMap[rId] = rName;
        }
      }
    }
    var allRounds = Object.keys(allRoundsMap).map(function(rId){ return { id: rId, name: allRoundsMap[rId] }; });

    var students = Object.keys(stuNames).map(function(sid) {
      var watched = stuProgress[sid] ? Object.keys(stuProgress[sid]).length : 0;
      var sc = stuScores[sid];
      return {
        id: sid, name: stuNames[sid] || sid, phone: stuPhones[sid] || '',
        rounds: stuRounds[sid] || [],
        watchedCount: watched, totalLectures: lecIds.length,
        pct: lecIds.length > 0 ? Math.round(watched / lecIds.length * 100) : 0,
        avgScore: sc && sc.count ? Math.round(sc.total / sc.count) : null,
        quizPassed: sc ? sc.passed : 0, quizTotal: sc ? sc.count : 0,
        taskCount: stuTasks[sid] || 0
      };
    });
    students.sort(function(a, b){ return b.pct - a.pct; });
    var avgCompletion = students.length ? Math.round(students.reduce(function(s,st){ return s+st.pct; },0)/students.length) : 0;

    return {
      success: true, instructorName: 'BSA Team',
      totalLectures: lecIds.length, totalStudents: students.length,
      avgCompletion: avgCompletion, taskStats: taskStats,
      students: students, allRounds: allRounds
    };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getInstructorLectureComments(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, comments: [] };

    // Find instructor's lecture IDs
    var insSh = getSheet(ACAD_INSTRUCTORS);
    var insName = '', insUsername = '';
    if (insSh) {
      var insData = insSh.getDataRange().getValues();
      for (var ii = 1; ii < insData.length; ii++) {
        if (insData[ii][0].toString() === sess.id) {
          insName = insData[ii][1].toString().trim();
          insUsername = insData[ii][2].toString().trim();
          break;
        }
      }
    }
    var conSh = getSheet(ACAD_CONTENT);
    var lecIdSet = {}, lecNames = {};
    if (conSh && insName) {
      var conData = conSh.getDataRange().getValues();
      var _iNL3 = insName.toLowerCase(), _iUL3 = insUsername.toLowerCase(), _iIdL3 = (sess.id||'').toString().toLowerCase();
      for (var c = 1; c < conData.length; c++) {
        var row = conData[c];
        if (!row[0] || row[7]) continue;
        var tag = (row[11] || '').toString().trim().toLowerCase();
        if (tag === _iNL3 || tag === _iUL3 || tag === _iIdL3) {
          lecIdSet[row[0].toString()] = true;
          lecNames[row[0].toString()] = (row[4] || row[3] || '').toString();
        }
      }
    }

    // Get comments on those lectures
    var cmtSh = getSheet(ACAD_COMMENTS);
    if (!cmtSh) return { success: true, comments: [] };
    var data = cmtSh.getDataRange().getValues();
    var picMap = _buildPicMap();
    var comments = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[0] || r[9]) continue;
      var lid = r[1].toString();
      if (!lecIdSet[lid]) continue;
      var aid = r[2].toString();
      comments.push({
        id: r[0].toString(), lectureId: lid,
        lectureName: lecNames[lid] || lid,
        authorId: aid, authorType: r[3].toString(), authorName: r[4].toString(),
        content: r[5].toString(), parentId: (r[6]||"").toString(),
        likes: parseInt(r[7])||0, createdAt: r[8] ? r[8].toString() : "",
        isMe: aid === sess.id, pic: picMap[aid] || ''
      });
    }
    comments.sort(function(a,b){ return b.createdAt.localeCompare(a.createdAt); });
    // Enrich with per-reaction counts
    var cids = comments.map(function(c){ return c.id; });
    var crdata = _getReactionsForItems('comment', cids, sess.id);
    comments.forEach(function(c){
      c.reactionCounts = crdata.countsMap[c.id] || {};
      c.myReaction     = crdata.myMap[c.id]     || '';
    });
    return { success: true, comments: comments };
  } catch(e) { return { success: false, comments: [] }; }
}

// ═══════════════════════════════════════════════════
// ═══  COMMUNITY (Global chat for all)  ═══
// ═══════════════════════════════════════════════════
function getCommunityFeed(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    var sh = getSheet(ACAD_COMMUNITY); if (!sh) return { success: true, posts: [] };
    var data = sh.getDataRange().getValues();
    var picMap = _buildPicMap();
    var posts = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[0] || r[8]) continue; // skip deleted
      var aid = r[1].toString();
      posts.push({
        id: r[0].toString(), authorId: aid, authorType: r[2].toString(),
        authorName: r[3].toString(), content: r[4].toString(),
        parentId: (r[5]||"").toString(), likes: parseInt(r[6])||0,
        createdAt: r[7] ? r[7].toString() : "", isMe: aid === sess.id,
        pic: picMap[aid] || ''
      });
    }
    posts.sort(function(a,b){ return b.createdAt.localeCompare(a.createdAt); });

    // Enrich with per-reaction counts
    var pids = posts.map(function(p){ return p.id; });
    var rdata = _getReactionsForItems('post', pids, sess.id);
    posts.forEach(function(p){
      p.reactionCounts = rdata.countsMap[p.id] || {};
      p.myReaction = rdata.myMap[p.id] || '';
    });

    return { success: true, posts: posts };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function postCommunityMessage(token, content, parentId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    content = (content||"").toString().trim();
    if (!content) return { success: false, message: "الرسالة فارغة" };
    var info = _getSessionUserInfo(sess);
    var sh = getSheet(ACAD_COMMUNITY);
    if (!sh) { initAcademySheets(); sh = getSheet(ACAD_COMMUNITY); }
    var id = "COM_" + new Date().getTime();
    sh.appendRow([id, sess.id, info.authorType, info.name, content, parentId||"", 0, new Date(), false]);

    // Notify if reply
    if (parentId) _notifyCommunityReply(sess.id, info.authorType, info.name, parentId, id);

    // Notify @mentioned instructors/BSA
    _notifyMentions(sess.id, info.name, info.authorType, content, id, 'community');

    return { success: true, id: id,
             post: { id: id, authorId: sess.id, authorType: info.authorType,
                     authorName: info.name, content: content, parentId: parentId||"",
                     likes: 0, isMe: true, createdAt: new Date().toString() } };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// Delete a community post — author or any instructor/BSA can delete
function deleteCommunityPost(token, postId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    var sh = getSheet(ACAD_COMMUNITY); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === postId.toString()) {
        // Owner or any instructor (including BSA) can delete
        if (data[i][1].toString() !== sess.id && sess.role !== 'instructor') {
          return { success: false, message: "مش مسموح" };
        }
        sh.getRange(i+1, 9).setValue(true); // col 9 = deleted flag
        return { success: true };
      }
    }
    return { success: false, message: "المنشور مش موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function likeCommunityPost(token, postId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    var sh = getSheet(ACAD_COMMUNITY); if (!sh) return { success: false };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === postId.toString()) {
        var nl = (parseInt(data[i][6])||0) + 1;
        sh.getRange(i+1, 7).setValue(nl);
        return { success: true, likes: nl };
      }
    }
    return { success: false };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// Detect @mentions in content, notify matching instructors/BSA
function _notifyMentions(senderId, senderName, senderType, content, refId, context) {
  try {
    var tokens = content.match(/@[\S]+/g);
    if (!tokens || !tokens.length) return;
    var insSh = getSheet(ACAD_INSTRUCTORS);
    if (!insSh) return;
    var insData = insSh.getDataRange().getValues();
    var nSh = getSheet(ACAD_NOTIFS); if (!nSh) return;
    var notified = {};
    tokens.forEach(function(tok) {
      var query = tok.slice(1).replace(/_/g, ' ').trim().toLowerCase();
      for (var i = 1; i < insData.length; i++) {
        var row = insData[i];
        var insId = (row[0] || '').toString();
        if (!insId || insId === senderId || notified[insId]) continue;
        var nameMatch = (row[1] || '').toString().trim().toLowerCase();
        var userMatch = (row[2] || '').toString().trim().toLowerCase();
        if (nameMatch === query || userMatch === query ||
            nameMatch.indexOf(query) === 0 || userMatch.indexOf(query) === 0) {
          var isBSA = row[7] === true || row[7] === 'TRUE' || row[7] === 1;
          var msg = senderName + ' ذكرك في ' + (context === 'community' ? 'مجتمع BSA' : 'تعليقات المحاضرة');
          nSh.appendRow(["NTF_"+new Date().getTime()+"_mn"+i, insId, isBSA?'bsa':'instructor',
                          'mention', msg, refId, false, new Date()]);
          notified[insId] = true;
        }
      }
    });
  } catch(e) {}
}

// Notify lecture-owning instructor when any student comments on their lecture
function _notifyInstructorOnComment(commenterId, commenterName, lectureId, commentId) {
  try {
    var conSh = getSheet(ACAD_CONTENT); if (!conSh) return;
    var conData = conSh.getDataRange().getValues();
    var insTag = '';
    for (var c = 1; c < conData.length; c++) {
      if (conData[c][0] && conData[c][0].toString() === lectureId.toString()) {
        insTag = (conData[c][11] || '').toString().trim(); break;
      }
    }
    if (!insTag) return;
    var insSh = getSheet(ACAD_INSTRUCTORS); if (!insSh) return;
    var insData = insSh.getDataRange().getValues();
    for (var i = 1; i < insData.length; i++) {
      var insId = (insData[i][0] || '').toString();
      if (!insId || insId === commenterId) continue;
      var insName = (insData[i][1] || '').toString().trim();
      var insUser = (insData[i][2] || '').toString().trim();
      if (insTag === insName || insTag === insUser || insTag === insId) {
        var nSh = getSheet(ACAD_NOTIFS); if (!nSh) return;
        var msg = commenterName + ' علّق على إحدى محاضراتك';
        nSh.appendRow(["NTF_"+new Date().getTime()+"_lc", insId, 'instructor',
                        'lecture_comment', msg, lectureId, false, new Date()]);
        break;
      }
    }
  } catch(e) {}
}

// Lightweight poll — returns only posts newer than lastTs (no reactions, fast)
function checkCommunityNew(token, lastTs) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, newPosts: [] };
    var sh = getSheet(ACAD_COMMUNITY); if (!sh) return { success: true, newPosts: [] };
    var data = sh.getDataRange().getValues();
    var picMap = _buildPicMap();
    var lastMs = lastTs ? new Date(lastTs).getTime() : 0;
    var newPosts = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[0] || r[8]) continue;
      var ts = r[7] ? new Date(r[7]).getTime() : 0;
      if (lastMs && ts <= lastMs) continue;
      var aid = r[1].toString();
      newPosts.push({
        id: r[0].toString(), authorId: aid, authorType: r[2].toString(),
        authorName: r[3].toString(), content: r[4].toString(),
        parentId: (r[5]||'').toString(), likes: 0,
        createdAt: r[7] ? r[7].toString() : '', isMe: aid === sess.id,
        pic: picMap[aid] || '', reactionCounts: {}, myReaction: ''
      });
    }
    newPosts.sort(function(a,b){ return b.createdAt.localeCompare(a.createdAt); });
    return { success: true, newPosts: newPosts };
  } catch(e) { return { success: false, newPosts: [] }; }
}

function _notifyCommunityReply(replierId, replierType, replierName, parentId, newPostId) {
  try {
    var sh = getSheet(ACAD_COMMUNITY); if (!sh) return;
    var data = sh.getDataRange().getValues();
    var recipientId = "", recipientType = "";
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === parentId.toString()) {
        recipientId = data[i][1].toString(); recipientType = data[i][2].toString(); break;
      }
    }
    if (!recipientId || recipientId === replierId) return;
    var nSh = getSheet(ACAD_NOTIFS); if (!nSh) return;
    var msg = replierType === 'instructor'
      ? '👨‍🏫 المحاضر ' + replierName + ' ردّ عليك في المجتمع'
      : replierName + ' ردّ عليك في مجتمع BSA';
    nSh.appendRow(["NTF_"+new Date().getTime(), recipientId, recipientType, 'community_reply', msg, newPostId, false, new Date()]);
  } catch(e) {}
}

// ═══════════════════════════════════════════════════
// ═══  NOTIFICATIONS  ═══
// ═══════════════════════════════════════════════════
function getMyNotifications(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, notifications: [] };
    var sh = getSheet(ACAD_NOTIFS); if (!sh) return { success: true, notifications: [], unread: 0 };
    var data = sh.getDataRange().getValues();
    var notifs = []; var unread = 0;
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[0] || r[1].toString() !== sess.id) continue;
      var isRead = !!r[6];
      if (!isRead) unread++;
      notifs.push({ id: r[0].toString(), type: r[3].toString(), message: r[4].toString(),
                    refId: r[5].toString(), isRead: isRead, createdAt: r[7] ? r[7].toString() : "" });
    }
    notifs.sort(function(a,b){ return b.createdAt.localeCompare(a.createdAt); });
    return { success: true, notifications: notifs.slice(0,30), unread: unread };
  } catch(e) { return { success: false, notifications: [], unread: 0 }; }
}

function markAllNotifsRead(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false };
    var sh = getSheet(ACAD_NOTIFS); if (!sh) return { success: true };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1].toString() === sess.id && !data[i][6]) {
        sh.getRange(i+1, 7).setValue(true);
      }
    }
    return { success: true };
  } catch(e) { return { success: false }; }
}

function markNotifRead(token, notifId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false };
    var sh = getSheet(ACAD_NOTIFS); if (!sh) return { success: true };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === notifId && data[i][1].toString() === sess.id) {
        sh.getRange(i+1, 7).setValue(true);
        return { success: true };
      }
    }
    return { success: true };
  } catch(e) { return { success: false }; }
}

function getNotifTarget(token, notifType, refId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, target: 'rounds' };

    if (notifType === 'community_reply') {
      return { success: true, target: 'community' };
    }

    // Helper: build roundId for openRound — instructor groups use "INS:" prefix
    var buildRoundTarget = function(conRow, lecId) {
      var insTag = conRow[11] ? conRow[11].toString().trim() : '';
      var roundId   = insTag ? ('INS:' + insTag) : conRow[1].toString();
      var roundName = insTag ? insTag : conRow[2].toString();
      return { success: true, target: 'lecture', roundId: roundId, roundName: roundName, lectureId: lecId };
    };

    if (notifType === 'comment_reply') {
      var conSh = getSheet(ACAD_CONTENT);
      if (!conSh) return { success: true, target: 'rounds' };
      var conData = conSh.getDataRange().getValues();
      for (var i = 1; i < conData.length; i++) {
        if (conData[i][0].toString() === refId.toString()) {
          return buildRoundTarget(conData[i], refId.toString());
        }
      }
      return { success: true, target: 'rounds' };
    }

    if (notifType === 'task_approved' || notifType === 'task_rejected') {
      var taskSh = getSheet(ACAD_TASKS);
      if (!taskSh) return { success: true, target: 'rounds' };
      var taskData = taskSh.getDataRange().getValues();
      for (var t = 1; t < taskData.length; t++) {
        if (taskData[t][0].toString() === refId.toString()) {
          var lecId = taskData[t][4].toString();
          var conSh2 = getSheet(ACAD_CONTENT);
          if (!conSh2) return { success: true, target: 'rounds' };
          var conData2 = conSh2.getDataRange().getValues();
          for (var c = 1; c < conData2.length; c++) {
            if (conData2[c][0].toString() === lecId) {
              return buildRoundTarget(conData2[c], lecId);
            }
          }
          return { success: true, target: 'rounds' };
        }
      }
      return { success: true, target: 'rounds' };
    }

    return { success: true, target: 'rounds' };
  } catch(e) { return { success: true, target: 'rounds' }; }
}

// ═══════════════════════════════════════════════════
// ═══  syncStudentPhones — تحديث أرقام الطلاب بـ OC Code  ═══
// ═══════════════════════════════════════════════════
// Loops through Academy_Students, finds rows with OC code but no phone,
// looks up phone from Raw_Data by OC code, writes it back.
// Returns { success, updated, skipped, notFound }
function syncStudentPhones() {
  try {
    var stuSh  = getSheet(ACAD_STUDENTS);
    var rawSh  = getSheet("Raw_Data");
    if (!stuSh) return { success: false, message: "شيت الطلاب مش موجود" };

    // Build OC→Phone map from Raw_Data (col 14=OC_Code index, col 3=Phone index)
    var phoneByOC = {};
    if (rawSh) {
      var rawData = rawSh.getDataRange().getValues();
      for (var r = 1; r < rawData.length; r++) {
        var oc  = (rawData[r][14] || "").toString().trim();
        var ph  = (rawData[r][3]  || "").toString().trim();
        if (oc && ph) phoneByOC[oc.toLowerCase()] = ph;
      }
    }

    var stuData = stuSh.getDataRange().getValues();
    var updated = 0, skipped = 0, notFound = 0;

    for (var i = 1; i < stuData.length; i++) {
      var row   = stuData[i];
      if (!row[0]) continue;                         // empty row
      var phone = (row[4] || "").toString().trim();  // col 5 = Phone (index 4)
      var oc    = (row[10]|| "").toString().trim();  // col 11 = OC_Code (index 10)

      if (phone) { skipped++; continue; }            // already has phone
      if (!oc)   { notFound++; continue; }           // no OC to look up

      var found = phoneByOC[oc.toLowerCase()];
      if (found) {
        stuSh.getRange(i + 1, 5).setValue(found);    // write to col 5 (Phone)
        updated++;
      } else {
        notFound++;
      }
    }

    return { success: true, updated: updated, skipped: skipped, notFound: notFound };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// ═══════════════════════════════════════════════════
// ═══  getMyInstructorSalaryCards — salary data for instructor portal  ═══
// ═══════════════════════════════════════════════════
function getMyInstructorSalaryCards(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    if (sess.role !== 'instructor') return { success: false, message: "هذه الصفحة للمحاضرين فقط" };

    // Resolve instructor display name from ACAD_INSTRUCTORS
    var insName = '';
    var sh = getSheet(ACAD_INSTRUCTORS);
    if (sh) {
      var d = sh.getDataRange().getValues();
      for (var i = 1; i < d.length; i++) {
        if (d[i][0].toString() === sess.id) { insName = (d[i][1]||'').toString().trim(); break; }
      }
    }
    if (!insName) return { success: false, message: "لم يتم العثور على بيانات المحاضر" };

    // Normalise for matching (strip spaces, dots, slashes, lowercase)
    function norm(s) { return (s||'').toLowerCase().replace(/[\s\.\/\\]+/g,''); }
    var myNorm = norm(insName);

    // Build round startDate lookup map
    var tz = Session.getScriptTimeZone();
    var roundStartDates = {};
    try {
      var rdSh = getSheet("Rounds");
      if (rdSh) {
        var rdData = rdSh.getDataRange().getValues();
        for (var j = 1; j < rdData.length; j++) {
          if (rdData[j][0]) {
            roundStartDates[rdData[j][0].toString()] =
              rdData[j][2] ? safeFormatDate(rdData[j][2], tz, "yyyy-MM-dd") : "";
          }
        }
      }
    } catch(re) {}

    // Filter Lecturer_Salaries to this instructor's cards
    var allCards = getLecturerSalaries();
    var myCards  = allCards.filter(function(c) { return norm(c.instructor) === myNorm; });

    // Enrich each card with round start date
    myCards = myCards.map(function(c) {
      c.roundStartDate = roundStartDates[c.roundId] || '';
      return c;
    });

    // Sort: newest first (by roundStartDate or createdAt)
    myCards.sort(function(a, b) {
      var da = a.roundStartDate || a.createdAt || '';
      var db = b.roundStartDate || b.createdAt || '';
      return db.localeCompare(da);
    });

    // Compute totals
    var totalAmount = 0, totalPaid = 0;
    myCards.forEach(function(c) {
      var p1 = parseFloat((c.pay1Amount||'').replace(/[^0-9.]/g,''))||0;
      var p2 = parseFloat((c.pay2Amount||'').replace(/[^0-9.]/g,''))||0;
      totalAmount += p1 + p2;
      if (c.pay1Status === 'paid') totalPaid += p1;
      if (c.pay2Status === 'paid') totalPaid += p2;
    });

    return {
      success: true,
      instructorName: insName,
      cards: myCards,
      summary: {
        totalRounds:    myCards.length,
        totalAmount:    totalAmount,
        totalPaid:      totalPaid,
        totalRemaining: totalAmount - totalPaid
      }
    };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══  getMyInstructorRounds — round list + lecture progress for instructor portal  ═══
// ═══════════════════════════════════════════════════
function getMyInstructorRounds(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة" };
    if (sess.role !== 'instructor') return { success: false, message: "هذه الصفحة للمحاضرين فقط" };

    // Resolve instructor name
    var insName = '';
    var insSh = getSheet(ACAD_INSTRUCTORS);
    if (insSh) {
      var insD = insSh.getDataRange().getValues();
      for (var ii = 1; ii < insD.length; ii++) {
        if (insD[ii][0].toString() === sess.id) { insName = (insD[ii][1]||'').toString().trim(); break; }
      }
    }
    if (!insName) return { success: false, message: "لم يتم العثور على بيانات المحاضر" };

    function norm(s) { return (s||'').toLowerCase().replace(/[\s\.\/\\]+/g,''); }
    var myNorm = norm(insName);

    var tz = Session.getScriptTimeZone();
    var today = new Date();

    // Build set of round IDs that belong to this instructor
    // Source 1: Lecturer_Salaries (most reliable — covers old rounds without instructor column)
    var myRoundIds = {};
    try {
      var salSh = getOrCreateSalarySheet();
      var salData = salSh.getDataRange().getValues();
      for (var si = 1; si < salData.length; si++) {
        if (!salData[si][0]) continue;
        var salIns = (salData[si][4]||'').toString().trim();
        var salRid = (salData[si][1]||'').toString().trim();
        if (salRid && norm(salIns) === myNorm) myRoundIds[salRid] = true;
      }
    } catch(se) {}

    // Count delivered lectures per round from Rounds_Attendance (max lecture number attended by any student)
    // This reflects actual sessions held, not just portal content uploaded
    var lectCounts = {};
    try {
      var attSh = getSheet("Rounds_Attendance");
      if (attSh) {
        var attData = attSh.getDataRange().getValues();
        for (var ai = 1; ai < attData.length; ai++) {
          var aRid = (attData[ai][0]||'').toString().trim();
          var attended = (attData[ai][3]||'').toString().trim();
          if (!aRid || !attended) continue;
          var nums = attended.split(',').map(function(n) { return parseInt(n.trim(),10); })
                             .filter(function(n) { return !isNaN(n) && n > 0; });
          if (!nums.length) continue;
          var maxLec = Math.max.apply(null, nums);
          if (!lectCounts[aRid] || maxLec > lectCounts[aRid]) lectCounts[aRid] = maxLec;
        }
      }
    } catch(le) {}

    // Read Rounds sheet — include if in myRoundIds OR instructor column matches
    var rdSh = getSheet("Rounds");
    if (!rdSh) return { success: false, message: "لم يتم العثور على شيت الروندات" };
    var rdData = rdSh.getDataRange().getValues();
    var myRounds = [];
    var seenRids = {};

    for (var ri = 1; ri < rdData.length; ri++) {
      if (!rdData[ri][0]) continue;
      if ((rdData[ri][6]||'').toString() === 'Deleted') continue;
      var rid = rdData[ri][0].toString();
      if (seenRids[rid]) continue;

      // Match by: (1) salary card, (2) instructor column, (3) instructor name inside round name
      var rdIns = (rdData[ri][9]||'').toString().trim();
      var rdName = (rdData[ri][1]||'').toString().trim();
      var isMyRound = myRoundIds[rid] || norm(rdIns) === myNorm || norm(rdName).indexOf(myNorm) !== -1;
      if (!isMyRound) continue;
      seenRids[rid] = true;

      var rid = rdData[ri][0].toString();
      var rType = (rdData[ri][8]||'Online').toString();
      var isOffline = rType.toLowerCase().indexOf('offline') !== -1;
      var totalLec = isOffline ? 10 : 12;
      var deliveredLec = lectCounts[rid] || 0;
      var rdStatusRaw = (rdData[ri][6]||'Active').toString().toLowerCase();
      var startDate = rdData[ri][2] ? safeFormatDate(rdData[ri][2], tz, "yyyy-MM-dd") : "";

      // Determine display status
      // finished = all lectures delivered (from content sheet, not CRM status)
      // waiting  = round is in waiting state in CRM OR hasn't started
      // active   = everything else
      var displayStatus;
      if (deliveredLec >= totalLec) {
        displayStatus = 'finished';
      } else if (rdStatusRaw === 'waiting' || rdStatusRaw === 'waiting list') {
        displayStatus = 'waiting';
      } else {
        displayStatus = 'active';
      }

      // Expected payment dates
      var pay1Lec = isOffline ? 5 : 6, pay2Lec = isOffline ? 10 : 12;
      var expectedPay1 = '', expectedPay2 = '';
      if (startDate) {
        try {
          // Parse explicitly to avoid UTC-midnight timezone issues with new Date("yyyy-MM-dd")
          var sparts = startDate.split('-');
          var sy = parseInt(sparts[0],10), sm = parseInt(sparts[1],10)-1, sd_ = parseInt(sparts[2],10);
          var d1 = new Date(sy, sm, sd_ + (pay1Lec - 1) * 7);
          var d2 = new Date(sy, sm, sd_ + (pay2Lec - 1) * 7);
          expectedPay1 = safeFormatDate(d1, tz, "yyyy-MM-dd");
          expectedPay2 = safeFormatDate(d2, tz, "yyyy-MM-dd");
        } catch(de) {}
      }

      myRounds.push({
        id: rid,
        name: (rdData[ri][1]||'').toString(),
        startDate: startDate,
        schedule: (rdData[ri][3]||'').toString(),
        type: rType,
        status: displayStatus,
        enrolled: parseInt(rdData[ri][5])||0,
        totalLectures: totalLec,
        deliveredLectures: deliveredLec,
        pay1Lec: pay1Lec,
        pay2Lec: pay2Lec,
        expectedPay1: expectedPay1,
        expectedPay2: expectedPay2
      });
    }

    // Sort: active first, waiting, finished last; within each group newest first
    var sOrder = { active:0, waiting:1, finished:2 };
    myRounds.sort(function(a,b){
      var sa=sOrder[a.status]!==undefined?sOrder[a.status]:3;
      var sb=sOrder[b.status]!==undefined?sOrder[b.status]:3;
      if(sa!==sb) return sa-sb;
      return (b.startDate||'').localeCompare(a.startDate||'');
    });

    return { success: true, instructorName: insName, rounds: myRounds };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══  getStudentFinancials — payment info for student portal  ═══
// ═══════════════════════════════════════════════════
function getStudentFinancials(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };

    // Get OC code from Academy_Students (col index 10)
    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) return { success: false, message: 'لا توجد بيانات' };
    var stuData = stuSh.getDataRange().getValues();
    var ocCode = '';
    for (var s = 1; s < stuData.length; s++) {
      if (stuData[s][0].toString() === sess.id) { ocCode = (stuData[s][10] || '').toString().trim(); break; }
    }
    if (!ocCode) return { success: true, payments: [], noOc: true };

    // Get payment records from Client_Payments by OC code (col 1)
    var cpSh = getSheet('Client_Payments');
    if (!cpSh) return { success: true, payments: [] };
    var cpData = cpSh.getDataRange().getValues();

    // Normalize OC for flexible matching (strip OC- prefix + leading zeros)
    function _normOcFin(v){ return ocKey(v); } // FIX-07: delegate to canonical ocKey (Academy student financials)
    var normOc = _normOcFin(ocCode);

    var payIds = [];
    var payments = [];
    for (var i = 1; i < cpData.length; i++) {
      var row = cpData[i];
      if (!row[0] || (row[19] === true || row[19] === 'TRUE')) continue; // skip deleted
      var rowOc = (row[1] || '').toString().trim();
      if (rowOc.toLowerCase() !== ocCode.toLowerCase() && _normOcFin(rowOc) !== normOc) continue;
      var payId = row[0].toString();
      payIds.push(payId);
      var total   = parseFloat(row[6]) || 0;
      var paid    = parseFloat(row[9]) || 0;
      var rem     = parseFloat(row[10]) || (total - paid);
      var status  = row[12] ? row[12].toString() : '';
      var nextDue = '';
      if (row[11]) { var _nd = new Date(row[11]); if (!isNaN(_nd.getTime()) && _nd.getFullYear() >= 2015 && _nd.getFullYear() <= 2100) nextDue = Utilities.formatDate(_nd, Session.getScriptTimeZone(), 'dd/MM/yyyy'); }
      var inst1   = parseFloat(row[15]) || 0;
      var inst2   = parseFloat(row[16]) || 0;
      var inst3   = parseFloat(row[17]) || 0;
      // inst1Date/inst2Date/inst3Date parsed from inst detail strings stored in cols 11/12/13
      // payType: cash_full = دفع كل المبلغ دفعة واحدة, installments = أقساط
      var payType = (inst2 > 0 || inst3 > 0) ? 'installments' : (inst1 > 0 && total > 0 && Math.abs(inst1 - total) < 1 ? 'cash_full' : (total > 0 ? 'installments' : 'cash_full'));
      payments.push({
        payId: payId,
        course: (row[3] || '').toString(),
        roundName: (row[5] || '').toString(),
        total: total,
        paid: paid,
        remaining: rem < 0 ? 0 : rem,
        status: status,
        nextDue: nextDue,
        createdAt: row[14] ? Utilities.formatDate(new Date(row[14]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
        inst1: inst1,
        inst2: inst2,
        inst3: inst3,
        payType: payType,
        transactions: []
      });
    }

    // Get payment transactions for these payIds
    var txSh = getSheet('Payment_Transactions');
    if (txSh && payIds.length) {
      var txData = txSh.getDataRange().getValues();
      var pidSet = {};
      payIds.forEach(function(p){ pidSet[p] = true; });
      for (var t = 1; t < txData.length; t++) {
        var txRow = txData[t];
        if (!txRow[0]) continue;
        var txPayId = (txRow[1] || '').toString();
        if (!pidSet[txPayId]) continue;
        var txAmt  = parseFloat(txRow[3]) || 0;
        if (txAmt <= 0) continue;
        var txDate = txRow[4] ? Utilities.formatDate(new Date(txRow[4]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
        var txType = (txRow[5] || '').toString();
        var txMethod = (txRow[8] || 'كاش').toString();
        // Find matching payment and push transaction
        for (var p2 = 0; p2 < payments.length; p2++) {
          if (payments[p2].payId === txPayId) {
            payments[p2].transactions.push({ amount: txAmt, date: txDate, type: txType, method: txMethod });
            break;
          }
        }
      }
    }

    // Sort transactions oldest first (chronological)
    payments.forEach(function(p) {
      p.transactions.sort(function(a,b){ return a.date.localeCompare(b.date); });
      // Derive paymentMethod from first transaction
      p.paymentMethod = p.transactions.length > 0 ? p.transactions[0].method : 'كاش';
    });

    // Collapse the Wait+Round duplicate: if the same course already has a booked (round) record,
    // a leftover round-less "Wait" record is a pre-booking remnant → hide it from the student's
    // account view so the same payment order doesn't appear twice. Display-only; data untouched.
    var _hasRoundCourse = {};
    payments.forEach(function (p) { if ((p.roundName || '').toString().trim()) _hasRoundCourse[(p.course || '').toString().trim().toLowerCase()] = true; });
    payments = payments.filter(function (p) {
      var c = (p.course || '').toString().trim().toLowerCase();
      if (!(p.roundName || '').toString().trim() && _hasRoundCourse[c]) return false;
      return true;
    });

    return { success: true, payments: payments, ocCode: ocCode };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════
// ═══  updateStudentUsername  ═══
// ═══════════════════════════════════════════════════
function updateStudentUsername(token, newUsername) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' };

    newUsername = (newUsername || '').toString().trim().toLowerCase();
    // Enforce @bsa suffix: if not present, add it; if wrong suffix, reject
    if (!/@bsa$/.test(newUsername)) newUsername = newUsername.replace(/@.*$/, '') + '@bsa';
    var prefix = newUsername.replace(/@bsa$/, '');
    if (!prefix || prefix.length < 3) return { success: false, message: 'الجزء قبل @bsa لازم يكون 3 أحرف على الأقل' };
    if (!/^[a-z0-9._-]+$/.test(prefix)) return { success: false, message: 'استخدم حروف إنجليزية وأرقام فقط قبل @bsa' };

    var sh = getSheet(ACAD_STUDENTS);
    if (!sh) return { success: false, message: 'خطأ في الاتصال' };
    var data = sh.getDataRange().getValues();

    // Check uniqueness (col 2 = username)
    for (var s = 1; s < data.length; s++) {
      if (data[s][0].toString() === sess.id) continue;
      if ((data[s][2] || '').toString().trim().toLowerCase() === newUsername) {
        return { success: false, message: 'اسم المستخدم ده موجود بالفعل، جرب اسم تاني' };
      }
    }
    // Update
    for (var u = 1; u < data.length; u++) {
      if (data[u][0].toString() === sess.id) {
        sh.getRange(u + 1, 3).setValue(newUsername); // col C = index 2 = Username
        return { success: true, newUsername: newUsername };
      }
    }
    return { success: false, message: 'لم يتم العثور على حسابك' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════
// ═══  getStudentRounds — unified wrapper  ═══
// ═══════════════════════════════════════════════════
// Called from Academy.html frontend to get list of rounds the student is enrolled in.
// Returns: { success, rounds: [{roundId, roundName, lecturesDone, lecturesTotal}], lecturesDone, avgQuiz }
function getStudentRounds(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "انتهت الجلسة", rounds: [] };

    var studentId = sess.id;
    // Short cache so returning to "محاضراتي" / home is instant (the cold full scan runs only ~once/20s).
    var _grKey = 'stu_rounds_' + sess.id;
    try { var _grc = CacheService.getScriptCache().get(_grKey); if (_grc) return JSON.parse(_grc); } catch (_e) {}
    var conSh  = getSheet(ACAD_CONTENT);
    var proSh  = getSheet(ACAD_PROGRESS);
    var qrSh   = getSheet(ACAD_QUIZ_RESULTS);

    var conData = conSh ? conSh.getDataRange().getValues() : [];
    var proData = proSh ? proSh.getDataRange().getValues() : [];
    var qrData  = qrSh  ? qrSh.getDataRange().getValues()  : [];

    // Build watched set
    var watched = {};
    for (var p = 1; p < proData.length; p++) {
      if (proData[p][1].toString() === studentId) watched[proData[p][2].toString()] = true;
    }
    // Build quiz scores
    var quizScores = [];
    for (var q = 1; q < qrData.length; q++) {
      if (qrData[q][1].toString() === studentId) quizScores.push(parseFloat(qrData[q][3]) || 0);
    }
    var avgQuiz = quizScores.length ? Math.round(quizScores.reduce(function(a,b){return a+b;},0)/quizScores.length) : 0;

    // Determine which instructor tag(s) this viewer may see:
    //  • instructor (not BSA team) → ONLY their own content (tag = their name / username / id)
    //  • student → their assigned instructor tag (if any)
    //  • BSA team / unassigned student → all
    var allowTags = null; // null = see all
    if (sess.role === 'instructor' && !sess.isBSA) {
      var insName3 = '', insUser3 = '';
      var insSh3 = getSheet(ACAD_INSTRUCTORS);
      if (insSh3) {
        var insD3 = insSh3.getDataRange().getValues();
        for (var iii = 1; iii < insD3.length; iii++) {
          if (insD3[iii][0].toString() === sess.id) { insName3 = (insD3[iii][1] || '').toString().trim(); insUser3 = (insD3[iii][2] || '').toString().trim(); break; }
        }
      }
      allowTags = {};
      [insName3, insUser3, sess.id].forEach(function (t) { var k = (t || '').toString().trim().toLowerCase(); if (k) allowTags[k] = true; });
    } else if (sess.role !== 'instructor') {
      var stuInsTag = "";
      var stuSh2 = getSheet(ACAD_STUDENTS);
      if (stuSh2) {
        var stuDataR = stuSh2.getDataRange().getValues();
        for (var si2 = 1; si2 < stuDataR.length; si2++) {
          if (stuDataR[si2][0].toString() === studentId) { stuInsTag = (stuDataR[si2][8] || "").toString().trim(); break; }
        }
      }
      if (stuInsTag) { allowTags = {}; allowTags[stuInsTag.toLowerCase()] = true; }
    }

    // Group lectures by instructor, honoring the allow-list (instructor sees only their own)
    var insGroups = {};  // instructorName → { total, done }
    var insOrder  = [];  // preserve insertion order
    for (var c = 1; c < conData.length; c++) {
      var row = conData[c];
      if (!row[0] || row[7]) continue; // skip empty / admin-locked
      var insTag = (row[11]||"").toString().trim();
      if (!insTag) insTag = "BSA Academy";
      if (allowTags && !allowTags[insTag.toLowerCase()]) continue;
      if (!insGroups[insTag]) { insGroups[insTag] = { total: 0, done: 0 }; insOrder.push(insTag); }
      insGroups[insTag].total++;
      if (watched[row[0].toString()]) insGroups[insTag].done++;
    }

    var rounds = [];
    var totalDone = 0;
    for (var ii = 0; ii < insOrder.length; ii++) {
      var tag = insOrder[ii];
      var grp = insGroups[tag];
      rounds.push({ roundId: "INS:" + tag, roundName: "👨‍🏫 " + tag, lecturesDone: grp.done, lecturesTotal: grp.total });
      totalDone += grp.done;
    }

    var _grRes = { success: true, rounds: rounds, lecturesDone: totalDone, avgQuiz: avgQuiz };
    try { CacheService.getScriptCache().put(_grKey, JSON.stringify(_grRes), 20); } catch (_e) {}
    return _grRes;
  } catch(e) { return { success: false, message: e.toString(), rounds: [] }; }
}

// ═══════════════════════════════════════════════════
// ═══  EXPOSE TO FRONTEND (doGet whitelist)  ═══
// ═══════════════════════════════════════════════════
// All Academy portal functions are already exposed via google.script.run
// No additional registration needed — GAS automatically exposes all top-level functions.

// ═══════════════════════════════════════════════════════════════════════════════
// ═══  FIX UTILITIES  ═══
// ═══════════════════════════════════════════════════════════════════════════════
function fixLecture4Name() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var sh   = ss.getSheetByName("Academy_Content");
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === "CON_1781088256790_3") {
      sh.getRange(i + 1, 5).setValue("إعداد وإطلاق الحملات الإعلانية (Ads Setup)");
      var qsh = ss.getSheetByName("Academy_Quizzes");
      var qd  = qsh.getDataRange().getValues();
      for (var j = 1; j < qd.length; j++) {
        if (qd[j][1].toString() === "CON_1781088256790_3") {
          qsh.getRange(j + 1, 4).setValue("إعداد وإطلاق الحملات الإعلانية (Ads Setup)");
          break;
        }
      }
      SpreadsheetApp.getUi().alert("✅ تم إصلاح اسم المحاضرة 4");
      return;
    }
  }
  SpreadsheetApp.getUi().alert("❌ المحاضرة مش لقياها — تأكد من الـ ID");
}

function verifyQuizNames() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var csh = ss.getSheetByName("Academy_Content");
  var qsh = ss.getSheetByName("Academy_Quizzes");
  var cd  = csh.getDataRange().getValues();
  var qd  = qsh.getDataRange().getValues();
  var nameMap = {};
  for (var i = 1; i < cd.length; i++) nameMap[cd[i][0]] = cd[i][4];
  var fixes = 0;
  for (var j = 1; j < qd.length; j++) {
    var lecId = qd[j][1].toString();
    var correctName = nameMap[lecId] || '';
    if (correctName && qd[j][3] !== correctName) {
      qsh.getRange(j + 1, 4).setValue(correctName);
      fixes++;
    }
  }
  SpreadsheetApp.getUi().alert("✅ تم تصحيح " + fixes + " اسم في الكويزات");
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══  BATCH IMPORT: محاضرات د/ محمد العتر (9 محاضرات)  ═══
// ═══════════════════════════════════════════════════════════════════════════════
function batchImportLectures() {
  var items = [

    // ═══════════════════════════════════════════════
    // المحاضرة 1: أساسيات التسويق وتحليل السوق
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 1,
      lectureName: "أساسيات التسويق وتحليل السوق",
      videoFileId: "1v5c2foex5emuz2OSX6EcLqkYR_89X0ks",
      pdfFileId:   "1j_zYI216voBoH6HVPUqHCB-s2iZaV6fg",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر", notes: "",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 2: استراتيجيات المنتج والمزيج التسويقي
    // ملاحظة: الكويز محتاج يتضاف يدوياً من واجهة الـ CRM
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 2,
      lectureName: "استراتيجيات المنتج والمزيج التسويقي",
      videoFileId: "12nezh10Wsy7TbnOK3WdsQyl6PxC2upYV",
      pdfFileId:   "16NcUUa595w54FZNnfJiGQTIayN-SRofi",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر", notes: "",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 3: صناعة المحتوى التسويقي
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 3,
      lectureName: "صناعة المحتوى التسويقي",
      videoFileId: "125zEppSpzRdv5-6KGoccAh7MMkQ_Sbp9",
      pdfFileId:   "1ajdVPaeD6U0iVD_8fCm68qRfMavktFl3",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر", notes: "",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 4: إعداد وإطلاق الحملات الإعلانية (Ads Setup)
    // فيديو 2: 1irHHETPyDu03_aBUo5LTOTWZ_T5f9Wn8
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 4,
      lectureName: "إعداد وإطلاق الحملات الإعلانية (Ads Setup)",
      videoFileId: "1KEME34KGip9vmNzQf-msWxteGGwLHdhG",
      pdfFileId:   "1K_NMcRKk88e7l5aUa6M_bgTp6K59wPkS",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر",
      notes: "فيديو 2: https://drive.google.com/file/d/1irHHETPyDu03_aBUo5LTOTWZ_T5f9Wn8/view",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 5: تحسين ومقاييس الحملات الإعلانية
    // ملاحظة: السؤال 15 ناقص — يُضاف يدوياً
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 5,
      lectureName: "تحسين ومقاييس الحملات الإعلانية",
      videoFileId: "1ciyOf75vcgPMrrWX-NcFSlhA7KoVWWZY",
      pdfFileId:   "1GlK9FIC8vo3-6ocl4zbXM_GL6aONID_z",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر", notes: "",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 6: Lead Generation
    // فيديو 2: 1hZT_KKM_nf76AISCaaCzK19jKFXUy54c
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 6,
      lectureName: "إعداد وإطلاق حملات العملاء المحتملين (Lead Generation)",
      videoFileId: "1JkB5W2r_MYLPuuPpOBfz3DbbpdL6VvGc",
      pdfFileId:   "10-I8wEd36enR-W5SfItPStgfwV9ghPt2",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر",
      notes: "فيديو 2: https://drive.google.com/file/d/1hZT_KKM_nf76AISCaaCzK19jKFXUy54c/view",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 7: إعلانات تيك توك
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 7,
      lectureName: "إعداد الحملات الإعلانية على منصة تيك توك",
      videoFileId: "10q3rPUVufzid6DsVbIkxO6yWqY9j70Uq",
      pdfFileId:   "1CDYLsJI-SRkzasbSJtHd6fCJGPOh2SXv",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر", notes: "",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 8: إعلانات سناب شات
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 8,
      lectureName: "إعداد الحملات الإعلانية على منصة سناب شات",
      videoFileId: "1fQXyLdEoAWY9WO-wArbzdk-ctREEeZhs",
      pdfFileId:   "1DzmOEqU_XMAQxbLTwzuP9A4YTGHJZ0YW",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر", notes: "",
      quiz: null
    },

    // ═══════════════════════════════════════════════
    // المحاضرة 9: إعلانات جوجل + مهارات المبيعات
    // فيديو 2: 178PnFBg8pMkD4xFJ3HxkgUXtuLKkDazI
    // ═══════════════════════════════════════════════
    {
      roundId: "", roundName: "",
      lectureOrder: 9,
      lectureName: "إعلانات جوجل والكلمات البحثية ومهارات المبيعات",
      videoFileId: "1yqT3SjSR-5KAQZBv17Y6u9oWYBY7yoLN",
      pdfFileId:   "1qF7-mkSQuoeCWQQsVAKAoJ-OjCUvYtrK",
      fileType: "video", taskRequired: true,
      instructorTag: "د/ محمد العتر",
      notes: "فيديو 2: https://drive.google.com/file/d/178PnFBg8pMkD4xFJ3HxkgUXtuLKkDazI/view",
      quiz: null
    }

  ]; // end items

  var result = batchImportContent(items);
  Logger.log(JSON.stringify(result));
  SpreadsheetApp.getUi().alert(
    "✅ تم الاستيراد!\n" +
    "محاضرات أضيفت: " + result.addedLectures + "\n" +
    "كويزات أضيفت: " + result.addedQuizzes
  );
  return result;
}

// ═══════════════════════════════════════════════
// CLASS LEADERBOARD & ACTIVITY
// ═══════════════════════════════════════════════

function getClassLeaderboard(token, roundId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, students: [] };
  try {
    var stuSh  = getSheet(ACAD_STUDENTS);
    var proSh  = getSheet(ACAD_PROGRESS);
    var qrSh   = getSheet(ACAD_QUIZ_RESULTS);
    var taskSh = getSheet(ACAD_TASKS);
    if (!stuSh) return { success: true, students: [] };

    var stuData0 = stuSh.getDataRange().getValues();
    var stuIds = [];
    var isInsGroup2 = roundId && roundId.toString().indexOf('INS:') === 0;
    if (isInsGroup2) {
      // Instructor-group: gather students by instructorTag
      var insFilter2 = roundId.toString().substring(4).trim();
      for (var s0 = 1; s0 < stuData0.length; s0++) {
        if (!stuData0[s0][0] || !stuData0[s0][5]) continue;
        var tag0 = (stuData0[s0][8]||'').toString().trim();
        if (tag0 === insFilter2) stuIds.push(stuData0[s0][0].toString());
      }
    } else {
      var enrSh = getSheet(ACAD_ENROLL);
      if (!enrSh) return { success: true, students: [] };
      var enrData = enrSh.getDataRange().getValues();
      for (var i = 1; i < enrData.length; i++) {
        if (enrData[i][2].toString() === roundId.toString() && enrData[i][5].toString() !== 'removed') {
          var sid = enrData[i][1].toString();
          if (stuIds.indexOf(sid) === -1) stuIds.push(sid);
        }
      }
    }
    if (!stuIds.length) return { success: true, students: [] };

    // Build student map
    var stuData = stuSh.getDataRange().getValues();
    var stuMap = {};
    for (var s = 1; s < stuData.length; s++) {
      var id = stuData[s][0].toString();
      if (stuIds.indexOf(id) !== -1) {
        stuMap[id] = { id: id, name: stuData[s][1].toString(), points: 0, watched: 0, quizzes: 0, tasks: 0, isSelf: id === sess.id };
      }
    }

    // +10 per completed lecture
    if (proSh) {
      var proData = proSh.getDataRange().getValues();
      for (var p = 1; p < proData.length; p++) {
        var psid = proData[p][1].toString();
        if (stuMap[psid] && proData[p][4]) { stuMap[psid].points += 10; stuMap[psid].watched++; }
      }
    }

    // +15 per passed quiz
    if (qrSh) {
      var qrData = qrSh.getDataRange().getValues();
      for (var q = 1; q < qrData.length; q++) {
        var qsid = qrData[q][1].toString();
        if (stuMap[qsid] && qrData[q][4]) { stuMap[qsid].points += 15; stuMap[qsid].quizzes++; }
      }
    }

    // +20 per approved task
    if (taskSh) {
      var taskData = taskSh.getDataRange().getValues();
      for (var t = 1; t < taskData.length; t++) {
        var tsid = taskData[t][1].toString();
        if (stuMap[tsid] && taskData[t][9].toString() === 'approved') { stuMap[tsid].points += 20; stuMap[tsid].tasks++; }
      }
    }

    var students = [];
    for (var k in stuMap) students.push(stuMap[k]);
    students.sort(function(a, b) { return b.points - a.points; });
    return { success: true, students: students };
  } catch(e) {
    return { success: true, students: [] };
  }
}

function getClassActivity(token, roundId) {
  var sess = validateAcadSession(token);
  if (!sess) return { success: false, items: [] };
  try {
    var enrSh  = getSheet(ACAD_ENROLL);
    var stuSh  = getSheet(ACAD_STUDENTS);
    var proSh  = getSheet(ACAD_PROGRESS);
    var qrSh   = getSheet(ACAD_QUIZ_RESULTS);
    var taskSh = getSheet(ACAD_TASKS);
    var conSh  = getSheet(ACAD_CONTENT);
    if (!stuSh) return { success: true, items: [] };

    var stuData0 = stuSh.getDataRange().getValues();
    var stuIds = [];
    var isInsGroup = roundId && roundId.toString().indexOf('INS:') === 0;

    if (isInsGroup) {
      // Instructor-group: collect students whose instructorTag matches
      var insFilter = roundId.toString().substring(4).trim(); // strip "INS:" prefix
      for (var s0 = 1; s0 < stuData0.length; s0++) {
        if (!stuData0[s0][0]) continue;
        var tag0 = (stuData0[s0][8]||'').toString().trim();
        if (tag0.toLowerCase() === insFilter.toLowerCase() && stuData0[s0][5]) { // col 8=instructorTag, col 5=active (case-insensitive)
          stuIds.push(stuData0[s0][0].toString());
        }
      }
    } else {
      // Normal round: filter by enrollment
      if (!enrSh) return { success: true, items: [] };
      var enrData = enrSh.getDataRange().getValues();
      for (var i = 1; i < enrData.length; i++) {
        if (enrData[i][2].toString() === roundId.toString() && enrData[i][5].toString() !== 'removed') {
          var sid = enrData[i][1].toString();
          if (stuIds.indexOf(sid) === -1) stuIds.push(sid);
        }
      }
    }
    if (!stuIds.length) return { success: true, items: [] };

    // Student names (reuse already-loaded stuData0)
    var stuNames = {};
    for (var s = 1; s < stuData0.length; s++) stuNames[stuData0[s][0].toString()] = stuData0[s][1].toString();

    // Lecture names
    var lecNames = {};
    if (conSh) {
      var conData = conSh.getDataRange().getValues();
      for (var c = 1; c < conData.length; c++) lecNames[conData[c][0].toString()] = conData[c][4].toString();
    }

    var items = [];

    // Watched lectures (+10 pts each)
    if (proSh) {
      var proData = proSh.getDataRange().getValues();
      for (var p = 1; p < proData.length; p++) {
        var psid = proData[p][1].toString();
        if (stuIds.indexOf(psid) === -1 || !proData[p][4]) continue;
        var d = proData[p][3] ? new Date(proData[p][3]) : null;
        if (!d || isNaN(d.getTime())) continue;
        items.push({ icon: '📺', name: stuNames[psid] || psid, isSelf: psid === sess.id, text: 'شاهد "' + (lecNames[proData[p][2].toString()] || proData[p][2].toString()) + '"', pts: '+10', date: d.getTime() });
      }
    }

    // Passed quizzes (+15 pts each)
    if (qrSh) {
      var qrData = qrSh.getDataRange().getValues();
      for (var q = 1; q < qrData.length; q++) {
        var qsid = qrData[q][1].toString();
        if (stuIds.indexOf(qsid) === -1 || !qrData[q][4]) continue;
        var qd = qrData[q][5] ? new Date(qrData[q][5]) : null;
        if (!qd || isNaN(qd.getTime())) continue;
        items.push({ icon: '🏆', name: stuNames[qsid] || qsid, isSelf: qsid === sess.id, text: 'اجتاز كويز "' + (lecNames[qrData[q][2].toString()] || qrData[q][2].toString()) + '" (' + Math.round(Number(qrData[q][3])) + '%)', pts: '+15', date: qd.getTime() });
      }
    }

    // Approved tasks (+20 pts each)
    if (taskSh) {
      var taskData = taskSh.getDataRange().getValues();
      for (var t = 1; t < taskData.length; t++) {
        var tsid = taskData[t][1].toString();
        if (stuIds.indexOf(tsid) === -1 || taskData[t][9].toString() !== 'approved') continue;
        var td = taskData[t][10] ? new Date(taskData[t][10]) : (taskData[t][8] ? new Date(taskData[t][8]) : null);
        if (!td || isNaN(td.getTime())) continue;
        items.push({ icon: '✅', name: stuNames[tsid] || tsid, isSelf: tsid === sess.id, text: 'اتقبل تاسك "' + (lecNames[taskData[t][4].toString()] || taskData[t][5].toString()) + '"', pts: '+20', date: td.getTime() });
      }
    }

    items.sort(function(a, b) { return b.date - a.date; });
    return { success: true, items: items.slice(0, 30) };
  } catch(e) {
    return { success: true, items: [] };
  }
}

// =============================================
// ---- FINAL PROJECT ----
// =============================================
var ACAD_FINAL_PROJECTS = "Academy_Final_Projects";
// Schema: [0:ID, 1:StudentID, 2:StudentName, 3:RoundID, 4:DriveFileID, 5:FileName,
//          6:SubmittedAt, 7:Status(pending/approved/rejected), 8:ReviewNotes,
//          9:ReviewedBy, 10:ReviewedAt, 11:OutlineFileID, 12:OutlineFileName]

function _ensureFinalProjectSheet() {
  var sh = getSheet(ACAD_FINAL_PROJECTS);
  if (!sh) {
    getMaster().insertSheet(ACAD_FINAL_PROJECTS);
    sh = getSheet(ACAD_FINAL_PROJECTS);
    sh.appendRow(["ID","StudentID","StudentName","RoundID","DriveFileID","FileName","SubmittedAt","Status","ReviewNotes","ReviewedBy","ReviewedAt","OutlineFileID","OutlineFileName"]);
    sh.getRange(1,1,1,13).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
  }
  return sh;
}

function getStudentFinalProject(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "جلسة منتهية" };

    // Count completed lectures to check unlock condition (lecture 7+)
    var progSh = getSheet(ACAD_PROGRESS);
    var watchedCount = 0;
    if (progSh) {
      var pd = progSh.getDataRange().getValues();
      for (var i = 1; i < pd.length; i++) {
        if (pd[i][1].toString() === sess.id && pd[i][4]) watchedCount++;
      }
    }

    var unlocked = watchedCount >= 7;

    // Get outline (uploaded by admin)
    var sh = _ensureFinalProjectSheet();
    var data = sh.getDataRange().getValues();
    var outlineFileId = '', outlineFileName = '';
    var myProject = null;

    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      // Row with no studentID = admin outline row
      if (!row[1] && row[11]) {
        outlineFileId = (row[11]||'').toString();
        outlineFileName = (row[12]||'').toString();
      }
      if (row[1].toString() === sess.id && row[4]) {
        myProject = {
          id: row[0].toString(),
          fileId: row[4].toString(),
          fileName: row[5].toString(),
          submittedAt: row[6] ? Utilities.formatDate(new Date(row[6]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : "",
          status: (row[7]||'pending').toString(),
          reviewNotes: (row[8]||'').toString(),
          reviewedBy: (row[9]||'').toString(),
          reviewedAt: row[10] ? Utilities.formatDate(new Date(row[10]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : ""
        };
      }
    }

    return {
      success: true,
      unlocked: unlocked,
      watchedCount: watchedCount,
      outlineFileId: outlineFileId,
      outlineFileName: outlineFileName,
      project: myProject
    };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function _fpCheckUnlock(sessId) {
  var progSh = getSheet(ACAD_PROGRESS); var c = 0;
  if (progSh) { var pd = progSh.getDataRange().getValues(); for (var i = 1; i < pd.length; i++) if (pd[i][1].toString() === sessId && pd[i][4]) c++; }
  return c;
}

function _fpSaveToSheet(sessId, sessName, fileId, fileName) {
  var sh = _ensureFinalProjectSheet();
  var data = sh.getDataRange().getValues();
  var existingRow = -1;
  for (var r = 1; r < data.length; r++) { if (data[r][1].toString() === sessId) { existingRow = r + 1; break; } }
  var now = new Date(); var projId = "FP_" + sessId + "_" + now.getTime();
  if (existingRow > 0) sh.getRange(existingRow, 1, 1, 11).setValues([[projId, sessId, sessName, '', fileId, fileName, now, 'pending', '', '', '']]);
  else sh.appendRow([projId, sessId, sessName, '', fileId, fileName, now, 'pending', '', '', '']);
  SpreadsheetApp.flush();
}

// Chunk-based upload for large files (up to 100MB)
// Each chunk is a piece of the base64 string, stored as a Drive temp file
function submitFinalProjectChunk(token, chunkB64, chunkIndex, totalChunks, fileName, mimeType) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'student') return { success: false, message: "غير مصرح" };
    if (_fpCheckUnlock(sess.id) < 7) return { success: false, message: "يجب إتمام 7 محاضرات أولاً" };

    // Temp folder name per student
    var tempName = 'BSA_FP_TEMP_' + sess.id;
    var root = DriveApp.getRootFolder();
    var tf = root.getFoldersByName(tempName);
    var tempFolder = tf.hasNext() ? tf.next() : root.createFolder(tempName);

    // Save this chunk (overwrite if exists)
    var cName = 'chunk_' + chunkIndex;
    var ex = tempFolder.getFilesByName(cName);
    while (ex.hasNext()) ex.next().setTrashed(true);
    tempFolder.createFile(Utilities.newBlob(chunkB64 || '', 'text/plain', cName));

    if (chunkIndex < totalChunks - 1) {
      return { success: true, message: 'جزء ' + (chunkIndex + 1) + ' من ' + totalChunks };
    }

    // Last chunk: assemble all
    var allB64 = '';
    for (var i = 0; i < totalChunks; i++) {
      var cf = tempFolder.getFilesByName('chunk_' + i);
      if (!cf.hasNext()) return { success: false, message: 'خطأ: جزء ' + i + ' مفقود — أعد الرفع' };
      allB64 += cf.next().getBlob().getDataAsString();
    }

    // Upload final file
    var ext = (fileName||'').split('.').pop().toLowerCase();
    var mimes = {pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',zip:'application/zip',rar:'application/x-rar-compressed',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',mp4:'video/mp4'};
    var fileMime = mimeType && mimeType !== 'application/octet-stream' ? mimeType : (mimes[ext] || 'application/octet-stream');
    var fpFolder = root.getFoldersByName('BSA_FinalProjects').hasNext() ? root.getFoldersByName('BSA_FinalProjects').next() : root.createFolder('BSA_FinalProjects');
    var blob = Utilities.newBlob(Utilities.base64Decode(allB64), fileMime, fileName);
    var file = fpFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = file.getId();

    // Clean up temp folder
    try { tempFolder.setTrashed(true); } catch(e2) {}

    _fpSaveToSheet(sess.id, sess.name, fileId, fileName);
    return { success: true, message: '✅ تم رفع المشروع بنجاح — في انتظار المراجعة' };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function submitFinalProject(token, base64Data, fileName, mimeType, driveFileId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || sess.role !== 'student') return { success: false, message: "غير مصرح" };
    if (_fpCheckUnlock(sess.id) < 7) return { success: false, message: "يجب إتمام 7 محاضرات على الأقل أولاً" };

    var fileId = '';

    if (mimeType === 'link') {
      // Drive link submission — use provided fileId or extract from fileName
      fileId = driveFileId || '';
      if (!fileId && fileName) { var m = fileName.match(/\/d\/([a-zA-Z0-9_-]+)/); if (m) fileId = m[1]; }
      if (!fileId) return { success: false, message: 'رابط Drive غير صحيح' };
      fileName = 'رابط_Drive_' + fileId;
    } else {
      // File upload
      var stuSh = getSheet("Academy_Students");
      var stuData = stuSh ? stuSh.getDataRange().getValues() : [];
      var folderId = '';
      for (var s = 1; s < stuData.length; s++) {
        if (stuData[s][0].toString() === sess.id) { folderId = (stuData[s][6]||'').toString(); break; }
      }
      if (!folderId) {
        var newFolder = DriveApp.createFolder("BSA_FinalProject_" + sess.id);
        folderId = newFolder.getId();
      }
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType || 'application/octet-stream', fileName);
      var driveFolder = DriveApp.getFolderById(folderId);
      var driveFile = driveFolder.createFile(blob);
      fileId = driveFile.getId();
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    _fpSaveToSheet(sess.id, sess.name, fileId, fileName);
    return { success: true, message: "✅ تم رفع المشروع بنجاح — في انتظار المراجعة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function uploadProjectOutline(token, base64Data, fileName, mimeType) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح — للإدارة فقط" };

    var folder = DriveApp.getRootFolder();
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType || 'application/pdf', fileName);
    var driveFile = folder.createFile(blob);
    var fileId = driveFile.getId();
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Store in the special admin outline row (StudentID empty)
    var sh = _ensureFinalProjectSheet();
    var data = sh.getDataRange().getValues();
    var outlineRow = -1;
    for (var r = 1; r < data.length; r++) {
      if (!data[r][1]) { outlineRow = r + 1; break; }
    }
    if (outlineRow > 0) {
      sh.getRange(outlineRow, 12).setValue(fileId);
      sh.getRange(outlineRow, 13).setValue(fileName);
    } else {
      sh.appendRow(["OUTLINE", "", "", "", "", "", "", "", "", "", "", fileId, fileName]);
    }
    SpreadsheetApp.flush();
    return { success: true, fileId: fileId, message: "✅ تم رفع ملف التوجيه بنجاح" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function reviewFinalProject(token, studentId, action, notes) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };

    var sh = _ensureFinalProjectSheet();
    var data = sh.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (data[r][1].toString() === studentId.toString() && data[r][4]) {
        sh.getRange(r+1, 8).setValue(action);
        sh.getRange(r+1, 9).setValue(notes || "");
        sh.getRange(r+1, 10).setValue(sess.name || sess.id);
        sh.getRange(r+1, 11).setValue(new Date());

        // Notify student
        var nSh = getSheet(ACAD_NOTIFS);
        if (nSh) {
          var msg = action === 'approved'
            ? "✅ تم قبول مشروعك النهائي" + (notes ? " — " + notes : "")
            : "❌ تم رفض مشروعك النهائي" + (notes ? " — السبب: " + notes : "");
          nSh.appendRow(["NTF_FP_"+new Date().getTime(), studentId, "student", action==='approved'?'task_approved':'task_rejected', msg, "final_project", false, new Date()]);
        }
        SpreadsheetApp.flush();
        return { success: true, message: action === 'approved' ? "✅ تم قبول المشروع" : "❌ تم رفض المشروع" };
      }
    }
    return { success: false, message: "لم يتم إيجاد مشروع لهذا الطالب" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getAllFinalProjects(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };

    var sh = _ensureFinalProjectSheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var projects = [];
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row[1] || !row[4]) continue; // skip empty / outline row
      projects.push({
        id: row[0].toString(),
        studentId: row[1].toString(),
        studentName: row[2].toString(),
        fileId: row[4].toString(),
        fileName: row[5].toString(),
        submittedAt: row[6] ? Utilities.formatDate(new Date(row[6]), tz, "dd/MM/yyyy HH:mm") : "",
        status: (row[7]||'pending').toString(),
        reviewNotes: (row[8]||'').toString(),
        reviewedBy: (row[9]||'').toString()
      });
    }
    return { success: true, projects: projects };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getApprovedFinalProjects(token) {
  try {
    // Accept student token OR admin/BSA session token
    var stuId = validateAcadToken(token);
    var isAdmin = false;
    if (!stuId) {
      var sess = validateAcadSessionPublic(token);
      if (!sess || !sess.id) return { success: false, message: 'غير مصرح' };
      stuId = null; // admin — no self-exclusion
      isAdmin = true;
    }
    var sh = _ensureFinalProjectSheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var projects = [];
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row[1] || !row[4]) continue;
      if ((row[7] || '').toString() !== 'approved') continue;
      if (!isAdmin && stuId && row[1].toString() === stuId.toString()) continue; // skip own project for students
      projects.push({
        studentName: row[2].toString(),
        fileId: row[4].toString(),
        fileName: row[5].toString(),
        submittedAt: row[6] ? Utilities.formatDate(new Date(row[6]), tz, 'dd/MM/yyyy') : ''
      });
    }
    return { success: true, projects: projects };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// =============================================
// ---- SUPPORT FILES PER LECTURE ----
// =============================================
var ACAD_SUPPORT_FILES = "Academy_Support_Files";
// Schema: [0:ID, 1:InstructorTag, 2:Title, 3:DriveFileID, 4:FileName,
//          5:FileType(pdf/video/link), 6:URL, 7:CreatedAt, 8:CreatedBy]

function _ensureSupportFilesSheet() {
  var sh = getSheet(ACAD_SUPPORT_FILES);
  if (!sh) {
    getMaster().insertSheet(ACAD_SUPPORT_FILES);
    sh = getSheet(ACAD_SUPPORT_FILES);
    sh.appendRow(["ID","InstructorTag","Title","DriveFileID","FileName","FileType","URL","CreatedAt","CreatedBy"]);
    sh.getRange(1,1,1,9).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
  }
  return sh;
}

// يجيب ملفات الدعم الخاصة بمحاضر معين
function getInstructorSupportFiles(token, instructorTag) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "جلسة منتهية" };

    var sh = _ensureSupportFilesSheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var files = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      if ((data[i][1]||'').toString().trim() !== instructorTag.toString().trim()) continue;
      files.push({
        id: data[i][0].toString(),
        title: (data[i][2]||'').toString(),
        fileId: (data[i][3]||'').toString(),
        fileName: (data[i][4]||'').toString(),
        fileType: (data[i][5]||'pdf').toString(),
        url: (data[i][6]||'').toString(),
        createdAt: data[i][7] ? Utilities.formatDate(new Date(data[i][7]), tz, "dd/MM/yyyy") : ""
      });
    }
    return { success: true, files: files };
  } catch(e) { return { success: false, files: [] }; }
}

// يضيف ملف دعم لمحاضر — بيتعمل من CRM بس
function addInstructorSupportFile(token, instructorTag, title, base64Data, fileName, mimeType, url) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح — للإدارة فقط" };

    if (!instructorTag) return { success: false, message: "يجب تحديد المحاضر" };

    var fileId = '';
    var fileType = url ? 'link' : (mimeType && mimeType.indexOf('video') !== -1 ? 'video' : 'pdf');

    if (base64Data && fileName) {
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType || 'application/pdf', fileName);
      var folder = DriveApp.getRootFolder();
      var driveFile = folder.createFile(blob);
      fileId = driveFile.getId();
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    var sh = _ensureSupportFilesSheet();
    var sfId = "SF_" + new Date().getTime();
    sh.appendRow([sfId, instructorTag, title||fileName||'ملف دعم', fileId, fileName||'', fileType, url||'', new Date(), sess.name||sess.id]);
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم إضافة ملف الدعم", id: sfId };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// يحذف ملف دعم — من CRM بس
function deleteInstructorSupportFile(token, fileRecordId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };

    var sh = _ensureSupportFilesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === fileRecordId.toString()) {
        sh.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return { success: true, message: "✅ تم حذف الملف" };
      }
    }
    return { success: false, message: "الملف غير موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// يجيب كل ملفات الدعم مجمعة للإدارة (CRM)
function getAllSupportFiles(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };

    var sh = _ensureSupportFilesSheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var files = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      files.push({
        id: data[i][0].toString(),
        instructorTag: (data[i][1]||'').toString(),
        title: (data[i][2]||'').toString(),
        fileId: (data[i][3]||'').toString(),
        fileName: (data[i][4]||'').toString(),
        fileType: (data[i][5]||'pdf').toString(),
        url: (data[i][6]||'').toString(),
        createdAt: data[i][7] ? Utilities.formatDate(new Date(data[i][7]), tz, "dd/MM/yyyy") : "",
        createdBy: (data[i][8]||'').toString()
      });
    }
    return { success: true, files: files };
  } catch(e) { return { success: false, files: [] }; }
}

// ── CRM versions (no token — Google session auth) ──────────────
function getSupportFilesCRM(instructorTag) {
  try {
    var sh = _ensureSupportFilesSheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var files = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      if ((data[i][1]||'').toString().trim() !== (instructorTag||'').toString().trim()) continue;
      files.push({
        id: data[i][0].toString(),
        instructorTag: (data[i][1]||'').toString(),
        title: (data[i][2]||'').toString(),
        driveFileId: (data[i][3]||'').toString(),
        fileName: (data[i][4]||'').toString(),
        fileType: (data[i][5]||'pdf').toString(),
        url: (data[i][6]||'').toString(),
        createdAt: data[i][7] ? Utilities.formatDate(new Date(data[i][7]), tz, "dd/MM/yyyy") : ""
      });
    }
    return { success: true, files: files };
  } catch(e) { return { success: false, files: [] }; }
}

function addSupportFileCRM(instructorTag, title, base64Data, fileName, fileType, url) {
  try {
    if (!instructorTag) return { success: false, message: "يجب تحديد المحاضر" };
    var driveFileId = '';
    var resolvedType = fileType || (url ? 'link' : 'pdf');

    if (base64Data && fileName) {
      var mimeMap = { pdf:'application/pdf', video:'video/mp4' };
      var mime = mimeMap[resolvedType] || 'application/pdf';
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mime, fileName);
      var folder = DriveApp.getRootFolder();
      var driveFile = folder.createFile(blob);
      driveFileId = driveFile.getId();
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    var sh = _ensureSupportFilesSheet();
    var sfId = "SF_" + new Date().getTime();
    var editor = Session.getActiveUser().getEmail() || 'CRM';
    sh.appendRow([sfId, instructorTag, title || fileName || 'ملف دعم', driveFileId, fileName||'', resolvedType, url||'', new Date(), editor]);
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم إضافة الملف", id: sfId };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function addSupportFileByIdCRM(instructorTag, title, driveFileId, fileType, url) {
  try {
    if (!instructorTag) return { success: false, message: "يجب تحديد المحاضر" };
    if (!title) return { success: false, message: "يجب كتابة عنوان الملف" };
    var resolvedType = fileType || (url ? 'link' : 'pdf');
    var sh = _ensureSupportFilesSheet();
    var sfId = "SF_" + new Date().getTime();
    var editor = Session.getActiveUser().getEmail() || 'CRM';
    sh.appendRow([sfId, instructorTag, title.trim(), driveFileId||'', '', resolvedType, url||'', new Date(), editor]);
    SpreadsheetApp.flush();
    return { success: true, message: "✅ تم إضافة الملف بنجاح", id: sfId };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function deleteSupportFileCRM(fileRecordId) {
  try {
    var sh = _ensureSupportFilesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === fileRecordId.toString()) {
        sh.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return { success: true, message: "✅ تم حذف الملف" };
      }
    }
    return { success: false, message: "الملف غير موجود" };
  } catch(e) { return { success: false, message: e.toString() }; }
}
// ───────────────────────────────────────────────────────────────

// =============================================
// ---- SUCCESS STORIES ----
// =============================================
var ACAD_SUCCESS_STORIES = "Academy_Success_Stories";
// Schema: [0:ID, 1:AuthorID, 2:AuthorName, 3:AuthorRole, 4:Title, 5:Content,
//          6:ImageBase64, 7:Approved, 8:CreatedAt, 9:LikesCount, 10:Deleted]

function _ensureSuccessStoriesSheet() {
  var sh = getSheet(ACAD_SUCCESS_STORIES);
  if (!sh) {
    getMaster().insertSheet(ACAD_SUCCESS_STORIES);
    sh = getSheet(ACAD_SUCCESS_STORIES);
    sh.appendRow(["ID","AuthorID","AuthorName","AuthorRole","Title","Content","ImageBase64","Approved","CreatedAt","LikesCount","Deleted"]);
    sh.getRange(1,1,1,11).setBackground("#3d2a1e").setFontColor("#fff").setFontWeight("bold");
  }
  return sh;
}

function getSuccessStories(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "جلسة منتهية" };

    var sh = _ensureSuccessStoriesSheet();
    var data = sh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();
    var stories = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      if (data[i][10]) continue; // deleted
      // Only show approved stories (unless admin/BSA)
      var approved = data[i][7];
      if (!approved && !(sess.role === 'admin' || sess.isBSA)) continue;
      stories.push({
        id: data[i][0].toString(),
        authorId: data[i][1].toString(),
        authorName: (data[i][2]||'').toString(),
        authorRole: (data[i][3]||'student').toString(),
        title: (data[i][4]||'').toString(),
        content: (data[i][5]||'').toString(),
        hasImage: !!(data[i][6] && data[i][6].toString().length > 10),
        approved: !!data[i][7],
        createdAt: data[i][8] ? Utilities.formatDate(new Date(data[i][8]), tz, "dd/MM/yyyy") : "",
        likesCount: parseInt(data[i][9])||0,
        isMine: data[i][1].toString() === sess.id
      });
    }
    // Sort: newest first
    stories.sort(function(a, b) { return b.createdAt > a.createdAt ? 1 : -1; });

    // Enrich with per-reaction counts
    var ids = stories.map(function(s){ return s.id; });
    var rdata = _getReactionsForItems('story', ids, sess.id);
    stories.forEach(function(s){
      s.reactionCounts = rdata.countsMap[s.id] || {};
      s.myReaction = rdata.myMap[s.id] || '';
    });

    return { success: true, stories: stories, canModerate: !!(sess.role === 'admin' || sess.isBSA) };
  } catch(e) { return { success: false, stories: [] }; }
}

function submitSuccessStory(token, title, content, imageBase64) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "جلسة منتهية" };

    if (!title || !title.trim()) return { success: false, message: "يجب كتابة عنوان للقصة" };
    if (!content || !content.trim()) return { success: false, message: "يجب كتابة محتوى القصة" };

    var sh = _ensureSuccessStoriesSheet();
    var storyId = "SS_" + sess.id + "_" + new Date().getTime();
    var autoApprove = sess.role === 'admin' || sess.isBSA;
    sh.appendRow([storyId, sess.id, sess.name, sess.role, title.trim(), content.trim(), imageBase64||'', autoApprove, new Date(), 0, false]);
    SpreadsheetApp.flush();

    var msg = autoApprove
      ? "✅ تم نشر قصة نجاحك مباشرةً"
      : "✅ تم إرسال قصتك وستُنشر بعد موافقة الإدارة";
    return { success: true, message: msg };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// تعديل القصة وموافقة عليها في نفس الوقت (للـ BSA)
function editAndApproveStory(token, storyId, newTitle, newContent) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };
    if (!newTitle || !newTitle.trim()) return { success: false, message: "يجب كتابة العنوان" };
    if (!newContent || !newContent.trim()) return { success: false, message: "يجب كتابة المحتوى" };

    var sh = _ensureSuccessStoriesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === storyId.toString()) {
        sh.getRange(i+1, 5).setValue(newTitle.trim());   // col 5 = Title
        sh.getRange(i+1, 6).setValue(newContent.trim()); // col 6 = Content
        sh.getRange(i+1, 8).setValue(true);              // col 8 = Approved
        SpreadsheetApp.flush();
        return { success: true, message: "✅ تم التعديل والنشر" };
      }
    }
    return { success: false, message: "القصة غير موجودة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function approveSuccessStory(token, storyId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };

    var sh = _ensureSuccessStoriesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === storyId) {
        sh.getRange(i+1, 8).setValue(true);
        SpreadsheetApp.flush();
        return { success: true, message: "✅ تمت الموافقة على القصة" };
      }
    }
    return { success: false, message: "القصة غير موجودة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function deleteSuccessStory(token, storyId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess || !(sess.role === 'admin' || sess.isBSA)) return { success: false, message: "غير مصرح" };

    var sh = _ensureSuccessStoriesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === storyId) {
        sh.getRange(i+1, 11).setValue(true);
        SpreadsheetApp.flush();
        return { success: true, message: "✅ تم حذف القصة" };
      }
    }
    return { success: false, message: "القصة غير موجودة" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function likeSuccessStory(token, storyId) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false };

    var sh = _ensureSuccessStoriesSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === storyId) {
        var cur = parseInt(data[i][9])||0;
        sh.getRange(i+1, 10).setValue(cur + 1);
        SpreadsheetApp.flush();
        return { success: true, likesCount: cur + 1 };
      }
    }
    return { success: false };
  } catch(e) { return { success: false }; }
}

// ═══════════════════════════════════════════════════
// ═══  UNIFIED REACTIONS SYSTEM  ═══
// ═══════════════════════════════════════════════════
var ACAD_REACTIONS = "Academy_Reactions";

function _ensureReactionsSheet() {
  var sh = getSheet(ACAD_REACTIONS);
  if (!sh) {
    getMaster().insertSheet(ACAD_REACTIONS);
    sh = getSheet(ACAD_REACTIONS);
    sh.appendRow(['ID','ItemType','ItemID','UserID','ReactionType','CreatedAt']);
  }
  return sh;
}

// Toggle/change reaction. itemType: 'post' | 'comment' | 'story'
// reactionType: 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'funny'
function reactToItem(token, itemType, itemId, reactionType) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false };

    var sh = _ensureReactionsSheet();
    var data = sh.getDataRange().getValues();
    var existingRow = -1, existingReaction = '';

    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString() === itemType &&
          data[i][2].toString() === itemId.toString() &&
          data[i][3].toString() === sess.id.toString()) {
        existingRow = i + 1;
        existingReaction = data[i][4].toString();
        break;
      }
    }

    var action, myReaction = reactionType;
    if (existingRow > 0) {
      if (existingReaction === reactionType) {
        // Same reaction → toggle off
        sh.deleteRow(existingRow);
        action = 'removed'; myReaction = '';
      } else {
        // Different reaction → update
        sh.getRange(existingRow, 5).setValue(reactionType);
        action = 'changed';
      }
    } else {
      sh.appendRow(["R_" + new Date().getTime() + "_" + (sess.id||'').slice(-4),
                    itemType, itemId.toString(), sess.id, reactionType, new Date()]);
      action = 'added';
    }
    SpreadsheetApp.flush();

    // Count totals for this item
    var fresh = sh.getDataRange().getValues();
    var totalCount = 0, counts = {};
    for (var j = 1; j < fresh.length; j++) {
      if (fresh[j][1].toString() === itemType && fresh[j][2].toString() === itemId.toString()) {
        totalCount++;
        var rt = fresh[j][4].toString();
        counts[rt] = (counts[rt]||0) + 1;
      }
    }

    // Sync count to original sheet
    _syncLikesCount(itemType, itemId.toString(), totalCount);

    return { success: true, action: action, myReaction: myReaction, totalCount: totalCount, counts: counts };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// Returns { countsMap: {itemId: {like:n,...}}, myMap: {itemId: reactionType} }
function _getReactionsForItems(itemType, itemIds, userId) {
  try {
    var sh = getSheet(ACAD_REACTIONS); if (!sh) return { countsMap: {}, myMap: {} };
    var data = sh.getDataRange().getValues();
    var idSet = {};
    itemIds.forEach(function(id){ idSet[id.toString()] = true; });
    var countsMap = {}, myMap = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString() !== itemType) continue;
      var iid = data[i][2].toString();
      if (!idSet[iid]) continue;
      var rt = data[i][4].toString();
      if (!countsMap[iid]) countsMap[iid] = {};
      countsMap[iid][rt] = (countsMap[iid][rt]||0) + 1;
      if (userId && data[i][3].toString() === userId.toString()) myMap[iid] = rt;
    }
    return { countsMap: countsMap, myMap: myMap };
  } catch(e) { return { countsMap: {}, myMap: {} }; }
}

function _syncLikesCount(itemType, itemId, count) {
  try {
    var sh, col;
    if      (itemType === 'post')    { sh = getSheet(ACAD_COMMUNITY);          col = 7;  }
    else if (itemType === 'comment') { sh = getSheet(ACAD_COMMENTS);           col = 8;  }
    else if (itemType === 'story')   { sh = _ensureSuccessStoriesSheet();      col = 10; }
    if (!sh) return;
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === itemId) { sh.getRange(i+1, col).setValue(count); return; }
    }
  } catch(e) {}
}

// ════════════════════════════════════════════════════
// ═══  STUDENT SUPPORT FILES  ═══
// ════════════════════════════════════════════════════
function getStudentSupportFiles(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: "جلسة منتهية" };

    var sfSh = _ensureSupportFilesSheet();
    var sfData = sfSh.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();

    if (sess.role === 'instructor' || sess.isBSA) {
      var insSh = getSheet(ACAD_INSTRUCTORS);
      var insTag = '';
      if (insSh) {
        var insRows = insSh.getDataRange().getValues();
        for (var ii = 1; ii < insRows.length; ii++) {
          if (insRows[ii][0].toString() === sess.id) { insTag = (insRows[ii][2]||'').toString().trim(); break; }
        }
      }
      var files = [];
      for (var i = 1; i < sfData.length; i++) {
        if (!sfData[i][0]) continue;
        if ((sfData[i][1]||'').toString().trim() === insTag) files.push(_sfRow(sfData[i], tz));
      }
      return { success: true, files: files, grouped: [{ insTag: insTag, insName: sess.name, files: files }] };
    }

    // Student: collect instructor tags from Academy_Content (the real source of truth)
    // Note: INS: enrollments are generated on-the-fly and never stored in Academy_Enrollments
    var conSh = getSheet(ACAD_CONTENT);
    var insTagMap = {}; // tag → tag (display name)
    if (conSh) {
      var conData = conSh.getDataRange().getValues();
      for (var c = 1; c < conData.length; c++) {
        if (!conData[c][0]) continue; // skip empty rows
        var tag = (conData[c][11] || '').toString().trim();
        if (tag && !insTagMap[tag]) insTagMap[tag] = tag;
      }
    }
    // Fallback: also check Academy_Enrollments for any real round-based enrollments
    var enrSh = getSheet(ACAD_ENROLL);
    if (enrSh) {
      var enrData = enrSh.getDataRange().getValues();
      for (var e = 1; e < enrData.length; e++) {
        if (enrData[e][1].toString() !== sess.id.toString()) continue;
        if ((enrData[e][5]||'').toString() === 'removed') continue;
        var rid = (enrData[e][2]||'').toString();
        var m = rid.match(/^INS:(.+)$/);
        if (m) {
          var tag2 = m[1].trim();
          if (!insTagMap[tag2]) insTagMap[tag2] = (enrData[e][3]||tag2).toString();
        }
      }
    }

    var grouped = [], allFiles = [];
    var tags = Object.keys(insTagMap);
    tags.forEach(function(tag) {
      var insFiles = [];
      for (var i = 1; i < sfData.length; i++) {
        if (!sfData[i][0]) continue;
        if ((sfData[i][1]||'').toString().trim() === tag) {
          var f = _sfRow(sfData[i], tz);
          insFiles.push(f); allFiles.push(f);
        }
      }
      if (insFiles.length) grouped.push({ insTag: tag, insName: insTagMap[tag], files: insFiles });
    });

    return { success: true, files: allFiles, grouped: grouped };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function _sfRow(row, tz) {
  return {
    id:        row[0].toString(),
    insTag:    (row[1]||'').toString(),
    title:     (row[2]||'').toString(),
    fileId:    (row[3]||'').toString(),
    fileName:  (row[4]||'').toString(),
    fileType:  (row[5]||'pdf').toString(),
    url:       (row[6]||'').toString(),
    createdAt: row[7] ? Utilities.formatDate(new Date(row[7]), tz, "dd/MM/yyyy") : ""
  };
}

// ═══════════════════════════════════════════════════════════════
// ═══  BSA ACCOUNTING SYSTEM  ═══
// ═══════════════════════════════════════════════════════════════
var EXPENSES_SHEET = 'BSA_Expenses';

function _getOrCreateExpensesSheet() {
  var sh = getSheet(EXPENSES_SHEET);
  if (!sh) {
    getMaster().insertSheet(EXPENSES_SHEET);
    sh = getSheet(EXPENSES_SHEET);
    sh.appendRow(['ID','Date','Category','Description','Amount','Method','CreatedBy','Notes','CreatedAt']);
    sh.getRange(1,1,1,9).setBackground('#2c1d12').setFontColor('#fff').setFontWeight('bold');
  }
  return sh;
}

function _parseAccDate(v) {
  if (!v) return null;
  var d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function _monthKey(d) {
  return d.getFullYear() + '-' + (d.getMonth()+1);
}

function _fmtDate(d) {
  if (!d) return '';
  var tz = Session.getScriptTimeZone();
  try { return Utilities.formatDate(d, tz, 'dd/MM/yyyy'); } catch(e) { return d.toLocaleDateString('ar-EG'); }
}

// ── PIN Verification ────────────────────────────────────────────
var ACC_PIN_KEY = 'BSA_ACC_PIN';
var ACC_PIN_DEFAULT = '142536'; // غيّر هذا الرقم بعد أول deploy

function verifyAccountingPin(token, pin) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    pin = (pin || '').toString().trim();
    if (!pin) return { success: false, message: 'أدخل الرقم السري' };
    var stored = PropertiesService.getScriptProperties().getProperty(ACC_PIN_KEY);
    if (!stored) {
      // أول مرة — احفظ الـ PIN الافتراضي
      PropertiesService.getScriptProperties().setProperty(ACC_PIN_KEY, ACC_PIN_DEFAULT);
      stored = ACC_PIN_DEFAULT;
    }
    if (pin === stored) return { success: true };
    return { success: false, message: 'الرقم السري غلط' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function changeAccountingPin(token, currentPin, newPin) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    currentPin = (currentPin || '').toString().trim();
    newPin = (newPin || '').toString().trim();
    if (!newPin || newPin.length < 4) return { success: false, message: 'الرقم السري الجديد لازم يكون 4 أرقام على الأقل' };
    if (!/^\d+$/.test(newPin)) return { success: false, message: 'استخدم أرقام فقط' };
    var stored = PropertiesService.getScriptProperties().getProperty(ACC_PIN_KEY) || ACC_PIN_DEFAULT;
    if (currentPin !== stored) return { success: false, message: 'الرقم السري الحالي غلط' };
    PropertiesService.getScriptProperties().setProperty(ACC_PIN_KEY, newPin);
    return { success: true };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ── Main Dashboard ──────────────────────────────────────────────
// MONTH FILTER (2026-07-06): the dashboard used to always scope income/courses/campaigns/expenses to
// the REAL current calendar month with no way to look at a different month or the whole year at once.
// filterMonth: omit/undefined -> defaults to the real current month (unchanged old behavior).
// filterMonth: a specific 1-12 number (with filterYear) -> every scoped figure below reflects THAT
// month instead of today's. filterMonth: the string 'all' -> every scoped figure aggregates across
// ALL months (no restriction) — the closest thing to a whole-year/all-time view. Wallets are
// deliberately NEVER filtered by month (a running balance, editable any time, per the user's own
// explicit note) — the 6-month trend bars also stay anchored to the real "last 6 calendar months
// from today" regardless of the filter, since that's inherently a multi-month rolling view.
function getAccountingDashboard(token, filterMonth, filterYear) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    var sess = _sv.user;

    var now = new Date();
    var curYear = now.getFullYear();
    var curMonth = now.getMonth() + 1;

    var isAllMode = (filterMonth === 'all');
    var scopeMonth = isAllMode ? null : (parseInt(filterMonth) || curMonth);
    var scopeYear  = isAllMode ? null : (parseInt(filterYear)  || curYear);

    // ── Income: Financial_Data (Month/Year explicit — col C=Month, D=Year, P=Paid, J=Course) ──
    var txSh = getSheet('Payment_Transactions');
    var txData = txSh ? txSh.getDataRange().getValues() : [[]];
    var fdSh = getSheet('Financial_Data');
    var fdData = fdSh ? fdSh.getDataRange().getValues() : [[]];
    // Canonical course-name lookup (case-insensitive) so "Digital marketing" / "Digital Marketing"
    // etc. don't split into separate bars — always displayed under the real Courses-sheet name.
    var courseCanon = {};
    getCourses().forEach(function(c){ courseCanon[c.name.toLowerCase()] = c.name; });

    // Campaign list (managed from Settings) — used so newly-added campaigns naturally appear once
    // they have revenue, and campaign-name casing stays consistent with the managed list.
    var campaignCanon = {};
    try {
      var _campList = JSON.parse(PropertiesService.getScriptProperties().getProperty('campaignList') || '[]');
      _campList.forEach(function(c){ campaignCanon[c.toLowerCase()] = c; });
    } catch(ce) {}

    // REVERTED (2026-07-06): an initialPaidMap-based version of monthIncome (cross-referencing
    // Client_Payments + Payment_Transactions "أول دفعة") was tried here to avoid a theoretical
    // cross-month double-count, but the SAME approach caused a confirmed live regression on the
    // "الكوميشن الشهري" page (a real month showed 27,000 instead of the true ~50,000 collected) — the
    // lookup silently collapses to 0 when an OC matches a Client_Payments row but no "أول دفعة"
    // transaction is found for it, which is common enough on this system's real data to matter.
    // Reverted to the original, long-standing Paid-sum-across-all-rows formula. See
    // [[project_commission_doublecount_fix]] memory for the full incident writeup — any future
    // attempt at this must be validated against real production data first, not just mock fixtures.
    var monthIncome = {};
    var courseMap = {};
    var campaignMap = {};
    for (var fi = 1; fi < fdData.length; fi++) {
      var fr = fdData[fi];
      var fPaid = parseFloat(fr[15]) || 0;
      var fMonth = parseInt(fr[2]) || 0;
      var fYear  = parseInt(fr[3]) || 0;
      if (fPaid > 0 && fMonth && fYear) {
        var fmk = fYear + '-' + fMonth;
        monthIncome[fmk] = (monthIncome[fmk]||0) + fPaid;
      }

      // Course/campaign revenue (2026-07-06 fix): must be based on the booking's TOTAL PRICE, on
      // "client" (booking) rows ONLY — NOT on Paid, and NOT on "payment" (installment) rows. Reason:
      // an installment collected via addFinancialPayment both (a) updates the ORIGINAL client row's
      // Paid to the new running total AND (b) appends its own separate "payment" row with that same
      // amount as ITS Paid — so summing Paid across every row double-counts every installment (this
      // is exactly what made the dashboard undercount/misattribute vs. the real sheet total). Price is
      // only ever set on the "client" row (installment rows always have Price=0), so keying off Price
      // on "client" rows alone counts each booking's full value exactly once — booking and installment
      // are structurally separated, with no possibility of double-counting.
      if ((fr[4] || '').toString().trim().toLowerCase() !== 'client') continue;
      // Month filter: skip rows outside the selected month unless "all months" is selected.
      if (!isAllMode && (fMonth !== scopeMonth || fYear !== scopeYear)) continue;
      var fPrice = parseFloat(fr[14]) || 0;
      if (fPrice <= 0) continue;
      // "—" is the literal placeholder `fillMissingFinancialCampaignTypes`/`addFinancialClient` write
      // when no course/campaign could be resolved at invoice time — treat it exactly like blank so it
      // buckets into "غير محدد" instead of showing up as its own confusing dash-only bar.
      var fCourseRaw = (fr[9]||'').toString().trim();
      if (fCourseRaw === '—' || fCourseRaw === '-') fCourseRaw = '';
      var fCourse = fCourseRaw ? (courseCanon[fCourseRaw.toLowerCase()] || fCourseRaw) : 'غير محدد';
      courseMap[fCourse] = (courseMap[fCourse]||0) + fPrice;
      var fCampRaw = (fr[18]||'').toString().trim();
      if (fCampRaw === '—' || fCampRaw === '-') fCampRaw = '';
      var fCamp = fCampRaw ? (campaignCanon[fCampRaw.toLowerCase()] || fCampRaw) : 'غير محدد';
      campaignMap[fCamp] = (campaignMap[fCamp]||0) + fPrice;
    }

    // ── Overdue: Client_Payments ──
    var cpSh = getSheet('Client_Payments');
    var cpData = cpSh ? cpSh.getDataRange().getValues() : [[]];
    var overdue = [], overdueTotal = 0;
    var today = new Date(); today.setHours(0,0,0,0);
    for (var ci = 1; ci < cpData.length; ci++) {
      var cr = cpData[ci];
      var cRoundName = (cr[5]||'').toString().trim();
      if (/^invoice/i.test(cRoundName)) continue;
      var cRem  = parseFloat(cr[10])||0;
      var cCourse = (cr[3]||'').toString().trim() || cRoundName || 'غير محدد';
      if (cRem > 0) {
        var dueD = _parseAccDate(cr[11]);
        if (dueD && dueD < today) {
          overdue.push({ name:(cr[2]||'').toString(), course:cCourse, remaining:cRem, nextDue:_fmtDate(dueD) });
          overdueTotal += cRem;
        }
      }
    }

    // ── Wallets ──
    var wallets = [];
    try {
      var wsh = _getWalletsSheet();
      if (wsh) {
        var wdata = wsh.getDataRange().getValues();
        for (var wi = 1; wi < wdata.length; wi++) {
          var wname = (wdata[wi][0]||'').toString().trim();
          if (!wname) continue;
          wallets.push({ name: wname, balance: parseFloat(wdata[wi][1])||0, adjDate: wdata[wi][2] ? _fmtDate(_parseAccDate(wdata[wi][2])) : '' });
        }
      }
    } catch(we) {}

    // ── Expenses: BSA_Expenses ──
    var expSh = _getOrCreateExpensesSheet();
    var expData = expSh.getDataRange().getValues();
    var monthExpense = {};
    var expByCategory = {}; // scoped to the selected month filter (or all-time in 'all' mode) — powers the pie chart
    var expByMonthCat = {}; // "YYYY-M" -> { category: amount } — always by REAL calendar month, used for the rolling trend/anomaly-alert comparison regardless of filter
    for (var ei = 1; ei < expData.length; ei++) {
      var er = expData[ei];
      var eAmt = parseFloat(er[4])||0;
      if (eAmt <= 0) continue;
      var ed = _parseAccDate(er[1]);
      if (!ed) continue;
      var emk = _monthKey(ed);
      monthExpense[emk] = (monthExpense[emk]||0) + eAmt;
      var eCat = (er[2]||'متفرقات').toString();
      if (!expByMonthCat[emk]) expByMonthCat[emk] = {};
      expByMonthCat[emk][eCat] = (expByMonthCat[emk][eCat]||0) + eAmt;
      var eMonth = ed.getMonth() + 1, eYear = ed.getFullYear();
      if (isAllMode || (eMonth === scopeMonth && eYear === scopeYear)) {
        expByCategory[eCat] = (expByCategory[eCat]||0) + eAmt;
      }
    }

    // curIncome/curExpense reflect the selected scope (a specific month, or the whole "all months" view).
    var curIncome, curExpense;
    if (isAllMode) {
      curIncome  = Object.keys(monthIncome).reduce(function(s,k){ return s + monthIncome[k]; }, 0);
      curExpense = Object.keys(monthExpense).reduce(function(s,k){ return s + monthExpense[k]; }, 0);
    } else {
      curIncome  = monthIncome[scopeYear+'-'+scopeMonth]  || 0;
      curExpense = monthExpense[scopeYear+'-'+scopeMonth] || 0;
    }

    // ── 6-month trend ──
    var MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var trend = [];
    for (var mi = 5; mi >= 0; mi--) {
      var td2 = new Date(curYear, curMonth-1-mi, 1);
      var tk = _monthKey(td2);
      trend.push({ label: MONTHS_AR[td2.getMonth()], income: monthIncome[tk]||0, expense: monthExpense[tk]||0 });
    }

    // ── Income by course (top 5) ──
    var courseArr = Object.keys(courseMap).map(function(k){ return {name:k, amount:courseMap[k]}; });
    courseArr.sort(function(a,b){return b.amount-a.amount;});

    // ── Income by campaign (top 5) ──
    var campaignArr = Object.keys(campaignMap).map(function(k){ return {name:k, amount:campaignMap[k]}; });
    campaignArr.sort(function(a,b){return b.amount-a.amount;});

    // ── Expense by category ──
    var expCatArr = Object.keys(expByCategory).map(function(k){ return {name:k, amount:expByCategory[k]}; });
    expCatArr.sort(function(a,b){return b.amount-a.amount;});

    // ── Expense trend by category (top 4 categories, last 6 months) — powers the "تحليل المصروفات"
    // chart, replacing the old income-vs-expense bars, so the admin can see WHERE money is going
    // month over month rather than just a single income/expense pair. ──
    var topCatNames = expCatArr.slice(0, 4).map(function(c){ return c.name; });
    var expenseTrend = [];
    for (var xi = 5; xi >= 0; xi--) {
      var xd = new Date(curYear, curMonth-1-xi, 1);
      var xk = _monthKey(xd);
      var byCat = expByMonthCat[xk] || {};
      expenseTrend.push({
        label: MONTHS_AR[xd.getMonth()],
        categories: topCatNames.map(function(cn){ return byCat[cn] || 0; })
      });
    }

    // ── Anomaly detection: flag a category whose spend in the SELECTED month is far above its own
    // average over the prior 3 months (excluding that month), so a spike or an entry error gets
    // surfaced instead of buried in a pie chart. Anchored to the filtered month (falls back to the
    // real current month when no filter is set) — skipped entirely in "all months" mode, since there's
    // no single anchor month to compare a running average against. ──
    var expenseAlerts = [];
    var alertAnchorMonth = isAllMode ? null : scopeMonth;
    var alertAnchorYear  = isAllMode ? null : scopeYear;
    if (!isAllMode) {
      Object.keys(expByCategory).forEach(function(cat){
        var curCatAmt = (expByMonthCat[alertAnchorYear+'-'+alertAnchorMonth] || {})[cat] || 0;
        if (curCatAmt < 200) return; // ignore noise on tiny amounts
        var priorSum = 0, priorCount = 0;
        for (var pi = 1; pi <= 3; pi++) {
          var pd = new Date(alertAnchorYear, alertAnchorMonth-1-pi, 1);
          var pk = _monthKey(pd);
          var pAmt = (expByMonthCat[pk] || {})[cat];
          if (pAmt !== undefined) { priorSum += pAmt; priorCount++; }
        }
        if (priorCount === 0) return; // no history to compare against yet
        var priorAvg = priorSum / priorCount;
        if (priorAvg > 0 && curCatAmt > priorAvg * 1.5) {
          var pct = Math.round((curCatAmt/priorAvg - 1) * 100);
          expenseAlerts.push({ category: cat, current: curCatAmt, avg: Math.round(priorAvg), pct: pct });
        }
      });
    }
    expenseAlerts.sort(function(a,b){ return b.pct - a.pct; });

    // ── Recent 5 transactions ──
    var recent = [];
    for (var ri = txData.length-1; ri >= 1 && recent.length < 5; ri--) {
      var rr = txData[ri];
      var rAmt = parseFloat(rr[3])||0;
      if (rAmt <= 0) continue;
      recent.push({ name:(rr[2]||'').toString(), amount:rAmt, date:_fmtDate(_parseAccDate(rr[4])), type:(rr[5]||'').toString(), method:(rr[8]||'').toString() });
    }

    return {
      success: true,
      isAllMode: isAllMode, scopeMonth: scopeMonth, scopeYear: scopeYear,
      curIncome: curIncome, curExpense: curExpense,
      curProfit: curIncome - curExpense,
      overdueCount: overdue.length, overdueTotal: overdueTotal,
      trend: trend,
      topCourses: courseArr.slice(0,5),
      // No arbitrary top-5 cap here (unlike topCourses, which realistically only ever has a couple of
      // real courses) — campaigns are meant to be reviewed one by one, so show every campaign that
      // has real paid revenue, not just the biggest 5.
      topCampaigns: campaignArr,
      expByCategory: expCatArr,
      expenseTrend: expenseTrend,
      expenseTrendCats: topCatNames,
      expenseAlerts: expenseAlerts,
      recentTx: recent,
      wallets: wallets
    };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ── Income Transactions ────────────────────────────────────────
function getAccountingTransactions(token, month, year) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, rows: [] };
    var txSh = getSheet('Payment_Transactions');
    if (!txSh) return { success: true, rows: [] };
    var data = txSh.getDataRange().getValues();
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      var amt = parseFloat(r[3])||0;
      if (amt <= 0) continue;
      var d = _parseAccDate(r[4]);
      if (!d) continue;
      if (month && parseInt(month) !== d.getMonth()+1) continue;
      if (year  && parseInt(year)  !== d.getFullYear())  continue;
      rows.push({ id:(r[0]||'').toString(), name:(r[2]||'').toString(), amount:amt, date:_fmtDate(d), type:(r[5]||'').toString(), agent:(r[7]||'').toString(), method:(r[8]||'').toString() });
    }
    rows.reverse();
    return { success: true, rows: rows };
  } catch(e) { return { success: false, rows: [], message: e.toString() }; }
}

// ── Expense Records ────────────────────────────────────────────
function getAccountingExpenses(token, month, year) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, rows: [] };
    var sh = _getOrCreateExpensesSheet();
    var data = sh.getDataRange().getValues();
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      var amt = parseFloat(r[4])||0;
      if (amt <= 0) continue;
      var d = _parseAccDate(r[1]);
      if (!d) continue;
      if (month && parseInt(month) !== d.getMonth()+1) continue;
      if (year  && parseInt(year)  !== d.getFullYear())  continue;
      rows.push({ id:(r[0]||'').toString(), date:_fmtDate(d), category:(r[2]||'').toString(), desc:(r[3]||'').toString(), amount:amt, method:(r[5]||'').toString(), by:(r[6]||'').toString(), notes:(r[7]||'').toString() });
    }
    rows.reverse();
    return { success: true, rows: rows };
  } catch(e) { return { success: false, rows: [], message: e.toString() }; }
}

// ── Add Expense ────────────────────────────────────────────────
function addAccountingExpense(token, category, description, amount, date, method, notes) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    var sess = _sv.user;
    amount = parseFloat(amount)||0;
    if (amount <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
    if (!category) return { success: false, message: 'اختر التصنيف' };
    var sh = _getOrCreateExpensesSheet();
    var tz = Session.getScriptTimeZone();
    var id = 'EXP-' + new Date().getTime();
    var rowDate = date ? new Date(date) : new Date();
    sh.appendRow([id, rowDate, category, description||'', amount, method||'كاش', sess.name||sess.username, notes||'', new Date()]);
    return { success: true, id: id };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ── Overdue Installments ───────────────────────────────────────
function getOverdueInstallments(token) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, rows: [] };
    var cpSh = getSheet('Client_Payments');
    if (!cpSh) return { success: true, rows: [] };
    var data = cpSh.getDataRange().getValues();
    var today = new Date(); today.setHours(0,0,0,0);
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      var roundName = (r[5]||'').toString().trim();
      if (/^invoice/i.test(roundName)) continue;
      var rem = parseFloat(r[10])||0;
      if (rem <= 0) continue;
      var dueD = _parseAccDate(r[11]);
      var daysLate = dueD ? Math.floor((today-dueD)/(86400000)) : 0;
      if (!dueD || daysLate < 0) continue;
      rows.push({ name:(r[2]||'').toString(), course:(r[3]||roundName||'').toString(), total:parseFloat(r[6])||0, paid:parseFloat(r[9])||0, remaining:rem, nextDue:_fmtDate(dueD), daysLate:daysLate, agent:(r[8]||'').toString() });
    }
    rows.sort(function(a,b){return b.daysLate-a.daysLate;});
    return { success: true, rows: rows, totalOverdue: rows.reduce(function(s,r){return s+r.remaining;},0) };
  } catch(e) { return { success: false, rows: [], message: e.toString() }; }
}

// ═══════════════════════════════════════════════════════════════
// ═══  WALLETS  ═══
// ═══════════════════════════════════════════════════════════════

function _getWalletsSheet() {
  var sheets = getMaster().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === 1687356485) return sheets[i];
  }
  return getSheet('Wallets') || getSheet('محافظ');
}

function getWallets(token) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    var sh = _getWalletsSheet();
    if (!sh) return { success: false, message: 'لا يوجد sheet للمحافظ' };
    var data = sh.getDataRange().getValues();
    var wallets = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!(r[0]||'').toString().trim()) continue;
      wallets.push({
        name: r[0].toString().trim(),
        balance: parseFloat(r[1]) || 0,
        adjDate: r[2] ? _fmtDate(_parseAccDate(r[2])) : '',
        savedAt: r[3] ? _fmtDate(_parseAccDate(r[3])) : ''
      });
    }
    return { success: true, wallets: wallets };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function setWalletBalance(token, walletName, newBalance) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    newBalance = parseFloat(newBalance);
    if (isNaN(newBalance)) return { success: false, message: 'الرصيد غير صحيح' };
    var sh = _getWalletsSheet();
    if (!sh) return { success: false, message: 'لا يوجد sheet للمحافظ' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0]||'').toString().trim() === walletName.trim()) {
        var now = new Date();
        sh.getRange(i+1, 2).setValue(newBalance);
        sh.getRange(i+1, 3).setValue(now);
        sh.getRange(i+1, 4).setValue(now);
        SpreadsheetApp.flush();
        return { success: true };
      }
    }
    return { success: false, message: 'المحفظة غير موجودة: ' + walletName };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function transferWalletFunds(token, fromWallet, toWallet, amount, notes) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    amount = parseFloat(amount);
    if (!amount || amount <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
    if (fromWallet === toWallet) return { success: false, message: 'لا يمكن التحويل لنفس المحفظة' };
    var sh = _getWalletsSheet();
    if (!sh) return { success: false, message: 'لا يوجد sheet للمحافظ' };
    var data = sh.getDataRange().getValues();
    var fromRow = -1, toRow = -1, fromBal = 0, toBal = 0;
    for (var i = 1; i < data.length; i++) {
      var wn = (data[i][0]||'').toString().trim();
      if (wn === fromWallet.trim()) { fromRow = i+1; fromBal = parseFloat(data[i][1])||0; }
      if (wn === toWallet.trim())   { toRow   = i+1; toBal   = parseFloat(data[i][1])||0; }
    }
    if (fromRow < 0) return { success: false, message: 'المحفظة المصدر غير موجودة' };
    if (toRow < 0)   return { success: false, message: 'المحفظة الهدف غير موجودة' };
    if (fromBal < amount) return { success: false, message: 'الرصيد غير كافي — المتاح: ' + fromBal + ' ج.م' };
    var now = new Date();
    sh.getRange(fromRow, 2).setValue(fromBal - amount);
    sh.getRange(fromRow, 3).setValue(now);
    sh.getRange(fromRow, 4).setValue(now);
    sh.getRange(toRow, 2).setValue(toBal + amount);
    sh.getRange(toRow, 3).setValue(now);
    sh.getRange(toRow, 4).setValue(now);
    SpreadsheetApp.flush();
    return { success: true, fromBalance: fromBal - amount, toBalance: toBal + amount };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════════════════
// ═══  EXPENSE CATEGORIES  ═══
// ═══════════════════════════════════════════════════════════════

var ACC_CATS_KEY = 'BSA_ACC_CATEGORIES';
var ACC_CATS_DEFAULT = ['مرتبات محاضرين','إيجار','تسويق وإعلانات','سوفتوير وتقنية','أدوات مكتبية','متفرقات'];

function getAccExpenseCategories(token) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    var stored = PropertiesService.getScriptProperties().getProperty(ACC_CATS_KEY);
    var cats = stored ? JSON.parse(stored) : ACC_CATS_DEFAULT;
    return { success: true, categories: cats };
  } catch(e) { return { success: false, categories: ACC_CATS_DEFAULT }; }
}

function addAccExpenseCategory(token, name) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    name = (name||'').trim();
    if (!name) return { success: false, message: 'أدخل اسم البند' };
    var stored = PropertiesService.getScriptProperties().getProperty(ACC_CATS_KEY);
    var cats = stored ? JSON.parse(stored) : ACC_CATS_DEFAULT.slice();
    if (cats.indexOf(name) >= 0) return { success: false, message: 'البند موجود بالفعل' };
    cats.push(name);
    PropertiesService.getScriptProperties().setProperty(ACC_CATS_KEY, JSON.stringify(cats));
    return { success: true, categories: cats };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function deleteAccExpenseCategory(token, name) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    name = (name||'').trim();
    var stored = PropertiesService.getScriptProperties().getProperty(ACC_CATS_KEY);
    var cats = stored ? JSON.parse(stored) : ACC_CATS_DEFAULT.slice();
    var idx = cats.indexOf(name);
    if (idx < 0) return { success: false, message: 'البند غير موجود' };
    cats.splice(idx, 1);
    PropertiesService.getScriptProperties().setProperty(ACC_CATS_KEY, JSON.stringify(cats));
    return { success: true, categories: cats };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ═══════════════════════════════════════════════════════
// ATTENDANCE QR SESSIONS
// ═══════════════════════════════════════════════════════
var ATT_SESS_KEY = 'BSA_ATT_SESSIONS';

function openAttendanceSession(token, roundId, lectureNum) {
  try {
    var v = validateSession(token);
    if (!v || !v.success) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var sessions = {};
    try { sessions = JSON.parse(props.getProperty(ATT_SESS_KEY) || '{}'); } catch(e) {}
    var key = roundId.toString().trim();
    sessions[key] = { roundId: key, lectureNum: parseInt(lectureNum) || 1, openedAt: new Date().getTime(), openedBy: v.name || v.username };
    props.setProperty(ATT_SESS_KEY, JSON.stringify(sessions));
    return { success: true };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function closeAttendanceSession(token, roundId) {
  try {
    var v = validateSession(token);
    if (!v || !v.success) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var sessions = {};
    try { sessions = JSON.parse(props.getProperty(ATT_SESS_KEY) || '{}'); } catch(e) {}
    delete sessions[roundId.toString().trim()];
    props.setProperty(ATT_SESS_KEY, JSON.stringify(sessions));
    return { success: true };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getActiveSessions(token) {
  try {
    var v = validateSession(token);
    if (!v || !v.success) return [];
    var props = PropertiesService.getScriptProperties();
    var sessions = {};
    try { sessions = JSON.parse(props.getProperty(ATT_SESS_KEY) || '{}'); } catch(e) {}
    return Object.keys(sessions).map(function(k) { return sessions[k]; });
  } catch(e) { return []; }
}

function qrCheckIn(userToken, roundId) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'يرجى تسجيل الدخول للبورتال أولاً' };
    var stuSh = getSheet('Academy_Students');
    if (!stuSh) return { success: false, message: 'خطأ في النظام' };
    var stuData = stuSh.getDataRange().getValues();
    var student = null;
    for (var i = 1; i < stuData.length; i++) {
      if ((stuData[i][0] || '').toString() === stuId.toString()) {
        student = { name: (stuData[i][1] || '').toString(), phone: (stuData[i][4] || '').toString() };
        break;
      }
    }
    if (!student) return { success: false, message: 'لم يتم التعرف على حسابك' };
    var props = PropertiesService.getScriptProperties();
    var sessions = {};
    try { sessions = JSON.parse(props.getProperty(ATT_SESS_KEY) || '{}'); } catch(e) {}
    var session = sessions[roundId.toString().trim()];
    if (!session) return { success: false, message: 'لا توجد جلسة مفتوحة لهذا الراوند الآن — تواصل مع المحاضر' };
    var lectureNum = session.lectureNum;
    var existing = getAttendanceData(roundId);
    var normPhone = _normAttPhone(student.phone);
    var alreadyIn = existing.some(function(a) {
      return _normAttPhone(a.phone) === normPhone && (a.attended || []).indexOf(lectureNum.toString()) !== -1;
    });
    if (alreadyIn) return { success: true, message: 'حضورك مسجل مسبقاً في المحاضرة ' + lectureNum, alreadyIn: true, lectureNum: lectureNum };
    saveAttendanceData(roundId, student.phone, student.name, lectureNum, 'attendance', true);
    return { success: true, message: 'تم تسجيل حضورك في المحاضرة ' + lectureNum, lectureNum: lectureNum, studentName: student.name };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== LEVELS SYSTEM =====================

function getLevelInfo(points) {
  var p = parseInt(points) || 0;
  var levels = [
    { level: 'Bronze',   min: 0,    max: 499,  icon: '🥉', color: '#cd7f32', next: 'Silver',   nextMin: 500  },
    { level: 'Silver',   min: 500,  max: 1499, icon: '🥈', color: '#c0c0c0', next: 'Gold',     nextMin: 1500 },
    { level: 'Gold',     min: 1500, max: 3499, icon: '🥇', color: '#ffd700', next: 'Platinum', nextMin: 3500 },
    { level: 'Platinum', min: 3500, max: null, icon: '💎', color: '#e5e4e2', next: null,       nextMin: null }
  ];
  var current = levels[0];
  for (var i = 0; i < levels.length; i++) {
    if (levels[i].max === null || p <= levels[i].max) { current = levels[i]; break; }
  }
  var pointsNeeded = current.nextMin !== null ? current.nextMin - p : 0;
  return {
    level: current.level,
    nextLevel: current.next,
    pointsNeeded: pointsNeeded,
    icon: current.icon,
    color: current.color,
    currentPoints: p,
    minPoints: current.min,
    maxPoints: current.max
  };
}

// ===================== STREAKS SYSTEM =====================

function recordStudentStreak(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var key = 'BSA_STREAK_' + stuId;
    var raw = props.getProperty(key);
    var data = raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (data.lastDate === today) {
      return { success: true, streak: data.streak, isNewDay: false, message: 'تم تسجيل حضورك اليوم مسبقاً' };
    }
    var yesterday = Utilities.formatDate(new Date(new Date().getTime() - 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var newStreak = (data.lastDate === yesterday) ? data.streak + 1 : 1;
    data.streak = newStreak;
    data.lastDate = today;
    props.setProperty(key, JSON.stringify(data));
    var message = newStreak === 1 ? 'مرحباً بك! بدأت سلسلة جديدة' : 'رائع! سلسلتك الآن ' + newStreak + ' يوم متواصل';
    return { success: true, streak: newStreak, isNewDay: true, message: message };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getStudentStreak(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('BSA_STREAK_' + stuId);
    var data = raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };
    return { success: true, streak: data.streak, lastDate: data.lastDate };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== ACHIEVEMENTS SYSTEM =====================

var ACHIEVEMENTS_DEF = [
  { id: 'firstLogin',    title: 'أول خطوة',          desc: 'سجّل دخولك للأكاديمية',           icon: '🚀', points: 10  },
  { id: 'firstLecture', title: 'المتعلم الجديد',     desc: 'شاهد أول محاضرة',                icon: '🎓', points: 15  },
  { id: 'firstQuiz',    title: 'الاختبار الأول',      desc: 'أكمل أول اختبار',                icon: '📝', points: 15  },
  { id: 'firstTask',    title: 'المهمة الأولى',       desc: 'سلّم أول مهمة',                  icon: '✅', points: 15  },
  { id: 'streak3',      title: 'ثلاثة أيام متواصلة', desc: 'حافظ على سلسلة 3 أيام',          icon: '🔥', points: 20  },
  { id: 'streak7',      title: 'أسبوع كامل',         desc: 'حافظ على سلسلة 7 أيام',          icon: '⚡', points: 50  },
  { id: 'streak30',     title: 'شهر التميز',          desc: 'حافظ على سلسلة 30 يوم',          icon: '💪', points: 200 },
  { id: 'points100',    title: 'مئة نقطة',            desc: 'اجمع 100 نقطة',                  icon: '💯', points: 10  },
  { id: 'points500',    title: 'نصف الألف',           desc: 'اجمع 500 نقطة',                  icon: '⭐', points: 25  },
  { id: 'points1000',   title: 'الألفية الأولى',      desc: 'اجمع 1000 نقطة',                 icon: '🌟', points: 50  },
  { id: 'points3000',   title: 'بطل النقاط',          desc: 'اجمع 3000 نقطة',                 icon: '🏆', points: 100 },
  { id: 'lectures5',    title: 'طالب نشيط',           desc: 'شاهد 5 محاضرات',                 icon: '📚', points: 30  },
  { id: 'lectures10',   title: 'المتعلم المثابر',     desc: 'شاهد 10 محاضرات',                icon: '📖', points: 60  },
  { id: 'quizzes5',     title: 'عقل متقد',            desc: 'أكمل 5 اختبارات',                icon: '🧠', points: 40  },
  { id: 'tasks5',       title: 'المنجز',              desc: 'سلّم 5 مهام',                    icon: '🎯', points: 40  },
  { id: 'perfectQuiz',  title: 'الكمال',              desc: 'احصل على علامة كاملة في اختبار', icon: '💎', points: 75  },
  { id: 'allLectures',  title: 'الختم الذهبي',        desc: 'شاهد جميع محاضرات الراوند',      icon: '🥇', points: 150 }
];

function getMyAchievements(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('BSA_ACH_' + stuId);
    var earned = raw ? JSON.parse(raw) : [];
    var earnedIds = earned.map(function(a) { return a.id; });
    var earnedFull = ACHIEVEMENTS_DEF.filter(function(a) { return earnedIds.indexOf(a.id) !== -1; }).map(function(a) {
      var rec = earned.find(function(e) { return e.id === a.id; });
      return Object.assign({}, a, { earnedAt: rec ? rec.earnedAt : null });
    });
    var pending = ACHIEVEMENTS_DEF.filter(function(a) { return earnedIds.indexOf(a.id) === -1; });
    return { success: true, earned: earnedFull, pending: pending, totalEarned: earnedFull.length, total: ACHIEVEMENTS_DEF.length };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function checkAndAwardAchievements(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('BSA_ACH_' + stuId);
    var earned = raw ? JSON.parse(raw) : [];
    var earnedIds = earned.map(function(a) { return a.id; });

    var streakRaw = props.getProperty('BSA_STREAK_' + stuId);
    var streakData = streakRaw ? JSON.parse(streakRaw) : { streak: 0 };
    var streak = streakData.streak || 0;

    var progressSh = getSheet('Academy_Progress');
    var quizSh = getSheet('Academy_Quiz_Results');
    var taskSh = getSheet('Academy_Tasks');

    var lectureCount = 0, quizCount = 0, taskCount = 0, totalPoints = 0, hasPerfect = false;

    if (progressSh) {
      var pData = progressSh.getDataRange().getValues();
      for (var i = 1; i < pData.length; i++) {
        if ((pData[i][0] || '').toString() === stuId.toString()) {
          if ((pData[i][3] || '').toString().toLowerCase() === 'true' || pData[i][3] === true) lectureCount++;
          totalPoints += parseInt(pData[i][5]) || 0;
        }
      }
    }
    if (quizSh) {
      var qData = quizSh.getDataRange().getValues();
      for (var j = 1; j < qData.length; j++) {
        if ((qData[j][0] || '').toString() === stuId.toString()) {
          quizCount++;
          var score = parseFloat(qData[j][4]) || 0;
          var maxScore = parseFloat(qData[j][5]) || 100;
          if (score >= maxScore && maxScore > 0) hasPerfect = true;
        }
      }
    }
    if (taskSh) {
      var tData = taskSh.getDataRange().getValues();
      for (var k = 1; k < tData.length; k++) {
        if ((tData[k][0] || '').toString() === stuId.toString() && (tData[k][5] || '').toString().toLowerCase() === 'submitted') {
          taskCount++;
        }
      }
    }

    var checks = {
      firstLogin:    earned.length > 0 || true,
      firstLecture:  lectureCount >= 1,
      firstQuiz:     quizCount >= 1,
      firstTask:     taskCount >= 1,
      streak3:       streak >= 3,
      streak7:       streak >= 7,
      streak30:      streak >= 30,
      points100:     totalPoints >= 100,
      points500:     totalPoints >= 500,
      points1000:    totalPoints >= 1000,
      points3000:    totalPoints >= 3000,
      lectures5:     lectureCount >= 5,
      lectures10:    lectureCount >= 10,
      quizzes5:      quizCount >= 5,
      tasks5:        taskCount >= 5,
      perfectQuiz:   hasPerfect,
      allLectures:   false
    };

    var now = new Date().toISOString();
    var newlyAwarded = [];
    ACHIEVEMENTS_DEF.forEach(function(ach) {
      if (earnedIds.indexOf(ach.id) === -1 && checks[ach.id]) {
        earned.push({ id: ach.id, earnedAt: now });
        newlyAwarded.push(Object.assign({}, ach, { earnedAt: now }));
      }
    });

    if (newlyAwarded.length > 0) {
      props.setProperty('BSA_ACH_' + stuId, JSON.stringify(earned));
    }
    return { success: true, newlyAwarded: newlyAwarded, totalEarned: earned.length };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== DM SYSTEM =====================

var ACAD_DMS = 'Academy_DMs';

function _getOrCreateDMSheet() {
  var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var sh = masterSS.getSheetByName(ACAD_DMS);
  if (!sh) {
    sh = masterSS.insertSheet(ACAD_DMS);
    sh.appendRow(['MsgId', 'FromId', 'FromName', 'ToId', 'ToName', 'Message', 'Timestamp', 'ReadAt']);
  }
  return sh;
}

function sendDM(userToken, toUserId, message) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    if (!toUserId || !message || message.toString().trim() === '') return { success: false, message: 'الرسالة فارغة' };
    if (stuId.toString() === toUserId.toString()) return { success: false, message: 'لا يمكنك مراسلة نفسك' };

    var stuSh = getSheet('Academy_Students');
    var fromName = 'مستخدم';
    var toName = 'مستخدم';
    if (stuSh) {
      var sData = stuSh.getDataRange().getValues();
      for (var i = 1; i < sData.length; i++) {
        if ((sData[i][0] || '').toString() === stuId.toString()) fromName = (sData[i][1] || 'مستخدم').toString();
        if ((sData[i][0] || '').toString() === toUserId.toString()) toName = (sData[i][1] || 'مستخدم').toString();
      }
    }

    var sh = _getOrCreateDMSheet();
    var msgId = 'dm_' + stuId + '_' + Date.now();
    var now = new Date().toISOString();
    sh.appendRow([msgId, stuId, fromName, toUserId, toName, message.toString().trim(), now, '']);
    return { success: true, message: 'تم إرسال الرسالة', msgId: msgId };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getConversations(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var sh = _getOrCreateDMSheet();
    var data = sh.getDataRange().getValues();
    var convMap = {};
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var fromId = (row[1] || '').toString();
      var toId = (row[3] || '').toString();
      if (fromId !== stuId.toString() && toId !== stuId.toString()) continue;
      var otherId = fromId === stuId.toString() ? toId : fromId;
      var otherName = fromId === stuId.toString() ? (row[4] || '').toString() : (row[2] || '').toString();
      if (!convMap[otherId]) convMap[otherId] = { userId: otherId, name: otherName, messages: [], unread: 0 };
      convMap[otherId].messages.push({ msgId: row[0], fromId: fromId, message: (row[5] || '').toString(), timestamp: (row[6] || '').toString(), readAt: (row[7] || '').toString() });
      if (toId === stuId.toString() && !(row[7] || '').toString()) convMap[otherId].unread++;
    }
    var conversations = Object.keys(convMap).map(function(uid) {
      var c = convMap[uid];
      var sorted = c.messages.sort(function(a, b) { return a.timestamp > b.timestamp ? 1 : -1; });
      return { userId: c.userId, name: c.name, lastMessage: sorted[sorted.length - 1], unread: c.unread };
    });
    conversations.sort(function(a, b) {
      var ta = a.lastMessage ? a.lastMessage.timestamp : '';
      var tb = b.lastMessage ? b.lastMessage.timestamp : '';
      return ta > tb ? -1 : 1;
    });
    return { success: true, conversations: conversations };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getDMHistory(userToken, withUserId) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    if (!withUserId) return { success: false, message: 'يجب تحديد المستخدم' };
    var sh = _getOrCreateDMSheet();
    var data = sh.getDataRange().getValues();
    var messages = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var fromId = (row[1] || '').toString();
      var toId = (row[3] || '').toString();
      var between = (fromId === stuId.toString() && toId === withUserId.toString()) ||
                    (fromId === withUserId.toString() && toId === stuId.toString());
      if (!between) continue;
      messages.push({ msgId: (row[0] || '').toString(), fromId: fromId, fromName: (row[2] || '').toString(), toId: toId, message: (row[5] || '').toString(), timestamp: (row[6] || '').toString(), readAt: (row[7] || '').toString(), isMine: fromId === stuId.toString() });
    }
    messages.sort(function(a, b) { return a.timestamp > b.timestamp ? 1 : -1; });
    return { success: true, messages: messages };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function markDMsRead(userToken, withUserId) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var sh = _getOrCreateDMSheet();
    var data = sh.getDataRange().getValues();
    var now = new Date().toISOString();
    var updated = 0;
    for (var i = 1; i < data.length; i++) {
      var fromId = (data[i][1] || '').toString();
      var toId = (data[i][3] || '').toString();
      var readAt = (data[i][7] || '').toString();
      if (fromId === withUserId.toString() && toId === stuId.toString() && !readAt) {
        sh.getRange(i + 1, 8).setValue(now);
        updated++;
      }
    }
    return { success: true, markedRead: updated };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function searchUsers(userToken, query) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    if (!query || query.toString().trim().length < 2) return { success: false, message: 'الاستعلام قصير جداً' };
    var q = query.toString().trim().toLowerCase();
    var stuSh = getSheet('Academy_Students');
    if (!stuSh) return { success: false, message: 'خطأ في النظام' };
    var data = stuSh.getDataRange().getValues();
    var results = [];
    var props = PropertiesService.getScriptProperties();
    for (var i = 1; i < data.length; i++) {
      var id = (data[i][0] || '').toString();
      if (id === stuId.toString()) continue;
      var name = (data[i][1] || '').toString();
      var role = (data[i][7] || 'student').toString();
      var username = (data[i][2] || '').toString();
      if (name.toLowerCase().indexOf(q) !== -1 || id.toLowerCase().indexOf(q) !== -1 || username.toLowerCase().indexOf(q) !== -1) {
        var online = isUserOnline(id);
        results.push({ id: id, name: name, role: role, online: online });
      }
      if (results.length >= 20) break;
    }
    return { success: true, users: results };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== FRIENDS/CONTACTS SYSTEM =====================

var ACAD_FRIENDS = 'Academy_Friends';

function _getOrCreateFriendsSheet() {
  var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var sh = masterSS.getSheetByName(ACAD_FRIENDS);
  if (!sh) {
    sh = masterSS.insertSheet(ACAD_FRIENDS);
    sh.appendRow(['UserId', 'FriendId', 'Status', 'CreatedAt']);
  }
  return sh;
}

function updateOnlineStatus(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false };
    PropertiesService.getScriptProperties().setProperty('BSA_ONLINE_' + stuId, new Date().toISOString());
    return { success: true };
  } catch(e) { return { success: false }; }
}

function isUserOnline(userId) {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty('BSA_ONLINE_' + userId);
    if (!raw) return false;
    var diff = (new Date() - new Date(raw)) / 1000;
    return diff < 180;
  } catch(e) { return false; }
}

function sendFriendRequest(userToken, targetId) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    if (!targetId || stuId.toString() === targetId.toString()) return { success: false, message: 'طلب غير صالح' };
    var sh = _getOrCreateFriendsSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var uid = (data[i][0] || '').toString();
      var fid = (data[i][1] || '').toString();
      var st = (data[i][2] || '').toString();
      if ((uid === stuId.toString() && fid === targetId.toString()) ||
          (uid === targetId.toString() && fid === stuId.toString())) {
        if (st === 'accepted') return { success: false, message: 'أنتما أصدقاء بالفعل' };
        if (st === 'pending') return { success: false, message: 'طلب صداقة موجود بالفعل' };
      }
    }
    sh.appendRow([stuId, targetId, 'pending', new Date().toISOString()]);
    return { success: true, message: 'تم إرسال طلب الصداقة' };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function acceptFriendRequest(userToken, fromId) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var sh = _getOrCreateFriendsSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString() === fromId.toString() &&
          (data[i][1] || '').toString() === stuId.toString() &&
          (data[i][2] || '').toString() === 'pending') {
        sh.getRange(i + 1, 3).setValue('accepted');
        return { success: true, message: 'تم قبول طلب الصداقة' };
      }
    }
    return { success: false, message: 'لم يتم العثور على طلب الصداقة' };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function removeFriend(userToken, friendId) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var sh = _getOrCreateFriendsSheet();
    var data = sh.getDataRange().getValues();
    var rowsToDelete = [];
    for (var i = 1; i < data.length; i++) {
      var uid = (data[i][0] || '').toString();
      var fid = (data[i][1] || '').toString();
      if ((uid === stuId.toString() && fid === friendId.toString()) ||
          (uid === friendId.toString() && fid === stuId.toString())) {
        rowsToDelete.push(i + 1);
      }
    }
    for (var r = rowsToDelete.length - 1; r >= 0; r--) {
      sh.deleteRow(rowsToDelete[r]);
    }
    return { success: true, message: 'تم حذف الصديق' };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getFriends(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var sh = _getOrCreateFriendsSheet();
    var data = sh.getDataRange().getValues();
    var stuSh = getSheet('Academy_Students');
    var studentMap = {};
    if (stuSh) {
      var sData = stuSh.getDataRange().getValues();
      for (var j = 1; j < sData.length; j++) {
        studentMap[(sData[j][0] || '').toString()] = { name: (sData[j][1] || '').toString(), role: (sData[j][7] || 'student').toString() };
      }
    }
    var friends = [];
    for (var i = 1; i < data.length; i++) {
      var uid = (data[i][0] || '').toString();
      var fid = (data[i][1] || '').toString();
      var st = (data[i][2] || '').toString();
      if (st !== 'accepted') continue;
      var otherId = uid === stuId.toString() ? fid : (fid === stuId.toString() ? uid : null);
      if (!otherId) continue;
      var info = studentMap[otherId] || { name: 'مستخدم', role: 'student' };
      friends.push({ id: otherId, name: info.name, role: info.role, online: isUserOnline(otherId), since: (data[i][3] || '').toString() });
    }
    return { success: true, friends: friends };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getPendingRequests(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var sh = _getOrCreateFriendsSheet();
    var data = sh.getDataRange().getValues();
    var stuSh = getSheet('Academy_Students');
    var studentMap = {};
    if (stuSh) {
      var sData = stuSh.getDataRange().getValues();
      for (var j = 1; j < sData.length; j++) {
        studentMap[(sData[j][0] || '').toString()] = (sData[j][1] || '').toString();
      }
    }
    var pending = [];
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1] || '').toString() === stuId.toString() && (data[i][2] || '').toString() === 'pending') {
        var fromId = (data[i][0] || '').toString();
        pending.push({ fromId: fromId, fromName: studentMap[fromId] || 'مستخدم', requestedAt: (data[i][3] || '').toString() });
      }
    }
    return { success: true, requests: pending };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== LIVE SESSIONS =====================

var ACAD_LIVE_SESSIONS = 'Academy_LiveSessions';
// 2026-07-06: attendance for online live sessions — separate from Rounds_Attendance (which is keyed by
// a lecture NUMBER from Academy_Content and drives the in-person QR system) because a live session here
// is keyed by its own SessionId, not a lecture number. One row per (session, student) — "did they click
// Join" is the attendance signal for online batches (no physical QR scan is possible).
var ACAD_LIVE_SESSION_ATTENDANCE = 'Academy_LiveSession_Attendance';

function _getOrCreateLiveSessionAttendanceSheet() {
  var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var sh = masterSS.getSheetByName(ACAD_LIVE_SESSION_ATTENDANCE);
  if (!sh) {
    sh = masterSS.insertSheet(ACAD_LIVE_SESSION_ATTENDANCE);
    sh.appendRow(['SessionId', 'RoundId', 'StudentId', 'StudentName', 'JoinedAt']);
  }
  return sh;
}

// Called when a student clicks "انضم للجلسة" — records that THEY (specifically, not just "someone")
// joined this exact live session, then hands back the meeting link for the frontend to redirect to.
// This is the actual answer to "أعرف مين حضر ومين لأ" for online batches.
function joinLiveSession(userToken, sessionId) {
  try {
    var sess = validateAcadSession(userToken);
    if (!sess) return { success: false, message: 'يرجى تسجيل الدخول للبورتال أولاً' };
    if (!sessionId) return { success: false, message: 'معرّف الجلسة مطلوب' };
    if (sess.role === 'instructor') return { success: false, message: 'انضمام المحاضر بيتم مباشرة من رابط الجلسة' };

    var lsSh = _getOrCreateLiveSessionsSheet();
    var lsData = lsSh.getDataRange().getValues();
    var session = null;
    for (var i = 1; i < lsData.length; i++) {
      if ((lsData[i][0] || '').toString() === sessionId.toString()) {
        session = { roundId: (lsData[i][1] || '').toString(), meetLink: (lsData[i][4] || '').toString() };
        break;
      }
    }
    if (!session) return { success: false, message: 'الجلسة غير موجودة' };
    if (!session.meetLink) return { success: false, message: 'لا يوجد رابط لهذه الجلسة' };

    var stuSh = getSheet('Academy_Students');
    var stuName = sess.id, stuPhone = '';
    if (stuSh) {
      var stuData = stuSh.getDataRange().getValues();
      for (var s = 1; s < stuData.length; s++) {
        if ((stuData[s][0] || '').toString() === sess.id.toString()) {
          stuName = (stuData[s][1] || '').toString();
          stuPhone = (stuData[s][4] || '').toString().trim();
          break;
        }
      }
    }

    // Confirm the student actually belongs to this session's round — uses the SAME check
    // getLiveSessionsByRounds() uses to decide what a student can even see (a Rounds_Attendance row for
    // their phone under this roundId), so "can see it" and "can join it" can never disagree.
    var isEnrolled = false;
    if (stuPhone) {
      var masterSS2 = SpreadsheetApp.openById(MASTER_SHEET_ID);
      var attSh2 = masterSS2.getSheetByName('Rounds_Attendance');
      if (attSh2) {
        var attData2 = attSh2.getDataRange().getValues();
        var normStuPhone = _normAttPhone(stuPhone);
        for (var e = 1; e < attData2.length; e++) {
          if ((attData2[e][0] || '').toString() === session.roundId && _normAttPhone(attData2[e][1]) === normStuPhone) { isEnrolled = true; break; }
        }
      }
    }
    if (!isEnrolled) return { success: false, message: 'أنت مش مسجّل في راوند هذه الجلسة' };

    var attSh = _getOrCreateLiveSessionAttendanceSheet();
    var attData = attSh.getDataRange().getValues();
    var already = false;
    for (var a = 1; a < attData.length; a++) {
      if ((attData[a][0] || '').toString() === sessionId.toString() && (attData[a][2] || '').toString() === sess.id.toString()) { already = true; break; }
    }
    if (!already) attSh.appendRow([sessionId.toString(), session.roundId, sess.id.toString(), stuName, new Date()]);

    return { success: true, meetLink: session.meetLink, alreadyJoined: already };
  } catch (e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// Instructor/admin-facing: who actually clicked "join" for a given live session.
function getLiveSessionAttendees(adminToken, sessionId) {
  try {
    var sess = validateAcadSession(adminToken);
    if (!sess) return { success: false, message: 'غير مصرح' };
    if (!sessionId) return { success: false, message: 'معرّف الجلسة مطلوب' };
    var attSh = _getOrCreateLiveSessionAttendanceSheet();
    var data = attSh.getDataRange().getValues();
    var attendees = [];
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString() === sessionId.toString()) {
        attendees.push({
          studentId: (data[i][2] || '').toString(),
          studentName: (data[i][3] || '').toString(),
          joinedAt: data[i][4] ? new Date(data[i][4]).toISOString() : ''
        });
      }
    }
    attendees.sort(function (a, b) { return a.joinedAt < b.joinedAt ? -1 : 1; });
    return { success: true, attendees: attendees, count: attendees.length };
  } catch (e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function _getOrCreateLiveSessionsSheet() {
  var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var sh = masterSS.getSheetByName(ACAD_LIVE_SESSIONS);
  if (!sh) {
    sh = masterSS.insertSheet(ACAD_LIVE_SESSIONS);
    sh.appendRow(['SessionId', 'RoundId', 'RoundName', 'Title', 'MeetLink', 'Platform', 'StartTime', 'EndTime', 'CreatedBy', 'CreatedAt']);
  }
  return sh;
}

function createLiveSession(adminToken, roundId, roundName, title, meetLink, platform, startTime, endTime) {
  try {
    var _lsS1 = validateAcadSession(adminToken);
    if (!_lsS1) return { success: false, message: 'غير مصرح' };
    var adminId = _lsS1.id;
    if (!roundId || !title || !meetLink || !startTime) return { success: false, message: 'بيانات ناقصة' };
    var validPlatforms = ['Zoom', 'Meet', 'Teams', 'Other'];
    var plat = validPlatforms.indexOf(platform) !== -1 ? platform : 'Other';
    var sh = _getOrCreateLiveSessionsSheet();
    // BUG FIX (2026-07-06): sessionId used to be just 'live_'+timestamp (millisecond resolution) — two
    // sessions created in the same millisecond (e.g. an instructor adding sessions for two different
    // online batches back-to-back) got the SAME sessionId, and every lookup by sessionId
    // (joinLiveSession, getLiveSessionAttendees, deleteLiveSession) matches the FIRST row it finds —
    // silently operating on the wrong batch's session. Same bug class as the quiz attemptId collision
    // fixed earlier; same fix (random suffix).
    var sessionId = 'live_' + Date.now() + '_' + Math.floor(Math.random() * 1e9);
    var now = new Date().toISOString();
    sh.appendRow([sessionId, roundId.toString(), (roundName || '').toString(), title.toString().trim(), meetLink.toString().trim(), plat, startTime.toString(), (endTime || '').toString(), adminId, now]);
    return { success: true, sessionId: sessionId, message: 'تم إنشاء الجلسة المباشرة' };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getLiveSessions(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var enrollSh = getSheet('Academy_Enrollments');
    var enrolledRounds = [];
    if (enrollSh) {
      var eData = enrollSh.getDataRange().getValues();
      for (var j = 1; j < eData.length; j++) {
        if ((eData[j][0] || '').toString() === stuId.toString() && (eData[j][3] || '').toString().toLowerCase() === 'active') {
          enrolledRounds.push((eData[j][1] || '').toString());
        }
      }
    }
    var sh = _getOrCreateLiveSessionsSheet();
    var data = sh.getDataRange().getValues();
    var now = new Date();
    var sessions = [];
    for (var i = 1; i < data.length; i++) {
      var rId = (data[i][1] || '').toString();
      if (enrolledRounds.indexOf(rId) === -1) continue;
      var startTime = data[i][6] ? new Date(data[i][6]) : null;
      var endTime = data[i][7] ? new Date(data[i][7]) : null;
      var isActive = startTime && startTime <= now && (!endTime || endTime >= now);
      var isUpcoming = startTime && startTime > now;
      if (!isActive && !isUpcoming) continue;
      sessions.push({ sessionId: (data[i][0] || '').toString(), roundId: rId, roundName: (data[i][2] || '').toString(), title: (data[i][3] || '').toString(), meetLink: (data[i][4] || '').toString(), platform: (data[i][5] || '').toString(), startTime: (data[i][6] || '').toString(), endTime: (data[i][7] || '').toString(), isActive: isActive, isUpcoming: isUpcoming });
    }
    sessions.sort(function(a, b) { return a.startTime > b.startTime ? 1 : -1; });
    return { success: true, sessions: sessions };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getAllLiveSessions(adminToken) {
  try {
    var _lsS2 = validateAcadSession(adminToken);
    if (!_lsS2) return { success: false, message: 'غير مصرح' };
    var adminId = _lsS2.id;
    var sh = _getOrCreateLiveSessionsSheet();
    var data = sh.getDataRange().getValues();
    var now = new Date();
    var sessions = [];
    for (var i = 1; i < data.length; i++) {
      var startTime = data[i][6] ? new Date(data[i][6]) : null;
      var endTime = data[i][7] ? new Date(data[i][7]) : null;
      var isActive = startTime && startTime <= now && (!endTime || endTime >= now);
      sessions.push({ sessionId: (data[i][0] || '').toString(), roundId: (data[i][1] || '').toString(), roundName: (data[i][2] || '').toString(), title: (data[i][3] || '').toString(), meetLink: (data[i][4] || '').toString(), platform: (data[i][5] || '').toString(), startTime: (data[i][6] || '').toString(), endTime: (data[i][7] || '').toString(), createdBy: (data[i][8] || '').toString(), createdAt: (data[i][9] || '').toString(), isActive: isActive });
    }
    sessions.sort(function(a, b) { return a.startTime > b.startTime ? -1 : 1; });
    return { success: true, sessions: sessions };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function deleteLiveSession(adminToken, sessionId) {
  try {
    var _lsS3 = validateAcadSession(adminToken);
    if (!_lsS3) return { success: false, message: 'غير مصرح' };
    var adminId = _lsS3.id;
    if (!sessionId) return { success: false, message: 'معرّف الجلسة مطلوب' };
    var sh = _getOrCreateLiveSessionsSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString() === sessionId.toString()) {
        sh.deleteRow(i + 1);
        return { success: true, message: 'تم حذف الجلسة' };
      }
    }
    return { success: false, message: 'الجلسة غير موجودة' };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getActiveSessionsNow(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var enrollSh = getSheet('Academy_Enrollments');
    var enrolledRounds = [];
    if (enrollSh) {
      var eData = enrollSh.getDataRange().getValues();
      for (var j = 1; j < eData.length; j++) {
        if ((eData[j][0] || '').toString() === stuId.toString() && (eData[j][3] || '').toString().toLowerCase() === 'active') {
          enrolledRounds.push((eData[j][1] || '').toString());
        }
      }
    }
    var sh = _getOrCreateLiveSessionsSheet();
    var data = sh.getDataRange().getValues();
    var now = new Date();
    var active = [];
    for (var i = 1; i < data.length; i++) {
      var rId = (data[i][1] || '').toString();
      if (enrolledRounds.indexOf(rId) === -1) continue;
      var startTime = data[i][6] ? new Date(data[i][6]) : null;
      var endTime = data[i][7] ? new Date(data[i][7]) : null;
      if (startTime && startTime <= now && (!endTime || endTime >= now)) {
        active.push({ sessionId: (data[i][0] || '').toString(), roundId: rId, title: (data[i][3] || '').toString(), meetLink: (data[i][4] || '').toString(), platform: (data[i][5] || '').toString() });
      }
    }
    return { success: true, activeSessions: active, hasActive: active.length > 0 };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== WEEKLY CHALLENGES =====================

var WEEKLY_CHALLENGES_DEF = [
  { id: 'wc_lectures', title: 'المتعلم الأسبوعي', desc: 'شاهد 3 محاضرات هذا الأسبوع', icon: '📚', target: 3, type: 'lectures', points: 50 },
  { id: 'wc_quizzes',  title: 'عقل التحدي',       desc: 'أكمل اختبارَيْن هذا الأسبوع',  icon: '🧠', target: 2, type: 'quizzes',  points: 40 },
  { id: 'wc_community',title: 'صوت المجتمع',       desc: 'أرسل 5 مشاركات في المجتمع',   icon: '💬', target: 5, type: 'community', points: 30 }
];

function _getWeekNumber(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getChallenges(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var now = new Date();
    var weekNum = _getWeekNumber(now);
    var weekYear = now.getFullYear();
    var weekKey = weekYear + '_W' + weekNum;
    var weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    var day = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - (day - 1));
    var weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    var lectureCount = 0, quizCount = 0, communityCount = 0;

    var progressSh = getSheet('Academy_Progress');
    if (progressSh) {
      var pData = progressSh.getDataRange().getValues();
      for (var i = 1; i < pData.length; i++) {
        if ((pData[i][0] || '').toString() !== stuId.toString()) continue;
        var updatedAt = pData[i][6] ? new Date(pData[i][6]) : null;
        if (updatedAt && updatedAt >= weekStart && updatedAt < weekEnd) {
          if ((pData[i][3] || '').toString().toLowerCase() === 'true' || pData[i][3] === true) lectureCount++;
        }
      }
    }

    var quizSh = getSheet('Academy_Quiz_Results');
    if (quizSh) {
      var qData = quizSh.getDataRange().getValues();
      for (var j = 1; j < qData.length; j++) {
        if ((qData[j][0] || '').toString() !== stuId.toString()) continue;
        var submittedAt = qData[j][6] ? new Date(qData[j][6]) : null;
        if (submittedAt && submittedAt >= weekStart && submittedAt < weekEnd) quizCount++;
      }
    }

    var commSh = getSheet('Academy_Community');
    if (commSh) {
      var cData = commSh.getDataRange().getValues();
      for (var k = 1; k < cData.length; k++) {
        if ((cData[k][0] || '').toString() !== stuId.toString()) continue;
        var postedAt = cData[k][5] ? new Date(cData[k][5]) : null;
        if (postedAt && postedAt >= weekStart && postedAt < weekEnd) communityCount++;
      }
    }

    var progress = { lectures: lectureCount, quizzes: quizCount, community: communityCount };

    var challenges = WEEKLY_CHALLENGES_DEF.map(function(ch) {
      var current = progress[ch.type] || 0;
      var done = current >= ch.target;
      return { id: ch.id, title: ch.title, desc: ch.desc, icon: ch.icon, target: ch.target, current: current, done: done, points: ch.points, weekKey: weekKey };
    });

    return { success: true, challenges: challenges, weekKey: weekKey, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ═══════════════════════════════════════════════════════════════════════════
// FRONTEND-FACING WRAPPERS — bridge name differences between UI and backend
// ═══════════════════════════════════════════════════════════════════════════

function sendDMMessage(userToken, toUserId, text) {
  try {
    var res = sendDM(userToken, toUserId, text);
    if (!res || !res.success) return res || { success: false, message: 'فشل الإرسال' };
    var stuId = validateAcadToken(userToken);
    var stuName = '';
    var stuSh = getSheet('Academy_Students');
    if (stuSh) {
      var sData = stuSh.getDataRange().getValues();
      for (var i = 1; i < sData.length; i++) {
        if ((sData[i][0] || '').toString() === stuId.toString()) { stuName = (sData[i][1] || '').toString(); break; }
      }
    }
    return { success: true, message: { fromId: stuId ? stuId.toString() : '', fromName: stuName, fromPic: '', text: text.toString().trim(), ts: new Date().toISOString() } };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

function getDMHistoryNorm(userToken, withUserId) {
  try {
    var full = getDMHistory(userToken, withUserId);
    if (!full || !full.success) return { success: false, messages: [] };
    var mapped = (full.messages || []).map(function(m) {
      return { fromId: m.fromId, fromName: m.fromName, fromPic: '', text: m.message || '', ts: m.timestamp || '' };
    });
    return { success: true, messages: mapped };
  } catch(e) { return { success: false, messages: [] }; }
}

function getDMHistorySince(userToken, withUserId, sinceTs) {
  try {
    var full = getDMHistory(userToken, withUserId);
    if (!full || !full.success) return { success: false, messages: [] };
    var since = sinceTs ? new Date(sinceTs) : null;
    var filtered = (full.messages || []).filter(function(m) {
      if (!since) return true;
      var mDate = m.timestamp ? new Date(m.timestamp) : null;
      return mDate && mDate > since;
    }).map(function(m) {
      return { fromId: m.fromId, fromName: m.fromName, fromPic: '', text: m.message || '', ts: m.timestamp || '' };
    });
    return { success: true, messages: filtered };
  } catch(e) { return { success: false, messages: [] }; }
}

function searchAcadUsers(userToken, query) {
  return searchUsers(userToken, query);
}

function addLiveSession(adminToken, payload) {
  try {
    if (!payload) return { success: false, message: 'بيانات ناقصة' };
    // BUG FIX (2026-07-06): this used to accept a free-typed round NAME and derive a fake roundId by
    // slugifying it ('round_' + name...) when no real roundId was sent. That fake id could never match
    // a real Round's ID in Academy_Enrollments, so getLiveSessionsByRounds()/getLiveSessions() (which
    // filter students by their REAL enrolled roundId) would show the session to NO ONE — a silent
    // "nothing broke, but nobody sees it" failure. Now requires a real roundId (from the Rounds sheet,
    // picked via a dropdown on the frontend instead of free text).
    if (!payload.roundId) return { success: false, message: 'اختر الراوند من القائمة' };
    var roundName = payload.roundName || '';
    if (!roundName) {
      try {
        var rl = getAcademyRoundsList();
        for (var i = 0; i < rl.length; i++) { if (rl[i].id === payload.roundId.toString()) { roundName = rl[i].name; break; } }
      } catch (e2) {}
    }
    return createLiveSession(adminToken, payload.roundId, roundName, payload.title || '', payload.meetLink || '', payload.platform || 'Zoom', payload.startTime || '', payload.endTime || '');
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// UX nicety (2026-07-06): the user runs the SAME fixed Zoom link every week for a given online batch —
// prefill the meeting link + platform from that round's most recent live session, so they don't have to
// retype the exact same Zoom link every time they add this week's session.
function getLastLiveSessionForRound(adminToken, roundId) {
  try {
    var sess = validateAcadSession(adminToken);
    if (!sess) return { success: false };
    if (!roundId) return { success: true, meetLink: '', platform: 'Zoom' };
    var sh = _getOrCreateLiveSessionsSheet();
    var data = sh.getDataRange().getValues();
    var best = null, bestTime = 0;
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1] || '').toString() !== roundId.toString()) continue;
      var createdAt = data[i][9] ? new Date(data[i][9]).getTime() : 0;
      if (createdAt >= bestTime) { bestTime = createdAt; best = { meetLink: (data[i][4] || '').toString(), platform: (data[i][5] || 'Zoom').toString() }; }
    }
    return { success: true, meetLink: best ? best.meetLink : '', platform: best ? best.platform : 'Zoom' };
  } catch (e) { return { success: true, meetLink: '', platform: 'Zoom' }; }
}

function getStudentAchievements(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'غير مصرح' };
    var progSh = getSheet('Academy_Progress'), quizSh = getSheet('Academy_Quiz_Results');
    var taskSh = getSheet('Academy_Tasks'), stuSh = getSheet('Academy_Students');
    var joinDate = '';
    if (stuSh) {
      var sData = stuSh.getDataRange().getValues();
      for (var i = 1; i < sData.length; i++) {
        if ((sData[i][0] || '').toString() === stuId.toString()) { joinDate = sData[i][7] ? sData[i][7].toString().slice(0,10) : ''; break; }
      }
    }
    var lecturesDone = 0, firstLectureDate = '', weeklyLectures = 0;
    var now = new Date(), weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
    if (progSh) {
      var pData = progSh.getDataRange().getValues();
      for (var j = 1; j < pData.length; j++) {
        if ((pData[j][0] || '').toString() !== stuId.toString()) continue;
        if (pData[j][3] === true || (pData[j][3] || '').toString().toLowerCase() === 'true') {
          lecturesDone++;
          var dAt = pData[j][6] ? new Date(pData[j][6]) : null;
          if (dAt && (!firstLectureDate || dAt < new Date(firstLectureDate))) firstLectureDate = dAt.toISOString().slice(0,10);
          if (dAt && dAt >= weekStart) weeklyLectures++;
        }
      }
    }
    var totalQuizPassed = 0, firstQuizDate = '', weeklyQuizzes = 0;
    if (quizSh) {
      var qData = quizSh.getDataRange().getValues();
      for (var k = 1; k < qData.length; k++) {
        if ((qData[k][0] || '').toString() !== stuId.toString()) continue;
        var passed = (parseFloat(qData[k][4] || 0) >= 70) || ((qData[k][5] || '').toString().toLowerCase() === 'passed');
        if (passed) {
          totalQuizPassed++;
          var qAt = qData[k][6] ? new Date(qData[k][6]) : null;
          if (qAt && (!firstQuizDate || qAt < new Date(firstQuizDate))) firstQuizDate = qAt.toISOString().slice(0,10);
          if (qAt && qAt >= weekStart) weeklyQuizzes++;
        }
      }
    }
    var totalTasksApproved = 0, firstTaskDate = '', weeklyTasks = 0;
    if (taskSh) {
      var tData = taskSh.getDataRange().getValues();
      for (var m2 = 1; m2 < tData.length; m2++) {
        if ((tData[m2][0] || '').toString() !== stuId.toString()) continue;
        var tSt = (tData[m2][5] || '').toString().toLowerCase();
        if (tSt === 'approved' || tSt === 'accepted' || tSt === 'مقبول') {
          totalTasksApproved++;
          var tAt = tData[m2][6] ? new Date(tData[m2][6]) : null;
          if (tAt && (!firstTaskDate || tAt < new Date(firstTaskDate))) firstTaskDate = tAt.toISOString().slice(0,10);
          if (tAt && tAt >= weekStart) weeklyTasks++;
        }
      }
    }
    var totalPoints = (lecturesDone * 10) + (totalQuizPassed * 15) + (totalTasksApproved * 20);
    var streakRaw = PropertiesService.getScriptProperties().getProperty('BSA_STREAK_' + stuId);
    var currentStreak = 0, longestStreak = 0;
    if (streakRaw) { try { var sp = JSON.parse(streakRaw); currentStreak = sp.streak || 0; longestStreak = sp.longest || currentStreak; } catch(e2){} }
    var achRaw = PropertiesService.getScriptProperties().getProperty('BSA_ACH_' + stuId);
    var achievements = {};
    if (achRaw) { try { achievements = JSON.parse(achRaw); } catch(e3){} }
    return { success: true, totalPoints: totalPoints, currentStreak: currentStreak, longestStreak: longestStreak,
      lecturesDone: lecturesDone, totalQuizPassed: totalQuizPassed, totalTasksApproved: totalTasksApproved,
      hasLoggedIn: true, joinDate: joinDate, firstLectureDate: firstLectureDate, firstQuizDate: firstQuizDate,
      firstTaskDate: firstTaskDate, weeklyLectures: weeklyLectures, weeklyQuizzes: weeklyQuizzes,
      weeklyTasks: weeklyTasks, achievements: achievements };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== QR AUTO CHECK-IN =====================
function qrCheckInAuto(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'يرجى تسجيل الدخول للبورتال أولاً' };
    var stuSh = getSheet('Academy_Students');
    if (!stuSh) return { success: false, message: 'خطأ في النظام' };
    var stuData = stuSh.getDataRange().getValues();
    var student = null;
    for (var i = 1; i < stuData.length; i++) {
      if ((stuData[i][0] || '').toString() === stuId.toString()) {
        student = { name: (stuData[i][1] || '').toString(), phone: (stuData[i][4] || '').toString() };
        break;
      }
    }
    if (!student) return { success: false, message: 'لم يتم التعرف على حسابك' };
    if (!student.phone) return { success: false, message: 'لا يوجد رقم هاتف مسجل في حسابك — تواصل مع الإدارة' };
    var props = PropertiesService.getScriptProperties();
    var sessions = {};
    try { sessions = JSON.parse(props.getProperty(ATT_SESS_KEY) || '{}'); } catch(e) {}
    var sessionKeys = Object.keys(sessions);
    if (sessionKeys.length === 0) return { success: false, message: 'لا توجد جلسات مفتوحة الآن' };
    var normStudentPhone = _normAttPhone(student.phone);
    var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    var attSh = masterSS.getSheetByName('Rounds_Attendance');
    if (!attSh) return { success: false, message: 'لا توجد جلسة مفتوحة لك الآن' };
    var attData = attSh.getDataRange().getValues();
    var matchedRoundId = null;
    var matchedSession = null;
    for (var s = 0; s < sessionKeys.length; s++) {
      var rId = sessionKeys[s];
      for (var r = 1; r < attData.length; r++) {
        if ((attData[r][0] || '').toString() === rId && _normAttPhone(attData[r][1]) === normStudentPhone) {
          matchedRoundId = rId;
          matchedSession = sessions[rId];
          break;
        }
      }
      if (matchedRoundId) break;
    }
    if (!matchedRoundId) return { success: false, message: 'لا توجد جلسة مفتوحة لك الآن — تأكد من تسجيلك في راوند نشط' };
    var lectureNum = matchedSession.lectureNum;
    var existing = getAttendanceData(matchedRoundId);
    var alreadyIn = existing.some(function(a) {
      return _normAttPhone(a.phone) === normStudentPhone && (a.attended || []).indexOf(lectureNum.toString()) !== -1;
    });
    if (alreadyIn) return { success: true, message: 'حضورك مسجل مسبقاً في المحاضرة ' + lectureNum, alreadyIn: true, lectureNum: lectureNum, roundId: matchedRoundId };
    saveAttendanceData(matchedRoundId, student.phone, student.name, lectureNum, 'attendance', true);
    return { success: true, message: 'تم تسجيل حضورك في المحاضرة ' + lectureNum, lectureNum: lectureNum, studentName: student.name, roundId: matchedRoundId };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== QR ATTENDANCE PREVIEW (no write) =====================
function getAttendSessionPreview(userToken) {
  try {
    var stuId = validateAcadToken(userToken);
    if (!stuId) return { success: false, message: 'يرجى تسجيل الدخول للبورتال أولاً' };
    var stuSh = getSheet('Academy_Students');
    if (!stuSh) return { success: false, message: 'خطأ في النظام' };
    var stuData = stuSh.getDataRange().getValues();
    var student = null;
    for (var i = 1; i < stuData.length; i++) {
      if ((stuData[i][0] || '').toString() === stuId.toString()) {
        student = { name: (stuData[i][1] || '').toString(), phone: (stuData[i][4] || '').toString() };
        break;
      }
    }
    if (!student) return { success: false, message: 'لم يتم التعرف على حسابك' };
    if (!student.phone) return { success: false, message: 'لا يوجد رقم هاتف مسجل في حسابك — تواصل مع الإدارة' };
    var props = PropertiesService.getScriptProperties();
    var sessions = {};
    try { sessions = JSON.parse(props.getProperty(ATT_SESS_KEY) || '{}'); } catch(e) {}
    var sessionKeys = Object.keys(sessions);
    if (sessionKeys.length === 0) return { success: false, message: 'لا توجد جلسات مفتوحة الآن' };
    var normStudentPhone = _normAttPhone(student.phone);
    var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    var attSh = masterSS.getSheetByName('Rounds_Attendance');
    if (!attSh) return { success: false, message: 'لا توجد جلسة مفتوحة لك الآن' };
    var attData = attSh.getDataRange().getValues();
    var matchedRoundId = null, matchedSession = null;
    for (var s = 0; s < sessionKeys.length; s++) {
      var rId = sessionKeys[s];
      for (var r = 1; r < attData.length; r++) {
        if ((attData[r][0] || '').toString() === rId && _normAttPhone(attData[r][1]) === normStudentPhone) {
          matchedRoundId = rId; matchedSession = sessions[rId]; break;
        }
      }
      if (matchedRoundId) break;
    }
    if (!matchedRoundId) return { success: false, message: 'لا توجد جلسة مفتوحة لك الآن — تأكد من تسجيلك في راوند نشط' };
    var lectureNum = matchedSession.lectureNum;
    var roundName = matchedRoundId;
    try {
      var roundsSh = getSheet('Rounds');
      if (roundsSh) {
        var rData = roundsSh.getDataRange().getValues();
        for (var ri = 1; ri < rData.length; ri++) {
          if ((rData[ri][0] || '').toString() === matchedRoundId) { roundName = (rData[ri][1] || matchedRoundId).toString(); break; }
        }
      }
    } catch(e2) {}
    var existing = getAttendanceData(matchedRoundId);
    var alreadyIn = existing.some(function(a) {
      return _normAttPhone(a.phone) === normStudentPhone && (a.attended || []).indexOf(lectureNum.toString()) !== -1;
    });
    return { success: true, roundId: matchedRoundId, roundName: roundName, lectureNum: lectureNum, alreadyIn: alreadyIn };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== LIVE SESSIONS BY ROUNDS_ATTENDANCE =====================
function getLiveSessionsByRounds(userToken) {
  try {
    var _lsSess = validateAcadSession(userToken);
    if (!_lsSess) return { success: false, message: 'غير مصرح' };
    var stuId = _lsSess.id;
    var isAdminOrInstructor = (_lsSess.role === 'instructor');
    var enrolledRounds = [];
    if (!isAdminOrInstructor) {
      var stuSh = getSheet('Academy_Students');
      var studentPhone = '';
      if (stuSh) {
        var stuData = stuSh.getDataRange().getValues();
        for (var i = 1; i < stuData.length; i++) {
          if ((stuData[i][0] || '').toString() === stuId.toString()) {
            studentPhone = (stuData[i][4] || '').toString().trim();
            break;
          }
        }
      }
      if (studentPhone) {
        var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
        var attSh = masterSS.getSheetByName('Rounds_Attendance');
        if (attSh) {
          var normPhone = _normAttPhone(studentPhone);
          var attData = attSh.getDataRange().getValues();
          for (var r = 1; r < attData.length; r++) {
            if (_normAttPhone(attData[r][1]) === normPhone) {
              var rid = (attData[r][0] || '').toString().trim();
              if (rid && enrolledRounds.indexOf(rid) === -1) enrolledRounds.push(rid);
            }
          }
        }
      }
    }
    var sh = _getOrCreateLiveSessionsSheet();
    var data = sh.getDataRange().getValues();
    var now = new Date();
    var sessions = [];
    for (var j = 1; j < data.length; j++) {
      var rId2 = (data[j][1] || '').toString();
      if (!isAdminOrInstructor && enrolledRounds.indexOf(rId2) === -1) continue;
      var startTime = data[j][6] ? new Date(data[j][6]) : null;
      var endTime = data[j][7] ? new Date(data[j][7]) : null;
      var isActive = startTime && startTime <= now && (!endTime || endTime >= now);
      var isUpcoming = startTime && startTime > now;
      if (!isAdminOrInstructor && !isActive && !isUpcoming) continue;
      sessions.push({ sessionId:(data[j][0]||'').toString(), roundId:rId2, roundName:(data[j][2]||'').toString(), title:(data[j][3]||'').toString(), meetLink:(data[j][4]||'').toString(), platform:(data[j][5]||'').toString(), startTime:(data[j][6]||'').toString(), endTime:(data[j][7]||'').toString(), isActive:isActive, isUpcoming:isUpcoming });
    }
    sessions.sort(function(a, b) { return a.startTime > b.startTime ? 1 : -1; });
    return { success: true, sessions: sessions };
  } catch(e) { return { success: false, message: 'خطأ: ' + e.toString() }; }
}

// ===================== WALLET INCOME =====================
function _getOrCreateWalletIncomeSheet() {
  var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var sh = masterSS.getSheetByName('Wallet_Income');
  if (!sh) {
    sh = masterSS.insertSheet('Wallet_Income');
    sh.appendRow(['IncomeID','Date','Category','Description','Amount','Wallet','Method','By','Notes','CreatedAt']);
    sh.getRange(1,1,1,10).setBackground('#1a4a1a').setFontColor('#fff').setFontWeight('bold');
  }
  return sh;
}

function addWalletIncome(token, walletName, amount, description, category, date, method, notes) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    amount = parseFloat(amount) || 0;
    if (amount <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
    if (!walletName) return { success: false, message: 'اختر المحفظة' };
    var walletsRes = getWallets(token);
    if (!walletsRes.success) return { success: false, message: 'خطأ في الوصول للمحافظ' };
    var wallet = null;
    for (var i = 0; i < walletsRes.wallets.length; i++) {
      if (walletsRes.wallets[i].name === walletName) { wallet = walletsRes.wallets[i]; break; }
    }
    if (!wallet) return { success: false, message: 'المحفظة غير موجودة: ' + walletName };
    var newBalance = wallet.balance + amount;
    var updateRes = setWalletBalance(token, walletName, newBalance);
    if (!updateRes.success) return updateRes;
    var sh = _getOrCreateWalletIncomeSheet();
    var id = 'INC-' + new Date().getTime();
    var rowDate = date ? new Date(date) : new Date();
    sh.appendRow([id, rowDate, category||'إيراد عام', description||'', amount, walletName, method||'كاش', (_sv.user.name||_sv.user.username||''), notes||'', new Date()]);
    return { success: true, id: id, newBalance: newBalance };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getWalletIncome(token, month, year) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, rows: [] };
    var sh = _getOrCreateWalletIncomeSheet();
    var data = sh.getDataRange().getValues();
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      var amt = parseFloat(r[4]) || 0;
      if (amt <= 0) continue;
      var d = _parseAccDate(r[1]);
      if (!d) continue;
      if (month && parseInt(month) !== d.getMonth()+1) continue;
      if (year  && parseInt(year)  !== d.getFullYear())  continue;
      rows.push({ id:(r[0]||'').toString(), date:_fmtDate(d), category:(r[2]||'').toString(), desc:(r[3]||'').toString(), amount:amt, wallet:(r[5]||'').toString(), method:(r[6]||'').toString(), by:(r[7]||'').toString(), notes:(r[8]||'').toString() });
    }
    rows.reverse();
    return { success: true, rows: rows };
  } catch(e) { return { success: false, rows: [], message: e.toString() }; }
}

// ===================== INSTRUCTOR SALARY FROM WALLET =====================
function payInstructorSalaryFromWallet(token, salaryId, paymentKey, walletName, amount, payDate) {
  try {
    var _sv = validateSession(token);
    if (!_sv || !_sv.success) return { success: false, message: 'غير مصرح' };
    amount = parseFloat(amount) || 0;
    if (amount <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
    if (!walletName) return { success: false, message: 'اختر المحفظة' };
    var walletsRes = getWallets(token);
    if (!walletsRes.success) return { success: false, message: 'خطأ في الوصول للمحافظ' };
    var wallet = null;
    for (var i = 0; i < walletsRes.wallets.length; i++) {
      if (walletsRes.wallets[i].name === walletName) { wallet = walletsRes.wallets[i]; break; }
    }
    if (!wallet) return { success: false, message: 'المحفظة غير موجودة' };
    if (wallet.balance < amount) return { success: false, message: 'الرصيد غير كافي — المتاح: ' + wallet.balance.toLocaleString('ar-EG') + ' ج.م' };
    var updateRes = setWalletBalance(token, walletName, wallet.balance - amount);
    if (!updateRes.success) return updateRes;
    var salaryData = { id: salaryId };
    salaryData[paymentKey + 'Status'] = 'paid';
    salaryData[paymentKey + 'Date'] = payDate || new Date().toISOString();
    var salaryRes = updateLecturerSalaryPayment(salaryData);
    if (!salaryRes.success) {
      setWalletBalance(token, walletName, wallet.balance);
      return { success: false, message: 'فشل تحديث سجل المرتب: ' + (salaryRes.message||'') };
    }
    addAccountingExpense(token, 'مرتبات محاضرين', 'مرتب — صرف من محفظة ' + walletName, amount, payDate, walletName, 'salary_id:' + salaryId);
    return { success: true, newBalance: wallet.balance - amount };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ===================== BSA SHOWCASE PROJECTS =====================

var _BSA_SHOWCASE_SHEET = 'Academy_BSA_Showcase';

function _getBSAShowcaseSheet() {
  var ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var sh = ss.getSheetByName(_BSA_SHOWCASE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(_BSA_SHOWCASE_SHEET);
    sh.appendRow(['ProjectId','Title','Description','ImageUrl','ProjectUrl','Tags','Visible','AddedBy','AddedAt']);
    sh.getRange(1,1,1,9).setBackground('#1a1208').setFontColor('#c9a227').setFontWeight('bold');
  }
  return sh;
}

function getShowcaseSettings() {
  try {
    var props = PropertiesService.getScriptProperties();
    return {
      success: true,
      enabled: (props.getProperty('BSA_SHOWCASE_ENABLED') || 'false') === 'true',
      minLectures: parseInt(props.getProperty('BSA_SHOWCASE_MIN_LECTURES') || '0') || 0
    };
  } catch(e) { return { success: false, enabled: false, minLectures: 0 }; }
}

function saveShowcaseSettings(adminToken, enabled, minLectures) {
  try {
    var sess = validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    props.setProperty('BSA_SHOWCASE_ENABLED', enabled ? 'true' : 'false');
    props.setProperty('BSA_SHOWCASE_MIN_LECTURES', (parseInt(minLectures) || 0).toString());
    return { success: true };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function getBSAShowcaseProjects(token) {
  try {
    var sess = validateAcadSession(token);
    if (!sess) return { success: false, message: 'غير مصرح' };
    var props = PropertiesService.getScriptProperties();
    var enabled = (props.getProperty('BSA_SHOWCASE_ENABLED') || 'false') === 'true';
    var minLectures = parseInt(props.getProperty('BSA_SHOWCASE_MIN_LECTURES') || '0') || 0;
    var isAdmin = (sess.role === 'instructor');
    var sh = _getBSAShowcaseSheet();
    var data = sh.getDataRange().getValues();
    var projects = [];
    for (var k = 1; k < data.length; k++) {
      var visible = (data[k][6]||'').toString().toLowerCase() === 'true';
      if (!isAdmin && !visible) continue;
      projects.push({
        projectId: (data[k][0]||'').toString(),
        title: (data[k][1]||'').toString(),
        description: (data[k][2]||'').toString(),
        projectUrl: (data[k][4]||'').toString(),
        tags: (data[k][5]||'').toString(),
        visible: visible,
        addedAt: (data[k][8]||'').toString()
      });
    }
    return { success: true, projects: projects, enabled: enabled, minLectures: minLectures };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function addBSAShowcaseProject(adminToken, title, description, projectUrl, tags) {
  try {
    var sess = validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    if (!title || !projectUrl) return { success: false, message: 'العنوان والرابط مطلوبان' };
    var sh = _getBSAShowcaseSheet();
    var projectId = 'bsa_' + Date.now();
    var now = new Date().toISOString();
    sh.appendRow([projectId, title.toString().trim(), (description||'').toString().trim(), '', projectUrl.toString().trim(), (tags||'').toString().trim(), 'true', sess.id.toString(), now]);
    return { success: true, projectId: projectId };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function deleteBSAShowcaseProject(adminToken, projectId) {
  try {
    var sess = validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    var sh = _getBSAShowcaseSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0]||'').toString() === projectId.toString()) {
        sh.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'المشروع غير موجود' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function toggleBSAShowcaseProject(adminToken, projectId, visible) {
  try {
    var sess = validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    var sh = _getBSAShowcaseSheet();
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0]||'').toString() === projectId.toString()) {
        sh.getRange(i + 1, 7).setValue(visible ? 'true' : 'false');
        return { success: true };
      }
    }
    return { success: false, message: 'المشروع غير موجود' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// ════════════════════════════════════════════════════════════════════
// SUPPORT-ME  +  EXCEPTION-REQUESTS  (additive features — new sheets only,
// no change to any existing data / OC / financial / business logic)
// ════════════════════════════════════════════════════════════════════
var SSE_HEADERS = {
  // Hidden (col14, 2026-07-06): "remove" from the Support Me board is a soft-hide, NOT a real delete —
  // the row stays in the sheet (source of truth / history) forever, just filtered out of the board.
  "Support_Requests":  ['ID','AgentID','AgentName','ClientName','ClientPhone','ClientOC','Comment','Status','ManagerResult','CreatedAt','ResolvedAt','SupporterName','SupporterId','Hidden'],
  "Exception_Requests":['ID','AgentID','AgentName','ClientName','ClientPhone','ClientOC','Type','Details','Status','Deadline','AdminNote','CreatedAt','DecidedAt','ResolvedAt']
};
function _sseSheet(name) {
  var ss = getMaster();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(SSE_HEADERS[name] || []); }
  return sh;
}
// Elevated = manager/admin/operation/senior — these see ALL requests; everyone else only their own.
function _isElevatedUser(agentId) {
  try {
    if (!agentId) return false;
    var sh = getSheet("Users"); if (!sh) return false;
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === agentId.toString().trim()) {
        var role = (data[i][4] || "").toString().trim().toLowerCase();
        return role === "manager" || role === "admin" || role === "operation" || role === "senior";
      }
    }
  } catch (e) {}
  return false;
}
// Read-only brief history snapshot from Raw_Data (by phone, fallback OC) — no writes.
function _clientHistoryByPhone(phone, oc) {
  try {
    var ph = (phone || "").toString().replace(/\D/g, '');
    var ocK = ocKey(oc);
    var rawSh = getSheet("Raw_Data");
    if (!rawSh) return null;
    var d = rawSh.getDataRange().getValues();
    for (var i = 1; i < d.length; i++) {
      var rp = (d[i][3] || "").toString().replace(/\D/g, '');
      var ro = ocKey(d[i][14]);
      var match = (ph && rp && (rp === ph || rp.slice(-9) === ph.slice(-9))) || (ocK !== "" && ocK === ro);
      if (match) {
        return {
          name: d[i][2] || "", phone: d[i][3] || "", course: d[i][5] || "",
          status: d[i][7] || "", action: d[i][9] || "", agent: d[i][6] || "",
          notes: (d[i][8] || "").toString().slice(-500)
        };
      }
    }
  } catch (e) {}
  return null;
}

// PERF (2026-06-30): read Raw_Data ONCE and index it by phone(last-9) + OC, so the Support/Exception
// lists don't scan the whole Raw_Data sheet once PER request (that was the main slowness — N full scans).
function _buildRawIndex() {
  var idx = { byPhone9: {}, byOc: {} };
  try {
    var rawSh = getSheet("Raw_Data"); if (!rawSh) return idx;
    var d = rawSh.getDataRange().getValues();
    for (var i = 1; i < d.length; i++) {
      var rec = {
        name: d[i][2] || "", phone: d[i][3] || "", course: d[i][5] || "",
        status: d[i][7] || "", action: d[i][9] || "", agent: d[i][6] || "",
        notes: (d[i][8] || "").toString().slice(-500)
      };
      var rp = (d[i][3] || "").toString().replace(/\D/g, '');
      if (rp) { var k9 = rp.slice(-9); if (!idx.byPhone9[k9]) idx.byPhone9[k9] = rec; }
      var ro = ocKey(d[i][14]); if (ro && !idx.byOc[ro]) idx.byOc[ro] = rec;
    }
  } catch (e) {}
  return idx;
}
function _historyFromRawIndex(idx, phone, oc) {
  if (!idx) return null;
  var ph = (phone || "").toString().replace(/\D/g, '');
  if (ph) { var hit = idx.byPhone9[ph.slice(-9)]; if (hit) return hit; }
  var ocK = ocKey(oc); if (ocK && idx.byOc[ocK]) return idx.byOc[ocK];
  return null;
}

// ── Support Me ──
function addSupportRequest(agentId, agentName, clientName, clientPhone, clientOC, comment) {
  try {
    if (!comment || !comment.toString().trim()) return { success: false, message: "اكتب الكومنت المطلوب من المدير" };
    if (!clientName && !clientPhone) return { success: false, message: "حدّد العميل (اسم أو رقم موبايل)" };
    var sh = _sseSheet("Support_Requests");
    var id = genId();
    sh.appendRow([id, agentId || "", agentName || "", clientName || "", clientPhone || "", clientOC || "", comment, "Pending", "", new Date(), "", "", "", false]);
    SpreadsheetApp.flush();
    try { _appendClientHistory(clientPhone, clientOC, _histFmt("Support Me", agentName, "اتبعت للمدير في Support Me: " + comment)); } catch (he) {}
    return { success: true, id: id, message: "تم إرسال العميل للمدير ✅" };
  } catch (e) { return { success: false, message: e.toString() }; }
}
function getSupportRequests(agentId) {
  try {
    var sh = _sseSheet("Support_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(agentId);
    var tz = Session.getScriptTimeZone();
    var rawIdx = _buildRawIndex(); // single Raw_Data read shared by all rows below
    var out = [];
    for (var i = 1; i < d.length; i++) {
      if (!d[i][0]) continue;
      var isHidden = d[i][13] === true || d[i][13] === "TRUE" || d[i][13] === "true";
      if (isHidden) continue; // soft-hidden ("removed" from the board) — row stays in the sheet forever
      // Support Me is a shared board: EVERYONE sees all requests (grouped by agent on the UI) so
      // colleagues can help each other; the supporter claim marks who's working on a number.
      out.push({
        id: d[i][0].toString(), agentId: (d[i][1] || "").toString(), agentName: d[i][2] || "",
        clientName: d[i][3] || "", clientPhone: d[i][4] || "", clientOC: d[i][5] || "",
        comment: d[i][6] || "", status: d[i][7] || "Pending", result: d[i][8] || "",
        createdAt: d[i][9] ? safeFormatDate(d[i][9], tz, "yyyy-MM-dd HH:mm") : "",
        resolvedAt: d[i][10] ? safeFormatDate(d[i][10], tz, "yyyy-MM-dd HH:mm") : "",
        supporterName: (d[i][11] || "").toString(), supporterId: (d[i][12] || "").toString(),
        history: _historyFromRawIndex(rawIdx, d[i][4], d[i][5])
      });
    }
    out.reverse();
    return { success: true, elevated: elevated, items: out };
  } catch (e) { return { success: false, message: e.toString(), items: [] }; }
}
function resolveSupportRequest(id, result, adminId) {
  try {
    var sh = _sseSheet("Support_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(adminId);
    var me = (adminId || "").toString();
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        var ownerId = (d[i][1] || "").toString();
        var supporterId = (d[i][12] || "").toString();
        // manager/senior, the requester, or whoever is supporting it may close it
        if (!elevated && me !== ownerId && me !== supporterId) return { success: false, message: "غير مصرح — فقط المدير أو صاحب الطلب أو من يسبورته" };
        sh.getRange(i + 1, 8).setValue("Done");        // Status
        sh.getRange(i + 1, 9).setValue(result || "");  // ManagerResult
        sh.getRange(i + 1, 11).setValue(new Date());   // ResolvedAt
        SpreadsheetApp.flush();
        var _resolverName = "System";
        try { var _u2 = getUsers(); for (var _u2i=0;_u2i<_u2.length;_u2i++){ if(_u2[_u2i].id.toString().trim()===me){ _resolverName=_u2[_u2i].name; break; } } } catch(ue2){}
        try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Support Me", _resolverName, "اتقفل في Support Me — النتيجة: " + (result || "—"))); } catch (he) {}
        return { success: true, message: "تم تحديث الحالة ✅" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}
// Claim/unclaim a support request → marks who is working on the number so colleagues don't collide.
function toggleSupportClaim(id, supporterId, supporterName) {
  try {
    var sh = _sseSheet("Support_Requests");
    var d = sh.getDataRange().getValues();
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        var cur = (d[i][12] || "").toString();
        if (!cur) {
          sh.getRange(i + 1, 12).setValue(supporterName || ""); // SupporterName
          sh.getRange(i + 1, 13).setValue(supporterId || "");   // SupporterId
          SpreadsheetApp.flush();
          try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Support Me", supporterName, "دخل يسبّورت العميل ده ويكلّمه")); } catch (he) {}
          return { success: true, claimed: true, message: "تمام — العميل دلوقتي تحت سبورتك ✅" };
        }
        if (cur === (supporterId || "").toString()) {
          sh.getRange(i + 1, 12).setValue("");
          sh.getRange(i + 1, 13).setValue("");
          SpreadsheetApp.flush();
          return { success: true, claimed: false, message: "تم إلغاء السبورت" };
        }
        return { success: false, message: "بيشتغل عليه " + (d[i][11] || "زميل") + " بالفعل" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}
// REMOVE-FROM-BOARD FIX (2026-07-06): this used to hard-delete the sheet row entirely. Now it only
// hides it from the Support Me board (sets the Hidden flag) — the row itself stays in the Google Sheet
// forever so nothing is ever actually lost from the database, it just stops cluttering the active board.
function deleteSupportRequest(id, agentId) {
  try {
    var sh = _sseSheet("Support_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(agentId);
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        if (!elevated && (d[i][1] || "").toString() !== (agentId || "").toString()) return { success: false, message: "غير مصرح" };
        sh.getRange(i + 1, 14).setValue(true); // Hidden — soft, not a real delete
        SpreadsheetApp.flush();
        var _removerName = "System";
        try { var _u3 = getUsers(); for (var _u3i=0;_u3i<_u3.length;_u3i++){ if(_u3[_u3i].id.toString().trim()===(agentId||"").toString()){ _removerName=_u3[_u3i].name; break; } } } catch(ue3){}
        try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Support Me", _removerName, "اتشال من قايمة Support Me")); } catch (he) {}
        return { success: true, message: "تم الحذف" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ── Exception Requests ──
function _excStatus(row) {
  var status = (row[8] || "Pending").toString();
  if (status === "Approved" && row[9]) {
    var dl = (row[9] instanceof Date) ? row[9] : new Date(row[9]);
    if (!isNaN(dl.getTime()) && new Date() > dl) return "Expired";
  }
  return status;
}
// Per-sales monthly exception quota: 8/month (hard), max 2/week (soft). EVERY request counts (approved OR rejected).
function getExceptionQuota(agentId) {
  try {
    var sh = _sseSheet("Exception_Requests");
    var d = sh.getDataRange().getValues();
    var now = new Date();
    var mY = now.getFullYear(), mM = now.getMonth();
    var weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((now.getDay() + 1) % 7)); // back to the most recent Saturday
    var monthlyUsed = 0, weeklyUsed = 0;
    for (var i = 1; i < d.length; i++) {
      if (!d[i][0]) continue;
      if ((d[i][1] || "").toString() !== (agentId || "").toString()) continue;
      var created = d[i][11] ? new Date(d[i][11]) : null;
      if (!created || isNaN(created.getTime())) continue;
      if (created.getFullYear() === mY && created.getMonth() === mM) monthlyUsed++;
      if (created >= weekStart) weeklyUsed++;
    }
    return { monthlyUsed: monthlyUsed, monthlyLimit: 8, monthlyRemaining: Math.max(0, 8 - monthlyUsed), weeklyUsed: weeklyUsed, weeklyLimit: 2 };
  } catch (e) { return { monthlyUsed: 0, monthlyLimit: 8, monthlyRemaining: 8, weeklyUsed: 0, weeklyLimit: 2 }; }
}
function addExceptionRequest(agentId, agentName, clientName, clientPhone, clientOC, type, details) {
  try {
    if (!type || !type.toString().trim()) return { success: false, message: "حدّد نوع الاستثناء" };
    if (!clientName && !clientPhone) return { success: false, message: "حدّد العميل (اسم أو رقم موبايل)" };
    var q = getExceptionQuota(agentId);
    if (q.monthlyUsed >= q.monthlyLimit) return { success: false, message: "خلص رصيدك الشهري من الاستثناءات (" + q.monthlyLimit + " شهريًا).", quota: q };
    var weekWarning = (q.weeklyUsed >= q.weeklyLimit) ? "⚠️ ده تالت استثناء ليك الأسبوع ده — هيتخصم من رصيد الأسبوع الجاي." : "";
    var sh = _sseSheet("Exception_Requests");
    var id = genId();
    sh.appendRow([id, agentId || "", agentName || "", clientName || "", clientPhone || "", clientOC || "", type, details || "", "Pending", "", "", new Date(), "", ""]);
    SpreadsheetApp.flush();
    try { _appendClientHistory(clientPhone, clientOC, _histFmt("Exception", agentName, "اتقدّم طلب استثناء (" + type + "): " + (details || "—"))); } catch (he) {}
    return { success: true, id: id, message: "تم إرسال طلب الاستثناء ✅", weekWarning: weekWarning, quota: getExceptionQuota(agentId) };
  } catch (e) { return { success: false, message: e.toString() }; }
}
// TERMINAL_EXC_STATUSES: once an exception reaches one of these, it's done clearing the active view by
// default (per user spec 2026-07-06 — "شيل الرقم لحد ما يجيله اكسبشن جديد"). It's never deleted — just
// filtered out unless showAll/month/employee filters are used to look it up for editing/history.
var TERMINAL_EXC_STATUSES = { "Done": true, "Rejected": true, "Cancelled": true, "Expired": true };
function getExceptionRequests(agentId, filters) {
  try {
    filters = filters || {};
    var sh = _sseSheet("Exception_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(agentId);
    var tz = Session.getScriptTimeZone();
    // First pass (chronological): per-customer ordinal + total → "this is the Nth exception for this customer"
    function _ckey(row){ var p=(row[4]||"").toString().replace(/\D/g,''); if(p) return 'p'+p.slice(-9); var o=ocKey(row[5]); if(o) return 'o'+o; return 'n'+(row[3]||"").toString().trim().toLowerCase(); }
    var seqById = {}, totalByKey = {};
    for (var a = 1; a < d.length; a++) { if (!d[a][0]) continue; var k = _ckey(d[a]); totalByKey[k] = (totalByKey[k] || 0) + 1; seqById[d[a][0].toString()] = totalByKey[k]; }
    var out = [];
    var rawIdx = elevated ? _buildRawIndex() : null; // single Raw_Data read (history is elevated-only)
    var fMonth = (filters.month || "").toString().trim();       // "YYYY-MM" or "" for all
    var fEmployeeId = (filters.employeeId || "").toString().trim(); // elevated-only filter
    var fShowAll = !!filters.showAll; // if false, terminal statuses are hidden by default
    for (var i = 1; i < d.length; i++) {
      if (!d[i][0]) continue;
      if (!elevated && (d[i][1] || "").toString() !== (agentId || "").toString()) continue;
      if (elevated && fEmployeeId && (d[i][1] || "").toString() !== fEmployeeId) continue;
      var status = _excStatus(d[i]);
      if (!fShowAll && TERMINAL_EXC_STATUSES[status]) continue; // hidden from the default active view
      if (fMonth) {
        var _created = d[i][11] ? new Date(d[i][11]) : null;
        if (!_created || isNaN(_created.getTime())) continue;
        var _cm = _created.getFullYear() + "-" + ("0" + (_created.getMonth() + 1)).slice(-2);
        if (_cm !== fMonth) continue;
      }
      var kk = _ckey(d[i]);
      out.push({
        id: d[i][0].toString(), agentId: (d[i][1] || "").toString(), agentName: d[i][2] || "",
        clientName: d[i][3] || "", clientPhone: d[i][4] || "", clientOC: d[i][5] || "",
        type: d[i][6] || "", details: d[i][7] || "", status: status,
        deadline: d[i][9] ? safeFormatDate(d[i][9], tz, "yyyy-MM-dd HH:mm") : "",
        deadlineTs: (function(){ if(!d[i][9]) return 0; var _d=new Date(d[i][9]); return isNaN(_d.getTime())?0:_d.getTime(); })(),
        adminNote: d[i][10] || "",
        createdAt: d[i][11] ? safeFormatDate(d[i][11], tz, "yyyy-MM-dd HH:mm") : "",
        seq: seqById[d[i][0].toString()] || 1, totalForClient: totalByKey[kk] || 1,
        // history is sent ONLY to elevated. The sales view stays clean (identity only) for screenshots.
        history: elevated ? _historyFromRawIndex(rawIdx, d[i][4], d[i][5]) : null
      });
    }
    out.reverse();
    return { success: true, elevated: elevated, items: out, quota: elevated ? null : getExceptionQuota(agentId) };
  } catch (e) { return { success: false, message: e.toString(), items: [] }; }
}
// Cancel an exception (owner or manager) → status Cancelled. Auto-expiry is handled separately by _excStatus.
// Elevated can override the "already Done" lock (per user spec: "افتحلي أعدل عليه ... او أي حاجة تعجبني").
function cancelExceptionRequest(id, agentId) {
  try {
    var sh = _sseSheet("Exception_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(agentId);
    var me = (agentId || "").toString();
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        if (!elevated && me !== (d[i][1] || "").toString()) return { success: false, message: "غير مصرح" };
        if (!elevated && (d[i][8] || "").toString() === "Done") return { success: false, message: "الطلب تم تنفيذه بالفعل" };
        sh.getRange(i + 1, 9).setValue("Cancelled");
        sh.getRange(i + 1, 14).setValue(new Date());
        SpreadsheetApp.flush();
        try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Exception", agentName_forExc(agentId), "استثناء اتلغى")); } catch (he) {}
        return { success: true, message: "تم إلغاء الاستثناء" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}
// Approve/Reject — an elevated user can always call this (even on an already-decided request) to
// re-decide/renew it with a fresh deadline, per user spec.
function decideExceptionRequest(id, decision, deadline, note, adminId) {
  try {
    if (!_isElevatedUser(adminId)) return { success: false, message: "غير مصرح — القرار للمدير/السينيور فقط" };
    var sh = _sseSheet("Exception_Requests");
    var d = sh.getDataRange().getValues();
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        if (decision === "approve") {
          if (!deadline) return { success: false, message: "حدّد المهلة (تاريخ/وقت)" };
          var dl = new Date(deadline);
          if (isNaN(dl.getTime())) return { success: false, message: "المهلة غير صحيحة" };
          sh.getRange(i + 1, 9).setValue("Approved");  // Status
          sh.getRange(i + 1, 10).setValue(dl);          // Deadline
        } else {
          sh.getRange(i + 1, 9).setValue("Rejected");
        }
        sh.getRange(i + 1, 11).setValue(note || "");    // AdminNote
        sh.getRange(i + 1, 13).setValue(new Date());    // DecidedAt
        SpreadsheetApp.flush();
        try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Exception", agentName_forExc(adminId), decision === "approve" ? "استثناء اتوافق عليه — مهلة لحد " + Utilities.formatDate(dl, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") + (note ? " (" + note + ")" : "") : "استثناء اترفض" + (note ? " (" + note + ")" : ""))); } catch (he) {}
        return { success: true, message: decision === "approve" ? "تمت الموافقة ✅" : "تم الرفض" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}
// Elevated can force-mark Done from ANY status (reopen/override), per user spec. A regular sales still
// needs the request to be Approved-and-not-expired (the normal happy path).
function markExceptionDone(id, agentId) {
  try {
    var sh = _sseSheet("Exception_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(agentId);
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        if (!elevated && (d[i][1] || "").toString() !== (agentId || "").toString()) return { success: false, message: "غير مصرح" };
        if (!elevated) {
          if ((d[i][8] || "").toString() !== "Approved") return { success: false, message: "الطلب غير معتمد بعد" };
          var dl = d[i][9] ? ((d[i][9] instanceof Date) ? d[i][9] : new Date(d[i][9])) : null;
          if (dl && !isNaN(dl.getTime()) && new Date() > dl) {
            sh.getRange(i + 1, 9).setValue("Expired");
            SpreadsheetApp.flush();
            return { success: false, expired: true, message: "انتهت المهلة — تم تعليم الطلب كملغي" };
          }
        }
        sh.getRange(i + 1, 9).setValue("Done");
        sh.getRange(i + 1, 14).setValue(new Date());   // ResolvedAt
        SpreadsheetApp.flush();
        try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Exception", agentName_forExc(agentId), "استثناء اتنفّذ (Done)")); } catch (he) {}
        return { success: true, message: "تم بنجاح ✅" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}
// Small shared lookup used only for history-line attribution in the Exception functions above.
function agentName_forExc(agentId) {
  try {
    var u = getUsers();
    for (var i = 0; i < u.length; i++) { if (u[i].id.toString().trim() === (agentId || "").toString().trim()) return u[i].name; }
  } catch (e) {}
  return "Admin";
}
function deleteExceptionRequest(id, agentId) {
  try {
    var sh = _sseSheet("Exception_Requests");
    var d = sh.getDataRange().getValues();
    var elevated = _isElevatedUser(agentId);
    for (var i = 1; i < d.length; i++) {
      if ((d[i][0] || "").toString() === (id || "").toString()) {
        if (!elevated && (d[i][1] || "").toString() !== (agentId || "").toString()) return { success: false, message: "غير مصرح" };
        try { _appendClientHistory(d[i][4], d[i][5], _histFmt("Exception", agentName_forExc(agentId), "طلب استثناء اتشال نهائيًا")); } catch (he) {}
        sh.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return { success: true, message: "تم الحذف" };
      }
    }
    return { success: false, message: "الطلب غير موجود" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ════════════════════════════════════════════════════════════════════
// SYNC A SINGLE STUDENT BY PHONE → create/find the academy account, enroll in their round,
// and return name / username / password / OC / round. Additive; reuses existing helpers.
// ════════════════════════════════════════════════════════════════════
function syncStudentByPhone(phone, instructorTag, accessMode) {
  try {
    var clean = (phone || "").toString().replace(/\D/g, '');
    if (clean.length < 8) return { success: false, message: "رقم موبايل غير صحيح" };
    var tag = (instructorTag || "").toString().trim();
    var mode = (accessMode || "sequential").toString();

    // 1) find the client in Raw_Data by phone → name + OC
    var rawSh = getSheet("Raw_Data");
    if (!rawSh) return { success: false, message: "Raw_Data غير موجود" };
    var rawData = rawSh.getDataRange().getValues();
    var clientName = "", ocCode = "", foundPhone = "";
    for (var i = 1; i < rawData.length; i++) {
      var rp = (rawData[i][3] || "").toString().replace(/\D/g, '');
      if (rp && (rp === clean || rp.slice(-9) === clean.slice(-9))) {
        clientName = (rawData[i][2] || "").toString().trim();
        ocCode = (rawData[i][14] || "").toString().trim();
        foundPhone = (rawData[i][3] || "").toString().trim();
        break;
      }
    }
    if (!clientName) return { success: false, message: "العميل غير موجود في قاعدة البيانات بهذا الرقم" };
    if (!ocKey(ocCode)) return { success: false, message: "العميل ليس له كود OC بعد — لا يمكن إنشاء حساب أكاديمية بدون OC", pendingOc: true };

    // 2) find their booked round from Client_Payments (a row with this OC that has a round)
    var roundId = "", roundName = "", course = "";
    var cpSh = getSheet("Client_Payments");
    if (cpSh) {
      var cpData = cpSh.getDataRange().getValues();
      for (var c = 1; c < cpData.length; c++) {
        if (cpData[c][19] === true || cpData[c][19] === "TRUE") continue;
        if (!ocEq(cpData[c][1], ocCode)) continue;
        if (!course) course = (cpData[c][3] || "").toString();
        var rid = (cpData[c][4] || "").toString().trim();
        if (rid && rid.toLowerCase() !== "wait") { roundId = rid; roundName = (cpData[c][5] || "").toString(); break; }
      }
    }

    // 3) find/create the academy student account (matched by OC)
    var stuSh = getSheet(ACAD_STUDENTS);
    if (!stuSh) return { success: false, message: "شيت الطلاب غير موجود" };
    var stuData = stuSh.getDataRange().getValues();
    var existingUsernames = [], studentRow = -1;
    for (var s = 1; s < stuData.length; s++) {
      if (stuData[s][2]) existingUsernames.push((stuData[s][2] || "").toString().toLowerCase());
      if (ocKey(ocCode) !== "" && ocKey(stuData[s][10]) === ocKey(ocCode)) studentRow = s;
    }
    var studentId = "", username = "", password = "", created = false;
    if (studentRow !== -1) {
      studentId = stuData[studentRow][0].toString();
      username = (stuData[studentRow][2] || "").toString();
      password = (stuData[studentRow][3] || "").toString();
      if (!(stuData[studentRow][4] || "").toString().trim() && foundPhone) { try { stuSh.getRange(studentRow + 1, 5).setValue(foundPhone); } catch (e) {} }
    } else {
      username = _generateUsername(clientName, existingUsernames);
      var suffix = clean.length >= 4 ? clean.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
      var firstLetter = _transliterate(clientName.charAt(0)).toUpperCase() || "S";
      password = firstLetter + suffix + "@BSA";
      studentId = "STU_" + new Date().getTime();
      stuSh.appendRow([studentId, clientName, username, password, foundPhone, true, "", new Date(), tag, mode, ocCode]);
      created = true;
      _invalidateAcadStats();
    }

    // 4) enroll in their round if found & not already enrolled
    var enrolledMsg = "لا يوجد راوند محجوز لهذا العميل بعد";
    if (roundId) {
      var enrSh = getSheet(ACAD_ENROLL);
      if (enrSh) {
        var enrData = enrSh.getDataRange().getValues();
        var already = false;
        for (var e2 = 1; e2 < enrData.length; e2++) {
          if ((enrData[e2][1] || "").toString() === studentId && (enrData[e2][2] || "").toString() === roundId && (enrData[e2][5] || "").toString() !== "removed") { already = true; break; }
        }
        if (!already) {
          enrSh.appendRow(["ENR_" + new Date().getTime(), studentId, roundId, roundName, new Date(), "active"]);
          try { _ensureStudentDriveFolder(studentId, roundId, roundName); } catch (e) {}
          _invalidateAcadStats();
          enrolledMsg = "وتم تسجيله في: " + roundName;
        } else { enrolledMsg = "مسجّل بالفعل في: " + roundName; }
      }
    }

    return {
      success: true, created: created,
      message: (created ? "✅ تم إنشاء حساب الطالب " : "✅ الطالب موجود بالفعل ") + enrolledMsg,
      student: { name: clientName, username: username, password: password, ocCode: ocCode, phone: foundPhone, roundName: roundName || "—", course: course || "" }
    };
  } catch (e) { return { success: false, message: e.toString() }; }
}
