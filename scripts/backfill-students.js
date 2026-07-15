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
async function run() {
    await ds.initialize();
    let excelPath = path.join(process.cwd(), 'جوجل شيت الرئيسي.xlsx');
    if (!fs.existsSync(excelPath))
        excelPath = path.join(process.cwd(), 'legacy', 'جوجل شيت الرئيسي.xlsx');
    if (!fs.existsSync(excelPath)) {
        console.error('Excel file not found');
        process.exit(1);
    }
    const wb = xlsx.readFile(excelPath);
    const stuRows = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Students'], { header: 1, defval: null });
    let stuFixed = 0;
    for (let i = 1; i < stuRows.length; i++) {
        const r = stuRows[i];
        if (!r || !r[0])
            continue;
        const legacyId = String(r[0]).trim();
        const instructorTag = r[8] != null ? String(r[8]).trim() : null;
        const accessMode = r[9] != null ? String(r[9]).trim() : null;
        const ocCode = r[10] != null ? String(r[10]).trim() : null;
        if (!instructorTag && !accessMode && !ocCode)
            continue;
        const res = await ds.query('UPDATE academy_students SET instructor_tag = ?, access_mode = ?, oc_code = ? WHERE legacy_id = ?', [instructorTag, accessMode, ocCode, legacyId]);
        if (res.affectedRows)
            stuFixed++;
    }
    console.log(`Students backfilled: ${stuFixed}`);
    const insRows = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Instructors'], { header: 1, defval: null });
    let insFixed = 0;
    for (let i = 1; i < insRows.length; i++) {
        const r = insRows[i];
        if (!r || !r[0])
            continue;
        const legacyId = String(r[0]).trim();
        const pic = r[6] != null ? String(r[6]) : '';
        if (!pic || pic.length < 250)
            continue;
        const res = await ds.query('UPDATE academy_instructors SET profile_pic = ? WHERE legacy_id = ?', [pic, legacyId]);
        if (res.affectedRows)
            insFixed++;
    }
    console.log(`Instructor pics restored: ${insFixed}`);
    const conRows = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Content'], { header: 1, defval: null });
    let conFixed = 0;
    for (let i = 1; i < conRows.length; i++) {
        const r = conRows[i];
        if (!r || !r[0])
            continue;
        const legacyId = String(r[0]).trim();
        const instructorTag = r[11] != null ? String(r[11]).trim() : null;
        const pdfFileId = r[12] != null ? String(r[12]).trim() : null;
        if (!instructorTag && !pdfFileId)
            continue;
        const res = await ds.query('UPDATE academy_content SET instructor_tag = ?, pdf_file_id = ? WHERE legacy_id = ?', [instructorTag, pdfFileId, legacyId]);
        if (res.affectedRows)
            conFixed++;
    }
    console.log(`Content rows backfilled: ${conFixed}`);
    await ds.destroy();
    console.log('Backfill done.');
}
run().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=backfill-students.js.map