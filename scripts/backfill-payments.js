"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const xlsx = __importStar(require("xlsx"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const ds = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bsa_crm',
    charset: 'utf8mb4',
});
function parseDate(val) {
    if (val === null || val === undefined || String(val).trim() === '')
        return null;
    const num = parseFloat(val);
    if (!isNaN(num) && num > 20000 && num < 60000) {
        const d = new Date((Math.floor(num - 25569)) * 86400 * 1000);
        return d.toISOString().slice(0, 19).replace('T', ' ');
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
async function run() {
    await ds.initialize();
    let excelPath = path.join(process.cwd(), 'جوجل شيت الرئيسي.xlsx');
    if (!fs.existsSync(excelPath))
        excelPath = path.join(process.cwd(), 'legacy', 'جوجل شيت الرئيسي.xlsx');
    const wb = xlsx.readFile(excelPath);
    const cpRows = xlsx.utils.sheet_to_json(wb.Sheets['Client_Payments'], { defval: null });
    const dbCounts = {};
    for (const r of await ds.query('SELECT legacy_id, COUNT(*) c FROM client_payments WHERE legacy_id IS NOT NULL GROUP BY legacy_id')) {
        dbCounts[r.legacy_id] = Number(r.c);
    }
    const seen = {};
    let cpAdded = 0;
    for (const row of cpRows) {
        const pid = str(row['ID']);
        if (!pid)
            continue;
        seen[pid] = (seen[pid] || 0) + 1;
        if (seen[pid] <= (dbCounts[pid] || 0))
            continue;
        const keys = Object.keys(row);
        const d1 = keys.length > 14 ? num(row[keys[15]]) : 0;
        const d2 = keys.length > 15 ? num(row[keys[16]]) : 0;
        const d3 = keys.length > 16 ? num(row[keys[17]]) : 0;
        await ds.query(`INSERT INTO client_payments
       (id, legacy_id, client_legacy_id, client_name, course, round_legacy_id, round_name, total_amount,
        agent_username, amount_paid, amount_unpaid, payment_time, status, created_at,
        amount_detail1, amount_detail2, amount_detail3, last_modified, is_deleted)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`, [
            pid, pid, str(row['Name']), str(row['Course']), str(row['Round ID']) || null, str(row['Round']),
            num(row['الاجمالي']), str(row['User']), num(row['Paid']), num(row['Unpaid']),
            parseDate(row['Time']), str(row['Statuse']) || 'Pending',
            d1, d2, d3, parseDate(row['LastModified']),
            String(row['Is_Deleted']).toLowerCase() === 'true' ? 1 : 0,
        ]);
        cpAdded++;
    }
    console.log(`Client_Payments rows re-imported: ${cpAdded}`);
    const alRows = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Ledger'], { defval: null });
    const alDb = {};
    for (const r of await ds.query('SELECT oc_code, COUNT(*) c FROM academy_ledger WHERE oc_code IS NOT NULL GROUP BY oc_code')) {
        alDb[r.oc_code] = Number(r.c);
    }
    const alSeen = {};
    let alAdded = 0;
    for (const row of alRows) {
        const oc = str(row['كود الOC']);
        if (!oc)
            continue;
        alSeen[oc] = (alSeen[oc] || 0) + 1;
        if (alSeen[oc] <= (alDb[oc] || 0))
            continue;
        await ds.query(`INSERT INTO academy_ledger
       (id, booking_date, oc_code, client_name, phone, course, group_name, status, total_price,
        payment_method, amount_paid, amount_remaining, sales_agent_email)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            parseDate(row['تاريخ الحجز']), oc, str(row['اسم العميل']), str(row['رقم الهاتف']).replace(/\D/g, ''),
            str(row['الكورس']), str(row['اسم المجموعة']), str(row['الحالة']), num(row['السعر الكلي']),
            str(row['طريقة الدفع']), num(row['المبلغ المدفوع']), num(row['المبلغ المتبقي']), str(row['موظف السيلز']),
        ]);
        alAdded++;
    }
    console.log(`Academy_Ledger rows re-imported: ${alAdded}`);
    await ds.destroy();
    console.log('Payments backfill done.');
}
run().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=backfill-payments.js.map