// One-time backfill: the legacy Academy_Students sheet had 3 UNNAMED columns (8=InstructorTag,
// 9=AccessMode, 10=OC_Code) that the main migration skipped, and Academy_Instructors ProfilePic
// was truncated by the old varchar(255) column. Re-reads the xlsx and repairs both tables in place.
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

  // Students: positional read (headers are missing for cols 8-10)
  const stuRows: any[][] = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Students'], { header: 1, defval: null });
  let stuFixed = 0;
  for (let i = 1; i < stuRows.length; i++) {
    const r = stuRows[i];
    if (!r || !r[0]) continue;
    const legacyId = String(r[0]).trim();
    const instructorTag = r[8] != null ? String(r[8]).trim() : null;
    const accessMode = r[9] != null ? String(r[9]).trim() : null;
    const ocCode = r[10] != null ? String(r[10]).trim() : null;
    if (!instructorTag && !accessMode && !ocCode) continue;
    const res = await ds.query(
      'UPDATE academy_students SET instructor_tag = ?, access_mode = ?, oc_code = ? WHERE legacy_id = ?',
      [instructorTag, accessMode, ocCode, legacyId],
    );
    if (res.affectedRows) stuFixed++;
  }
  console.log(`Students backfilled: ${stuFixed}`);

  // Instructors: restore full ProfilePic (col 6) that varchar(255) truncated
  const insRows: any[][] = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Instructors'], { header: 1, defval: null });
  let insFixed = 0;
  for (let i = 1; i < insRows.length; i++) {
    const r = insRows[i];
    if (!r || !r[0]) continue;
    const legacyId = String(r[0]).trim();
    const pic = r[6] != null ? String(r[6]) : '';
    if (!pic || pic.length < 250) continue; // short/empty pics were stored fine already
    const res = await ds.query('UPDATE academy_instructors SET profile_pic = ? WHERE legacy_id = ?', [pic, legacyId]);
    if (res.affectedRows) insFixed++;
  }
  console.log(`Instructor pics restored: ${insFixed}`);

  // Academy_Content: unnamed cols 11 = InstructorTag, 12 = PdfFileID (skipped by the main migration)
  const conRows: any[][] = xlsx.utils.sheet_to_json(wb.Sheets['Academy_Content'], { header: 1, defval: null });
  let conFixed = 0;
  for (let i = 1; i < conRows.length; i++) {
    const r = conRows[i];
    if (!r || !r[0]) continue;
    const legacyId = String(r[0]).trim();
    const instructorTag = r[11] != null ? String(r[11]).trim() : null;
    const pdfFileId = r[12] != null ? String(r[12]).trim() : null;
    if (!instructorTag && !pdfFileId) continue;
    const res = await ds.query(
      'UPDATE academy_content SET instructor_tag = ?, pdf_file_id = ? WHERE legacy_id = ?',
      [instructorTag, pdfFileId, legacyId],
    );
    if (res.affectedRows) conFixed++;
  }
  console.log(`Content rows backfilled: ${conFixed}`);

  await ds.destroy();
  console.log('Backfill done.');
}

run().catch((e) => { console.error(e); process.exit(1); });
