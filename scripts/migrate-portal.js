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
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const student_entity_1 = require("../src/academy/entities/student.entity");
const round_entity_1 = require("../src/academy/entities/round.entity");
const academy_content_entity_1 = require("../src/academy/entities/academy-content.entity");
const academy_session_entity_1 = require("../src/academy/entities/academy-session.entity");
const academy_unlock_entity_1 = require("../src/academy/entities/academy-unlock.entity");
const quiz_attempt_entity_1 = require("../src/academy/entities/quiz-attempt.entity");
const academy_notification_entity_1 = require("../src/academy/entities/academy-notification.entity");
const quiz_result_entity_1 = require("../src/academy/entities/quiz-result.entity");
const academy_task_entity_1 = require("../src/academy/entities/academy-task.entity");
const academy_progress_entity_1 = require("../src/academy/entities/academy-progress.entity");
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bsa_crm',
    charset: 'utf8mb4',
    synchronize: false,
    entities: [
        student_entity_1.Student, round_entity_1.Round, academy_content_entity_1.AcademyContent, academy_session_entity_1.AcademySession, academy_unlock_entity_1.AcademyUnlock,
        quiz_attempt_entity_1.QuizAttempt, academy_notification_entity_1.AcademyNotification, quiz_result_entity_1.QuizResult, academy_task_entity_1.AcademyTask, academy_progress_entity_1.AcademyProgress
    ],
});
function parseDate(val) {
    if (val === null || val === undefined || String(val).trim() === '')
        return null;
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
function parseNumber(val) {
    if (val === null || val === undefined || String(val).trim() === '')
        return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
}
function parseBoolean(val) {
    if (val === null || val === undefined)
        return false;
    const str = String(val).trim().toLowerCase();
    return str === 'true' || str === '1' || val === true || val === 1;
}
function parseJson(val) {
    if (val === null || val === undefined || String(val).trim() === '')
        return null;
    try {
        return JSON.parse(val);
    }
    catch {
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
    function getSheetRows(sheetName) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet)
            return [];
        return xlsx.utils.sheet_to_json(sheet);
    }
    console.log('Loading students, rounds, and contents into memory maps...');
    const students = await AppDataSource.getRepository(student_entity_1.Student).find();
    const rounds = await AppDataSource.getRepository(round_entity_1.Round).find();
    const contents = await AppDataSource.getRepository(academy_content_entity_1.AcademyContent).find();
    const studentMap = new Map();
    for (const s of students) {
        if (s.legacyId)
            studentMap.set(s.legacyId, s);
    }
    const roundMap = new Map();
    for (const r of rounds) {
        if (r.legacyId)
            roundMap.set(r.legacyId, r);
    }
    const contentMap = new Map();
    for (const c of contents) {
        const key = c.legacyId || c.id;
        if (key)
            contentMap.set(key, c);
    }
    console.log('Migrating Academy_Sessions...');
    const sessionRows = getSheetRows('Academy_Sessions');
    let sessAdded = 0, sessSkipped = 0;
    for (const row of sessionRows) {
        try {
            const token = row.Token ? String(row.Token).trim() : null;
            if (!token)
                continue;
            const exists = await AppDataSource.getRepository(academy_session_entity_1.AcademySession).findOne({ where: { token } });
            if (exists) {
                sessSkipped++;
                continue;
            }
            const sess = new academy_session_entity_1.AcademySession();
            sess.token = token;
            sess.userId = row.UserID ? String(row.UserID).trim() : '';
            sess.role = row.Role === 'instructor' ? 'instructor' : 'student';
            sess.isBsa = parseBoolean(row.IsBSA);
            sess.createdAt = parseDate(row.CreatedAt) || new Date();
            await AppDataSource.getRepository(academy_session_entity_1.AcademySession).save(sess);
            sessAdded++;
        }
        catch (e) {
            console.error(`Failed for session token ${row.Token}: ${e.message}`);
        }
    }
    console.log(`Academy_Sessions: Added ${sessAdded}, Skipped ${sessSkipped}`);
    console.log('Migrating Academy_Unlocks...');
    const unlockRows = getSheetRows('Academy_Unlocks');
    let unlAdded = 0, unlSkipped = 0;
    for (const row of unlockRows) {
        try {
            const id = row.ID ? String(row.ID).trim() : null;
            if (!id)
                continue;
            const exists = await AppDataSource.getRepository(academy_unlock_entity_1.AcademyUnlock).findOne({ where: { id } });
            if (exists) {
                unlSkipped++;
                continue;
            }
            const unl = new academy_unlock_entity_1.AcademyUnlock();
            unl.id = id;
            unl.studentId = row.StudentID ? String(row.StudentID).trim() : '';
            unl.lectureId = row.LectureID ? String(row.LectureID).trim() : '';
            unl.unlockedBy = row.UnlockedBy ? String(row.UnlockedBy).trim() : '';
            unl.unlockedAt = parseDate(row.UnlockedAt) || new Date();
            await AppDataSource.getRepository(academy_unlock_entity_1.AcademyUnlock).save(unl);
            unlAdded++;
        }
        catch (e) {
            console.error(`Failed for unlock ${row.ID}: ${e.message}`);
        }
    }
    console.log(`Academy_Unlocks: Added ${unlAdded}, Skipped ${unlSkipped}`);
    console.log('Migrating Academy_Quiz_Attempts...');
    const attemptRows = getSheetRows('Academy_Quiz_Attempts');
    let attAdded = 0, attSkipped = 0;
    for (const row of attemptRows) {
        try {
            const legacyAttemptId = row.AttemptID ? String(row.AttemptID).trim() : null;
            if (!legacyAttemptId)
                continue;
            const exists = await AppDataSource.getRepository(quiz_attempt_entity_1.QuizAttempt).findOne({ where: { legacyAttemptId } });
            if (exists) {
                attSkipped++;
                continue;
            }
            const attempt = new quiz_attempt_entity_1.QuizAttempt();
            attempt.legacyAttemptId = legacyAttemptId;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            attempt.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                attempt.student = studentMap.get(sLegacy);
            }
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            attempt.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                attempt.lecture = contentMap.get(lLegacy);
            }
            attempt.questionsJson = parseJson(row.QuestionsJSON);
            attempt.createdAt = parseDate(row.CreatedAt) || new Date();
            attempt.status = row.Status ? String(row.Status).trim() : null;
            await AppDataSource.getRepository(quiz_attempt_entity_1.QuizAttempt).save(attempt);
            attAdded++;
        }
        catch (e) {
            console.error(`Failed for attempt ${row.AttemptID}: ${e.message}`);
        }
    }
    console.log(`Academy_Quiz_Attempts: Added ${attAdded}, Skipped ${attSkipped}`);
    console.log('Migrating Academy_Notifications...');
    const notifRows = getSheetRows('Academy_Notifications');
    let notifAdded = 0, notifSkipped = 0;
    for (const row of notifRows) {
        try {
            const legacyId = row.ID ? String(row.ID).trim() : null;
            if (!legacyId)
                continue;
            const exists = await AppDataSource.getRepository(academy_notification_entity_1.AcademyNotification).findOne({ where: { legacyId } });
            if (exists) {
                notifSkipped++;
                continue;
            }
            const notif = new academy_notification_entity_1.AcademyNotification();
            notif.legacyId = legacyId;
            notif.recipientId = row.RecipientID ? String(row.RecipientID).trim() : null;
            notif.recipientType = row.RecipientType ? String(row.RecipientType).trim() : null;
            notif.type = row.Type ? String(row.Type).trim() : null;
            notif.message = row.Message ? String(row.Message).trim() : null;
            notif.refId = row.RefID ? String(row.RefID).trim() : null;
            notif.isRead = parseBoolean(row.IsRead);
            notif.createdAt = parseDate(row.CreatedAt) || new Date();
            await AppDataSource.getRepository(academy_notification_entity_1.AcademyNotification).save(notif);
            notifAdded++;
        }
        catch (e) {
            console.error(`Failed for notification ${row.ID}: ${e.message}`);
        }
    }
    console.log(`Academy_Notifications: Added ${notifAdded}, Skipped ${notifSkipped}`);
    console.log('Migrating Academy_Quiz_Results...');
    const resRows = getSheetRows('Academy_Quiz_Results');
    let resAdded = 0, resSkipped = 0;
    for (const row of resRows) {
        try {
            const legacyId = row.ID ? String(row.ID).trim() : null;
            if (!legacyId)
                continue;
            const exists = await AppDataSource.getRepository(quiz_result_entity_1.QuizResult).findOne({ where: { legacyId } });
            if (exists) {
                resSkipped++;
                continue;
            }
            const res = new quiz_result_entity_1.QuizResult();
            res.legacyId = legacyId;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            res.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                res.student = studentMap.get(sLegacy);
            }
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            res.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                res.lecture = contentMap.get(lLegacy);
            }
            res.score = parseNumber(row.Score);
            res.passed = parseBoolean(row.Passed);
            res.attemptAt = parseDate(row.AttemptAt) || new Date();
            res.totalQ = parseNumber(row.TotalQ);
            res.correctQ = parseNumber(row.CorrectQ);
            await AppDataSource.getRepository(quiz_result_entity_1.QuizResult).save(res);
            resAdded++;
        }
        catch (e) {
            console.error(`Failed for quiz result ${row.ID}: ${e.message}`);
        }
    }
    console.log(`Academy_Quiz_Results: Added ${resAdded}, Skipped ${resSkipped}`);
    console.log('Migrating Academy_Tasks...');
    const tRows = getSheetRows('Academy_Tasks');
    let tAdded = 0, tSkipped = 0;
    for (const row of tRows) {
        try {
            const legacyId = row.ID ? String(row.ID).trim() : null;
            if (!legacyId)
                continue;
            const exists = await AppDataSource.getRepository(academy_task_entity_1.AcademyTask).findOne({ where: { legacyId } });
            if (exists) {
                tSkipped++;
                continue;
            }
            const task = new academy_task_entity_1.AcademyTask();
            task.legacyId = legacyId;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            task.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                task.student = studentMap.get(sLegacy);
            }
            task.studentName = row.StudentName ? String(row.StudentName).trim() : null;
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            task.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                task.round = roundMap.get(rLegacy);
            }
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            task.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                task.lecture = contentMap.get(lLegacy);
            }
            task.lectureName = row.LectureName ? String(row.LectureName).trim() : null;
            task.driveFileId = row.DriveFileID ? String(row.DriveFileID).trim() : null;
            task.fileName = row.FileName ? String(row.FileName).trim() : null;
            task.submittedAt = parseDate(row.SubmittedAt);
            task.status = row.Status ? String(row.Status).trim() : null;
            task.reviewedAt = parseDate(row.ReviewedAt);
            task.reviewedBy = row.ReviewedBy ? String(row.ReviewedBy).trim() : null;
            task.reviewNotes = row.ReviewNotes ? String(row.ReviewNotes).trim() : null;
            await AppDataSource.getRepository(academy_task_entity_1.AcademyTask).save(task);
            tAdded++;
        }
        catch (e) {
            console.error(`Failed for task ${row.ID}: ${e.message}`);
        }
    }
    console.log(`Academy_Tasks: Added ${tAdded}, Skipped ${tSkipped}`);
    console.log('Migrating Academy_Progress...');
    const progRows = getSheetRows('Academy_Progress');
    let progAdded = 0, progSkipped = 0;
    for (const row of progRows) {
        try {
            const legacyId = row.ID ? String(row.ID).trim() : null;
            if (!legacyId)
                continue;
            const exists = await AppDataSource.getRepository(academy_progress_entity_1.AcademyProgress).findOne({ where: { legacyId } });
            if (exists) {
                progSkipped++;
                continue;
            }
            const prog = new academy_progress_entity_1.AcademyProgress();
            prog.legacyId = legacyId;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            prog.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                prog.student = studentMap.get(sLegacy);
            }
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            prog.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                prog.lecture = contentMap.get(lLegacy);
            }
            prog.watchedAt = parseDate(row.WatchedAt);
            prog.completed = parseBoolean(row.Completed);
            await AppDataSource.getRepository(academy_progress_entity_1.AcademyProgress).save(prog);
            progAdded++;
        }
        catch (e) {
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
//# sourceMappingURL=migrate-portal.js.map