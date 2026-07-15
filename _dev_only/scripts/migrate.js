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
const bcrypt = __importStar(require("bcrypt"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const user_entity_1 = require("../src/sales/entities/user.entity");
const raw_lead_entity_1 = require("../src/sales/entities/raw-lead.entity");
const my_lead_entity_1 = require("../src/sales/entities/my-lead.entity");
const lead_call_log_entity_1 = require("../src/sales/entities/lead-call-log.entity");
const exception_request_entity_1 = require("../src/sales/entities/exception-request.entity");
const support_request_entity_1 = require("../src/sales/entities/support-request.entity");
const break_log_entity_1 = require("../src/sales/entities/break-log.entity");
const celebration_entity_1 = require("../src/sales/entities/celebration.entity");
const task_entity_1 = require("../src/sales/entities/task.entity");
const activity_log_entity_1 = require("../src/sales/entities/activity-log.entity");
const student_entity_1 = require("../src/academy/entities/student.entity");
const instructor_entity_1 = require("../src/academy/entities/instructor.entity");
const round_entity_1 = require("../src/academy/entities/round.entity");
const round_member_entity_1 = require("../src/academy/entities/round-member.entity");
const attendance_record_entity_1 = require("../src/academy/entities/attendance-record.entity");
const enrollment_entity_1 = require("../src/academy/entities/enrollment.entity");
const academy_content_entity_1 = require("../src/academy/entities/academy-content.entity");
const academy_progress_entity_1 = require("../src/academy/entities/academy-progress.entity");
const academy_task_entity_1 = require("../src/academy/entities/academy-task.entity");
const academy_final_project_entity_1 = require("../src/academy/entities/academy-final-project.entity");
const academy_quiz_entity_1 = require("../src/academy/entities/academy-quiz.entity");
const quiz_bank_entity_1 = require("../src/academy/entities/quiz-bank.entity");
const quiz_attempt_entity_1 = require("../src/academy/entities/quiz-attempt.entity");
const quiz_result_entity_1 = require("../src/academy/entities/quiz-result.entity");
const live_session_entity_1 = require("../src/academy/entities/live-session.entity");
const academy_support_entity_1 = require("../src/academy/entities/academy-support.entity");
const academy_support_file_entity_1 = require("../src/academy/entities/academy-support-file.entity");
const academy_post_entity_1 = require("../src/academy/entities/academy-post.entity");
const academy_reaction_entity_1 = require("../src/academy/entities/academy-reaction.entity");
const academy_dm_entity_1 = require("../src/academy/entities/academy-dm.entity");
const academy_notification_entity_1 = require("../src/academy/entities/academy-notification.entity");
const academy_friend_entity_1 = require("../src/academy/entities/academy-friend.entity");
const success_story_entity_1 = require("../src/academy/entities/success-story.entity");
const showcase_project_entity_1 = require("../src/academy/entities/showcase-project.entity");
const academy_ledger_entity_1 = require("../src/financial/entities/academy-ledger.entity");
const installment_entity_1 = require("../src/financial/entities/installment.entity");
const client_payment_entity_1 = require("../src/financial/entities/client-payment.entity");
const payment_transaction_entity_1 = require("../src/financial/entities/payment-transaction.entity");
const financial_data_entity_1 = require("../src/financial/entities/financial-data.entity");
const lecturer_salary_entity_1 = require("../src/financial/entities/lecturer-salary.entity");
const expense_entity_1 = require("../src/financial/entities/expense.entity");
const wallet_income_entity_1 = require("../src/financial/entities/wallet-income.entity");
const wallet_adjustment_entity_1 = require("../src/financial/entities/wallet-adjustment.entity");
const wallet_transfer_entity_1 = require("../src/financial/entities/wallet-transfer.entity");
const offer_entity_1 = require("../src/financial/entities/offer.entity");
const course_entity_1 = require("../src/financial/entities/course.entity");
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bsa_crm',
    synchronize: true,
    entities: [
        user_entity_1.User, raw_lead_entity_1.RawLead, my_lead_entity_1.MyLead, lead_call_log_entity_1.LeadCallLog, exception_request_entity_1.ExceptionRequest, support_request_entity_1.SupportRequest, break_log_entity_1.BreakLog, celebration_entity_1.Celebration, task_entity_1.Task, activity_log_entity_1.ActivityLog,
        student_entity_1.Student, instructor_entity_1.Instructor, round_entity_1.Round, round_member_entity_1.RoundMember, attendance_record_entity_1.AttendanceRecord, enrollment_entity_1.Enrollment, academy_content_entity_1.AcademyContent, academy_progress_entity_1.AcademyProgress, academy_task_entity_1.AcademyTask, academy_final_project_entity_1.AcademyFinalProject, academy_quiz_entity_1.AcademyQuiz, quiz_bank_entity_1.QuizBank, quiz_attempt_entity_1.QuizAttempt, quiz_result_entity_1.QuizResult, live_session_entity_1.LiveSession, academy_support_entity_1.AcademySupport, academy_support_file_entity_1.AcademySupportFile, academy_post_entity_1.AcademyPost, academy_reaction_entity_1.AcademyReaction, academy_dm_entity_1.AcademyDM, academy_notification_entity_1.AcademyNotification, academy_friend_entity_1.AcademyFriend, success_story_entity_1.SuccessStory, showcase_project_entity_1.ShowcaseProject,
        academy_ledger_entity_1.AcademyLedger, installment_entity_1.Installment, client_payment_entity_1.ClientPayment, payment_transaction_entity_1.PaymentTransaction, financial_data_entity_1.FinancialData, lecturer_salary_entity_1.LecturerSalary, expense_entity_1.Expense, wallet_income_entity_1.WalletIncome, wallet_adjustment_entity_1.WalletAdjustment, wallet_transfer_entity_1.WalletTransfer, offer_entity_1.Offer, course_entity_1.Course
    ],
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});
function normalizePhone(val) {
    if (val === null || val === undefined)
        return '';
    let str = String(val).trim();
    if (str.endsWith('.0')) {
        str = str.slice(0, -2);
    }
    str = str.replace(/\D/g, '');
    if (str.length === 10 && ['1', '2', '5'].includes(str[0])) {
        str = '0' + str;
    }
    return str;
}
async function hashPassword(plain) {
    if (!plain)
        return await bcrypt.hash('defaultPass123', 10);
    const plainStr = String(plain).trim();
    if (plainStr.startsWith('$2b$') || plainStr.startsWith('$2a$')) {
        return plainStr;
    }
    return bcrypt.hash(plainStr, 10);
}
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
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}
function parseBoolean(val) {
    if (val === null || val === undefined)
        return false;
    const str = String(val).trim().toLowerCase();
    return str === 'true' || str === '1' || str === 'yes';
}
function parseJson(val) {
    if (val === null || val === undefined || String(val).trim() === '')
        return null;
    if (typeof val === 'object')
        return val;
    try {
        return JSON.parse(val);
    }
    catch {
        return val;
    }
}
function parseStringArray(val) {
    if (val === null || val === undefined || String(val).trim() === '')
        return [];
    if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(s => s !== '');
    }
    return [String(val)];
}
function saveBase64Image(base64Str, id) {
    if (!base64Str || base64Str.trim() === '' || base64Str.trim().toLowerCase() === 'null')
        return '';
    try {
        let matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let ext = 'jpg';
        let data = base64Str;
        if (matches && matches.length === 3) {
            let mimeType = matches[1];
            data = matches[2];
            ext = mimeType.split('/')[1] || 'jpg';
        }
        const buffer = Buffer.from(data, 'base64');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'success_stories');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `success_story_${id}.${ext}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/success_stories/${filename}`;
    }
    catch (e) {
        console.error(`Failed to save image for legacy story ID ${id}:`, e.message);
        return '';
    }
}
function parseCallLogs(notesText) {
    if (!notesText)
        return [];
    const lines = notesText.split('\n');
    const logs = [];
    for (let line of lines) {
        line = line.trim();
        if (!line)
            continue;
        const match = line.match(/^\[([^\]]+)\]\s*\(([^)]+)\)\s*(?:\[([^\]]+)\])?\s*:\s*(.*)$/);
        if (match) {
            const header = match[1].trim();
            const status = match[2].trim();
            const extra = match[3] ? match[3].trim() : '';
            let note = match[4].trim();
            if (extra) {
                note = `[${extra}] ${note}`;
            }
            const headerParts = header.split(' - ');
            const dateStr = headerParts[0].trim();
            const agent = headerParts[1] ? headerParts[1].trim() : 'Unknown';
            let timestamp = new Date();
            try {
                timestamp = new Date(dateStr.replace(/\s+/, 'T'));
                if (isNaN(timestamp.getTime())) {
                    timestamp = new Date();
                }
            }
            catch {
                timestamp = new Date();
            }
            logs.push({
                timestamp,
                agentName: agent,
                status,
                note,
            });
        }
    }
    return logs;
}
function parseInstallment(text, order) {
    if (!text || text.trim() === '' || text.trim().toLowerCase() === 'null')
        return null;
    const parts = text.split(' - ').map(p => p.trim());
    if (parts.length >= 1) {
        const amount = parseFloat(parts[0]) || 0;
        if (amount === 0)
            return null;
        let dueDate = null;
        let method = 'Cash';
        let status = 'pending';
        if (parts.length >= 2) {
            dueDate = new Date(parts[1]);
            if (isNaN(dueDate.getTime()))
                dueDate = null;
        }
        if (parts.length >= 3) {
            method = parts[2];
        }
        if (parts.length >= 4) {
            status = parts[3];
        }
        return {
            amount,
            dueDate,
            paymentMethod: method,
            status,
            installmentOrder: order,
        };
    }
    return null;
}
async function runMigration() {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected successfully!');
    console.log('Cleaning database...');
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize();
    console.log('Database cleaned and synchronized successfully!');
    let excelPath = path.join(process.cwd(), 'جوجل شيت الرئيسي.xlsx');
    if (!fs.existsSync(excelPath)) {
        excelPath = path.join(process.cwd(), 'legacy', 'جوجل شيت الرئيسي.xlsx');
    }
    if (!fs.existsSync(excelPath)) {
        console.error(`Excel file not found in root or legacy directory.`);
        process.exit(1);
    }
    console.log('Loading Excel file...');
    const workbook = xlsx.readFile(excelPath);
    console.log('Excel file loaded successfully!');
    const stats = {};
    function updateStats(sheetName, successCount, failedCount, errorMsgs) {
        stats[sheetName] = {
            success: (stats[sheetName]?.success || 0) + successCount,
            failed: (stats[sheetName]?.failed || 0) + failedCount,
            errors: [...(stats[sheetName]?.errors || []), ...errorMsgs],
        };
    }
    function getSheetRows(sheetName) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            console.warn(`Sheet "${sheetName}" not found in Excel workbook.`);
            return [];
        }
        return xlsx.utils.sheet_to_json(sheet, { defval: null });
    }
    console.log('Migrating Users...');
    const userRows = getSheetRows('Users');
    let usersSuccess = 0, usersFailed = 0;
    const userErrors = [];
    for (const row of userRows) {
        try {
            if (!row.Username)
                continue;
            const user = new user_entity_1.User();
            user.legacyId = row.ID ? String(row.ID).trim() : null;
            user.name = row.Name ? String(row.Name).trim() : 'Unknown';
            user.username = String(row.Username).trim();
            user.password = await hashPassword(row.Password);
            user.role = row.Role ? String(row.Role).trim() : 'Agent';
            user.active = row.Active ? !String(row.Active).toLowerCase().includes('false') : true;
            user.permissions = [];
            if (row.Active && String(row.Active).includes(',')) {
                user.permissions = String(row.Active).split(',').map(p => p.trim());
                user.active = true;
            }
            user.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(user);
            usersSuccess++;
        }
        catch (e) {
            usersFailed++;
            userErrors.push(`Failed for Username: ${row.Username} - Error: ${e.message}`);
        }
    }
    updateStats('Users', usersSuccess, usersFailed, userErrors);
    console.log('Migrating Courses...');
    const courseRows = getSheetRows('Courses');
    let coursesSuccess = 0, coursesFailed = 0;
    const courseErrors = [];
    for (const row of courseRows) {
        try {
            if (!row.CourseName)
                continue;
            const course = new course_entity_1.Course();
            course.courseName = String(row.CourseName).trim();
            course.active = parseBoolean(row.Active !== null ? row.Active : true);
            course.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(course);
            coursesSuccess++;
        }
        catch (e) {
            coursesFailed++;
            courseErrors.push(`Failed for CourseName: ${row.CourseName} - Error: ${e.message}`);
        }
    }
    updateStats('Courses', coursesSuccess, coursesFailed, courseErrors);
    console.log('Migrating Offers...');
    const offerRows = getSheetRows('Offers');
    let offersSuccess = 0, offersFailed = 0;
    const offerErrors = [];
    for (const row of offerRows) {
        try {
            if (!row.OfferName)
                continue;
            const offer = new offer_entity_1.Offer();
            offer.offerName = String(row.OfferName).trim();
            offer.active = parseBoolean(row.Active !== null ? row.Active : true);
            offer.expiresAt = parseDate(row.ExpiresAt);
            offer.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(offer);
            offersSuccess++;
        }
        catch (e) {
            offersFailed++;
            offerErrors.push(`Failed for OfferName: ${row.OfferName} - Error: ${e.message}`);
        }
    }
    updateStats('Offers', offersSuccess, offersFailed, offerErrors);
    console.log('Migrating Rounds...');
    const roundRows = getSheetRows('Rounds');
    let roundsSuccess = 0, roundsFailed = 0;
    const roundErrors = [];
    for (const row of roundRows) {
        try {
            if (!row.ID)
                continue;
            const round = new round_entity_1.Round();
            round.legacyId = String(row.ID).trim();
            round.name = row.Name ? String(row.Name).trim() : 'Unnamed Round';
            round.startDate = parseDate(row.StartDate);
            round.schedule = row.Schedule ? String(row.Schedule).trim() : null;
            round.maxSeats = parseNumber(row.MaxSeats);
            round.enrolled = parseNumber(row.Enrolled);
            round.status = row.Status ? String(row.Status).trim() : null;
            round.type = row.Type ? String(row.Type).trim() : null;
            const keys = Object.keys(row);
            let instrName = '';
            if (keys.length > 9) {
                const instrKey = keys.find(k => k.toLowerCase().includes('instructor') || k === '__EMPTY' || k === '10' || k === '__EMPTY_1');
                if (instrKey) {
                    instrName = String(row[instrKey]).trim();
                }
                else {
                    instrName = String(row[keys[keys.length - 1]]).trim();
                }
            }
            round.instructorName = instrName || null;
            round.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(round);
            roundsSuccess++;
        }
        catch (e) {
            roundsFailed++;
            roundErrors.push(`Failed for Round ID: ${row.ID} - Error: ${e.message}`);
        }
    }
    updateStats('Rounds', roundsSuccess, roundsFailed, roundErrors);
    console.log('Migrating Academy_Students...');
    const studentRows = getSheetRows('Academy_Students');
    let studentsSuccess = 0, studentsFailed = 0;
    const studentErrors = [];
    for (const row of studentRows) {
        try {
            if (!row.ID)
                continue;
            const student = new student_entity_1.Student();
            student.legacyId = String(row.ID).trim();
            student.name = row.Name ? String(row.Name).trim() : 'Unknown Student';
            student.email = row.Email ? String(row.Email).trim().toLowerCase() : null;
            student.password = await hashPassword(row.Password);
            student.phone = normalizePhone(row.Phone);
            student.active = parseBoolean(row.Active !== null ? row.Active : true);
            student.taskFolderId = row.TaskFolderID ? String(row.TaskFolderID).trim() : null;
            student.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(student);
            studentsSuccess++;
        }
        catch (e) {
            studentsFailed++;
            studentErrors.push(`Failed for Student ID: ${row.ID} - Error: ${e.message}`);
        }
    }
    updateStats('Academy_Students', studentsSuccess, studentsFailed, studentErrors);
    console.log('Migrating Academy_Instructors...');
    const instructorRows = getSheetRows('Academy_Instructors');
    let instructorsSuccess = 0, instructorsFailed = 0;
    const instructorErrors = [];
    for (const row of instructorRows) {
        try {
            if (!row.ID)
                continue;
            const instructor = new instructor_entity_1.Instructor();
            instructor.legacyId = String(row.ID).trim();
            instructor.name = row.Name ? String(row.Name).trim() : 'Unknown Instructor';
            instructor.username = row.Username ? String(row.Username).trim() : null;
            instructor.password = await hashPassword(row.Password);
            instructor.active = parseBoolean(row.Active !== null ? row.Active : true);
            instructor.profilePic = row.ProfilePic ? String(row.ProfilePic).trim() : null;
            instructor.isBsa = parseBoolean(row.IsBSA);
            instructor.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(instructor);
            instructorsSuccess++;
        }
        catch (e) {
            instructorsFailed++;
            instructorErrors.push(`Failed for Instructor ID: ${row.ID} - Error: ${e.message}`);
        }
    }
    updateStats('Academy_Instructors', instructorsSuccess, instructorsFailed, instructorErrors);
    const userMap = new Map();
    const dbUsers = await AppDataSource.manager.find(user_entity_1.User);
    for (const u of dbUsers) {
        if (u.legacyId)
            userMap.set(u.legacyId, u);
    }
    const roundMap = new Map();
    const dbRounds = await AppDataSource.manager.find(round_entity_1.Round);
    for (const r of dbRounds) {
        if (r.legacyId)
            roundMap.set(r.legacyId, r);
    }
    const studentMap = new Map();
    const dbStudents = await AppDataSource.manager.find(student_entity_1.Student);
    for (const s of dbStudents) {
        if (s.legacyId)
            studentMap.set(s.legacyId, s);
    }
    console.log('Migrating Raw_Data...');
    const rawDataRows = getSheetRows('Raw_Data');
    let rawSuccess = 0, rawFailed = 0;
    const rawErrors = [];
    for (const row of rawDataRows) {
        try {
            const rawLead = new raw_lead_entity_1.RawLead();
            rawLead.legacyId = row.ID ? String(row.ID).trim() : null;
            rawLead.date = parseDate(row.Date);
            rawLead.name = row.Name ? String(row.Name).trim() : null;
            rawLead.phone = normalizePhone(row.Phone);
            rawLead.source = row.Source ? String(row.Source).trim() : null;
            rawLead.course = row.Course ? String(row.Course).trim() : null;
            const agentLegacy = row.Agent ? String(row.Agent).trim() : null;
            rawLead.agentLegacyId = agentLegacy;
            if (agentLegacy && userMap.has(agentLegacy)) {
                rawLead.agent = userMap.get(agentLegacy);
            }
            rawLead.status = row.Status ? String(row.Status).trim() : null;
            rawLead.notes = row.Notes ? String(row.Notes).trim() : null;
            rawLead.action = row.Action ? String(row.Action).trim() : null;
            rawLead.newAction = row['نيو اكشن'] ? String(row['نيو اكشن']).trim() : null;
            rawLead.followUpDate = parseDate(row['تاريخ المتابعه']);
            rawLead.campaignType = row.Campaign_Type ? String(row.Campaign_Type).trim() : null;
            rawLead.lastModified = parseDate(row.LastModified);
            rawLead.ocCode = row['OC CODE'] ? String(row['OC CODE']).trim() : null;
            await AppDataSource.manager.save(rawLead);
            rawSuccess++;
        }
        catch (e) {
            rawFailed++;
            rawErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Raw_Data', rawSuccess, rawFailed, rawErrors);
    console.log('Migrating My_Leads...');
    const myLeadsRows = getSheetRows('My_Leads');
    let mySuccess = 0, myFailed = 0;
    const myErrors = [];
    for (const row of myLeadsRows) {
        try {
            const myLead = new my_lead_entity_1.MyLead();
            myLead.legacyId = row.ID ? String(row.ID).trim() : null;
            myLead.date = parseDate(row.Date);
            myLead.name = row.Name ? String(row.Name).trim() : null;
            myLead.phone = normalizePhone(row.Phone);
            myLead.source = row.Source ? String(row.Source).trim() : null;
            myLead.course = row.Course ? String(row.Course).trim() : null;
            const agentLegacy = row.Agent ? String(row.Agent).trim() : null;
            myLead.agentLegacyId = agentLegacy;
            if (agentLegacy && userMap.has(agentLegacy)) {
                myLead.agent = userMap.get(agentLegacy);
            }
            myLead.status = row.Notes ? String(row.Notes).trim() : null;
            myLead.legacyNotes = row.Action ? String(row.Action).trim() : null;
            myLead.action = row.Action ? String(row.Action).trim() : null;
            myLead.followUpDate = parseDate(row['تاريخ المتابعه']);
            myLead.campaignType = row['Campaign Type'] ? String(row['Campaign Type']).trim() : null;
            const savedLead = await AppDataSource.manager.save(myLead);
            if (row.Action) {
                const parsedLogs = parseCallLogs(String(row.Action));
                for (const logItem of parsedLogs) {
                    const log = new lead_call_log_entity_1.LeadCallLog();
                    log.lead = savedLead;
                    log.timestamp = logItem.timestamp;
                    log.agentName = logItem.agentName;
                    log.status = logItem.status;
                    log.note = logItem.note;
                    await AppDataSource.manager.save(log);
                }
            }
            mySuccess++;
        }
        catch (e) {
            myFailed++;
            myErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('My_Leads', mySuccess, myFailed, myErrors);
    console.log('Migrating Round_Members...');
    const memberRows = getSheetRows('Round_Members');
    let membersSuccess = 0, membersFailed = 0;
    const memberErrors = [];
    for (const row of memberRows) {
        try {
            const member = new round_member_entity_1.RoundMember();
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            member.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                member.round = roundMap.get(rLegacy);
            }
            member.ocCode = row.OC_Code ? String(row.OC_Code).trim() : null;
            member.name = row.Name ? String(row.Name).trim() : null;
            member.phone = normalizePhone(row.Phone);
            member.action = row.Action ? String(row.Action).trim() : null;
            member.price = parseNumber(row.Price);
            member.paid = parseNumber(row.Paid);
            member.method = row.Method ? String(row.Method).trim() : null;
            member.attendance = row.Attendance ? String(row.Attendance).trim() : null;
            const aLegacy = row.AgentID ? String(row.AgentID).trim() : null;
            member.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                member.agent = userMap.get(aLegacy);
            }
            member.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            member.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(member);
            membersSuccess++;
        }
        catch (e) {
            membersFailed++;
            memberErrors.push(`Failed for Round ${row.RoundID} - Member Name ${row.Name}: ${e.message}`);
        }
    }
    updateStats('Round_Members', membersSuccess, membersFailed, memberErrors);
    console.log('Migrating Rounds_Attendance...');
    const attendanceRows = getSheetRows('Rounds_Attendance');
    let attSuccess = 0, attFailed = 0;
    const attErrors = [];
    for (const row of attendanceRows) {
        try {
            const att = new attendance_record_entity_1.AttendanceRecord();
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            att.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                att.round = roundMap.get(rLegacy);
            }
            att.studentPhone = normalizePhone(row.StudentPhone);
            att.studentName = row.StudentName ? String(row.StudentName).trim() : null;
            att.attendedList = parseStringArray(row.AttendedList);
            att.tasksList = parseStringArray(row.TasksList);
            att.lastUpdated = parseDate(row.LastUpdated);
            await AppDataSource.manager.save(att);
            attSuccess++;
        }
        catch (e) {
            attFailed++;
            attErrors.push(`Failed for Round ${row.RoundID} - Phone ${row.StudentPhone}: ${e.message}`);
        }
    }
    updateStats('Rounds_Attendance', attSuccess, attFailed, attErrors);
    console.log('Migrating Academy_Enrollments...');
    const enrollRows = getSheetRows('Academy_Enrollments');
    let enrollSuccess = 0, enrollFailed = 0;
    const enrollErrors = [];
    for (const row of enrollRows) {
        try {
            const enroll = new enrollment_entity_1.Enrollment();
            enroll.legacyId = row.ID ? String(row.ID).trim() : null;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            enroll.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                enroll.student = studentMap.get(sLegacy);
            }
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            enroll.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                enroll.round = roundMap.get(rLegacy);
            }
            enroll.roundName = row.RoundName ? String(row.RoundName).trim() : null;
            enroll.enrolledAt = parseDate(row.EnrolledAt);
            enroll.status = row.Status ? String(row.Status).trim() : null;
            await AppDataSource.manager.save(enroll);
            enrollSuccess++;
        }
        catch (e) {
            enrollFailed++;
            enrollErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Enrollments', enrollSuccess, enrollFailed, enrollErrors);
    console.log('Migrating Academy_Content...');
    const contentRows = getSheetRows('Academy_Content');
    let contentSuccess = 0, contentFailed = 0;
    const contentErrors = [];
    for (const row of contentRows) {
        try {
            const content = new academy_content_entity_1.AcademyContent();
            content.legacyId = row.ID ? String(row.ID).trim() : null;
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            content.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                content.round = roundMap.get(rLegacy);
            }
            content.roundName = row.RoundName ? String(row.RoundName).trim() : null;
            content.lectureOrder = parseNumber(row.LectureOrder);
            content.lectureName = row.LectureName ? String(row.LectureName).trim() : null;
            content.driveFileId = row.DriveFileID ? String(row.DriveFileID).trim() : null;
            content.fileType = row.FileType ? String(row.FileType).trim() : null;
            content.isLocked = parseBoolean(row.IsLocked);
            content.taskRequired = parseBoolean(row.TaskRequired);
            content.notes = row.Notes ? String(row.Notes).trim() : null;
            content.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(content);
            contentSuccess++;
        }
        catch (e) {
            contentFailed++;
            contentErrors.push(`Failed for Content ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Content', contentSuccess, contentFailed, contentErrors);
    const contentMap = new Map();
    const dbContents = await AppDataSource.manager.find(academy_content_entity_1.AcademyContent);
    for (const c of dbContents) {
        if (c.legacyId)
            contentMap.set(c.legacyId, c);
    }
    console.log('Migrating Exception_Requests...');
    const excRows = getSheetRows('Exception_Requests');
    let excSuccess = 0, excFailed = 0;
    const excErrors = [];
    for (const row of excRows) {
        try {
            const req = new exception_request_entity_1.ExceptionRequest();
            req.legacyId = row.ID ? String(row.ID).trim() : null;
            const aLegacy = row.AgentID ? String(row.AgentID).trim() : null;
            req.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                req.agent = userMap.get(aLegacy);
            }
            req.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            req.clientName = row.ClientName ? String(row.ClientName).trim() : null;
            req.clientPhone = normalizePhone(row.ClientPhone);
            req.clientOc = row.ClientOC ? String(row.ClientOC).trim() : null;
            req.type = row.Type ? String(row.Type).trim() : null;
            req.details = row.Details ? String(row.Details).trim() : null;
            req.status = row.Status ? String(row.Status).trim() : null;
            req.deadline = parseDate(row.Deadline);
            req.adminNote = row.AdminNote ? String(row.AdminNote).trim() : null;
            req.createdAt = parseDate(row.CreatedAt);
            req.decidedAt = parseDate(row.DecidedAt);
            req.resolvedAt = parseDate(row.ResolvedAt);
            await AppDataSource.manager.save(req);
            excSuccess++;
        }
        catch (e) {
            excFailed++;
            excErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Exception_Requests', excSuccess, excFailed, excErrors);
    console.log('Migrating Support_Requests...');
    const suppRows = getSheetRows('Support_Requests');
    let suppSuccess = 0, suppFailed = 0;
    const suppErrors = [];
    for (const row of suppRows) {
        try {
            const req = new support_request_entity_1.SupportRequest();
            req.legacyId = row.ID ? String(row.ID).trim() : null;
            const aLegacy = row.AgentID ? String(row.AgentID).trim() : null;
            req.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                req.agent = userMap.get(aLegacy);
            }
            req.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            req.clientName = row.ClientName ? String(row.ClientName).trim() : null;
            req.clientPhone = normalizePhone(row.ClientPhone);
            req.clientOc = row.ClientOC ? String(row.ClientOC).trim() : null;
            req.comment = row.Comment ? String(row.Comment).trim() : null;
            req.status = row.Status ? String(row.Status).trim() : null;
            req.managerResult = row.ManagerResult ? String(row.ManagerResult).trim() : null;
            req.createdAt = parseDate(row.CreatedAt);
            req.resolvedAt = parseDate(row.ResolvedAt);
            await AppDataSource.manager.save(req);
            suppSuccess++;
        }
        catch (e) {
            suppFailed++;
            suppErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Support_Requests', suppSuccess, suppFailed, suppErrors);
    console.log('Migrating Break_Log...');
    const breakRows = getSheetRows('Break_Log');
    let breakSuccess = 0, breakFailed = 0;
    const breakErrors = [];
    for (const row of breakRows) {
        try {
            const log = new break_log_entity_1.BreakLog();
            const aLegacy = row.AgentID ? String(row.AgentID).trim() : null;
            log.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                log.agent = userMap.get(aLegacy);
            }
            log.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            const breakDate = parseDate(row.Date);
            log.date = breakDate ? `${breakDate.getFullYear()}-${String(breakDate.getMonth() + 1).padStart(2, '0')}-${String(breakDate.getDate()).padStart(2, '0')}` : null;
            log.loginTime = parseDate(row.LoginTime);
            log.logoutTime = parseDate(row.LogoutTime);
            log.lunchStart = parseDate(row.Lunch_Start);
            log.lunchEnd = parseDate(row.Lunch_End);
            log.break1Start = parseDate(row.Break1_Start);
            log.break1End = parseDate(row.Break1_End);
            log.break2Start = parseDate(row.Break2_Start);
            log.break2End = parseDate(row.Break2_End);
            log.workDuration = row.Work_Duration ? String(row.Work_Duration).trim() : null;
            log.totalBreak = row.Total_Break ? String(row.Total_Break).trim() : null;
            log.overtime = row.Overtime ? String(row.Overtime).trim() : null;
            log.earlyLogoutReason = row.Early_Logout_Reason ? String(row.Early_Logout_Reason).trim() : null;
            await AppDataSource.manager.save(log);
            breakSuccess++;
        }
        catch (e) {
            breakFailed++;
            breakErrors.push(`Failed for Agent ${row.AgentID} on Date ${row.Date}: ${e.message}`);
        }
    }
    updateStats('Break_Log', breakSuccess, breakFailed, breakErrors);
    console.log('Migrating Celebrations...');
    const celebRows = getSheetRows('Celebrations');
    let celebSuccess = 0, celebFailed = 0;
    const celebErrors = [];
    for (const row of celebRows) {
        try {
            const celeb = new celebration_entity_1.Celebration();
            celeb.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            celeb.timestamp = parseDate(row.Timestamp);
            celeb.seen = parseBoolean(row.Seen);
            await AppDataSource.manager.save(celeb);
            celebSuccess++;
        }
        catch (e) {
            celebFailed++;
            celebErrors.push(`Failed for Agent ${row.AgentName}: ${e.message}`);
        }
    }
    updateStats('Celebrations', celebSuccess, celebFailed, celebErrors);
    console.log('Migrating Tasks...');
    const taskRows = getSheetRows('Tasks');
    let taskSuccess = 0, taskFailed = 0;
    const taskErrors = [];
    for (const row of taskRows) {
        try {
            const task = new task_entity_1.Task();
            task.legacyId = row.ID ? String(row.ID).trim() : null;
            task.note = row.Note ? String(row.Note).trim() : null;
            task.status = row.Status ? String(row.Status).trim() : null;
            task.time = parseDate(row.Time);
            await AppDataSource.manager.save(task);
            taskSuccess++;
        }
        catch (e) {
            taskFailed++;
            taskErrors.push(`Failed for Task ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Tasks', taskSuccess, taskFailed, taskErrors);
    console.log('Migrating Activity_Log...');
    const actRows = getSheetRows('Activity_Log');
    let actSuccess = 0, actFailed = 0;
    const actErrors = [];
    for (const row of actRows) {
        try {
            const log = new activity_log_entity_1.ActivityLog();
            log.date = parseDate(row.Date);
            const uLegacy = row.ID ? String(row.ID).trim() : null;
            log.userLegacyId = uLegacy;
            if (uLegacy && userMap.has(uLegacy)) {
                log.user = userMap.get(uLegacy);
            }
            log.name = row.Name ? String(row.Name).trim() : null;
            log.status = row.Status ? String(row.Status).trim() : null;
            log.notes = row.Notes ? String(row.Notes).trim() : null;
            await AppDataSource.manager.save(log);
            actSuccess++;
        }
        catch (e) {
            actFailed++;
            actErrors.push(`Failed on Date ${row.Date}: ${e.message}`);
        }
    }
    updateStats('Activity_Log', actSuccess, actFailed, actErrors);
    console.log('Migrating Academy_Progress...');
    const progRows = getSheetRows('Academy_Progress');
    let progSuccess = 0, progFailed = 0;
    const progErrors = [];
    for (const row of progRows) {
        try {
            const prog = new academy_progress_entity_1.AcademyProgress();
            prog.legacyId = row.ID ? String(row.ID).trim() : null;
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
            await AppDataSource.manager.save(prog);
            progSuccess++;
        }
        catch (e) {
            progFailed++;
            progErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Progress', progSuccess, progFailed, progErrors);
    console.log('Migrating Academy_Tasks...');
    const tRows = getSheetRows('Academy_Tasks');
    let tSuccess = 0, tFailed = 0;
    const tErrors = [];
    for (const row of tRows) {
        try {
            const task = new academy_task_entity_1.AcademyTask();
            task.legacyId = row.ID ? String(row.ID).trim() : null;
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
            await AppDataSource.manager.save(task);
            tSuccess++;
        }
        catch (e) {
            tFailed++;
            tErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Tasks', tSuccess, tFailed, tErrors);
    console.log('Migrating Academy_Final_Projects...');
    const projRows = getSheetRows('Academy_Final_Projects');
    let projSuccess = 0, projFailed = 0;
    const projErrors = [];
    for (const row of projRows) {
        try {
            const proj = new academy_final_project_entity_1.AcademyFinalProject();
            proj.legacyId = row.ID ? String(row.ID).trim() : null;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            proj.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                proj.student = studentMap.get(sLegacy);
            }
            proj.studentName = row.StudentName ? String(row.StudentName).trim() : null;
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            proj.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                proj.round = roundMap.get(rLegacy);
            }
            proj.driveFileId = row.DriveFileID ? String(row.DriveFileID).trim() : null;
            proj.fileName = row.FileName ? String(row.FileName).trim() : null;
            proj.submittedAt = parseDate(row.SubmittedAt);
            proj.status = row.Status ? String(row.Status).trim() : null;
            proj.reviewNotes = row.ReviewNotes ? String(row.ReviewNotes).trim() : null;
            proj.reviewedBy = row.ReviewedBy ? String(row.ReviewedBy).trim() : null;
            proj.reviewedAt = parseDate(row.ReviewedAt);
            proj.outlineFileId = row.OutlineFileID ? String(row.OutlineFileID).trim() : null;
            proj.outlineFileName = row.OutlineFileName ? String(row.OutlineFileName).trim() : null;
            await AppDataSource.manager.save(proj);
            projSuccess++;
        }
        catch (e) {
            projFailed++;
            projErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Final_Projects', projSuccess, projFailed, projErrors);
    console.log('Migrating Academy_Quizzes...');
    const quizRows = getSheetRows('Academy_Quizzes');
    let quizSuccess = 0, quizFailed = 0;
    const quizErrors = [];
    for (const row of quizRows) {
        try {
            const quiz = new academy_quiz_entity_1.AcademyQuiz();
            quiz.legacyId = row.ID ? String(row.ID).trim() : null;
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            quiz.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                quiz.lecture = contentMap.get(lLegacy);
            }
            const rLegacy = row.RoundID ? String(row.RoundID).trim() : null;
            quiz.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                quiz.round = roundMap.get(rLegacy);
            }
            quiz.lectureName = row.LectureName ? String(row.LectureName).trim() : null;
            quiz.questionsJson = parseJson(row.QuestionsJSON);
            quiz.passScore = parseNumber(row.PassScore);
            quiz.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(quiz);
            quizSuccess++;
        }
        catch (e) {
            quizFailed++;
            quizErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Quizzes', quizSuccess, quizFailed, quizErrors);
    console.log('Migrating Quiz_Bank...');
    const bankRows = getSheetRows('Quiz_Bank');
    let bankSuccess = 0, bankFailed = 0;
    const bankErrors = [];
    for (const row of bankRows) {
        try {
            const q = new quiz_bank_entity_1.QuizBank();
            const lLegacy = row.Lecture_ID ? String(row.Lecture_ID).trim() : null;
            q.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                q.lecture = contentMap.get(lLegacy);
            }
            q.lectureName = row.Lecture_Name ? String(row.Lecture_Name).trim() : null;
            q.instructor = row.Instructor ? String(row.Instructor).trim() : null;
            q.question = row.Question ? String(row.Question).trim() : null;
            q.optionA = row.Option_A ? String(row.Option_A).trim() : null;
            q.optionB = row.Option_B ? String(row.Option_B).trim() : null;
            q.optionC = row.Option_C ? String(row.Option_C).trim() : null;
            q.optionD = row.Option_D ? String(row.Option_D).trim() : null;
            q.correct = parseNumber(row.Correct);
            q.notes = row.Notes ? String(row.Notes).trim() : null;
            await AppDataSource.manager.save(q);
            bankSuccess++;
        }
        catch (e) {
            bankFailed++;
            bankErrors.push(`Failed: ${e.message}`);
        }
    }
    updateStats('Quiz_Bank', bankSuccess, bankFailed, bankErrors);
    console.log('Migrating Academy_Quiz_Attempts...');
    const attemptRows = getSheetRows('Academy_Quiz_Attempts');
    let attAttemptSuccess = 0, attAttemptFailed = 0;
    const attAttemptErrors = [];
    for (const row of attemptRows) {
        try {
            const attempt = new quiz_attempt_entity_1.QuizAttempt();
            attempt.legacyAttemptId = row.AttemptID ? String(row.AttemptID).trim() : null;
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
            attempt.createdAt = parseDate(row.CreatedAt);
            attempt.status = row.Status ? String(row.Status).trim() : null;
            await AppDataSource.manager.save(attempt);
            attAttemptSuccess++;
        }
        catch (e) {
            attAttemptFailed++;
            attAttemptErrors.push(`Failed for ID ${row.AttemptID}: ${e.message}`);
        }
    }
    updateStats('Academy_Quiz_Attempts', attAttemptSuccess, attAttemptFailed, attAttemptErrors);
    console.log('Migrating Academy_Quiz_Results...');
    const resRows = getSheetRows('Academy_Quiz_Results');
    let resSuccess = 0, resFailed = 0;
    const resErrors = [];
    for (const row of resRows) {
        try {
            const res = new quiz_result_entity_1.QuizResult();
            res.legacyId = row.ID ? String(row.ID).trim() : null;
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
            res.attemptAt = parseDate(row.AttemptAt);
            res.totalQ = parseNumber(row.TotalQ);
            res.correctQ = parseNumber(row.CorrectQ);
            await AppDataSource.manager.save(res);
            resSuccess++;
        }
        catch (e) {
            resFailed++;
            resErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Quiz_Results', resSuccess, resFailed, resErrors);
    console.log('Migrating Academy_LiveSessions...');
    const sessRows = getSheetRows('Academy_LiveSessions');
    let sessSuccess = 0, sessFailed = 0;
    const sessErrors = [];
    for (const row of sessRows) {
        try {
            const sess = new live_session_entity_1.LiveSession();
            sess.legacySessionId = row.SessionId ? String(row.SessionId).trim() : null;
            const rLegacy = row.RoundId ? String(row.RoundId).trim() : null;
            sess.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                sess.round = roundMap.get(rLegacy);
            }
            sess.roundName = row.RoundName ? String(row.RoundName).trim() : null;
            sess.title = row.Title ? String(row.Title).trim() : null;
            sess.meetLink = row.MeetLink ? String(row.MeetLink).trim() : null;
            sess.platform = row.Platform ? String(row.Platform).trim() : null;
            sess.startTime = parseDate(row.StartTime);
            sess.endTime = parseDate(row.EndTime);
            sess.createdBy = row.CreatedBy ? String(row.CreatedBy).trim() : null;
            sess.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(sess);
            sessSuccess++;
        }
        catch (e) {
            sessFailed++;
            sessErrors.push(`Failed for Session ${row.SessionId}: ${e.message}`);
        }
    }
    updateStats('Academy_LiveSessions', sessSuccess, sessFailed, sessErrors);
    console.log('Migrating Academy_Support...');
    const supportRows = getSheetRows('Academy_Support');
    let supportSuccess = 0, supportFailed = 0;
    const supportErrors = [];
    for (const row of supportRows) {
        try {
            const support = new academy_support_entity_1.AcademySupport();
            support.legacyId = row.ID ? String(row.ID).trim() : null;
            const sLegacy = row.StudentID ? String(row.StudentID).trim() : null;
            support.studentLegacyId = sLegacy;
            if (sLegacy && studentMap.has(sLegacy)) {
                support.student = studentMap.get(sLegacy);
            }
            support.studentName = row.StudentName ? String(row.StudentName).trim() : null;
            support.subject = row.Subject ? String(row.Subject).trim() : null;
            support.message = row.Message ? String(row.Message).trim() : null;
            support.status = row.Status ? String(row.Status).trim() : null;
            support.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(support);
            supportSuccess++;
        }
        catch (e) {
            supportFailed++;
            supportErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Support', supportSuccess, supportFailed, supportErrors);
    console.log('Migrating Academy_Support_Files...');
    const sFileRows = getSheetRows('Academy_Support_Files');
    let sFileSuccess = 0, sFileFailed = 0;
    const sFileErrors = [];
    for (const row of sFileRows) {
        try {
            const file = new academy_support_file_entity_1.AcademySupportFile();
            file.legacyId = row.ID ? String(row.ID).trim() : null;
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            file.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                file.lecture = contentMap.get(lLegacy);
            }
            file.lectureName = row.LectureName ? String(row.LectureName).trim() : null;
            file.title = row.Title ? String(row.Title).trim() : null;
            file.driveFileId = row.DriveFileID ? String(row.DriveFileID).trim() : null;
            file.fileName = row.FileName ? String(row.FileName).trim() : null;
            file.fileType = row.FileType ? String(row.FileType).trim() : null;
            file.url = row.URL ? String(row.URL).trim() : null;
            file.createdAt = parseDate(row.CreatedAt);
            file.createdBy = row.CreatedBy ? String(row.CreatedBy).trim() : null;
            await AppDataSource.manager.save(file);
            sFileSuccess++;
        }
        catch (e) {
            sFileFailed++;
            sFileErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Support_Files', sFileSuccess, sFileFailed, sFileErrors);
    console.log('Migrating Academy_Comments & Academy_Community...');
    const commentRows = getSheetRows('Academy_Comments');
    const communityRows = getSheetRows('Academy_Community');
    let postsSuccess = 0, postsFailed = 0;
    const postErrors = [];
    for (const row of commentRows) {
        try {
            const post = new academy_post_entity_1.AcademyPost();
            post.legacyId = row.ID ? String(row.ID).trim() : null;
            post.contextType = 'lecture';
            const lLegacy = row.LectureID ? String(row.LectureID).trim() : null;
            post.lectureLegacyId = lLegacy;
            if (lLegacy && contentMap.has(lLegacy)) {
                post.lecture = contentMap.get(lLegacy);
            }
            post.authorId = row.AuthorID ? String(row.AuthorID).trim() : null;
            post.authorType = row.AuthorType ? String(row.AuthorType).trim() : null;
            post.authorName = row.AuthorName ? String(row.AuthorName).trim() : null;
            post.content = row.Content ? String(row.Content).trim() : null;
            post.legacyParentId = row.ParentID ? String(row.ParentID).trim() : null;
            post.likeCount = parseNumber(row.LikeCount) || 0;
            post.createdAt = parseDate(row.CreatedAt);
            post.deleted = parseBoolean(row.Deleted);
            await AppDataSource.manager.save(post);
            postsSuccess++;
        }
        catch (e) {
            postsFailed++;
            postErrors.push(`Comment Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    for (const row of communityRows) {
        try {
            const post = new academy_post_entity_1.AcademyPost();
            post.legacyId = row.ID ? String(row.ID).trim() : null;
            post.contextType = 'community';
            post.lecture = null;
            post.lectureLegacyId = null;
            post.authorId = row.AuthorID ? String(row.AuthorID).trim() : null;
            post.authorType = row.AuthorType ? String(row.AuthorType).trim() : null;
            post.authorName = row.AuthorName ? String(row.AuthorName).trim() : null;
            post.content = row.Content ? String(row.Content).trim() : null;
            post.legacyParentId = row.ParentID ? String(row.ParentID).trim() : null;
            post.likeCount = parseNumber(row.LikeCount) || 0;
            post.createdAt = parseDate(row.CreatedAt);
            post.deleted = parseBoolean(row.Deleted);
            await AppDataSource.manager.save(post);
            postsSuccess++;
        }
        catch (e) {
            postsFailed++;
            postErrors.push(`Community Post Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Posts', postsSuccess, postsFailed, postErrors);
    console.log('Resolving parent-child relations on Academy Posts...');
    const dbPosts = await AppDataSource.manager.find(academy_post_entity_1.AcademyPost);
    const postMap = new Map();
    for (const p of dbPosts) {
        if (p.legacyId)
            postMap.set(p.legacyId, p);
    }
    for (const p of dbPosts) {
        if (p.legacyParentId && postMap.has(p.legacyParentId)) {
            p.parent = postMap.get(p.legacyParentId);
            p.parentId = p.parent.id;
            await AppDataSource.manager.save(p);
        }
    }
    console.log('Migrating Academy_Reactions...');
    const reactRows = getSheetRows('Academy_Reactions');
    let reactSuccess = 0, reactFailed = 0;
    const reactErrors = [];
    for (const row of reactRows) {
        try {
            const reaction = new academy_reaction_entity_1.AcademyReaction();
            reaction.legacyId = row.ID ? String(row.ID).trim() : null;
            reaction.itemType = row.ItemType ? String(row.ItemType).trim() : 'post';
            reaction.itemId = row.ItemID ? String(row.ItemID).trim() : null;
            reaction.userId = row.UserID ? String(row.UserID).trim() : null;
            reaction.reactionType = row.ReactionType ? String(row.ReactionType).trim() : null;
            reaction.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(reaction);
            reactSuccess++;
        }
        catch (e) {
            reactFailed++;
            reactErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Reactions', reactSuccess, reactFailed, reactErrors);
    console.log('Migrating Academy_DMs...');
    const dmRows = getSheetRows('Academy_DMs');
    let dmSuccess = 0, dmFailed = 0;
    const dmErrors = [];
    for (const row of dmRows) {
        try {
            const dm = new academy_dm_entity_1.AcademyDM();
            dm.legacyMsgId = row.MsgId ? String(row.MsgId).trim() : null;
            dm.fromId = row.FromId ? String(row.FromId).trim() : null;
            dm.fromName = row.FromName ? String(row.FromName).trim() : null;
            dm.toId = row.ToId ? String(row.ToId).trim() : null;
            dm.toName = row.ToName ? String(row.ToName).trim() : null;
            dm.message = row.Message ? String(row.Message).trim() : null;
            dm.timestamp = parseDate(row.Timestamp);
            dm.readAt = parseDate(row.ReadAt);
            await AppDataSource.manager.save(dm);
            dmSuccess++;
        }
        catch (e) {
            dmFailed++;
            dmErrors.push(`Failed for DM ID ${row.MsgId}: ${e.message}`);
        }
    }
    updateStats('Academy_DMs', dmSuccess, dmFailed, dmErrors);
    console.log('Migrating Academy_Notifications...');
    const notifRows = getSheetRows('Academy_Notifications');
    let notifSuccess = 0, notifFailed = 0;
    const notifErrors = [];
    for (const row of notifRows) {
        try {
            const notif = new academy_notification_entity_1.AcademyNotification();
            notif.legacyId = row.ID ? String(row.ID).trim() : null;
            notif.recipientId = row.RecipientID ? String(row.RecipientID).trim() : null;
            notif.recipientType = row.RecipientType ? String(row.RecipientType).trim() : null;
            notif.type = row.Type ? String(row.Type).trim() : null;
            notif.message = row.Message ? String(row.Message).trim() : null;
            notif.refId = row.RefID ? String(row.RefID).trim() : null;
            notif.isRead = parseBoolean(row.IsRead);
            notif.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(notif);
            notifSuccess++;
        }
        catch (e) {
            notifFailed++;
            notifErrors.push(`Failed for Notification ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Notifications', notifSuccess, notifFailed, notifErrors);
    console.log('Migrating Academy_Friends...');
    const friendRows = getSheetRows('Academy_Friends');
    let friendSuccess = 0, friendFailed = 0;
    const friendErrors = [];
    for (const row of friendRows) {
        try {
            const friend = new academy_friend_entity_1.AcademyFriend();
            friend.userLegacyId = row.UserId ? String(row.UserId).trim() : null;
            friend.friendLegacyId = row.FriendId ? String(row.FriendId).trim() : null;
            friend.status = row.Status ? String(row.Status).trim() : null;
            friend.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(friend);
            friendSuccess++;
        }
        catch (e) {
            friendFailed++;
            friendErrors.push(`Failed for Friend User ${row.UserId} - Friend ${row.FriendId}: ${e.message}`);
        }
    }
    updateStats('Academy_Friends', friendSuccess, friendFailed, friendErrors);
    console.log('Migrating Academy_Success_Stories...');
    const storyRows = getSheetRows('Academy_Success_Stories');
    let storySuccess = 0, storyFailed = 0;
    const storyErrors = [];
    for (const row of storyRows) {
        try {
            const story = new success_story_entity_1.SuccessStory();
            const legacyId = row.ID ? String(row.ID).trim() : null;
            story.legacyId = legacyId;
            story.authorId = row.AuthorID ? String(row.AuthorID).trim() : null;
            story.authorName = row.AuthorName ? String(row.AuthorName).trim() : null;
            story.authorRole = row.AuthorRole ? String(row.AuthorRole).trim() : null;
            story.title = row.Title ? String(row.Title).trim() : null;
            story.content = row.Content ? String(row.Content).trim() : null;
            if (row.ImageBase64 && legacyId) {
                const imageUrl = saveBase64Image(String(row.ImageBase64), legacyId);
                story.imageUrl = imageUrl || null;
            }
            else {
                story.imageUrl = null;
            }
            story.approved = parseBoolean(row.Approved);
            story.createdAt = parseDate(row.CreatedAt);
            story.likesCount = parseNumber(row.LikesCount) || 0;
            story.deleted = parseBoolean(row.Deleted);
            await AppDataSource.manager.save(story);
            storySuccess++;
        }
        catch (e) {
            storyFailed++;
            storyErrors.push(`Failed for Story ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Academy_Success_Stories', storySuccess, storyFailed, storyErrors);
    console.log('Migrating Academy_BSA_Showcase...');
    const showRows = getSheetRows('Academy_BSA_Showcase');
    let showSuccess = 0, showFailed = 0;
    const showErrors = [];
    for (const row of showRows) {
        try {
            const showcase = new showcase_project_entity_1.ShowcaseProject();
            showcase.legacyProjectId = row.ProjectId ? String(row.ProjectId).trim() : null;
            showcase.title = row.Title ? String(row.Title).trim() : null;
            showcase.description = row.Description ? String(row.Description).trim() : null;
            showcase.imageUrl = row.ImageUrl ? String(row.ImageUrl).trim() : null;
            showcase.projectUrl = row.ProjectUrl ? String(row.ProjectUrl).trim() : null;
            showcase.tags = row.Tags ? String(row.Tags).trim() : null;
            showcase.visible = parseBoolean(row.Visible !== null ? row.Visible : true);
            showcase.addedBy = row.AddedBy ? String(row.AddedBy).trim() : null;
            showcase.addedAt = parseDate(row.AddedAt);
            await AppDataSource.manager.save(showcase);
            showSuccess++;
        }
        catch (e) {
            showFailed++;
            showErrors.push(`Failed for Project ${row.ProjectId}: ${e.message}`);
        }
    }
    updateStats('Academy_BSA_Showcase', showSuccess, showFailed, showErrors);
    console.log('Migrating Academy_Ledger...');
    const ledgerRows = getSheetRows('Academy_Ledger');
    let ledgerSuccess = 0, ledgerFailed = 0;
    const ledgerErrors = [];
    for (const row of ledgerRows) {
        try {
            const ledger = new academy_ledger_entity_1.AcademyLedger();
            ledger.bookingDate = parseDate(row['تاريخ الحجز']);
            const oc = row['كود الOC'] ? String(row['كود الOC']).trim() : null;
            if (!oc)
                continue;
            ledger.ocCode = oc;
            ledger.clientName = row['اسم العميل'] ? String(row['اسم العميل']).trim() : null;
            ledger.phone = normalizePhone(row['رقم الهاتف']);
            ledger.course = row['الكورس'] ? String(row['الكورس']).trim() : null;
            ledger.groupName = row['اسم المجموعة'] ? String(row['اسم المجموعة']).trim() : null;
            ledger.status = row['الحالة'] ? String(row['الحالة']).trim() : null;
            ledger.totalPrice = parseNumber(row['السعر الكلي']);
            ledger.paymentMethod = row['طريقة الدفع'] ? String(row['طريقة الدفع']).trim() : null;
            ledger.amountPaid = parseNumber(row['المبلغ المدفوع']);
            ledger.amountRemaining = parseNumber(row['المبلغ المتبقي']);
            ledger.salesAgentEmail = row['موظف السيلز'] ? String(row['موظف السيلز']).trim() : null;
            const savedLedger = await AppDataSource.manager.save(ledger);
            const inst1 = parseInstallment(row['تفاصيل القسط 1'], 1);
            const inst2 = parseInstallment(row['تفاصيل القسط 2'], 2);
            const inst3 = parseInstallment(row['تفاصيل القسط 3'], 3);
            const installmentsToSave = [inst1, inst2, inst3].filter(i => i !== null);
            for (const instItem of installmentsToSave) {
                const inst = new installment_entity_1.Installment();
                inst.ledger = savedLedger;
                inst.amount = instItem.amount;
                inst.dueDate = instItem.dueDate;
                inst.paymentMethod = instItem.paymentMethod;
                inst.status = instItem.status;
                inst.installmentOrder = instItem.installmentOrder;
                await AppDataSource.manager.save(inst);
            }
            ledgerSuccess++;
        }
        catch (e) {
            ledgerFailed++;
            ledgerErrors.push(`Failed for OC ${row['كود الOC']}: ${e.message}`);
        }
    }
    updateStats('Academy_Ledger', ledgerSuccess, ledgerFailed, ledgerErrors);
    console.log('Migrating Client_Payments...');
    const payRows = getSheetRows('Client_Payments');
    let paySuccess = 0, payFailed = 0;
    const payErrors = [];
    for (const row of payRows) {
        try {
            const pay = new client_payment_entity_1.ClientPayment();
            pay.legacyId = row.ID ? String(row.ID).trim() : null;
            const aLegacy = row['Agent ID'] ? String(row['Agent ID']).trim() : null;
            pay.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                pay.agent = userMap.get(aLegacy);
            }
            pay.clientLegacyId = row.ID ? String(row.ID).trim() : null;
            pay.clientName = row.Name ? String(row.Name).trim() : null;
            pay.course = row.Course ? String(row.Course).trim() : null;
            const rLegacy = row['Round ID'] ? String(row['Round ID']).trim() : null;
            pay.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                pay.round = roundMap.get(rLegacy);
            }
            pay.roundName = row.Round ? String(row.Round).trim() : null;
            pay.totalAmount = parseNumber(row['الاجمالي']);
            pay.agentUsername = row.User ? String(row.User).trim() : null;
            pay.amountPaid = parseNumber(row.Paid);
            pay.amountUnpaid = parseNumber(row.Unpaid);
            pay.paymentTime = parseDate(row.Time);
            pay.status = row.Statuse ? String(row.Statuse).trim() : null;
            const keys = Object.keys(row);
            let detail1 = 0, detail2 = 0, detail3 = 0;
            if (keys.length > 14) {
                detail1 = parseFloat(row[keys[15]]) || 0;
            }
            if (keys.length > 15) {
                detail2 = parseFloat(row[keys[16]]) || 0;
            }
            if (keys.length > 16) {
                detail3 = parseFloat(row[keys[17]]) || 0;
            }
            pay.amountDetail1 = detail1;
            pay.amountDetail2 = detail2;
            pay.amountDetail3 = detail3;
            pay.lastModified = parseDate(row.LastModified);
            pay.isDeleted = parseBoolean(row.Is_Deleted);
            pay.deletedBy = row.Deleted_By ? String(row.Deleted_By).trim() : null;
            pay.deletedAt = parseDate(row.Deleted_At);
            const noteKey = keys.find(k => k.toLowerCase().includes('note') || k === '__EMPTY' || k === '__EMPTY_12');
            pay.notes = noteKey ? String(row[noteKey]).trim() : null;
            await AppDataSource.manager.save(pay);
            paySuccess++;
        }
        catch (e) {
            payFailed++;
            payErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Client_Payments', paySuccess, payFailed, payErrors);
    const paymentMap = new Map();
    const dbPayments = await AppDataSource.manager.find(client_payment_entity_1.ClientPayment);
    for (const cp of dbPayments) {
        if (cp.legacyId)
            paymentMap.set(cp.legacyId, cp);
    }
    console.log('Migrating Payment_Transactions...');
    const txRows = getSheetRows('Payment_Transactions');
    let txSuccess = 0, txFailed = 0;
    const txErrors = [];
    for (const row of txRows) {
        try {
            const tx = new payment_transaction_entity_1.PaymentTransaction();
            tx.legacyTransactionId = row.TransactionID ? String(row.TransactionID).trim() : null;
            const pLegacy = row.PaymentID ? String(row.PaymentID).trim() : null;
            tx.legacyPaymentId = pLegacy;
            if (pLegacy && paymentMap.has(pLegacy)) {
                tx.payment = paymentMap.get(pLegacy);
            }
            tx.clientName = row.ClientName ? String(row.ClientName).trim() : null;
            tx.amount = parseNumber(row.Amount);
            tx.date = parseDate(row.Date);
            tx.type = row.Type ? String(row.Type).trim() : null;
            const aLegacy = row.AgentID ? String(row.AgentID).trim() : null;
            tx.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                tx.agent = userMap.get(aLegacy);
            }
            tx.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            await AppDataSource.manager.save(tx);
            txSuccess++;
        }
        catch (e) {
            txFailed++;
            txErrors.push(`Failed for Transaction ${row.TransactionID}: ${e.message}`);
        }
    }
    updateStats('Payment_Transactions', txSuccess, txFailed, txErrors);
    console.log('Migrating Financial_Data...');
    const finRows = getSheetRows('Financial_Data');
    let finSuccess = 0, finFailed = 0;
    const finErrors = [];
    for (const row of finRows) {
        try {
            const data = new financial_data_entity_1.FinancialData();
            const aLegacy = row.AgentID ? String(row.AgentID).trim() : null;
            data.agentLegacyId = aLegacy;
            if (aLegacy && userMap.has(aLegacy)) {
                data.agent = userMap.get(aLegacy);
            }
            data.agentName = row.AgentName ? String(row.AgentName).trim() : null;
            data.month = parseNumber(row.Month);
            data.year = parseNumber(row.Year);
            data.type = row.Type ? String(row.Type).trim() : null;
            data.action = row.Action ? String(row.Action).trim() : null;
            data.ocCode = row.OC_Code ? String(row.OC_Code).trim() : null;
            data.clientName = row.Name ? String(row.Name).trim() : null;
            data.phone = normalizePhone(row.Phone);
            data.course = row.Course ? String(row.Course).trim() : null;
            data.reservation = parseDate(row.Reservation);
            data.attendance = parseDate(row.Attendance);
            data.paymentMethod = row.Method ? String(row.Method).trim() : null;
            data.offer = row.Offer ? String(row.Offer).trim() : null;
            data.price = parseNumber(row.Price);
            data.paid = parseNumber(row.Paid);
            data.createdAt = parseDate(row.CreatedAt);
            data.clientType = row.ClientType ? String(row.ClientType).trim() : null;
            data.campaignType = row.Campaign_Type ? String(row.Campaign_Type).trim() : null;
            await AppDataSource.manager.save(data);
            finSuccess++;
        }
        catch (e) {
            finFailed++;
            finErrors.push(`Failed for Agent ${row.AgentID} Client ${row.Name}: ${e.message}`);
        }
    }
    updateStats('Financial_Data', finSuccess, finFailed, finErrors);
    console.log('Migrating Lecturer_Salaries...');
    const salRows = getSheetRows('Lecturer_Salaries');
    let salSuccess = 0, salFailed = 0;
    const salErrors = [];
    for (const row of salRows) {
        try {
            const sal = new lecturer_salary_entity_1.LecturerSalary();
            sal.legacyId = row.ID ? String(row.ID).trim() : null;
            const rLegacy = row.Round_ID ? String(row.Round_ID).trim() : null;
            sal.roundLegacyId = rLegacy;
            if (rLegacy && roundMap.has(rLegacy)) {
                sal.round = roundMap.get(rLegacy);
            }
            sal.roundName = row.Round_Name ? String(row.Round_Name).trim() : null;
            sal.roundType = row.Round_Type ? String(row.Round_Type).trim() : null;
            sal.instructorName = row.Instructor_Name ? String(row.Instructor_Name).trim() : null;
            sal.pay1Amount = parseNumber(row.Pay1_Amount);
            sal.pay1Status = row.Pay1_Status ? String(row.Pay1_Status).trim() : null;
            sal.pay1PaidDate = parseDate(row.Pay1_PaidDate);
            sal.pay2Amount = parseNumber(row.Pay2_Amount);
            sal.pay2Status = row.Pay2_Status ? String(row.Pay2_Status).trim() : null;
            sal.pay2PaidDate = parseDate(row.Pay2_PaidDate);
            sal.alert1Triggered = parseBoolean(row.Alert1_Triggered);
            sal.alert2Triggered = parseBoolean(row.Alert2_Triggered);
            sal.notes = row.Notes ? String(row.Notes).trim() : null;
            sal.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(sal);
            salSuccess++;
        }
        catch (e) {
            salFailed++;
            salErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('Lecturer_Salaries', salSuccess, salFailed, salErrors);
    console.log('Migrating BSA_Expenses...');
    const expRows = getSheetRows('BSA_Expenses');
    let expSuccess = 0, expFailed = 0;
    const expErrors = [];
    for (const row of expRows) {
        try {
            const exp = new expense_entity_1.Expense();
            exp.legacyId = row.ID ? String(row.ID).trim() : null;
            exp.date = parseDate(row.Date);
            exp.category = row.Category ? String(row.Category).trim() : null;
            exp.description = row.Description ? String(row.Description).trim() : null;
            exp.amount = parseNumber(row.Amount);
            exp.method = row.Method ? String(row.Method).trim() : null;
            exp.createdBy = row.CreatedBy ? String(row.CreatedBy).trim() : null;
            exp.notes = row.Notes ? String(row.Notes).trim() : null;
            exp.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(exp);
            expSuccess++;
        }
        catch (e) {
            expFailed++;
            expErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('BSA_Expenses', expSuccess, expFailed, expErrors);
    console.log('Migrating Wallet_Income...');
    const incRows = getSheetRows('Wallet_Income');
    let incSuccess = 0, incFailed = 0;
    const incErrors = [];
    for (const row of incRows) {
        try {
            const inc = new wallet_income_entity_1.WalletIncome();
            inc.legacyIncomeId = row.IncomeID ? String(row.IncomeID).trim() : null;
            inc.date = parseDate(row.Date);
            inc.category = row.Category ? String(row.Category).trim() : null;
            inc.description = row.Description ? String(row.Description).trim() : null;
            inc.amount = parseNumber(row.Amount);
            inc.wallet = row.Wallet ? String(row.Wallet).trim() : null;
            inc.method = row.Method ? String(row.Method).trim() : null;
            inc.by = row.By ? String(row.By).trim() : null;
            inc.notes = row.Notes ? String(row.Notes).trim() : null;
            inc.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(inc);
            incSuccess++;
        }
        catch (e) {
            incFailed++;
            incErrors.push(`Failed for Income ID ${row.IncomeID}: ${e.message}`);
        }
    }
    updateStats('Wallet_Income', incSuccess, incFailed, incErrors);
    console.log('Migrating BSA_Wallet_Adjustments...');
    const adjRows = getSheetRows('BSA_Wallet_Adjustments');
    let adjSuccess = 0, adjFailed = 0;
    const adjErrors = [];
    for (const row of adjRows) {
        try {
            const adj = new wallet_adjustment_entity_1.WalletAdjustment();
            adj.walletName = row.WalletName ? String(row.WalletName).trim() : null;
            adj.balance = parseNumber(row.Balance);
            adj.adjDate = parseDate(row.AdjDate);
            adj.savedAt = parseDate(row.SavedAt);
            await AppDataSource.manager.save(adj);
            adjSuccess++;
        }
        catch (e) {
            adjFailed++;
            adjErrors.push(`Failed for Wallet ${row.WalletName}: ${e.message}`);
        }
    }
    updateStats('BSA_Wallet_Adjustments', adjSuccess, adjFailed, adjErrors);
    console.log('Migrating BSA_Wallet_Transfers...');
    const transRows = getSheetRows('BSA_Wallet_Transfers');
    let transSuccess = 0, transFailed = 0;
    const transErrors = [];
    for (const row of transRows) {
        try {
            const trans = new wallet_transfer_entity_1.WalletTransfer();
            trans.legacyId = row.ID ? String(row.ID).trim() : null;
            trans.date = parseDate(row.Date);
            trans.fromWallet = row.FromWallet ? String(row.FromWallet).trim() : null;
            trans.toWallet = row.ToWallet ? String(row.ToWallet).trim() : null;
            trans.amount = parseNumber(row.Amount);
            trans.notes = row.Notes ? String(row.Notes).trim() : null;
            trans.createdBy = row.CreatedBy ? String(row.CreatedBy).trim() : null;
            trans.createdAt = parseDate(row.CreatedAt);
            await AppDataSource.manager.save(trans);
            transSuccess++;
        }
        catch (e) {
            transFailed++;
            transErrors.push(`Failed for ID ${row.ID}: ${e.message}`);
        }
    }
    updateStats('BSA_Wallet_Transfers', transSuccess, transFailed, transErrors);
    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION REPORT SUMMARY');
    console.log('='.repeat(50));
    let totalSuccess = 0;
    let totalFailed = 0;
    for (const [sheet, data] of Object.entries(stats)) {
        console.log(`Sheet: ${sheet}`);
        console.log(`  - Migrated successfully: ${data.success}`);
        console.log(`  - Failed: ${data.failed}`);
        if (data.errors.length > 0) {
            console.log(`  - Error Snippets (first 3):`);
            data.errors.slice(0, 3).forEach(err => console.log(`    * ${err}`));
        }
        totalSuccess += data.success;
        totalFailed += data.failed;
    }
    console.log('\n' + '='.repeat(50));
    console.log(`TOTAL SUCCESS: ${totalSuccess}`);
    console.log(`TOTAL FAILED: ${totalFailed}`);
    console.log('='.repeat(50));
    await AppDataSource.destroy();
    console.log('Database connection closed.');
}
runMigration().catch((err) => {
    console.error('Fatal Migration Error:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map