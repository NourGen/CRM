// One-time fix: quiz_bank.correct imported as NULL because the sheet header is
// "Correct (1-4)" not "Correct". Re-reads the xlsx and sets correct (converted
// to 0-based to match the questionsJson convention used by grading/review).
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

async function run() {
  await ds.initialize();
  let excelPath = path.join(process.cwd(), 'جوجل شيت الرئيسي.xlsx');
  if (!fs.existsSync(excelPath)) excelPath = path.join(process.cwd(), 'legacy', 'جوجل شيت الرئيسي.xlsx');
  if (!fs.existsSync(excelPath)) { console.error('Excel file not found'); process.exit(1); }
  const wb = xlsx.readFile(excelPath);

  const rows: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Quiz_Bank'], { defval: null });
  let fixed = 0, skipped = 0;
  for (const row of rows) {
    const raw = row['Correct (1-4)'] ?? row.Correct;
    const n = parseInt(raw);
    const question = row.Question ? String(row.Question).trim() : '';
    const lecId = row.Lecture_ID ? String(row.Lecture_ID).trim() : '';
    if (!question || isNaN(n)) { skipped++; continue; }
    const zeroBased = n >= 1 ? n - 1 : n;
    const res = await ds.query(
      'UPDATE quiz_bank SET correct = ? WHERE question = ? AND (lecture_legacy_id = ? OR ? = "")',
      [zeroBased, question, lecId, lecId],
    );
    if (res.affectedRows) fixed++;
  }
  console.log('Quiz bank rows fixed:', fixed, '| skipped:', skipped);

  const check: any[] = await ds.query('SELECT correct, COUNT(*) c FROM quiz_bank GROUP BY correct ORDER BY correct');
  console.log('Distribution:', JSON.stringify(check));
  await ds.destroy();
}
run();
