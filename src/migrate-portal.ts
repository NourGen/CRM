import { DataSource } from 'typeorm';
import * as xlsx from 'xlsx';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Import required entities relative to src/
import { Student } from './academy/entities/student.entity';
import { Round } from './academy/entities/round.entity';
import { Enrollment } from './academy/entities/enrollment.entity';
import { AcademyContent } from './academy/entities/academy-content.entity';
import { AcademySession } from './academy/entities/academy-session.entity';
import { AcademyUnlock } from './academy/entities/academy-unlock.entity';
import { QuizAttempt } from './academy/entities/quiz-attempt.entity';
import { AcademyNotification } from './academy/entities/academy-notification.entity';
import { QuizResult } from './academy/entities/quiz-result.entity';
import { AcademyTask } from './academy/entities/academy-task.entity';
import { AcademyProgress } from './academy/entities/academy-progress.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bsa_crm',
  charset: 'utf8mb4',
  synchronize: false,
  entities: [
    Student, Round, Enrollment, AcademyContent, AcademySession, AcademyUnlock,
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

  // The Excel file path on the server is /home/bsa/crm/.claude/البورتال.xlsx
  const filePath = path.join(__dirname, '..', '.claude', 'البورتال.xlsx');
  console.log(`Reading Excel file: ${filePath}`);
  const wb = xlsx.readFile(filePath);

  function getSheetRows(sheetName: string): any[] {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    if (sheetName === 'Academy_Students') {
      return xlsx.utils.sheet_to_json(sheet, {
        header: ['ID', 'Name', 'Email', 'Password', 'Phone', 'Active', 'TaskFolderID', 'CreatedAt', 'InstructorTag', 'ColJ', 'ColK'],
        range: 1
      });
    }
    return xlsx.utils.sheet_to_json(sheet);
  }

  // 1. Academy_Students
  console.log('Migrating Academy_Students...');
  const studentRows = getSheetRows('Academy_Students');
  let stuAdded = 0, stuSkipped = 0;
  for (const row of studentRows) {
    try {
      const legacyId = row.ID ? String(row.ID).trim() : null;
      if (!legacyId) continue;
      const exists = await AppDataSource.getRepository(Student).findOne({ where: { legacyId } });
      if (exists) {
        stuSkipped++;
        continue;
      }
      const stu = new Student();
      stu.legacyId = legacyId;
      stu.name = row.Name ? String(row.Name).trim() : '';
      stu.email = row.Email ? String(row.Email).trim().toLowerCase() : '';
      stu.password = row.Password ? String(row.Password).trim() : '123456';
      stu.phone = row.Phone ? String(row.Phone).trim() : '';
      stu.active = parseBoolean(row.Active);
      stu.taskFolderId = row.TaskFolderID ? String(row.TaskFolderID).trim() : null;
      stu.createdAt = parseDate(row.CreatedAt) || new Date();
      stu.instructorTag = row.InstructorTag ? String(row.InstructorTag).trim() : null;
      
      const colJ = row.ColJ ? String(row.ColJ).trim() : null;
      let accessMode = 'sequential';
      let profilePic = null;
      if (colJ) {
        if (colJ.startsWith('data:') || colJ.startsWith('http')) {
          profilePic = colJ;
        } else {
          accessMode = colJ;
        }
      }
      stu.accessMode = accessMode;
      stu.profilePic = profilePic;
      stu.ocCode = row.ColK ? String(row.ColK).trim() : null;

      await AppDataSource.getRepository(Student).save(stu);
      stuAdded++;
    } catch (e: any) {
      console.error(`Failed for student ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Students: Added ${stuAdded}, Skipped ${stuSkipped}`);

  // 2. Academy_Enrollments
  console.log('Migrating Academy_Enrollments...');
  const enrollmentRows = getSheetRows('Academy_Enrollments');
  let enrAdded = 0, enrSkipped = 0;
  for (const row of enrollmentRows) {
    try {
      const legacyId = row.ID ? String(row.ID).trim() : null;
      if (!legacyId) continue;
      const exists = await AppDataSource.getRepository(Enrollment).findOne({ where: { legacyId } });
      if (exists) {
        enrSkipped++;
        continue;
      }
      const enr = new Enrollment();
      enr.legacyId = legacyId;
      enr.studentLegacyId = row.StudentID ? String(row.StudentID).trim() : null;
      enr.roundLegacyId = row.RoundID ? String(row.RoundID).trim() : null;
      enr.roundName = row.RoundName ? String(row.RoundName).trim() : '';
      enr.enrolledAt = parseDate(row.EnrolledAt) || new Date();
      enr.status = row.Status ? String(row.Status).trim() : 'active';
      
      // Link to student and round if possible
      if (enr.studentLegacyId) {
        const student = await AppDataSource.getRepository(Student).findOne({ where: [{ legacyId: enr.studentLegacyId }, { id: enr.studentLegacyId }] });
        if (student) enr.student = student;
      }
      if (enr.roundLegacyId) {
        const round = await AppDataSource.getRepository(Round).findOne({ where: [{ legacyId: enr.roundLegacyId }, { id: enr.roundLegacyId }] });
        if (round) enr.round = round;
      }

      await AppDataSource.getRepository(Enrollment).save(enr);
      enrAdded++;
    } catch (e: any) {
      console.error(`Failed for enrollment ${row.ID}: ${e.message}`);
    }
  }
  console.log(`Academy_Enrollments: Added ${enrAdded}, Skipped ${enrSkipped}`);

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

  // 3. Academy_Sessions
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

  // 4. Academy_Unlocks
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

  // 5. Academy_Quiz_Attempts
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

  // 6. Academy_Notifications
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

  // 7. Academy_Quiz_Results
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

  // 8. Academy_Tasks
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

  // 9. Academy_Progress
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
