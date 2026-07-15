import { DataSource } from 'typeorm';
import * as xlsx from 'xlsx';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Import required entities
import { Student } from '../src/academy/entities/student.entity';
import { Round } from '../src/academy/entities/round.entity';
import { AcademyContent } from '../src/academy/entities/academy-content.entity';
import { AcademySession } from '../src/academy/entities/academy-session.entity';
import { AcademyUnlock } from '../src/academy/entities/academy-unlock.entity';
import { QuizAttempt } from '../src/academy/entities/quiz-attempt.entity';
import { AcademyNotification } from '../src/academy/entities/academy-notification.entity';
import { QuizResult } from '../src/academy/entities/quiz-result.entity';
import { AcademyTask } from '../src/academy/entities/academy-task.entity';
import { AcademyProgress } from '../src/academy/entities/academy-progress.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bsa_crm',
  charset: 'utf8mb4',
  synchronize: false, // DO NOT synchronize on production
  entities: [
    Student, Round, AcademyContent, AcademySession, AcademyUnlock,
    QuizAttempt, AcademyNotification, QuizResult, AcademyTask, AcademyProgress
  ],
});

// Helpers
function parseDate(val: any): Date | null {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  const num = parseFloat(val);
  if (!isNaN(num) && num > 20000 && num < 60000) {
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = num - Math.floor(num) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const hours = Math.floor(total_seconds / 3600);
    total_seconds %= 3600;
    const minutes = Math.floor(total_seconds / 60);
    const seconds = total_seconds % 60;
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function parseBoolean(val: any): boolean {
  if (val === null || val === undefined) return false;
  const str = String(val).trim().toLowerCase();
  return str === 'true' || str === '1' || val === true || val === 1;
}

function parseJson(val: any): any {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

async function runMigration() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected!');

  const filePath = path.join(__dirname, '..', '.claude', 'البورتال.xlsx');
  console.log(`Reading Excel file: ${filePath}`);
  const wb = xlsx.readFile(filePath);

  function getSheetRows(sheetName: string): any[] {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    return xlsx.utils.sheet_to_json(sheet);
  }

  // Load existing entities into maps
  console.log('Loading students, rounds, and contents into memory maps...');
  const students = await AppDataSource.getRepository(Student).find();
  const rounds = await AppDataSource.getRepository(Round).find();
  const contents = await AppDataSource.getRepository(AcademyContent).find();

  const studentMap = new Map<string, Student>();
  for (const s of students) {
    if (s.legacyId) studentMap.set(s.legacyId, s);
  }

  const roundMap = new Map<string, Round>();
  for (const r of rounds) {
    if (r.legacyId) roundMap.set(r.legacyId, r);
  }

  const contentMap = new Map<string, AcademyContent>();
  for (const c of contents) {
    const key = c.legacyId || c.id;
    if (key) contentMap.set(key, c);
  }

  // 1. Academy_Sessions
  console.log('Migrating Academy_Sessions...');
  const sessionRows = getSheetRows('Academy_Sessions');
  let sessAdded = 0, sessSkipped = 0;
  for (const row of sessionRows) {
    try {
      const token = row.Token ? String(row.Token).trim() : null;
      if (!token) continue;
      const exists = await AppDataSource.getRepository(AcademySession).findOne({ where: { token } });
      if (exists) {
        sessSkipped++;
        continue;
      }
      const sess = new AcademySession();
      sess.token = token;
      sess.userId = row.UserID ? String(row.UserID).trim() : '';
      sess.role = row.Role === 'instructor' ? 'instructor' : 'student';
      sess.isBsa = parseBoolean(row.IsBSA);
      sess.createdAt = parseDate(row.CreatedAt) || new Date();
      await AppDataSource.getRepository(AcademySession).save(sess);
      sessAdded++;
    } catch (e: any) {
      console.error(`Failed for session token ${row.Token}: ${e.message}`);
    }
  }
  console.log(`Academy_Sessions: Added ${sessAdded}, Skipped ${sessSkipped}`);

  // 2. Academy_Unlocks
  console.log('Migrating Academy_Unlocks...');
  const unlockRows = getSheetRows('Academy_Unlocks');
  let unlAdded = 0, unlSkipped = 0;
  for (const row of unlockRows) {
    try {
      const id = row.ID ? String(row.ID).trim() : null;
      if (!id) continue;
      const exists = await AppDataSource.getRepository(AcademyUnlock).findOne({ where: { id } });
      if (exists) {
        unlSkipped++;
        continue;
      }
      const unl = new AcademyUnlock();
      unl.id = id;
      unl.studentId = row.StudentID ? String(row.StudentID).trim() : '';
      unl.lectureId = row.LectureID ? String(row.LectureID).trim() : '';
      unl.unlockedBy = row.UnlockedBy ? String(row.UnlockedBy).trim() : '';
      unl.unlockedAt = parseDate(row.UnlockedAt) || new Date();
      await AppDataSource.getRepository(AcademyUnlock).save(unl);
      unlAdded++;
    } catch (e: any) {
      console.error(`Failed for unlock ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Unlocks: Added ${unlAdded}, Skipped ${unlSkipped}`);

  // 3. Academy_Quiz_Attempts
  console.log('Migrating Academy_Quiz_Attempts...');
  const attemptRows = getSheetRows('Academy_Quiz_Attempts');
  let attAdded = 0, attSkipped = 0;
  for (const row of attemptRows) {
    try {
      const legacyAttemptId = row.AttemptID ? String(row.AttemptID).trim() : null;
      if (!legacyAttemptId) continue;
      const exists = await AppDataSource.getRepository(QuizAttempt).findOne({ where: { legacyAttemptId } });
      if (exists) {
        attSkipped++;
        continue;
      }
      const attempt = new QuizAttempt();
      attempt.legacyAttemptId = legacyAttemptId;
      const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
      attempt.studentLegacyId = sLegacy;
      if (sLegacy && studentMap.has(sLegacy)) {
        attempt.student = studentMap.get(sLegacy)!;
      }
      const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
      attempt.lectureLegacyId = lLegacy;
      if (lLegacy && contentMap.has(lLegacy)) {
        attempt.lecture = contentMap.get(lLegacy)!;
      }
      attempt.questionsJson = parseJson(row.QuestionsJSON);
      attempt.createdAt = parseDate(row.CreatedAt) || new Date();
      attempt.status = row.Status ? String(row.Status).trim() : null;
      await AppDataSource.getRepository(QuizAttempt).save(attempt);
      attAdded++;
    } catch (e: any) {
      console.error(`Failed for attempt ${row.AttemptID}: ${e.message}`);
    }
  }
  console.log(`Academy_Quiz_Attempts: Added ${attAdded}, Skipped ${attSkipped}`);

  // 4. Academy_Notifications
  console.log('Migrating Academy_Notifications...');
  const notifRows = getSheetRows('Academy_Notifications');
  let notifAdded = 0, notifSkipped = 0;
  for (const row of notifRows) {
    try {
      const legacyId = row.ID ? String(row.ID).trim() : null;
      if (!legacyId) continue;
      const exists = await AppDataSource.getRepository(AcademyNotification).findOne({ where: { legacyId } });
      if (exists) {
        notifSkipped++;
        continue;
      }
      const notif = new AcademyNotification();
      notif.legacyId = legacyId;
      notif.recipientId = row.RecipientID ? String(row.RecipientID).trim() : null;
      notif.recipientType = row.RecipientType ? String(row.RecipientType).trim() : null;
      notif.type = row.Type ? String(row.Type).trim() : null;
      notif.message = row.Message ? String(row.Message).trim() : null;
      notif.refId = row.RefID ? String(row.RefID).trim() : null;
      notif.isRead = parseBoolean(row.IsRead);
      notif.createdAt = parseDate(row.CreatedAt) || new Date();
      await AppDataSource.getRepository(AcademyNotification).save(notif);
      notifAdded++;
    } catch (e: any) {
      console.error(`Failed for notification ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Notifications: Added ${notifAdded}, Skipped ${notifSkipped}`);

  // 5. Academy_Quiz_Results
  console.log('Migrating Academy_Quiz_Results...');
  const resRows = getSheetRows('Academy_Quiz_Results');
  let resAdded = 0, resSkipped = 0;
  for (const row of resRows) {
    try {
      const legacyId = row.ID ? String(row.ID).trim() : null;
      if (!legacyId) continue;
      const exists = await AppDataSource.getRepository(QuizResult).findOne({ where: { legacyId } });
      if (exists) {
        resSkipped++;
        continue;
      }
      const res = new QuizResult();
      res.legacyId = legacyId;
      const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
      res.studentLegacyId = sLegacy;
      if (sLegacy && studentMap.has(sLegacy)) {
        res.student = studentMap.get(sLegacy)!;
      }
      const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
      res.lectureLegacyId = lLegacy;
      if (lLegacy && contentMap.has(lLegacy)) {
        res.lecture = contentMap.get(lLegacy)!;
      }
      res.score = parseNumber(row.Score);
      res.passed = parseBoolean(row.Passed);
      res.attemptAt = parseDate(row.AttemptAt) || new Date();
      res.totalQ = parseNumber(row.TotalQ);
      res.correctQ = parseNumber(row.CorrectQ);
      await AppDataSource.getRepository(QuizResult).save(res);
      resAdded++;
    } catch (e: any) {
      console.error(`Failed for quiz result ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Quiz_Results: Added ${resAdded}, Skipped ${resSkipped}`);

  // 6. Academy_Tasks
  console.log('Migrating Academy_Tasks...');
  const tRows = getSheetRows('Academy_Tasks');
  let tAdded = 0, tSkipped = 0;
  for (const row of tRows) {
    try {
      const legacyId = row.ID ? String(row.ID).trim() : null;
      if (!legacyId) continue;
      const exists = await AppDataSource.getRepository(AcademyTask).findOne({ where: { legacyId } });
      if (exists) {
        tSkipped++;
        continue;
      }
      const task = new AcademyTask();
      task.legacyId = legacyId;
      const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
      task.studentLegacyId = sLegacy;
      if (sLegacy && studentMap.has(sLegacy)) {
        task.student = studentMap.get(sLegacy)!;
      }
      task.studentName = row.StudentName ? String(row.StudentName).trim() : null;
      const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
      task.roundLegacyId = rLegacy;
      if (rLegacy && roundMap.has(rLegacy)) {
        task.round = roundMap.get(rLegacy)!;
      }
      const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
      task.lectureLegacyId = lLegacy;
      if (lLegacy && contentMap.has(lLegacy)) {
        task.lecture = contentMap.get(lLegacy)!;
      }
      task.lectureName = row.LectureName ? String(row.LectureName).trim() : null;
      task.driveFileId = row.DriveFileID ? String(row.DriveFileID).trim() : null;
      task.fileName = row.FileName ? String(row.FileName).trim() : null;
      task.submittedAt = parseDate(row.SubmittedAt);
      task.status = row.Status ? String(row.Status).trim() : null;
      task.reviewedAt = parseDate(row.ReviewedAt);
      task.reviewedBy = row.ReviewedBy ? String(row.ReviewedBy).trim() : null;
      task.reviewNotes = row.ReviewNotes ? String(row.ReviewNotes).trim() : null;
      await AppDataSource.getRepository(AcademyTask).save(task);
      tAdded++;
    } catch (e: any) {
      console.error(`Failed for task ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Tasks: Added ${tAdded}, Skipped ${tSkipped}`);

  // 7. Academy_Progress
  console.log('Migrating Academy_Progress...');
  const progRows = getSheetRows('Academy_Progress');
  let progAdded = 0, progSkipped = 0;
  for (const row of progRows) {
    try {
      const legacyId = row.ID ? String(row.ID).trim() : null;
      if (!legacyId) continue;
      const exists = await AppDataSource.getRepository(AcademyProgress).findOne({ where: { legacyId } });
      if (exists) {
        progSkipped++;
        continue;
      }
      const prog = new AcademyProgress();
      prog.legacyId = legacyId;
      const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
      prog.studentLegacyId = sLegacy;
      if (sLegacy && studentMap.has(sLegacy)) {
        prog.student = studentMap.get(sLegacy)!;
      }
      const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
      prog.lectureLegacyId = lLegacy;
      if (lLegacy && contentMap.has(lLegacy)) {
        prog.lecture = contentMap.get(lLegacy)!;
      }
      prog.watchedAt = parseDate(row.WatchedAt);
      prog.completed = parseBoolean(row.Completed);
      await AppDataSource.getRepository(AcademyProgress).save(prog);
      progAdded++;
    } catch (e: any) {
      console.error(`Failed for progress ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Progress: Added ${progAdded}, Skipped ${progSkipped}`);

  await AppDataSource.destroy();
  console.log('Migration finished successfully!');
}

runMigration().catch((e) => {
  console.error('Migration failed:', e);
});
