// One-time repair: the original migration had UNIQUE constraints on client_payments.legacy_id and
// academy_ledger.oc_code, silently dropping legit duplicate-OC rows (a client with two contracts).
// Constraints are now removed — this re-imports ONLY the missing rows from the xlsx (append-only).
import { DataSource } from 'typeorm';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bsa_crm',
  charset: 'utf8mb4',
});

function parseDate(val: any): string | null {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  const num = parseFloat(val);
  if (!isNaN(num) && num > 20000 && num < 60000) {
    const d = new Date((Math.floor(num - 25569)) * 86400 * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}
const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const str = (v: any) => (v === null || v === undefined ? '' : String(v).trim());

async function run() {
  await ds.initialize();
  let excelPath = path.join(process.cwd(), 'جوجل شيت الرئيسي.xlsx');
  if (!fs.existsSync(excelPath)) excelPath = path.join(process.cwd(), 'legacy', 'جوجل شيت الرئيسي.xlsx');
  const wb = xlsx.readFile(excelPath);

  // ── Client_Payments: count rows per ID in xlsx vs DB; insert the shortfall ──
  const cpRows: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Client_Payments'], { defval: null });
  const dbCounts: Record<string, number> = {};
  for (const r of await ds.query('SELECT legacy_id, COUNT(*) c FROM client_payments WHERE legacy_id IS NOT NULL GROUP BY legacy_id')) {
    dbCounts[r.legacy_id] = Number(r.c);
  }
  const seen: Record<string, number> = {};
  let cpAdded = 0;
  for (const row of cpRows) {
    const pid = str(row['ID']);
    if (!pid) continue;
    seen[pid] = (seen[pid] || 0) + 1;
    if (seen[pid] <= (dbCounts[pid] || 0)) continue; // this occurrence already exists in DB

    const keys = Object.keys(row);
    const d1 = keys.length > 14 ? num(row[keys[15]]) : 0;
    const d2 = keys.length > 15 ? num(row[keys[16]]) : 0;
    const d3 = keys.length > 16 ? num(row[keys[17]]) : 0;
    await ds.query(
      `INSERT INTO client_payments
       (id, legacy_id, client_legacy_id, client_name, course, round_legacy_id, round_name, total_amount,
        agent_username, amount_paid, amount_unpaid, payment_time, status, created_at,
        amount_detail1, amount_detail2, amount_detail3, last_modified, is_deleted)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [
        pid, pid, str(row['Name']), str(row['Course']), str(row['Round ID']) || null, str(row['Round']),
        num(row['الاجمالي']), str(row['User']), num(row['Paid']), num(row['Unpaid']),
        parseDate(row['Time']), str(row['Statuse']) || 'Pending',
        d1, d2, d3, parseDate(row['LastModified']),
        String(row['Is_Deleted']).toLowerCase() === 'true' ? 1 : 0,
      ],
    );
    cpAdded++;
  }
  console.log(`Client_Payments rows re-imported: ${cpAdded}`);

  // ── Academy_Ledger: same approach keyed by OC code occurrence count ──
  const alRows: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Ledger'], { defval: null });
  const alDb: Record<string, number> = {};
  for (const r of await ds.query('SELECT oc_code, COUNT(*) c FROM academy_ledger WHERE oc_code IS NOT NULL GROUP BY oc_code')) {
    alDb[r.oc_code] = Number(r.c);
  }
  const alSeen: Record<string, number> = {};
  let alAdded = 0;
  for (const row of alRows) {
    const oc = str(row['كود الOC']);
    if (!oc) continue;
    alSeen[oc] = (alSeen[oc] || 0) + 1;
    if (alSeen[oc] <= (alDb[oc] || 0)) continue;
    await ds.query(
      `INSERT INTO academy_ledger
       (id, booking_date, oc_code, client_name, phone, course, group_name, status, total_price,
        payment_method, amount_paid, amount_remaining, sales_agent_email)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseDate(row['تاريخ الحجز']), oc, str(row['اسم العميل']), str(row['رقم الهاتف']).replace(/\D/g, ''),
        str(row['الكورس']), str(row['اسم المجموعة']), str(row['الحالة']), num(row['السعر الكلي']),
        str(row['طريقة الدفع']), num(row['المبلغ المدفوع']), num(row['المبلغ المتبقي']), str(row['موظف السيلز']),
      ],
    );
    alAdded++;
  }
  console.log(`Academy_Ledger rows re-imported: ${alAdded}`);

  await ds.destroy();
  console.log('Payments backfill done.');
}

run().catch((e) => { console.error(e); process.exit(1); });
