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
    const rows = xlsx.utils.sheet_to_json(wb.Sheets['Quiz_Bank'], { defval: null });
    let fixed = 0, skipped = 0;
    for (const row of rows) {
        const raw = row['Correct (1-4)'] ?? row.Correct;
        const n = parseInt(raw);
        const question = row.Question ? String(row.Question).trim() : '';
        const lecId = row.Lecture_ID ? String(row.Lecture_ID).trim() : '';
        if (!question || isNaN(n)) {
            skipped++;
            continue;
        }
        const zeroBased = n >= 1 ? n - 1 : n;
        const res = await ds.query('UPDATE quiz_bank SET correct = ? WHERE question = ? AND (lecture_legacy_id = ? OR ? = "")', [zeroBased, question, lecId, lecId]);
        if (res.affectedRows)
            fixed++;
    }
    console.log('Quiz bank rows fixed:', fixed, '| skipped:', skipped);
    const check = await ds.query('SELECT correct, COUNT(*) c FROM quiz_bank GROUP BY correct ORDER BY correct');
    console.log('Distribution:', JSON.stringify(check));
    await ds.destroy();
}
run();
//# sourceMappingURL=fix-quizbank.js.map