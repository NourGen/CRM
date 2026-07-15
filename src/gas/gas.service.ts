import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like } from 'typeorm';
import { User } from '../sales/entities/user.entity';
import { MyLead } from '../sales/entities/my-lead.entity';
import { RawLead } from '../sales/entities/raw-lead.entity';
import { INV_CAIRO_LAT, INV_CAIRO_AR, INV_MONT, INV_LOGO, INV_STAMP } from './invoice-assets';
import { LeadCallLog } from '../sales/entities/lead-call-log.entity';
import { SupportRequest } from '../sales/entities/support-request.entity';
import { ExceptionRequest } from '../sales/entities/exception-request.entity';
import { Task } from '../sales/entities/task.entity';
import { Round } from '../academy/entities/round.entity';
import { AcademyLedger } from '../financial/entities/academy-ledger.entity';
import { Course } from '../financial/entities/course.entity';
import { Offer } from '../financial/entities/offer.entity';
import { ClientPayment } from '../financial/entities/client-payment.entity';
import { Instructor } from '../academy/entities/instructor.entity';
import { RoundMember } from '../academy/entities/round-member.entity';
import { FinancialData } from '../financial/entities/financial-data.entity';
import { PaymentTransaction } from '../financial/entities/payment-transaction.entity';
import { Student } from '../academy/entities/student.entity';
import { AcademySession } from '../academy/entities/academy-session.entity';
import { FreshLead } from '../sales/entities/fresh-lead.entity';
import { ActivityLog } from '../sales/entities/activity-log.entity';
import { LecturerSalary } from '../financial/entities/lecturer-salary.entity';
import { Enrollment } from '../academy/entities/enrollment.entity';
import { SystemSetting } from '../sales/entities/system-setting.entity';
import { AttendanceRecord } from '../academy/entities/attendance-record.entity';
import { Celebration } from '../sales/entities/celebration.entity';
import { Expense } from '../financial/entities/expense.entity';
import { BreakLog } from '../sales/entities/break-log.entity';
import { AcademySupportFile } from '../academy/entities/academy-support-file.entity';
import { AcademyContent } from '../academy/entities/academy-content.entity';
import { AcademyQuiz } from '../academy/entities/academy-quiz.entity';
import { QuizBank } from '../academy/entities/quiz-bank.entity';
import { AcademyTask } from '../academy/entities/academy-task.entity';
import { AcademyUnlock } from '../academy/entities/academy-unlock.entity';
import { AcademyProgress } from '../academy/entities/academy-progress.entity';
import { QuizResult } from '../academy/entities/quiz-result.entity';
import { AcademySupport } from '../academy/entities/academy-support.entity';
import { AcademyNotification } from '../academy/entities/academy-notification.entity';
import { AcademyPost } from '../academy/entities/academy-post.entity';
import { AcademyDM } from '../academy/entities/academy-dm.entity';
import { AcademyFriend } from '../academy/entities/academy-friend.entity';
import { AcademyReaction } from '../academy/entities/academy-reaction.entity';
import { QuizAttempt } from '../academy/entities/quiz-attempt.entity';
import { LiveSession } from '../academy/entities/live-session.entity';
import { AcademyFinalProject } from '../academy/entities/academy-final-project.entity';
import { SuccessStory } from '../academy/entities/success-story.entity';
import { ShowcaseProject } from '../academy/entities/showcase-project.entity';
import { BsaOrientation } from '../academy/entities/bsa-orientation.entity';
import { AcademySurveyResponse } from '../academy/entities/academy-survey-response.entity';
import * as fs from 'fs';
import * as path from 'path';
import { WalletIncome } from '../financial/entities/wallet-income.entity';
import { WalletAdjustment } from '../financial/entities/wallet-adjustment.entity';
import { WalletTransfer } from '../financial/entities/wallet-transfer.entity';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

function formatTimeToAmPm(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strMinutes = String(minutes).padStart(2, '0');
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}:${strMinutes} ${ampm}`;
}

@Injectable()
export class GasService implements OnModuleInit {
  private enforceFollowUpDateLimit(status: string, date: Date | null): Date | null {
    if (!date) return null;
    const statusLower = (status || '').toLowerCase().trim();
    if (statusLower.includes('need follow up') || statusLower.includes('need_follow_up') || statusLower.includes('متابعة')) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 3);
      if (date > maxDate) {
        const capped = new Date(maxDate);
        capped.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
        return capped;
      }
    }
    return date;
  }

  async syncAllOcCodeClients() {
    try {
      console.log('Starting syncAllOcCodeClients backfill...');
      const payments = await this.clientPaymentRepository.find({
        where: { isDeleted: false },
        relations: { agent: true, round: true }
      });
      const rounds = await this.roundRepository.find();
      const roundMap = new Map<string, Round>();
      for (const r of rounds) {
        if (r.id) roundMap.set(r.id, r);
        if (r.legacyId) roundMap.set(r.legacyId, r);
      }
      const students = await this.studentRepository.find();
      const allLeads = await this.myLeadRepository.find();
      for (const pay of payments) {
        const ocCode = (pay.clientLegacyId || '').trim();
        if (!ocCode || !ocCode.toLowerCase().startsWith('oc-')) continue;

        const clientName = pay.clientName || '';
        const matchingLead = allLeads.find(l => 
          (l.legacyId && l.legacyId.trim() === ocCode) || 
          (l.name && l.name.trim() === clientName)
        );
        const phone = matchingLead ? this.normalizePhone(matchingLead.phone || '') : '';

        const roundId = pay.roundLegacyId || (pay.round?.legacyId || pay.round?.id);
        const roundName = pay.roundName || pay.round?.name || '';
        const price = Number(pay.totalAmount) || 0;
        const paid = Number(pay.amountPaid) || 0;
        const rem = Number(pay.amountUnpaid) || 0;
        const agent = pay.agent;
        const agentId = agent ? agent.id : '';
        const agentName = pay.agentUsername || agent?.name || '';

        // A. Sync to AcademyLedger
        try {
          let ledRow = await this.ledgerRepository.findOne({ where: { ocCode } });
          if (!ledRow) {
            ledRow = new AcademyLedger();
            ledRow.bookingDate = pay.createdAt || new Date();
            ledRow.ocCode = ocCode;
          }
          ledRow.clientName = clientName;
          if (phone) ledRow.phone = phone;
          ledRow.course = pay.course || '';
          ledRow.groupName = roundId ? roundName : 'Wait';
          ledRow.status = rem <= 0 ? 'خالص' : 'أقساط';
          ledRow.totalPrice = price;
          ledRow.paymentMethod = 'Cash';
          ledRow.amountPaid = paid;
          ledRow.amountRemaining = rem;
          ledRow.salesAgentEmail = agent?.email || agent?.username || agentName || '';
          await this.ledgerRepository.save(ledRow);
        } catch (e: any) {
          console.error(`Ledger sync error for ${ocCode}:`, e.message);
        }

        // B. Sync to RoundMember
        if (roundId && roundMap.has(roundId)) {
          const round = roundMap.get(roundId)!;
          try {
            const rmExists = await this.roundMemberRepository.findOne({ where: { ocCode, round: { id: round.id } } });
            if (!rmExists) {
              await this.roundMemberRepository.save({
                round,
                roundLegacyId: round.legacyId || null,
                ocCode,
                name: clientName,
                phone: phone || '',
                action: 'New',
                price,
                paid,
                method: 'Cash',
                attendance: '',
                agent: agent || null,
                agentLegacyId: agent?.legacyId || null,
                agentName,
                createdAt: pay.createdAt || new Date(),
              });
              round.enrolled = (round.enrolled || 0) + 1;
              await this.roundRepository.save(round);
            }
          } catch (e: any) {
            console.error(`RoundMember sync error for ${ocCode}:`, e.message);
          }
        }

        // C. Sync to Student entity (if exists, match by phone)
        if (phone) {
          const matchingStudents = students.filter(s => this.normalizePhone(s.phone || '') === phone);
          for (const s of matchingStudents) {
            if (!s.ocCode) {
              s.ocCode = ocCode;
              await this.studentRepository.save(s);
            }
          }
        }
      }
      console.log('Finished syncAllOcCodeClients backfill successfully!');
      return { success: true, message: 'تمت مزامنة جميع عملاء الـ OC Code بنجاح' };
    } catch (e: any) {
      console.error('Error running syncAllOcCodeClients:', e);
      return { success: false, message: e.message };
    }
  }

  async onModuleInit() {
    try {
      // 1. Find and delete duplicate standard registrations (OC-1xxxxx) for any client who has a free registration (OC-2xxxxx)
      const allMembers = await this.roundMemberRepository.find({ relations: { round: true } });
      const freeMembers = allMembers.filter(m => (m.ocCode || '').startsWith('OC-2'));
      const paidMembers = allMembers.filter(m => (m.ocCode || '').startsWith('OC-1'));

      for (const freeM of freeMembers) {
        const freePhone = (freeM.phone || '').trim().replace(/\s+/g, '');
        const freeName = this.normalizeArabicName(freeM.name || '');

        // Find duplicates in paidMembers by phone or name
        const duplicates = paidMembers.filter(paidM => {
          const paidPhone = (paidM.phone || '').trim().replace(/\s+/g, '');
          const paidName = this.normalizeArabicName(paidM.name || '');
          const phoneMatch = freePhone && paidPhone && freePhone === paidPhone;
          const nameMatch = freeName && paidName && freeName === paidName;
          return phoneMatch || nameMatch;
        });

        for (const dup of duplicates) {
          console.log(`[Startup Cleanup] Deleting duplicate paid registration ${dup.ocCode} for ${dup.name} in round ${dup.round?.name || dup.round?.id} because they have free code ${freeM.ocCode}`);
          
          // Delete from round_members
          if (dup.id) {
            await this.roundMemberRepository.delete(dup.id);
          }

          // Mark payment as deleted in client_payments
          const payments = await this.clientPaymentRepository.find({
            where: { clientLegacyId: dup.ocCode }
          });
          for (const pay of payments) {
            if (!pay.isDeleted) {
              pay.isDeleted = true;
              pay.deletedAt = new Date();
              pay.deletedBy = 'System Startup Cleanup';
              await this.clientPaymentRepository.save(pay);
              console.log(`[Startup Cleanup] Marked payment for ${dup.ocCode} as deleted.`);
            }
          }

          // Delete from AcademyLedger
          const ledgerRow = await this.ledgerRepository.findOne({
            where: { ocCode: dup.ocCode }
          });
          if (ledgerRow) {
            if (ledgerRow.id) {
              await this.ledgerRepository.delete(ledgerRow.id);
            }
            console.log(`[Startup Cleanup] Removed ledger record for ${dup.ocCode}.`);
          }
        }
      }

      // 2. Run syncAllOcCodeClients AFTER cleanup to sync correct records
      await this.syncAllOcCodeClients();

      // 3. Update student portal accounts to use the free code if they have one
      const allStudents = await this.studentRepository.find();
      const allActiveMembers = await this.roundMemberRepository.find();
      for (const stud of allStudents) {
        const studPhone = (stud.phone || '').trim().replace(/\s+/g, '');
        const studName = this.normalizeArabicName(stud.name || '');
        const freeReg = allActiveMembers.find(m => 
          (m.ocCode || '').startsWith('OC-2') && 
          ((m.phone || '').trim().replace(/\s+/g, '') === studPhone || this.normalizeArabicName(m.name || '') === studName)
        );
        if (freeReg && stud.ocCode !== freeReg.ocCode) {
          console.log(`[Startup Cleanup] Updating student account ${stud.name} code from ${stud.ocCode} to free code ${freeReg.ocCode}`);
          stud.ocCode = freeReg.ocCode;
          await this.studentRepository.save(stud);
        }
      }

      // 4. Recalculate and update the enrolled count for all rounds to keep them perfectly in sync
      const rounds = await this.roundRepository.find();
      const currentMembers = await this.roundMemberRepository.find({ relations: { round: true } });
      for (const r of rounds) {
        const memberCount = currentMembers.filter(m => m.round?.id === r.id || m.roundLegacyId === r.legacyId).length;
        if (r.enrolled !== memberCount) {
          console.log(`[Startup Sync] Updating round ${r.name} enrolled count from ${r.enrolled} to ${memberCount}`);
          r.enrolled = memberCount;
          await this.roundRepository.save(r);
        }
      }

      // 5. Set attendance for all round members to match their round's schedule
      for (const r of rounds) {
        if (r.schedule) {
          const members = currentMembers.filter(m => m.round?.id === r.id);
          let updated = 0;
          for (const m of members) {
            if (m.attendance !== r.schedule) {
              m.attendance = r.schedule;
              await this.roundMemberRepository.save(m);
              updated++;
            }
          }
          if (updated > 0) {
            console.log(`[Startup Cleanup] Updated attendance schedule for ${updated} members in round: ${r.name}`);
          }
        }
      }

    } catch (e) {
      console.error('[Startup Cleanup Error]', e);
    }
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MyLead)
    private readonly myLeadRepository: Repository<MyLead>,
    @InjectRepository(RawLead)
    private readonly rawLeadRepository: Repository<RawLead>,
    @InjectRepository(LeadCallLog)
    private readonly callLogRepository: Repository<LeadCallLog>,
    @InjectRepository(SupportRequest)
    private readonly supportRepository: Repository<SupportRequest>,
    @InjectRepository(ExceptionRequest)
    private readonly exceptionRepository: Repository<ExceptionRequest>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(AcademyLedger)
    private readonly ledgerRepository: Repository<AcademyLedger>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(ClientPayment)
    private readonly clientPaymentRepository: Repository<ClientPayment>,
    @InjectRepository(Instructor)
    private readonly instructorRepository: Repository<Instructor>,
    @InjectRepository(RoundMember)
    private readonly roundMemberRepository: Repository<RoundMember>,
    @InjectRepository(FinancialData)
    private readonly financialDataRepository: Repository<FinancialData>,
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(AcademySession)
    private readonly academySessionRepository: Repository<AcademySession>,
    @InjectRepository(FreshLead)
    private readonly freshLeadRepository: Repository<FreshLead>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(LecturerSalary)
    private readonly lecturerSalaryRepository: Repository<LecturerSalary>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Celebration)
    private readonly celebrationRepository: Repository<Celebration>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(BreakLog)
    private readonly breakLogRepository: Repository<BreakLog>,
    @InjectRepository(AcademySupportFile)
    private readonly supportFileRepository: Repository<AcademySupportFile>,
    @InjectRepository(AcademyContent)
    private readonly contentRepository: Repository<AcademyContent>,
    @InjectRepository(AcademyQuiz)
    private readonly quizRepository: Repository<AcademyQuiz>,
    @InjectRepository(QuizBank)
    private readonly quizBankRepository: Repository<QuizBank>,
    @InjectRepository(AcademyTask)
    private readonly academyTaskRepository: Repository<AcademyTask>,
    @InjectRepository(AcademyUnlock)
    private readonly unlockRepository: Repository<AcademyUnlock>,
    @InjectRepository(AcademyProgress)
    private readonly progressRepository: Repository<AcademyProgress>,
    @InjectRepository(QuizResult)
    private readonly quizResultRepository: Repository<QuizResult>,
    @InjectRepository(AcademySupport)
    private readonly academySupportRepository: Repository<AcademySupport>,
    @InjectRepository(AcademyNotification)
    private readonly notificationRepository: Repository<AcademyNotification>,
    @InjectRepository(AcademyPost)
    private readonly postRepository: Repository<AcademyPost>,
    @InjectRepository(AcademyDM)
    private readonly dmRepository: Repository<AcademyDM>,
    @InjectRepository(AcademyFriend)
    private readonly friendRepository: Repository<AcademyFriend>,
    @InjectRepository(AcademyReaction)
    private readonly reactionRepository: Repository<AcademyReaction>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(AcademyFinalProject)
    private readonly finalProjectRepository: Repository<AcademyFinalProject>,
    @InjectRepository(SuccessStory)
    private readonly successStoryRepository: Repository<SuccessStory>,
    @InjectRepository(ShowcaseProject)
    private readonly showcaseRepository: Repository<ShowcaseProject>,
    @InjectRepository(WalletIncome)
    private readonly walletIncomeRepository: Repository<WalletIncome>,
    @InjectRepository(WalletAdjustment)
    private readonly walletRepository: Repository<WalletAdjustment>,
    @InjectRepository(WalletTransfer)
    private readonly walletTransferRepository: Repository<WalletTransfer>,
    @InjectRepository(AcademySurveyResponse)
    private readonly surveyResponseRepository: Repository<AcademySurveyResponse>,
    @InjectRepository(BsaOrientation)
    private readonly bsaOrientationRepository: Repository<BsaOrientation>,
  ) {}

  // ═══════════════════════════════════════════════════
  // ═══  ACADEMY: AUTH & SESSION  ═══
  // ═══════════════════════════════════════════════════

  private normalizeAcadUsername(raw: string): string {
    let username = (raw || '').toString().trim().toLowerCase();
    if (username && username.indexOf('@') === -1) username += '@bsa';
    return username;
  }

  private async matchAcadPassword(plain: string, stored: string): Promise<boolean> {
    if (!stored) return false;
    try {
      if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
        return await bcrypt.compare(plain, stored);
      }
    } catch (e) {
      // ignore
    }
    return plain === stored;
  }

  async academyLogin(username: string, password: string) {
    try {
      const uname = this.normalizeAcadUsername(username);
      const pass = (password || '').toString().trim();
      if (!uname || !pass) return { success: false, message: 'أدخل اسم المستخدم والباسورد' };

      const student = await this.studentRepository.findOne({ where: { email: uname } });
      if (student) {
        if (!(await this.matchAcadPassword(pass, student.password))) {
          return { success: false, message: 'اسم المستخدم أو الباسورد غلط' };
        }
        if (!student.active) return { success: false, message: 'حسابك موقوف، تواصل مع الأكاديمية' };
        const token = randomUUID();
        await this.academySessionRepository.save({
          token, userId: student.id, role: 'student', isBsa: false,
        });
        return {
          success: true, token, role: 'student',
          user: { id: student.id, name: student.name, username: student.email || '', phone: student.phone || '', pic: '' },
        };
      }

      const instructor = await this.instructorRepository.findOne({ where: { username: uname } });
      if (instructor) {
        if (!(await this.matchAcadPassword(pass, instructor.password))) {
          return { success: false, message: 'اسم المستخدم أو الباسورد غلط' };
        }
        if (!instructor.active) return { success: false, message: 'حساب المحاضر موقوف' };
        const token = randomUUID();
        await this.academySessionRepository.save({
          token, userId: instructor.id, role: 'instructor', isBsa: !!instructor.isBsa,
        });
        return {
          success: true, token, role: 'instructor',
          user: { id: instructor.id, name: instructor.name, username: instructor.username || '', pic: instructor.profilePic || '', isBSA: !!instructor.isBsa },
        };
      }

      return { success: false, message: 'اسم المستخدم أو الباسورد غلط' };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async validateAcadSession(token: string): Promise<{ id: string; role: 'student' | 'instructor'; isBsa: boolean } | null> {
    if (!token) return null;
    const sess = await this.academySessionRepository.findOne({ where: { token } });
    if (!sess) return null;
    return { id: sess.userId, role: sess.role, isBsa: !!sess.isBsa };
  }

  async validateAcadSessionPublic(token: string) {
    try {
      const sess = await this.validateAcadSession(token);
      if (!sess) return { id: null };
      return { id: sess.id, role: sess.role };
    } catch {
      return { id: null };
    }
  }

  async academyLogout(token: string) {
    try {
      if (!token) return { success: true };
      await this.academySessionRepository.delete({ token });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  async saveProfilePic(token: string, base64Data: string) {
    try {
      const sess = await this.validateAcadSession(token);
      if (!sess) return { success: false, message: 'انتهت الجلسة' };
      if ((base64Data || '').length > 1500000) {
        return { success: false, message: 'الصورة كبيرة جداً — اختار صورة أصغر' };
      }

      if (sess.role === 'instructor') {
        const instructor = await this.instructorRepository.findOne({ where: { id: sess.id } });
        if (!instructor) return { success: false, message: 'المستخدم مش موجود' };
        instructor.profilePic = base64Data;
        await this.instructorRepository.save(instructor);
        return { success: true };
      }

      const student = await this.studentRepository.findOne({ where: { id: sess.id } });
      if (!student) return { success: false, message: 'المستخدم مش موجود' };
      // Student entity has no dedicated pic column yet; profile pics for students aren't modeled — no-op success to avoid breaking the UI flow.
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateAcadPassword(token: string, currentPassword: string, newPassword: string) {
    try {
      const sess = await this.validateAcadSession(token);
      if (!sess) return { success: false, message: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' };

      const current = (currentPassword || '').toString().trim();
      const next = (newPassword || '').toString().trim();
      if (!current) return { success: false, message: 'أدخل الباسورد الحالي' };
      if (!next) return { success: false, message: 'أدخل الباسورد الجديد' };
      if (next.length < 6) return { success: false, message: 'الباسورد الجديد لازم يكون 6 أحرف على الأقل' };
      if (next === current) return { success: false, message: 'الباسورد الجديد مختلفش عن الحالي' };

      if (sess.role === 'instructor') {
        const instructor = await this.instructorRepository.findOne({ where: { id: sess.id } });
        if (!instructor) return { success: false, message: 'لم يتم العثور على حسابك' };
        if (!(await this.matchAcadPassword(current, instructor.password))) {
          return { success: false, message: 'الباسورد الحالي غلط' };
        }
        instructor.password = next;
        await this.instructorRepository.save(instructor);
        return { success: true, message: '✅ تم تغيير الباسورد بنجاح' };
      }

      const student = await this.studentRepository.findOne({ where: { id: sess.id } });
      if (!student) return { success: false, message: 'لم يتم العثور على حسابك' };
      if (!(await this.matchAcadPassword(current, student.password))) {
        return { success: false, message: 'الباسورد الحالي غلط' };
      }
      student.password = next;
      await this.studentRepository.save(student);
      return { success: true, message: '✅ تم تغيير الباسورد بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateStudentUsername(token: string, newUsername: string) {
    try {
      const sess = await this.validateAcadSession(token);
      if (!sess) return { success: false, message: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' };

      let uname = (newUsername || '').toString().trim().toLowerCase();
      if (!/@bsa$/.test(uname)) uname = uname.replace(/@.*$/, '') + '@bsa';
      const prefix = uname.replace(/@bsa$/, '');
      if (!prefix || prefix.length < 3) return { success: false, message: 'الجزء قبل @bsa لازم يكون 3 أحرف على الأقل' };
      if (!/^[a-z0-9._-]+$/.test(prefix)) return { success: false, message: 'استخدم حروف إنجليزية وأرقام فقط قبل @bsa' };

      const student = await this.studentRepository.findOne({ where: { id: sess.id } });
      if (!student) return { success: false, message: 'لم يتم العثور على حسابك' };

      const existing = await this.studentRepository.findOne({ where: { email: uname } });
      if (existing && existing.id !== student.id) {
        return { success: false, message: 'اسم المستخدم ده موجود بالفعل، جرب اسم تاني' };
      }

      student.email = uname;
      await this.studentRepository.save(student);
      return { success: true, newUsername: uname };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  SALES: LEAD PIPELINE (Group 1)  ═══
  // ═══════════════════════════════════════════════════

  private async isAdminOrManager(userId: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    const role = (user.role || '').trim().toLowerCase();
    return role === 'manager' || role === 'admin' || role === 'operation';
  }

  // Human-facing client id: "ID-<sequential number>" — searchable directly as client_number in the DB
  private fmtClientId(n: any): string {
    const v = parseInt(n);
    return !isNaN(v) && v > 0 ? 'ID-' + v : '';
  }

  // Mint the next client_number GUARANTEED not owned by any existing lead, continuing
  // the sequence (max+1) in the same ID-XXXX pattern. Belt-and-braces on top of the
  // DB AUTO_INCREMENT: if the counter ever falls behind the max (e.g. after a data
  // import), a raw insert would reuse an existing number — this always skips past any
  // taken value. Setting the value explicitly also pushes AUTO_INCREMENT forward.
  private async mintClientNumber(): Promise<number> {
    const row = await this.rawLeadRepository
      .createQueryBuilder('r')
      .select('MAX(r.clientNumber)', 'max')
      .getRawOne();
    let n = (parseInt(row?.max, 10) || 0) + 1;
    // Defensive: skip any number already taken (the unique index is the final backstop).
    while ((await this.rawLeadRepository.count({ where: { clientNumber: n } })) > 0) n++;
    return n;
  }

  // Accepts "ID-123", "id 123", or bare "123" → 123 (null when the ref isn't number-based)
  private parseClientRef(ref: any): number | null {
    const m = String(ref ?? '').trim().match(/^id[-\s]*(\d+)$/i) || String(ref ?? '').trim().match(/^(\d+)$/);
    return m ? parseInt(m[1], 10) : null;
  }

  // Unified client resolver: accept ANY form of a client id — the new sequential
  // "ID-3786" (or bare 3786), a UUID, the legacy hash id, or an OC code — and return
  // the matching RawLead. Every function that takes a client id should use this so
  // old-UUID links and new ID-XXXX links both resolve to the same client.
  private async findRawByAnyId(clientId: any, relations?: any): Promise<RawLead | null> {
    const idStr = String(clientId ?? '').trim();
    if (!idStr) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
    const refNum = this.parseClientRef(idStr);
    if (refNum !== null) {
      const byNum = await this.rawLeadRepository.findOne({ where: { clientNumber: refNum }, relations });
      if (byNum) return byNum;
    }
    return this.rawLeadRepository.findOne({
      where: isUuid ? [{ id: idStr }, { legacyId: idStr }, { ocCode: idStr }] : [{ legacyId: idStr }, { ocCode: idStr }],
      relations,
    });
  }

  // Same idea for My_Leads. My_Leads has no clientNumber, so number/OC refs resolve via
  // the RawLead's phone; direct UUID/legacyId hits are tried first.
  private async findMyLeadByAnyId(clientId: any, relations?: any): Promise<MyLead | null> {
    const idStr = String(clientId ?? '').trim();
    if (!idStr) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
    let my = await this.myLeadRepository.findOne({
      where: isUuid ? [{ id: idStr }, { legacyId: idStr }] : [{ legacyId: idStr }],
      relations,
    });
    if (!my) {
      const raw = await this.findRawByAnyId(idStr);
      if (raw?.phone) my = await this.myLeadRepository.findOne({ where: { phone: raw.phone }, relations });
    }
    return my;
  }

  private normalizePhone(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (str.endsWith('.0')) str = str.slice(0, -2);
    str = str.replace(/\D/g, '');
    if (str.length === 10 && ['1', '2', '5'].includes(str[0])) str = '0' + str;
    return str;
  }

  private transliterateArabicToEnglish(name: string): string {
    const map: Record<string, string> = {
      'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ى': 'y',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
      'د': 'd', 'ذ': 'zh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
      'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ئ': 'y', 'ء': 'a', 'ؤ': 'w', 'ة': 't'
    };
    let res = '';
    const cleaned = (name || '').trim().toLowerCase();
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (map[char] !== undefined) {
        res += map[char];
      } else if (/[a-z0-9]/.test(char)) {
        res += char;
      } else if (char === ' ') {
        res += '_';
      }
    }
    res = res.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    return res || 'student';
  }

  async checkPhoneExists(phone: string) {
    try {
      const clean = this.normalizePhone(phone);
      if (!clean || clean.length < 8) return { success: true, found: false };
      const lead = await this.rawLeadRepository.findOne({ where: { phone: clean }, relations: { agent: true } });
      if (!lead) return { success: true, found: false };
      // Legacy shape: the fresh-lead page reads r.client.{name,status,agent}
      return {
        success: true,
        found: true,
        client: {
          id: this.fmtClientId(lead.clientNumber),
          name: lead.name || 'غير معروف',
          status: lead.newAction || lead.action || lead.status || '',
          agent: lead.agent?.name || lead.agentLegacyId || '',
        },
      };
    } catch (e: any) {
      return { success: false, found: null, error: e.message };
    }
  }

  async addManualLead(name: string, phone: string, course: string, source: string, agentId: string, agentName: string) {
    try {
      const cleanPhone = this.normalizePhone(phone);
      const existing = await this.rawLeadRepository.findOne({ where: { phone: cleanPhone } });
      if (existing) {
        return { success: false, message: `⚠️ الرقم موجود بالفعل في قاعدة البيانات (${this.fmtClientId(existing.clientNumber)})` };
      }

      const agent = agentId ? await this.userRepository.findOne({ where: { id: agentId } }) : null;

      const rawLead = await this.rawLeadRepository.save({
        date: new Date(),
        clientNumber: await this.mintClientNumber(), // رقم مضمون إنه مش مملوك لحد + تسلسلي
        name,
        phone: cleanPhone,
        source: source || 'يدوي',
        course,
        agentLegacyId: agent?.legacyId || null,
        agent: agent || null,
        status: 'Assigned',
      });

      await this.myLeadRepository.save({
        date: new Date(),
        name,
        phone: cleanPhone,
        source: source || 'يدوي',
        course,
        agentLegacyId: agent?.legacyId || null,
        agent: agent || null,
        status: 'Assigned',
      });

      return { success: true, id: this.fmtClientId(rawLead.clientNumber), name, phone: cleanPhone, course };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async adminEditClientRecord(clientNumber: number, fields: any, adminId: string, adminName: string) {
    if (!(await this.isAdminOrManager(adminId))) {
      return { success: false, message: 'عفواً، لا تملك الصلاحية لتعديل بيانات العملاء.' };
    }
    if (!clientNumber) return { success: false, message: 'معرّف العميل غير صالح.' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود في قاعدة البيانات.' };

      const oldName = lead.name || '';
      const oldPhone = lead.phone || '';
      const editReason = (fields.reason || 'تعديل إداري').toString().trim();

      const newName = fields.name !== undefined ? String(fields.name).trim() : oldName;
      const newPhone = fields.phone !== undefined ? this.normalizePhone(fields.phone) : oldPhone;
      const newCourse = fields.course !== undefined ? String(fields.course).trim() : lead.course;
      const newAgentName = fields.agent !== undefined ? String(fields.agent).trim() : null;
      const newAction = fields.action !== undefined ? String(fields.action).trim() : undefined;
      const newNotes = fields.notes !== undefined ? String(fields.notes).trim() : undefined;

      if (newName && newName !== oldName) lead.name = newName;
      if (newPhone && newPhone !== oldPhone) lead.phone = newPhone;
      if (newCourse) lead.course = newCourse;
      if (newAgentName) {
        const agent = await this.userRepository.findOne({ where: { name: newAgentName } });
        if (agent) { lead.agent = agent; lead.agentLegacyId = agent.legacyId; }
      }
      if (newAction) lead.newAction = newAction;

      const editLogNote = `[تعديل بواسطة ${adminName} | ${new Date().toISOString()} | السبب: ${editReason}]`;
      const existingNotes = (lead.notes || '').trim();
      lead.notes = existingNotes ? `${existingNotes}\n${newNotes || ''}\n${editLogNote}`.replace(/\n+/g, '\n') : (newNotes ? `${newNotes}\n${editLogNote}` : editLogNote);
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      // Propagate name/phone changes to My_Leads (matched by legacyId, falling back to old phone)
      const warnings: string[] = [];
      try {
        const myLead = lead.legacyId
          ? await this.myLeadRepository.findOne({ where: { legacyId: lead.legacyId } })
          : await this.myLeadRepository.findOne({ where: { phone: oldPhone } });
        if (myLead) {
          if (newName && newName !== oldName) myLead.name = newName;
          if (newPhone && newPhone !== oldPhone) myLead.phone = newPhone;
          if (newAgentName) myLead.agentLegacyId = lead.agentLegacyId;
          await this.myLeadRepository.save(myLead);
        }
      } catch (e: any) {
        warnings.push('My_Leads: ' + e.message);
      }

      const result: any = { success: true, message: '✅ تم تعديل بيانات العميل بنجاح.' };
      if (warnings.length) {
        result.warnings = warnings;
        result.message = '⚠️ تم تعديل بيانات العميل لكن تعذّر تحديث بعض الجداول: ' + warnings.join(' | ');
      }
      return result;
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async archiveClientRecord(clientNumber: number, adminId: string, adminName: string, reason?: string) {
    if (!(await this.isAdminOrManager(adminId))) {
      return { success: false, message: 'عفواً، لا تملك الصلاحية.' };
    }
    if (!clientNumber) return { success: false, message: 'معرّف العميل غير صالح.' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود.' };

      const archiveNote = `\n[🗄️ مؤرشف بواسطة ${adminName} | ${new Date().toISOString()}${reason ? ' | السبب: ' + reason : ''}]`;
      lead.status = 'Archived';
      lead.newAction = 'Archived';
      lead.notes = (lead.notes || '').trim() + archiveNote;
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      try {
        if (lead.legacyId) {
          const myLead = await this.myLeadRepository.findOne({ where: { legacyId: lead.legacyId } });
          if (myLead) { myLead.status = 'Archived'; await this.myLeadRepository.save(myLead); }
        }
      } catch { /* best-effort */ }

      return { success: true, message: `🗄️ تم أرشفة العميل ${lead.name}. يمكن استرداده من سجل الإدارة.` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async restoreClientRecord(clientNumber: number, adminId: string, adminName: string) {
    if (!(await this.isAdminOrManager(adminId))) {
      return { success: false, message: 'عفواً، لا تملك الصلاحية.' };
    }
    if (!clientNumber) return { success: false, message: 'معرّف العميل غير صالح.' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود.' };

      const restoreNote = `\n[♻️ تم استرداده بواسطة ${adminName} | ${new Date().toISOString()}]`;
      lead.status = 'Assigned';
      lead.newAction = '';
      lead.notes = (lead.notes || '').trim() + restoreNote;
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      try {
        if (lead.legacyId) {
          const myLead = await this.myLeadRepository.findOne({ where: { legacyId: lead.legacyId } });
          if (myLead) { myLead.status = 'Assigned'; await this.myLeadRepository.save(myLead); }
        }
      } catch { /* best-effort */ }

      return { success: true, message: `♻️ تم استرداد العميل ${lead.name}.` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getArchivedClients(adminId: string) {
    if (!(await this.isAdminOrManager(adminId))) return [];
    try {
      const archived = await this.rawLeadRepository.find({ where: { status: 'Archived' }, relations: { agent: true } });
      return archived.map((lead) => ({
        id: this.fmtClientId(lead.clientNumber),
        name: lead.name || '',
        phone: lead.phone || '',
        course: lead.course || '',
        agentName: lead.agent?.name || '',
        archivedAt: lead.lastModified ? lead.lastModified.toISOString() : '',
      }));
    } catch {
      return [];
    }
  }

  async updateClientOCCode(clientNumber: number, ocCode: string, agentId: string, agentName: string) {
    const cleanOc = (ocCode || '').toString().trim();
    if (!clientNumber) return { success: false, message: 'كود العميل غير صالح' };
    if (!cleanOc || cleanOc === '—' || cleanOc === '-') return { success: false, message: 'كود OC غير صالح' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود' };
      lead.ocCode = cleanOc;
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);
      return { success: true, message: '✅ تم حفظ OC Code: ' + cleanOc };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteLeadFromMyLeads(clientNumber: number, agentId: string, isManager: boolean) {
    if (!clientNumber) return { success: false, message: 'كود العميل غير صالح' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود' };
      // My_Leads has no clientNumber of its own — matched via the raw lead's phone.
      const targetMyLead = lead.phone ? await this.myLeadRepository.findOne({ where: { phone: lead.phone } }) : null;
      if (!targetMyLead) return { success: false, message: 'العميل غير موجود' };

      if (!isManager && targetMyLead.agentLegacyId && targetMyLead.agentLegacyId !== agentId) {
        const agent = await this.userRepository.findOne({ where: { id: agentId } });
        if (!agent || targetMyLead.agentLegacyId !== agent.legacyId) {
          return { success: false, message: 'يمكنك فقط حذف عملاءك' };
        }
      }

      await this.myLeadRepository.remove(targetMyLead);
      lead.status = 'Deleted';
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      return { success: true, message: 'تم الحذف بنجاح وتحديث شيت الماستر' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async adminDeleteLead(clientNumber: number, adminId?: string) {
    if (adminId && !(await this.isAdminOrManager(adminId))) {
      return { success: false, message: 'عفواً، لا تملك الصلاحية.' };
    }
    if (!clientNumber) return { success: false, message: 'كود العميل غير صالح' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود' };

      let deletedFromMy = false;
      if (lead.phone) {
        const myLead = await this.myLeadRepository.findOne({ where: { phone: lead.phone } });
        if (myLead) { await this.myLeadRepository.remove(myLead); deletedFromMy = true; }
      }
      await this.rawLeadRepository.remove(lead);

      return { success: true, message: deletedFromMy ? 'تم الحذف نهائياً من السيستم' : 'تم الحذف من شيت الماستر (لم يُعثر على سجل في قائمة الموظف)' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateLeadDetailsDirectly(
    clientNumber: number, newName: string, newPhone: string, newCourse: string,
    newStatus: string, newNextDue: string, newNotesText: string, agentId: string, agentName: string,
  ) {
    if (!clientNumber) return { success: false, message: 'كود العميل غير صالح' };
    try {
      const isAdmin = await this.isAdminOrManager(agentId);
      // معرّف العميل ممكن ييجي بأي صيغة (ID-3786 / UUID / legacyId / OC) — resolver موحّد.
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود' };

      const myLead = lead.phone ? await this.myLeadRepository.findOne({ where: { phone: lead.phone } }) : null;
      if (myLead && !isAdmin && myLead.agentLegacyId && myLead.agentLegacyId !== agentId) {
        const agent = await this.userRepository.findOne({ where: { id: agentId } });
        if (!agent || myLead.agentLegacyId !== agent.legacyId) {
          return { success: false, message: 'ليس لديك صلاحية لتعديل هذا العميل' };
        }
      }

      const cleanPhone = newPhone ? this.normalizePhone(newPhone) : lead.phone;
      const targetName = (newName || '').toString().trim();

      if (myLead) {
        if (targetName) myLead.name = targetName;
        if (cleanPhone) myLead.phone = cleanPhone;
        if (newCourse) myLead.course = newCourse;
        if (newStatus) myLead.status = newStatus;
        if (newNotesText !== undefined) myLead.legacyNotes = newNotesText;
        myLead.followUpDate = newNextDue ? this.enforceFollowUpDateLimit(newStatus || myLead.status, new Date(newNextDue)) : null;
        await this.myLeadRepository.save(myLead);
      }

      if (targetName) lead.name = targetName;
      if (cleanPhone) lead.phone = cleanPhone;
      if (newCourse) lead.course = newCourse;
      if (newNotesText !== undefined) lead.notes = newNotesText;
      if (newStatus) { lead.action = newStatus; lead.newAction = newStatus; }
      lead.followUpDate = newNextDue ? this.enforceFollowUpDateLimit(newStatus || lead.action, new Date(newNextDue)) : null;
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      return { success: true, message: '✅ تم تحديث تفاصيل العميل بنجاح.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async searchClientHistoryCandidates(query: string) {
    try {
      const q = (query || '').toString().trim();
      if (!q) return { found: false, results: [] };
      const qClean = this.normalizePhone(q);
      const isPhoneLike = qClean.length >= 4;

      const qb = this.rawLeadRepository.createQueryBuilder('lead');
      qb.where('1=0');
      if (isPhoneLike) qb.orWhere('lead.phone LIKE :phone', { phone: `%${qClean}%` });
      if (q.toUpperCase().startsWith('OC-')) qb.orWhere('lead.ocCode = :oc', { oc: q.toUpperCase() });
      if (q.length >= 3) qb.orWhere('lead.name LIKE :name', { name: `%${q}%` });
      qb.leftJoinAndSelect('lead.agent', 'agent').take(30);

      const leads = await qb.getMany();
      const results = leads.map((lead) => ({
        id: lead.clientNumber,
        name: lead.name || 'غير معروف',
        phone: lead.phone || '',
        ocCode: lead.ocCode || '',
        agent: lead.agent?.name || '',
        status: lead.status || '',
      }));
      return { found: results.length > 0, results };
    } catch (e: any) {
      return { found: false, results: [], message: 'خطأ: ' + e.message };
    }
  }

  async adminGetAllLeads(selectedMonth?: string) {
    try {
      const month = selectedMonth || 'current';
      const qb = this.rawLeadRepository.createQueryBuilder('lead').leftJoinAndSelect('lead.agent', 'agent');

      if (month !== 'all') {
        const target = month === 'current' ? new Date().toISOString().slice(0, 7) : month;
        qb.where("DATE_FORMAT(lead.date, '%Y-%m') = :target", { target });
      }
      qb.orderBy('lead.date', 'DESC');
      if (month === 'all') qb.take(2000);

      const leads = await qb.getMany();
      return leads.map((lead) => ({
        id: this.fmtClientId(lead.clientNumber),
        name: lead.name || '',
        phone: lead.phone || '',
        course: lead.course || '',
        agent: lead.agent?.name || lead.agentLegacyId || '',
        status: lead.status || '',
        lastAction: lead.newAction || lead.action || '',
        ocCode: lead.ocCode || '',
        createdAt: lead.date ? lead.date.toISOString().slice(0, 10) : '',
      }));
    } catch {
      return [];
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  SALES: FRESH LEADS (DB-backed distribution)  ═══
  // ═══════════════════════════════════════════════════

  private async logActivity(userId: string | null, userName: string, action: string, details: string) {
    try {
      const user = userId ? await this.userRepository.findOne({ where: { id: userId } }) : null;
      await this.activityLogRepository.save({
        date: new Date(),
        user: user || null,
        userLegacyId: user?.legacyId || null,
        name: userName || user?.name || '',
        status: action,
        notes: details,
      });
    } catch { /* logging must never break the main flow */ }
  }

  // selectedDay = day-of-month within the current month (old daily-tab convention); empty = today
  private resolveForDate(selectedDay?: string | number): string {
    const now = new Date();
    const day = selectedDay ? parseInt(String(selectedDay), 10) : now.getDate();
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  async getAgentKeysForFresh() {
    try {
      const users = await this.userRepository.find({ where: { active: true } });
      const keys = users
        .filter((u) => (u.role || '').trim().toLowerCase() === 'sales')
        .map((u) => u.name);
      return { keys };
    } catch {
      return { keys: [] };
    }
  }

  async addFreshLeadToSheet(
    agentKey: string, name: string, phone: string, source: string, campaign: string,
    course: string, addedById: string, addedByName: string, targetDate?: string, phone2?: string,
  ) {
    try {
      const clean = this.normalizePhone(phone);
      if (!clean) return { success: false, message: 'رقم هاتف غير صالح' };

      const existing = await this.rawLeadRepository.findOne({ where: { phone: clean }, relations: { agent: true } });
      if (existing) {
        return {
          success: false, alreadyExists: true,
          message: `⚠️ الرقم موجود بالفعل في النظام (العميل: ${existing.name || 'غير معروف'} | Agent: ${existing.agent?.name || '—'})`,
        };
      }
      const pendingDup = await this.freshLeadRepository.findOne({ where: { phone: clean, status: 'available' } });
      if (pendingDup) {
        return {
          success: false, alreadyExists: true,
          message: `⚠️ الرقم موجود بالفعل في الفريش (لسه ما اتسحبش — مخصص لـ ${pendingDup.targetAgentName || 'عام'})`,
        };
      }
      const clean2 = phone2 ? this.normalizePhone(phone2) : '';
      if (clean2) {
        const dup2 = await this.rawLeadRepository.findOne({ where: { phone: clean2 } });
        if (dup2) {
          return { success: false, alreadyExists: true, message: `⚠️ الرقم الإضافي مسجّل بالفعل لعميل آخر (${dup2.name || 'غير معروف'}) — لازم يكون رقم جديد فعلاً.` };
        }
      }

      let forDate: string;
      if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) forDate = targetDate;
      else forDate = this.resolveForDate();

      await this.freshLeadRepository.save({
        name: name || '',
        phone: clean,
        phone2: clean2 || null,
        source: source || 'يدوي',
        campaign: campaign || '',
        course: course || 'Digital Marketing',
        targetAgentName: agentKey || null,
        forDate,
        status: 'available' as const,
        addedById: addedById || null,
        addedByName: addedByName || '',
      });

      await this.logActivity(addedById, addedByName, 'FRESH_MANUAL', `يدوي: ${clean} → ${agentKey || '—'}`);
      return {
        success: true, name, phone: clean, addedToFreshSheet: true,
        message: `✅ تم إضافة الليد للفريش${agentKey ? ' الخاص بـ ' + agentKey : ' (عام)'} — يظهر للسيلز للسحب`,
      };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async getAvailableFreshCount(agentId: string, agentName: string, agentKey?: string, selectedDay?: string) {
    try {
      const key = agentKey || agentName;
      const forDate = this.resolveForDate(selectedDay);
      const count = await this.freshLeadRepository
        .createQueryBuilder('fl')
        .where('fl.status = :st', { st: 'available' })
        .andWhere('fl.forDate = :forDate', { forDate })
        .andWhere('(fl.targetAgentName IS NULL OR fl.targetAgentName = :key)', { key })
        .getCount();
      return { success: true, count };
    } catch (e: any) {
      return { success: false, count: 0, message: 'خطأ: ' + e.message };
    }
  }

  async pullFreshLeadOnly(agentId: string, agentName: string, agentKey?: string, selectedDay?: string) {
    const key = agentKey || agentName;
    const forDate = this.resolveForDate(selectedDay);
    try {
      const agent = agentId ? await this.userRepository.findOne({ where: { id: agentId } }) : null;

      return await this.freshLeadRepository.manager.transaction(async (em) => {
        // Loop: a candidate can turn out to be a duplicate owned by another agent — mark it and try the next.
        for (let attempt = 0; attempt < 25; attempt++) {
          const fresh = await em
            .getRepository(FreshLead)
            .createQueryBuilder('fl')
            .setLock('pessimistic_write')
            .where('fl.status = :st', { st: 'available' })
            .andWhere('fl.forDate = :forDate', { forDate })
            .andWhere('(fl.targetAgentName IS NULL OR fl.targetAgentName = :key)', { key })
            .orderBy('fl.createdAt', 'ASC')
            .getOne();

          if (!fresh) {
            return { success: false, message: '📢 تم سحب جميع الأرقام المخصصة لك اليوم.' };
          }

          // Ownership guard: the same phone may already belong to a DIFFERENT agent in Raw_Data/My_Leads.
          const existingRaw = await em.getRepository(RawLead).findOne({ where: { phone: fresh.phone }, relations: { agent: true } });
          const existingMy = await em.getRepository(MyLead).findOne({ where: { phone: fresh.phone }, relations: { agent: true } });
          const otherOwner =
            (existingRaw?.agent && existingRaw.agent.name !== agentName && existingRaw.agent.name !== 'المدير' && existingRaw.agent.name) ||
            (existingMy?.agent && existingMy.agent.name !== agentName && existingMy.agent.name !== 'المدير' && existingMy.agent.name) || null;

          if (otherOwner) {
            fresh.status = 'duplicate';
            fresh.duplicateNote = 'مكرر مع ' + otherOwner;
            await em.getRepository(FreshLead).save(fresh);
            continue;
          }

          // Upsert into Raw_Data (keep existing clientNumber if the phone is already there unowned)
          let raw = existingRaw;
          if (raw) {
            raw.agent = agent || raw.agent;
            raw.agentLegacyId = agent?.legacyId || raw.agentLegacyId;
            raw.status = 'Assigned';
            raw.lastModified = new Date();
            if (!raw.name && fresh.name) raw.name = fresh.name;
            await em.getRepository(RawLead).save(raw);
          } else {
            raw = await em.getRepository(RawLead).save({
              date: new Date(),
              name: fresh.name || '',
              phone: fresh.phone,
              source: fresh.source || 'فيس بوك',
              course: fresh.course || 'Digital Marketing',
              agent: agent || null,
              agentLegacyId: agent?.legacyId || null,
              status: 'Assigned',
              campaignType: fresh.campaign || '',
            });
          }

          // Upsert into My_Leads
          if (existingMy) {
            existingMy.agent = agent || existingMy.agent;
            existingMy.agentLegacyId = agent?.legacyId || existingMy.agentLegacyId;
            existingMy.status = 'Assigned';
            if (!existingMy.name && fresh.name) existingMy.name = fresh.name;
            await em.getRepository(MyLead).save(existingMy);
          } else {
            await em.getRepository(MyLead).save({
              date: new Date(),
              name: fresh.name || '',
              phone: fresh.phone,
              source: fresh.source || 'فيس بوك',
              course: fresh.course || 'Digital Marketing',
              agent: agent || null,
              agentLegacyId: agent?.legacyId || null,
              status: 'Assigned',
              campaignType: fresh.campaign || '',
            });
          }

          fresh.status = 'pulled';
          fresh.pulledByName = agentName;
          fresh.pulledAt = new Date();
          await em.getRepository(FreshLead).save(fresh);

          await this.logActivity(agentId, agentName, 'PULL_FRESH', 'فريش: ' + fresh.phone);
          return {
            success: true,
            id: this.fmtClientId(raw.clientNumber),
            name: raw.name || fresh.name || '',
            phone: fresh.phone,
            course: fresh.course || 'Digital Marketing',
            type: 'Fresh',
            source: fresh.source || '',
            campaign: fresh.campaign || '',
          };
        }
        return { success: false, message: '📢 تم سحب جميع الأرقام المخصصة لك اليوم.' };
      });
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async getTodayFreshLeads() {
    try {
      const today = this.resolveForDate();
      const rows = await this.freshLeadRepository
        .createQueryBuilder('fl')
        .where('DATE(fl.createdAt) = :today', { today })
        .orderBy('fl.createdAt', 'DESC')
        .getMany();
      const leads = rows.map((r) => ({
        addedBy: r.addedByName || '',
        phone: r.phone,
        agentKey: r.targetAgentName || '',
        time: r.createdAt ? new Date(r.createdAt).toTimeString().slice(0, 5) : '',
        name: r.name || '',
        source: r.source || '',
        course: r.course || '',
        campaign: r.campaign || '',
        details: `يدوي: ${r.phone} → ${r.targetAgentName || '—'}`,
      }));
      return { leads, todayDate: today, todayDay: new Date().getDate() };
    } catch (e: any) {
      return { leads: [], error: e.message };
    }
  }

  async getTodayRangeLeadsForAgent(agentKey: string, agentName: string, selectedDay?: string) {
    try {
      const key = agentKey || agentName;
      const forDate = this.resolveForDate(selectedDay);
      const rows = await this.freshLeadRepository
        .createQueryBuilder('fl')
        .where('fl.forDate = :forDate', { forDate })
        .andWhere('(fl.targetAgentName IS NULL OR fl.targetAgentName = :key)', { key })
        .orderBy('fl.createdAt', 'ASC')
        .getMany();
      const leads = rows.map((r) => ({
        phone: r.phone,
        name: r.name || '',
        campaign: r.campaign || '',
        pulled: r.status !== 'available',
        pulledText: r.status === 'pulled'
          ? `تم السحب بواسطة ${r.pulledByName || ''}`
          : r.status === 'duplicate' ? (r.duplicateNote || 'مكرر') : '',
      }));
      return { success: true, leads, tabName: forDate, todayDay: parseInt(forDate.slice(8), 10) };
    } catch (e: any) {
      return { success: false, leads: [], message: 'خطأ: ' + e.message };
    }
  }

  async getFreshLeadAgentStats(selectedDay?: string) {
    try {
      const forDate = this.resolveForDate(selectedDay);
      const rows = await this.freshLeadRepository.find({ where: { forDate } });
      const byAgent: Record<string, { count: number; total: number }> = {};
      for (const r of rows) {
        const k = r.targetAgentName || 'عام';
        byAgent[k] = byAgent[k] || { count: 0, total: 0 };
        byAgent[k].total++;
        byAgent[k].count++;
      }
      const stats = Object.entries(byAgent).map(([k, v]) => ({ key: k, count: v.count, total: v.total }));
      return { stats, tabName: forDate, source: 'db' };
    } catch (e: any) {
      return { error: e.message, stats: [] };
    }
  }

  async transferFreshLead(phone: string, fromAgentKey: string, toAgentKey: string, operatorId: string, operatorName: string, selectedDay?: string) {
    try {
      if (!toAgentKey) return { success: false, message: 'الوكيل الجديد غير معرّف' };
      const clean = this.normalizePhone(phone);
      const forDate = this.resolveForDate(selectedDay);

      const fresh = await this.freshLeadRepository.findOne({ where: { phone: clean, forDate } })
        || await this.freshLeadRepository.findOne({ where: { phone: clean } });
      if (fresh) {
        fresh.targetAgentName = toAgentKey;
        // Transferred lead is a brand-new, unpulled assignment for the new agent (old bug fix preserved).
        fresh.status = 'available';
        fresh.pulledByName = null;
        fresh.pulledAt = null;
        fresh.duplicateNote = null;
        await this.freshLeadRepository.save(fresh);
      }

      const raw = await this.rawLeadRepository.findOne({ where: { phone: clean } });
      if (raw) {
        const toUser = await this.userRepository.findOne({ where: { name: toAgentKey } });
        if (toUser) { raw.agent = toUser; raw.agentLegacyId = toUser.legacyId; }
        raw.lastModified = new Date();
        await this.rawLeadRepository.save(raw);
      }

      if (!fresh && !raw) return { success: false, message: 'لم يُعثر على الرقم في الفريش أو قاعدة البيانات' };

      await this.logActivity(operatorId, operatorName, 'TRANSFER_LEAD', `نقل: ${clean} من ${fromAgentKey || '—'} → ${toAgentKey}`);
      return { success: true, message: `✅ تم نقل الليد من ${fromAgentKey || '—'} إلى ${toAgentKey}` };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async updateFreshLeadDetails(phone: string, newName: string, newSource: string, newCampaign: string, newCourse: string, operatorId: string, operatorName: string, selectedDay?: string) {
    try {
      const clean = this.normalizePhone(phone);
      let updated = false;

      const raw = await this.rawLeadRepository.findOne({ where: { phone: clean } });
      if (raw) {
        if (newName) raw.name = newName;
        if (newSource) raw.source = newSource;
        if (newCourse) raw.course = newCourse;
        raw.campaignType = newCampaign || '';
        raw.lastModified = new Date();
        await this.rawLeadRepository.save(raw);
        updated = true;
      }

      const fresh = await this.freshLeadRepository.findOne({ where: { phone: clean } });
      if (fresh) {
        if (newName) fresh.name = newName;
        if (newSource) fresh.source = newSource;
        if (newCourse) fresh.course = newCourse;
        if (newCampaign !== undefined) fresh.campaign = newCampaign || '';
        await this.freshLeadRepository.save(fresh);
        updated = true;
      }

      await this.logActivity(operatorId, operatorName, 'EDIT_LEAD', `تعديل: ${clean} — ${[newName, newSource, newCampaign, newCourse].filter(Boolean).join(' | ')}`);
      return { success: updated, message: updated ? '✅ تم تحديث بيانات الليد' : '⚠️ لم يُعثر على الرقم' };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async migrateLeadDay(fromDay: string, toDay: string, operatorId: string, operatorName: string) {
    try {
      const fromDate = this.resolveForDate(fromDay);
      const toDate = this.resolveForDate(toDay);
      const result = await this.freshLeadRepository
        .createQueryBuilder()
        .update()
        .set({ forDate: toDate })
        .where('forDate = :fromDate AND status = :st', { fromDate, st: 'available' })
        .execute();
      const moved = result.affected || 0;
      await this.logActivity(operatorId, operatorName, 'MIGRATE_DAY', `نقل ${moved} ليد من ${fromDate} → ${toDate}`);
      return { success: true, moved, skipped: 0, message: `✅ تم نقل ${moved} ليد من ${fromDate} إلى ${toDate}` };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  SALES: RECYCLE & CLAIM  ═══
  // ═══════════════════════════════════════════════════

  async getRecyclePullCount(agentId: string): Promise<number> {
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      return await this.activityLogRepository
        .createQueryBuilder('al')
        .where('al.status = :st', { st: 'PULL_RECYCLE' })
        .andWhere('al.user_id = :uid', { uid: agentId })
        .andWhere('al.date >= :start', { start })
        .getCount();
    } catch {
      return 0;
    }
  }

  async pullRecycledLeadRandomly(agentId: string, agentName: string) {
    try {
      const count = await this.getRecyclePullCount(agentId);
      if (count >= 20) return { success: false, message: '🚨 وصلت للحد الأقصى اليومي (20 ليد ريسيكل).' };

      const targets = ['closed lost', 'follow up', 'delayed', 'no answer', 'لم يرد'];
      const agent = await this.userRepository.findOne({ where: { id: agentId } });

      const qb = this.rawLeadRepository.createQueryBuilder('lead')
        .where('lead.agent_id IS NULL')
        .andWhere(
          '(' + targets.map((_, i) => `LOWER(COALESCE(lead.newAction, lead.action, lead.status, '')) LIKE :t${i}`).join(' OR ') + ')',
        );
      targets.forEach((t, i) => qb.setParameter(`t${i}`, `%${t}%`));
      const eligible = await qb.getMany();

      // Drift guard: skip leads whose phone is owned by another agent in My_Leads.
      // One bulk query into a phone→owner map (was one query per eligible lead — the whole pull took seconds).
      const owners = new Map<string, string>();
      for (const ml of await this.myLeadRepository.find({ relations: { agent: true } })) {
        if (ml.phone && ml.agent?.name) owners.set(ml.phone, ml.agent.name);
      }
      const pool = eligible.filter((lead) => {
        if (!lead.phone) return true;
        const owner = owners.get(lead.phone);
        return !owner || owner === 'المدير' || owner === agentName;
      });
      if (!pool.length) return { success: false, message: '🚨 لا توجد ليدات متاحة للريسيكل.' };

      const lead = pool[Math.floor(Math.random() * pool.length)];
      lead.agent = agent || null;
      lead.agentLegacyId = agent?.legacyId || null;
      lead.status = 'Recycled Assigned';
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      const lastNote = (lead.notes || '').split('\n').filter((l) => l.trim()).pop() || '';

      const existingMy = lead.phone ? await this.myLeadRepository.findOne({ where: { phone: lead.phone } }) : null;
      if (existingMy) {
        existingMy.agent = agent || null;
        existingMy.agentLegacyId = agent?.legacyId || null;
        existingMy.status = 'Recycled Assigned';
        await this.myLeadRepository.save(existingMy);
      } else {
        await this.myLeadRepository.save({
          date: new Date(),
          name: lead.name || '',
          phone: lead.phone || '',
          source: lead.source || '',
          course: lead.course || '',
          agent: agent || null,
          agentLegacyId: agent?.legacyId || null,
          status: 'Recycled Assigned',
          legacyNotes: lead.notes || '',
          followUpDate: lead.followUpDate && new Date(lead.followUpDate).getFullYear() > 2000 ? lead.followUpDate : null,
          campaignType: lead.campaignType || '',
        });
      }

      await this.logActivity(agentId, agentName, 'PULL_RECYCLE', 'ريسيكل: ' + (lead.name || lead.phone));
      return {
        success: true,
        id: this.fmtClientId(lead.clientNumber),
        name: lead.name || '',
        phone: lead.phone || '',
        course: lead.course || '',
        lastNote,
        remaining: 20 - count - 1,
        source: lead.source || '',
        campaign: lead.campaignType || '',
      };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async claimSearchedLead(clientNumber: number, rowIndex: any, agentId: string, agentName: string) {
    try {
      const count = await this.getRecyclePullCount(agentId);
      if (count >= 20) return { success: false, message: '🚨 لقد وصلت للحد الأقصى اليومي لسحب الليدات (20 ليد).' };

      const lead = await this.findRawByAnyId(clientNumber, { agent: true });
      if (!lead) return { success: false, message: 'العميل غير موجود' };
      if (lead.agent) return { success: false, message: '🚨 تم سحب هذا العميل بالفعل!' };

      const agent = await this.userRepository.findOne({ where: { id: agentId } });
      lead.agent = agent || null;
      lead.agentLegacyId = agent?.legacyId || null;
      lead.status = 'Assigned';
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      const fuSafe = lead.followUpDate && new Date(lead.followUpDate).getFullYear() > 2000 ? lead.followUpDate : null;
      const existingMy = lead.phone ? await this.myLeadRepository.findOne({ where: { phone: lead.phone } }) : null;
      if (existingMy) {
        existingMy.agent = agent || null;
        existingMy.agentLegacyId = agent?.legacyId || null;
        existingMy.status = 'Assigned';
        await this.myLeadRepository.save(existingMy);
      } else {
        await this.myLeadRepository.save({
          date: new Date(),
          name: lead.name || '',
          phone: lead.phone || '',
          source: lead.source || '',
          course: lead.course || '',
          agent: agent || null,
          agentLegacyId: agent?.legacyId || null,
          status: 'Assigned',
          legacyNotes: lead.notes || '',
          followUpDate: fuSafe,
          campaignType: lead.campaignType || '',
        });
      }

      await this.logActivity(agentId, agentName, 'PULL_RECYCLE', 'سحب من البحث: ' + (lead.name || lead.phone));
      return { success: true, id: this.fmtClientId(lead.clientNumber), name: lead.name || '' };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async getTodayCalls(agentId: string) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const leads = await this.myLeadRepository.find({ where: { agent: { id: agentId } } });
      const calls: any[] = [];
      for (const lead of leads) {
        const notes = lead.legacyNotes || '';
        const assignedToday = lead.date && new Date(lead.date).toISOString().slice(0, 10) === today;
        if (notes.includes('[' + today)) {
          for (const line of notes.split('\n')) {
            if (!line.includes('[' + today)) continue;
            const timeMatch = line.match(/\[\d{4}-\d{2}-\d{2}\s+(\d{2}:\d{2})/);
            const actMatch = line.match(/\]\s*\(([^)]+)\)/);
            calls.push({
              name: lead.name || '—',
              action: actMatch ? actMatch[1] : lead.status || '—',
              time: timeMatch ? timeMatch[1] : '—',
            });
          }
        } else if (assignedToday) {
          calls.push({
            name: lead.name || '—',
            action: lead.status || 'جديد (لم يتم الاتصال)',
            time: lead.date ? new Date(lead.date).toTimeString().slice(0, 5) : '—',
          });
        }
      }
      return calls;
    } catch {
      return [];
    }
  }

  async getIdleLeads(agentId: string, daysLimit?: number) {
    try {
      const limit = daysLimit || 3;
      const leads = await this.myLeadRepository.find({ where: { agent: { id: agentId } } });
      const now = Date.now();
      const idle = leads
        .filter((l) => {
          if (!l.date) return false;
          const diffDays = Math.floor((now - new Date(l.date).getTime()) / 86400000);
          if (diffDays < limit) return false;
          const act = (l.status || '').toLowerCase();
          return !act.includes('won') && !act.includes('lost');
        })
        .map((l) => ({
          phone: l.phone || '',
          name: l.name || '',
          daysAgo: Math.floor((now - new Date(l.date).getTime()) / 86400000),
        }));

      // id must be the RAW lead's clientNumber (my_leads has its own separate sequence)
      const phones = idle.map((l) => l.phone).filter(Boolean);
      const rawMap = new Map<string, number>();
      if (phones.length) {
        const raws = await this.rawLeadRepository
          .createQueryBuilder('r')
          .where('r.phone IN (:...phones)', { phones })
          .getMany();
        raws.forEach((r) => rawMap.set(r.phone, r.clientNumber));
      }
      return idle
        .map((l) => ({ id: this.fmtClientId(rawMap.get(l.phone)) || (rawMap.get(l.phone) || ''), name: l.name, phone: l.phone, daysAgo: l.daysAgo }))
        .sort((a, b) => b.daysAgo - a.daysAgo);
    } catch {
      return [];
    }
  }

  async getMyLeadsOrphans() {
    try {
      // My_Leads rows whose phone no longer exists in Raw_Data (drift that shouldn't happen in the DB era)
      const orphans = await this.myLeadRepository
        .createQueryBuilder('ml')
        .leftJoin(RawLead, 'r', 'r.phone = ml.phone')
        .where('r.id IS NULL')
        .getMany();
      return {
        success: true,
        orphans: orphans.map((o) => ({ id: o.clientNumber, name: o.name || '', phone: o.phone || '', status: o.status || '' })),
        count: orphans.length,
      };
    } catch (e: any) {
      return { success: false, orphans: [], message: e.message };
    }
  }

  async getRoundMembersOrphans() {
    try {
      // Round members whose OC code doesn't match any payment record
      const orphans = await this.roundMemberRepository
        .createQueryBuilder('rm')
        .leftJoin(ClientPayment, 'cp', 'cp.clientLegacyId = rm.ocCode')
        .where('rm.ocCode IS NOT NULL AND rm.ocCode != \'\'')
        .andWhere('cp.id IS NULL')
        .getMany();
      return {
        success: true,
        orphans: orphans.map((o) => ({ ocCode: o.ocCode, name: o.name || '', phone: o.phone || '' })),
        count: orphans.length,
      };
    } catch (e: any) {
      return { success: false, orphans: [], message: e.message };
    }
  }

  async findClientForRoundPull(phone: string) {
    try {
      if (!phone) return { success: false, message: 'رقم الهاتف فارغ' };
      const clean = this.normalizePhone(phone);
      if (!clean) return { success: false, message: 'رقم هاتف غير صالح' };

      const fin = await this.financialDataRepository
        .createQueryBuilder('fd')
        .where("LOWER(COALESCE(fd.type,'')) = 'client'")
        .andWhere('fd.phone LIKE :p', { p: `%${clean.slice(-9)}%` })
        .getOne();
      if (!fin) return { success: false, message: 'لم يتم العثور على أي عميل بهذا الرقم في حسابات السيلز' };

      const client: any = {
        ocCode: fin.ocCode || '',
        name: fin.clientName || '',
        phone: fin.phone || '',
        course: fin.course || '',
        action: fin.action || '',
        price: Number(fin.price) || 0,
        paid: Number(fin.paid) || 0,
        method: fin.paymentMethod || '',
        attendance: fin.attendance ? new Date(fin.attendance).toISOString().slice(0, 10) : '',
        agentName: fin.agentName || '',
        foundIn: 'Financial_Data',
      };

      const pay = fin.ocCode
        ? await this.clientPaymentRepository.findOne({ where: { clientLegacyId: fin.ocCode } })
        : null;
      if (pay) {
        client.payId = pay.legacyId || pay.id;
        client.price = Number(pay.totalAmount) || client.price;
        client.paid = Number(pay.amountPaid) || client.paid;
        client.inst1 = Number(pay.amountDetail1) || 0;
        client.inst2 = Number(pay.amountDetail2) || 0;
        client.inst3 = Number(pay.amountDetail3) || 0;
      }
      return { success: true, client };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async findClientForOldPayment(agentId: string, query: string) {
    if (!query || !String(query).trim()) return { success: false, message: 'أدخل رقم تليفون أو OC Code' };
    try {
      const q = String(query).trim();
      const isOc = q.toLowerCase().startsWith('oc-');
      const qb = this.financialDataRepository
        .createQueryBuilder('fd')
        .where("LOWER(COALESCE(fd.type,'')) = 'client'");
      if (isOc) qb.andWhere('LOWER(fd.ocCode) = :oc', { oc: q.toLowerCase() });
      else qb.andWhere('fd.phone LIKE :p', { p: `%${this.normalizePhone(q).slice(-9)}%` });

      const rows = await qb.getMany();
      if (!rows.length) return { success: false, message: 'مش لاقي العميل ده في Financial_Data' };

      rows.sort((a, b) => ((b.year || 0) * 12 + (b.month || 0)) - ((a.year || 0) * 12 + (a.month || 0)));
      const best = rows[0];
      const totalPrice = Number(best.price) || 0;
      const totalPaid = Number(best.paid) || 0;
      return {
        success: true,
        client: {
          name: best.clientName || '',
          phone: best.phone || '',
          ocCode: best.ocCode || '',
          month: best.month || 0,
          year: best.year || 0,
          totalPrice,
          totalPaid,
          agentName: best.agentName || '',
          remaining: totalPrice - totalPaid,
        },
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async lookupStudentPhone(phone: string) {
    try {
      const clean = this.normalizePhone(phone);
      if (!clean) return { success: false, found: false };
      const student = await this.studentRepository.findOne({ where: { phone: clean } });
      if (!student) return { success: true, found: false };
      return { success: true, found: true, id: student.id, name: student.name, email: student.email || '' };
    } catch (e: any) {
      return { success: false, found: false, message: e.message };
    }
  }

  async syncStudentByPhone(phone: string) {
    try {
      const clean = this.normalizePhone(phone);
      if (!clean) return { success: false, message: 'رقم غير صالح' };
      const student = await this.studentRepository.findOne({ where: { phone: clean } });
      const lead = await this.rawLeadRepository.findOne({ where: { phone: clean } });
      if (!student || !lead) return { success: false, message: student ? 'مفيش عميل بالرقم ده' : 'مفيش طالب بالرقم ده' };
      let changed = false;
      if (!student.name && lead.name) { student.name = lead.name; changed = true; }
      if (changed) await this.studentRepository.save(student);
      return { success: true, message: changed ? '✅ تمت المزامنة' : 'البيانات متطابقة بالفعل' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getClientDetailsByPhone(phone: string) {
    try {
      const clean = this.normalizePhone(phone);
      if (!clean) return { success: false, message: 'رقم غير صالح' };

      const lead = await this.myLeadRepository.findOne({
        where: { phone: clean },
        order: { date: 'DESC' }
      });

      const fd = await this.financialDataRepository.findOne({
        where: { phone: clean },
        order: { createdAt: 'DESC' }
      });

      const rawLead = await this.rawLeadRepository.findOne({
        where: { phone: clean },
        order: { date: 'DESC' }
      });

      const name = lead?.name || fd?.clientName || rawLead?.name || '';
      const ocCode = lead?.legacyId || fd?.ocCode || rawLead?.ocCode || '';
      const course = lead?.course || fd?.course || rawLead?.course || '';

      let roundName = '';
      let roundId = '';

      if (ocCode) {
        const payment = await this.clientPaymentRepository.findOne({
          where: { clientLegacyId: ocCode, isDeleted: false },
          relations: { round: true },
          order: { createdAt: 'DESC' }
        });
        if (payment) {
          roundName = payment.roundName || '';
          roundId = payment.round?.id || '';
        }
      }

      if (!name) {
        return { success: false, message: '🔍 لم يتم العثور على أي عميل أو ليد مسجل بهذا الرقم في النظام' };
      }

      const baseUname = this.transliterateArabicToEnglish(name);
      let suggestedUname = baseUname + '@bsa';
      let counter = 1;
      while (await this.studentRepository.findOne({ where: { email: suggestedUname } })) {
        suggestedUname = `${baseUname}${counter}@bsa`;
        counter++;
      }

      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
      const suggestedPass = `BSA_${randomDigits}`;

      return {
        success: true,
        message: '✅ تم العثور على بيانات العميل وتعبئتها تلقائياً',
        client: {
          name,
          phone: clean,
          ocCode,
          course,
          roundName,
          roundId,
          suggestedUname,
          suggestedPass
        }
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async syncStudentPhones() {
    // Sheet-era bulk phone normalizer — phones are normalized on write in the DB system.
    return { success: true, fixed: 0, message: '✅ غير مطلوب في النظام الجديد — الأرقام بتتوحد تلقائياً عند الحفظ.' };
  }

  // Sheet-era repair tools: the drift they fixed (manual sheet IDs, external invoice sheet sync)
  // can't occur in the database system, so these are honest no-ops kept for UI compatibility.
  async migrateRawDataOcCodes() {
    return { success: true, message: '✅ غير مطلوب في النظام الجديد — أكواد OC محفوظة في قاعدة البيانات مباشرة.' };
  }
  async repairMyLeadsAfterIdFix() {
    return { success: true, message: '✅ غير مطلوب في النظام الجديد — المعرفات موحدة في قاعدة البيانات.' };
  }
  async autoSyncMissingOcCodes() {
    return { success: true, synced: 0, message: '✅ غير مطلوب في النظام الجديد.' };
  }
  async syncClientOcCodeFromExternal() {
    return { success: false, message: 'مزامنة شيت الفواتير الخارجي اتلغت — النظام الجديد بيسجل أكواد OC مباشرة.' };
  }

  // ═══════════════════════════════════════════════════
  // ═══  SALES: PAYMENTS & INSTALLMENTS (Group 2)  ═══
  // ═══════════════════════════════════════════════════

  private genLegacyId(): string {
    return randomUUID().replace(/-/g, '').slice(0, 18);
  }

  // Resolve/mint the client's OC code: prefer the raw lead's stored one; otherwise mint OC-2NNNNNNN
  // (2xxxxxxx range never collides with legacy OC-10xxxxx numbering) and write it back.
  private async ensureOcCodeForClient(clientId: any, clientPhone?: string): Promise<string> {
    const idStr = (clientId || '').toString().trim();
    if (idStr.toLowerCase().startsWith('oc-')) return idStr;
    let raw: RawLead | null = null;
    if (/^\d+$/.test(idStr)) raw = await this.rawLeadRepository.findOne({ where: { clientNumber: parseInt(idStr, 10) } });
    if (!raw && clientPhone) raw = await this.rawLeadRepository.findOne({ where: { phone: this.normalizePhone(clientPhone) } });
    if (raw?.ocCode && raw.ocCode.toLowerCase().startsWith('oc-')) return raw.ocCode;
    const minted = raw ? `OC-2${String(raw.clientNumber).padStart(7, '0')}` : (idStr || '');
    if (raw && minted) {
      raw.ocCode = minted;
      await this.rawLeadRepository.save(raw);
    }
    return minted;
  }

  private async findPaymentByAnyId(payId: any): Promise<ClientPayment | null> {
    const idStr = (payId || '').toString().trim();
    if (!idStr) return null;
    return (
      (await this.clientPaymentRepository.findOne({ where: { legacyId: idStr } })) ||
      (idStr.length === 36 ? await this.clientPaymentRepository.findOne({ where: { id: idStr } }) : null)
    );
  }

  async addClientPayment(
    clientId: any, clientName: string, clientPhone: string, course: string, roundId: any, roundName: string,
    total: any, agentId: string, agentName: string, firstPay: any, nextDue: string, notes: string,
    inst1?: any, inst2?: any, inst3?: any,
  ) {
    try {
      const tot = parseFloat(total) || 0;
      const paid = parseFloat(firstPay) || 0;
      const cleanRoundId = (roundId || '').toString().trim();
      const cleanName = (clientName || '').toString().trim();
      const finalOc = await this.ensureOcCodeForClient(clientId, clientPhone);

      const active = await this.clientPaymentRepository.find({ where: { isDeleted: false } });
      for (const row of active) {
        const rowOc = (row.clientLegacyId || '').trim();
        const rowRound = (row.roundLegacyId || '').trim();
        // Wait→Round promote: same client sitting in a no-round "Wait" row → update in place, no duplicate
        if (cleanRoundId && !rowRound) {
          const sameClient = (finalOc && rowOc.toLowerCase() === finalOc.toLowerCase()) ||
            (!rowOc && cleanName && (row.clientName || '').trim().toLowerCase() === cleanName.toLowerCase());
          if (sameClient) {
            const rem = Math.max(0, tot - paid);
            row.roundLegacyId = cleanRoundId;
            row.roundName = roundName || '';
            row.totalAmount = tot;
            row.amountPaid = paid;
            row.amountUnpaid = rem;
            row.status = rem <= 0 ? 'Paid' : 'Installment';
            if (finalOc && !rowOc) row.clientLegacyId = finalOc;
            row.lastModified = new Date();
            await this.clientPaymentRepository.save(row);
            return { success: true, message: '✅ تم تحويل حجز الانتظار إلى راوند (بدون تكرار)', payId: row.legacyId || row.id, promoted: true };
          }
        }
        // Strong dedup: same OC + same round
        if (finalOc && rowOc.toLowerCase() === finalOc.toLowerCase() && rowRound === cleanRoundId) {
          return { success: true, message: '✅ الدفعة مسجلة بالفعل', payId: row.legacyId || row.id };
        }
        // Fallback: same name + round (no OC yet)
        if (!rowOc && cleanName && (row.clientName || '').trim().toLowerCase() === cleanName.toLowerCase() && rowRound === cleanRoundId) {
          return { success: true, message: '✅ الدفعة مسجلة بالفعل', payId: row.legacyId || row.id };
        }
        // Double-click guard: same name + same total within 3 minutes
        const created = row.createdAt ? new Date(row.createdAt).getTime() : 0;
        if (cleanName && (row.clientName || '').trim().toLowerCase() === cleanName.toLowerCase() &&
            tot > 0 && Number(row.totalAmount) === tot && created > 0 && Date.now() - created < 3 * 60 * 1000) {
          return { success: true, message: '✅ الدفعة مسجلة بالفعل (تم تجاهل التكرار)', payId: row.legacyId || row.id };
        }
      }

      const rem = Math.max(0, tot - paid);
      const agent = agentId ? await this.userRepository.findOne({ where: { id: agentId } }) : null;
      const round = cleanRoundId ? await this.roundRepository.findOne({ where: [{ legacyId: cleanRoundId }, ...(cleanRoundId.length === 36 ? [{ id: cleanRoundId }] : [])] }) : null;
      const pid = this.genLegacyId();

      const payment = await this.clientPaymentRepository.save({
        legacyId: pid,
        clientLegacyId: finalOc,
        clientName: cleanName,
        course: course || '',
        round: round || null,
        roundLegacyId: cleanRoundId || null,
        roundName: roundName || '',
        totalAmount: tot,
        agent: agent || null,
        agentLegacyId: agent?.legacyId || null,
        agentUsername: agentName || '',
        amountPaid: paid,
        amountUnpaid: rem,
        paymentTime: nextDue ? new Date(nextDue) : null,
        status: rem <= 0 ? 'Paid' : 'Installment',
        notes: notes || '',
        createdAt: new Date(),
        amountDetail1: inst1 !== undefined && inst1 !== '' ? parseFloat(inst1) || 0 : (rem > 0 ? rem : 0),
        amountDetail2: inst2 !== undefined && inst2 !== '' ? parseFloat(inst2) || 0 : 0,
        amountDetail3: inst3 !== undefined && inst3 !== '' ? parseFloat(inst3) || 0 : 0,
        isDeleted: false,
      });

      await this.transactionRepository.save({
        legacyTransactionId: this.genLegacyId(),
        legacyPaymentId: pid,
        payment,
        clientName: cleanName,
        amount: paid,
        date: new Date(),
        type: 'أول دفعة',
        agent: agent || null,
        agentLegacyId: agent?.legacyId || null,
        agentName: agentName || '',
      });

      // 1) Sync to AcademyLedger
      try {
        const resolvedFinAction = cleanRoundId ? 'Round' : 'Wait';
        const isRound = !!cleanRoundId;
        let ledRow = await this.ledgerRepository.findOne({ where: { ocCode: finalOc } });
        if (!ledRow) {
          ledRow = new AcademyLedger();
          ledRow.bookingDate = new Date();
          ledRow.ocCode = finalOc;
        }
        ledRow.clientName = cleanName;
        ledRow.phone = this.normalizePhone(clientPhone || '');
        ledRow.course = course || '';
        ledRow.groupName = isRound ? (roundName || '') : (resolvedFinAction || 'Wait');
        ledRow.status = rem <= 0 ? 'خالص' : 'أقساط';
        ledRow.totalPrice = tot;
        ledRow.paymentMethod = 'Cash';
        ledRow.amountPaid = paid;
        ledRow.amountRemaining = rem;
        ledRow.salesAgentEmail = agent?.email || agent?.username || agentName || '';
        await this.ledgerRepository.save(ledRow);
      } catch (e: any) {
        console.error('Error syncing to academy_ledger in addClientPayment:', e);
      }

      // 2) Sync to RoundMember (if round is provided and they are not in the round member list)
      if (round && cleanRoundId) {
        try {
          const rmExists = await this.roundMemberRepository.findOne({ where: { ocCode: finalOc, round: { id: round.id } } });
          if (!rmExists) {
            await this.roundMemberRepository.save({
              round,
              roundLegacyId: round.legacyId || null,
              ocCode: finalOc || null,
              name: cleanName,
              phone: this.normalizePhone(clientPhone || ''),
              action: 'New',
              price: tot,
              paid: paid,
              method: 'Cash',
              attendance: '',
              agent: agent || null,
              agentLegacyId: agent?.legacyId || null,
              agentName: agentName || '',
              createdAt: new Date(),
            });
            round.enrolled = (round.enrolled || 0) + 1;
            await this.roundRepository.save(round);
          }
        } catch (e) {
          console.error('Error syncing to round_members in addClientPayment:', e);
        }
      }

      // 3) Sync to FinancialClient (for commission tracking)
      try {
        const resolvedFinAction = cleanRoundId ? 'Round' : 'Wait';
        const isRound = !!cleanRoundId;
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
        await this.addFinancialClient(agentId, agentName, new Date().getMonth() + 1, new Date().getFullYear(), {
          action: resolvedFinAction,
          ocCode: finalOc,
          name: cleanName,
          phone: clientPhone,
          course: course || '',
          reservation: todayStr,
          attendance: '',
          roundId: isRound ? cleanRoundId : '',
          roundName: isRound ? roundName : '',
          method: 'Cash',
          price: tot,
          paid: paid,
          offer: 'Cash',
          clientType: 'New',
        });
      } catch (e) {
        console.error('Error syncing to financial_data in addClientPayment:', e);
      }

      await this.logActivity(agentId, agentName, 'ADD_PAYMENT', `${cleanName} - ${tot} EGP`);
      return { success: true, message: '✅ تم تسجيل الدفعة بنجاح', payId: pid };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addInstallment(payId: any, amount: any, agentId: string, agentName: string, nextDue?: string) {
    try {
      const payment = await this.findPaymentByAnyId(payId);
      if (!payment) return { success: false, message: 'السجل غير موجود' };

      const amt = parseFloat(amount) || 0;
      const paid = (Number(payment.amountPaid) || 0) + amt;
      const rem = Math.max(0, (Number(payment.totalAmount) || 0) - paid);
      payment.amountPaid = paid;
      payment.amountUnpaid = rem;
      payment.paymentTime = nextDue ? new Date(nextDue) : null;
      payment.status = rem <= 0 ? 'Paid' : 'Installment';
      payment.lastModified = new Date();
      await this.clientPaymentRepository.save(payment);

      const agent = agentId ? await this.userRepository.findOne({ where: { id: agentId } }) : null;
      await this.transactionRepository.save({
        legacyTransactionId: this.genLegacyId(),
        legacyPaymentId: payment.legacyId || payment.id,
        payment,
        clientName: payment.clientName || '',
        amount: amt,
        date: new Date(),
        type: 'قسط',
        agent: agent || null,
        agentLegacyId: agent?.legacyId || null,
        agentName: agentName || '',
      });

      // Mirror into Financial_Data so monthly sales accounting sees the installment
      try {
        const fullPayment = await this.clientPaymentRepository.findOne({
          where: { id: payment.id },
          relations: { agent: true }
        });
        const origAgent = (fullPayment && fullPayment.agent) || (payment.agentLegacyId ? await this.userRepository.findOne({ where: { legacyId: payment.agentLegacyId } }) : null);

        await this.financialDataRepository.save({
          agent: origAgent || null,
          agentLegacyId: origAgent?.legacyId || payment.agentLegacyId || null,
          agentName: origAgent?.name || payment.agentUsername || '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          type: 'payment',
          action: 'قسط',
          ocCode: payment.clientLegacyId || '',
          clientName: payment.clientName || '',
          paid: amt,
          createdAt: new Date(),
        });
      } catch (err) { /* accounting mirror is best-effort */ }

      await this.logActivity(agentId, agentName, 'INSTALLMENT', `${payment.legacyId || payment.id} - ${amt} EGP`);
      return { success: true, message: '✅ تم تسجيل القسط وتحديث حسابات السيلز' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateClientPayment(
    payId: any, total: any, paid: any, inst1: any, inst2: any, inst3: any,
    nextDue: string, notes: string, roundId: any, roundName: string, expectedLastModified?: string,
  ) {
    try {
      const payment = await this.findPaymentByAnyId(payId);
      if (!payment) return { success: false, message: 'السجل غير موجود' };

      // Optimistic-concurrency guard (same semantics as the sheet's LastModified column)
      if (expectedLastModified && payment.lastModified) {
        const current = new Date(payment.lastModified).toISOString();
        const expected = new Date(expectedLastModified).toISOString();
        if (current !== expected) {
          return { success: false, message: '⚠️ عذراً، تم تعديل بيانات هذا القسط بواسطة مستخدم آخر في نفس الوقت. يرجى تحديث الصفحة والمحاولة مرة أخرى.' };
        }
      }

      const tot = parseFloat(total) || 0;
      const newPaid = parseFloat(paid) || 0;
      const pid = payment.legacyId || payment.id;

      // Keep the transactions ledger consistent with the new paid figure
      const txs = await this.transactionRepository.find({ where: { legacyPaymentId: pid }, order: { date: 'ASC' } });
      const totalFromTxs = txs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      if (newPaid !== totalFromTxs) {
        const diff = newPaid - totalFromTxs;
        if (!txs.length) {
          await this.transactionRepository.save({
            legacyTransactionId: this.genLegacyId(), legacyPaymentId: pid, payment,
            clientName: payment.clientName || '', amount: newPaid, date: new Date(), type: 'أول دفعة', agentName: 'System',
          });
        } else if (diff > 0) {
          await this.transactionRepository.save({
            legacyTransactionId: this.genLegacyId(), legacyPaymentId: pid, payment,
            clientName: payment.clientName || '', amount: diff, date: new Date(), type: 'قسط', agentName: 'System',
          });
        } else {
          const first = txs[0];
          first.amount = Math.max(0, (Number(first.amount) || 0) + diff);
          await this.transactionRepository.save(first);
        }
      }

      const rem = Math.max(0, tot - newPaid);
      payment.totalAmount = tot;
      payment.amountPaid = newPaid;
      payment.amountUnpaid = rem;
      payment.paymentTime = nextDue ? new Date(nextDue) : null;
      payment.status = rem <= 0 ? 'Paid' : 'Installment';
      payment.notes = notes || '';
      payment.roundLegacyId = (roundId || '').toString().trim() || null;
      payment.roundName = roundName || '';
      payment.amountDetail1 = parseFloat(inst1) || 0;
      payment.amountDetail2 = parseFloat(inst2) || 0;
      payment.amountDetail3 = parseFloat(inst3) || 0;
      payment.lastModified = new Date();

      const cleanRoundId = (roundId || '').toString().trim();
      if (cleanRoundId) {
        const round = await this.roundRepository.findOne({ where: [{ legacyId: cleanRoundId }, ...(cleanRoundId.length === 36 ? [{ id: cleanRoundId }] : [])] });
        if (round) {
          payment.round = round;
          // Auto-enroll in Round_Members (skip if this OC is already a member of this round)
          const oc = (payment.clientLegacyId || '').trim();
          if (oc) {
            const existing = await this.roundMemberRepository.findOne({ where: { ocCode: oc, round: { id: round.id } } });
            if (!existing) {
              const rawClient = await this.rawLeadRepository.findOne({ where: { ocCode: oc } });
              await this.roundMemberRepository.save({
                round,
                roundLegacyId: round.legacyId || null,
                ocCode: oc,
                name: payment.clientName || '',
                phone: rawClient?.phone || '',
                action: 'reservation',
                price: tot,
                paid: newPaid,
                agent: payment.agent || null,
                agentLegacyId: payment.agentLegacyId || null,
                agentName: payment.agentUsername || '',
                createdAt: new Date(),
              });
            }
          }
        }
      }

      await this.clientPaymentRepository.save(payment);
      return { success: true, message: '✅ تم تحديث بيانات الدفعة بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteClientPaymentRecord(payId: any, adminId: string, adminName: string) {
    try {
      const payment = await this.findPaymentByAnyId(payId);
      if (!payment) return { success: false, message: 'السجل غير موجود' };
      payment.isDeleted = true;
      payment.deletedBy = adminName || adminId || '';
      payment.deletedAt = new Date();
      payment.lastModified = new Date();
      await this.clientPaymentRepository.save(payment);
      await this.logActivity(adminId, adminName, 'DELETE_PAYMENT', `${payment.clientName} (${payment.legacyId || payment.id})`);
      return { success: true, message: '🗑️ تم حذف سجل الدفع (يمكن استرداده من المحذوفات)' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async restoreClientPaymentRecord(payId: any, adminId: string, adminName: string) {
    try {
      const payment = await this.findPaymentByAnyId(payId);
      if (!payment) return { success: false, message: 'السجل غير موجود' };
      payment.isDeleted = false;
      payment.deletedBy = null;
      payment.deletedAt = null;
      payment.lastModified = new Date();
      await this.clientPaymentRepository.save(payment);
      await this.logActivity(adminId, adminName, 'RESTORE_PAYMENT', `${payment.clientName} (${payment.legacyId || payment.id})`);
      return { success: true, message: '♻️ تم استرداد سجل الدفع' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getDeletedPayments(adminId: string) {
    if (!(await this.isAdminOrManager(adminId))) return [];
    try {
      const rows = await this.clientPaymentRepository.find({ where: { isDeleted: true } });
      return rows.map((p) => ({
        id: p.legacyId || p.id,
        clientName: p.clientName || '',
        course: p.course || '',
        roundName: p.roundName || '',
        total: Number(p.totalAmount) || 0,
        paid: Number(p.amountPaid) || 0,
        deletedBy: p.deletedBy || '',
        deletedAt: p.deletedAt ? new Date(p.deletedAt).toISOString().slice(0, 10) : '',
      }));
    } catch {
      return [];
    }
  }

  async getOverdueInstallments(userId?: string) {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const payments = await this.clientPaymentRepository
        .createQueryBuilder('p')
        .where('p.isDeleted = false')
        .andWhere('p.amountUnpaid > 0')
        .andWhere('p.paymentTime IS NOT NULL AND p.paymentTime < :today', { today })
        .getMany();
      const rows = payments
        .filter((p) => !/^invoice/i.test((p.roundName || '').trim()))
        .map((p) => ({
          name: p.clientName || '',
          course: p.course || p.roundName || '',
          total: Number(p.totalAmount) || 0,
          paid: Number(p.amountPaid) || 0,
          remaining: Number(p.amountUnpaid) || 0,
          nextDue: p.paymentTime ? new Date(p.paymentTime).toISOString().slice(0, 10) : '',
          daysLate: p.paymentTime ? Math.floor((today.getTime() - new Date(p.paymentTime).getTime()) / 86400000) : 0,
          agent: p.agentUsername || '',
          payId: p.legacyId || p.id,
        }))
        .sort((a, b) => b.daysLate - a.daysLate);
      return { success: true, rows, totalOverdue: rows.reduce((s, r) => s + r.remaining, 0) };
    } catch (e: any) {
      return { success: false, rows: [], message: e.message };
    }
  }

  async fixAllClientPaymentCalculations(adminId: string) {
    if (!(await this.isAdminOrManager(adminId))) return { success: false, message: 'غير مصرح' };
    try {
      const rows = await this.clientPaymentRepository.find({ where: { isDeleted: false } });
      let fixed = 0;
      for (const p of rows) {
        const correctRem = Math.max(0, (Number(p.totalAmount) || 0) - (Number(p.amountPaid) || 0));
        const correctStatus = correctRem <= 0 ? 'Paid' : 'Installment';
        if (Number(p.amountUnpaid) !== correctRem || (p.status !== correctStatus && p.status !== 'Wait')) {
          p.amountUnpaid = correctRem;
          if (p.status !== 'Wait') p.status = correctStatus;
          await this.clientPaymentRepository.save(p);
          fixed++;
        }
      }
      return { success: true, fixed, message: `✅ تم فحص ${rows.length} سجل — أُصلح ${fixed}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async fixDuplicatePayIds() {
    return { success: true, message: '✅ غير مطلوب في النظام الجديد — معرفات الدفع فريدة تلقائياً في قاعدة البيانات.' };
  }

  // Invoice/payment-link features were tied to external Google Forms/Sheets — pending a new
  // integration decision from the user (deferred by request).
  async createDirectInvoice() {
    return { success: false, message: 'إصدار الفواتير كان مربوط بجوجل فورم خارجي — محتاج قرار ربط جديد (مؤجل).' };
  }
  async getClientInvoicePdf() {
    return { success: false, message: 'PDF الفواتير كان مربوط بجوجل درايف — محتاج قرار ربط جديد (مؤجل).' };
  }
  async getInvoiceFormUrl() {
    return { success: false, url: '', message: 'فورم الفواتير الخارجي اتلغى — محتاج قرار ربط جديد (مؤجل).' };
  }
  async sendPaymentLink() {
    return { success: false, message: 'روابط الدفع كانت خدمة خارجية — محتاج قرار ربط جديد (مؤجل).' };
  }
  async getPaymentLinks() {
    return { success: true, links: [] };
  }

  // ═══════════════════════════════════════════════════
  // ═══  SALES: ROUNDS & MEMBERS (Group 3) + LECTURER SALARIES (Group 9)  ═══
  // ═══════════════════════════════════════════════════

  private async isManagerOnly(userId: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const role = (user?.role || '').trim().toLowerCase();
    return role === 'manager' || role === 'admin';
  }

  private async findRoundByAnyId(roundId: any): Promise<Round | null> {
    const idStr = (roundId || '').toString().trim();
    if (!idStr) return null;
    return (
      (await this.roundRepository.findOne({ where: { legacyId: idStr } })) ||
      (idStr.length === 36 ? await this.roundRepository.findOne({ where: { id: idStr } }) : null)
    );
  }

  async addRound(name: string, startDate: string, schedule: string, maxSeats: any, type: string, status: string, instructor: string) {
    try {
      const newId = this.genLegacyId();
      const round = await this.roundRepository.save({
        legacyId: newId,
        name,
        startDate: startDate ? new Date(startDate) : null,
        schedule: schedule || '',
        maxSeats: parseInt(maxSeats) || 15,
        enrolled: 0,
        status: status || 'Active',
        type: type || 'Online',
        instructorName: (instructor || '').trim(),
      });
      const inst = (instructor || '').trim();
      if (inst) {
        await this.lecturerSalaryRepository.save({
          legacyId: this.genLegacyId(),
          round,
          roundLegacyId: newId,
          roundName: name,
          roundType: type || 'Online',
          instructorName: inst,
          pay1Status: 'pending',
          pay2Status: 'pending',
          alert1Triggered: false,
          alert2Triggered: false,
          createdAt: new Date(),
        });
      }
      return { success: true, message: '✅ تم إنشاء الراوند بنجاح', roundId: newId };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateRound(roundId: any, name: string, startDate: string, schedule: string, maxSeats: any, status: string, type: string, instructor?: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };

      round.name = name;
      round.startDate = startDate ? new Date(startDate) : round.startDate;
      round.schedule = schedule || '';
      round.maxSeats = parseInt(maxSeats) || 15;
      round.status = status || 'Active';
      round.type = type || 'Online';
      if (instructor !== undefined) round.instructorName = (instructor || '').trim();
      await this.roundRepository.save(round);

      // Propagate the new name to payments referencing this round
      await this.clientPaymentRepository
        .createQueryBuilder()
        .update()
        .set({ roundName: name })
        .where('round_id = :rid OR roundLegacyId = :lid', { rid: round.id, lid: round.legacyId || '' })
        .execute();

      // Sync (or create) the lecturer salary card
      const sal = await this.lecturerSalaryRepository.findOne({ where: [{ round: { id: round.id } }, { roundLegacyId: round.legacyId || '' }] });
      if (sal) {
        sal.roundName = name;
        sal.roundType = type || 'Online';
        if (instructor !== undefined) sal.instructorName = (instructor || '').trim();
        await this.lecturerSalaryRepository.save(sal);
      } else if ((instructor || '').trim()) {
        await this.lecturerSalaryRepository.save({
          legacyId: this.genLegacyId(), round, roundLegacyId: round.legacyId,
          roundName: name, roundType: type || 'Online', instructorName: (instructor || '').trim(),
          pay1Status: 'pending', pay2Status: 'pending', alert1Triggered: false, alert2Triggered: false, createdAt: new Date(),
        });
      }
      return { success: true, message: '✅ تم تعديل الراوند بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteRound(roundId: any, adminId: string, adminName: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };
      round.status = 'Deleted';
      round.deletedBy = adminName || adminId || 'Unknown';
      round.deletedAt = new Date();
      await this.roundRepository.save(round);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async restoreRound(roundId: any, adminId: string, adminName: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };
      round.status = 'Active';
      round.deletedBy = null;
      round.deletedAt = null;
      await this.roundRepository.save(round);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getDeletedRounds(adminId: string) {
    try {
      const rounds = await this.roundRepository.find({ where: { status: 'Deleted' } });
      return rounds.map((r) => ({
        id: r.legacyId || r.id,
        name: r.name || '',
        startDate: r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : '',
        type: r.type || 'Online',
        instructor: r.instructorName || '',
        deletedBy: r.deletedBy || '',
        deletedAt: r.deletedAt ? new Date(r.deletedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
      }));
    } catch {
      return [];
    }
  }

  async toggleRoundStatusDirectly(roundId: any, newStatus: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };
      round.status = newStatus || 'Active';
      await this.roundRepository.save(round);
      return { success: true, message: '✅ تم تحديث حالة الراوند بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async setRoundOffer(roundId: any, offerPrice: any, offerExpiry: string, adminId: string) {
    if (!(await this.isManagerOnly(adminId))) return { success: false, message: 'غير مصرح.' };
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند مش موجود.' };
      const price = parseFloat(offerPrice) || 0;
      round.offerPrice = price;
      round.offerExpiry = offerExpiry ? new Date(offerExpiry) : null;
      await this.roundRepository.save(round);
      return { success: true, message: price > 0 ? `✅ اتسجّل العرض بسعر ${price.toLocaleString()} ج.م` : '✅ اتشال العرض من الراوند ده' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addRoundMember(roundId: any, memberData: any) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };

      const finalOc = await this.ensureOcCodeForClient(memberData.ocCode || '', memberData.phone || '');
      if (finalOc) {
        const existing = await this.roundMemberRepository.findOne({ where: { ocCode: finalOc, round: { id: round.id } } });
        if (existing) return { success: true, message: '✅ العميل مسجل في هذا الراوند بالفعل' };
      }

      const agent = memberData.agentId ? await this.userRepository.findOne({ where: { id: memberData.agentId } }) : null;
      const price = parseFloat(memberData.price) || 0;
      const paid = parseFloat(memberData.paid) || 0;

      await this.roundMemberRepository.save({
        round,
        roundLegacyId: round.legacyId || null,
        ocCode: finalOc || null,
        name: memberData.name || '',
        phone: this.normalizePhone(memberData.phone || ''),
        action: memberData.action || 'New',
        price,
        paid,
        method: memberData.method || 'Cash',
        attendance: memberData.attendance || '',
        agent: agent || null,
        agentLegacyId: agent?.legacyId || null,
        agentName: memberData.agentName || '',
        createdAt: new Date(),
      });

      round.enrolled = (round.enrolled || 0) + 1;
      await this.roundRepository.save(round);

      // Sync/create the payment record for this member
      const rem = Math.max(0, price - paid);
      const pay = finalOc ? await this.clientPaymentRepository.findOne({ where: { clientLegacyId: finalOc, isDeleted: false } }) : null;
      if (pay) {
        pay.round = round;
        pay.roundLegacyId = round.legacyId || null;
        pay.roundName = round.name || '';
        pay.totalAmount = price;
        pay.amountPaid = paid;
        pay.amountUnpaid = rem;
        pay.paymentTime = memberData.nextDueDate ? new Date(memberData.nextDueDate) : pay.paymentTime;
        pay.status = rem <= 0 ? 'Paid' : 'Installment';
        pay.amountDetail1 = rem > 0 ? parseFloat(memberData.inst1) || paid : price;
        pay.amountDetail2 = rem > 0 ? parseFloat(memberData.inst2) || 0 : 0;
        pay.amountDetail3 = rem > 0 ? parseFloat(memberData.inst3) || 0 : 0;
        pay.lastModified = new Date();
        await this.clientPaymentRepository.save(pay);
      } else {
        await this.addClientPayment(
          finalOc, memberData.name, memberData.phone || '', memberData.course || '', round.legacyId || round.id, round.name,
          price, memberData.agentId, memberData.agentName, paid, memberData.nextDueDate, '',
          memberData.inst1, memberData.inst2, memberData.inst3,
        );
      }

      await this.logActivity(memberData.agentId, memberData.agentName, 'ADD_ROUND_MEMBER', `${memberData.name} → ${round.name}`);
      return { success: true, message: '✅ تم تسجيل العميل في الراوند بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async removeRoundMember(roundId: any, ocCode: string, clientName: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };

      const member = await this.roundMemberRepository.findOne({
        where: ocCode
          ? { ocCode: ocCode.trim(), round: { id: round.id } }
          : { name: (clientName || '').trim(), round: { id: round.id } },
      });
      if (!member) return { success: false, message: 'لم يتم العثور على العميل في هذا الراوند' };

      await this.roundMemberRepository.remove(member);
      round.enrolled = Math.max(0, (round.enrolled || 0) - 1);
      await this.roundRepository.save(round);

      // Move the client back to the waiting list in payments + financial data
      if (ocCode) {
        const pay = await this.clientPaymentRepository.findOne({ where: { clientLegacyId: ocCode.trim(), isDeleted: false } });
        if (pay) {
          pay.round = null;
          pay.roundLegacyId = null;
          pay.roundName = 'Wait';
          pay.lastModified = new Date();
          await this.clientPaymentRepository.save(pay);
        }
        await this.financialDataRepository
          .createQueryBuilder()
          .update()
          .set({ action: 'Wait' })
          .where('ocCode = :oc', { oc: ocCode.trim() })
          .execute();
      }

      return { success: true, message: '✅ تم إزالة العميل من الراوند وإعادته لقائمة الانتظار بنجاح.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateRoundMemberDetails(roundId: any, ocCode: string, clientName: string, price: any, paid: any, method: string, attendance: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };
      const member = await this.roundMemberRepository.findOne({ where: { ocCode: (ocCode || '').trim(), round: { id: round.id } } });
      if (!member) return { success: false, message: 'لم يتم العثور على سجل العميل في هذا الراوند.' };

      const pr = parseFloat(price) || 0;
      const pd = parseFloat(paid) || 0;
      member.price = pr;
      member.paid = pd;
      member.method = method || '';
      member.attendance = attendance || '';
      await this.roundMemberRepository.save(member);

      const pay = await this.clientPaymentRepository.findOne({ where: { clientLegacyId: (ocCode || '').trim(), isDeleted: false } });
      if (pay) {
        const rem = Math.max(0, pr - pd);
        pay.totalAmount = pr;
        pay.amountPaid = pd;
        pay.amountUnpaid = rem;
        pay.status = rem <= 0 ? 'Paid' : 'Installment';
        pay.lastModified = new Date();
        await this.clientPaymentRepository.save(pay);

        // Financial_Data: scope to this payment's course when the client has rows for several courses
        const fdRows = await this.financialDataRepository.find({ where: { ocCode: (ocCode || '').trim() } });
        const course = (pay.course || '').trim().toLowerCase();
        let targets = fdRows;
        if (fdRows.length > 1 && course) {
          const scoped = fdRows.filter((r) => (r.course || '').trim().toLowerCase() === course);
          targets = scoped.length ? scoped : [];
        }
        for (const fd of targets) {
          fd.paymentMethod = method || '';
          fd.price = pr;
          fd.paid = pd;
          if (attendance) fd.attendance = new Date(attendance);
          await this.financialDataRepository.save(fd);
        }
      }
      return { success: true, message: '✅ تم تحديث بيانات العميل في الراوند' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async syncRoundToAcademy(roundId: any, instructorTag?: string, accessMode?: string, freeN?: any) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'مفيش Round ID' };

      // Candidates = this round's members (the DB equivalent of the Client_Payments/Financial_Data scan)
      const members = await this.roundMemberRepository.find({ where: { round: { id: round.id } } });
      if (!members.length) return { success: false, message: 'مفيش عملاء مسجلين في الراوند ده' };

      let added = 0, alreadyEnrolled = 0, skipped = 0;
      const createdStudents: any[] = [];

      for (const m of members) {
        const name = (m.name || '').trim();
        if (!name) { skipped++; continue; }
        const phone = this.normalizePhone(m.phone || '');

        // Find or create the student account (Check phone OR ocCode to prevent duplicates)
        let student = phone ? await this.studentRepository.findOne({ where: { phone } }) : null;
        if (!student && m.ocCode) {
          student = await this.studentRepository.findOne({ where: { ocCode: m.ocCode } });
        }

        if (!student) {
          // Generate unique username based on transliterated name
          const baseUname = this.transliterateArabicToEnglish(name);
          let uname = baseUname + '@bsa';
          let counter = 1;
          while (await this.studentRepository.findOne({ where: { email: uname } })) {
            uname = `${baseUname}${counter}@bsa`;
            counter++;
          }

          // Generate random 4-digit code for password
          const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
          const pass = `BSA_${randomDigits}`;

          student = await this.studentRepository.save({
            legacyId: 'STU_' + Date.now() + '_' + added,
            name,
            email: uname,
            password: pass,
            phone: phone || null,
            active: true,
            ocCode: m.ocCode || null,
            instructorTag: (instructorTag || '').trim() || null,
            accessMode: (accessMode || 'sequential').trim(),
          });
          createdStudents.push({ name, username: uname, password: pass });
        } else {
          student.ocCode = m.ocCode || student.ocCode || null;
          student.instructorTag = (instructorTag || '').trim() || null;
          student.accessMode = (accessMode || 'sequential').trim();
          await this.studentRepository.save(student);
        }

        const enrolled = await this.enrollmentRepository.findOne({ where: { student: { id: student.id }, round: { id: round.id } } });
        if (enrolled && enrolled.status !== 'removed') { alreadyEnrolled++; continue; }
        if (enrolled) {
          enrolled.status = 'active';
          await this.enrollmentRepository.save(enrolled);
        } else {
          await this.enrollmentRepository.save({
            legacyId: this.genLegacyId(),
            student,
            studentLegacyId: student.legacyId || null,
            round,
            roundLegacyId: round.legacyId || null,
            roundName: round.name || '',
            enrolledAt: new Date(),
            status: 'active',
          });
        }
        added++;
      }

      return {
        success: true, added, alreadyEnrolled, skipped, createdStudents,
        message: `✅ تم مزامنة الراوند مع الأكاديمية — سُجّل ${added} طالب` +
          (createdStudents.length ? ` (منهم ${createdStudents.length} حساب جديد بتنسيق username: XXXXX@bsa و password: BSA_XXXX)` : '') +
          (alreadyEnrolled ? ` | ${alreadyEnrolled} مسجل بالفعل` : ''),
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getLecturerSalaries() {
    try {
      const rows = await this.lecturerSalaryRepository.find({ order: { createdAt: 'DESC' } });
      return rows.map((s) => ({
        id: s.legacyId || s.id,
        roundId: s.roundLegacyId || '',
        roundName: s.roundName || '',
        roundType: s.roundType || 'Online',
        instructor: s.instructorName || '',
        pay1Amount: s.pay1Amount != null ? String(s.pay1Amount) : '',
        pay1Status: s.pay1Status || 'pending',
        pay1Date: s.pay1PaidDate ? new Date(s.pay1PaidDate).toISOString().slice(0, 10) : '',
        pay2Amount: s.pay2Amount != null ? String(s.pay2Amount) : '',
        pay2Status: s.pay2Status || 'pending',
        pay2Date: s.pay2PaidDate ? new Date(s.pay2PaidDate).toISOString().slice(0, 10) : '',
        alert1: !!s.alert1Triggered,
        alert2: !!s.alert2Triggered,
        notes: s.notes || '',
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '',
      }));
    } catch {
      return [];
    }
  }

  async updateLecturerSalaryPayment(data: any) {
    try {
      const idStr = (data?.id || '').toString().trim();
      const sal = (await this.lecturerSalaryRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.lecturerSalaryRepository.findOne({ where: { id: idStr } }) : null);
      if (!sal) return { success: false, message: 'السجل غير موجود' };
      if (data.instructor !== undefined) sal.instructorName = data.instructor;
      if (data.pay1Amount !== undefined) sal.pay1Amount = parseFloat(data.pay1Amount) || null;
      if (data.pay1Status !== undefined) sal.pay1Status = data.pay1Status;
      if (data.pay1Date !== undefined) sal.pay1PaidDate = data.pay1Date ? new Date(data.pay1Date) : null;
      if (data.pay2Amount !== undefined) sal.pay2Amount = parseFloat(data.pay2Amount) || null;
      if (data.pay2Status !== undefined) sal.pay2Status = data.pay2Status;
      if (data.pay2Date !== undefined) sal.pay2PaidDate = data.pay2Date ? new Date(data.pay2Date) : null;
      if (data.clearAlert1 === true) sal.alert1Triggered = false;
      if (data.clearAlert2 === true) sal.alert2Triggered = false;
      if (data.notes !== undefined) sal.notes = data.notes;
      await this.lecturerSalaryRepository.save(sal);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteLecturerSalary(id: any) {
    try {
      const idStr = (id || '').toString().trim();
      const sal = (await this.lecturerSalaryRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.lecturerSalaryRepository.findOne({ where: { id: idStr } }) : null);
      if (!sal) return { success: false, message: 'السجل غير موجود' };
      await this.lecturerSalaryRepository.remove(sal);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addLecturerSalaryManual(data: any) {
    try {
      const round = data.roundId ? await this.findRoundByAnyId(data.roundId) : null;
      await this.lecturerSalaryRepository.save({
        legacyId: this.genLegacyId(),
        round: round || null,
        roundLegacyId: (data.roundId || '').toString() || null,
        roundName: data.roundName || '',
        roundType: data.roundType || 'Online',
        instructorName: data.instructor || '',
        pay1Amount: data.pay1Amount !== undefined && data.pay1Amount !== '' ? parseFloat(data.pay1Amount) || null : null,
        pay1Status: 'pending',
        pay2Amount: data.pay2Amount !== undefined && data.pay2Amount !== '' ? parseFloat(data.pay2Amount) || null : null,
        pay2Status: 'pending',
        alert1Triggered: false,
        alert2Triggered: false,
        notes: data.notes || '',
        createdAt: new Date(),
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  SALES: AGENT DISTRIBUTION (Group 4)  ═══
  // ═══════════════════════════════════════════════════

  async getAgentNames() {
    try {
      const users = await this.userRepository.find({ where: { active: true } });
      return { success: true, names: users.map((u) => u.name) };
    } catch {
      return { success: true, names: [] };
    }
  }

  // The old row/column "ranges" are obsolete — distribution is now by agent name on each fresh lead.
  // The settings page still calls these; return the sales agents as the current "config".
  async getAgentRangesConfig() {
    try {
      const users = await this.userRepository.find({ where: { active: true } });
      const ranges = users
        .filter((u) => (u.role || '').trim().toLowerCase() === 'sales')
        .map((u) => ({ key: u.name, startRow: 0, endRow: 0, startCol: 0, note: 'توزيع مباشر بالاسم — مفيش رينجات في النظام الجديد' }));
      return { success: true, ranges };
    } catch {
      return { success: true, ranges: [] };
    }
  }

  async setAgentRange() {
    return { success: true, message: '✅ النظام الجديد مش محتاج رينجات — وزّع الفريش بالاسم مباشرة من صفحة التوزيع.' };
  }

  async deleteAgentRange() {
    return { success: true, message: '✅ النظام الجديد مش محتاج رينجات.' };
  }

  async repairAgentIds(adminId: string) {
    if (!(await this.isAdminOrManager(adminId))) return { success: false, message: 'غير مصرح.' };
    // Referential integrity is DB-enforced now (foreign keys) — stale/phantom agent ids can't exist.
    return { success: true, fixed: 0, unresolved: 0, message: '✅ غير مطلوب في النظام الجديد — معرفات الموظفين محمية بقاعدة البيانات.' };
  }

  // Re-check fresh leads marked "duplicate": release any that aren't actually owned by another agent.
  async repairFreshDuplicateMarksRange(daysBack?: any) {
    try {
      const n = parseInt(daysBack) || 7;
      const since = new Date(); since.setDate(since.getDate() - n);
      const marked = await this.freshLeadRepository
        .createQueryBuilder('fl')
        .where("fl.status = 'duplicate'")
        .andWhere('fl.createdAt >= :since', { since })
        .getMany();
      let fixed = 0, keptAsReal = 0;
      const keptDetails: any[] = [];
      for (const fl of marked) {
        const raw = await this.rawLeadRepository.findOne({ where: { phone: fl.phone }, relations: { agent: true } });
        const my = await this.myLeadRepository.findOne({ where: { phone: fl.phone }, relations: { agent: true } });
        const owner = raw?.agent?.name || my?.agent?.name || '';
        const genuinelyOwned = owner && owner !== 'المدير' && owner !== fl.targetAgentName;
        if (!genuinelyOwned) {
          fl.status = 'available';
          fl.duplicateNote = null;
          await this.freshLeadRepository.save(fl);
          fixed++;
        } else {
          keptAsReal++;
          keptDetails.push({ phone: fl.phone, name: fl.name || '', inRangeOf: fl.targetAgentName || 'عام', ownedBy: owner, markText: fl.duplicateNote || '' });
        }
      }
      return {
        success: true, fixed, keptAsReal, tabsChecked: n, keptDetails,
        message: `✅ فُحص آخر ${n} يوم — أُعيد إتاحة ${fixed} ليد كان معلّم بالغلط، وتُرك ${keptAsReal} تكرار حقيقي.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  SETTINGS / ATTENDANCE / TASKS / USERS (Groups 10, 12, 14, 15)  ═══
  // ═══════════════════════════════════════════════════

  private async getSettingValue(key: string): Promise<string | null> {
    const row = await this.settingRepository.findOne({ where: { key } });
    return row?.value ?? null;
  }

  private async setSettingValue(key: string, value: string) {
    await this.settingRepository.save({ key, value });
  }

  // Legacy shape: returns the raw stored value (or the given default) — the settings UI
  // pipes this straight into inputs, so returning an object rendered "[object Object]".
  async getSystemSetting(key: string, defaultValue?: any) {
    try {
      const value = await this.getSettingValue((key || '').toString());
      return value !== null && value !== undefined ? value : (defaultValue ?? '');
    } catch {
      return defaultValue ?? '';
    }
  }

  async saveSystemSetting(key: string, value: any) {
    try {
      await this.setSettingValue((key || '').toString(), typeof value === 'string' ? value : JSON.stringify(value));
      return { success: true, message: '✅ تم الحفظ' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getAttendanceData(roundId: any) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return [];
      // مطابقة التليفون لازم تطابق الفرونت (_np): أرقام فقط + شيل الأصفار البادئة.
      // normalizePhone بيسيب الصفر البادئ فيفشل التطابق ويطلع الجدول فاضي.
      const attNorm = (p: any) => (p || '').toString().replace(/\D/g, '').replace(/^0+/, '');
      const records = await this.attendanceRepository.find({ where: { round: { id: round.id } } });
      const attendance: any[] = records.map((r) => ({
        phone: r.studentPhone || '',
        phoneNorm: attNorm(r.studentPhone || ''),
        name: r.studentName || '',
        attended: r.attendedList || [],
        tasks: r.tasksList || [],
        portalTasks: [] as string[],
      }));

      // PORTAL-TASK LINK: علّم تاسك المحاضرة تلقائياً لو الطالب عدّاه على بورتال
      // الأكاديمي (Academy_Tasks معتمدة). الربط: عضو الراوند بالتليفون → OC →
      // طالب أكاديمي (بالـOC) → تاسكاته المعتمدة → رقم المحاضرة (lectureOrder).
      // best-effort: أي فشل يسيب البيانات اليدوية زي ما هي.
      try {
        const ocKey = (v: any) => (v || '').toString().trim().toUpperCase();

        // studentId/legacyId → مجموعة أرقام المحاضرات اللي اتعملت تاسكاتها بنجاح
        const approvedTasks = await this.academyTaskRepository.find({
          where: [
            { status: 'approved' },
            { status: 'pending' }
          ],
          relations: { student: true, lecture: true },
        });
        const doneByStudent: Record<string, Set<number>> = {};
        for (const t of approvedTasks) {
          const num = t.lecture?.lectureOrder;
          if (!num) continue;
          for (const key of [t.student?.id, t.studentLegacyId]) {
            if (!key) continue;
            (doneByStudent[key] = doneByStudent[key] || new Set()).add(num);
          }
        }

        // OC → معرّف الطالب
        const students = await this.studentRepository.find();
        const sidByOc: Record<string, { id: string; legacy: string }> = {};
        for (const s of students) {
          const k = ocKey(s.ocCode);
          if (k) sidByOc[k] = { id: s.id, legacy: s.legacyId };
        }

        const recByPhone: Record<string, any> = {};
        for (const a of attendance) recByPhone[a.phoneNorm] = a;

        const members = await this.roundMemberRepository.find({ where: { round: { id: round.id } } });
        for (const m of members) {
          const np = attNorm(m.phone || '');
          const sinfo = sidByOc[ocKey(m.ocCode)];
          if (!np || !sinfo) continue;
          const nums = doneByStudent[sinfo.id] || doneByStudent[sinfo.legacy];
          if (!nums) continue;
          let rec = recByPhone[np];
          if (!rec) {
            rec = { phone: (m.phone || '').trim(), phoneNorm: np, name: m.name || '', attended: [], tasks: [], portalTasks: [] };
            attendance.push(rec);
            recByPhone[np] = rec;
          }
          if (!rec.portalTasks) rec.portalTasks = [];
          for (const num of nums) {
            const k = String(num);
            if (rec.tasks.indexOf(k) === -1) rec.tasks.push(k);          // علّم التاسك
            if (rec.portalTasks.indexOf(k) === -1) rec.portalTasks.push(k); // مصدره البورتال
          }
          rec.tasks.sort((a: string, b: string) => parseInt(a) - parseInt(b));
        }
      } catch { /* دمج البورتال best-effort — منكسرش تحميل الحضور */ }

      return attendance;
    } catch {
      return [];
    }
  }

  async saveAttendanceData(roundId: any, phone: string, name: string, lectureNum: any, type: string, status: boolean) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, message: 'الراوند غير موجودة' };
      const normPhone = this.normalizePhone(phone);
      const lec = (lectureNum || '').toString().trim();

      let record = (await this.attendanceRepository.find({ where: { round: { id: round.id } } }))
        .find((r) => this.normalizePhone(r.studentPhone || '') === normPhone);

      if (!record) {
        record = this.attendanceRepository.create({
          round,
          roundLegacyId: round.legacyId || null,
          studentPhone: phone,
          studentName: name,
          attendedList: type === 'attendance' && status ? [lec] : [],
          tasksList: type === 'task' && status ? [lec] : [],
          lastUpdated: new Date(),
        });
      } else {
        const list = type === 'attendance' ? (record.attendedList || []) : (record.tasksList || []);
        const idx = list.indexOf(lec);
        if (status && idx === -1) list.push(lec);
        if (!status && idx !== -1) list.splice(idx, 1);
        list.sort((a, b) => parseInt(a) - parseInt(b));
        if (type === 'attendance') record.attendedList = list;
        else record.tasksList = list;
        record.lastUpdated = new Date();
      }
      await this.attendanceRepository.save(record);

      // Salary alert: notify one lecture before the payment lecture (Offline pay@5&10, Online pay@6&12)
      if (status) {
        try {
          const all = await this.attendanceRepository.find({ where: { round: { id: round.id } } });
          let currentLec = 0;
          for (const r of all) for (const n of r.attendedList || []) {
            const v = parseInt(n); if (!isNaN(v) && v > currentLec) currentLec = v;
          }
          const isOffline = (round.type || '').toLowerCase().includes('offline');
          const alert1Lec = isOffline ? 4 : 5, alert2Lec = isOffline ? 9 : 11;
          const paymentNum = currentLec === alert1Lec ? 1 : currentLec === alert2Lec ? 2 : 0;
          if (paymentNum) {
            const sal = await this.lecturerSalaryRepository.findOne({ where: [{ round: { id: round.id } }, { roundLegacyId: round.legacyId || '' }] });
            if (sal && !(paymentNum === 1 ? sal.alert1Triggered : sal.alert2Triggered)) {
              if (paymentNum === 1) sal.alert1Triggered = true; else sal.alert2Triggered = true;
              await this.lecturerSalaryRepository.save(sal);
              return {
                success: true,
                salaryAlert: {
                  roundId: round.legacyId || round.id,
                  roundName: sal.roundName || round.name,
                  instructor: sal.instructorName || '',
                  paymentNum,
                  currentLec,
                  nextPayLec: paymentNum === 1 ? (isOffline ? 5 : 6) : (isOffline ? 10 : 12),
                  pay1Amount: sal.pay1Amount != null ? String(sal.pay1Amount) : '',
                  pay2Amount: sal.pay2Amount != null ? String(sal.pay2Amount) : '',
                  salaryId: sal.legacyId || sal.id,
                },
              };
            }
          }
        } catch { /* alert is best-effort */ }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async openAttendanceSession(userId: string, roundId: any, lectureNum: any) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || !user.active) return { success: false, message: 'غير مصرح' };
      const sessions = JSON.parse((await this.getSettingValue('att_sessions')) || '{}');
      const key = (roundId || '').toString().trim();
      sessions[key] = { roundId: key, lectureNum: parseInt(lectureNum) || 1, openedAt: Date.now(), openedBy: user.name };
      await this.setSettingValue('att_sessions', JSON.stringify(sessions));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async closeAttendanceSession(userId: string, roundId: any) {
    try {
      const sessions = JSON.parse((await this.getSettingValue('att_sessions')) || '{}');
      delete sessions[(roundId || '').toString().trim()];
      await this.setSettingValue('att_sessions', JSON.stringify(sessions));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getActiveSessions(userId: string) {
    try {
      const sessions = JSON.parse((await this.getSettingValue('att_sessions')) || '{}');
      return Object.values(sessions);
    } catch {
      return [];
    }
  }

  async getTasks(agentId: string) {
    try {
      const isAdmin = await this.isAdminOrManager(agentId);
      const tasks = await this.taskRepository.find({ order: { time: 'DESC' } });
      const users = isAdmin ? await this.userRepository.find() : [];
      const nameById = new Map(users.map((u) => [u.id, u.name]));
      return tasks
        .filter((t) => t.status !== 'Done' && t.status !== 'Completed' && (isAdmin || (t.agentId || '') === agentId))
        .map((t) => ({
          id: t.id,
          task: (t.note || '') + (isAdmin && t.agentId ? ` (${nameById.get(t.agentId) || 'غير محدد'})` : ''),
          priority: t.priority || 'normal',
        }));
    } catch {
      return [];
    }
  }

  async addTask(text: string, priority: string, agentId: string) {
    try {
      if (!text) return false;
      await this.taskRepository.save({
        legacyId: this.genLegacyId(),
        note: text,
        status: 'Open',
        priority: priority || 'normal',
        agentId: agentId || null,
        time: new Date(),
      });
      return true;
    } catch {
      return false;
    }
  }

  async getActivityLog(limit?: number) {
    try {
      const rows = await this.activityLogRepository.find({ order: { date: 'DESC' }, take: limit || 100 });
      return rows.map((r) => ({
        date: r.date ? new Date(r.date).toISOString().replace('T', ' ').slice(0, 19) : '',
        agentName: r.name || '',
        action: r.status || '',
        details: r.notes || '',
      }));
    } catch {
      return [];
    }
  }

  async getLatestCelebration() {
    try {
      const latest = await this.celebrationRepository.findOne({ where: { seen: false }, order: { timestamp: 'DESC' } });
      if (!latest) return null;
      latest.seen = true;
      await this.celebrationRepository.save(latest);
      return { agentName: latest.agentName || '' };
    } catch {
      return null;
    }
  }

  getPages() {
    return [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'pull-fresh', label: 'سحب فريش' },
      { id: 'pull-recycle', label: 'ريسيكل' },
      { id: 'add-manual', label: 'إضافة يدوي' },
      { id: 'log-call', label: 'تسجيل مكالمة' },
      { id: 'search', label: 'البحث' },
      { id: 'followups', label: 'Follow Ups' },
      { id: 'my-leads', label: 'عملائي' },
      { id: 'waiting-list', label: 'قائمة الانتظار' },
      { id: 'tasks', label: 'المهام' },
      { id: 'payments', label: 'Client Payments' },
      { id: 'rounds', label: 'الروندات' },
      { id: 'attendance', label: 'الحضور والتاسكات' },
      { id: 'invoice', label: 'الفواتير' },
      { id: 'reports', label: 'تقارير الأداء' },
      { id: 'financial', label: 'الكوميشن الشهري' },
      { id: 'payment-gateway', label: 'بوابة الدفع' },
      { id: 'admin-users', label: 'إدارة المستخدمين' },
      { id: 'admin-leads', label: 'كل الليدات' },
      { id: 'admin-settings', label: 'الإعدادات' },
      { id: 'admin-log', label: 'سجل النشاط' },
      { id: 'academy-ledger', label: 'دفتر الحسابات الرئيسي' },
      { id: 'fresh-lead-manual', label: 'تنزيل ليد فريش' },
      { id: 'academy-mgmt', label: 'إدارة الأكاديمية' },
    ];
  }

  async addUser(name: string, username: string, password: string, role: string, pages: any, agentKey?: string) {
    try {
      const uname = (username || '').trim();
      const existing = await this.userRepository.findOne({ where: { username: uname } });
      if (existing) return { success: false, message: 'اسم المستخدم موجود بالفعل' };
      await this.userRepository.save({
        legacyId: this.genLegacyId(),
        name,
        username: uname,
        password: await bcrypt.hash((password || '').trim(), 10),
        role: role || 'Sales',
        active: true,
        permissions: Array.isArray(pages) ? pages : (pages ? String(pages).split(',') : []),
      });
      return { success: true, message: '✅ تم إضافة المستخدم' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateUserPages(userId: string, pages: any) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) return { success: false, message: 'المستخدم غير موجود' };
      user.permissions = Array.isArray(pages) ? pages : (pages ? String(pages).split(',') : []);
      await this.userRepository.save(user);
      return { success: true, message: '✅ تم تحديث الصلاحيات بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getBatchCredentials(roundId: any) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return { success: false, credentials: [], message: 'الراوند غير موجودة' };
      const enrollments = await this.enrollmentRepository.find({ where: { round: { id: round.id } }, relations: { student: true } });
      const credentials = enrollments
        .filter((e) => e.student && e.status !== 'removed')
        .map((e) => ({
          name: e.student.name || '',
          username: e.student.email || '',
          phone: e.student.phone || '',
          note: 'الباسورد الافتراضي = رقم الموبايل (لو الحساب اتعمل بالمزامنة)',
        }));
      return { success: true, credentials, roundName: round.name };
    } catch (e: any) {
      return { success: false, credentials: [], message: e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  ACCOUNTING & WALLETS (Group 5) + CAMPAIGN/PLATFORM LISTS (Group 6 partial)  ═══
  // ═══════════════════════════════════════════════════

  private async validUser(userId: string): Promise<User | null> {
    if (!userId) return null;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user && user.active ? user : null;
  }

  private fmtDate(d: Date | null): string {
    return d ? new Date(d).toISOString().slice(0, 10) : '';
  }

  async getWallets(userId: string) {
    try {
      if (!(await this.validUser(userId))) return { success: false, message: 'غير مصرح' };
      const rows = await this.walletRepository.find();
      return {
        success: true,
        wallets: rows
          .filter((w) => (w.walletName || '').trim())
          .map((w) => ({
            name: w.walletName.trim(),
            balance: Number(w.balance) || 0,
            adjDate: this.fmtDate(w.adjDate),
            savedAt: this.fmtDate(w.savedAt),
          })),
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async setWalletBalance(userId: string, walletName: string, newBalance: any) {
    try {
      if (!(await this.validUser(userId))) return { success: false, message: 'غير مصرح' };
      const bal = parseFloat(newBalance);
      if (isNaN(bal)) return { success: false, message: 'الرصيد غير صحيح' };
      let wallet = await this.walletRepository.findOne({ where: { walletName: (walletName || '').trim() } });
      if (!wallet) {
        wallet = this.walletRepository.create({ walletName: (walletName || '').trim() });
      }
      wallet.balance = bal;
      wallet.adjDate = new Date();
      wallet.savedAt = new Date();
      await this.walletRepository.save(wallet);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async transferWalletFunds(userId: string, fromWallet: string, toWallet: string, amount: any, notes?: string) {
    try {
      const user = await this.validUser(userId);
      if (!user) return { success: false, message: 'غير مصرح' };
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
      if ((fromWallet || '').trim() === (toWallet || '').trim()) return { success: false, message: 'لا يمكن التحويل لنفس المحفظة' };

      const from = await this.walletRepository.findOne({ where: { walletName: (fromWallet || '').trim() } });
      const to = await this.walletRepository.findOne({ where: { walletName: (toWallet || '').trim() } });
      if (!from) return { success: false, message: 'المحفظة المصدر غير موجودة' };
      if (!to) return { success: false, message: 'المحفظة الهدف غير موجودة' };
      const fromBal = Number(from.balance) || 0;
      const toBal = Number(to.balance) || 0;
      if (fromBal < amt) return { success: false, message: `الرصيد غير كافي — المتاح: ${fromBal} ج.م` };

      const now = new Date();
      from.balance = fromBal - amt; from.adjDate = now; from.savedAt = now;
      to.balance = toBal + amt; to.adjDate = now; to.savedAt = now;
      await this.walletRepository.save([from, to]);

      await this.walletTransferRepository.save({
        legacyId: this.genLegacyId(),
        date: now,
        fromWallet: from.walletName,
        toWallet: to.walletName,
        amount: amt,
        notes: notes || '',
        createdBy: user.name,
        createdAt: now,
      });
      return { success: true, fromBalance: fromBal - amt, toBalance: toBal + amt };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addWalletIncome(userId: string, walletName: string, amount: any, description: string, category: string, date: string, method: string, notes: string) {
    try {
      const user = await this.validUser(userId);
      if (!user) return { success: false, message: 'غير مصرح' };
      const amt = parseFloat(amount) || 0;
      if (amt <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
      if (!walletName) return { success: false, message: 'اختر المحفظة' };
      const wallet = await this.walletRepository.findOne({ where: { walletName: walletName.trim() } });
      if (!wallet) return { success: false, message: 'المحفظة غير موجودة: ' + walletName };

      const newBalance = (Number(wallet.balance) || 0) + amt;
      wallet.balance = newBalance;
      wallet.adjDate = new Date();
      wallet.savedAt = new Date();
      await this.walletRepository.save(wallet);

      const id = 'INC-' + Date.now();
      await this.walletIncomeRepository.save({
        legacyIncomeId: id,
        date: date ? new Date(date) : new Date(),
        category: category || 'إيراد عام',
        description: description || '',
        amount: amt,
        wallet: walletName.trim(),
        method: method || 'كاش',
        by: user.name,
        notes: notes || '',
        createdAt: new Date(),
      });
      return { success: true, id, newBalance };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getWalletIncome(userId: string, month?: any, year?: any) {
    try {
      if (!(await this.validUser(userId))) return { success: false, rows: [] };
      const all = await this.walletIncomeRepository.find({ order: { date: 'DESC' } });
      const rows = all
        .filter((r) => (Number(r.amount) || 0) > 0 && r.date)
        .filter((r) => {
          const d = new Date(r.date);
          if (month && parseInt(month) !== d.getMonth() + 1) return false;
          if (year && parseInt(year) !== d.getFullYear()) return false;
          return true;
        })
        .map((r) => ({
          id: r.legacyIncomeId || r.id,
          date: this.fmtDate(r.date),
          category: r.category || '',
          desc: r.description || '',
          amount: Number(r.amount) || 0,
          wallet: r.wallet || '',
          method: r.method || '',
          by: r.by || '',
          notes: r.notes || '',
        }));
      return { success: true, rows };
    } catch (e: any) {
      return { success: false, rows: [], message: e.message };
    }
  }

  async addAccountingExpense(userId: string, category: string, description: string, amount: any, date?: string, method?: string, notes?: string) {
    try {
      const user = await this.validUser(userId);
      if (!user) return { success: false, message: 'غير مصرح' };
      const amt = parseFloat(amount) || 0;
      if (amt <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
      if (!category) return { success: false, message: 'اختر التصنيف' };
      const id = 'EXP-' + Date.now();
      await this.expenseRepository.save({
        legacyId: id,
        date: date ? new Date(date) : new Date(),
        category,
        description: description || '',
        amount: amt,
        method: method || 'كاش',
        createdBy: user.name,
        notes: notes || '',
        createdAt: new Date(),
      });
      return { success: true, id };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getAccountingExpenses(userId: string, month?: any, year?: any) {
    try {
      if (!(await this.validUser(userId))) return { success: false, rows: [] };
      const all = await this.expenseRepository.find({ order: { date: 'DESC' } });
      const rows = all
        .filter((r) => (Number(r.amount) || 0) > 0 && r.date)
        .filter((r) => {
          const d = new Date(r.date);
          if (month && parseInt(month) !== d.getMonth() + 1) return false;
          if (year && parseInt(year) !== d.getFullYear()) return false;
          return true;
        })
        .map((r) => ({
          id: r.legacyId || r.id,
          date: this.fmtDate(r.date),
          category: r.category || '',
          desc: r.description || '',
          amount: Number(r.amount) || 0,
          method: r.method || '',
          by: r.createdBy || '',
          notes: r.notes || '',
        }));
      return { success: true, rows };
    } catch (e: any) {
      return { success: false, rows: [], message: e.message };
    }
  }

  async getAccountingTransactions(userId: string, month?: any, year?: any) {
    try {
      if (!(await this.validUser(userId))) return { success: false, rows: [] };
      const all = await this.transactionRepository.find({ order: { date: 'DESC' } });
      const rows = all
        .filter((r) => (Number(r.amount) || 0) > 0 && r.date)
        .filter((r) => {
          const d = new Date(r.date);
          if (month && parseInt(month) !== d.getMonth() + 1) return false;
          if (year && parseInt(year) !== d.getFullYear()) return false;
          return true;
        })
        .map((r) => ({
          id: r.legacyTransactionId || r.id,
          name: r.clientName || '',
          amount: Number(r.amount) || 0,
          date: this.fmtDate(r.date),
          type: r.type || '',
          agent: r.agentName || '',
          method: '',
        }));
      return { success: true, rows };
    } catch (e: any) {
      return { success: false, rows: [], message: e.message };
    }
  }

  private readonly DEFAULT_EXP_CATS = ['مرتبات محاضرين', 'إيجار', 'تسويق وإعلانات', 'سوفتوير وتقنية', 'أدوات مكتبية', 'متفرقات'];

  async getAccExpenseCategories(userId: string) {
    try {
      const stored = await this.getSettingValue('acc_categories');
      return { success: true, categories: stored ? JSON.parse(stored) : this.DEFAULT_EXP_CATS };
    } catch {
      return { success: false, categories: this.DEFAULT_EXP_CATS };
    }
  }

  async addAccExpenseCategory(userId: string, name: string) {
    try {
      if (!(await this.validUser(userId))) return { success: false, message: 'غير مصرح' };
      const clean = (name || '').trim();
      if (!clean) return { success: false, message: 'أدخل اسم البند' };
      const stored = await this.getSettingValue('acc_categories');
      const cats: string[] = stored ? JSON.parse(stored) : [...this.DEFAULT_EXP_CATS];
      if (cats.includes(clean)) return { success: false, message: 'البند موجود بالفعل' };
      cats.push(clean);
      await this.setSettingValue('acc_categories', JSON.stringify(cats));
      return { success: true, categories: cats };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteAccExpenseCategory(userId: string, name: string) {
    try {
      if (!(await this.validUser(userId))) return { success: false, message: 'غير مصرح' };
      const clean = (name || '').trim();
      const stored = await this.getSettingValue('acc_categories');
      const cats: string[] = stored ? JSON.parse(stored) : [...this.DEFAULT_EXP_CATS];
      const idx = cats.indexOf(clean);
      if (idx < 0) return { success: false, message: 'البند غير موجود' };
      cats.splice(idx, 1);
      await this.setSettingValue('acc_categories', JSON.stringify(cats));
      return { success: true, categories: cats };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async payInstructorSalaryFromWallet(userId: string, salaryId: any, paymentKey: string, walletName: string, amount: any, payDate?: string) {
    try {
      if (!(await this.validUser(userId))) return { success: false, message: 'غير مصرح' };
      const amt = parseFloat(amount) || 0;
      if (amt <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };
      if (!walletName) return { success: false, message: 'اختر المحفظة' };
      const wallet = await this.walletRepository.findOne({ where: { walletName: walletName.trim() } });
      if (!wallet) return { success: false, message: 'المحفظة غير موجودة' };
      const bal = Number(wallet.balance) || 0;
      if (bal < amt) return { success: false, message: `الرصيد غير كافي — المتاح: ${bal.toLocaleString('ar-EG')} ج.م` };

      wallet.balance = bal - amt;
      wallet.adjDate = new Date();
      wallet.savedAt = new Date();
      await this.walletRepository.save(wallet);

      const salaryData: any = { id: salaryId };
      salaryData[paymentKey + 'Status'] = 'paid';
      salaryData[paymentKey + 'Date'] = payDate || new Date().toISOString();
      const salaryRes = await this.updateLecturerSalaryPayment(salaryData);
      if (!salaryRes.success) {
        wallet.balance = bal;
        await this.walletRepository.save(wallet);
        return { success: false, message: 'فشل تحديث سجل المرتب: ' + (salaryRes.message || '') };
      }

      await this.addAccountingExpense(userId, 'مرتبات محاضرين', `مرتب — صرف من محفظة ${walletName}`, amt, payDate, walletName, 'salary_id:' + salaryId);
      return { success: true, newBalance: bal - amt };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getAccountingDashboard(userId: string, filterMonth?: any, filterYear?: any) {
    try {
      if (!(await this.validUser(userId))) return { success: false, message: 'غير مصرح' };

      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1;
      const isAllMode = filterMonth === 'all';
      const scopeMonth = isAllMode ? null : parseInt(filterMonth) || curMonth;
      const scopeYear = isAllMode ? null : parseInt(filterYear) || curYear;

      const courses = await this.courseRepository.find();
      const courseCanon = new Map(courses.map((c) => [(c.courseName || '').toLowerCase(), c.courseName]));
      let campaignCanon = new Map<string, string>();
      try {
        const list: string[] = JSON.parse((await this.getSettingValue('campaignList')) || '[]');
        campaignCanon = new Map(list.map((c) => [c.toLowerCase(), c]));
      } catch { /* no managed list yet */ }

      // Income by month + course/campaign revenue (booking price on client rows only — see legacy double-count fix)
      const fdRows = await this.financialDataRepository.find();
      const monthIncome: Record<string, number> = {};
      const courseMap: Record<string, number> = {};
      const campaignMap: Record<string, number> = {};
      for (const fr of fdRows) {
        const fPaid = Number(fr.paid) || 0;
        const fMonth = fr.month || 0;
        const fYear = fr.year || 0;
        if (fPaid > 0 && fMonth && fYear) {
          const key = `${fYear}-${fMonth}`;
          monthIncome[key] = (monthIncome[key] || 0) + fPaid;
        }
        if ((fr.type || '').trim().toLowerCase() !== 'client') continue;
        if (!isAllMode && (fMonth !== scopeMonth || fYear !== scopeYear)) continue;
        const fPrice = Number(fr.price) || 0;
        if (fPrice <= 0) continue;
        let rawCourse = (fr.course || '').trim();
        if (rawCourse === '—' || rawCourse === '-') rawCourse = '';
        const course = rawCourse ? (courseCanon.get(rawCourse.toLowerCase()) || rawCourse) : 'غير محدد';
        courseMap[course] = (courseMap[course] || 0) + fPrice;
        let rawCamp = (fr.campaignType || '').trim();
        if (rawCamp === '—' || rawCamp === '-') rawCamp = '';
        const camp = rawCamp ? (campaignCanon.get(rawCamp.toLowerCase()) || rawCamp) : 'غير محدد';
        campaignMap[camp] = (campaignMap[camp] || 0) + fPrice;
      }

      // Overdue
      const overdueRes: any = await this.getOverdueInstallments(userId);
      const overdue = overdueRes.rows || [];
      const overdueTotal = overdueRes.totalOverdue || 0;

      // Wallets
      const walletRows = await this.walletRepository.find();
      const wallets = walletRows
        .filter((w) => (w.walletName || '').trim())
        .map((w) => ({ name: w.walletName.trim(), balance: Number(w.balance) || 0, adjDate: this.fmtDate(w.adjDate) }));

      // Expenses by month/category
      const expRows = await this.expenseRepository.find();
      const monthExpense: Record<string, number> = {};
      const expByCategory: Record<string, number> = {};
      const expByMonthCat: Record<string, Record<string, number>> = {};
      for (const er of expRows) {
        const amt = Number(er.amount) || 0;
        if (amt <= 0 || !er.date) continue;
        const d = new Date(er.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthExpense[key] = (monthExpense[key] || 0) + amt;
        const cat = er.category || 'متفرقات';
        (expByMonthCat[key] = expByMonthCat[key] || {})[cat] = (expByMonthCat[key][cat] || 0) + amt;
        if (isAllMode || (d.getMonth() + 1 === scopeMonth && d.getFullYear() === scopeYear)) {
          expByCategory[cat] = (expByCategory[cat] || 0) + amt;
        }
      }

      const sum = (o: Record<string, number>) => Object.values(o).reduce((s, v) => s + v, 0);
      const curIncome = isAllMode ? sum(monthIncome) : monthIncome[`${scopeYear}-${scopeMonth}`] || 0;
      const curExpense = isAllMode ? sum(monthExpense) : monthExpense[`${scopeYear}-${scopeMonth}`] || 0;

      const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const trend: any[] = [];
      for (let mi = 5; mi >= 0; mi--) {
        const td = new Date(curYear, curMonth - 1 - mi, 1);
        const tk = `${td.getFullYear()}-${td.getMonth() + 1}`;
        trend.push({ label: MONTHS_AR[td.getMonth()], income: monthIncome[tk] || 0, expense: monthExpense[tk] || 0 });
      }

      const toArr = (o: Record<string, number>) =>
        Object.entries(o).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
      const courseArr = toArr(courseMap);
      const campaignArr = toArr(campaignMap);
      const expCatArr = toArr(expByCategory);

      const topCatNames = expCatArr.slice(0, 4).map((c) => c.name);
      const expenseTrend: any[] = [];
      for (let xi = 5; xi >= 0; xi--) {
        const xd = new Date(curYear, curMonth - 1 - xi, 1);
        const xk = `${xd.getFullYear()}-${xd.getMonth() + 1}`;
        const byCat = expByMonthCat[xk] || {};
        expenseTrend.push({ label: MONTHS_AR[xd.getMonth()], categories: topCatNames.map((cn) => byCat[cn] || 0) });
      }

      // Spend anomaly alerts vs. the prior-3-month average (skipped in all-months mode)
      const expenseAlerts: any[] = [];
      if (!isAllMode) {
        for (const cat of Object.keys(expByCategory)) {
          const cur = (expByMonthCat[`${scopeYear}-${scopeMonth}`] || {})[cat] || 0;
          if (cur < 200) continue;
          let priorSum = 0, priorCount = 0;
          for (let pi = 1; pi <= 3; pi++) {
            const pd = new Date(scopeYear!, scopeMonth! - 1 - pi, 1);
            const pAmt = (expByMonthCat[`${pd.getFullYear()}-${pd.getMonth() + 1}`] || {})[cat];
            if (pAmt !== undefined) { priorSum += pAmt; priorCount++; }
          }
          if (!priorCount) continue;
          const avg = priorSum / priorCount;
          if (avg > 0 && cur > avg * 1.5) {
            expenseAlerts.push({ category: cat, current: cur, avg: Math.round(avg), pct: Math.round((cur / avg - 1) * 100) });
          }
        }
        expenseAlerts.sort((a, b) => b.pct - a.pct);
      }

      const recentTxs = await this.transactionRepository.find({ order: { date: 'DESC' }, take: 8 });
      const recent = recentTxs
        .filter((t) => (Number(t.amount) || 0) > 0)
        .slice(0, 5)
        .map((t) => ({ name: t.clientName || '', amount: Number(t.amount) || 0, date: this.fmtDate(t.date), type: t.type || '', method: '' }));

      return {
        success: true,
        isAllMode, scopeMonth, scopeYear,
        curIncome, curExpense, curProfit: curIncome - curExpense,
        overdueCount: overdue.length, overdueTotal,
        trend,
        topCourses: courseArr.slice(0, 5),
        topCampaigns: campaignArr,
        expByCategory: expCatArr,
        expenseTrend,
        expenseTrendCats: topCatNames,
        expenseAlerts,
        recentTx: recent,
        wallets,
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getCampaignList() {
    try {
      const stored = await this.getSettingValue('campaignList');
      return { success: true, campaigns: stored ? JSON.parse(stored) : [] };
    } catch {
      return { success: true, campaigns: [] };
    }
  }

  async saveCampaignList(campaigns: any) {
    try {
      await this.setSettingValue('campaignList', JSON.stringify(campaigns || []));
      return { success: true, message: '✅ تم حفظ قائمة الكامبينز' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getPlatformList() {
    try {
      const stored = await this.getSettingValue('platformList');
      return { success: true, platforms: stored ? JSON.parse(stored) : [] };
    } catch {
      return { success: true, platforms: [] };
    }
  }

  async savePlatformList(platforms: any) {
    try {
      await this.setSettingValue('platformList', JSON.stringify(platforms || []));
      return { success: true, message: '✅ تم حفظ قائمة المنصات' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async saveInstructorList(instructors: any) {
    try {
      await this.setSettingValue('instructorList', JSON.stringify(instructors || []));
      return { success: true, message: '✅ تم حفظ قائمة المحاضرين' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  FINANCIAL DATA & CAMPAIGNS (Group 6)  ═══
  // ═══════════════════════════════════════════════════

  private parseDateSafe(val: any): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) || d.getFullYear() < 2001 ? null : d;
  }

  async addFinancialClient(agentId: string, agentName: string, month: any, year: any, clientData: any) {
    try {
      const m = parseInt(month) || new Date().getMonth() + 1;
      const y = parseInt(year) || new Date().getFullYear();
      let finalOc = await this.ensureOcCodeForClient(clientData.ocCode || clientData.clientId || '', clientData.phone || '');
      if (finalOc && !finalOc.toLowerCase().startsWith('oc-')) finalOc = '';

      // Dedup: same agent + month/year + OC as an existing "client" booking row
      if (finalOc) {
        const existing = await this.financialDataRepository.findOne({
          where: { month: m, year: y, type: 'client', ocCode: finalOc, agent: { id: agentId } },
        });
        if (existing) {
          const act = (existing.action || '').trim();
          if (!act || act === 'New') {
            existing.action = (clientData.action || 'Wait').trim();
            await this.financialDataRepository.save(existing);
          }
          return { success: true, message: '✅ العميل مسجل في الحسابات المالية بالفعل' };
        }
      }

      // Campaign type: source/type of the ad — fall back to the raw lead's stored campaign
      let campaignType = (clientData.campaignType || '').trim();
      if (!campaignType && clientData.phone) {
        const raw = await this.rawLeadRepository.findOne({ where: { phone: this.normalizePhone(clientData.phone) } });
        const cand = (raw?.campaignType || '').trim();
        if (cand && !cand.toLowerCase().startsWith('oc-')) campaignType = cand;
      }
      if (!campaignType) campaignType = '—';

      // Attendance: default to the round's start date when a round is given
      let attendance = this.parseDateSafe(clientData.attendance);
      if (!attendance && clientData.roundId) {
        const round = await this.findRoundByAnyId(clientData.roundId);
        if (round?.startDate) attendance = new Date(round.startDate);
      }

      const agent = agentId ? await this.userRepository.findOne({ where: { id: agentId } }) : null;
      await this.financialDataRepository.save({
        agent: agent || null,
        agentLegacyId: agent?.legacyId || null,
        agentName: agentName || agent?.name || '',
        month: m,
        year: y,
        type: 'client',
        action: clientData.action || 'Wait',
        ocCode: finalOc || '',
        clientName: clientData.name || '',
        phone: this.normalizePhone(clientData.phone || ''),
        course: clientData.course || '',
        reservation: this.parseDateSafe(clientData.reservation),
        attendance,
        paymentMethod: clientData.method || 'Cash',
        offer: (clientData.offer ?? 0).toString(),
        price: parseFloat(clientData.price) || 0,
        paid: parseFloat(clientData.paid) || 0,
        createdAt: new Date(),
        clientType: clientData.clientType || 'New',
        campaignType,
      });
      await this.logActivity(agentId, agentName, 'ADD_FIN_CLIENT', `${clientData.name} - ${m}/${y}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addFinancialPayment(agentId: string, agentName: string, month: any, year: any, payData: any) {
    try {
      const m = parseInt(month) || new Date().getMonth() + 1;
      const y = parseInt(year) || new Date().getFullYear();
      const amt = parseFloat(payData.amount) || 0;
      if (amt <= 0) return { success: false, message: 'المبلغ يجب أن يكون أكبر من صفر' };

      const finalOc = (payData.ocCode || '').trim();
      const name = (payData.name || '').trim();

      // Update the ORIGINAL client booking row's running Paid total + carry its context onto the payment row
      let carriedCourse = '', carriedClientType = '', carriedCampaign = '';
      let carriedAttendance: Date | null = null;
      const clientRows = await this.financialDataRepository.find({ where: { type: 'client' } });
      const sameClient = clientRows.filter((r) =>
        (finalOc && (r.ocCode || '').trim().toLowerCase() === finalOc.toLowerCase()) ||
        (!finalOc && name && (r.clientName || '').trim().toLowerCase() === name.toLowerCase()),
      );
      const origMonth = parseInt(payData.originalMonth) || 0;
      const origYear = parseInt(payData.originalYear) || 0;
      let updatedOld = false;
      for (const r of sameClient) {
        if (!carriedCourse) carriedCourse = (r.course || '').trim();
        if (!carriedAttendance && r.attendance) carriedAttendance = r.attendance;
        if (!carriedClientType) carriedClientType = (r.clientType || '').trim();
        if (!carriedCampaign) carriedCampaign = (r.campaignType || '').trim();
        if (!updatedOld && origMonth && origYear && r.month === origMonth && r.year === origYear) {
          r.paid = (Number(r.paid) || 0) + amt;
          await this.financialDataRepository.save(r);
          updatedOld = true;
        }
      }
      if (!updatedOld && sameClient.length) {
        // No explicit original month — update the most recent booking row
        const latest = sameClient.sort((a, b) => ((b.year || 0) * 12 + (b.month || 0)) - ((a.year || 0) * 12 + (a.month || 0)))[0];
        latest.paid = (Number(latest.paid) || 0) + amt;
        await this.financialDataRepository.save(latest);
      }

      const agent = agentId ? await this.userRepository.findOne({ where: { id: agentId } }) : null;
      await this.financialDataRepository.save({
        agent: agent || null,
        agentLegacyId: agent?.legacyId || null,
        agentName: agentName || agent?.name || '',
        month: m,
        year: y,
        type: 'payment',
        action: 'قسط',
        ocCode: finalOc,
        clientName: name,
        phone: this.normalizePhone(payData.phone || ''),
        course: carriedCourse,
        attendance: carriedAttendance,
        paymentMethod: payData.method || '',
        price: 0,
        paid: amt,
        createdAt: new Date(),
        clientType: carriedClientType,
        campaignType: carriedCampaign || '—',
      });
      await this.logActivity(agentId, agentName, 'ADD_FIN_PAYMENT', `${name} - ${amt} EGP (${m}/${y})`);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateFinancialRowDirect(rowIndex: any, fields: any) {
    try {
      const idStr = (rowIndex || '').toString().trim();
      const row = await this.financialDataRepository.findOne({ where: { id: idStr } });
      if (!row) return { success: false, message: 'الصف غير موجود — أغلق النافذة وأعد فتحها' };
      // Stale-screen guard: the row must still belong to the same client the admin opened
      if (fields.expectedName && (row.clientName || '').trim().toLowerCase() !== fields.expectedName.toString().trim().toLowerCase()) {
        return { success: false, message: `⚠️ تغيّرت البيانات منذ فتح الشاشة (السجل الآن لـ "${row.clientName || ''}" بدل "${fields.expectedName}"). أغلق النافذة وأعد فتحها ثم احفظ.` };
      }
      if (fields.name !== undefined) row.clientName = fields.name;
      if (fields.phone !== undefined) row.phone = this.normalizePhone(fields.phone);
      if (fields.course !== undefined) row.course = fields.course;
      if (fields.method !== undefined) row.paymentMethod = fields.method;
      if (fields.offer !== undefined) row.offer = (fields.offer ?? '').toString();
      if (fields.price !== undefined) row.price = parseFloat(fields.price) || 0;
      if (fields.paid !== undefined) row.paid = parseFloat(fields.paid) || 0;
      if (fields.action !== undefined) row.action = fields.action;
      await this.financialDataRepository.save(row);
      return { success: true, message: '✅ تم الحفظ' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteFinancialClient(agentId: string, month: any, year: any, idx: any, rowIndex: any) {
    try {
      const idStr = (rowIndex || '').toString().trim();
      const row = idStr ? await this.financialDataRepository.findOne({ where: { id: idStr } }) : null;
      if (!row) return { success: false, message: 'السجل غير موجود' };

      const ocCode = (row.ocCode || '').trim();
      await this.financialDataRepository.remove(row);

      // Pull the client out of their round + waiting list bookkeeping too
      if (ocCode && ocCode.toLowerCase().startsWith('oc-')) {
        const member = await this.roundMemberRepository.findOne({ where: { ocCode }, relations: { round: true } });
        if (member) {
          if (member.round) {
            member.round.enrolled = Math.max(0, (member.round.enrolled || 0) - 1);
            await this.roundRepository.save(member.round);
          }
          await this.roundMemberRepository.remove(member);
        }
        const pay = await this.clientPaymentRepository.findOne({ where: { clientLegacyId: ocCode, isDeleted: false } });
        if (pay) {
          pay.isDeleted = true;
          pay.deletedBy = 'deleteFinancialClient';
          pay.deletedAt = new Date();
          await this.clientPaymentRepository.save(pay);
        }
      }
      await this.logActivity(agentId, '', 'DELETE_FIN_CLIENT', `${row.clientName || ''} (${ocCode || '—'})`);
      return { success: true, message: '✅ تم حذف العميل من الحسابات المالية' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteFinancialPayment(agentId: string, month: any, year: any, idx: any, rowIndex: any) {
    try {
      const idStr = (rowIndex || '').toString().trim();
      const row = idStr ? await this.financialDataRepository.findOne({ where: { id: idStr } }) : null;
      if (!row) return { success: false, message: 'السجل غير موجود' };
      if ((row.type || '').toLowerCase() !== 'payment') return { success: false, message: 'السجل ده مش قسط' };

      const amt = Number(row.paid) || 0;
      const ocCode = (row.ocCode || '').trim();
      const name = (row.clientName || '').trim();

      // Roll the amount back off the client's booking row running total
      const clientRows = (await this.financialDataRepository.find({ where: { type: 'client' } })).filter((r) =>
        (ocCode && (r.ocCode || '').trim().toLowerCase() === ocCode.toLowerCase()) ||
        (!ocCode && name && (r.clientName || '').trim().toLowerCase() === name.toLowerCase()),
      );
      if (clientRows.length) {
        const latest = clientRows.sort((a, b) => ((b.year || 0) * 12 + (b.month || 0)) - ((a.year || 0) * 12 + (a.month || 0)))[0];
        latest.paid = Math.max(0, (Number(latest.paid) || 0) - amt);
        await this.financialDataRepository.save(latest);
      }

      await this.financialDataRepository.remove(row);
      await this.logActivity(agentId, '', 'DELETE_FIN_PAYMENT', `${name} - ${amt} EGP`);
      return { success: true, message: '✅ تم حذف القسط وتصحيح الرصيد' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // Returns a PLAIN ARRAY — the دفتر الحسابات page does allLedgerData.forEach directly.
  // inst{1,2,3}Detail format: "amount - date - method - state" (parsed by formatInstCol).
  async getAcademyLedgerData() {
    try {
      const rows = await this.ledgerRepository.find({
        order: { bookingDate: 'DESC' },
        relations: { installments: true },
      });

      // Map OC -> attendance date from FinancialData
      const finList = await this.financialDataRepository.find({ where: { type: 'client' } });
      const attendanceByOc = new Map<string, Date>();
      for (const f of finList) {
        const oc = (f.ocCode || '').trim();
        if (oc && f.attendance) {
          attendanceByOc.set(oc, f.attendance);
        }
      }

      // خريطة إيميل السيلز → اسمه (الليدجر بيخزّن الإيميل، بس القديم بيعرض الاسم)
      const users = await this.userRepository.find();
      const nameByEmail = new Map<string, string>();
      for (const u of users) {
        if (u.email) nameByEmail.set(u.email.trim().toLowerCase(), u.name || '');
      }
      // خريطة OC → تفاصيل أقساط الدفعة (client_payments هي مصدر الأقساط)
      const pays = await this.clientPaymentRepository.find({ where: { isDeleted: false } });
      const payByOc = new Map<string, any>();
      for (const p of pays) {
        const oc = (p.clientLegacyId || '').trim();
        if (oc && !payByOc.has(oc)) payByOc.set(oc, p);
      }

      return rows.map((r) => {
        const insts = (r.installments || []).slice().sort((a, b) => (a.installmentOrder || 0) - (b.installmentOrder || 0));
        const pay = payByOc.get((r.ocCode || '').trim());
        const method = r.paymentMethod || pay?.paymentMethod || '—';
        // تفاصيل القسط: من علاقة installments إن وُجدت، وإلا من مبالغ الدفعة (amountDetail1/2/3)
        const instDetail = (i: number) => {
          const inst = insts[i];
          if (inst) {
            const amt = Number(inst.amount) || 0;
            const date = inst.dueDate ? new Date(inst.dueDate).toISOString().slice(0, 10) : '—';
            return `${amt} - ${date} - ${inst.paymentMethod || method} - ${inst.status || 'Pending'}`;
          }
          const amt = pay ? Number(pay['amountDetail' + (i + 1)]) || 0 : 0;
          if (!amt) return '';
          return `${amt} - ${method}`;
        };
        const rawAgent = (r.salesAgentEmail || '').trim();
        let agentName = rawAgent.includes('@') ? (nameByEmail.get(rawAgent.toLowerCase()) || rawAgent) : rawAgent;

        // Clean up email fallbacks to clean readable names
        if (agentName && agentName.includes('@')) {
          const lower = agentName.toLowerCase();
          if (lower.startsWith('asmaabsa4')) {
            agentName = 'Asmaa';
          } else if (lower.startsWith('bsa.academy.co')) {
            agentName = 'المدير';
          } else if (lower.startsWith('ansam')) {
            agentName = 'Ansam';
          } else if (lower.startsWith('omar')) {
            agentName = 'Omar';
          } else if (lower.startsWith('nour')) {
            agentName = 'Nour';
          } else if (lower.startsWith('habiba')) {
            agentName = 'Habiba';
          } else {
            const part = agentName.split('@')[0].toLowerCase();
            const cleaned = part.replace(/[\d]/g, '').split('.')[0].replace('bsa', '').trim();
            agentName = cleaned ? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)) : 'المدير';
          }
        }

        return {
          reservationDate: r.bookingDate ? new Date(r.bookingDate).toISOString().slice(0, 10) : '',
          bookingDate: r.bookingDate ? new Date(r.bookingDate).toISOString().slice(0, 10) : '',
          ocCode: r.ocCode || '',
          clientName: r.clientName || '',
          phone: r.phone || '',
          course: r.course || '',
          roundName: r.groupName || '',
          groupName: r.groupName || '',
          status: r.status || '',
          totalPrice: Number(r.totalPrice) || 0,
          paymentMethod: method,
          paidAmount: Number(r.amountPaid) || 0,
          remainingAmount: Number(r.amountRemaining) || 0,
          agentName,
          inst1Detail: instDetail(0),
          inst2Detail: instDetail(1),
          inst3Detail: instDetail(2),
          attendanceDate: attendanceByOc.get((r.ocCode || '').trim()) ? new Date(attendanceByOc.get((r.ocCode || '').trim())).toISOString().slice(0, 10) : '',
        };
      });
    } catch {
      return [];
    }
  }

  // Backfill empty campaign types on financial rows from the raw lead's stored campaign
  async syncFinancialCampaignTypes() {
    try {
      const rows = await this.financialDataRepository.find();
      let fixed = 0;
      for (const r of rows) {
        const cur = (r.campaignType || '').trim();
        if (cur && cur !== '—' && cur !== '-') continue;
        if (!r.phone) continue;
        const raw = await this.rawLeadRepository.findOne({ where: { phone: this.normalizePhone(r.phone) } });
        const cand = (raw?.campaignType || '').trim();
        if (cand && !cand.toLowerCase().startsWith('oc-')) {
          r.campaignType = cand;
          await this.financialDataRepository.save(r);
          fixed++;
        }
      }
      return { success: true, fixed, message: `✅ تم تحديث ${fixed} صف` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async importAcademyFinancialData() {
    return { success: false, message: 'أداة الاستيراد القديمة اتلغت — البيانات التاريخية اتنقلت بالفعل لقاعدة البيانات.' };
  }

  async cleanupFinancialSnapshotDuplicates() {
    return { success: true, cleaned: 0, message: '✅ غير مطلوب في النظام الجديد — مفيش Snapshots في قاعدة البيانات.' };
  }

  // ═══════════════════════════════════════════════════
  // ═══  SUPPORT & EXCEPTIONS (Group 11) + PERFORMANCE & REPORTS (Group 13)  ═══
  // ═══════════════════════════════════════════════════

  async toggleSupportClaim(id: any, supporterId: string, supporterName: string) {
    try {
      const idStr = (id || '').toString().trim();
      const req = (await this.supportRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.supportRepository.findOne({ where: { id: idStr } }) : null);
      if (!req) return { success: false, message: 'الطلب غير موجود' };
      if (!req.supporterId) {
        req.supporterId = supporterId || '';
        req.supporterName = supporterName || '';
        await this.supportRepository.save(req);
        return { success: true, claimed: true, message: 'تمام — العميل دلوقتي تحت سبورتك ✅' };
      }
      if (req.supporterId === (supporterId || '')) {
        req.supporterId = null;
        req.supporterName = null;
        await this.supportRepository.save(req);
        return { success: true, claimed: false, message: 'تم إلغاء السبورت' };
      }
      return { success: false, message: `بيشتغل عليه ${req.supporterName || 'زميل'} بالفعل` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteSupportRequest(id: any, agentId: string) {
    try {
      const idStr = (id || '').toString().trim();
      const req = (await this.supportRepository.findOne({ where: { legacyId: idStr }, relations: { agent: true } })) ||
        (idStr.length === 36 ? await this.supportRepository.findOne({ where: { id: idStr }, relations: { agent: true } }) : null);
      if (!req) return { success: false, message: 'الطلب غير موجود' };
      const elevated = await this.isAdminOrManager(agentId);
      if (!elevated && req.agent?.id !== agentId) return { success: false, message: 'غير مصرح' };
      req.hidden = true; // soft-hide from the board — the record itself is never lost
      await this.supportRepository.save(req);
      return { success: true, message: 'تم الحذف' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async markExceptionDone(id: any, agentId: string) {
    try {
      const idStr = (id || '').toString().trim();
      const req = (await this.exceptionRepository.findOne({ where: { legacyId: idStr }, relations: { agent: true } })) ||
        (idStr.length === 36 ? await this.exceptionRepository.findOne({ where: { id: idStr }, relations: { agent: true } }) : null);
      if (!req) return { success: false, message: 'الطلب غير موجود' };
      const elevated = await this.isAdminOrManager(agentId);
      if (!elevated && req.agent?.id !== agentId) return { success: false, message: 'غير مصرح' };
      if (!elevated) {
        if ((req.status || '') !== 'Approved') return { success: false, message: 'الطلب غير معتمد بعد' };
        if (req.deadline && new Date() > new Date(req.deadline)) {
          req.status = 'Expired';
          await this.exceptionRepository.save(req);
          return { success: false, expired: true, message: 'انتهت المهلة — تم تعليم الطلب كملغي' };
        }
      }
      req.status = 'Done';
      req.resolvedAt = new Date();
      await this.exceptionRepository.save(req);
      return { success: true, message: 'تم بنجاح ✅' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteExceptionRequest(id: any, agentId: string) {
    try {
      const idStr = (id || '').toString().trim();
      const req = (await this.exceptionRepository.findOne({ where: { legacyId: idStr }, relations: { agent: true } })) ||
        (idStr.length === 36 ? await this.exceptionRepository.findOne({ where: { id: idStr }, relations: { agent: true } }) : null);
      if (!req) return { success: false, message: 'الطلب غير موجود' };
      const elevated = await this.isAdminOrManager(agentId);
      if (!elevated && req.agent?.id !== agentId) return { success: false, message: 'غير مصرح' };
      await this.exceptionRepository.remove(req);
      return { success: true, message: 'تم الحذف' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getSupportFilesCRM(instructorTag: string) {
    try {
      const files = await this.supportFileRepository.find({
        where: { instructorTag: (instructorTag || '').trim() },
        order: { createdAt: 'DESC' },
      });
      return {
        success: true,
        files: files.map((f) => ({
          id: f.legacyId || f.id,
          instructorTag: f.instructorTag || '',
          title: f.title || '',
          driveFileId: f.driveFileId || '',
          fileName: f.fileName || '',
          fileType: f.fileType || 'pdf',
          url: f.url || '',
          createdAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-GB') : '',
        })),
      };
    } catch {
      return { success: false, files: [] };
    }
  }

  async addSupportFileByIdCRM(instructorTag: string, title: string, driveFileId: string, fileType: string, url: string, fileBase64?: string, fileName?: string) {
    try {
      if (!instructorTag) return { success: false, message: 'يجب تحديد المحاضر' };
      if (!title) return { success: false, message: 'يجب كتابة عنوان الملف' };
      const sfId = 'SF_' + Date.now();

      let finalUrl = url || '';
      let finalDriveId = driveFileId || '';

      if (fileBase64 && fileName) {
        const dir = path.join(process.cwd(), 'public', 'uploads', 'support');
        fs.mkdirSync(dir, { recursive: true });
        const safeName = `${Date.now()}_${fileName.replace(/[^\w.\-؀-ۿ]/g, '_')}`;
        const data = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
        fs.writeFileSync(path.join(dir, safeName), Buffer.from(data, 'base64'));
        finalUrl = '/uploads/support/' + safeName;
        finalDriveId = '';
      }

      await this.supportFileRepository.save({
        legacyId: sfId,
        instructorTag: instructorTag.trim(),
        title: title.trim(),
        driveFileId: finalDriveId,
        fileName: fileName || '',
        fileType: fileType || (finalUrl ? 'link' : 'pdf'),
        url: finalUrl,
        createdAt: new Date(),
        createdBy: 'CRM',
      });
      return { success: true, message: '✅ تم إضافة الملف بنجاح', id: sfId };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteSupportFileCRM(fileRecordId: any) {
    try {
      const idStr = (fileRecordId || '').toString().trim();
      const file = (await this.supportFileRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.supportFileRepository.findOne({ where: { id: idStr } }) : null);
      if (!file) return { success: false, message: 'الملف غير موجود' };
      await this.supportFileRepository.remove(file);
      return { success: true, message: '✅ تم حذف الملف' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ── Performance (ported 1:1 from the legacy Activity_Log CALL_SAVED aggregation) ──

  private inDateRange(d: Date, range: string): boolean {
    const now = new Date();
    const startOfDay = (x: Date) => { const c = new Date(x); c.setHours(0, 0, 0, 0); return c; };
    const today = startOfDay(now);
    switch ((range || 'today').toLowerCase()) {
      case 'today': return d >= today;
      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        return d >= y && d < today;
      }
      case 'week': {
        const w = new Date(today); w.setDate(w.getDate() - 7);
        return d >= w;
      }
      case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'all': return true;
      default: return d >= today;
    }
  }

  async getTeamPerformance(range?: string, viewerId?: string, viewerName?: string) {
    try {
      range = range || 'today';
      const logs = await this.activityLogRepository.find({ relations: { user: true } });

      // Full (unfiltered) call history per client for follow-up completion tracking
      const clientCallHistory: Record<string, { agentKey: string; date: Date }[]> = {};
      const agentKeyOf = (l: ActivityLog) => (l.user?.id || l.userLegacyId || 'unknown').toString();
      for (const l of logs) {
        if ((l.status || '') !== 'CALL_SAVED' || !l.date) continue;
        const cid = (l.notes || '').split(' - ')[0].trim();
        if (!cid) continue;
        (clientCallHistory[cid] = clientCallHistory[cid] || []).push({ agentKey: agentKeyOf(l), date: new Date(l.date) });
      }

      const agents: Record<string, any> = {};
      for (const l of logs) {
        if ((l.status || '') !== 'CALL_SAVED' || !l.date) continue;
        const d = new Date(l.date);
        if (!this.inDateRange(d, range)) continue;
        const aid = agentKeyOf(l);
        const aname = l.name || aid;
        if (!agents[aid]) {
          agents[aid] = {
            id: aid, name: aname,
            calls: 0, won: 0, won_rec: 0, reservation: 0, follow_up: 0, waiting: 0, no_answer: 0, delayed: 0, lost: 0, not_interested: 0, wrong_number: 0,
            fresh_calls: 0, fresh_won: 0, fresh_follow_up: 0, fresh_waiting: 0, fresh_no_answer: 0, fresh_delayed: 0, fresh_lost: 0, fresh_not_interested: 0, fresh_wrong_number: 0,
            rec_calls: 0, rec_won: 0, rec_follow_up: 0, rec_waiting: 0, rec_no_answer: 0, rec_delayed: 0, rec_lost: 0, rec_not_interested: 0, rec_wrong_number: 0,
            lost_price: 0, lost_timing: 0, lost_budget: 0, lost_competitor: 0, lost_notdm: 0, lost_noneed: 0, lost_other: 0,
            fu_completed: 0, fu_pending: 0, _fu_entries: [] as any[],
          };
        }
        const a = agents[aid];
        a.calls++;

        const details = l.notes || '';
        const parts = details.split(' - ');
        let callRes: string, leadType: string;
        if (parts.length >= 3) {
          callRes = parts[parts.length - 2].toLowerCase().trim();
          leadType = parts[parts.length - 1].trim();
        } else if (parts.length === 2) {
          callRes = parts[1].toLowerCase().trim();
          leadType = 'New';
        } else {
          callRes = details.toLowerCase();
          leadType = 'New';
        }
        const isRec = leadType === 'Rec' || leadType === 'Renew';
        const clientId = parts.length > 0 ? parts[0].trim() : '';
        if (isRec) a.rec_calls++; else a.fresh_calls++;

        const bump = (base: string) => { a[base]++; a[(isRec ? 'rec_' : 'fresh_') + base]++; };
        if (callRes.includes('closed won recommendation')) { a.won_rec++; a.won++; if (isRec) a.rec_won++; else a.fresh_won++; }
        else if (callRes.includes('closed won')) { a.won++; if (isRec) a.rec_won++; else a.fresh_won++; }
        else if (callRes.includes('reservation')) { a.reservation++; a.won++; if (isRec) a.rec_won++; else a.fresh_won++; }
        else if (callRes.includes('follow up')) { bump('follow_up'); if (clientId) a._fu_entries.push({ clientId, date: d }); }
        else if (callRes.includes('waiting')) bump('waiting');
        else if (callRes.includes('no answer')) bump('no_answer');
        else if (callRes.includes('delayed')) bump('delayed');
        else if (callRes.includes('closed lost')) {
          bump('lost');
          const lrIdx = callRes.indexOf('::');
          const reason = lrIdx !== -1 ? callRes.substring(lrIdx + 2).trim() : '';
          if (reason === 'price') a.lost_price++;
          else if (reason === 'timing') a.lost_timing++;
          else if (reason === 'budget') a.lost_budget++;
          else if (reason === 'competitor') a.lost_competitor++;
          else if (reason === 'notdm') a.lost_notdm++;
          else if (reason === 'noneed') a.lost_noneed++;
          else if (reason) a.lost_other++;
        }
        else if (callRes.includes('not interested')) bump('not_interested');
        else if (callRes.includes('wrong number')) bump('wrong_number');
      }

      // Follow-up completion (did the same agent call the client back after the FU?)
      for (const aid of Object.keys(agents)) {
        const a = agents[aid];
        let comp = 0, pend = 0;
        for (const fu of a._fu_entries) {
          const hist = clientCallHistory[fu.clientId] || [];
          if (hist.some((h) => h.agentKey === aid && h.date > fu.date)) comp++; else pend++;
        }
        a.fu_completed = comp;
        a.fu_pending = pend;
        delete a._fu_entries;
      }

      // Merge same-name agents (covers agents who logged under two different ids)
      const KEYS = [
        'calls', 'won', 'won_rec', 'reservation', 'follow_up', 'waiting', 'no_answer', 'delayed', 'lost', 'not_interested', 'wrong_number',
        'fresh_calls', 'fresh_won', 'fresh_follow_up', 'fresh_waiting', 'fresh_no_answer', 'fresh_delayed', 'fresh_lost', 'fresh_not_interested', 'fresh_wrong_number',
        'rec_calls', 'rec_won', 'rec_follow_up', 'rec_waiting', 'rec_no_answer', 'rec_delayed', 'rec_lost', 'rec_not_interested', 'rec_wrong_number',
        'lost_price', 'lost_timing', 'lost_budget', 'lost_competitor', 'lost_notdm', 'lost_noneed', 'lost_other',
        'fu_completed', 'fu_pending',
      ];
      const byName: Record<string, any> = {};
      for (const a of Object.values(agents) as any[]) {
        let key = (a.name || '').trim().toLowerCase();
        if (!key || key === 'unknown') key = a.id;
        if (byName[key]) for (const k of KEYS) byName[key][k] += a[k] || 0;
        else byName[key] = a;
      }

      let team = (Object.values(byName) as any[]).map((a) => {
        const fc = a.fresh_calls || 0;
        const fCont = Math.max(0, fc - (a.fresh_no_answer || 0) - (a.fresh_wrong_number || 0));
        const fInt = (a.fresh_follow_up || 0) + (a.fresh_waiting || 0) + (a.fresh_delayed || 0) + (a.fresh_won || 0);
        a.fresh_contacted = fCont;
        a.fresh_interested = fInt;
        a.fresh_contact_rate = fc > 0 ? Math.round((fCont / fc) * 100) : 0;
        a.fresh_interest_rate = fCont > 0 ? Math.round((fInt / fCont) * 100) : 0;
        a.fresh_closing_rate = fInt > 0 ? Math.round(((a.fresh_won || 0) / fInt) * 100) : 0;
        const rc = a.rec_calls || 0;
        const rCont = Math.max(0, rc - (a.rec_no_answer || 0) - (a.rec_wrong_number || 0));
        const rInt = (a.rec_follow_up || 0) + (a.rec_waiting || 0) + (a.rec_delayed || 0) + (a.rec_won || 0);
        a.rec_contacted = rCont;
        a.rec_interested = rInt;
        a.rec_contact_rate = rc > 0 ? Math.round((rCont / rc) * 100) : 0;
        a.rec_interest_rate = rCont > 0 ? Math.round((rInt / rCont) * 100) : 0;
        a.rec_closing_rate = rInt > 0 ? Math.round(((a.rec_won || 0) / rInt) * 100) : 0;
        const totalCalls = a.calls || 0;
        const totCont = fCont + rCont;
        const totInt = fInt + rInt;
        a.overall_contact_rate = totalCalls > 0 ? Math.round((totCont / totalCalls) * 100) : 0;
        a.overall_interest_rate = totCont > 0 ? Math.round((totInt / totCont) * 100) : 0;
        a.overall_closing_rate = totInt > 0 ? Math.round(((a.won || 0) / totInt) * 100) : 0;
        a.followup_rate = totCont > 0 ? Math.round(((a.follow_up || 0) / totCont) * 100) : 0;
        a.fresh_fup_rate = fCont > 0 ? Math.round(((a.fresh_follow_up || 0) / fCont) * 100) : 0;
        a.rec_fup_rate = rCont > 0 ? Math.round(((a.rec_follow_up || 0) / rCont) * 100) : 0;
        a.rate = totalCalls > 0 ? Math.round(((a.won || 0) / totalCalls) * 100) : 0;
        const fuTotal = (a.fu_completed || 0) + (a.fu_pending || 0);
        a.fu_completion_rate = fuTotal > 0 ? Math.round(((a.fu_completed || 0) / fuTotal) * 100) : null;

        const lostBd: any[] = [];
        if (a.lost_price > 0) lostBd.push({ reason: 'السعر مرتفع', count: a.lost_price, color: '#c62828' });
        if (a.lost_timing > 0) lostBd.push({ reason: 'التوقيت', count: a.lost_timing, color: '#e65100' });
        if (a.lost_budget > 0) lostBd.push({ reason: 'ميزانية غير كافية', count: a.lost_budget, color: '#bf360c' });
        if (a.lost_competitor > 0) lostBd.push({ reason: 'اختار منافس', count: a.lost_competitor, color: '#b71c1c' });
        if (a.lost_notdm > 0) lostBd.push({ reason: 'مش صاحب قرار', count: a.lost_notdm, color: '#4a148c' });
        if (a.lost_noneed > 0) lostBd.push({ reason: 'مش محتاج', count: a.lost_noneed, color: '#1a237e' });
        if (a.lost_other > 0) lostBd.push({ reason: 'سبب آخر', count: a.lost_other, color: '#546e7a' });
        lostBd.sort((x, y) => y.count - x.count);
        a.lost_breakdown = lostBd;

        a.fresh_in_pipeline = (a.fresh_follow_up || 0) + (a.fresh_waiting || 0) + (a.fresh_delayed || 0);
        a.fresh_lost_total = (a.fresh_lost || 0) + (a.fresh_not_interested || 0);
        a.rec_in_pipeline = (a.rec_follow_up || 0) + (a.rec_waiting || 0) + (a.rec_delayed || 0);
        a.rec_lost_total = (a.rec_lost || 0) + (a.rec_not_interested || 0);

        // KPI score: Fresh 70% + Reskill 30% (targets 70/50/25/70)
        const fuScoreInput = a.fu_completion_rate !== null ? a.fu_completion_rate : a.fresh_fup_rate || 0;
        let freshScore = 0, reskillScore = 0;
        if (fc > 0) {
          freshScore =
            Math.min(1, (a.fresh_contact_rate || 0) / 70) * 25 +
            Math.min(1, (a.fresh_interest_rate || 0) / 50) * 20 +
            Math.min(1, (a.fresh_closing_rate || 0) / 25) * 40 +
            Math.min(1, fuScoreInput / 70) * 15;
        }
        if (rc > 0) {
          reskillScore =
            Math.min(1, (a.rec_contact_rate || 0) / 70) * 35 +
            Math.min(1, fuScoreInput / 70) * 25 +
            Math.min(1, (a.rec_closing_rate || 0) / 25) * 40;
        }
        a.kpi_score = fc > 0 && rc > 0 ? Math.round(freshScore * 0.7 + reskillScore * 0.3) : fc > 0 ? Math.round(freshScore) : rc > 0 ? Math.round(reskillScore) : 0;
        a.kpi_breakdown = { fresh_score: Math.round(freshScore), reskill_score: Math.round(reskillScore), fresh_calls: fc, rec_calls: rc };

        a.stage_funnel = {
          assigned: totalCalls,
          contacted: totCont,
          contact_pct: totalCalls > 0 ? Math.round((totCont / totalCalls) * 100) : 0,
          interested: totInt,
          interest_pct: totCont > 0 ? Math.round((totInt / totCont) * 100) : 0,
          won: a.won || 0,
          won_pct: totInt > 0 ? Math.round(((a.won || 0) / totInt) * 100) : 0,
        };

        // Decision-tree diagnosis
        const FCR = a.fresh_contact_rate || 0;
        const FIR = a.fresh_interest_rate || 0;
        const FCL = a.fresh_closing_rate || 0;
        const pipelineRatio = totCont > 0 ? ((a.fresh_in_pipeline + a.rec_in_pipeline) / totCont) * 100 : 0;
        const totalLost = (a.lost || 0) + (a.not_interested || 0);
        a.issues = [];
        a.strengths = [];
        a.primary_issue = null;
        a.not_enough_data = false;
        if (totalCalls >= 5) {
          if (totCont < 15) {
            a.not_enough_data = true;
          } else {
            const cand: any[] = [];
            if (FCR < 60) cand.push({ type: 'communication', icon: '📞', label: 'Communication Issue', priority: 1, detail: `Contact ${FCR}% — target 60%+`, recs: ['زيادة عدد المكالمات اليومية', 'مراجعة جودة الليدات', 'تسريع وقت الرد على الليد الجديد'], color: '#1565c0' });
            if (FCR >= 60 && FIR < 40) cand.push({ type: 'discovery', icon: '🔍', label: 'Discovery Issue', priority: 2, detail: `Interest ${FIR}% رغم Contact ${FCR}%`, recs: ['تدريب على Needs Discovery Questions', 'مراجعة أول 30 ثانية من المكالمة', 'تحسين Opening Script'], color: '#e65100' });
            if (FIR >= 50 && totalLost > (a.won || 0) && totalLost >= 3) cand.push({ type: 'pitch', icon: '🎯', label: 'Pitch / Objection Handling', priority: 3, detail: `Lost ${totalLost} vs Won ${a.won || 0} رغم Interest ${FIR}%`, recs: ['تدريب على Objection Handling', 'مراجعة Value Proposition', 'عرض Success Stories للعميل'], color: '#b71c1c', lost_breakdown: lostBd });
            if (a.fu_completion_rate !== null && a.fu_completion_rate < 70 && fuTotal >= 3) cand.push({ type: 'fu_discipline', icon: '📋', label: 'Follow-up Discipline', priority: 4, detail: `تم تنفيذ ${a.fu_completed || 0} من ${fuTotal} Follow-ups (${a.fu_completion_rate}%)`, recs: ['مراجعة قائمة Follow-ups كل صباح', 'استخدام تنبيهات الموعد', 'الالتزام بالمواعيد المحددة للعميل'], color: '#f57f17' });
            if (pipelineRatio > 50 && totCont >= 4) cand.push({ type: 'stuck', icon: '⏳', label: 'Leads Stuck in Pipeline', priority: 5, detail: `${Math.round(pipelineRatio)}% من الليدات لسه معلقة`, recs: ['تحديد Deadline لكل عميل', 'مراجعة أسلوب الإغلاق', 'استخدام Urgency & Scarcity'], color: '#7b1fa2' });
            cand.sort((x, y) => x.priority - y.priority);
            if (cand.length) { a.primary_issue = cand[0]; a.issues = cand.slice(1); }
          }
          if (FCR >= 70) a.strengths.push(`Contact Rate ممتاز (${FCR}%)`);
          if (FIR >= 50) a.strengths.push(`Interest Rate ممتاز (${FIR}%)`);
          if (FCL >= 25) a.strengths.push(`Closing Rate ممتاز (${FCL}%)`);
          if (a.fu_completion_rate !== null && a.fu_completion_rate >= 70) a.strengths.push(`Follow-up Commitment ممتاز (${a.fu_completion_rate}%)`);
          if (rc >= 5 && a.rec_contact_rate >= 65) a.strengths.push(`Reskill Reactivation ممتاز (${a.rec_contact_rate}%)`);
          if (rc >= 5 && a.rec_closing_rate >= 25) a.strengths.push(`Reskill Closing ممتاز (${a.rec_closing_rate}%)`);
          if (!a.primary_issue && !a.issues.length) a.strengths.push('أداء متوازن — لا توجد مشاكل واضحة');
        }
        return a;
      }).sort((x, y) => y.kpi_score - x.kpi_score);

      // Role gate: non-elevated agents only ever see their own row
      if (viewerId && !(await this.isAdminOrManager(viewerId))) {
        const vn = (viewerName || '').trim().toLowerCase();
        const viewer = await this.userRepository.findOne({ where: { id: viewerId } });
        const legacyId = viewer?.legacyId || '';
        team = team.filter((a) =>
          a.id === viewerId || a.id === legacyId ||
          (vn && (a.name || '').trim().toLowerCase() === vn) ||
          (viewer && (a.name || '').trim().toLowerCase() === viewer.name.trim().toLowerCase()),
        );
      }
      return team;
    } catch {
      return [];
    }
  }

  async getMyPerformance(agentId: string, range?: string) {
    try {
      range = range || 'today';
      const user = await this.userRepository.findOne({ where: { id: agentId } });
      const logs = await this.activityLogRepository.find({ relations: { user: true } });
      const mine = logs.filter((l) =>
        l.user?.id === agentId ||
        (user?.legacyId && l.userLegacyId === user.legacyId) ||
        (user && (l.name || '').trim() === user.name.trim()),
      );

      const s: any = {
        calls: 0, won: 0, won_rec: 0, reservation: 0, follow_up: 0, waiting: 0, no_answer: 0, delayed: 0, lost: 0, not_interested: 0, wrong_number: 0,
        rate: 0, dist: {}, week: [0, 0, 0, 0, 0, 0, 0], topClients: [],
      };
      let totalWins = 0;
      const now = Date.now();
      for (const l of mine) {
        if (!l.date) continue;
        const d = new Date(l.date);
        const diff = Math.floor((now - d.getTime()) / 86400000);
        if (diff >= 0 && diff < 7 && (l.status || '') === 'CALL_SAVED') s.week[d.getDay()]++;
        if (!this.inDateRange(d, range)) continue;
        if ((l.status || '') !== 'CALL_SAVED') continue;
        s.calls++;
        const details = (l.notes || '').toLowerCase();
        const parts = details.split(' - ');
        const callRes = parts.length > 1 ? parts[parts.length - 1] : details;
        if (callRes.includes('closed won recommendation')) { s.won_rec++; totalWins++; }
        else if (callRes.includes('closed won')) { s.won++; totalWins++; }
        else if (callRes.includes('reservation')) { s.reservation++; totalWins++; }
        else if (callRes.includes('follow up')) s.follow_up++;
        else if (callRes.includes('waiting')) s.waiting++;
        else if (callRes.includes('no answer')) s.no_answer++;
        else if (callRes.includes('delayed')) s.delayed++;
        else if (callRes.includes('closed lost')) s.lost++;
        else if (callRes.includes('not interested')) s.not_interested++;
        else if (callRes.includes('wrong number')) s.wrong_number++;
      }
      s.rate = s.calls > 0 ? Math.round((totalWins / s.calls) * 100) : 0;
      s.dist = {
        won: s.won, won_rec: s.won_rec, reservation: s.reservation, follow_up: s.follow_up, waiting: s.waiting,
        no_answer: s.no_answer, delayed: s.delayed, lost: s.lost, not_interested: s.not_interested, wrong_number: s.wrong_number,
      };
      return s;
    } catch (e: any) {
      return { calls: 0, won: 0, rate: 0, dist: {}, week: [0, 0, 0, 0, 0, 0, 0], topClients: [], error: e.message };
    }
  }

  async getBreakStatus() {
    try {
      const users = await this.userRepository.find({ where: { active: true } });
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      
      // Auto-close any open shifts older than 18 hours first
      const openRows = await this.breakLogRepository.find({
        where: { logoutTime: IsNull() }
      });
      const now = new Date();
      for (const r of openRows) {
        if (r.loginTime) {
          const diffMs = now.getTime() - new Date(r.loginTime).getTime();
          if (diffMs > 18 * 60 * 60 * 1000) {
            r.logoutTime = new Date(new Date(r.loginTime).getTime() + 8 * 60 * 60 * 1000);
            r.workDuration = '08:00:00';
            r.earlyLogoutReason = 'Forgot to clock out (Auto)';
            await this.breakLogRepository.save(r);
          }
        }
      }

      const rows = await this.breakLogRepository.find({
        where: [
          { date: today },
          { logoutTime: IsNull() }
        ],
        relations: { agent: true }
      });

      const fmtTime = (d: Date | null) => {
        if (!d) return '';
        return new Intl.DateTimeFormat('en-US', {
          timeZone: 'Africa/Cairo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date(d));
      };
      const raw = (d: Date | null) => (d ? new Date(d).getTime() : null);

      const statusMap = new Map<string, any>();
      for (const r of rows) {
        const slots: [Date | null, Date | null][] = [
          [r.lunchStart, r.lunchEnd],
          [r.break1Start, r.break1End],
          [r.break2Start, r.break2End],
        ];
        const breakSessions = slots
          .filter(([st, en]) => st || en)
          .map(([st, en]) => ({ start: fmtTime(st), startRaw: raw(st), end: fmtTime(en), endRaw: raw(en) }));
        const last = breakSessions[breakSessions.length - 1];
        const key = r.agent?.id || r.agentLegacyId || '';
        statusMap.set(key, {
          agentId: key,
          agentName: r.agentName || r.agent?.name || '',
          loginTime: fmtTime(r.loginTime), loginRaw: raw(r.loginTime),
          logoutTime: fmtTime(r.logoutTime), logoutRaw: raw(r.logoutTime),
          breakSessions,
          onBreak: !!last && !!last.startRaw && !last.endRaw,
          workDuration: r.workDuration || '',
          totalBreak: r.totalBreak || '',
          overtime: r.overtime || '',
          earlyReason: r.earlyLogoutReason || '',
          rowIndex: r.id,
        });
      }
      return users
        .filter((u) => u.role !== 'Manager')
        .map((u) => statusMap.get(u.id) || {
          agentId: u.id, agentName: u.name,
          loginTime: '', loginRaw: null, logoutTime: '', logoutRaw: null,
          breakSessions: [], onBreak: false, workDuration: '', totalBreak: '', overtime: '', earlyReason: '', rowIndex: -1,
        });
    } catch {
      return [];
    }
  }

  async logBreakAction(agentId: string, agentName: string, action: string, workDuration?: string, totalBreak?: string, overtime?: string, earlyReason?: string) {
    try {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const agent = await this.userRepository.findOne({ where: { id: agentId } });
      
      let row = await this.breakLogRepository.findOne({
        where: {
          agent: { id: agentId },
          logoutTime: IsNull()
        },
        relations: { agent: true }
      });

      if (action === 'login') action = 'clock_in';
      if (action === 'logout') action = 'clock_out';
      const now = new Date();

      if (row && row.loginTime) {
        const diffMs = now.getTime() - new Date(row.loginTime).getTime();
        if (diffMs > 18 * 60 * 60 * 1000) {
          row.logoutTime = new Date(new Date(row.loginTime).getTime() + 8 * 60 * 60 * 1000);
          row.workDuration = '08:00:00';
          row.earlyLogoutReason = 'Forgot to clock out (Auto)';
          await this.breakLogRepository.save(row);
          row = null;
        }
      }

      if (!row) {
        if (action !== 'clock_in') {
          return { success: false, message: 'لا توجد شيفت نشطة لهذا الموظف حالياً' };
        }
        row = this.breakLogRepository.create({
          agent: agent || null,
          agentLegacyId: agent?.legacyId || null,
          agentName: agentName || agent?.name || '',
          date: today,
        });
      }

      if (action === 'clock_in') row.loginTime = now;
      else if (action === 'clock_out') {
        row.logoutTime = now;
        row.workDuration = workDuration || '';
        row.totalBreak = totalBreak || '';
        row.overtime = overtime || '';
        row.earlyLogoutReason = earlyReason || '';
      } else if (action === 'break_start') {
        if (!row.lunchStart) row.lunchStart = now;
        else if (!row.break1Start) row.break1Start = now;
        else if (!row.break2Start) row.break2Start = now;
        else return { success: false, message: 'Maximum breaks reached for today (3 breaks)' };
      } else if (action === 'break_end') {
        if (row.break2Start && !row.break2End) row.break2End = now;
        else if (row.break1Start && !row.break1End) row.break1End = now;
        else if (row.lunchStart && !row.lunchEnd) row.lunchEnd = now;
        else return { success: false, message: 'No active break to end' };
      }

      await this.breakLogRepository.save(row);
      await this.logActivity(agentId, agentName, 'SHIFT_' + action.toUpperCase(), now.toTimeString().slice(0, 5));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getFuAlertsNow(agentId: string) {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 30 * 60 * 1000);
      const leads = await this.myLeadRepository.find({ where: { agent: { id: agentId } } });
      const alerts = leads
        .filter((l) => l.followUpDate && new Date(l.followUpDate) >= windowStart && new Date(l.followUpDate) <= now)
        .map((l) => ({
          id: l.clientNumber,
          name: l.name || '',
          phone: l.phone || '',
          time: new Date(l.followUpDate).toTimeString().slice(0, 5),
        }));
      return { success: true, alerts };
    } catch {
      return { success: true, alerts: [] };
    }
  }

  async getAdminAlerts() {
    try {
      const alerts: any[] = [];
      const sals = await this.lecturerSalaryRepository.find();
      for (const s of sals) {
        if (s.alert1Triggered && (s.pay1Status || 'pending') !== 'paid') {
          alerts.push({ type: 'salary', roundId: s.roundLegacyId || '', roundName: s.roundName || '', instructor: s.instructorName || '', paymentNum: 1, amount: s.pay1Amount != null ? String(s.pay1Amount) : '', salaryId: s.legacyId || s.id });
        }
        if (s.alert2Triggered && (s.pay2Status || 'pending') !== 'paid') {
          alerts.push({ type: 'salary', roundId: s.roundLegacyId || '', roundName: s.roundName || '', instructor: s.instructorName || '', paymentNum: 2, amount: s.pay2Amount != null ? String(s.pay2Amount) : '', salaryId: s.legacyId || s.id });
        }
      }
      return { success: true, alerts };
    } catch {
      return { success: true, alerts: [] };
    }
  }

  async systemHealthCheck() {
    try {
      const [leads, myLeads, payments, students, freshAvail] = await Promise.all([
        this.rawLeadRepository.count(),
        this.myLeadRepository.count(),
        this.clientPaymentRepository.count({ where: { isDeleted: false } }),
        this.studentRepository.count(),
        this.freshLeadRepository.count({ where: { status: 'available' } }),
      ]);
      return {
        success: true,
        checks: [
          { name: 'قاعدة البيانات', ok: true, detail: 'متصلة' },
          { name: 'العملاء (Raw_Data)', ok: leads > 0, detail: `${leads} عميل` },
          { name: 'عملائي (My_Leads)', ok: true, detail: `${myLeads} ليد` },
          { name: 'المدفوعات النشطة', ok: true, detail: `${payments} سجل` },
          { name: 'طلاب الأكاديمية', ok: true, detail: `${students} طالب` },
          { name: 'فريش متاح للسحب', ok: true, detail: `${freshAvail} ليد` },
        ],
        message: '✅ النظام يعمل بشكل طبيعي',
      };
    } catch (e: any) {
      return { success: false, message: 'خطأ في الفحص: ' + e.message };
    }
  }

  async sendPerformanceReport() {
    return { success: false, message: 'إرسال التقارير بالإيميل كان مربوط بجيميل جوجل — محتاج إعداد SMTP جديد (مؤجل).' };
  }

  async setupDailyReportTrigger() {
    return { success: false, message: 'الجدولة التلقائية كانت مربوطة بمشغلات جوجل — هتتعمل بـ Cron على السيرفر (مؤجل).' };
  }

  // ═══════════════════════════════════════════════════
  // ═══  ACADEMY ADMIN FROM CRM (Group 7) + CONTENT & QUIZ BANK (Group 8)  ═══
  // ═══════════════════════════════════════════════════

  private async findStudentByAnyId(studentId: any): Promise<Student | null> {
    const idStr = (studentId || '').toString().trim();
    if (!idStr) return null;
    return (
      (await this.studentRepository.findOne({ where: { legacyId: idStr } })) ||
      (idStr.length === 36 ? await this.studentRepository.findOne({ where: { id: idStr } }) : null)
    );
  }

  private async findContentByAnyId(contentId: any): Promise<AcademyContent | null> {
    const idStr = (contentId || '').toString().trim();
    if (!idStr) return null;
    return (
      (await this.contentRepository.findOne({ where: { legacyId: idStr }, relations: { round: true } })) ||
      (idStr.length === 36 ? await this.contentRepository.findOne({ where: { id: idStr }, relations: { round: true } }) : null)
    );
  }

  async addStudent(name: string, username: string, password: string, phone: string, instructorTag?: string, roundId?: any, roundName?: string, accessMode?: string, ocCode?: string) {
    try {
      let cleanUser = (username || '').trim().toLowerCase();
      if (!cleanUser) {
        const baseUname = this.transliterateArabicToEnglish(name);
        cleanUser = baseUname + '@bsa';
        let counter = 1;
        while (await this.studentRepository.findOne({ where: { email: cleanUser } })) {
          cleanUser = `${baseUname}${counter}@bsa`;
          counter++;
        }
      } else if (!cleanUser.includes('@')) {
        cleanUser += '@bsa';
      }

      let cleanPass = (password || '').trim();
      if (!cleanPass) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
        cleanPass = `BSA_${randomDigits}`;
      }

      const exists = await this.studentRepository.findOne({ where: { email: cleanUser } });
      if (exists) return { success: false, message: '⚠️ اسم المستخدم ده موجود بالفعل' };

      const id = 'STU_' + Date.now();
      const student = await this.studentRepository.save({
        legacyId: id,
        name: name || '',
        email: cleanUser,
        password: cleanPass,
        phone: this.normalizePhone(phone || ''),
        active: true,
        instructorTag: (instructorTag || '').trim() || null,
        accessMode: (accessMode || 'sequential').trim(),
        ocCode: (ocCode || '').trim() || null,
      });

      if (roundId) {
        const round = await this.findRoundByAnyId(roundId);
        if (round) {
          await this.enrollmentRepository.save({
            legacyId: this.genLegacyId(),
            student,
            studentLegacyId: id,
            round,
            roundLegacyId: round.legacyId || null,
            roundName: roundName || round.name || '',
            enrolledAt: new Date(),
            status: 'active',
          });
        }
      }
      return { success: true, message: `✅ تم إضافة الطالب: ${name} (username: ${cleanUser})${roundId ? ' وتسجيله في الراوند' : ''}`, id, username: cleanUser };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateStudent(studentId: any, name: string, username: string, phone: string, instructorTag?: string, newPassword?: string, ocCode?: string) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      if (!student) return { success: false, message: 'الطالب مش موجود' };
      if (username) {
        let uname = username.trim().toLowerCase();
        if (!uname.includes('@')) uname += '@bsa';
        const dup = await this.studentRepository.findOne({ where: { email: uname } });
        if (dup && dup.id !== student.id) return { success: false, message: 'اسم المستخدم موجود بالفعل' };
        student.email = uname;
      }
      if (name) student.name = name;
      if (phone !== undefined) student.phone = this.normalizePhone(phone || '');
      if (instructorTag !== undefined) student.instructorTag = (instructorTag || '').trim();
      if (ocCode !== undefined) student.ocCode = (ocCode || '').trim();
      if (newPassword && newPassword.trim()) student.password = newPassword.trim();
      await this.studentRepository.save(student);
      return { success: true, message: '✅ تم تعديل بيانات الطالب' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteStudent(studentId: any) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      if (!student) return { success: false, message: 'مش موجود' };
      await this.studentRepository.remove(student);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async toggleStudentActive(studentId: any, active: boolean) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      if (!student) return { success: false, message: 'مش موجود' };
      student.active = !!active;
      await this.studentRepository.save(student);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async setStudentAccessMode(studentId: any, mode: string) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      if (!student) return { success: false, message: 'مش موجود' };
      student.accessMode = (mode || 'sequential').trim();
      await this.studentRepository.save(student);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateStudentPassword(studentId: any, newPassword: string) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      if (!student) return { success: false, message: 'مش موجود' };
      if (!newPassword || !newPassword.trim()) return { success: false, message: 'أدخل الباسورد الجديد' };
      student.password = newPassword.trim();
      await this.studentRepository.save(student);
      return { success: true, message: '✅ تم تغيير الباسورد' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateInstructorPassword(instructorId: any, newPassword: string) {
    try {
      const idStr = (instructorId || '').toString().trim();
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.instructorRepository.findOne({ where: { id: idStr } }) : null);
      if (!instructor) return { success: false, message: 'المحاضر مش موجود' };
      if (!newPassword || !newPassword.trim()) return { success: false, message: 'أدخل الباسورد الجديد' };
      instructor.password = newPassword.trim();
      await this.instructorRepository.save(instructor);
      return { success: true, message: '✅ تم تغيير باسورد المحاضر' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async enrollStudent(studentId: any, roundId: any, roundName?: string) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      const round = await this.findRoundByAnyId(roundId);
      if (!student) return { success: false, message: 'الطالب مش موجود' };
      if (!round) return { success: false, message: 'الراوند مش موجود' };
      const existing = await this.enrollmentRepository.findOne({ where: { student: { id: student.id }, round: { id: round.id } } });
      if (existing) {
        if (existing.status === 'removed') {
          existing.status = 'active';
          await this.enrollmentRepository.save(existing);
          return { success: true, message: '✅ تم إعادة تسجيل الطالب في الراوند' };
        }
        return { success: true, message: 'الطالب مسجل في الراوند بالفعل' };
      }
      await this.enrollmentRepository.save({
        legacyId: this.genLegacyId(),
        student,
        studentLegacyId: student.legacyId || null,
        round,
        roundLegacyId: round.legacyId || null,
        roundName: roundName || round.name || '',
        enrolledAt: new Date(),
        status: 'active',
      });
      return { success: true, message: '✅ تم تسجيل الطالب في الراوند' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getAcademyStudents() {
    try {
      const students = await this.studentRepository.find({ order: { createdAt: 'DESC' } });

      // التقدم column: lecturesDone = watched lectures, lecturesTotal = unlocked
      // lectures for the student's instructor (same rule as the student dashboard)
      const contents = await this.contentRepository.find({ where: { isLocked: false } });
      const totalsByTag: Record<string, number> = {};
      let totalAll = 0;
      const lectureIds = new Set<string>();
      for (const c of contents) {
        const tag = (c.instructorTag || '').trim().toLowerCase();
        if (tag) totalsByTag[tag] = (totalsByTag[tag] || 0) + 1;
        totalAll++;
        lectureIds.add(this.contentKey(c));
      }
      const progressRows = await this.progressRepository.find({ relations: { student: true, lecture: true } });
      const doneByStudent: Record<string, Set<string>> = {};
      for (const r of progressRows) {
        const sid = (r.student?.legacyId || r.student?.id || r.studentLegacyId || '').toString();
        const lid = (r.lecture?.legacyId || r.lecture?.id || r.lectureLegacyId || '').toString();
        if (!sid || !lid || !lectureIds.has(lid)) continue;
        (doneByStudent[sid] = doneByStudent[sid] || new Set()).add(lid);
      }

      // Fetch enrollments to get roundIds for filtering
      const enrollments = await this.enrollmentRepository.find({ relations: { student: true, round: true } });
      const roundsByStudent: Record<string, string[]> = {};
      for (const e of enrollments) {
        if (!e.student || !e.round || e.status === 'removed') continue;
        const sid = (e.student.legacyId || e.student.id).toString();
        const rid = (e.round.legacyId || e.round.id).toString();
        if (!roundsByStudent[sid]) roundsByStudent[sid] = [];
        roundsByStudent[sid].push(rid);
      }

      // Fetch all final project unlocks
      const unlocks = await this.unlockRepository.find({ where: { lectureId: 'FINAL_PROJECT' } });
      const fpUnlockedStudents = new Set(unlocks.map((u) => u.studentId.toString()));

      return {
        students: students.map((s) => {
          const key = (s.legacyId || s.id).toString();
          const tag = (s.instructorTag || '').trim().toLowerCase();
          return {
            id: s.legacyId || s.id,
            name: s.name || '',
            username: s.email || '',
            password: s.password || '',
            phone: s.phone || '',
            active: !!s.active,
            instructorTag: s.instructorTag || '',
            accessMode: s.accessMode || 'sequential',
            ocCode: s.ocCode || '',
            createdAt: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '',
            lecturesTotal: tag ? (totalsByTag[tag] || 0) : totalAll,
            lecturesDone: (doneByStudent[key] && doneByStudent[key].size) || 0,
            roundIds: roundsByStudent[key] || [],
            finalProjectUnlocked: fpUnlockedStudents.has(key),
          };
        }),
      };
    } catch {
      return { students: [] };
    }
  }

  async getAcademyStats() {
    try {
      const [students, enrollments, pendingTasks, approvedTasks] = await Promise.all([
        this.studentRepository.count(),
        this.enrollmentRepository.createQueryBuilder('e').where("COALESCE(e.status,'') != 'removed'").getCount(),
        this.academyTaskRepository.count({ where: { status: 'pending' } }),
        this.academyTaskRepository.count({ where: { status: 'approved' } }),
      ]);
      return { students, enrollments, pendingTasks, approvedTasks };
    } catch {
      return { students: 0, enrollments: 0, pendingTasks: 0, approvedTasks: 0 };
    }
  }

  async getAcademyTarget() {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const rows = await this.financialDataRepository.find({ where: { month, year, type: 'client' } });
      const totalPaid = rows.reduce((s, r) => s + (Number(r.price) || 0), 0);

      const defaultTarget = parseFloat((await this.getSettingValue('targetPerAgent')) || '50000');
      let salesTargets: Record<string, any> = {};
      try { salesTargets = JSON.parse((await this.getSettingValue('salesTargets')) || '{}'); } catch { /* default */ }

      const users = await this.userRepository.find({ where: { active: true } });
      const activeSales = users.filter((u) => (u.role || '') === 'Sales');
      let totalTarget = 0;
      for (const u of activeSales) {
        const tVal = salesTargets[u.name];
        if (tVal === undefined || tVal === null || tVal === '') totalTarget += defaultTarget;
        else {
          const parsed = parseFloat(tVal);
          totalTarget += isNaN(parsed) ? defaultTarget : parsed;
        }
      }
      if (!activeSales.length) totalTarget = defaultTarget * 5;

      const pct = totalTarget > 0 ? Math.min(100, Math.round((totalPaid / totalTarget) * 100)) : 0;
      return { totalPaid, totalTarget, pct, remaining: Math.max(0, totalTarget - totalPaid) };
    } catch {
      return { totalPaid: 0, totalTarget: 250000, pct: 0, remaining: 250000 };
    }
  }

  async getAcademyRoundsList() {
    try {
      const rounds = await this.roundRepository
        .createQueryBuilder('r')
        .where("COALESCE(r.status,'') != 'Deleted'")
        .orderBy('r.createdAt', 'DESC')
        .getMany();
      return {
        rounds: rounds.map((r) => ({
          id: r.legacyId || r.id,
          name: r.name || '',
          type: r.type || 'Online',
          status: r.status || 'Active',
          instructor: r.instructorName || '',
          startDate: r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : '',
        })),
      };
    } catch {
      return { rounds: [] };
    }
  }

  // ── Lecture content ──

  async addLectureContent(roundId: any, roundName: string, lectureOrder: any, lectureName: string, driveFileId: string, fileType: string, taskRequired: boolean, notes: string, instructorTag?: string, pdfFileId?: string) {
    try {
      const round = roundId ? await this.findRoundByAnyId(roundId) : null;
      const id = 'LEC_' + Date.now();
      await this.contentRepository.save({
        legacyId: id,
        round: round || null,
        roundLegacyId: round?.legacyId || (roundId || '').toString() || null,
        roundName: roundName || round?.name || '',
        lectureOrder: parseInt(lectureOrder) || 1,
        lectureName: lectureName || '',
        driveFileId: driveFileId || '',
        fileType: fileType || 'video',
        isLocked: false,
        taskRequired: !!taskRequired,
        notes: notes || '',
        instructorTag: (instructorTag || '').trim() || null,
        pdfFileId: pdfFileId || '',
      });
      return { success: true, message: '✅ تم إضافة المحاضرة', id };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateLectureContent(contentId: any, lectureName: string, driveFileId: string, fileType: string, taskRequired: boolean, isLocked: boolean, notes: string, pdfFileId?: string, instructorTag?: string) {
    try {
      const content = await this.findContentByAnyId(contentId);
      if (!content) return { success: false, message: 'المحاضرة مش موجودة' };
      if (lectureName !== undefined) content.lectureName = lectureName;
      if (driveFileId !== undefined) content.driveFileId = driveFileId;
      if (fileType !== undefined) content.fileType = fileType;
      if (taskRequired !== undefined) content.taskRequired = !!taskRequired;
      if (isLocked !== undefined) content.isLocked = !!isLocked;
      if (notes !== undefined) content.notes = notes;
      if (pdfFileId !== undefined) content.pdfFileId = pdfFileId;
      if (instructorTag !== undefined) content.instructorTag = (instructorTag || '').trim();
      await this.contentRepository.save(content);
      return { success: true, message: '✅ تم تعديل المحاضرة' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteLectureContent(contentId: any) {
    try {
      const content = await this.findContentByAnyId(contentId);
      if (!content) return { success: false, message: 'المحاضرة مش موجودة' };
      await this.contentRepository.remove(content);
      return { success: true, message: '✅ تم حذف المحاضرة' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getContentForUnlock(studentId: any) {
    try {
      const student = await this.findStudentByAnyId(studentId);
      const tag = (student?.instructorTag || '').trim().toLowerCase();
      const all = await this.contentRepository.find({ where: { isLocked: false } });
      const items = all
        .filter((c) => !tag || (c.instructorTag || '').trim().toLowerCase() === tag)
        .map((c) => ({
          id: c.legacyId || c.id,
          order: c.lectureOrder || 1,
          name: c.lectureName || '',
          instructor: c.instructorTag || '',
        }))
        .sort((a, b) => a.instructor.localeCompare(b.instructor) || a.order - b.order);
      return { items };
    } catch {
      return { items: [] };
    }
  }

  async getAllContentGroupedByInstructor() {
    try {
      const all = await this.contentRepository.find({ order: { lectureOrder: 'ASC' } });
      // Frontend expects { groups: [{ instructor, lecs: [...] }] } with a hasQuiz flag per lecture
      const quizzes = await this.quizRepository.find({ relations: { lecture: true } });
      const quizLectureIds = new Set(
        quizzes.flatMap(q => [q.lectureLegacyId, q.lecture?.id, q.lecture?.legacyId])
          .map(v => (v || '').toString().trim()).filter(Boolean),
      );
      const grouped: Record<string, any[]> = {};
      for (const c of all) {
        const key = (c.instructorTag || '').trim() || 'مشترك للكل';
        const lecId = c.legacyId || c.id;
        (grouped[key] = grouped[key] || []).push({
          id: lecId,
          order: c.lectureOrder || 1,
          name: c.lectureName || '',
          fileType: c.fileType || '',
          driveFileId: c.driveFileId || '',
          pdfFileId: c.pdfFileId || '',
          taskRequired: !!c.taskRequired,
          isLocked: !!c.isLocked,
          hasQuiz: quizLectureIds.has((lecId || '').toString().trim()) || quizLectureIds.has((c.id || '').toString().trim()),
          notes: c.notes || '',
          roundName: c.roundName || '',
          instructorTag: c.instructorTag || '',
        });
      }
      const groups = Object.keys(grouped).map(k => ({ instructor: k, lecs: grouped[k] }));
      return { success: true, groups, grouped };
    } catch {
      return { success: false, groups: [], grouped: {} };
    }
  }

  async manualUnlockLecture(studentId: any, lectureId: any, adminName: string) {
    try {
      const sid = (studentId || '').toString().trim();
      const lid = (lectureId || '').toString().trim();
      if (!sid || !lid) return { success: false, message: 'بيانات ناقصة' };
      const existing = await this.unlockRepository.findOne({ where: { studentId: sid, lectureId: lid } });
      if (existing) return { success: true, message: 'المحاضرة مفتوحة للطالب بالفعل' };
      await this.unlockRepository.save({ studentId: sid, lectureId: lid, unlockedBy: adminName || '' });
      return { success: true, message: '✅ تم فتح المحاضرة للطالب' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ── Quizzes ──

  async saveQuizForLecture(lectureId: any, roundId: any, lectureName: string, questionsArr: any, passScore: any, quizSize?: any) {
    try {
      const content = await this.findContentByAnyId(lectureId);
      const round = roundId ? await this.findRoundByAnyId(roundId) : null;
      const lid = (lectureId || '').toString().trim();

      let quiz = await this.quizRepository.findOne({ where: { lectureLegacyId: lid } });
      if (!quiz && content) quiz = await this.quizRepository.findOne({ where: { lecture: { id: content.id } } });

      if (quiz) {
        quiz.questionsJson = questionsArr || [];
        quiz.passScore = parseInt(passScore) || 0;
        quiz.quizSize = parseInt(quizSize) || null;
        quiz.lectureName = lectureName || quiz.lectureName;
        await this.quizRepository.save(quiz);
      } else {
        await this.quizRepository.save({
          legacyId: 'QZ_' + Date.now(),
          lecture: content || null,
          lectureLegacyId: lid,
          round: round || null,
          roundLegacyId: round?.legacyId || null,
          lectureName: lectureName || '',
          questionsJson: questionsArr || [],
          passScore: parseInt(passScore) || 0,
          quizSize: parseInt(quizSize) || null,
        });
      }
      return { success: true, message: '✅ تم حفظ الكويز' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getQuizForLecture(lectureId: any) {
    try {
      const lid = (lectureId || '').toString().trim();
      let quiz = await this.quizRepository.findOne({ where: { lectureLegacyId: lid } });
      if (!quiz) {
        const content = await this.findContentByAnyId(lid);
        if (content) quiz = await this.quizRepository.findOne({ where: { lecture: { id: content.id } } });
      }
      if (!quiz) return { success: true, quiz: null };
      return {
        success: true,
        quiz: {
          id: quiz.legacyId || quiz.id,
          lectureName: quiz.lectureName || '',
          questions: quiz.questionsJson || [],
          passScore: quiz.passScore || 0,
          quizSize: quiz.quizSize || null,
        },
      };
    } catch (e: any) {
      return { success: false, quiz: null, message: e.message };
    }
  }

  async deleteQuizForLecture(lectureId: any) {
    try {
      const lid = (lectureId || '').toString().trim();
      const quiz = await this.quizRepository.findOne({ where: { lectureLegacyId: lid } });
      if (!quiz) return { success: false, message: 'مفيش كويز للمحاضرة دي' };
      await this.quizRepository.remove(quiz);
      return { success: true, message: '✅ تم حذف الكويز' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async importQuestionsFromBank(lectureId?: any) {
    try {
      if (!lectureId) return { success: false, message: 'حدد المحاضرة الأول' };
      const lid = (lectureId || '').toString().trim();
      const bankRows = await this.quizBankRepository.find({ where: { lectureLegacyId: lid } });
      if (!bankRows.length) return { success: false, message: 'مفيش أسئلة في البنك للمحاضرة دي' };
      const questions = bankRows.map((q) => ({
        q: q.question || '',
        options: [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
        correct: q.correct ?? 0,
      }));
      return { success: true, questions, count: questions.length };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ── Student tasks review (admin side) ──

  async getAllAcadTasks(status?: string) {
    try {
      const where: any = {};
      if (status) where.status = status;
      const tasks = await this.academyTaskRepository.find({
        where,
        relations: { round: true },
        order: { submittedAt: 'DESC' },
        take: 300
      });

      const rounds = await this.roundRepository.find();
      const roundMap = new Map<string, Round>();
      for (const r of rounds) {
        if (r.id) roundMap.set(r.id, r);
        if (r.legacyId) roundMap.set(r.legacyId, r);
      }

      return {
        success: true,
        tasks: tasks.map((t) => {
          const round = t.round || (t.roundLegacyId ? roundMap.get(t.roundLegacyId) : null);
          let rName = round ? round.name : (t.roundLegacyId || '');
          let insName = round ? round.instructorName : '';

          if (rName.toUpperCase().startsWith('INS:')) {
            insName = rName.substring(4).trim();
            rName = rName.substring(4).trim();
          } else if (rName.toLowerCase().startsWith('ins/')) {
            insName = rName.substring(4).trim();
            rName = rName.substring(4).trim();
          }

          return {
            id: t.legacyId || t.id,
            studentName: t.studentName || '',
            lectureName: t.lectureName || '',
            fileName: t.fileName || '',
            driveFileId: t.driveFileId || '',
            submittedAt: t.submittedAt ? new Date(t.submittedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
            status: t.status || 'pending',
            reviewedBy: t.reviewedBy || '',
            reviewNotes: t.reviewNotes || '',
            roundName: rName,
            instructorName: insName,
          };
        }),
      };
    } catch {
      return { success: false, tasks: [] };
    }
  }

  async reviewStudentTask(taskId: any, action: string, reviewerName: string, notes?: string) {
    try {
      const idStr = (taskId || '').toString().trim();
      const task = (await this.academyTaskRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.academyTaskRepository.findOne({ where: { id: idStr } }) : null);
      if (!task) return { success: false, message: 'التاسك مش موجود' };
      
      const isApprove = action === 'approve' || action === 'approved';
      const isPending = action === 'pending';
      const isReject = action === 'rejected' || action === 'reject';
      
      if (isReject && (!notes || !notes.trim())) {
        return { success: false, message: 'يجب تحديد سبب الرفض' };
      }
      
      if (isApprove) {
        task.status = 'approved';
      } else if (isPending) {
        task.status = 'pending';
      } else {
        task.status = 'rejected';
      }
      
      task.reviewedAt = new Date();
      task.reviewedBy = reviewerName || '';
      task.reviewNotes = notes || '';
      await this.academyTaskRepository.save(task);
      
      let msg = '❌ تم رفض التاسك';
      if (isApprove) msg = '✅ تم اعتماد التاسك';
      else if (isPending) msg = '⏳ تم إرجاع التاسك للمراجعة';
      
      return { success: true, message: msg };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  ACADEMY PORTAL: STUDENT CORE (Groups 2, 4, 5, 12, 13 partial)  ═══
  // ═══════════════════════════════════════════════════

  private async notifyAcad(recipientId: string, recipientType: string, type: string, message: string, refId?: string) {
    try {
      await this.notificationRepository.save({
        legacyId: 'NTF_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        recipientId, recipientType, type, message, refId: refId || '', isRead: false, createdAt: new Date(),
      });
    } catch { /* notifications are best-effort */ }
  }

  // Lecture id helper: content rows are addressed by legacyId in the portal
  private contentKey(c: AcademyContent): string {
    return c.legacyId || c.id;
  }

  private async studentWatchedSet(studentId: string): Promise<Set<string>> {
    const rows = await this.progressRepository.find({ relations: { student: true, lecture: true } });
    const set = new Set<string>();
    for (const r of rows) {
      const sid = r.student?.legacyId || r.student?.id || r.studentLegacyId;
      if (sid !== studentId) continue;
      const lid = r.lecture?.legacyId || r.lecture?.id || r.lectureLegacyId;
      if (lid) set.add(lid);
    }
    return set;
  }

  async getStudentDashboard(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = await this.findStudentByAnyId(sess.id) || await this.studentRepository.findOne({ where: { id: sess.id } });
      const studentKey = student?.legacyId || sess.id;
      const stuTag = (student?.instructorTag || '').trim().toLowerCase();
      const isInstructor = sess.role === 'instructor';
      let instructorNormalizedName = '';

      if (isInstructor) {
        const instructor = await this.instructorRepository.findOne({ where: { id: sess.id } }) ||
          await this.instructorRepository.findOne({ where: { legacyId: sess.id } });
        instructorNormalizedName = this.normalizeArabicName(instructor?.name || '');
      }

      const contents = await this.contentRepository.find({ where: { isLocked: false } });
      const watched = await this.studentWatchedSet(studentKey);

      const insGroups: Record<string, { total: number; done: number }> = {};
      const lecIndex: Record<string, any> = {};
      for (const c of contents) {
        const insTag = (c.instructorTag || '').trim() || 'BSA Academy';
        const insTagNormalized = this.normalizeArabicName(insTag);
        
        if (isInstructor) {
          if (insTagNormalized !== instructorNormalizedName) continue;
        } else if (stuTag) {
          const stuTagNormalized = this.normalizeArabicName(stuTag);
          if (insTagNormalized !== stuTagNormalized) continue;
        }

        insGroups[insTag] = insGroups[insTag] || { total: 0, done: 0 };
        insGroups[insTag].total++;
        const key = this.contentKey(c);
        if (watched.has(key)) insGroups[insTag].done++;
        lecIndex[key] = { roundId: 'INS:' + insTag, roundName: insTag, lectureName: c.lectureName || '' };
      }

      let rounds: any[] = [];
      if (isInstructor) {
        rounds = Object.entries(insGroups).map(([tag, g]) => ({
          roundId: 'INS:' + tag, roundName: tag, lecturesTotal: g.total, lecturesDone: g.done,
        }));
      } else {
        const enrollments = await this.enrollmentRepository.find({
          where: { studentLegacyId: studentKey },
          relations: { round: true }
        });
        
        const roundMap = new Map<string, any>();
        for (const e of enrollments) {
          if (!e.round) continue;
          const r = e.round;
          
          const roundInsNormalized = this.normalizeArabicName(r.instructorName || '');
          let totalLectures = 0;
          let doneLectures = 0;
          
          for (const c of contents) {
            const insTagNormalized = this.normalizeArabicName(c.instructorTag || 'BSA Academy');
            if (insTagNormalized === roundInsNormalized) {
              totalLectures++;
              if (watched.has(this.contentKey(c))) doneLectures++;
            }
          }
          
          roundMap.set(r.id, {
            roundId: r.id,
            roundName: r.name,
            lecturesTotal: totalLectures,
            lecturesDone: doneLectures,
          });
        }
        rounds = Array.from(roundMap.values());
        
        if (rounds.length === 0) {
          rounds = Object.entries(insGroups).map(([tag, g]) => ({
            roundId: 'INS:' + tag, roundName: tag, lecturesTotal: g.total, lecturesDone: g.done,
          }));
        } else {
          // Adjust lecIndex round IDs to match real rounds
          for (const c of contents) {
            const key = this.contentKey(c);
            const insTagNormalized = this.normalizeArabicName(c.instructorTag || 'BSA Academy');
            let matchedRound = rounds.find(rd => this.normalizeArabicName(rd.roundName).includes(insTagNormalized) || insTagNormalized.includes(this.normalizeArabicName(rd.roundName)));
            if (!matchedRound && rounds.length > 0) {
              matchedRound = rounds[0];
            }
            if (matchedRound && lecIndex[key]) {
              lecIndex[key].roundId = matchedRound.roundId;
              lecIndex[key].roundName = matchedRound.roundName;
            }
          }
        }
      }

      // Last watched lecture (only for this student)
      const progresses = await this.progressRepository.find({
        where: [
          { student: { id: studentKey } },
          { studentLegacyId: studentKey }
        ],
        relations: { student: true, lecture: true }
      });
      let lastTs: Date | null = null, lastLecId: string | null = null;
      for (const p of progresses) {
        if (!p.watchedAt) continue;
        const ts = new Date(p.watchedAt);
        if (!lastTs || ts > lastTs) { lastTs = ts; lastLecId = p.lecture?.legacyId || p.lecture?.id || p.lectureLegacyId; }
      }
      const lastLecture = lastLecId && lecIndex[lastLecId]
        ? { lectureId: lastLecId, ...lecIndex[lastLecId] }
        : null;

      // Quiz results (only for this student)
      const quizResults = await this.quizResultRepository.find({
        where: [
          { student: { id: studentKey } },
          { studentLegacyId: studentKey }
        ],
        relations: { student: true }
      });
      const totalQuizPassed = quizResults.filter((q) => q.passed).length;

      // Tasks (only for this student)
      const tasks = await this.academyTaskRepository.find({
        where: [
          { student: { id: studentKey } },
          { studentLegacyId: studentKey }
        ],
        relations: { student: true }
      });
      const totalTasksApproved = tasks.filter((t) => (t.status || '') === 'approved').length;

      const totalLecDone = rounds.reduce((s, r) => s + r.lecturesDone, 0);
      const totalPoints = totalLecDone * 10 + totalQuizPassed * 20 + totalTasksApproved * 30;
      return { success: true, rounds, lastLecture, totalQuizPassed, totalTasksApproved, totalPoints };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getStudentRounds(token: string) {
    const dash: any = await this.getStudentDashboard(token);
    if (!dash.success) return { success: false, message: dash.message, rounds: [] };
    const lecturesDone = (dash.rounds || []).reduce((s: number, r: any) => s + r.lecturesDone, 0);
    return { success: true, rounds: dash.rounds, lecturesDone, avgQuiz: 0, totalPoints: dash.totalPoints };
  }

  async getRoundLectures(token: string, roundId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const isInsGroup = roundId && roundId.startsWith('INS:');
      let insFilter = isInsGroup ? roundId.substring(4).trim().toLowerCase() : null;
      let roundName = isInsGroup ? roundId.substring(4) : '';

      if (!isInsGroup) {
        const round = await this.findRoundByAnyId(roundId);
        if (round) {
          insFilter = (round.instructorName || '').trim().toLowerCase();
          roundName = round.name;
        }
      }

      const student = sess.role === 'student'
        ? (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }))
        : null;
      const studentKey = student?.legacyId || sess.id;
      const accessMode = (student?.accessMode || 'sequential').trim() || 'sequential';

      const unlocks = await this.unlockRepository.find({ where: { studentId: studentKey } });
      const unlocksAlt = studentKey !== sess.id ? await this.unlockRepository.find({ where: { studentId: sess.id } }) : [];
      const manualUnlocks = new Set([...unlocks, ...unlocksAlt].map((u) => u.lectureId));

      const contents = await this.contentRepository.find();
      const watched = await this.studentWatchedSet(studentKey);

      // Task status per lecture (approved > pending > rejected)
      const priority: Record<string, number> = { approved: 3, pending: 2, rejected: 1 };
      const tasks = await this.academyTaskRepository.find({
        where: [
          { student: { id: studentKey } },
          { studentLegacyId: studentKey }
        ],
        relations: { student: true, lecture: true }
      });
      // Sort tasks by submittedAt ascending, so newer submissions overwrite older ones
      tasks.sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return aTime - bTime;
      });
      const submittedTasks: Record<string, { status: string; notes: string }> = {};
      for (const t of tasks) {
        const lid = t.lecture?.legacyId || t.lecture?.id || t.lectureLegacyId;
        if (!lid) continue;
        const st = (t.status || '').toString();
        // Since tasks are sorted by submittedAt ascending, newer submissions overwrite older ones
        submittedTasks[lid] = { status: st, notes: t.reviewNotes || '' };
      }

      const quizzes = await this.quizRepository.find({ relations: { lecture: true } });
      const quizExists = new Set(quizzes.map((q) => q.lecture?.legacyId || q.lecture?.id || q.lectureLegacyId).filter(Boolean));

      const results = await this.quizResultRepository.find({
        where: [
          { student: { id: studentKey } },
          { studentLegacyId: studentKey }
        ],
        relations: { student: true, lecture: true }
      });
      const quizPassed = new Set(
        results
          .filter((r) => r.passed)
          .map((r) => r.lecture?.legacyId || r.lecture?.id || r.lectureLegacyId)
          .filter(Boolean),
      );

      const studentSurveys = await this.surveyResponseRepository.find({
        where: [
          { studentId: studentKey },
          { studentId: sess.id }
        ]
      });
      const surveySubmitted = new Set(studentSurveys.map((s) => s.lectureId).filter(Boolean));

      const lectures: any[] = contents
        .filter((c) => {
          if (isInsGroup || insFilter) {
            const tag = ((c.instructorTag || '').trim() || 'BSA Academy').toLowerCase();
            const tagNormalized = this.normalizeArabicName(tag);
            const filterNormalized = this.normalizeArabicName(insFilter || '');
            return tagNormalized === filterNormalized;
          }
          return (c.roundLegacyId || '') === roundId || (c.roundLegacyId || '') === 'ALL';
        })
        .map((c) => {
          const id = this.contentKey(c);
          return {
            id,
            order: c.lectureOrder || 1,
            name: c.lectureName || '',
            driveFileId: c.driveFileId || '',
            fileType: c.fileType || 'video',
            isAdminLocked: !!c.isLocked,
            taskRequired: c.taskRequired !== false,
            notes: c.notes || '',
            instructorTag: c.instructorTag || '',
            hasQuiz: quizExists.has(id),
            pdfFileId: c.pdfFileId || '',
            surveySubmitted: surveySubmitted.has(id)
          };
        })
        .sort((a, b) => a.order - b.order);

      for (let k = 0; k < lectures.length; k++) {
        const lec = lectures[k];
        lec.watched = watched.has(lec.id);
        lec.taskStatus = submittedTasks[lec.id]?.status || null;
        lec.taskFeedback = submittedTasks[lec.id]?.notes || '';
        lec.quizPassed = quizPassed.has(lec.id);

        if (sess.role === 'instructor') { lec.accessible = true; continue; }
        if (manualUnlocks.has(lec.id)) { lec.accessible = true; lec.manualUnlock = true; continue; }
        if (accessMode === 'open') { lec.accessible = true; continue; }
        if (accessMode === 'locked') { lec.accessible = false; lec.lockReason = 'محتاج إذن من الأدمين'; continue; }
        if (accessMode.startsWith('free:')) {
          const freeN = parseInt(accessMode.split(':')[1]) || 0;
          if (k < freeN) { lec.accessible = true; continue; }
        }
        if (lec.isAdminLocked) { lec.accessible = false; lec.lockReason = 'مش متاحة دلوقتي'; continue; }
        if (k === 0) { lec.accessible = true; continue; }
        const prev = lectures[k - 1];
        if (!prev.watched) { lec.accessible = false; lec.lockReason = `اتفرج على "${prev.name}" الأول`; continue; }
        if (prev.taskRequired && prev.taskStatus !== 'approved') {
          lec.accessible = false;
          lec.lockReason = !prev.taskStatus
            ? `ارفع تاسك "${prev.name}" وانتظر موافقة الأدمين`
            : prev.taskStatus === 'pending'
              ? `⏳ تاسك "${prev.name}" في انتظار مراجعة الأدمين`
              : `❌ تاسك "${prev.name}" اترفض — ارفعه تاني بعد التعديل`;
          continue;
        }
        if (prev.hasQuiz && !prev.quizPassed) {
          lec.accessible = false;
          lec.lockReason = `ادي كويز "${prev.name}" وانجح بـ 70% الأول`;
          continue;
        }
        if (!prev.surveySubmitted) {
          lec.accessible = false;
          lec.lockReason = `املأ استبيان "${prev.name}" الأول`;
          continue;
        }
        lec.accessible = true;
      }
      return { success: true, roundName, lectures };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private async markWatched(studentKey: string, lectureId: string) {
    try {
      const existing = await this.progressRepository.find({ relations: { student: true, lecture: true } });
      for (const p of existing) {
        const sid = p.student?.legacyId || p.student?.id || p.studentLegacyId;
        const lid = p.lecture?.legacyId || p.lecture?.id || p.lectureLegacyId;
        if (sid === studentKey && lid === lectureId) return;
      }
      const student = await this.findStudentByAnyId(studentKey);
      const content = await this.findContentByAnyId(lectureId);
      await this.progressRepository.save({
        legacyId: 'PRO_' + Date.now(),
        student: student || null,
        studentLegacyId: studentKey,
        lecture: content || null,
        lectureLegacyId: lectureId,
        watchedAt: new Date(),
        completed: true,
      });
    } catch { /* watch tracking is best-effort */ }
  }

  parseVideoUrlToEmbedUrl(val: string): string {
    const input = (val || '').trim();
    if (!input) return '';
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      return `https://drive.google.com/file/d/${input}/preview`;
    }
    const ytMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&modestbranding=1&rel=0&controls=1&fs=1`;
    }
    const driveMatch1 = input.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch1 && driveMatch1[1]) {
      return `https://drive.google.com/file/d/${driveMatch1[1]}/preview`;
    }
    const driveMatch2 = input.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveMatch2 && driveMatch2[1]) {
      return `https://drive.google.com/file/d/${driveMatch2[1]}/preview`;
    }
    return input;
  }

  async getSecureFileUrl(token: string, lectureId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const content = await this.findContentByAnyId(lectureId);
      if (!content) return { success: false, message: 'المحاضرة مش موجودة' };
      if (content.isLocked) return { success: false, message: 'المحاضرة دي مش متاحة' };

      const videoIds = (content.driveFileId || '').split(',').map((v) => v.trim()).filter(Boolean);
      const pdfIds = (content.pdfFileId || '').split(',').map((v) => v.trim()).filter(Boolean);
      const m2 = (content.notes || '').match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m2 && m2[1] && !videoIds.includes(m2[1])) videoIds.push(m2[1]);

      const urls = videoIds.map((id) => this.parseVideoUrlToEmbedUrl(id));
      const pdfUrls = pdfIds.map((id) => {
        const input = id.trim();
        if (input.startsWith('http://') || input.startsWith('https://')) {
          const m = input.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
          if (m && m[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
          const mId = input.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
          if (mId && mId[1]) return `https://drive.google.com/file/d/${mId[1]}/preview`;
          return input;
        }
        return `https://drive.google.com/file/d/${input}/preview`;
      });
      if (!urls.length && !pdfUrls.length) return { success: false, message: 'لينك الملف مش موجود' };

      if (sess.role === 'student') {
        const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
        await this.markWatched(student?.legacyId || sess.id, this.contentKey(content));
      }
      return { success: true, urls, pdfUrls, url: urls[0] || '', pdfUrl: pdfUrls[0] || '', url2: urls[1] || '', fileType: 'video' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async submitStudentTask(token: string, lectureId: string, roundId: string, lectureName: string, fileName: string, fileBase64: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      if (!student) return { success: false, message: 'الطالب مش موجود' };
      const studentKey = student.legacyId || student.id;

      // Store the uploaded file locally (Drive is gone) — served from /uploads/tasks/
      let fileUrl = '';
      if (fileBase64 && fileName) {
        const dir = path.join(process.cwd(), 'public', 'uploads', 'tasks');
        fs.mkdirSync(dir, { recursive: true });
        const safeName = `${Date.now()}_${fileName.replace(/[^\w.\-؀-ۿ]/g, '_')}`;
        const data = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
        fs.writeFileSync(path.join(dir, safeName), Buffer.from(data, 'base64'));
        fileUrl = '/uploads/tasks/' + safeName;
      }

      const content = await this.findContentByAnyId(lectureId);
      const round = roundId ? await this.roundRepository.findOne({
        where: [
          { id: roundId },
          { legacyId: roundId }
        ]
      }) : null;

      await this.academyTaskRepository.save({
        legacyId: 'TSK_' + Date.now(),
        student,
        studentLegacyId: studentKey,
        studentName: student.name || '',
        round,
        roundLegacyId: round?.legacyId || (roundId || '').toString() || null,
        lecture: content || null,
        lectureLegacyId: (lectureId || '').toString(),
        lectureName: lectureName || content?.lectureName || '',
        driveFileId: fileUrl,
        fileName: fileName || '',
        submittedAt: new Date(),
        status: 'pending',
      });
      return { success: true, message: '✅ تم رفع التاسك — في انتظار مراجعة الأدمين' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getStudentTaskHistory(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      const studentKey = student?.legacyId || sess.id;
      const tasks = await this.academyTaskRepository.find({
        where: [
          { student: { id: studentKey } },
          { studentLegacyId: studentKey }
        ],
        relations: { student: true }
      });
      const mine = tasks
        .map((t) => ({
          id: t.legacyId || t.id,
          lectureId: t.lectureLegacyId || '',
          lectureName: t.lectureName || '',
          roundId: t.roundLegacyId || '',
          fileName: t.fileName || '',
          driveFileId: t.driveFileId || '',
          driveUrl: (t.driveFileId || '').startsWith('/') ? t.driveFileId : (t.driveFileId ? `https://drive.google.com/file/d/${t.driveFileId}/view` : ''),
          submittedAt: t.submittedAt ? new Date(t.submittedAt).toLocaleDateString('en-GB') : '',
          status: t.status || 'pending',
          reviewedAt: t.reviewedAt ? new Date(t.reviewedAt).toLocaleDateString('en-GB') : '',
          reviewerName: t.reviewedBy || '',
          feedback: t.reviewNotes || '',
        }))
        .reverse();
      return { success: true, tasks: mine };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getStudentQuizHistory(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      const studentKey = student?.legacyId || sess.id;
      const results = await this.quizResultRepository.find({ relations: { student: true, lecture: true } });
      const quizzes = results
        .filter((r) => (r.student?.legacyId || r.student?.id || r.studentLegacyId) === studentKey)
        .map((r) => ({
          id: r.legacyId || r.id,
          lectureId: r.lecture?.legacyId || r.lectureLegacyId || '',
          lectureName: r.lecture?.lectureName || '',
          score: Number(r.score) || 0,
          passed: !!r.passed,
          attemptAt: r.attemptAt ? new Date(r.attemptAt).toLocaleDateString('en-GB') : '',
          totalQ: r.totalQ || 0,
          correctQ: r.correctQ || 0,
        }))
        .reverse();
      return { success: true, quizzes };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async submitSupportTicket(token: string, subject: string, message: string, imageBase64?: string, imageName?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      const ticketId = this.genLegacyId();

      let imageUrl = null;
      if (imageBase64 && imageName) {
        const cleanB64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
        const dir = path.join(process.cwd(), 'public', 'uploads', 'support');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const ext = path.extname(imageName) || '.png';
        const safeName = `ticket_${ticketId}_${Date.now()}${ext}`;
        fs.writeFileSync(path.join(dir, safeName), Buffer.from(cleanB64, 'base64'));
        imageUrl = `/uploads/support/${safeName}`;
      }

      await this.academySupportRepository.save({
        legacyId: ticketId,
        student: student || null,
        studentLegacyId: student?.legacyId || sess.id,
        studentName: student?.name || '',
        subject: subject || '',
        message: message || '',
        status: 'open',
        createdAt: new Date(),
        imageUrl: imageUrl || null,
      });

      // Notify BSA team accounts
      const bsaTeam = await this.instructorRepository.find({ where: { isBsa: true, active: true } });
      for (const b of bsaTeam) {
        await this.notifyAcad(b.legacyId || b.id, 'bsa', 'support_ticket', `🎧 طلب دعم جديد من ${student?.name || ''}: ${subject}`, ticketId);
      }

      // Send SMTP Email Notification to Configured Gmail
      try {
        const smtpPass = await this.getSettingValue('smtp_pass');
        const targetEmail = await this.getSettingValue('supportTicketEmail') || 'nour.bsa2025@gmail.com';
        if (smtpPass) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: 'localhost',
            port: 465,
            secure: true,
            auth: { user: 'invoices@b-s-a.co', pass: smtpPass },
            tls: { rejectUnauthorized: false },
          });

          const attachments = [];
          if (imageBase64 && imageName) {
            const b64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
            attachments.push({
              filename: imageName,
              content: Buffer.from(b64, 'base64'),
            });
          }

          const studentPhone = student?.phone || '—';
          const studentEmail = student?.email || '—';
          const studentName = student?.name || '—';

          await transporter.sendMail({
            from: '"BSA Technical Support" <invoices@b-s-a.co>',
            to: targetEmail,
            cc: 'bsa.academy.co.2025@gmail.com',
            bcc: 'bsaofficially@gmail.com',
            subject: `🎧 طلب دعم فني جديد — ${studentName}`,
            html: `
              <div style="direction:rtl;text-align:right;font-family:Tahoma,Arial,sans-serif;padding:15px;line-height:1.6;color:#333;">
                <h2 style="color:#c9a227;border-bottom:2px solid #c9a227;padding-bottom:8px;">🎧 طلب دعم فني جديد</h2>
                <p><b>اسم المتدرب:</b> ${studentName}</p>
                <p><b>رقم الموبايل:</b> ${studentPhone}</p>
                <p><b>اسم المستخدم (الإيميل):</b> ${studentEmail}</p>
                <hr style="border:none;border-top:1px solid #eee;margin:15px 0;">
                <p><b>موضوع المشكلة:</b> ${subject}</p>
                <p><b>تفاصيل المشكلة:</b></p>
                <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:12px;white-space:pre-wrap;">${message}</div>
                ${imageUrl ? `<p style="margin-top:15px;">🔗 <b>رابط الصورة المرفقة:</b> <a href="https://portal.b-s-a.co${imageUrl}" target="_blank">اضغط هنا لمشاهدة الصورة</a></p>` : ''}
                <hr style="border:none;border-top:1px solid #eee;margin:15px 0;">
                <p style="font-size:11px;color:#999;">BSA Academy · نظام الدعم الفني الإلكتروني</p>
              </div>
            `,
            attachments,
          });
          try { transporter.close(); } catch (e) {}
        }
      } catch (mailError) {
        console.error('Failed to send support ticket email:', mailError);
      }

      return { success: true, message: '✅ تم إرسال طلب الدعم بنجاح، سيتواصل معك الفريق قريباً' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getSupportTickets(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    if (!sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const rows = await this.academySupportRepository.find({
        relations: { student: true },
        order: { createdAt: 'DESC' }
      });
      return {
        success: true,
        tickets: rows.map((r) => ({
          id: r.legacyId || r.id,
          studentId: r.studentLegacyId || '',
          studentName: r.studentName || r.student?.name || '',
          studentPhone: r.student?.phone || '',
          studentEmail: r.student?.email || '',
          subject: r.subject || '',
          message: r.message || '',
          status: r.status || 'open',
          imageUrl: r.imageUrl || '',
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '',
          adminReply: r.adminReply || '',
          repliedAt: r.repliedAt ? new Date(r.repliedAt).toLocaleDateString('en-GB') : '',
        })),
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async replyToSupportTicket(token: string, ticketId: any, reply: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    if (!sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const idStr = (ticketId || '').toString().trim();
      const ticket = (await this.academySupportRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.academySupportRepository.findOne({ where: { id: idStr } }) : null);
      if (!ticket) return { success: false, message: 'التذكرة غير موجودة' };
      ticket.status = 'answered';
      ticket.adminReply = reply || '';
      ticket.repliedAt = new Date();
      await this.academySupportRepository.save(ticket);
      if (ticket.studentLegacyId) {
        await this.notifyAcad(
          ticket.studentLegacyId, 'student', 'support_reply',
          `🎧 BSA Team ردّ على طلبك "${ticket.subject}": ${(reply || '').slice(0, 80)}${(reply || '').length > 80 ? '…' : ''}`,
          ticket.legacyId || ticket.id,
        );
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getStudentSupportFiles(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, grouped: [] };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      const tag = (student?.instructorTag || '').trim();
      if (!tag) return { success: true, grouped: [] };
      const res = await this.getSupportFilesCRM(tag);
      return {
        success: true,
        grouped: [
          {
            insName: tag,
            files: res.files || [],
          },
        ],
      };
    } catch {
      return { success: false, grouped: [] };
    }
  }

  async getInstructorSupportFiles(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, files: [] };
    try {
      const idStr = sess.id;
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.instructorRepository.findOne({ where: { id: idStr } }) : null);
      if (!instructor) return { success: true, files: [] };
      return await this.getSupportFilesCRM(instructor.name);
    } catch {
      return { success: false, files: [] };
    }
  }

  async getStudentCertificates(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    // Certificates were never migrated (no Academy_Certificates sheet in the export) — empty for now.
    return { success: true, certificates: [] };
  }

  async getStudentFinancials(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      const oc = (student?.ocCode || '').trim();
      if (!oc) return { success: true, payments: [], noOc: true };

      // نفس آلية القديم: نقرأ من Client_Payments بالـ OC + Payment_Transactions لسجل المدفوعات.
      const normOc = (v: any) => (v || '').toString().trim().toUpperCase().replace(/^OC-?/, '').replace(/^0+/, '');
      const target = normOc(oc);

      // طريقة الدفع: client_payments مافيهاش عمود method — نجيبها من دفتر الحسابات أو عضوية الراوند.
      let method = 'كاش';
      const led = await this.ledgerRepository.findOne({ where: { ocCode: oc } });
      if (led?.paymentMethod) method = led.paymentMethod;
      else {
        const rm = await this.roundMemberRepository.findOne({ where: { ocCode: oc } });
        if (rm?.method) method = rm.method;
      }

      const fmtDate = (d: any) => {
        if (!d) return '';
        const dd = new Date(d);
        if (isNaN(dd.getTime()) || dd.getFullYear() < 2015 || dd.getFullYear() > 2100) return '';
        return `${String(dd.getDate()).padStart(2, '0')}/${String(dd.getMonth() + 1).padStart(2, '0')}/${dd.getFullYear()}`;
      };

      const all = await this.clientPaymentRepository.find({ where: { isDeleted: false } });
      const mine = all.filter((p) => {
        const rowOc = (p.clientLegacyId || '').trim();
        return rowOc.toLowerCase() === oc.toLowerCase() || normOc(rowOc) === target;
      });

      const payments: any[] = [];
      for (const p of mine) {
        const payId = p.legacyId || p.id;
        const total = Number(p.totalAmount) || 0;
        const paid = Number(p.amountPaid) || 0;
        const remRaw = Number(p.amountUnpaid);
        const remaining = isNaN(remRaw) ? total - paid : remRaw;
        const inst1 = Number(p.amountDetail1) || 0;
        const inst2 = Number(p.amountDetail2) || 0;
        const inst3 = Number(p.amountDetail3) || 0;
        const payType = (inst2 > 0 || inst3 > 0) ? 'installments'
          : (inst1 > 0 && total > 0 && Math.abs(inst1 - total) < 1 ? 'cash_full' : (total > 0 ? 'installments' : 'cash_full'));

        const txs = await this.transactionRepository.find({
          where: [{ legacyPaymentId: payId }, { payment: { id: p.id } }],
        });
        const transactions = txs
          .filter((t) => (Number(t.amount) || 0) > 0)
          .map((t) => ({ amount: Number(t.amount) || 0, date: fmtDate(t.date), type: t.type || '', method }))
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        payments.push({
          payId,
          course: p.course || '',
          roundName: p.roundName || '',
          total, paid, remaining: remaining < 0 ? 0 : remaining,
          status: p.status || '',
          nextDue: remaining > 0 ? fmtDate(p.paymentTime) : '',
          createdAt: fmtDate(p.createdAt),
          inst1, inst2, inst3, payType,
          paymentMethod: transactions.length ? transactions[0].method : method,
          transactions,
        });
      }

      // نفس القديم: لو نفس الكورس ليه سجل راوند، اخفِ سجل "الانتظار" بدون راوند (عرض فقط).
      const hasRoundCourse: Record<string, boolean> = {};
      for (const p of payments) if ((p.roundName || '').trim()) hasRoundCourse[(p.course || '').trim().toLowerCase()] = true;
      const filtered = payments.filter((p) => {
        const c = (p.course || '').trim().toLowerCase();
        if (!(p.roundName || '').trim() && hasRoundCourse[c]) return false;
        return true;
      });

      return { success: true, payments: filtered, ocCode: oc };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getMentionableUsers(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, users: [] };
    try {
      const instructors = await this.instructorRepository.find({ where: { active: true } });
      return {
        success: true,
        users: instructors.filter((i) => (i.name || '').trim()).map((i) => ({ name: i.name.trim(), type: i.isBsa ? 'bsa' : 'instructor' })),
      };
    } catch {
      return { success: true, users: [] };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  ACADEMY SOCIAL: NOTIFICATIONS / FRIENDS / DMs / COMMUNITY / COMMENTS  ═══
  // ═══════════════════════════════════════════════════

  // Resolve the display info (name + pic + author type) for any academy session user
  private async acadUserInfo(sess: { id: string; role: string; isBsa: boolean }) {
    if (sess.role === 'instructor') {
      const ins = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      return { key: ins?.legacyId || sess.id, name: ins?.name || 'محاضر', pic: ins?.profilePic || '', authorType: ins?.isBsa || sess.isBsa ? 'bsa' : 'instructor' };
    }
    const stu = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
    return { key: stu?.legacyId || sess.id, name: stu?.name || 'طالب', pic: stu?.profilePic || '', authorType: 'student' };
  }

  private async acadPicMap(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const students = await this.studentRepository.find();
    for (const s of students) if (s.profilePic) map.set(s.legacyId || s.id, s.profilePic);
    const instructors = await this.instructorRepository.find();
    for (const i of instructors) if (i.profilePic) map.set(i.legacyId || i.id, i.profilePic);
    return map;
  }

  // ── Notifications ──

  async getMyNotifications(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, notifications: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const rows = await this.notificationRepository.find({
        where: [{ recipientId: me.key }, { recipientId: sess.id }],
        order: { createdAt: 'DESC' },
        take: 60,
      });
      return {
        success: true,
        notifications: rows.map((n) => ({
          id: n.legacyId || n.id,
          type: n.type || '',
          message: n.message || '',
          refId: n.refId || '',
          isRead: !!n.isRead,
          createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : '',
        })),
        unread: rows.filter((n) => !n.isRead).length,
      };
    } catch {
      return { success: false, notifications: [] };
    }
  }

  async markNotifRead(token: string, notifId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false };
    try {
      const idStr = (notifId || '').toString().trim();
      const n = (await this.notificationRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.notificationRepository.findOne({ where: { id: idStr } }) : null);
      if (n) { n.isRead = true; await this.notificationRepository.save(n); }
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async markAllNotifsRead(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false };
    try {
      const me = await this.acadUserInfo(sess);
      await this.notificationRepository
        .createQueryBuilder()
        .update()
        .set({ isRead: true })
        .where('recipientId IN (:...ids)', { ids: [me.key, sess.id] })
        .execute();
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async getNotifTarget(token: string, notifId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false };
    try {
      const idStr = (notifId || '').toString().trim();
      const n = (await this.notificationRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.notificationRepository.findOne({ where: { id: idStr } }) : null);
      if (!n) return { success: false };
      return { success: true, type: n.type || '', refId: n.refId || '' };
    } catch {
      return { success: false };
    }
  }

  async isUserOnline(token: string, userId: string) {
    // Presence tracking wasn't persisted in the legacy system either — report offline-unknown.
    return { success: true, online: false };
  }

  // ── Friends ──

  async sendFriendRequest(token: string, friendId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const target = (friendId || '').toString().trim();
      if (!target || target === me.key) return { success: false, message: 'طلب غير صالح' };
      const existing = await this.friendRepository.findOne({
        where: [
          { userLegacyId: me.key, friendLegacyId: target },
          { userLegacyId: target, friendLegacyId: me.key },
        ],
      });
      if (existing) {
        return { success: false, message: existing.status === 'accepted' ? 'انتوا أصحاب بالفعل' : 'في طلب صداقة معلق بالفعل' };
      }
      await this.friendRepository.save({ userLegacyId: me.key, friendLegacyId: target, status: 'pending', createdAt: new Date() });
      await this.notifyAcad(target, 'student', 'friend_request', `👋 ${me.name} بعتلك طلب صداقة`, me.key);
      return { success: true, message: '✅ تم إرسال طلب الصداقة' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async acceptFriendRequest(token: string, requesterId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const req = await this.friendRepository.findOne({
        where: { userLegacyId: (requesterId || '').trim(), friendLegacyId: me.key, status: 'pending' },
      });
      if (!req) return { success: false, message: 'الطلب مش موجود' };
      req.status = 'accepted';
      await this.friendRepository.save(req);
      await this.notifyAcad(req.userLegacyId, 'student', 'friend_accept', `🤝 ${me.name} قبل طلب صداقتك`, me.key);
      return { success: true, message: '✅ بقيتوا أصحاب' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async removeFriend(token: string, friendId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const target = (friendId || '').toString().trim();
      const rows = await this.friendRepository.find({
        where: [
          { userLegacyId: me.key, friendLegacyId: target },
          { userLegacyId: target, friendLegacyId: me.key },
        ],
      });
      if (!rows.length) return { success: false, message: 'مش موجود' };
      await this.friendRepository.remove(rows);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getFriends(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, friends: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const rows = await this.friendRepository.find({
        where: [
          { userLegacyId: me.key, status: 'accepted' },
          { friendLegacyId: me.key, status: 'accepted' },
        ],
      });
      const ids = rows.map((r) => (r.userLegacyId === me.key ? r.friendLegacyId : r.userLegacyId)).filter(Boolean);
      const friends: any[] = [];
      for (const fid of ids) {
        const stu = await this.findStudentByAnyId(fid);
        if (stu) friends.push({ id: fid, name: stu.name || '', pic: stu.profilePic || '', online: false });
      }
      return { success: true, friends };
    } catch {
      return { success: false, friends: [] };
    }
  }

  async getPendingRequests(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, requests: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const rows = await this.friendRepository.find({ where: { friendLegacyId: me.key, status: 'pending' } });
      const requests: any[] = [];
      for (const r of rows) {
        const stu = await this.findStudentByAnyId(r.userLegacyId);
        requests.push({ id: r.userLegacyId, name: stu?.name || 'طالب', pic: stu?.profilePic || '' });
      }
      return { success: true, requests };
    } catch {
      return { success: false, requests: [] };
    }
  }

  async searchAcadUsers(token: string, query: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, users: [] };
    try {
      const q = (query || '').trim().toLowerCase();
      if (!q || q.length < 2) return { success: true, users: [] };
      const me = await this.acadUserInfo(sess);
      const students = await this.studentRepository
        .createQueryBuilder('s')
        .where('s.active = true')
        .andWhere('(LOWER(s.name) LIKE :q OR LOWER(s.email) LIKE :q)', { q: `%${q}%` })
        .take(15)
        .getMany();
      return {
        success: true,
        users: students
          .filter((s) => (s.legacyId || s.id) !== me.key)
          .map((s) => ({ id: s.legacyId || s.id, name: s.name || '', pic: s.profilePic || '', type: 'student' })),
      };
    } catch {
      return { success: false, users: [] };
    }
  }

  // ── Direct messages ──

  async sendDMMessage(token: string, toId: string, message: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const target = (toId || '').toString().trim();
      if (!target || !(message || '').trim()) return { success: false, message: 'رسالة فارغة' };
      const toStu = await this.findStudentByAnyId(target);
      await this.dmRepository.save({
        legacyMsgId: 'DM_' + Date.now(),
        fromId: me.key,
        fromName: me.name,
        toId: target,
        toName: toStu?.name || '',
        message: message.trim(),
        timestamp: new Date(),
      });
      await this.notifyAcad(target, 'student', 'dm', `💬 رسالة جديدة من ${me.name}`, me.key);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getConversations(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, conversations: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const msgs = await this.dmRepository.find({ order: { timestamp: 'DESC' }, take: 500 });
      const convMap = new Map<string, any>();
      for (const m of msgs) {
        if (m.fromId !== me.key && m.toId !== me.key) continue;
        const other = m.fromId === me.key ? m.toId : m.fromId;
        const otherName = m.fromId === me.key ? m.toName : m.fromName;
        if (!convMap.has(other)) {
          convMap.set(other, {
            userId: other,
            name: otherName || 'مستخدم',
            lastMessage: m.message || '',
            lastAt: m.timestamp ? new Date(m.timestamp).toISOString() : '',
            unread: 0,
          });
        }
        if (m.toId === me.key && !m.readAt) convMap.get(other).unread++;
      }
      const pics = await this.acadPicMap();
      const conversations = [...convMap.values()].map((c) => ({ ...c, pic: pics.get(c.userId) || '' }));
      return { success: true, conversations };
    } catch {
      return { success: false, conversations: [] };
    }
  }

  async getDMHistoryNorm(token: string, otherId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, messages: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const other = (otherId || '').toString().trim();
      const msgs = await this.dmRepository.find({
        where: [
          { fromId: me.key, toId: other },
          { fromId: other, toId: me.key },
        ],
        order: { timestamp: 'ASC' },
      });
      return {
        success: true,
        messages: msgs.map((m) => ({
          id: m.legacyMsgId || m.id,
          fromId: m.fromId,
          fromName: m.fromName || '',
          message: m.message || '',
          timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : '',
          mine: m.fromId === me.key,
          read: !!m.readAt,
        })),
      };
    } catch {
      return { success: false, messages: [] };
    }
  }

  async getDMHistorySince(token: string, otherId: string, sinceIso?: string) {
    const res: any = await this.getDMHistoryNorm(token, otherId);
    if (!res.success || !sinceIso) return res;
    const since = new Date(sinceIso).getTime();
    return { success: true, messages: res.messages.filter((m: any) => new Date(m.timestamp).getTime() > since) };
  }

  async markDMsRead(token: string, otherId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false };
    try {
      const me = await this.acadUserInfo(sess);
      await this.dmRepository
        .createQueryBuilder()
        .update()
        .set({ readAt: new Date() })
        .where('toId = :me AND fromId = :other AND readAt IS NULL', { me: me.key, other: (otherId || '').trim() })
        .execute();
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // ── Community & lecture comments ──

  private async decoratePosts(posts: AcademyPost[], meKey: string) {
    const pics = await this.acadPicMap();
    const ids = posts.map((p) => p.legacyId || p.id);
    const reactions = ids.length
      ? await this.reactionRepository.createQueryBuilder('r').where('r.itemId IN (:...ids)', { ids }).getMany()
      : [];

    const reactionsByItem = new Map<string, AcademyReaction[]>();
    for (const r of reactions) {
      if (!reactionsByItem.has(r.itemId)) {
        reactionsByItem.set(r.itemId, []);
      }
      reactionsByItem.get(r.itemId)!.push(r);
    }

    return posts.map((p) => {
      const key = p.legacyId || p.id;
      const itemReactions = reactionsByItem.get(key) || [];
      
      const reactionCounts: Record<string, number> = {};
      let myReaction = '';
      for (const r of itemReactions) {
        const type = r.reactionType || 'like';
        reactionCounts[type] = (reactionCounts[type] || 0) + 1;
        if (r.userId === meKey) {
          myReaction = type;
        }
      }

      return {
        id: key,
        authorId: p.authorId || '',
        authorType: p.authorType || 'student',
        authorName: p.authorName || '',
        authorPic: pics.get(p.authorId || '') || '',
        content: p.content || '',
        parentId: p.legacyParentId || '',
        likes: itemReactions.length || p.likeCount || 0,
        reactionCounts,
        myReaction,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      };
    });
  }

  async postCommunityMessage(token: string, content: string, parentId?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      if (!(content || '').trim()) return { success: false, message: 'اكتب حاجة الأول' };
      const me = await this.acadUserInfo(sess);
      await this.postRepository.save({
        legacyId: 'POST_' + Date.now(),
        contextType: 'community',
        authorId: me.key,
        authorType: me.authorType,
        authorName: me.name,
        content: content.trim(),
        legacyParentId: (parentId || '').toString().trim() || null,
        likeCount: 0,
        createdAt: new Date(),
        deleted: false,
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getCommunityFeed(token: string, limit?: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, posts: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const posts = await this.postRepository.find({
        where: { contextType: 'community', deleted: false },
        order: { createdAt: 'DESC' },
        take: parseInt(limit) || 100,
      });
      return { success: true, posts: await this.decoratePosts(posts, me.key) };
    } catch {
      return { success: false, posts: [] };
    }
  }

  async checkCommunityNew(token: string, sinceIso?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, hasNew: false, newPosts: [] };
    try {
      if (!sinceIso) return { success: true, hasNew: false, newPosts: [] };
      const me = await this.acadUserInfo(sess);
      const posts = await this.postRepository
        .createQueryBuilder('p')
        .where("p.contextType = 'community' AND p.deleted = false")
        .andWhere('p.createdAt > :since', { since: new Date(sinceIso) })
        .orderBy('p.createdAt', 'DESC')
        .getMany();
      const decorated = await this.decoratePosts(posts, me.key);
      return { success: true, hasNew: posts.length > 0, newPosts: decorated };
    } catch {
      return { success: false, hasNew: false, newPosts: [] };
    }
  }

  async deleteCommunityPost(token: string, postId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const idStr = (postId || '').toString().trim();
      const post = (await this.postRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.postRepository.findOne({ where: { id: idStr } }) : null);
      if (!post) return { success: false, message: 'البوست مش موجود' };
      if (post.authorId !== me.key && !sess.isBsa && sess.role !== 'instructor') {
        return { success: false, message: 'غير مصرح' };
      }
      post.deleted = true;
      await this.postRepository.save(post);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async postComment(token: string, lectureId: string, content: string, parentId?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      if (!(content || '').trim()) return { success: false, message: 'اكتب تعليق الأول' };
      const me = await this.acadUserInfo(sess);
      const content_ = content.trim();
      const lid = (lectureId || '').toString().trim();
      const lecture = await this.findContentByAnyId(lid);
      await this.postRepository.save({
        legacyId: 'CMT_' + Date.now(),
        contextType: 'lecture',
        lecture: lecture || null,
        lectureLegacyId: lid,
        authorId: me.key,
        authorType: me.authorType,
        authorName: me.name,
        content: content_,
        legacyParentId: (parentId || '').toString().trim() || null,
        likeCount: 0,
        createdAt: new Date(),
        deleted: false,
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteComment(token: string, commentId: any) {
    return this.deleteCommunityPost(token, commentId);
  }

  async getLectureComments(token: string, lectureId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, comments: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const lid = (lectureId || '').toString().trim();
      const posts = await this.postRepository.find({
        where: { contextType: 'lecture', lectureLegacyId: lid, deleted: false },
        order: { createdAt: 'ASC' },
      });
      return { success: true, comments: await this.decoratePosts(posts, me.key) };
    } catch {
      return { success: false, comments: [] };
    }
  }

  async getInstructorLectureComments(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, comments: [] };
    try {
      const me = await this.acadUserInfo(sess);
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      const tag = this.normalizeArabicName(instructor?.name || '');
      const lectures = await this.contentRepository.find();
      const myLectureIds = new Set(
        lectures
          .filter((c) => !tag || (this.normalizeArabicName(c.instructorTag || '') === tag))
          .map((c) => this.contentKey(c)),
      );
      const posts = await this.postRepository.find({
        where: { contextType: 'lecture', deleted: false },
        order: { createdAt: 'DESC' },
        take: 200,
      });
      const lecNames = new Map(lectures.map((c) => [this.contentKey(c), c.lectureName || '']));
      const mine = posts.filter((p) => myLectureIds.has(p.lectureLegacyId || ''));
      const decorated = await this.decoratePosts(mine, me.key);
      return {
        success: true,
        comments: decorated.map((d, i) => ({ ...d, lectureId: mine[i].lectureLegacyId || '', lectureName: lecNames.get(mine[i].lectureLegacyId || '') || '' })),
      };
    } catch {
      return { success: false, comments: [] };
    }
  }

  async reactToItem(token: string, itemType: string, itemId: string, reactionType?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false };
    try {
      const me = await this.acadUserInfo(sess);
      const iid = (itemId || '').toString().trim();
      const rType = (reactionType || 'like').trim().toLowerCase();
      const existing = await this.reactionRepository.findOne({ where: { itemId: iid, userId: me.key } });
      
      let updatedReaction = '';
      if (existing) {
        if (existing.reactionType === rType) {
          // Toggle off
          await this.reactionRepository.remove(existing);
        } else {
          // Change reaction type
          existing.reactionType = rType;
          await this.reactionRepository.save(existing);
          updatedReaction = rType;
        }
      } else {
        // Add new reaction
        await this.reactionRepository.save({
          legacyId: 'RCT_' + Date.now(),
          itemType: itemType || 'post',
          itemId: iid,
          userId: me.key,
          reactionType: rType,
          createdAt: new Date(),
        });
        updatedReaction = rType;
      }

      // Query updated counts for this item
      const allReactions = await this.reactionRepository.find({ where: { itemId: iid } });
      const reactionCounts: Record<string, number> = {};
      for (const r of allReactions) {
        const type = r.reactionType || 'like';
        reactionCounts[type] = (reactionCounts[type] || 0) + 1;
      }

      return {
        success: true,
        myReaction: updatedReaction,
        reactionCounts,
      };
    } catch {
      return { success: false };
    }
  }

  async getClassLeaderboard(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, leaderboard: [] };
    try {
      const students = await this.studentRepository.find({ where: { active: true } });
      const progresses = await this.progressRepository.find({ relations: { student: true } });
      const results = await this.quizResultRepository.find({ relations: { student: true } });
      const tasks = await this.academyTaskRepository.find({ relations: { student: true } });

      const keyOf = (rel: any, legacy: string | null) => rel?.legacyId || rel?.id || legacy || '';
      const lecDone = new Map<string, number>();
      for (const p of progresses) {
        const k = keyOf(p.student, p.studentLegacyId);
        lecDone.set(k, (lecDone.get(k) || 0) + 1);
      }
      const quizPassed = new Map<string, number>();
      for (const r of results) {
        if (!r.passed) continue;
        const k = keyOf(r.student, r.studentLegacyId);
        quizPassed.set(k, (quizPassed.get(k) || 0) + 1);
      }
      const tasksApproved = new Map<string, number>();
      for (const t of tasks) {
        if ((t.status || '') !== 'approved') continue;
        const k = keyOf(t.student, t.studentLegacyId);
        tasksApproved.set(k, (tasksApproved.get(k) || 0) + 1);
      }

      const leaderboard = students
        .map((s) => {
          const k = s.legacyId || s.id;
          const points = (lecDone.get(k) || 0) * 10 + (quizPassed.get(k) || 0) * 20 + (tasksApproved.get(k) || 0) * 30;
          return { id: k, name: s.name || '', pic: s.profilePic || '', points, lectures: lecDone.get(k) || 0, quizzes: quizPassed.get(k) || 0, tasks: tasksApproved.get(k) || 0 };
        })
        .filter((s) => s.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 20);
      return { success: true, leaderboard };
    } catch {
      return { success: false, leaderboard: [] };
    }
  }

  async getClassActivity(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, activity: [] };
    try {
      const tasks = await this.academyTaskRepository.find({ order: { submittedAt: 'DESC' }, take: 15 });
      const results = await this.quizResultRepository.find({ relations: { student: true, lecture: true }, order: { attemptAt: 'DESC' }, take: 15 });
      const activity: any[] = [];
      for (const t of tasks) {
        if (!t.submittedAt) continue;
        activity.push({ type: 'task', name: t.studentName || '', detail: `رفع تاسك "${t.lectureName || ''}"`, at: new Date(t.submittedAt).toISOString() });
      }
      for (const r of results) {
        if (!r.attemptAt || !r.passed) continue;
        activity.push({ type: 'quiz', name: r.student?.name || '', detail: `نجح في كويز "${r.lecture?.lectureName || ''}"`, at: new Date(r.attemptAt).toISOString() });
      }
      activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      return { success: true, activity: activity.slice(0, 20) };
    } catch {
      return { success: false, activity: [] };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  ACADEMY: QUIZZES / LIVE SESSIONS / FINAL PROJECT / STORIES / INSTRUCTOR  ═══
  // ═══════════════════════════════════════════════════

  private async quizForLectureInternal(lectureId: string): Promise<AcademyQuiz | null> {
    const lid = (lectureId || '').toString().trim();
    let quiz = await this.quizRepository.findOne({ where: { lectureLegacyId: lid } });
    if (!quiz) {
      const content = await this.findContentByAnyId(lid);
      if (content) quiz = await this.quizRepository.findOne({ where: { lecture: { id: content.id } } });
    }
    return quiz;
  }

  async getStudentQuiz(token: string, lectureId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const quiz = await this.quizForLectureInternal(lectureId);
      if (!quiz || !Array.isArray(quiz.questionsJson) || !quiz.questionsJson.length) {
        return { success: false, message: 'مفيش كويز لهذه المحاضرة' };
      }

      const results = await this.quizResultRepository.find({ relations: { student: true } });
      const alreadyPassed = results.some((r) =>
        (r.student?.legacyId || r.student?.id || r.studentLegacyId) === me.key &&
        (r.lectureLegacyId || '') === (lectureId || '').toString() && r.passed,
      );

      // Fisher-Yates shuffle then pick quizSize questions; correct answers stay server-side only
      const allQ = [...quiz.questionsJson];
      for (let s = allQ.length - 1; s > 0; s--) {
        const r = Math.floor(Math.random() * (s + 1));
        [allQ[s], allQ[r]] = [allQ[r], allQ[s]];
      }
      const selected = allQ.slice(0, Math.min(quiz.quizSize || 20, allQ.length));
      const attemptId = 'QA_' + Date.now() + '_' + Math.floor(Math.random() * 1e9);
      const student = await this.findStudentByAnyId(me.key);
      await this.quizAttemptRepository.save({
        legacyAttemptId: attemptId,
        student: student || null,
        studentLegacyId: me.key,
        lectureLegacyId: (lectureId || '').toString(),
        questionsJson: selected,
        createdAt: new Date(),
        status: 'pending',
      });
      const safeQ = selected.map((q: any, idx: number) => ({ idx, q: q.q, options: q.options }));
      return { success: true, questions: safeQ, passScore: quiz.passScore || 70, totalQ: safeQ.length, alreadyPassed, attemptId };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async submitQuizAnswers(token: string, lectureId: string, answersArr: any[], attemptId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      if (!attemptId) return { success: false, message: 'انتهت صلاحية المحاولة — من فضلك ابدأ الكويز من جديد' };

      const attempt = await this.quizAttemptRepository.findOne({ where: { legacyAttemptId: attemptId, studentLegacyId: me.key } });
      if (!attempt) return { success: false, message: 'خطأ: محاولة غير صالحة' };

      const questions: any[] = Array.isArray(attempt.questionsJson) ? attempt.questionsJson : [];
      attempt.status = 'scored';
      attempt.answersJson = answersArr || [];
      await this.quizAttemptRepository.save(attempt);

      const quiz = await this.quizForLectureInternal(lectureId);
      const passScore = quiz?.passScore || 70;
      let correct = 0;
      for (let i = 0; i < questions.length; i++) {
        if (parseInt(answersArr?.[i]) === parseInt(questions[i].correct)) correct++;
      }
      const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
      const passed = score >= passScore;

      const student = await this.findStudentByAnyId(me.key);
      const content = await this.findContentByAnyId(lectureId);
      await this.quizResultRepository.save({
        legacyId: 'QR_' + Date.now(),
        student: student || null,
        studentLegacyId: me.key,
        lecture: content || null,
        lectureLegacyId: (lectureId || '').toString(),
        score,
        passed,
        attemptAt: new Date(),
        totalQ: questions.length,
        correctQ: correct,
      });
      const msg = passed
        ? `🎉 أحسنت! إجابتك صح ${correct}/${questions.length} — درجتك ${score}% — المحاضرة الجاية اتفتحت!`
        : `😕 درجتك ${score}% — محتاج ${passScore}% عشان تعدي — حاول تاني`;
      // review: correct answers per question (safe to reveal — the attempt is scored now)
      const review = questions.map((q: any) => ({ correct: parseInt(q.correct) }));
      return { success: true, score, passed, correct, total: questions.length, review, message: msg };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private async buildQuizReview(studentKey: string, lectureId: string) {
    const attempts = await this.quizAttemptRepository.find({
      where: { studentLegacyId: studentKey, lectureLegacyId: (lectureId || '').toString(), status: 'scored' },
      order: { createdAt: 'DESC' },
    });
    const attempt = attempts[0];
    if (!attempt) return { success: false, questions: [] };
    const questions: any[] = Array.isArray(attempt.questionsJson) ? attempt.questionsJson : [];
    const answers: any[] = Array.isArray(attempt.answersJson) ? attempt.answersJson : [];
    return {
      success: true,
      questions: questions.map((q: any, i: number) => ({
        q: q.q,
        options: q.options,
        correct: parseInt(q.correct),
        chosen: answers[i] !== undefined ? parseInt(answers[i]) : null,
        isCorrect: parseInt(answers[i]) === parseInt(q.correct),
      })),
    };
  }

  async getStudentQuizReview(token: string, lectureId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, questions: [] };
    const me = await this.acadUserInfo(sess);
    return this.buildQuizReview(me.key, lectureId);
  }

  async getInstructorQuizReview(token: string, studentId: string, lectureId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, questions: [], message: 'مش محاضر' };
    return this.buildQuizReview((studentId || '').toString().trim(), lectureId);
  }

  async getInstructorStudentQuizResults(token: string, lectureId?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, results: [] };
    try {
      const results = await this.quizResultRepository.find({ relations: { student: true, lecture: true }, order: { attemptAt: 'DESC' }, take: 300 });
      const filtered = lectureId
        ? results.filter((r) => (r.lectureLegacyId || '') === (lectureId || '').toString())
        : results;
      return {
        success: true,
        results: filtered.map((r) => ({
          studentId: r.student?.legacyId || r.studentLegacyId || '',
          studentName: r.student?.name || '',
          lectureId: r.lectureLegacyId || '',
          lectureName: r.lecture?.lectureName || '',
          score: Number(r.score) || 0,
          passed: !!r.passed,
          attemptAt: r.attemptAt ? new Date(r.attemptAt).toLocaleDateString('en-GB') : '',
        })),
      };
    } catch {
      return { success: false, results: [] };
    }
  }

  // ── Live sessions ──

  async addLiveSession(adminToken: string, payload: any) {
    const sess = await this.validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    try {
      const round = payload?.roundId ? await this.findRoundByAnyId(payload.roundId) : null;
      const id = 'LS_' + Date.now();
      await this.liveSessionRepository.save({
        legacySessionId: id,
        round: round || null,
        roundLegacyId: (payload?.roundId || '').toString() || null,
        roundName: payload?.roundName || round?.name || '',
        title: payload?.title || '',
        meetLink: payload?.meetLink || '',
        platform: payload?.platform || '',
        startTime: payload?.startTime ? new Date(payload.startTime) : null,
        endTime: payload?.endTime ? new Date(payload.endTime) : null,
        createdBy: sess.id,
        createdAt: new Date(),
      });
      return { success: true, message: '✅ تم إنشاء الجلسة', id };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteLiveSession(adminToken: string, sessionId: any) {
    const sess = await this.validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    try {
      const idStr = (sessionId || '').toString().trim();
      const row = (await this.liveSessionRepository.findOne({ where: { legacySessionId: idStr } })) ||
        (idStr.length === 36 ? await this.liveSessionRepository.findOne({ where: { id: idStr } }) : null);
      if (!row) return { success: false, message: 'الجلسة مش موجودة' };
      await this.liveSessionRepository.remove(row);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private mapLiveSession(s: LiveSession) {
    return {
      id: s.legacySessionId || s.id,
      roundId: s.roundLegacyId || '',
      roundName: s.roundName || '',
      title: s.title || '',
      meetLink: s.meetLink || '',
      platform: s.platform || '',
      startTime: s.startTime ? new Date(s.startTime).toISOString() : '',
      endTime: s.endTime ? new Date(s.endTime).toISOString() : '',
      createdBy: s.createdBy || '',
    };
  }

  async getAllLiveSessions(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, sessions: [] };
    const rows = await this.liveSessionRepository.find({ order: { startTime: 'DESC' }, take: 100 });
    return { success: true, sessions: rows.map((s) => this.mapLiveSession(s)) };
  }

  async getLiveSessionsByRounds(userToken: string) {
    const sess = await this.validateAcadSession(userToken);
    if (!sess) return { success: false, sessions: [] };
    try {
      // A student sees the sessions of the rounds they're enrolled in; instructors see everything.
      const rows = await this.liveSessionRepository.find({ order: { startTime: 'DESC' }, take: 100 });
      if (sess.role === 'instructor') return { success: true, sessions: rows.map((s) => this.mapLiveSession(s)) };
      const me = await this.acadUserInfo(sess);
      const enrollments = await this.enrollmentRepository.find({ relations: { student: true, round: true } });
      const myRounds = new Set(
        enrollments
          .filter((e) => (e.student?.legacyId || e.student?.id || e.studentLegacyId) === me.key && e.status !== 'removed')
          .flatMap((e) => [e.roundLegacyId || '', e.round?.legacyId || '', e.round?.id || ''])
          .filter(Boolean),
      );
      const mine = rows.filter((s) => !s.roundLegacyId || myRounds.has(s.roundLegacyId));
      return { success: true, sessions: mine.map((s) => this.mapLiveSession(s)) };
    } catch {
      return { success: false, sessions: [] };
    }
  }

  async getLastLiveSessionForRound(token: string, roundId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, session: null };
    try {
      const rows = await this.liveSessionRepository.find({
        where: { roundLegacyId: (roundId || '').toString().trim() },
        order: { startTime: 'DESC' },
        take: 1,
      });
      return { success: true, session: rows.length ? this.mapLiveSession(rows[0]) : null };
    } catch {
      return { success: false, session: null };
    }
  }

  async joinLiveSession(userToken: string, sessionId: any) {
    const sess = await this.validateAcadSession(userToken);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const idStr = (sessionId || '').toString().trim();
      const row = (await this.liveSessionRepository.findOne({ where: { legacySessionId: idStr } })) ||
        (idStr.length === 36 ? await this.liveSessionRepository.findOne({ where: { id: idStr } }) : null);
      if (!row) return { success: false, message: 'الجلسة مش موجودة' };
      // Log join for the attendees list
      const me = await this.acadUserInfo(sess);
      const joins = JSON.parse((await this.getSettingValue('live_joins_' + (row.legacySessionId || row.id))) || '[]');
      if (!joins.some((j: any) => j.id === me.key)) {
        joins.push({ id: me.key, name: me.name, at: new Date().toISOString() });
        await this.setSettingValue('live_joins_' + (row.legacySessionId || row.id), JSON.stringify(joins));
      }
      return { success: true, meetLink: row.meetLink || '' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getLiveSessionAttendees(token: string, sessionId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, attendees: [] };
    try {
      const attendees = JSON.parse((await this.getSettingValue('live_joins_' + (sessionId || '').toString().trim())) || '[]');
      return { success: true, attendees };
    } catch {
      return { success: false, attendees: [] };
    }
  }

  async getAttendSessionPreview(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, session: null };
    try {
      // Open QR attendance session (from the CRM attendance page)
      const sessions = JSON.parse((await this.getSettingValue('att_sessions')) || '{}');
      const list = Object.values(sessions) as any[];
      if (!list.length) return { success: true, session: null };
      const latest = list.sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0))[0];
      const round = await this.findRoundByAnyId(latest.roundId);
      return { success: true, session: { ...latest, roundName: round?.name || '' } };
    } catch {
      return { success: false, session: null };
    }
  }

  async qrCheckInAuto(userToken: string) {
    const sess = await this.validateAcadSession(userToken);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
      if (!student) return { success: false, message: 'الطالب مش موجود' };
      const sessions = JSON.parse((await this.getSettingValue('att_sessions')) || '{}');
      const list = Object.values(sessions) as any[];
      if (!list.length) return { success: false, message: 'مفيش جلسة حضور مفتوحة دلوقتي' };
      const latest = list.sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0))[0];
      const res: any = await this.saveAttendanceData(latest.roundId, student.phone || '', student.name || '', latest.lectureNum, 'attendance', true);
      if (res.success) return { success: true, message: `✅ تم تسجيل حضورك — محاضرة ${latest.lectureNum}`, lectureNum: latest.lectureNum };
      return res;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ── Final project ──

  private chunkDir(): string {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'chunks');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async submitFinalProjectChunk(token: string, chunkB64: string, chunkIndex: any, totalChunks: any, fileName: string, mimeType: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const idx = parseInt(chunkIndex) || 0;
      const total = parseInt(totalChunks) || 1;
      const tempPath = path.join(this.chunkDir(), `${me.key}_${fileName.replace(/[^\w.\-]/g, '_')}.part`);
      if (idx === 0 && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      const data = chunkB64.includes('base64,') ? chunkB64.split('base64,')[1] : chunkB64;
      fs.appendFileSync(tempPath, Buffer.from(data, 'base64'));
      if (idx + 1 < total) return { success: true, received: idx + 1, total };
      // Last chunk — finalize as the student's final project submission
      const dir = path.join(process.cwd(), 'public', 'uploads', 'projects');
      fs.mkdirSync(dir, { recursive: true });
      const finalName = `${Date.now()}_${fileName.replace(/[^\w.\-؀-ۿ]/g, '_')}`;
      fs.renameSync(tempPath, path.join(dir, finalName));
      return await this.saveFinalProject(me.key, me.name, '/uploads/projects/' + finalName, fileName);
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private async saveFinalProject(studentKey: string, studentName: string, fileUrl: string, fileName: string) {
    const student = await this.findStudentByAnyId(studentKey);
    let project = (await this.finalProjectRepository.find({ relations: { student: true } }))
      .find((p) => (p.student?.legacyId || p.student?.id || p.studentLegacyId) === studentKey);
    if (project) {
      project.driveFileId = fileUrl;
      project.fileName = fileName || '';
      project.submittedAt = new Date();
      project.status = 'pending';
      await this.finalProjectRepository.save(project);
    } else {
      await this.finalProjectRepository.save({
        legacyId: 'FP_' + Date.now(),
        student: student || null,
        studentLegacyId: studentKey,
        studentName: studentName || student?.name || '',
        driveFileId: fileUrl,
        fileName: fileName || '',
        submittedAt: new Date(),
        status: 'pending',
      });
    }
    return { success: true, message: '✅ تم رفع مشروعك النهائي — في انتظار المراجعة' };
  }

  async submitFinalProject(token: string, base64Data: string, fileName: string, mimeType?: string, driveFileId?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      let fileUrl = driveFileId || '';
      if (base64Data && fileName) {
        const dir = path.join(process.cwd(), 'public', 'uploads', 'projects');
        fs.mkdirSync(dir, { recursive: true });
        const finalName = `${Date.now()}_${fileName.replace(/[^\w.\-؀-ۿ]/g, '_')}`;
        const data = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
        fs.writeFileSync(path.join(dir, finalName), Buffer.from(data, 'base64'));
        fileUrl = '/uploads/projects/' + finalName;
      }
      return await this.saveFinalProject(me.key, me.name, fileUrl, fileName);
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async uploadProjectOutline(token: string, base64Data: string, fileName: string, mimeType?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const dir = path.join(process.cwd(), 'public', 'uploads', 'projects');
      fs.mkdirSync(dir, { recursive: true });
      const finalName = `outline_${Date.now()}_${fileName.replace(/[^\w.\-؀-ۿ]/g, '_')}`;
      const data = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
      fs.writeFileSync(path.join(dir, finalName), Buffer.from(data, 'base64'));
      const fileUrl = '/uploads/projects/' + finalName;

      if (me.authorType === 'bsa') {
        let project = await this.finalProjectRepository.findOne({
          where: { studentLegacyId: 'GLOBAL_OUTLINE' }
        });
        if (!project) {
          project = this.finalProjectRepository.create({
            legacyId: 'FP_GLOBAL',
            studentLegacyId: 'GLOBAL_OUTLINE',
            studentName: 'BSA Orientation File',
            status: 'approved',
          });
        }
        project.outlineFileId = fileUrl;
        project.outlineFileName = fileName || '';
        await this.finalProjectRepository.save(project);
        return { success: true, message: '✅ تم رفع ملف التوجيه العام بنجاح' };
      } else {
        let project = (await this.finalProjectRepository.find({ relations: { student: true } }))
          .find((p) => (p.student?.legacyId || p.student?.id || p.studentLegacyId) === me.key);
        if (!project) {
          const student = await this.findStudentByAnyId(me.key);
          project = this.finalProjectRepository.create({
            legacyId: 'FP_' + Date.now(),
            student: student || null,
            studentLegacyId: me.key,
            studentName: me.name,
            status: 'pending',
          });
        }
        project.outlineFileId = fileUrl;
        project.outlineFileName = fileName || '';
        await this.finalProjectRepository.save(project);
        return { success: true, message: '✅ تم رفع الـ Outline الخاصة بك' };
      }
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getStudentFinalProject(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, project: null };
    try {
      const me = await this.acadUserInfo(sess);

      // 1. Get watched lectures count
      const watchedSet = await this.studentWatchedSet(me.key);
      const watchedCount = watchedSet.size;

      // 2. Check if manually unlocked via AcademyUnlock with lecture_id = 'FINAL_PROJECT'
      const isManuallyUnlocked = await this.unlockRepository.findOne({
        where: {
          studentId: me.key,
          lectureId: 'FINAL_PROJECT'
        }
      });
      
      const unlocked = (watchedCount >= 7) || !!isManuallyUnlocked;

      // 3. Load global outline from special record (GLOBAL_OUTLINE)
      const globalProject = await this.finalProjectRepository.findOne({
        where: { studentLegacyId: 'GLOBAL_OUTLINE' }
      });
      
      const project = (await this.finalProjectRepository.find({ relations: { student: true } }))
        .find((p) => (p.student?.legacyId || p.student?.id || p.studentLegacyId) === me.key);

      const outlineFileId = globalProject?.outlineFileId || project?.outlineFileId || '';
      const outlineFileName = globalProject?.outlineFileName || project?.outlineFileName || 'ملف التوجيه';

      if (!project) {
        return {
          success: true,
          unlocked,
          watchedCount,
          outlineFileId,
          outlineFileName,
          project: null
        };
      }

      return {
        success: true,
        unlocked,
        watchedCount,
        project: {
          id: project.legacyId || project.id,
          fileId: project.driveFileId || '',
          fileName: project.fileName || '',
          submittedAt: project.submittedAt ? new Date(project.submittedAt).toLocaleDateString('en-GB') : '',
          status: project.status || 'pending',
          reviewNotes: project.reviewNotes || '',
          reviewedBy: project.reviewedBy || '',
          outlineFileId: outlineFileId,
          outlineFileName: outlineFileName,
        },
      };
    } catch {
      return { success: false, project: null };
    }
  }

  async toggleFinalProjectUnlock(studentId: string, unlock: boolean, adminName: string) {
    try {
      const sid = (studentId || '').trim();
      if (unlock) {
        const exist = await this.unlockRepository.findOne({
          where: { studentId: sid, lectureId: 'FINAL_PROJECT' }
        });
        if (!exist) {
          await this.unlockRepository.save({
            studentId: sid,
            lectureId: 'FINAL_PROJECT',
            unlockedBy: adminName || 'Admin'
          });
        }
      } else {
        const exist = await this.unlockRepository.findOne({
          where: { studentId: sid, lectureId: 'FINAL_PROJECT' }
        });
        if (exist) {
          await this.unlockRepository.remove(exist);
        }
      }
      return { success: true, message: unlock ? '✅ تم فتح المشروع النهائي للمتدرب' : '🔒 تم قفل المشروع النهائي للمتدرب' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getAllFinalProjects(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || (!sess.isBsa && sess.role !== 'instructor')) {
      return { success: false, message: 'غير مصرح' };
    }
    try {
      let rows = await this.finalProjectRepository.find({ relations: { student: true }, order: { submittedAt: 'DESC' } });
      
      const isBsa = sess.isBsa;
      
      if (!isBsa && sess.role === 'instructor') {
        const idStr = sess.id;
        const instructor = (await this.instructorRepository.findOne({ where: { legacyId: idStr } })) ||
          (idStr.length === 36 ? await this.instructorRepository.findOne({ where: { id: idStr } }) : null);
        const insTag = instructor ? (instructor.name || '').trim().toLowerCase() : '';
        rows = rows.filter((p) => {
          const studentTag = (p.student?.instructorTag || '').trim().toLowerCase();
          return studentTag === insTag;
        });
      }

      return {
        success: true,
        projects: rows
          .filter((p) => p.driveFileId)
          .map((p) => ({
            id: p.legacyId || p.id,
            studentId: p.student?.legacyId || p.studentLegacyId || '',
            studentName: p.studentName || p.student?.name || '',
            fileId: p.driveFileId || '',
            fileName: p.fileName || '',
            submittedAt: p.submittedAt ? new Date(p.submittedAt).toLocaleString('en-GB') : '',
            status: p.status || 'pending',
            reviewNotes: p.reviewNotes || '',
            reviewedBy: p.reviewedBy || '',
          })),
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteGlobalOutline(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const globalOutline = await this.finalProjectRepository.findOne({
        where: { studentLegacyId: 'GLOBAL_OUTLINE' }
      });
      if (globalOutline) {
        if (globalOutline.outlineFileId && globalOutline.outlineFileId.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', globalOutline.outlineFileId);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
        await this.finalProjectRepository.remove(globalOutline);
      }
      return { success: true, message: '✅ تم حذف ملف التوجيه بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getApprovedFinalProjects(token: string) {
    const res: any = await this.getAllFinalProjects(token);
    if (!res.success) {
      // Students may view approved projects too
      const sess = await this.validateAcadSession(token);
      if (!sess) return { success: false, projects: [] };
      const rows = await this.finalProjectRepository.find({ where: { status: 'approved' }, relations: { student: true } });
      return {
        success: true,
        projects: rows.map((p) => ({
          id: p.legacyId || p.id,
          studentName: p.studentName || '',
          fileId: p.driveFileId || '',
          fileName: p.fileName || '',
        })),
      };
    }
    return { success: true, projects: (res.projects || []).filter((p: any) => p.status === 'approved') };
  }

  async reviewFinalProject(token: string, studentId: string, action: string, notes?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || (!sess.isBsa && sess.role !== 'instructor')) return { success: false, message: 'غير مصرح' };
    try {
      const key = (studentId || '').toString().trim();
      const project = (await this.finalProjectRepository.find({ relations: { student: true } }))
        .find((p) => (p.student?.legacyId || p.student?.id || p.studentLegacyId) === key);
      if (!project) return { success: false, message: 'لم يتم إيجاد مشروع لهذا الطالب' };
      project.status = action === 'approved' || action === 'approve' ? 'approved' : 'rejected';
      project.reviewNotes = notes || '';
      project.reviewedBy = sess.id;
      project.reviewedAt = new Date();
      await this.finalProjectRepository.save(project);
      const msg = project.status === 'approved'
        ? '✅ تم قبول مشروعك النهائي' + (notes ? ' — ' + notes : '')
        : '❌ تم رفض مشروعك النهائي' + (notes ? ' — السبب: ' + notes : '');
      await this.notifyAcad(key, 'student', project.status === 'approved' ? 'task_approved' : 'task_rejected', msg, 'final_project');
      return { success: true, message: project.status === 'approved' ? '✅ تم قبول المشروع' : '❌ تم رفض المشروع' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async instructorReviewTask(token: string, taskId: any, action: string, notes?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    const me = await this.acadUserInfo(sess);
    const res: any = await this.reviewStudentTask(taskId, action === 'approved' ? 'approve' : action, me.name, notes);
    if (res.success) {
      const idStr = (taskId || '').toString().trim();
      const task = (await this.academyTaskRepository.findOne({ where: { legacyId: idStr }, relations: { student: true } })) ||
        (idStr.length === 36 ? await this.academyTaskRepository.findOne({ where: { id: idStr }, relations: { student: true } }) : null);
      const sid = task?.student?.legacyId || task?.studentLegacyId;
      if (sid) {
        const approved = action === 'approve' || action === 'approved';
        await this.notifyAcad(sid, 'student',
          approved ? 'task_instructor_approved' : 'task_instructor_rejected',
          approved
            ? `✅ المحاضر وافق على تاسك محاضرة "${task?.lectureName || ''}"`
            : `❌ المحاضر رفض تاسك محاضرة "${task?.lectureName || ''}"${notes ? ' — ' + notes : ''}`,
          task?.legacyId || '');
      }
    }
    return res;
  }

  // ── Success stories & showcase ──

  async submitSuccessStory(token: string, title: string, content: string, imageBase64?: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      let imageUrl = '';
      if (imageBase64) {
        const dir = path.join(process.cwd(), 'public', 'uploads', 'success_stories');
        fs.mkdirSync(dir, { recursive: true });
        const fname = `story_${Date.now()}.jpg`;
        const data = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
        fs.writeFileSync(path.join(dir, fname), Buffer.from(data, 'base64'));
        imageUrl = '/uploads/success_stories/' + fname;
      }
      await this.successStoryRepository.save({
        legacyId: 'SS_' + Date.now(),
        authorId: me.key,
        authorName: me.name,
        authorRole: me.authorType,
        title: title || '',
        content: content || '',
        imageUrl: imageUrl || null,
        approved: false,
        createdAt: new Date(),
        likesCount: 0,
        deleted: false,
      });
      return { success: true, message: '✅ تم إرسال قصتك — هتظهر بعد موافقة الفريق' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getSuccessStories(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, stories: [] };
    try {
      const isAdmin = sess.isBsa;
      const rows = await this.successStoryRepository.find({ where: { deleted: false }, order: { createdAt: 'DESC' } });
      const me = await this.acadUserInfo(sess);

      const ids = rows.map((s) => s.legacyId || s.id);
      const reactions = ids.length
        ? await this.reactionRepository.createQueryBuilder('r').where('r.itemId IN (:...ids)', { ids }).getMany()
        : [];

      const reactionsByItem = new Map<string, AcademyReaction[]>();
      for (const r of reactions) {
        if (!reactionsByItem.has(r.itemId)) {
          reactionsByItem.set(r.itemId, []);
        }
        reactionsByItem.get(r.itemId)!.push(r);
      }

      return {
        success: true,
        stories: rows
          .filter((s) => isAdmin || s.approved || s.authorId === me.key)
          .map((s) => {
            const key = s.legacyId || s.id;
            const itemReactions = reactionsByItem.get(key) || [];
            
            const reactionCounts: Record<string, number> = {};
            let myReaction = '';
            for (const r of itemReactions) {
              const type = r.reactionType || 'like';
              reactionCounts[type] = (reactionCounts[type] || 0) + 1;
              if (r.userId === me.key) {
                myReaction = type;
              }
            }

            return {
              id: key,
              authorId: s.authorId || '',
              authorName: s.authorName || '',
              authorRole: s.authorRole || 'student',
              title: s.title || '',
              content: s.content || '',
              imageUrl: s.imageUrl || '',
              approved: !!s.approved,
              likesCount: itemReactions.length || s.likesCount || 0,
              reactionCounts,
              myReaction,
              createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB') : '',
            };
          }),
      };
    } catch {
      return { success: false, stories: [] };
    }
  }

  async approveSuccessStory(token: string, storyId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const idStr = (storyId || '').toString().trim();
      const story = (await this.successStoryRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.successStoryRepository.findOne({ where: { id: idStr } }) : null);
      if (!story) return { success: false, message: 'القصة مش موجودة' };
      story.approved = true;
      await this.successStoryRepository.save(story);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async editAndApproveStory(token: string, storyId: any, title: string, content: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const idStr = (storyId || '').toString().trim();
      const story = (await this.successStoryRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.successStoryRepository.findOne({ where: { id: idStr } }) : null);
      if (!story) return { success: false, message: 'القصة مش موجودة' };
      if (title !== undefined) story.title = title;
      if (content !== undefined) story.content = content;
      story.approved = true;
      await this.successStoryRepository.save(story);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteSuccessStory(token: string, storyId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const me = await this.acadUserInfo(sess);
      const idStr = (storyId || '').toString().trim();
      const story = (await this.successStoryRepository.findOne({ where: { legacyId: idStr } })) ||
        (idStr.length === 36 ? await this.successStoryRepository.findOne({ where: { id: idStr } }) : null);
      if (!story) return { success: false, message: 'القصة مش موجودة' };
      if (!sess.isBsa && story.authorId !== me.key) return { success: false, message: 'غير مصرح' };
      story.deleted = true;
      await this.successStoryRepository.save(story);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getInstructorsList(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, list: [] };
    try {
      const list = await this.instructorRepository.find({ order: { name: 'ASC' } });
      return { success: true, list: list.map(x => ({ id: x.id, name: x.name, legacyId: x.legacyId })) };
    } catch {
      return { success: false, list: [] };
    }
  }

  async getBsaOrientations(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, orientations: [], referenceProjects: [] };
    try {
      const isBsa = sess.isBsa;
      
      let items = await this.bsaOrientationRepository.find({ order: { addedAt: 'DESC' } });
      
      if (!isBsa && sess.role === 'instructor') {
        const idStr = sess.id;
        const instructor = (await this.instructorRepository.findOne({ where: { legacyId: idStr } })) ||
          (idStr.length === 36 ? await this.instructorRepository.findOne({ where: { id: idStr } }) : null);
        const insTag = instructor ? (instructor.name || '').trim().toLowerCase() : '';
        items = items.filter(x => {
          const fileTag = (x.instructorTag || '').trim().toLowerCase();
          return fileTag === 'all' || fileTag === '' || fileTag === insTag;
        });
      } else if (!isBsa && sess.role === 'student') {
        const student = (await this.findStudentByAnyId(sess.id)) || (await this.studentRepository.findOne({ where: { id: sess.id } }));
        const studTag = student ? (student.instructorTag || '').trim().toLowerCase() : '';
        items = items.filter(x => {
          const fileTag = (x.instructorTag || '').trim().toLowerCase();
          return fileTag === 'all' || fileTag === '' || fileTag === studTag;
        });
      }

      const orientations = items.filter(x => x.type === 'orientation');
      const referenceProjects = items.filter(x => x.type === 'reference_project');

      return {
        success: true,
        orientations,
        referenceProjects
      };
    } catch (e: any) {
      return { success: false, message: e.message, orientations: [], referenceProjects: [] };
    }
  }

  async addBsaOrientation(token: string, title: string, fileBase64: string, fileName: string, type: string, instructorTag: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    const isBsa = sess.isBsa;
    if (!isBsa) return { success: false, message: 'غير مصرح' };

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'orientations');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const cleanFileName = uniquePrefix + '-' + fileName.replace(/\s+/g, '_');
      const filePath = path.join(uploadDir, cleanFileName);

      const base64Data = fileBase64.replace(/^data:.*?;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      const relativeFileId = `/uploads/orientations/${cleanFileName}`;

      const rec = new BsaOrientation();
      rec.title = title || fileName;
      rec.fileName = fileName;
      rec.fileId = relativeFileId;
      rec.type = type;
      rec.instructorTag = instructorTag || 'All';
      rec.addedAt = new Date();

      await this.bsaOrientationRepository.save(rec);
      return { success: true, message: '✅ تم رفع الملف بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteBsaOrientation(token: string, id: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    const isBsa = sess.isBsa;
    if (!isBsa) return { success: false, message: 'غير مصرح' };

    try {
      const rec = await this.bsaOrientationRepository.findOne({ where: { id } });
      if (!rec) return { success: false, message: 'الملف غير موجود' };

      if (rec.fileId) {
        const filePath = path.join(process.cwd(), 'public', rec.fileId);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error unlinking orientation file:', err);
          }
        }
      }

      await this.bsaOrientationRepository.remove(rec);
      return { success: true, message: '✅ تم حذف الملف بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getBSAShowcaseProjects(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, projects: [] };
    try {
      const isAdmin = sess.role === 'instructor';
      const rows = await this.showcaseRepository.find({ order: { addedAt: 'DESC' } });
      return {
        success: true,
        projects: rows
          .filter((p) => isAdmin || p.visible)
          .map((p) => ({
            id: p.legacyProjectId || p.id,
            title: p.title || '',
            description: p.description || '',
            imageUrl: p.imageUrl || '',
            projectUrl: p.projectUrl || '',
            tags: p.tags || '',
            visible: !!p.visible,
            addedBy: p.addedBy || '',
          })),
      };
    } catch {
      return { success: false, projects: [] };
    }
  }

  async addBSAShowcaseProject(token: string, title: string, description: string, pdfBase64: string, pdfName: string, tags: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      let fileUrl = '';
      if (pdfBase64 && pdfName) {
        const cleanB64 = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
        const dir = path.join(process.cwd(), 'public', 'uploads', 'showcases');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const safeName = `showcase_${Date.now()}_${pdfName.replace(/[^\w.\-؀-ۿ]/g, '_')}`;
        fs.writeFileSync(path.join(dir, safeName), Buffer.from(cleanB64, 'base64'));
        fileUrl = '/uploads/showcases/' + safeName;
      }

      await this.showcaseRepository.save({
        legacyProjectId: 'SHW_' + Date.now(),
        title: title || '',
        description: description || '',
        imageUrl: '',
        projectUrl: fileUrl || '',
        tags: tags || '',
        visible: true,
        addedBy: sess.id,
        addedAt: new Date(),
      });
      return { success: true, message: '✅ تم إضافة المشروع بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteBSAShowcaseProject(token: string, projectId: any) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const idStr = (projectId || '').toString().trim();
      const row = (await this.showcaseRepository.findOne({ where: { legacyProjectId: idStr } })) ||
        (idStr.length === 36 ? await this.showcaseRepository.findOne({ where: { id: idStr } }) : null);
      if (!row) return { success: false, message: 'مش موجود' };

      if (row.projectUrl && row.projectUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', row.projectUrl);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }

      await this.showcaseRepository.remove(row);
      return { success: true, message: 'تم الحذف' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async toggleBSAShowcaseProject(token: string, projectId: any, visible: boolean) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const idStr = (projectId || '').toString().trim();
      const row = (await this.showcaseRepository.findOne({ where: { legacyProjectId: idStr } })) ||
        (idStr.length === 36 ? await this.showcaseRepository.findOne({ where: { id: idStr } }) : null);
      if (!row) return { success: false, message: 'مش موجود' };
      row.visible = !!visible;
      await this.showcaseRepository.save(row);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async saveShowcaseSettings(adminToken: string, enabled: boolean, minLectures: any) {
    const sess = await this.validateAcadSession(adminToken);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    try {
      await this.setSettingValue('showcase_enabled', enabled ? 'true' : 'false');
      await this.setSettingValue('showcase_min_lectures', String(parseInt(minLectures) || 0));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // ── Instructor cards ──

  async getMyInstructorRounds(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, rounds: [] };
    try {
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      const name = this.normalizeArabicName(instructor?.name || '');
      const rounds = await this.roundRepository.find();
      const myRounds = rounds.filter((r) => this.normalizeArabicName(r.instructorName || '') === name && r.status !== 'Deleted');

      // Fetch enrollments to get active counts
      const enrollments = await this.enrollmentRepository.find({ relations: { round: true } });
      const enrollCountMap = new Map<string, number>();
      for (const e of enrollments) {
        if (e.status === 'active') {
          const rid = e.roundLegacyId || (e.round?.legacyId || e.round?.id);
          if (rid) {
            enrollCountMap.set(rid, (enrollCountMap.get(rid) || 0) + 1);
          }
        }
      }

      // Fetch unlocked lectures count per round
      const contents = await this.contentRepository.find();
      const unlockedCountMap = new Map<string, number>();
      for (const c of contents) {
        if (!c.isLocked) {
          const rid = c.roundLegacyId || c.round?.id;
          if (rid) {
            unlockedCountMap.set(rid, (unlockedCountMap.get(rid) || 0) + 1);
          }
        }
      }

      return {
        success: true,
        rounds: myRounds.map((r) => {
          const rid = r.legacyId || r.id;
          const isOffline = (r.type || '').toLowerCase().includes('offline');
          const totalLectures = isOffline ? 10 : 12;
          const pay1Lec = isOffline ? 5 : 6;
          const pay2Lec = isOffline ? 10 : 12;

          let expectedPay1 = '';
          let expectedPay2 = '';
          if (r.startDate) {
            const start = new Date(r.startDate);
            const d1 = new Date(start);
            d1.setDate(d1.getDate() + (pay1Lec - 1) * 7);
            expectedPay1 = d1.toISOString().slice(0, 10);

            const d2 = new Date(start);
            d2.setDate(d2.getDate() + (pay2Lec - 1) * 7);
            expectedPay2 = d2.toISOString().slice(0, 10);
          }

          // Count unlocked lectures
          let deliveredLectures = unlockedCountMap.get(rid) || 0;
          if (deliveredLectures === 0 && r.name) {
            // Fallback: check by roundName matching
            deliveredLectures = contents.filter(c => !c.isLocked && c.roundName === r.name).length;
          }

          // Map database status to lowercase frontend statuses
          let frontendStatus = 'active';
          if (r.status === 'Waiting List') {
            frontendStatus = 'waiting';
          } else if (r.status === 'Completed' || r.status === 'Closed') {
            frontendStatus = 'finished';
          }

          return {
            id: rid,
            name: r.name || '',
            type: r.type || 'Online',
            status: frontendStatus,
            startDate: r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : '',
            enrolled: enrollCountMap.get(rid) || r.enrolled || 0,
            totalLectures,
            deliveredLectures,
            pay1Lec,
            pay2Lec,
            expectedPay1,
            expectedPay2,
          };
        }),
      };
    } catch (e) {
      console.error('Error loading my rounds:', e);
      return { success: false, rounds: [] };
    }
  }

  async getMyInstructorSalaryCards(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, cards: [], summary: {} };
    try {
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      const name = this.normalizeArabicName(instructor?.name || '');
      const cards = await this.lecturerSalaryRepository.find({ relations: { round: true } });

      const filteredCards = cards.filter((c) => this.normalizeArabicName(c.instructorName || '') === name);

      let totalAmount = 0;
      let totalPaid = 0;

      const mappedCards = filteredCards.map((c) => {
        const p1 = parseFloat(String(c.pay1Amount || '0').replace(/[^0-9.]/g, '')) || 0;
        const p2 = parseFloat(String(c.pay2Amount || '0').replace(/[^0-9.]/g, '')) || 0;

        totalAmount += p1 + p2;
        if (c.pay1Status === 'paid') totalPaid += p1;
        if (c.pay2Status === 'paid') totalPaid += p2;

        const isOffline = (c.roundType || '').toLowerCase().indexOf('offline') !== -1;
        let expectedPay1 = '';
        let expectedPay2 = '';

        if (c.round && c.round.startDate) {
          const pay1Lec = isOffline ? 5 : 6;
          const pay2Lec = isOffline ? 10 : 12;

          const d1 = new Date(c.round.startDate);
          d1.setDate(d1.getDate() + (pay1Lec - 1) * 7);
          expectedPay1 = d1.toISOString().slice(0, 10);

          const d2 = new Date(c.round.startDate);
          d2.setDate(d2.getDate() + (pay2Lec - 1) * 7);
          expectedPay2 = d2.toISOString().slice(0, 10);
        }

        return {
          id: c.legacyId || c.id,
          roundName: c.roundName || '',
          roundType: c.roundType || 'Online',
          roundStartDate: c.round?.startDate ? new Date(c.round.startDate).toISOString().slice(0, 10) : '',
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
          pay1Amount: c.pay1Amount != null ? String(c.pay1Amount) : '',
          pay1Status: c.pay1Status || 'pending',
          pay1Date: c.pay1PaidDate ? new Date(c.pay1PaidDate).toISOString().slice(0, 10) : '',
          pay2Amount: c.pay2Amount != null ? String(c.pay2Amount) : '',
          pay2Status: c.pay2Status || 'pending',
          pay2Date: c.pay2PaidDate ? new Date(c.pay2PaidDate).toISOString().slice(0, 10) : '',
          expectedPay1,
          expectedPay2,
          notes: c.notes || '',
        };
      });

      const summary = {
        totalRounds: filteredCards.length,
        totalAmount,
        totalPaid,
        totalRemaining: totalAmount - totalPaid,
      };

      return {
        success: true,
        cards: mappedCards,
        summary,
      };
    } catch (e: any) {
      console.error('Error loading instructor salary cards:', e);
      return { success: false, cards: [], summary: {} };
    }
  }

  // ═══════════════════════════════════════════════════
  // ═══  FINAL GAP-FILL: courses/offers/instructors CRUD + misc  ═══
  // ═══════════════════════════════════════════════════

  async addCourse(courseName: string) {
    try {
      const name = (courseName || '').trim();
      if (!name) return { success: false, message: 'اكتب اسم الكورس' };
      const existing = await this.courseRepository.findOne({ where: { courseName: name } });
      if (existing) return { success: false, message: 'الكورس موجود بالفعل' };
      await this.courseRepository.save({ courseName: name, active: true, createdAt: new Date() });
      return { success: true, message: '✅ تم إضافة الكورس' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteCourse(courseName: string) {
    try {
      const course = await this.courseRepository.findOne({ where: { courseName: (courseName || '').trim() } });
      if (!course) return { success: false, message: 'الكورس مش موجود' };
      await this.courseRepository.remove(course);
      return { success: true, message: '✅ تم حذف الكورس' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addOffer(offerName: string, expiresAt?: string) {
    try {
      const name = (offerName || '').trim();
      if (!name) return { success: false, message: 'اكتب اسم العرض' };
      await this.offerRepository.save({
        offerName: name,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
      });
      return { success: true, message: '✅ تم إضافة العرض' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteOffer(offerName: string) {
    try {
      const offer = await this.offerRepository.findOne({ where: { offerName: (offerName || '').trim() } });
      if (!offer) return { success: false, message: 'العرض مش موجود' };
      await this.offerRepository.remove(offer);
      return { success: true, message: '✅ تم حذف العرض' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getAcademyInstructors() {
    try {
      const rows = await this.instructorRepository.find({ order: { createdAt: 'ASC' } });
      return {
        instructors: rows.map((i) => ({
          id: i.legacyId || i.id,
          name: i.name || '',
          username: i.username || '',
          password: i.password || '',
          active: !!i.active,
          createdAt: i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : '',
          isBSA: !!i.isBsa,
          phone: i.phone || '',
        })),
      };
    } catch {
      return { instructors: [] };
    }
  }

  private async findInstructorByAnyId(id: any): Promise<Instructor | null> {
    const idStr = (id || '').toString().trim();
    if (!idStr) return null;
    return (
      (await this.instructorRepository.findOne({ where: { legacyId: idStr } })) ||
      (idStr.length === 36 ? await this.instructorRepository.findOne({ where: { id: idStr } }) : null)
    );
  }

  async addAcademyInstructor(name: string, username: string, password: string, isBSA?: boolean, phone?: string) {
    try {
      if (!name || !password) return { success: false, message: 'الاسم والباسورد مطلوبين' };
      let uname = (username || '').trim().toLowerCase();
      if (!uname) uname = name.trim().toLowerCase().replace(/\s+/g, '.');
      if (!uname.includes('@')) uname += '@bsa';
      const existing = await this.instructorRepository.findOne({ where: { username: uname } });
      if (existing) return { success: false, message: 'Username موجود بالفعل' };
      const id = 'INS_' + Date.now();
      await this.instructorRepository.save({
        legacyId: id,
        name,
        username: uname,
        password: password.trim(),
        active: true,
        isBsa: !!isBSA,
        phone: (phone || '').trim() || null,
      });
      return { success: true, message: `✅ تم إضافة ${isBSA ? 'حساب BSA' : 'المحاضر'}: ${name}`, id, username: uname };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateAcademyInstructor(id: any, name?: string, username?: string, phone?: string, newPassword?: string) {
    try {
      const instructor = await this.findInstructorByAnyId(id);
      if (!instructor) return { success: false, message: 'المحاضر مش موجود' };
      if (username) {
        let uname = username.trim().toLowerCase();
        if (!uname.includes('@')) uname += '@bsa';
        const dup = await this.instructorRepository.findOne({ where: { username: uname } });
        if (dup && dup.id !== instructor.id) return { success: false, message: 'Username موجود بالفعل' };
        instructor.username = uname;
      }
      if (name) instructor.name = name;
      if (phone !== undefined) instructor.phone = (phone || '').trim() || null;
      if (newPassword && newPassword.trim()) instructor.password = newPassword.trim();
      await this.instructorRepository.save(instructor);
      return { success: true, message: '✅ تم تعديل بيانات المحاضر' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteAcademyInstructor(instructorId: any) {
    try {
      const instructor = await this.findInstructorByAnyId(instructorId);
      if (!instructor) return { success: false, message: 'مش موجود' };
      await this.instructorRepository.remove(instructor);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async toggleAcademyInstructor(instructorId: any, active: boolean) {
    try {
      const instructor = await this.findInstructorByAnyId(instructorId);
      if (!instructor) return { success: false };
      instructor.active = !!active;
      await this.instructorRepository.save(instructor);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async adminTransferLead(clientNumber: any, newAgentName: string, adminId: string, adminName: string) {
    if (!(await this.isAdminOrManager(adminId))) return { success: false, message: 'غير مصرح' };
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود' };
      const newAgent = await this.userRepository.findOne({ where: { name: (newAgentName || '').trim() } });
      if (!newAgent) return { success: false, message: 'الموظف الجديد غير موجود' };

      lead.agent = newAgent;
      lead.agentLegacyId = newAgent.legacyId;
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);

      if (lead.phone) {
        const myLead = await this.myLeadRepository.findOne({ where: { phone: lead.phone } });
        if (myLead) {
          myLead.agent = newAgent;
          myLead.agentLegacyId = newAgent.legacyId;
          await this.myLeadRepository.save(myLead);
        }
      }
      await this.logActivity(adminId, adminName, 'ADMIN_TRANSFER', `نقل ${lead.name || lead.phone} → ${newAgent.name}`);
      return { success: true, message: `✅ تم نقل العميل إلى ${newAgent.name}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async addClientHistoryComment(clientNumber: any, comment: string, agentId: string, agentName: string) {
    try {
      const lead = await this.findRawByAnyId(clientNumber);
      if (!lead) return { success: false, message: 'العميل غير موجود' };
      const _now = new Date();
      const _pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = formatTimeToAmPm(_now);
      const dateStr = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
      const line = `[${dateStr} ${timeStr} - ${agentName}] ${(comment || '').trim()}`;
      lead.notes = (lead.notes || '').trim() ? `${lead.notes.trim()}\n${line}` : line;
      lead.lastModified = new Date();
      await this.rawLeadRepository.save(lead);
      return { success: true, message: '✅ تم إضافة التعليق' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateClientBookingStatus(payId: string, newStatus: string, targetRoundId?: string, expectedLastModified?: string) {
    try {
      const payment = await this.clientPaymentRepository.findOne({
        where: { id: payId },
        relations: { round: true }
      });
      if (!payment) return { success: false, message: 'سجل الدفع غير موجود' };
      const oc = payment.clientLegacyId;
      if (!oc) return { success: false, message: 'كود العميل غير موجود' };

      const targetRound = targetRoundId ? await this.findRoundByAnyId(targetRoundId) : null;

      // 1. Update Financial Data
      const fdRows = await this.financialDataRepository.find({ where: { ocCode: oc } });
      for (const fd of fdRows) {
        if (newStatus === 'Cancel') {
          fd.price = fd.paid;
          fd.action = 'Cancel';
        } else if (newStatus === 'Refund') {
          fd.price = 0;
          fd.paid = 0;
          fd.action = 'Refund';
        } else if (newStatus === 'Wait') {
          fd.action = 'Wait';
        } else {
          fd.action = 'Round';
        }
        await this.financialDataRepository.save(fd);
      }

      // 2. Update Client Payment
      payment.lastModified = new Date();
      if (newStatus === 'Cancel') {
        payment.totalAmount = payment.amountPaid;
        payment.amountUnpaid = 0;
        payment.round = null;
        payment.roundLegacyId = null;
        payment.roundName = 'Cancel';
        payment.status = 'Cancel';
      } else if (newStatus === 'Refund') {
        payment.totalAmount = 0;
        payment.amountPaid = 0;
        payment.amountUnpaid = 0;
        payment.amountDetail1 = 0;
        payment.amountDetail2 = 0;
        payment.amountDetail3 = 0;
        payment.round = null;
        payment.roundLegacyId = null;
        payment.roundName = 'Refund';
        payment.status = 'Refund';
      } else if (newStatus === 'Wait') {
        payment.round = null;
        payment.roundLegacyId = null;
        payment.roundName = 'Wait';
        payment.status = 'Wait';
      } else {
        if (targetRound) {
          payment.round = targetRound;
          payment.roundLegacyId = targetRound.legacyId || targetRound.id;
          payment.roundName = targetRound.name;
          payment.status = 'Paid';
        }
      }
      await this.clientPaymentRepository.save(payment);

      // 3. Update Academy Ledger
      const ledger = await this.ledgerRepository.findOne({ where: { ocCode: oc } });
      if (ledger) {
        if (newStatus === 'Cancel') {
          ledger.totalPrice = ledger.amountPaid;
          ledger.amountRemaining = 0;
          ledger.status = 'Cancel';
          ledger.groupName = 'Cancel';
        } else if (newStatus === 'Refund') {
          ledger.totalPrice = 0;
          ledger.amountPaid = 0;
          ledger.amountRemaining = 0;
          ledger.status = 'Refund';
          ledger.groupName = 'Refund';
        } else if (newStatus === 'Wait') {
          ledger.status = 'Wait';
          ledger.groupName = 'Wait';
        } else {
          ledger.status = 'Round';
          if (targetRound) {
            ledger.groupName = targetRound.name;
          }
        }
        await this.ledgerRepository.save(ledger);
      }

      // 4. Update Student Account & Enrollments
      const student = await this.studentRepository.findOne({ where: { ocCode: oc } });
      if (student) {
        if (newStatus === 'Round' || newStatus === 'Transfer') {
          student.active = true;
          if (targetRound) {
            // Update instructor tag
            student.instructorTag = targetRound.instructorName || '';
          }
          await this.studentRepository.save(student);

          if (targetRound) {
            // Mark other active enrollments as 'removed'
            const activeEnrollments = await this.enrollmentRepository.find({
              where: { student: { id: student.id } },
              relations: { round: true }
            });
            for (const e of activeEnrollments) {
              if (e.round?.id !== targetRound.id) {
                e.status = 'removed';
                await this.enrollmentRepository.save(e);
                if (e.round?.id) {
                  await this.updateRoundEnrolledCount(e.round.id);
                }
              }
            }
            // Enroll in new round
            await this.enrollStudent(student.id, targetRound.id);
            await this.updateRoundEnrolledCount(targetRound.id);
          }
        } else {
          // Deactivate student if status is Refund
          if (newStatus === 'Refund') {
            student.active = false;
            await this.studentRepository.save(student);
          }

          // Remove all active enrollments
          const activeEnrollments = await this.enrollmentRepository.find({
            where: { student: { id: student.id } },
            relations: { round: true }
          });
          for (const e of activeEnrollments) {
            e.status = 'removed';
            await this.enrollmentRepository.save(e);
            if (e.round?.id) {
              await this.updateRoundEnrolledCount(e.round.id);
            }
          }
        }
      }

      // 5. Remove from round_members if Wait, Cancel, or Refund
      if (newStatus === 'Wait' || newStatus === 'Cancel' || newStatus === 'Refund') {
        await this.roundMemberRepository.delete({ ocCode: oc });
      }

      return { success: true, message: '✅ تم تحديث حالة الحجز والراوند بنجاح وتعميم التغييرات' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateRoundEnrolledCount(roundId: string) {
    try {
      const round = await this.findRoundByAnyId(roundId);
      if (!round) return;
      const count = await this.roundMemberRepository.count({
        where: [
          { roundLegacyId: round.legacyId || round.id },
          { round: { id: round.id } }
        ]
      });
      round.enrolled = count;
      await this.roundRepository.save(round);
    } catch {}
  }

  // Confirm an installment receipt and deposit the amount into a wallet in one step
  // ترتيب البارامترات مطابق لما ترسله الواجهة: (payId, amount, userId, agentName, walletName, newDueDate).
  // newDueDate = موعد استحقاق الباقي في حالة الدفع الجزئي.
  async confirmInstallmentWithWallet(payId: any, amount: any, userId: string, agentName: string, walletName: string, newDueDate?: string) {
    try {
      const instRes: any = await this.addInstallment(payId, amount, userId, agentName || '', newDueDate || '');
      if (!instRes.success) return instRes;
      if (walletName) {
        const incomeRes: any = await this.addWalletIncome(
          userId, walletName, amount, 'قسط عميل', 'أقساط', undefined, walletName, `pay_id:${payId}`,
        );
        if (!incomeRes.success) return { success: true, message: `✅ اتسجل القسط لكن الإيداع في المحفظة فشل: ${incomeRes.message}` };
      }
      return { success: true, message: '✅ تم تأكيد القسط وإيداعه في المحفظة' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async rejectInstallmentReceipt(userId: string, payId: any, reason?: string) {
    try {
      const payment = await this.findPaymentByAnyId(payId);
      if (!payment) return { success: false, message: 'السجل غير موجود' };
      payment.notes = ((payment.notes || '') + `\n[❌ إيصال مرفوض ${new Date().toISOString().slice(0, 10)}${reason ? ' — ' + reason : ''}]`).trim();
      payment.lastModified = new Date();
      await this.clientPaymentRepository.save(payment);
      return { success: true, message: 'تم رفض الإيصال' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async repairFinancialPaymentRowsCarryover() {
    return { success: true, fixed: 0, message: '✅ غير مطلوب في النظام الجديد — الأقساط بتترحّل تلقائياً في قاعدة البيانات.' };
  }

  // ═══════════════════════════════════════════════════
  // ═══  INVOICES & SEQUENTIAL OC SYSTEM (replaces the Google Form/Sheet/Autocrat pipeline)  ═══
  // ═══════════════════════════════════════════════════

  // Atomic sequential OC generator — continues the legacy numbering (last sheet invoice = OC-1000410).
  private async nextOcCode(): Promise<string> {
    return await this.settingRepository.manager.transaction(async (em) => {
      const repo = em.getRepository(SystemSetting);
      let row = await repo
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where("s.key = 'oc_counter'")
        .getOne();
      if (!row) {
        row = repo.create({ key: 'oc_counter', value: '1000410' });
      }
      const next = (parseInt(row.value, 10) || 1000410) + 1;
      row.value = String(next);
      await repo.save(row);
      return 'OC-' + next;
    });
  }

  // عدّاد منفصل للفواتير المجانية (المدير فقط): OC-200001 ويزيد تدريجيًا.
  // نطاق مختلف تمامًا عن العدّاد العادي (OC-1000xxx) فمفيش تصادم.
  private async nextFreeOcCode(): Promise<string> {
    return await this.settingRepository.manager.transaction(async (em) => {
      const repo = em.getRepository(SystemSetting);
      let row = await repo
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where("s.key = 'oc_free_counter'")
        .getOne();
      if (!row) {
        row = repo.create({ key: 'oc_free_counter', value: '200000' });
      }
      const next = (parseInt(row.value, 10) || 200000) + 1;
      row.value = String(next);
      await repo.save(row);
      return 'OC-' + next;
    });
  }

  // Writes a client's OC everywhere the system references it — no more half-filled OC columns.
  private async assignOcEverywhere(oc: string, phone: string) {
    const clean = this.normalizePhone(phone);
    try {
      if (clean) {
        await this.rawLeadRepository.createQueryBuilder().update()
          .set({ ocCode: oc })
          .where("phone = :p AND (ocCode IS NULL OR ocCode = '' OR ocCode NOT LIKE 'OC-%')", { p: clean })
          .execute();
        await this.studentRepository.createQueryBuilder().update()
          .set({ ocCode: oc })
          .where("phone = :p AND (ocCode IS NULL OR ocCode = '')", { p: clean })
          .execute();
      }
    } catch { /* best-effort propagation */ }
  }

  // Resolve an existing OC for the client (by id/phone) or mint the next sequential one.
  private async resolveOrMintOc(clientId: any, phone: string): Promise<string> {
    const idStr = (clientId || '').toString().trim();
    if (idStr.toLowerCase().startsWith('oc-')) return idStr;
    const clean = this.normalizePhone(phone);
    const refNum = this.parseClientRef(idStr);
    let raw = refNum !== null ? await this.rawLeadRepository.findOne({ where: { clientNumber: refNum } }) : null;
    if (!raw && clean) raw = await this.rawLeadRepository.findOne({ where: { phone: clean } });
    if (raw?.ocCode && raw.ocCode.toLowerCase().startsWith('oc-')) return raw.ocCode;
    const oc = await this.nextOcCode();
    if (raw) { raw.ocCode = oc; await this.rawLeadRepository.save(raw); }
    await this.assignOcEverywhere(oc, phone);
    return oc;
  }

  private async triggerCelebrationSafe(agentName: string) {
    try {
      const latest = await this.celebrationRepository.findOne({ where: { agentName }, order: { timestamp: 'DESC' } });
      if (latest && latest.timestamp && Date.now() - new Date(latest.timestamp).getTime() < 120000) return;
      await this.celebrationRepository.save({ agentName, timestamp: new Date(), seen: false });
    } catch { /* celebration is decorative */ }
  }

  private async sendInvoiceEmail(toEmail: string, subject: string, html: string) {
    const smtpPass = await this.getSettingValue('smtp_pass');
    if (!smtpPass) throw new Error('SMTP not configured');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 465,
      secure: true,
      auth: { user: 'invoices@b-s-a.co', pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: '"BSA Academy" <invoices@b-s-a.co>',
      to: toEmail,
      cc: 'bsa.academy.co.2025@gmail.com',
      bcc: 'bsaofficially@gmail.com',
      subject,
      html,
    });
  }

  // Emails the invoice as a rendered PNG (pixel-identical to the on-screen preview).
  // Gmail strips flex/grid inline styles, so sending the raw invoice HTML breaks the layout.
  async emailInvoicePng(invoiceId: string, clientName: string, toEmail: string, pngBase64: string, pdfBase64?: string, pdfName?: string) {
    try {
      const to = (toEmail || '').trim();
      if (!to || !to.includes('@')) return { success: false, message: 'إيميل غير صالح' };
      const isJpeg = /^data:image\/jpe?g/i.test(pngBase64 || '');
      const b64 = (pngBase64 || '').replace(/^data:image\/(png|jpe?g);base64,/i, '');
      if (!b64 || b64.length < 100) return { success: false, message: 'صورة الفاتورة فارغة' };
      if (b64.length > 12 * 1024 * 1024) return { success: false, message: 'حجم صورة الفاتورة كبير جداً' };
      const buf = Buffer.from(b64, 'base64');
      const imgExt = isJpeg ? 'jpg' : 'png';

      const smtpPass = await this.getSettingValue('smtp_pass');
      if (!smtpPass) { this.logInvoiceEmail(invoiceId, to, 'FAIL: SMTP not configured'); return { success: false, message: 'SMTP not configured' }; }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 465,
        secure: true,
        auth: { user: 'invoices@b-s-a.co', pass: smtpPass },
        tls: { rejectUnauthorized: false },
        pool: false,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
      });
      const info = await transporter.sendMail({
        from: '"BSA Academy" <invoices@b-s-a.co>',
        to,
        cc: 'bsa.academy.co.2025@gmail.com',
        bcc: 'bsaofficially@gmail.com',
        subject: `فاتورة ${invoiceId} — ${clientName} — ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
        text: `فاتورة رقم ${invoiceId} — العميل: ${clientName}. صورة الفاتورة وملف الـ PDF مرفقان.`,
        html: '<div style="direction:rtl;text-align:right;font-family:Tahoma,Arial,sans-serif;padding:10px;">' +
          '<p style="font-size:14px;color:#3d2a1e;">فاتورة رقم <b>' + invoiceId + '</b> — العميل: <b>' + clientName + '</b></p>' +
          '<p style="font-size:13px;color:#3d2a1e;">📄 الفاتورة مرفقة كملف PDF.</p>' +
          '<p style="font-size:11px;color:#999;">BSA Academy · نظام الفواتير الإلكترونية</p></div>',
        // الإيميل PDF فقط (من غير صورة داخل الرسالة). لو مفيش PDF لأي سبب، نرفق الصورة كملف.
        attachments: (() => {
          const pdfB64 = (pdfBase64 || '').replace(/^data:.*?;base64,/, '');
          if (pdfB64 && pdfB64.length > 100 && pdfB64.length <= 16 * 1024 * 1024) {
            return [{ filename: pdfName || 'Invoice - ' + invoiceId + '.pdf', content: Buffer.from(pdfB64, 'base64') }];
          }
          return [{ filename: 'BSA_Invoice_' + invoiceId + '.' + imgExt, content: buf }];
        })(),
      });
      try { transporter.close(); } catch (e) {}
      this.logInvoiceEmail(invoiceId, to, 'OK id=' + (info && info.messageId) + ' resp=' + (info && info.response));
      return { success: true, message: 'تم إرسال الفاتورة على الإيميل', messageId: info && info.messageId };
    } catch (e: any) {
      this.logInvoiceEmail(invoiceId, toEmail, 'FAIL: ' + (e && e.message));
      return { success: false, message: e && e.message };
    }
  }

  private logInvoiceEmail(invoiceId: string, to: string, result: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      const line = `[${new Date().toISOString()}] inv=${invoiceId} to=${to} => ${result}\n`;
      fs.appendFileSync(process.cwd() + '/invoice_email.log', line);
    } catch (e) { /* ignore */ }
  }

  // Invoice template — replica of the legacy Autocrat/Google Docs design
  private buildInvoiceHtml(d: {
    invoiceId: string; today: string; clientName: string; nameEn: string; clientPhone: string;
    course: string; offer: string; attendanceDate: string; price: number; paid: number;
    remaining: number; method: string; agentName: string;
  }): string {
    // العميل يظهر ويُسجّل بالاسم الإنجليزي في الفاتورة (fallback للعربي لو فاضي).
    const name = (d.nameEn || d.clientName || '').trim();
    const esc = (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const egp = (n: number) => (Number(n) || 0).toLocaleString('en-US') + ' EGP';
    const P = {
      loc: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
      phone: 'M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1.003 1.003 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
      ig: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
      tt: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.81.1v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.35 8.35 0 0 0 4.76 1.49v-3.5a4.84 4.84 0 0 1-1-.01z',
      mail: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
      web: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    };
    const ci = (p: string, t: string, cls?: string) =>
      '<div class="inv-contact-item' + (cls ? ' ' + cls : '') + '"><div class="inv-icon"><svg viewBox="0 0 24 24"><path d="' + p + '"/></svg></div><span>' + t + '</span></div>';

    const fonts =
      "@font-face{font-family:'InvCairo';font-weight:200 1000;font-display:block;src:url(data:font/woff2;base64," + INV_CAIRO_LAT + ") format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD;}" +
      "@font-face{font-family:'InvCairo';font-weight:200 1000;font-display:block;src:url(data:font/woff2;base64," + INV_CAIRO_AR + ") format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF,U+200C-200E;}" +
      "@font-face{font-family:'InvMont';font-weight:700 900;font-display:block;src:url(data:font/woff2;base64," + INV_MONT + ") format('woff2');}";

    const css =
      ".inv-page *{margin:0;padding:0;box-sizing:border-box;}" +
      ".inv-page{width:210mm;min-height:297mm;background:#fff;display:flex;direction:ltr;position:relative;overflow:hidden;font-family:'InvCairo',sans-serif;}" +
      ".inv-page::after{content:'';position:absolute;top:48px;left:0;right:0;height:20px;background:linear-gradient(90deg,#ba6738 0%,#d78b5d 75%,#67311a 100%);z-index:4;}" +
      ".inv-sidebar{width:34%;background:#1e1e1e;display:flex;flex-direction:column;position:relative;z-index:2;}" +
      ".inv-sidebar::before{content:'';position:absolute;left:0;top:0;bottom:0;width:18px;background:linear-gradient(180deg,#ba6738 0%,#d78b5d 60%,#67311a 100%);z-index:5;}" +
      ".inv-sh{padding:90px 24px 36px 36px;color:#fff;direction:ltr;}" +
      ".inv-sh h1{font-family:'InvMont',sans-serif;font-weight:900;font-size:42px;letter-spacing:6px;line-height:1;margin-bottom:10px;}" +
      ".inv-meta{font-family:'InvMont',sans-serif;font-weight:700;font-size:15px;color:#fff;line-height:1.9;}" +
      ".inv-spacer{flex:1;}" +
      ".inv-contact{padding:0 18px 42px 28px;direction:ltr;color:#fff;}" +
      ".inv-contact-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;font-size:12.5px;font-family:'InvMont',sans-serif;font-weight:600;line-height:1.5;}" +
      ".inv-contact-item.rtl{direction:rtl;font-family:'InvCairo',sans-serif;font-weight:600;font-size:12px;}" +
      ".inv-icon{flex-shrink:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center;margin-top:2px;}" +
      ".inv-icon svg{width:18px;height:18px;fill:#fff;}" +
      ".inv-contact-item span{flex:1;}" +
      ".inv-main{width:66%;display:flex;flex-direction:column;direction:rtl;}" +
      ".inv-mh{background:#fff;padding-top:4.25rem;}" +
      ".inv-logo{display:flex;flex-direction:column;margin-left:auto;height:140px;}" +
      ".inv-logo img{width:100%;}" +
      ".inv-detail{margin-top:50px;background:#e8e8e8;min-height:175px;direction:ltr;}" +
      ".inv-detail .row{display:flex;padding:1rem 0.5rem;}" +
      ".inv-detail .col{display:flex;flex-direction:column;align-items:flex-start;}" +
      ".inv-dt{color:#ba6738;font-size:15.5px;font-weight:700;margin-bottom:6px;white-space:nowrap;}" +
      ".inv-dt span{color:#721b00;font-size:15.5px;font-weight:900;}" +
      ".inv-lb{padding-left:10px;border-left:2px solid gray;}" +
      ".inv-pol{padding:18px 28px 0 28px;flex:1;direction:rtl;position:relative;}" +
      ".inv-pol-title{text-align:center;font-family:'InvMont',sans-serif;font-weight:800;font-size:26px;color:#1e1e1e;margin-bottom:4px;direction:ltr;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px;}" +
      ".inv-pol-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 28px;margin-top:10px;color:#1e1e1e;}" +
      ".inv-pb{margin-bottom:6px;}" +
      ".inv-pb h3{font-family:'InvCairo',sans-serif;font-weight:800;font-size:13.5px;margin-bottom:2px;color:#111;}" +
      ".inv-pb p{font-family:'InvCairo',sans-serif;font-weight:400;font-size:10.8px;line-height:1.6;color:#222;text-align:justify;}" +
      ".inv-pb p strong{font-weight:700;}" +
      ".inv-stamp{position:absolute;bottom:-40px;left:75px;width:50%;z-index:9;transform:rotate(-4deg);opacity:0.3;}" +
      ".inv-stamp img{width:100%;}";

    const pol = (h: string, body: string) => '<div class="inv-pb"><h3>' + h + '</h3><p>' + body + '</p></div>';

    const body =
      '<div class="inv-page">' +
        '<div class="inv-sidebar">' +
          '<div class="inv-sh"><h1>INVOICE</h1>' +
            '<div class="inv-meta">Invoice# : ' + esc(d.invoiceId) + '</div>' +
            '<div class="inv-meta">Date : ' + esc(d.today) + '</div>' +
          '</div>' +
          '<div class="inv-spacer"></div>' +
          '<div class="inv-contact">' +
            ci(P.loc, '6 أكتوبر - ميدان المصري - برج الفيروز 1 - الدور الرابع', 'rtl') +
            ci(P.phone, 'B-S-A') + ci(P.ig, 'bsa.officially') + ci(P.tt, 'bsa.officially') +
            ci(P.mail, 'info@b-s-a.co') + ci(P.web, 'www.b-s-a.co') +
          '</div>' +
        '</div>' +
        '<div class="inv-main">' +
          '<div class="inv-mh"><div class="inv-logo"><img src="data:image/png;base64,' + INV_LOGO + '" alt=""/></div></div>' +
          '<div class="inv-detail"><div class="row">' +
            '<div class="col" style="width:55%;">' +
              '<div class="inv-dt"><span>Name : </span>' + esc(name) + '</div>' +
              '<div class="inv-dt"><span>Phone : </span>' + esc(d.clientPhone || '-') + '</div>' +
              '<div class="inv-dt"><span>Course : </span>' + esc(d.course || '-') + '</div>' +
              '<div class="inv-dt"><span>Offer : </span>' + esc(d.offer || 'Cash') + '</div>' +
              '<div class="inv-dt"><span>Attendance Time : </span>' + esc(d.attendanceDate || '-') + '</div>' +
            '</div>' +
            '<div class="col" style="width:45%;">' +
              '<div class="inv-dt inv-lb"><span>Course Price : </span>' + egp(d.price) + '</div>' +
              '<div class="inv-dt inv-lb"><span>Paid Amount : </span>' + egp(d.paid) + '</div>' +
              '<div class="inv-dt inv-lb"><span>Remaining Amount : </span>' + egp(d.remaining) + '</div>' +
              '<div class="inv-dt inv-lb"><span>Payment Method : </span>' + esc(d.method || 'Cash') + '</div>' +
            '</div>' +
          '</div></div>' +
          '<div class="inv-pol"><h2 class="inv-pol-title">Policies</h2><div class="inv-pol-grid">' +
            '<div>' +
              pol('الالتزام بالمواعيد', 'يلتزم المتدرب بالحضور في المواعيد المحددة للكورس<br/>لا يُسمح بالتأخر أو الانصراف المبكر المتكرر وفي حالة حدوث خلاف ذلك يتحمل المتدرب المسؤوليه كاملة') +
              pol('المواد التعليمية', 'جميع المواد والمحتويات التعليمية خاصة بالأكاديمية<br/>يُمنع تصوير أو تسجيل المحاضرات أو إعادة توزيعها بدون إذن رسمي') +
              pol('الانضباط والسلوك', 'يلتزم المتدرب بالاحترام المتبادل مع المحاضرين والزملاء<br/>أي سلوك غير لائق يعرّض المتدرب للاستبعاد دون استرداد الرسوم') +
              pol('الغياب', 'يجب إخطار الإدارة مسبقًا في حالة الغياب<br/>لا يحق للمتدرب استرداد قيمة المحاضرة أو تعويضها إلا في حالة إلغاء المحاضرة من قبل الأكاديمية') +
              pol('التاسك والتطبيق العملي', 'إنجاز التاسكات والكويزات الخاصة بكل محاضرة شرط أساسي لفتح المحاضرات التالية على البورتال، وذلك لضمان متابعة مستوى المتدرب والحفاظ على جودة التعلم<br/>لا يحق للمتدرب طلب استرداد قيمة الكورس بعد بدايته للاعتراض على هذا النظام، حيث إنه لا يمس المتدرب بأي ضرر بل يهدف لمساعدته على تحقيق النجاح داخل الأكاديمية، عدم الالتزام بهذا البند يؤثر بالكامل علي الشهاده المستلمه') +
            '</div>' +
            '<div>' +
              pol('الرسوم', 'يتم دفع رسوم الكورس كاملة/أو حسب النظام المتفق عليه قبل بدء الدراسة<br/>في حالة عدم التزام المتدرب بنظام الدفع أو شروط الاتفاق المتفق عليها قبل بداية الكورس، تتبع الأكاديمية النظام التالي<br/><strong>الإنذار الأول:</strong> يُرسل عبر الواتساب لتنبيه المتدرب بضرورة الالتزام بالاتفاق<br/><strong>الإنذار الثاني:</strong> في حالة عدم الاستجابة، يتم إيقاف حساب المتدرب داخل الأكاديمية وسحب أي مواد تعليمية خاصة بالكورس<br/><strong>الإنذار الثالث:</strong> في حالة استمرار عدم الالتزام، يتم إخراج المتدرب من جروب الواتساب وإيقاف الكورس نهائيًا دون استرداد الرسوم') +
              pol('سياسة التغيير والإلغاء', 'يحق للأكاديمية تعديل مواعيد أو محتوى الكورس مع إخطار المتدربين مسبقًا<br/>في حالة إلغاء الكورس من جانب الأكاديمية يتم رد الرسوم كاملة<br/>لا يحق للمتدرب طلب استرداد قيمة الكورس بعد الحجز إذا تم ذلك خلال 7 أيام أو أقل قبل بداية الكورس في الموعد المحدد مسبقا، باعتبار الحجز في هذه الحالة قد دخل حيز التنفيذ<br/>في حالة بدء الكورس، يحق للمتدرب طلب الاسترداد خلال 48 ساعة فقط من تاريخ المحاضرة الأولى، وذلك إذا تعذر على الأكاديمية الوفاء بالمحتوى أو المتطلبات المتفق عليها ولا يُقبل أي طلب استرداد بعد مرور هذه المدة<br/>أقصى مدة للتأجيل هي ثلاثة أشهر ويتم إلغاء الفاتورة بعدها، وعند طلب رد المبلغ يتم خصم نسبة إدارية وقدرها 14% من إجمالي الفاتورة') +
            '</div>' +
          '</div>' +
          '<div class="inv-stamp"><img src="data:image/png;base64,' + INV_STAMP + '" alt=""/></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return '<style>' + fonts + css + '</style>' + body;
  }

  async createDirectInvoiceFull(
    clientId: any, clientName: string, clientPhone: string, course: string, price: any, paid: any,
    remaining: any, method: string, offer: string, attendanceDate: string, nameEn: string,
    agentId: string, agentName: string, agentEmail: string, bookingType: string,
    roundId: any, roundName: string, nextDueDate: string, clientType: string, finAction: string,
    isFree?: boolean,
  ) {
    const resolvedFinAction = finAction || (roundId ? 'Round' : 'Wait');
    const isRound = resolvedFinAction === 'Round' && roundId;

    try {
      // فاتورة مجانية = المدير فقط، بكود منفصل (OC-2xxxxx) والمبالغ صفر.
      if (isFree) {
        if (!(await this.isAdminOrManager(agentId))) {
          return { success: false, message: '⚠️ الفاتورة المجانية متاحة للمدير فقط.' };
        }
        price = 0; paid = 0; remaining = 0;
      }
      if (isRound) {
        const round = await this.findRoundByAnyId(roundId);
        if (round && (round.status || 'Active').trim().toLowerCase() !== 'active') {
          return { success: false, message: '⚠️ الحجز مغلق على هذه المجموعة حالياً ولا يمكن تسجيل عملاء بها.' };
        }
      }

      // Double-click guard: same client + course + price within 5 minutes
      const cutoff = new Date(Date.now() - 5 * 60 * 1000);
      const recent = await this.ledgerRepository
        .createQueryBuilder('l')
        .where('l.clientName = :n AND l.course = :c AND l.totalPrice = :p', { n: clientName, c: course, p: parseFloat(price) || 0 })
        .andWhere('l.bookingDate >= :cutoff', { cutoff })
        .getOne();
      if (recent) return { success: false, message: '⚠️ تم تسجيل هذه الفاتورة بالفعل مؤخراً لتفادي التكرار.' };

      // كود OC: المجانية من العدّاد المنفصل (OC-2xxxxx)، والعادية من العدّاد القديم (OC-1000xxx)
      const invoiceId = isFree
        ? await this.nextFreeOcCode()
        : await this.resolveOrMintOc(clientId, clientPhone);
      if (isFree) await this.assignOcEverywhere(invoiceId, clientPhone);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const warnings: string[] = [];
      // الفاتورة تظهر وتُسجّل بالاسم الإنجليزي (fallback للعربي لو فاضي).
      const invoiceName = (nameEn || clientName || '').trim();

      // 1) دفتر الحسابات الرئيسي = سجل الفواتير الرسمي
      try {
        await this.ledgerRepository.save({
          bookingDate: new Date(),
          ocCode: invoiceId,
          clientName: invoiceName,
          phone: this.normalizePhone(clientPhone || ''),
          course: course || '',
          groupName: isRound ? (roundName || '') : resolvedFinAction,
          status: (parseFloat(remaining) || 0) <= 0 ? 'خالص' : 'أقساط',
          totalPrice: parseFloat(price) || 0,
          paymentMethod: method || 'Cash',
          amountPaid: parseFloat(paid) || 0,
          amountRemaining: parseFloat(remaining) || 0,
          salesAgentEmail: agentEmail || agentName || '',
        });
      } catch (e: any) { warnings.push('Ledger: ' + e.message); }

      // 2) الحسابات الشهرية
      try {
        await this.addFinancialClient(agentId, agentName, new Date().getMonth() + 1, new Date().getFullYear(), {
          action: resolvedFinAction, ocCode: invoiceId, name: clientName, phone: clientPhone || '',
          course, reservation: today, attendance: isRound ? attendanceDate : '', roundId: isRound ? roundId : '',
          method, price: parseFloat(price) || 0, paid: parseFloat(paid) || 0, offer: offer || 'Cash', clientType: clientType || 'New',
        });
      } catch (e: any) { warnings.push('Financial_Data: ' + e.message); }

      // 3) عضو الراوند (لو حجز راوند) — وإلا سجل دفع انتظار
      if (isRound) {
        try {
          const rm = await this.addRoundMember(roundId, {
            ocCode: invoiceId, name: clientName, phone: clientPhone || '', action: 'New',
            price: parseFloat(price) || 0, paid: parseFloat(paid) || 0, method: method || 'Cash',
            attendance: attendanceDate || '', agentId, agentName, nextDueDate,
          });
          // addRoundMember ترجع {success:false} دون رمي استثناء لو فشلت — لازم نُظهرها
          if (rm && rm.success === false) warnings.push('Round_Members: ' + (rm.message || 'تعذّر تسجيل العميل في الراوند'));
        } catch (e: any) { warnings.push('Round_Members: ' + e.message); }
      } else {
        try {
          await this.addClientPayment(
            invoiceId, clientName, clientPhone || '', course, '', resolvedFinAction,
            parseFloat(price) || 0, agentId, agentName, parseFloat(paid) || 0,
            (parseFloat(remaining) > 0 && nextDueDate) ? nextDueDate : '', resolvedFinAction,
          );
        } catch (e: any) { warnings.push('Client_Payments: ' + e.message); }
      }

      const html = this.buildInvoiceHtml({
        invoiceId, today, clientName, nameEn, clientPhone: clientPhone || '', course,
        offer, attendanceDate, price: parseFloat(price) || 0, paid: parseFloat(paid) || 0,
        remaining: parseFloat(remaining) || 0, method: method || 'Cash', agentName,
      });

      // Email is sent by the frontend via emailInvoicePng after it renders the
      // invoice to a PNG — Gmail strips flex/grid styles, so raw HTML looks broken.
      const emailNote = '';

      await this.triggerCelebrationSafe(agentName);
      await this.logActivity(agentId, agentName, 'DIRECT_INVOICE', `${clientName} - ${price} EGP`);

      const result: any = { success: true, message: `✅ تم تسجيل الفاتورة بنجاح${emailNote}!`, invoiceId, html };
      if (warnings.length) {
        result.warnings = warnings;
        result.message = '⚠️ تم تسجيل الفاتورة لكن تعذّر تحديث بعض السجلات: ' + warnings.join(' | ');
      }
      return result;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateUserField(userId: string, field: string, value: any) {
    try {
      const allowed = ['email', 'name', 'role'];
      if (!allowed.includes(field)) return { success: false, message: 'حقل غير مسموح' };
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) return { success: false, message: 'المستخدم غير موجود' };
      (user as any)[field] = (value ?? '').toString().trim();
      await this.userRepository.save(user);
      return { success: true, message: '✅ تم الحفظ' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 1. LOGIN
  async login(username: string, password: string) {
    try {
      const user = await this.userRepository.findOne({ where: { username: username.trim() } });
      if (!user) {
        return { success: false, message: "❌ اسم المستخدم أو كلمة المرور غلط" };
      }
      
      const passMatch = await bcrypt.compare(password.trim(), user.password);
      if (!passMatch && password.trim() !== user.password) { // fallback for plain text if any
        return { success: false, message: "❌ اسم المستخدم أو كلمة المرور غلط" };
      }

      if (!user.active) {
        return { success: false, message: "⛔ الحساب موقوف. تواصل مع المدير." };
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          pages: user.permissions || [],
          agentKey: user.name,
          email: user.email || '',
        },
      };
    } catch (e: any) {
      return { success: false, message: 'خطأ في السيستم: ' + e.message };
    }
  }

  // 2. VALIDATE SESSION
  async validateSession(userId: string) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      const user = await this.userRepository.findOne({
        where: isUuid ? [{ id: userId }, { legacyId: userId }] : { legacyId: userId },
      });
      if (!user) {
        return { success: false, message: "User not found" };
      }
      if (!user.active) {
        return { success: false, message: "Account deactivated" };
      }
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          pages: user.permissions || [],
          agentKey: user.name,
          email: user.email || '',
        },
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private async findUser(agentId: string) {
    if (!agentId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);
    return this.userRepository.findOne({
      where: isUuid ? [{ id: agentId }, { legacyId: agentId }] : { legacyId: agentId },
    });
  }

  // 3. GET SERVER DATE
  getServerDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // 4. GET DASHBOARD DATA
  async getDashboardData(agentId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user is admin
      const user = await this.findUser(agentId);
      const isAdmin = user && (user.role === 'Manager' || user.role === 'Admin');

      // KPIs distribution
      const leads = await this.myLeadRepository.find({
        relations: { agent: true },
      });

      let calls = 0, won = 0, lost = 0, fu = 0, na = 0, delayed = 0, waiting = 0, reservation = 0, notInterested = 0, wrongNumber = 0, rec = 0;

      // Filter by agent if not admin
      const filteredLeads = isAdmin
        ? leads.filter(l => l.agent && l.agent.active)
        : leads.filter(l => l.agent && l.agent.active && (l.agent.id === agentId || l.agent.legacyId === agentId));

      filteredLeads.forEach(l => {
        const status = (l.status || '').toLowerCase().trim();
        if (status.includes('won recommendation') || status.includes('recommendation')) rec++;
        else if (status === 'closed won') won++;
        else if (status.includes('reservation')) reservation++;
        else if (status.includes('need follow up') || status.includes('follow up')) fu++;
        else if (status.includes('no answer')) na++;
        else if (status.includes('waiting client') || status.includes('waiting')) waiting++;
        else if (status.includes('delayed')) delayed++;
        else if (status.includes('closed lost')) lost++;
        else if (status.includes('not interested')) notInterested++;
        else if (status.includes('wrong number')) wrongNumber++;
      });

      // Today's calls count
      const logs = await this.callLogRepository.find({
        relations: { lead: { agent: true } }
      });
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        const isToday = logDate.getTime() === today.getTime();
        const matchesAgent = isAdmin || (log.lead && log.lead.agent && (log.lead.agent.id === agentId || log.lead.agent.legacyId === agentId));
        return isToday && matchesAgent;
      });
      calls = todayLogs.length;

      // Today's Closed Won count (including recommendation & reservation)
      const loggedWonLeadIds = new Set(
        todayLogs
          .filter(log => {
            const st = (log.status || '').toLowerCase().trim();
            return st.includes('closed won') || st.includes('won recommendation') || st.includes('reservation');
          })
          .map(log => log.lead?.id)
          .filter(Boolean)
      );

      filteredLeads.forEach(l => {
        if (!l.date) return;
        const leadDate = new Date(l.date);
        leadDate.setHours(0, 0, 0, 0);
        if (leadDate.getTime() === today.getTime()) {
          const st = (l.status || '').toLowerCase().trim();
          if (st.includes('closed won') || st.includes('won recommendation') || st.includes('reservation')) {
            loggedWonLeadIds.add(l.id);
          }
        }
      });

      const todayWins = loggedWonLeadIds.size;
      const rate = todayWins > 0 ? Math.round((todayWins / (todayLogs.length || 1)) * 100) : 0;

      // Active follow ups count for this agent (or all if admin)
      const fuActions = ["follow up", "need follow", "delayed"];
      const activeFollowUps = filteredLeads.filter(l => {
        const act = (l.status || "").toLowerCase().trim();
        const isFu = fuActions.some(x => act.includes(x));
        return isFu && l.followUpDate;
      });

      // Due follow ups list (due today or overdue)
      const dueLeads = activeFollowUps.filter(l => {
        const fuDay = new Date(l.followUpDate);
        fuDay.setHours(0, 0, 0, 0);
        const diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);
        return diff <= 0;
      });

      const fuCount = dueLeads.length;

      // Active waiting clients count (excluding enrolled)
      const roundMembers = await this.roundMemberRepository.find();
      const payments = await this.clientPaymentRepository.find();
      const enrolledIds = new Set<string>();
      roundMembers.forEach(rm => {
        if (rm.ocCode) enrolledIds.add(rm.ocCode.trim().toLowerCase());
      });
      payments.forEach(p => {
        if (p.isDeleted) return;
        const cpRoundId = p.roundLegacyId || '';
        const cpOc = p.legacyId || '';
        if (cpRoundId && cpRoundId.toLowerCase() !== 'wait' && cpOc) enrolledIds.add(cpOc.trim().toLowerCase());
      });

      const waitingCount = filteredLeads.filter(l => {
        const st = (l.status || '').toLowerCase().trim();
        if (!st.includes('waiting')) return false;
        const clientId = l.legacyId || l.id;
        if (enrolledIds.has(clientId.trim().toLowerCase())) return false;
        if (l.followUpDate) {
          const fuDay = new Date(l.followUpDate);
          fuDay.setHours(0, 0, 0, 0);
          const diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);
          if (diff > 3) return false;
        }
        return true;
      }).length;

      const kpis = {
        calls,
        won: todayWins,
        rate,
        fuCount,
        waitingCount,
        dist: {
          won, fu, na, lost, delayed, waiting, reservation, notInterested, wrongNumber, rec
        }
      };

      const fuData = {
        due: dueLeads.map(l => {
          const fuDay = new Date(l.followUpDate);
          fuDay.setHours(0, 0, 0, 0);
          const diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);

          const fuTime = (l.followUpDate.getHours() !== 0 || l.followUpDate.getMinutes() !== 0)
            ? formatTimeToAmPm(l.followUpDate)
            : '';

          return {
            id: l.id,
            name: l.name,
            course: l.course,
            agentName: l.agent ? l.agent.name : '-',
            overdue: diff < 0,
            daysText: diff === 0 ? (fuTime ? "اليوم " + fuTime : "اليوم") : "متأخر " + Math.abs(diff) + " يوم",
          };
        }),
        upcoming: [],
      };

      // Active tasks for current sales agent (or all if admin)
      const allPendingTasks = await this.taskRepository.find({ where: { status: 'Pending' } });
      const tasksFiltered = isAdmin
        ? allPendingTasks
        : allPendingTasks.filter(t => t.agentId === agentId || (user && t.agentId === user.legacyId));

      const filteredTasks = tasksFiltered.map(t => ({
        id: t.id,
        note: t.note,
        status: t.status,
        time: t.time ? t.time.toISOString() : null,
      }));

      // Team performance (mock simplified)
      const team = [];
      if (isAdmin) {
        const users = await this.userRepository.find({ where: { role: 'Sales' } });
        for (const u of users) {
          const uLeads = leads.filter(l => l.agent && l.agent.id === u.id);
          const uWon = uLeads.filter(l => (l.status || '').toLowerCase() === 'closed won').length;
          team.push({
            name: u.name,
            calls: 10, // mock dummy
            won: uWon,
            rate: uLeads.length > 0 ? Math.round((uWon / uLeads.length) * 100) : 0,
          });
        }
      }

      // Fetch unread notifications for this agent/user
      const notifs = await this.notificationRepository.find({
        where: [
          { recipientId: agentId, isRead: false },
          { recipientId: (user && user.legacyId) ? user.legacyId : agentId, isRead: false }
        ],
        order: { createdAt: 'DESC' }
      });

      return {
        kpis,
        fuData,
        tasks: filteredTasks,
        team,
        notifications: notifs.map(n => ({
          id: n.id,
          type: n.type,
          message: n.message,
          refId: n.refId,
          createdAt: n.createdAt ? n.createdAt.toISOString() : '',
        }))
      };
    } catch (e: any) {
      return { kpis: {}, fuData: { due: [], upcoming: [] }, tasks: [], team: [], notifications: [] };
    }
  }

  // 5. GET CLIENT BY PHONE
  async getClientByPhone(phone: string) {
    try {
      const cleanPhone = phone.trim();
      if (!cleanPhone) return { success: false, message: 'أدخل رقم هاتف صحيح' };

      // Search in MyLeads
      const lead = await this.myLeadRepository.findOne({
        where: { phone: cleanPhone },
        relations: { agent: true, callLogs: true },
      });

      // Search in RawLeads
      const rawLead = await this.rawLeadRepository.findOne({
        where: { phone: cleanPhone },
        relations: { agent: true },
      });

      if (lead) {
        const finalCourse = lead.course || (rawLead ? rawLead.course : '') || '';
        const finalSource = lead.source || (rawLead ? rawLead.source : '') || '';
        const finalCampaign = lead.campaignType || (rawLead ? rawLead.campaignType : '') || '';

        const finalOc = (lead.legacyId || '').toLowerCase().startsWith('oc-') ? lead.legacyId : '';

        return {
          success: true,
          client: {
            id: this.fmtClientId(rawLead ? rawLead.clientNumber : null) || (lead.legacyId || lead.id),
            name: lead.name,
            phone: lead.phone,
            course: finalCourse,
            agent: lead.agent ? lead.agent.name : '',
            agentId: lead.agent ? lead.agent.id : '',
            status: lead.status || '',
            lastAction: lead.status || '',
            ocCode: finalOc,
            campaignType: finalCampaign,
            source: finalSource,
            notes: lead.action ? lead.action.split('\n').filter(line => line.trim()) : [],
          },
        };
      }

      if (rawLead) {
        const finalOc = (rawLead.ocCode || '').toLowerCase().startsWith('oc-') ? rawLead.ocCode : '';
        return {
          success: true,
          client: {
            id: this.fmtClientId(rawLead.clientNumber) || (rawLead.legacyId || rawLead.id),
            name: rawLead.name,
            phone: rawLead.phone,
            course: rawLead.course || '',
            agent: rawLead.agent ? rawLead.agent.name : '',
            agentId: rawLead.agent ? rawLead.agent.id : '',
            status: rawLead.status || '',
            lastAction: rawLead.status || '',
            ocCode: finalOc,
            campaignType: rawLead.campaignType || '',
            source: rawLead.source || '',
            notes: [],
          },
        };
      }

      return { success: false, message: 'لم يتم العثور على عميل بهذا الرقم' };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  // 6. GET SUPPORT REQUESTS
  async getSupportRequests(agentId: string) {
    try {
      const list = await this.supportRepository.find({
        where: { hidden: false },
        relations: { agent: true }
      });
      const activeList = list.filter(req => req.status !== 'Resolved' && req.status !== 'Done');
      const items = activeList.map(req => ({
        id: req.id,
        agentId: req.agent ? req.agent.id : '',
        agentName: req.agentName,
        clientName: req.clientName,
        clientPhone: req.clientPhone,
        clientOC: req.clientOc,
        comment: req.comment,
        status: req.status,
        managerResult: req.managerResult,
        createdAt: req.createdAt ? req.createdAt.toISOString() : '',
        resolvedAt: req.resolvedAt ? req.resolvedAt.toISOString() : '',
      }));
      items.reverse();
      return { success: true, items };
    } catch (e: any) {
      return { success: false, message: e.message, items: [] };
    }
  }

  // 7. ADD SUPPORT REQUEST
  async addSupportRequest(agentId: string, agentName: string, clientName: string, clientPhone: string, clientOC: string, comment: string) {
    try {
      if (!comment) return { success: false, message: 'اكتب الكومنت المطلوب من المدير' };
      if (!clientName && !clientPhone) return { success: false, message: 'حدّد العميل (اسم أو رقم موبايل)' };

      const user = await this.findUser(agentId);

      const req = new SupportRequest();
      req.agent = user;
      req.agentName = agentName || (user ? user.name : 'Unknown');
      req.clientName = clientName;
      req.clientPhone = clientPhone;
      req.clientOc = clientOC;
      req.comment = comment;
      req.status = 'Pending';
      req.createdAt = new Date();

      await this.supportRepository.save(req);
      return { success: true, message: 'تم إرسال العميل للمدير ✅' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 8. RESOLVE SUPPORT REQUEST
  async resolveSupportRequest(id: string, txt: string, adminId: string) {
    try {
      const req = await this.supportRepository.findOne({ where: { id } });
      if (!req) return { success: false, message: 'الطلب غير موجود' };

      req.status = 'Resolved';
      req.managerResult = txt;
      req.resolvedAt = new Date();
      req.hidden = true;

      await this.supportRepository.save(req);

      let lead = null;
      if (req.clientPhone && req.clientPhone.trim()) {
        const phClean = req.clientPhone.trim();
        lead = await this.myLeadRepository.findOne({
          where: { phone: phClean },
          relations: { agent: true }
        });
        if (!lead) {
          const allLeads = await this.myLeadRepository.find({ relations: { agent: true } });
          lead = allLeads.find(l => l.phone && l.phone.includes(phClean));
        }
      }
      if (!lead && req.clientOc && req.clientOc.trim()) {
        const ocClean = req.clientOc.trim();
        lead = await this.myLeadRepository.findOne({
          where: [
            { id: ocClean },
            { legacyId: ocClean }
          ],
          relations: { agent: true }
        });
      }

      if (lead) {
        const supporterUser = await this.findUser(adminId);
        const supporterName = supporterUser ? supporterUser.name : 'الدعم الفني';
        const _now = new Date();
        const _pad = (n: number) => String(n).padStart(2, '0');
        const ts = `${formatTimeToAmPm(_now)} ${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;

        const noteLine = `[${supporterName} - ${ts}] (رد الدعم للعميل): ${txt}`;
        lead.legacyNotes = lead.legacyNotes ? `${lead.legacyNotes}\n${noteLine}` : noteLine;
        await this.myLeadRepository.save(lead);
      }

      // Create notification for the sales agent who requested support
      if (req.agent) {
        const notif = new AcademyNotification();
        notif.recipientId = req.agent.id;
        notif.recipientType = 'Agent';
        notif.type = 'SupportResolved';
        notif.message = `تم الرد وحل طلب الدعم الفني للعميل: ${req.clientName || 'غير معروف'} بـ: "${txt}"`;
        notif.refId = lead ? lead.id : (req.clientOc || '');
        notif.isRead = false;
        notif.createdAt = new Date();
        await this.notificationRepository.save(notif);
      }

      return { success: true, message: 'تم حل الطلب وإضافة الرد كتعليق للعميل بنجاح ✅' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 8b. MARK NOTIFICATION AS READ
  async markNotificationRead(token: string, id: string) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };
    try {
      const notif = await this.notificationRepository.findOne({ where: { id } });
      if (notif) {
        notif.isRead = true;
        await this.notificationRepository.save(notif);
        return { success: true };
      }
      return { success: false, message: 'الإشعار غير موجود' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 9. GET EXCEPTION REQUESTS
  async getExceptionRequests(agentId: string, filters?: { employeeId?: string; month?: string; showAll?: boolean }) {
    try {
      const user = await this.findUser(agentId);
      const isElevated = user && (user.role === 'Manager' || user.role === 'Admin' || user.role === 'admin' || user.role === 'Operation' || user.role === 'Senior Sales');

      const list = await this.exceptionRepository.find({ relations: { agent: true } });
      let filteredList = isElevated
        ? list
        : list.filter(req => (req.agent && (req.agent.id === agentId || req.agent.legacyId === agentId)) || (user && req.agentName === user.name));

      // Apply employee filter
      if (filters?.employeeId) {
        filteredList = filteredList.filter(req => req.agent && (req.agent.id === filters.employeeId || req.agent.legacyId === filters.employeeId));
      }

      // Apply month filter (month is in format "YYYY-MM")
      if (filters?.month) {
        filteredList = filteredList.filter(req => {
          if (!req.createdAt) return false;
          const dateStr = new Date(req.createdAt).toISOString().slice(0, 7);
          return dateStr === filters.month;
        });
      }

      // Apply showAll filter
      if (!filters?.showAll) {
        filteredList = filteredList.filter(req => req.status === 'Pending' || req.status === 'Approved');
      }

      // 1. Build a lookup map of MyLeads to populate `history`
      const allLeads = await this.myLeadRepository.find({ relations: { agent: true } });
      const leadMap = new Map<string, MyLead>();
      for (const lead of allLeads) {
        if (lead.phone) leadMap.set(lead.phone.trim(), lead);
        if (lead.legacyId) leadMap.set(lead.legacyId.trim(), lead);
      }

      // 2. Group exceptions by client to calculate sequence numbers `seq` and `totalForClient`
      const clientExcGroups = new Map<string, ExceptionRequest[]>();
      for (const r of list) {
        let key = '';
        if (r.clientPhone) key = r.clientPhone.trim();
        else if (r.clientOc) key = r.clientOc.trim();
        else if (r.clientName) key = r.clientName.trim().toLowerCase();
        
        if (!key) continue;
        if (!clientExcGroups.has(key)) {
          clientExcGroups.set(key, []);
        }
        clientExcGroups.get(key)!.push(r);
      }

      // Sort chronological in each group
      for (const [key, group] of clientExcGroups.entries()) {
        group.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });
      }

      const items = filteredList.map(req => {
        let key = '';
        if (req.clientPhone) key = req.clientPhone.trim();
        else if (req.clientOc) key = req.clientOc.trim();
        else if (req.clientName) key = req.clientName.trim().toLowerCase();

        const group = key ? clientExcGroups.get(key) || [] : [];
        const totalForClient = group.length;
        const seq = group.indexOf(req) + 1;

        let matchedLead: MyLead | null = null;
        if (req.clientPhone) matchedLead = leadMap.get(req.clientPhone.trim()) || null;
        if (!matchedLead && req.clientOc) matchedLead = leadMap.get(req.clientOc.trim()) || null;

        const history = matchedLead ? {
          course: matchedLead.course || '',
          status: matchedLead.status || '',
          action: matchedLead.action || '',
          agent: matchedLead.agent ? matchedLead.agent.name : (matchedLead.agentLegacyId || ''),
          notes: matchedLead.legacyNotes || ''
        } : null;

        return {
          id: req.id,
          agentId: req.agent ? req.agent.id : '',
          agentName: req.agentName,
          clientName: req.clientName,
          clientPhone: req.clientPhone,
          clientOC: req.clientOc,
          type: req.type,
          details: req.details,
          status: req.status,
          deadline: req.deadline ? req.deadline.toISOString() : '',
          deadlineTs: req.deadline ? new Date(req.deadline).getTime() : null,
          adminNote: req.adminNote,
          createdAt: req.createdAt ? req.createdAt.toISOString() : '',
          seq,
          totalForClient,
          history
        };
      });

      // Sort items by createdAt descending (newest first)
      items.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 3. Dynamic chronological week-by-week overage carryover calculation
      const agentList = list.filter(r => r.agent && r.agent.id === agentId && r.status !== 'Cancelled');
      const monthlyUsed = agentList.filter(r => r.createdAt && new Date(r.createdAt) >= startOfMonth).length;

      const curSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      curSunday.setHours(0, 0, 0, 0);
      const curWeekKey = curSunday.toISOString().slice(0, 10);

      const weeklyGroups: Record<string, number> = {};
      weeklyGroups[curWeekKey] = 0;

      const monthRequests = agentList.filter(r => r.createdAt && new Date(r.createdAt) >= startOfMonth);
      for (const r of monthRequests) {
        const reqDate = new Date(r.createdAt!);
        const sunday = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate() - reqDate.getDay());
        sunday.setHours(0, 0, 0, 0);
        const wKey = sunday.toISOString().slice(0, 10);
        weeklyGroups[wKey] = (weeklyGroups[wKey] || 0) + 1;
      }

      const sortedWeeks = Object.keys(weeklyGroups).sort();
      let carryover = 0;
      const weeklyLimit = 2;

      for (const wKey of sortedWeeks) {
        if (wKey < curWeekKey) {
          const count = weeklyGroups[wKey] || 0;
          const totalEffective = count + carryover;
          carryover = Math.max(0, totalEffective - weeklyLimit);
        }
      }

      const currentWeekRaw = weeklyGroups[curWeekKey] || 0;
      const weeklyUsed = currentWeekRaw + carryover;

      const monthlyLimit = 10;
      const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);

      const quota = {
        monthlyLimit,
        monthlyUsed,
        monthlyRemaining,
        weeklyLimit,
        weeklyUsed,
      };

      return { success: true, items, elevated: isElevated, quota };
    } catch (e: any) {
      return { success: false, message: e.message, items: [] };
    }
  }

  // 10. ADD EXCEPTION REQUEST
  async addExceptionRequest(agentId: string, agentName: string, clientName: string, clientPhone: string, clientOC: string, type: string, details: string) {
    try {
      if (!type) return { success: false, message: 'حدّد نوع الاستثناء' };
      if (!clientName && !clientPhone) return { success: false, message: 'حدّد العميل (اسم أو رقم موبايل)' };

      const user = await this.findUser(agentId);

      const req = new ExceptionRequest();
      req.agent = user;
      req.agentName = agentName || (user ? user.name : 'Unknown');
      req.clientName = clientName;
      req.clientPhone = clientPhone;
      req.clientOc = clientOC;
      req.type = type;
      req.details = details;
      req.status = 'Pending';
      req.createdAt = new Date();

      await this.exceptionRepository.save(req);

      const list = await this.exceptionRepository.find({ relations: { agent: true } });
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const agentList = list.filter(r => r.agent && r.agent.id === agentId && r.status !== 'Cancelled');
      const monthlyUsed = agentList.filter(r => r.createdAt && new Date(r.createdAt) >= startOfMonth).length;

      const curSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      curSunday.setHours(0, 0, 0, 0);
      const curWeekKey = curSunday.toISOString().slice(0, 10);

      const weeklyGroups: Record<string, number> = {};
      weeklyGroups[curWeekKey] = 0;

      const monthRequests = agentList.filter(r => r.createdAt && new Date(r.createdAt) >= startOfMonth);
      for (const r of monthRequests) {
        const reqDate = new Date(r.createdAt!);
        const sunday = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate() - reqDate.getDay());
        sunday.setHours(0, 0, 0, 0);
        const wKey = sunday.toISOString().slice(0, 10);
        weeklyGroups[wKey] = (weeklyGroups[wKey] || 0) + 1;
      }

      const sortedWeeks = Object.keys(weeklyGroups).sort();
      let carryover = 0;
      const weeklyLimit = 2;

      for (const wKey of sortedWeeks) {
        if (wKey < curWeekKey) {
          const count = weeklyGroups[wKey] || 0;
          const totalEffective = count + carryover;
          carryover = Math.max(0, totalEffective - weeklyLimit);
        }
      }

      const currentWeekRaw = weeklyGroups[curWeekKey] || 0;
      const weeklyUsed = currentWeekRaw + carryover;

      const monthlyLimit = 10;
      const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);

      const quota = {
        monthlyLimit,
        monthlyUsed,
        monthlyRemaining,
        weeklyLimit,
        weeklyUsed,
      };

      let weekWarning = '';
      if (weeklyUsed > weeklyLimit) {
        weekWarning = `⚠️ تنبيه: تجاوزت الحد الأسبوعي (${weeklyLimit})، وسيتم خصم هذا الاستثناء من رصيد الأسبوع القادم.`;
      }

      return { success: true, message: 'تم إرسال طلب الاستثناء ✅', weekWarning, quota };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 11. DECIDE EXCEPTION REQUEST
  async decideExceptionRequest(id: string, decision: string, deadline: string, note: string, adminId: string) {
    try {
      const req = await this.exceptionRepository.findOne({ where: { id }, relations: { agent: true } });
      if (!req) return { success: false, message: 'الطلب غير موجود' };

      if (decision === 'approve') {
        req.status = 'Approved';
        req.deadline = deadline ? new Date(deadline) : null;
      } else {
        req.status = 'Rejected';
      }
      req.adminNote = note;
      req.decidedAt = new Date();

      await this.exceptionRepository.save(req);

      // Create notification for the sales agent who requested the exception
      if (req.agent) {
        let refId = req.clientOc || '';
        const lead = await this.myLeadRepository.findOne({
          where: [
            { phone: req.clientPhone },
            { legacyId: req.clientOc },
            { id: req.clientOc }
          ]
        });
        if (lead) {
          refId = lead.id;
        }

        const notif = new AcademyNotification();
        notif.recipientId = req.agent.id;
        notif.recipientType = 'Agent';
        notif.type = 'ExceptionDecision';
        const statusAr = req.status === 'Approved' ? 'الموافقة على' : 'رفض';
        notif.message = `تم ${statusAr} طلب استثناء العميل: ${req.clientName || 'غير معروف'} (${req.type || ''})`;
        notif.refId = refId;
        notif.isRead = false;
        notif.createdAt = new Date();
        await this.notificationRepository.save(notif);
      }

      return { success: true, message: decision === 'approve' ? 'تمت الموافقة ✅' : 'تم الرفض' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 12. CANCEL EXCEPTION REQUEST
  async cancelExceptionRequest(id: string, agentId: string) {
    try {
      const req = await this.exceptionRepository.findOne({ where: { id } });
      if (!req) return { success: false, message: 'الطلب غير موجود' };

      req.status = 'Cancelled';
      req.resolvedAt = new Date();

      await this.exceptionRepository.save(req);
      return { success: true, message: 'تم إلغاء الاستثناء' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 13. COMPLETE TASK
  async completeTask(id: string) {
    try {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (task) {
        task.status = 'Completed';
        await this.taskRepository.save(task);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // 14. DELETE TASK
  async deleteTask(id: string) {
    try {
      await this.taskRepository.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  // 15. TOGGLE USER ACTIVE
  async toggleUserActive(id: string, active: boolean) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (user) {
        user.active = active;
        await this.userRepository.save(user);
        return { success: true };
      }
      return { success: false, message: 'المستخدم غير موجود' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 16. DELETE USER
  async deleteUser(id: string) {
    try {
      await this.userRepository.delete(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 17. RESET PASSWORD
  async resetPassword(id: string, p: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (user) {
        user.password = await bcrypt.hash(p.trim(), 10);
        await this.userRepository.save(user);
        return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
      }
      return { success: false, message: 'المستخدم غير موجود' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 18. VERIFY ACCOUNTING PIN
  async verifyAccountingPin(userId: string, pin: string) {
    const stored = (await this.getSettingValue('acc_pin')) || '000000';
    if ((pin || '').trim() === stored) {
      return { success: true };
    }
    return { success: false, message: 'الرقم السري غلط ❌' };
  }

  async changeAccountingPin(userId: string, currentPin: string, newPin: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || !user.active) return { success: false, message: 'غير مصرح' };
      const next = (newPin || '').trim();
      if (!next || next.length < 4) return { success: false, message: 'الرقم السري الجديد لازم يكون 4 أرقام على الأقل' };
      if (!/^\d+$/.test(next)) return { success: false, message: 'استخدم أرقام فقط' };
      const stored = (await this.getSettingValue('acc_pin')) || '000000';
      if ((currentPin || '').trim() !== stored) return { success: false, message: 'الرقم السري الحالي غلط' };
      await this.setSettingValue('acc_pin', next);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // 19. GET WAITING CLIENTS
  async getWaitingClients(agentId?: string, agentName?: string, isManagerVal?: boolean | string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Determine manager status
      let isMgr = false;
      if (typeof isManagerVal === 'boolean') {
        isMgr = isManagerVal;
      } else if (typeof isManagerVal === 'string') {
        const cleanRole = isManagerVal.toLowerCase().trim();
        isMgr = cleanRole === 'manager' || cleanRole === 'admin' || cleanRole === 'operation';
      }

      if (!isMgr && agentId) {
        const user = await this.findUser(agentId);
        isMgr = user && (user.role === 'Manager' || user.role === 'Admin');
      }

      // Build enrolled set
      const roundMembers = await this.roundMemberRepository.find();
      const payments = await this.clientPaymentRepository.find();

      const enrolledIds = new Set<string>();
      
      roundMembers.forEach(rm => {
        if (rm.ocCode) enrolledIds.add(rm.ocCode.trim().toLowerCase());
      });

      payments.forEach(p => {
        if (p.isDeleted) return;
        const cpRoundId = p.roundLegacyId || '';
        const cpOc = p.legacyId || '';
        if (cpRoundId && cpRoundId.toLowerCase() !== 'wait' && cpOc) {
          enrolledIds.add(cpOc.trim().toLowerCase());
        }
      });

      // Filter MyLeads with Action contains 'waiting'
      const query = this.myLeadRepository.createQueryBuilder('l')
        .leftJoinAndSelect('l.agent', 'agent')
        .where('l.status LIKE :status', { status: '%waiting%' })
        .andWhere('agent.active = :active', { active: true });

      if (!isMgr && agentId) {
        query.andWhere('(agent.id = :agentId OR agent.legacyId = :agentId)', { agentId });
      }

      const filteredLeads = await query.getMany();

      const waiting = [];

      for (const l of filteredLeads) {
        // Skip enrolled
        const clientId = l.legacyId || l.id;
        if (enrolledIds.has(clientId.trim().toLowerCase())) continue;

        // Date info
        let diff = null;
        let overdue = false;
        let daysText = 'بدون تاريخ';
        let fuDateStr = '';

        if (l.followUpDate) {
          const fuDay = new Date(l.followUpDate);
          fuDay.setHours(0, 0, 0, 0);
          diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);
          if (diff > 3) continue;
          overdue = diff < 0;
          daysText = diff === 0 ? "اليوم" : diff < 0 ? "متأخر " + Math.abs(diff) + " يوم" : "بعد " + diff + " يوم";
          fuDateStr = l.followUpDate.toISOString().split('T')[0];
        }

        waiting.push({
          id: clientId,
          payId: '',
          name: l.name || '',
          phone: l.phone || '',
          course: l.course || '',
          agent: l.agent ? l.agent.name : '',
          agentName: l.agent ? l.agent.name : '',
          lastAction: l.status || '',
          notes: l.action || '',
          createdAt: l.date ? l.date.toISOString().split('T')[0] : '',
          fuDate: fuDateStr,
          diffDays: diff,
          overdue: overdue,
          daysText: daysText,
        });
      }

      return waiting;
    } catch (e: any) {
      console.error('Error in getWaitingClients:', e);
      return [];
    }
  }

  // 19b. GET DUE FOLLOW UPS
  async getDueFollowUps(agentId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const user = await this.findUser(agentId);
      const isAdmin = user && (user.role === 'Manager' || user.role === 'Admin');

      // Filter MyLeads with status like 'follow up', 'need follow', 'delayed'
      const query = this.myLeadRepository.createQueryBuilder('l')
        .leftJoinAndSelect('l.agent', 'agent')
        .where('(LOWER(l.status) LIKE :fu1 OR LOWER(l.status) LIKE :fu2 OR LOWER(l.status) LIKE :fu3)', {
          fu1: '%follow up%',
          fu2: '%need follow%',
          fu3: '%delayed%'
        })
        .andWhere('agent.active = :active', { active: true });

      if (!isAdmin && agentId) {
        query.andWhere('(agent.id = :agentId OR agent.legacyId = :agentId)', { agentId });
      }

      const filteredLeads = await query.getMany();

      // Optimize raw_leads lookup by only querying matching phone numbers
      const phones = filteredLeads.map(l => l.phone).filter(p => p && p.trim() !== '');
      const rawNums = new Map<string, number>();
      if (phones.length > 0) {
        const rawNumsRows = await this.rawLeadRepository.createQueryBuilder('rl')
          .select(['rl.phone', 'rl.clientNumber'])
          .where('rl.phone IN (:...phones)', { phones })
          .getMany();
        for (const rr of rawNumsRows) {
          if (rr.phone) {
            rawNums.set(rr.phone, rr.clientNumber);
          }
        }
      }

      const due = [];
      const upcoming = [];

      filteredLeads.forEach(l => {
        const fuRaw = l.followUpDate;
        if (!fuRaw) return;

        const fuDay = new Date(fuRaw);
        fuDay.setHours(0, 0, 0, 0);
        const diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);

        const fuTime = (fuRaw.getHours() !== 0 || fuRaw.getMinutes() !== 0)
          ? formatTimeToAmPm(fuRaw)
          : '';

        const _notesArr = (l.legacyNotes || '').split('\n').filter(x => x.trim());
        const lastNote = _notesArr.length ? _notesArr[_notesArr.length - 1] : '';

        const item = {
          name: l.name || '',
          phone: l.phone || '',
          course: l.course || '',
          id: this.fmtClientId(rawNums.get(l.phone || '')) || (l.legacyId || l.id),
          diffDays: diff,
          overdue: diff < 0,
          fuTime: fuTime,
          daysText: diff === 0 ? (fuTime ? "اليوم " + fuTime : "اليوم") : diff < 0 ? "متأخر " + Math.abs(diff) + " يوم" : "بعد " + diff + " يوم",
          agentName: l.agent ? l.agent.name : '—',
          notes: lastNote,
        };

        if (diff <= 0) due.push(item);
        else if (diff <= 3) upcoming.push(item);
      });

      return { due, upcoming };
    } catch {
      return { due: [], upcoming: [] };
    }
  }

  // 20. GET MY LEADS
  async getMyLeads(agentId: string, agentName: string, role: string) {
    try {
      const isMgr = role && ['manager', 'admin', 'operation'].includes(role.toLowerCase().trim());
      
      const whereCondition: any = {};
      if (!isMgr && agentId) {
        whereCondition.agent = { id: agentId };
      }
      
      const leads = await this.myLeadRepository.find({
        where: whereCondition,
        relations: { agent: true },
      });

      const filteredLeads = isMgr
        ? leads
        : leads.filter(l => l.agent && (l.agent.id === agentId || l.agent.legacyId === agentId));

      const phones = filteredLeads.map(l => l.phone).filter(p => p && p.trim() !== '');
      const rawNums = new Map<string, number>();
      if (phones.length > 0) {
        const rawNumsRows = await this.rawLeadRepository.createQueryBuilder('rl')
          .select(['rl.phone', 'rl.clientNumber'])
          .where('rl.phone IN (:...phones)', { phones })
          .getMany();
        for (const rr of rawNumsRows) {
          if (rr.phone) {
            rawNums.set(rr.phone, rr.clientNumber);
          }
        }
      }

      const result = filteredLeads.map(l => {
        const createdAtDate = l.date ? new Date(l.date) : null;
        const createdAtStr = createdAtDate ? `${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(createdAtDate.getDate()).padStart(2, '0')}` : '';
        const fuDateDate = l.followUpDate ? new Date(l.followUpDate) : null;
        const fuDateStr = fuDateDate ? `${fuDateDate.getFullYear()}-${String(fuDateDate.getMonth() + 1).padStart(2, '0')}-${String(fuDateDate.getDate()).padStart(2, '0')}` : '';

        return {
          id: this.fmtClientId(rawNums.get(l.phone || '')) || (l.legacyId || l.id),
          name: l.name || '',
          phone: l.phone || '',
          course: l.course || '',
          agent: l.agent ? l.agent.name : '',
          status: l.status || '',
          lastAction: l.status || '',
          notes: l.legacyNotes ? l.legacyNotes.split('\n').filter(line => line.trim()) : [],
          fuDate: fuDateStr,
          createdAt: createdAtStr,
          _sortTs: createdAtDate ? createdAtDate.getTime() : 0,
        };
      });

      // ترتيب تنازلي بتاريخ التسجيل (الأحدث فوق) بدل ترتيب الداتابيز العشوائي
      result.sort((a, b) => b._sortTs - a._sortTs);
      result.forEach((r: any) => { delete r._sortTs; });
      return result;
    } catch (e) {
      return [];
    }
  }

  // 21. GET ROUNDS
  async getRounds() {
    try {
      const list = await this.roundRepository.find();
      return list.map(r => {
        const startDateStr = r.startDate ? new Date(r.startDate).toISOString().split('T')[0] : '';
        return {
          id: r.legacyId || r.id,
          name: r.name || '',
          startDate: startDateStr,
          schedule: r.schedule || '',
          maxSeats: r.maxSeats || 15,
          enrolled: r.enrolled || 0,
          status: r.status || 'Active',
          type: r.type || 'Online',
          instructor: r.instructorName || '',
          offerPrice: parseFloat(r.offerPrice as any) || 0,
          offerExpiry: r.offerExpiry ? new Date(r.offerExpiry).toISOString().split('T')[0] : '',
        };
      });
    } catch {
      return [];
    }
  }

  // 22. GET USERS
  async getUsers() {
    try {
      const list = await this.userRepository.find();
      return list.map(u => ({
        id: u.id,
        name: u.name || '',
        username: u.username || '',
        role: u.role || '',
        active: u.active,
        pages: u.permissions || [],
        agentKey: u.name || '',
        email: u.email || '',
      }));
    } catch {
      return [];
    }
  }

  // 23. GET CLIENT PAYMENTS
  // Ported 1:1 from the legacy sheet version: returns ALL active payments for every viewer
  // (the frontend does its own grouping/role handling), enriches phone/OC from Raw_Data,
  // attaches per-payment transaction amounts, and computes installPaid exactly like the sheet did.
  async getClientPayments(agentId: string, isManager: boolean) {
    try {
      // OC/clientId → { phone, ocCode } map from Raw_Data
      const rawLeads = await this.rawLeadRepository.find();
      const clientMap = new Map<string, { phone: string; ocCode: string }>();
      for (const r of rawLeads) {
        const oc = (r.ocCode || '').trim();
        const info = { phone: r.phone || '', ocCode: oc.toLowerCase().startsWith('oc-') ? oc : '' };
        if (r.legacyId) clientMap.set(r.legacyId.trim(), info);
        if (info.ocCode) clientMap.set(info.ocCode, info);
      }

      // Pay_ID → [transaction amounts]
      const txs = await this.transactionRepository.find();
      const txMap = new Map<string, number[]>();
      for (const t of txs) {
        const pid = (t.legacyPaymentId || '').trim();
        if (!pid) continue;
        const amt = Number(t.amount) || 0;
        if (!txMap.has(pid)) txMap.set(pid, []);
        txMap.get(pid)!.push(amt);
      }

      const list = await this.clientPaymentRepository.find({ relations: { agent: true } });
      return list
        .filter((p) => !p.isDeleted)
        .map((p) => {
          const pid = (p.legacyId || p.id).toString();
          const clientId = (p.clientLegacyId || '').trim();
          const info = clientMap.get(clientId) || { phone: '', ocCode: clientId.toLowerCase().startsWith('oc-') ? clientId : '' };
          const total = Number(p.totalAmount) || 0;
          const paid = Number(p.amountPaid) || 0;
          const i1 = Number(p.amountDetail1) || 0;
          const i2 = Number(p.amountDetail2) || 0;
          const i3 = Number(p.amountDetail3) || 0;
          // installPaid = paid minus the down payment (total - inst1 - inst2 - inst3), floored at 0
          const installPaid = Math.max(0, paid - Math.max(0, total - i1 - i2 - i3));
          return {
            id: pid,
            clientId,
            clientName: p.clientName || '',
            phone: info.phone,
            ocCode: info.ocCode,
            course: p.course || '',
            roundId: p.roundLegacyId || '',
            roundName: p.roundName || '',
            total,
            agentId: p.agent ? (p.agent.legacyId || p.agent.id) : (p.agentLegacyId || ''),
            agentName: p.agent?.name || p.agentUsername || '',
            paid,
            remaining: Number(p.amountUnpaid) || 0,
            nextDue: p.paymentTime ? new Date(p.paymentTime).toISOString().slice(0, 10) : '',
            status: p.status || 'Pending',
            notes: p.notes || '',
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '',
            inst1: i1,
            inst2: i2,
            inst3: i3,
            pymts: txMap.get(pid) || [],
            installPaid,
            lastModified: p.lastModified ? new Date(p.lastModified).toISOString() : '',
          };
        });
    } catch {
      return [];
    }
  }

  // 24. GET COURSES
  async getCourses() {
    try {
      const list = await this.courseRepository.find({ where: { active: true } });
      return list.map(c => ({
        id: c.id,
        name: c.courseName || '',
      }));
    } catch {
      return [];
    }
  }

  // 25. GET OFFERS
  async getOffers() {
    try {
      const list = await this.offerRepository.find({ where: { active: true } });
      return list.map(o => ({
        id: o.id,
        name: o.offerName || '',
      }));
    } catch {
      return [];
    }
  }

  // 26. GET INSTRUCTOR LIST
  // Legacy shape: a plain array of instructor names (strings) from the managed list,
  // falling back to the academy instructors table.
  async getInstructorList() {
    try {
      const stored = await this.getSettingValue('instructorList');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length) return list;
      }
      const rows = await this.instructorRepository.find({ where: { active: true } });
      return rows.map((i) => i.name).filter(Boolean);
    } catch {
      return [];
    }
  }

  // 27. GET CLIENT BY ID
  async getClientById(clientId: string) {
    try {
      if (!clientId) return { success: false, message: 'العميل غير موجود' };

      const idStr = String(clientId).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
      const refNum = this.parseClientRef(idStr);

      // Search in RawLeads — the sequential clientNumber is the primary public identifier now
      let rawLead = refNum !== null
        ? await this.rawLeadRepository.findOne({ where: { clientNumber: refNum }, relations: { agent: true } })
        : null;
      if (!rawLead) {
        rawLead = await this.rawLeadRepository.findOne({
          where: isUuid ? [{ id: idStr }, { legacyId: idStr }, { ocCode: idStr }] : [{ legacyId: idStr }, { ocCode: idStr }],
          relations: { agent: true },
        });
      }

      // Search in MyLeads (fall back to the raw lead's phone for number-based lookups)
      let lead = await this.myLeadRepository.findOne({
        where: isUuid ? [{ id: idStr }, { legacyId: idStr }] : { legacyId: idStr },
        relations: { agent: true, callLogs: true },
      });
      if (!lead && rawLead?.phone) {
        lead = await this.myLeadRepository.findOne({
          where: { phone: rawLead.phone },
          relations: { agent: true, callLogs: true },
        });
      }

      if (lead) {
        // الكومنتات بتتحفظ في legacyNotes (سطر لكل مكالمة) — مش في action (اللي فيه اسم الأكشن بس).
        let notes = lead.legacyNotes ? lead.legacyNotes.split('\n').filter(line => line.trim()) : [];
        // لو الملاحظات المسطّحة فاضية، ابنيها من سجل المكالمات المنظّم
        if (!notes.length && lead.callLogs && lead.callLogs.length) {
          notes = [...lead.callLogs]
            .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
            .map((cl) => `[${cl.timestamp ? new Date(cl.timestamp).toISOString() : ''}] ${cl.status || ''}: ${cl.note || ''}`.trim())
            .filter((l) => l && l !== ':');
        }
        const finalCourse = lead.course || (rawLead ? rawLead.course : '') || '';
        const finalSource = lead.source || (rawLead ? rawLead.source : '') || '';
        const finalCampaign = lead.campaignType || (rawLead ? rawLead.campaignType : '') || '';

        const finalOc = (lead.legacyId || '').toLowerCase().startsWith('oc-') ? lead.legacyId : '';
        return {
          success: true,
          client: {
            id: this.fmtClientId(rawLead ? rawLead.clientNumber : null) || (lead.legacyId || lead.id),
            rowIndex: 1,
            name: lead.name || 'غير معروف',
            phone: lead.phone || '',
            course: finalCourse,
            agent: lead.agent ? lead.agent.name : '',
            status: lead.status || '',
            lastAction: lead.status || '',
            ocCode: finalOc,
            source: finalSource,
            campaign: finalCampaign,
            notes: notes,
            lastNote: notes.length ? notes[notes.length - 1] : '',
            isFree: !lead.agent,
            lastModified: lead.date ? lead.date.toISOString() : '',
          },
        };
      }

      if (rawLead) {
        const finalOc = (rawLead.ocCode || '').toLowerCase().startsWith('oc-') ? rawLead.ocCode : '';
        return {
          success: true,
          client: {
            id: this.fmtClientId(rawLead.clientNumber) || (rawLead.legacyId || rawLead.id),
            rowIndex: 1,
            name: rawLead.name || 'غير معروف',
            phone: rawLead.phone || '',
            course: rawLead.course || '',
            agent: rawLead.agent ? rawLead.agent.name : '',
            status: rawLead.status || '',
            lastAction: rawLead.status || '',
            ocCode: finalOc,
            source: rawLead.source || '',
            campaign: rawLead.campaignType || '',
            notes: [],
            lastNote: '',
            isFree: !rawLead.agent,
            lastModified: '',
          },
        };
      }

      return { success: false, message: 'العميل غير موجود' };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  // 28. UPDATE LEAD WITH FOLLOW UP (SAVE CALL)
  async updateLeadWithFollowUp(
    clientId: string,
    action: string,
    comment: string,
    fuDate: string,
    agentId: string,
    agentName: string,
    roundId: string,
    roundName: string,
    price: string,
    paid: string,
    method: string,
    phone1: string,
    phone2: string,
    inst1: number,
    inst2: number,
    inst3: number,
    offer: string,
    newClientName: string,
    inst1Date: string,
    inst2Date: string,
    inst3Date: string,
    clientType: string,
    finAction: string,
    expectedLastModified: string,
  ) {
    try {
      if (!clientId) {
        return { success: false, message: 'لم يتم تحديد كود العميل!' };
      }

      const idStrU = String(clientId).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStrU);
      const refNumU = this.parseClientRef(idStrU);

      let rawLead = refNumU !== null
        ? await this.rawLeadRepository.findOne({ where: { clientNumber: refNumU }, relations: { agent: true } })
        : null;

      let lead = await this.myLeadRepository.findOne({
        where: isUuid ? [{ id: clientId }, { legacyId: clientId }] : { legacyId: clientId },
        relations: { agent: true, callLogs: true },
      });
      if (!lead && rawLead?.phone) {
        lead = await this.myLeadRepository.findOne({
          where: { phone: rawLead.phone },
          relations: { agent: true, callLogs: true },
        });
      }

      if (!rawLead) rawLead = await this.rawLeadRepository.findOne({
        where: isUuid ? [{ id: clientId }, { legacyId: clientId }, { ocCode: clientId }] : [{ legacyId: clientId }, { ocCode: clientId }],
        relations: { agent: true },
      });

      if (!lead && !rawLead) {
        return { success: false, message: '⚠️ تعذّر حفظ المكالمة: لم يتم العثور على هذا العميل في قاعدة البيانات.' };
      }

      const actionBase = action.split('::')[0].trim();
      const lostReasonLabel = action.indexOf('::') !== -1 ? action.split('::')[1].trim() : '';

      let combinedPhone = '';
      if (phone1) {
        combinedPhone = phone1.trim();
        if (phone2) combinedPhone += ' - ' + phone2.trim();
      }

      const targetName = newClientName ? newClientName.trim() : '';

      // صيغة الملاحظة الغنية (زي القديم): [السيلز - الوقت] (نوع الأكشن): الكومنت | FU: الميعاد
      // الكومنت نفسه بيوصل من الواجهة مسبوقاً بـ [HOT]/[COLD] حسب نوع المتابعة اللي اختاره السيلز.
      const _now = new Date();
      const _pad = (n: number) => String(n).padStart(2, '0');
      const ts = `${formatTimeToAmPm(_now)} ${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
      const wonActionsNote = ['Closed Won', 'Closed Won Recommendation', 'Reservation'];
      let noteLine = `[${agentName} - ${ts}] (${actionBase})` +
        (lostReasonLabel ? ` [سبب: ${lostReasonLabel}]` : '') + `: ${comment || ''}`;
      if (fuDate) noteLine += ` | 📅 FU: ${fuDate}`;
      if (roundId) noteLine += ` | 🎓 Round: ${roundName || ''}`;
      if (wonActionsNote.includes(actionBase)) {
        if (price) noteLine += ` | 💰 Price: ${price} EGP`;
        if (paid) noteLine += ` | ✅ Paid: ${paid} EGP`;
        if (method) noteLine += ` | 💳 Method: ${method}`;
      }

      // Update MyLead if exists
      if (lead) {
        if (targetName) lead.name = targetName;
        if (combinedPhone) lead.phone = combinedPhone;
        lead.status = actionBase;
        lead.action = actionBase;
        lead.followUpDate = fuDate ? this.enforceFollowUpDateLimit(actionBase, new Date(fuDate)) : null;
        lead.legacyNotes = lead.legacyNotes ? `${lead.legacyNotes}\n${noteLine}` : noteLine;
        await this.myLeadRepository.save(lead);

        // Create log
        const log = new LeadCallLog();
        log.lead = lead;
        log.agentName = agentName;
        log.status = actionBase;
        log.note = noteLine;
        log.timestamp = new Date();
        await this.callLogRepository.save(log);
      }

      // Update RawLead if exists
      if (rawLead) {
        if (targetName) rawLead.name = targetName;
        if (combinedPhone) rawLead.phone = combinedPhone;
        rawLead.status = 'Contacted';
        rawLead.action = actionBase;
        rawLead.followUpDate = fuDate ? this.enforceFollowUpDateLimit(actionBase, new Date(fuDate)) : null;
        await this.rawLeadRepository.save(rawLead);
      }

      // Handle payment Closed Won / Reservation
      const wonActions = ["Closed Won", "Closed Won Recommendation", "Reservation"];
      if (wonActions.includes(actionBase)) {
        const clientName = targetName || (lead ? lead.name : '') || (rawLead ? rawLead.name : '');
        const clientPhone = (combinedPhone || (lead ? lead.phone : '') || (rawLead ? rawLead.phone : '') || phone1 || '').trim();

        // اصرف كود OC رسمي تسلسلي من العدّاد (نفس ما تفعله الفاتورة المباشرة).
        // مسار تسجيل المكالمة كان يترك العميل بدون OC — يُخزّن hash فقط.
        const ocCode = await this.resolveOrMintOc(
          (rawLead && rawLead.ocCode) || (lead ? lead.legacyId : '') || clientId,
          clientPhone,
        );

        let payment = await this.clientPaymentRepository.findOne({
          where: [{ legacyId: ocCode }, { clientLegacyId: ocCode }, { clientLegacyId: String(clientId) }]
        });

        if (!payment) {
          payment = new ClientPayment();
          payment.legacyId = ocCode;
        }
        payment.clientLegacyId = ocCode;

        payment.clientName = clientName;
        payment.course = (lead ? lead.course : '') || (rawLead ? rawLead.course : '') || '';
        payment.roundLegacyId = roundId;
        payment.roundName = roundName;
        payment.totalAmount = parseFloat(price) || 0;
        payment.amountPaid = parseFloat(paid) || 0;
        payment.amountUnpaid = (parseFloat(price) || 0) - (parseFloat(paid) || 0);
        payment.status = actionBase;
        payment.notes = comment;
        payment.createdAt = new Date();
        payment.amountDetail1 = inst1 || 0;
        payment.amountDetail2 = inst2 || 0;
        payment.amountDetail3 = inst3 || 0;

        const user = await this.findUser(agentId);
        if (user) {
          payment.agent = user;
          payment.agentUsername = user.username;
        }

        await this.clientPaymentRepository.save(payment);

        // 1.5) حفظ في دفتر الحسابات الرئيسي (Academy Ledger)
        try {
          const remaining = (parseFloat(price) || 0) - (parseFloat(paid) || 0);
          const resolvedFinAction = finAction || (roundId ? 'Round' : 'Wait');
          const isRound = resolvedFinAction === 'Round' && !!roundId;
          
          let ledRow = await this.ledgerRepository.findOne({ where: { ocCode } });
          if (!ledRow) {
            ledRow = new AcademyLedger();
            ledRow.bookingDate = new Date();
            ledRow.ocCode = ocCode;
          }
          
          ledRow.clientName = clientName;
          ledRow.phone = this.normalizePhone(clientPhone || '');
          ledRow.course = payment.course || '';
          ledRow.groupName = isRound ? (roundName || '') : (resolvedFinAction || 'Wait');
          ledRow.status = remaining <= 0 ? 'خالص' : 'أقساط';
          ledRow.totalPrice = parseFloat(price) || 0;
          ledRow.paymentMethod = method || 'Cash';
          ledRow.amountPaid = parseFloat(paid) || 0;
          ledRow.amountRemaining = remaining;
          ledRow.salesAgentEmail = user?.email || user?.username || agentName || '';
          
          await this.ledgerRepository.save(ledRow);
        } catch (e: any) {
          console.error('Error saving to academy_ledger in logLeadCall:', e);
        }

        // إذا كان الحجز على راوند محددة، سجّل العميل كعضو في الراوند حتى يظهر
        // في قائمة أعضاء الراوند (وليس في الدفعات فقط). addRoundMember آمنة من
        // التكرار: تتحقق من وجود العميل مسبقاً قبل الإضافة.
        if (roundId && String(roundId).trim()) {
          try {
            await this.addRoundMember(roundId, {
              ocCode, name: clientName, phone: clientPhone,
              action: 'New', price: parseFloat(price) || 0, paid: parseFloat(paid) || 0,
              method: method || 'Cash', attendance: '', agentId, agentName,
              nextDueDate: fuDate, inst1, inst2, inst3, course: payment.course,
            });
          } catch (e) { /* غير قاتل — الفاتورة اتسجلت بالفعل */ }
        }

        // الحسابات الشهرية (Financial_Data) — كانت موجودة في القديم وسقطت هنا.
        try {
          const resolvedFinAction = finAction || (roundId ? 'Round' : 'Wait');
          const isRound = resolvedFinAction === 'Round' && !!roundId;
          const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
          await this.addFinancialClient(agentId, agentName, new Date().getMonth() + 1, new Date().getFullYear(), {
            action: resolvedFinAction, ocCode, name: clientName, phone: clientPhone,
            course: payment.course, reservation: today, attendance: '', roundId: isRound ? roundId : '',
            roundName: isRound ? roundName : '', method: method || 'Cash',
            price: parseFloat(price) || 0, paid: parseFloat(paid) || 0, offer: offer || 'Cash', clientType: clientType || 'New',
          });
        } catch (e) { /* غير قاتل */ }
      }

      return { success: true, message: 'تم حفظ المكالمة بنجاح ✅' };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  // 29. SEARCH HISTORY FAST (PHONE SEARCH)
  async searchHistoryFast(phoneNumber: string, agentId: string, agentName: string) {
    try {
      if (!phoneNumber) return { found: false, message: 'أدخل رقم الهاتف' };
      const clean = phoneNumber.trim();

      const leads = await this.myLeadRepository.find({
        relations: { agent: true },
      });

      const rawLeads = await this.rawLeadRepository.find({
        relations: { agent: true },
      });

      const matchedLeads = leads.filter(l => l.phone && l.phone.includes(clean));

      const results = matchedLeads.map(l => {
        const notes = l.legacyNotes ? l.legacyNotes.split('\n').filter(line => line.trim()) : [];
        // لازم الطرفين يكونوا بقيمة فعلية — الإضافة اليدوية بتسيب legacyId=null، و null===null
        // بيخلّي المطابقة ترجّع أول raw_lead فاضي الـlegacyId (رقم عميل غلط تمامًا).
        const rawL = rawLeads.find(rl =>
          (!!l.phone && rl.phone === l.phone) || (!!l.legacyId && rl.legacyId === l.legacyId),
        );
        
        const finalCourse = l.course || (rawL ? rawL.course : '') || '';
        const finalSource = l.source || (rawL ? rawL.source : '') || '';
        const finalCampaign = l.campaignType || (rawL ? rawL.campaignType : '') || '';
        const finalOc = (l.legacyId || '').toLowerCase().startsWith('oc-') ? l.legacyId : '';

        return {
          id: this.fmtClientId(rawL ? rawL.clientNumber : null) || (l.legacyId || l.id),
          rowIndex: 1,
          name: l.name || 'غير معروف',
          phone: l.phone || '',
          course: finalCourse,
          agent: l.agent ? l.agent.name : '',
          status: l.status || '',
          lastAction: l.status || '',
          ocCode: finalOc,
          source: finalSource,
          campaign: finalCampaign,
          notes: notes,
          lastNote: notes.length ? notes[notes.length - 1] : '',
          isFree: !l.agent,
        };
      });

      const matchedRaw = rawLeads.filter(rl => rl.phone && rl.phone.includes(clean));
      matchedRaw.forEach(rl => {
        if (results.some(r => r.phone === rl.phone || r.id === rl.legacyId)) return;
        const finalOc = (rl.ocCode || '').toLowerCase().startsWith('oc-') ? rl.ocCode : '';
        results.push({
          id: rl.legacyId || rl.id,
          rowIndex: 1,
          name: rl.name || 'غير معروف',
          phone: rl.phone || '',
          course: rl.course || '',
          agent: rl.agent ? rl.agent.name : '',
          status: rl.status || '',
          lastAction: rl.status || '',
          ocCode: finalOc,
          source: rl.source || '',
          campaign: rl.campaignType || '',
          notes: [],
          lastNote: '',
          isFree: !rl.agent,
        });
      });

      return { found: results.length > 0, results };
    } catch (e: any) {
      return { found: false, message: 'خطأ: ' + e.message };
    }
  }

  // 29b. GET ROUND DETAIL
  async getRoundDetail(roundId: string) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roundId);

      const round = await this.roundRepository.findOne({
        where: isUuid ? [{ id: roundId }, { legacyId: roundId }] : { legacyId: roundId },
      });

      if (!round) return null;

      const startDateStr = round.startDate ? new Date(round.startDate).toISOString().split('T')[0] : '';

      const detail: any = {
        id: round.legacyId || round.id,
        name: round.name || '',
        startDate: startDateStr,
        schedule: round.schedule || '',
        maxSeats: round.maxSeats || 15,
        enrolled: round.enrolled || 0,
        status: round.status || 'Active',
        type: round.type || 'Online',
      };

      const members = await this.roundMemberRepository.find({
        where: [
          { roundLegacyId: round.legacyId || round.id },
          { round: { id: round.id } }
        ],
      });

      // Self-healing: update round.enrolled if count mismatch
      if (round.enrolled !== members.length) {
        round.enrolled = members.length;
        await this.roundRepository.save(round);
        detail.enrolled = members.length;
      }

      detail.members = members.map(m => {
        let attendanceStr = '';
        if (m.attendance) {
          try {
            attendanceStr = new Date(m.attendance).toISOString().split('T')[0];
          } catch {
            attendanceStr = String(m.attendance);
          }
        }
        return {
          ocCode: m.ocCode || '',
          name: m.name || '',
          phone: m.phone || '',
          action: m.action || 'New',
          price: Number(m.price) || 0,
          paid: Number(m.paid) || 0,
          method: m.method || '',
          attendance: attendanceStr,
          agentName: m.agentName || '',
        };
      });

      return detail;
    } catch (e: any) {
      console.error('Error in getRoundDetail:', e);
      return null;
    }
  }

  // 30. GET FINANCIAL DATA
  async getFinancialData(agentId: string, agentName: string, monthVal: string | number, yearVal: string | number, isManagerVal: boolean | string) {
    try {
      const month = parseInt(monthVal.toString());
      const year = parseInt(yearVal.toString());
      if (isNaN(month) || isNaN(year)) return { clients: [], payments: [] };

      let isMgr = false;
      if (typeof isManagerVal === 'boolean') {
        isMgr = isManagerVal;
      } else if (typeof isManagerVal === 'string') {
        const cleanRole = isManagerVal.toLowerCase().trim();
        isMgr = cleanRole === 'manager' || cleanRole === 'admin' || cleanRole === 'operation';
      }

      if (!isMgr && agentId) {
        const user = await this.findUser(agentId);
        isMgr = user && (user.role === 'Manager' || user.role === 'Admin');
      }

      const query = this.financialDataRepository.createQueryBuilder('fd')
        .leftJoinAndSelect('fd.agent', 'agent')
        .where('fd.month = :month AND fd.year = :year', { month, year });

      if (!isMgr) {
        query.andWhere(
          '(agent.id = :agentId OR agent.legacyId = :agentId OR LOWER(TRIM(fd.agentName)) = :agentName)',
          { agentId, agentName: (agentName || '').toLowerCase().trim() }
        );
      }

      const filteredFin = await query.getMany();

      const clientPayments = await this.clientPaymentRepository.find();
      const transactions = await this.transactionRepository.find({
        relations: { payment: true }
      });

      const payIdMap = new Map<string, string>();
      const nameCourseToPayId = new Map<string, string>();
      const roundIdMap = new Map<string, string>();
      const roundNameMap = new Map<string, string>();
      const payIdToFirstPay = new Map<string, number>();

      transactions.forEach(tx => {
        if (tx.type === 'أول دفعة' && tx.payment) {
          payIdToFirstPay.set(tx.payment.id, Number(tx.amount) || 0);
        }
      });

      clientPayments.forEach(cp => {
        if (cp.isDeleted) return;
        const cpId = cp.id;
        const cpOc = (cp.legacyId || '').trim();
        const cpName = (cp.clientName || '').trim().toLowerCase();
        const cpCourse = (cp.course || '').trim().toLowerCase();

        if (cpOc) {
          payIdMap.set(cpOc, cpId);
          payIdMap.set(cpOc.replace(/^oc-/i, ''), cpId);
          roundNameMap.set(cpId, cp.roundName || '');
          roundIdMap.set(cpId, cp.roundLegacyId || '');
        }

        if (cpName && cpCourse) {
          nameCourseToPayId.set(`${cpName}_${cpCourse}`, cpId);
        }
      });

      const clients = [];
      const payments = [];

      filteredFin.forEach((row, idx) => {
        const rowType = (row.type || '').trim().toLowerCase();
        if (rowType !== 'client' && rowType !== 'payment') return;

        if (rowType === 'client') {
          const price = Number(row.price) || 0;
          const paid = Number(row.paid) || 0;
          const ocCodeVal = (row.ocCode || '').trim();
          const nameVal = (row.clientName || '').trim().toLowerCase();
          const courseVal = (row.course || '').trim().toLowerCase();

          let payId = '';
          let roundNameVal = '';
          let roundIdVal = '';

          if (ocCodeVal && payIdMap.has(ocCodeVal)) {
            payId = payIdMap.get(ocCodeVal);
          } else if (ocCodeVal && payIdMap.has(ocCodeVal.replace(/^oc-/i, ''))) {
            payId = payIdMap.get(ocCodeVal.replace(/^oc-/i, ''));
          } else if (nameVal && courseVal && nameCourseToPayId.has(`${nameVal}_${courseVal}`)) {
            payId = nameCourseToPayId.get(`${nameVal}_${courseVal}`);
          }

          if (payId) {
            roundNameVal = roundNameMap.get(payId) || '';
            roundIdVal = roundIdMap.get(payId) || '';
          }

          let initialPaid = paid;
          if (payId && payIdToFirstPay.has(payId)) {
            initialPaid = payIdToFirstPay.get(payId);
          }

          let rawAction = (row.action || '').trim();
          if (!rawAction || rawAction === 'New') {
            rawAction = (roundIdVal && roundIdVal !== '' && roundIdVal.toLowerCase() !== 'wait') ? 'Round' : 'Wait';
          }

          clients.push({
            agentId: row.agentLegacyId || (row.agent ? row.agent.id : ''),
            agentName: row.agentName || '',
            action: rawAction,
            clientType: row.clientType || '',
            campaignType: row.campaignType || '',
            ocCode: ocCodeVal,
            name: row.clientName || '',
            phone: row.phone || '',
            course: row.course || '',
            reservation: row.reservation ? row.reservation.toISOString().split('T')[0] : '',
            attendance: row.attendance ? row.attendance.toISOString().split('T')[0] : '',
            method: row.paymentMethod || '',
            offer: row.offer || '',
            price: price,
            paid: paid,
            initialPaid: initialPaid,
            unpaid: Math.max(0, price - paid),
            payId: payId,
            roundId: roundIdVal,
            roundName: roundNameVal,
            rowIndex: row.id,
          });
        } else if (rowType === 'payment') {
          payments.push({
            agentId: row.agentLegacyId || (row.agent ? row.agent.id : ''),
            agentName: row.agentName || '',
            ocCode: row.ocCode || '',
            name: row.clientName || '',
            phone: row.phone || '',
            amount: Number(row.paid) || 0,
            date: row.reservation ? row.reservation.toISOString().split('T')[0] : '',
            rowIndex: row.id,
          });
        }
      });

      const salesTargets = await this.getSettingValue('salesTargets') || '{}';
      const defaultTarget = await this.getSettingValue('targetPerAgent') || '50000';

      return {
        clients,
        payments,
        salesTargets,
        defaultTarget,
      };
    } catch (e: any) {
      console.error('Error in getFinancialData:', e);
      return { clients: [], payments: [] };
    }
  }

  private normalizeArabicName(name: string): string {
    if (!name) return '';
    return name
      .trim()
      .toLowerCase()
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ةه]/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/\s+/g, '');
  }

  async getInstructorStats(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح' };
    try {
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      if (!instructor) return { success: false, message: 'المحاضر غير موجود' };

      const name = this.normalizeArabicName(instructor.name || '');

      // 1. Get rounds of this instructor
      const rounds = await this.roundRepository.find();
      const myRounds = rounds.filter((r) => this.normalizeArabicName(r.instructorName || '') === name && r.status !== 'Deleted');
      const myRoundIds = new Set(myRounds.map(r => r.legacyId || r.id));

      // 2. Get lecture contents belonging to this instructor
      const contents = await this.contentRepository.find({ where: { isLocked: false } });
      const myContents = contents.filter((c) => this.normalizeArabicName(c.instructorTag || '') === name);
      const myContentKeys = new Set(myContents.map(c => this.contentKey(c)));

      const totalLectures = myContents.length;

      // 3. Find unique students enrolled in these rounds
      const enrollments = await this.enrollmentRepository.find({ relations: { student: true, round: true } });
      const myEnrollments = enrollments.filter(e => {
        const rid = e.roundLegacyId || (e.round?.legacyId || e.round?.id);
        return rid && myRoundIds.has(rid) && e.status === 'active';
      });
      
      const uniqueStudentIds = new Set<string>();
      const studentMap = new Map<string, any>();
      for (const e of myEnrollments) {
        if (e.student) {
          const sid = e.student.legacyId || e.student.id;
          uniqueStudentIds.add(sid);
          if (!studentMap.has(sid)) {
            studentMap.set(sid, {
              id: sid,
              name: e.student.name || '',
              phone: e.student.phone || '',
              email: e.student.email || '',
              rounds: [],
              watchedCount: 0,
              totalLectures: totalLectures,
              pct: 0,
              avgScore: null,
              taskCount: 0
            });
          }
          const rid = e.roundLegacyId || (e.round?.legacyId || e.round?.id);
          studentMap.get(sid).rounds.push({ id: rid, name: e.roundName || e.round?.name || '' });
        }
      }

      // Calculate total students assigned to this instructor via instructorTag
      const allStudents = await this.studentRepository.find();
      const myStudentsByTag = allStudents.filter(
        (s) => this.normalizeArabicName(s.instructorTag || '') === name
      );
      const totalStudents = myStudentsByTag.length;

      // 4. Get progress (watchedCount) for these students
      const progresses = await this.progressRepository.find({ relations: { student: true, lecture: true } });
      for (const p of progresses) {
        const sid = p.student?.legacyId || p.student?.id || p.studentLegacyId;
        const lid = p.lecture?.legacyId || p.lecture?.id || p.lectureLegacyId;
        if (sid && uniqueStudentIds.has(sid) && lid && myContentKeys.has(lid) && p.watchedAt) {
          const sObj = studentMap.get(sid);
          if (sObj) sObj.watchedCount++;
        }
      }

      // 5. Get average quiz score for these students
      const quizResults = await this.quizResultRepository.find({ relations: { student: true, lecture: true } });
      const studentQuizScores = new Map<string, number[]>();
      for (const q of quizResults) {
        const sid = q.student?.legacyId || q.student?.id || q.studentLegacyId;
        const lid = q.lecture?.legacyId || q.lecture?.id || q.lectureLegacyId;
        if (sid && uniqueStudentIds.has(sid) && lid && myContentKeys.has(lid) && q.passed) {
          if (!studentQuizScores.has(sid)) studentQuizScores.set(sid, []);
          studentQuizScores.get(sid).push(q.score || 0);
        }
      }

      // 6. Get task counts for these students
      const tasks = await this.academyTaskRepository.find({ relations: { student: true, lecture: true } });
      const studentTaskCounts = new Map<string, number>();
      let pendingTasksCount = 0;
      let approvedTasksCount = 0;

      for (const t of tasks) {
        const sid = t.student?.legacyId || t.student?.id || t.studentLegacyId;
        const lid = t.lecture?.legacyId || t.lecture?.id || t.lectureLegacyId;
        if (lid && myContentKeys.has(lid)) {
          const status = (t.status || '').toLowerCase();
          if (status === 'approved') approvedTasksCount++;
          else if (status === 'pending' || !status) pendingTasksCount++;

          if (sid && uniqueStudentIds.has(sid)) {
            if (status === 'approved') {
              studentTaskCounts.set(sid, (studentTaskCounts.get(sid) || 0) + 1);
            }
          }
        }
      }

      // Populate student calculated fields
      let totalCompletionPct = 0;
      for (const sObj of studentMap.values()) {
        sObj.pct = totalLectures ? Math.round((sObj.watchedCount / totalLectures) * 100) : 0;
        totalCompletionPct += sObj.pct;

        const scores = studentQuizScores.get(sObj.id);
        if (scores && scores.length) {
          const sum = scores.reduce((a, b) => a + b, 0);
          sObj.avgScore = Math.round(sum / scores.length);
        }
        sObj.taskCount = studentTaskCounts.get(sObj.id) || 0;
      }

      const avgCompletion = totalStudents ? Math.round(totalCompletionPct / totalStudents) : 0;

      // 7. Get average survey rating for this instructor's rounds
      let avgSurveyRating: string | null = null;
      try {
        const surveyResponses = await this.surveyResponseRepository.find();
        const mySurveyResponses = surveyResponses.filter(sr => myRoundIds.has(sr.roundId));
        let sumRating = 0;
        let countRating = 0;
        for (const sr of mySurveyResponses) {
          try {
            const ans = JSON.parse(sr.answers || '{}');
            for (const key of Object.keys(ans)) {
              if (key.endsWith('_reason')) continue;
              const val = ans[key];
              if (typeof val === 'number') {
                sumRating += val;
                countRating++;
              } else if (typeof val === 'string') {
                const num = parseInt(val);
                if (!isNaN(num) && num >= 1 && num <= 10) {
                  sumRating += num;
                  countRating++;
                }
              }
            }
          } catch (e) {}
        }
        avgSurveyRating = countRating > 0 ? (Math.round((sumRating / countRating) * 10) / 10).toFixed(1) : null;
      } catch (e) {}

      return {
        success: true,
        totalLectures,
        totalStudents,
        avgCompletion,
        avgSurveyRating,
        taskStats: {
          pending: pendingTasksCount,
          approved: approvedTasksCount
        },
        students: Array.from(studentMap.values()),
        allRounds: myRounds.map(r => ({ id: r.legacyId || r.id, name: r.name || '' }))
      };
    } catch (e: any) {
      return { success: false, message: e.message, students: [], allRounds: [] };
    }
  }

  async getBSAStudentStats(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || !sess.isBsa) return { success: false, message: 'غير مصرح' };
    try {
      const contents = await this.contentRepository.find({ where: { isLocked: false } });
      const totalLectures = contents.length;
      const contentKeys = new Set(contents.map(c => this.contentKey(c)));

      const students = await this.studentRepository.find();
      const uniqueStudentIds = new Set(students.map(s => s.legacyId || s.id));
      const studentMap = new Map<string, any>();
      for (const s of students) {
        const sid = s.legacyId || s.id;
        studentMap.set(sid, {
          id: sid,
          name: s.name || '',
          phone: s.phone || '',
          email: s.email || '',
          rounds: [],
          watchedCount: 0,
          totalLectures: totalLectures,
          pct: 0,
          avgScore: null,
          taskCount: 0
        });
      }

      const enrollments = await this.enrollmentRepository.find({ relations: { student: true, round: true } });
      for (const e of enrollments) {
        if (!e.student) continue;
        const sid = e.student.legacyId || e.student.id;
        if (sid && studentMap.has(sid) && e.status === 'active') {
          const rid = e.roundLegacyId || (e.round?.legacyId || e.round?.id);
          studentMap.get(sid).rounds.push({ id: rid, name: e.roundName || e.round?.name || '' });
        }
      }

      const totalStudents = uniqueStudentIds.size;

      const progresses = await this.progressRepository.find({ relations: { student: true, lecture: true } });
      for (const p of progresses) {
        const sid = p.student?.legacyId || p.student?.id || p.studentLegacyId;
        const lid = p.lecture?.legacyId || p.lecture?.id || p.lectureLegacyId;
        if (sid && studentMap.has(sid) && lid && contentKeys.has(lid) && p.watchedAt) {
          studentMap.get(sid).watchedCount++;
        }
      }

      const quizResults = await this.quizResultRepository.find({ relations: { student: true, lecture: true } });
      const studentQuizScores = new Map<string, number[]>();
      for (const q of quizResults) {
        const sid = q.student?.legacyId || q.student?.id || q.studentLegacyId;
        const lid = q.lecture?.legacyId || q.lecture?.id || q.lectureLegacyId;
        if (sid && studentMap.has(sid) && lid && contentKeys.has(lid) && q.passed) {
          if (!studentQuizScores.has(sid)) studentQuizScores.set(sid, []);
          studentQuizScores.get(sid).push(q.score || 0);
        }
      }

      const tasks = await this.academyTaskRepository.find({ relations: { student: true, lecture: true } });
      const studentTaskCounts = new Map<string, number>();
      let pendingTasksCount = 0;
      let approvedTasksCount = 0;

      for (const t of tasks) {
        const sid = t.student?.legacyId || t.student?.id || t.studentLegacyId;
        const lid = t.lecture?.legacyId || t.lecture?.id || t.lectureLegacyId;
        if (lid && contentKeys.has(lid)) {
          const status = (t.status || '').toLowerCase();
          if (status === 'approved') approvedTasksCount++;
          else if (status === 'pending' || !status) pendingTasksCount++;

          if (sid && studentMap.has(sid)) {
            if (status === 'approved') {
              studentTaskCounts.set(sid, (studentTaskCounts.get(sid) || 0) + 1);
            }
          }
        }
      }

      let totalCompletionPct = 0;
      for (const sObj of studentMap.values()) {
        sObj.pct = totalLectures ? Math.round((sObj.watchedCount / totalLectures) * 100) : 0;
        totalCompletionPct += sObj.pct;

        const scores = studentQuizScores.get(sObj.id);
        if (scores && scores.length) {
          const sum = scores.reduce((a, b) => a + b, 0);
          sObj.avgScore = Math.round(sum / scores.length);
        }
        sObj.taskCount = studentTaskCounts.get(sObj.id) || 0;
      }

      const avgCompletion = totalStudents ? Math.round(totalCompletionPct / totalStudents) : 0;

      const rounds = await this.roundRepository.find();
      const allRounds = rounds.filter(r => r.status !== 'Deleted');

      let avgSurveyRating: string | null = null;
      try {
        const surveyResponses = await this.surveyResponseRepository.find();
        let sumRating = 0;
        let countRating = 0;
        for (const sr of surveyResponses) {
          try {
            const ans = JSON.parse(sr.answers || '{}');
            for (const key of Object.keys(ans)) {
              if (key.endsWith('_reason')) continue;
              const val = ans[key];
              if (typeof val === 'number') {
                sumRating += val;
                countRating++;
              } else if (typeof val === 'string') {
                const num = parseInt(val);
                if (!isNaN(num) && num >= 1 && num <= 10) {
                  sumRating += num;
                  countRating++;
                }
              }
            }
          } catch (e) {}
        }
        avgSurveyRating = countRating > 0 ? (Math.round((sumRating / countRating) * 10) / 10).toFixed(1) : null;
      } catch (e) {}

      return {
        success: true,
        totalLectures,
        totalStudents,
        avgCompletion,
        avgSurveyRating,
        taskStats: {
          pending: pendingTasksCount,
          approved: approvedTasksCount
        },
        students: Array.from(studentMap.values()),
        allRounds: allRounds.map(r => ({ id: r.legacyId || r.id, name: r.name || '' }))
      };
    } catch (e: any) {
      return { success: false, message: e.message, students: [], allRounds: [] };
    }
  }

  async getInstructorPendingTasks(token: string) {
    return this.getInstructorTasksFiltered(token, true);
  }

  async getInstructorAllTasks(token: string) {
    return this.getInstructorTasksFiltered(token, false);
  }

  async getInstructorSurveyResponses(token: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, message: 'غير مصرح', responses: [] };
    try {
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      if (!instructor) return { success: false, message: 'المحاضر غير موجود', responses: [] };

      const name = this.normalizeArabicName(instructor.name || '');

      // Get rounds of this instructor
      const rounds = await this.roundRepository.find();
      const myRounds = rounds.filter((r) => this.normalizeArabicName(r.instructorName || '') === name && r.status !== 'Deleted');
      const myRoundIds = new Set<string>();
      for (const r of myRounds) {
        if (r.id) myRoundIds.add(r.id);
        if (r.legacyId) myRoundIds.add(r.legacyId);
      }

      // Load all survey responses
      const responses = await this.surveyResponseRepository.find({
        where: { isPublished: true },
        order: { createdAt: 'DESC' }
      });

      // Filter responses: the roundId of the response must be in myRoundIds
      const filtered = responses.filter(resp => {
        if (!resp.roundId) return false;
        return myRoundIds.has(resp.roundId);
      }).map(resp => {
        let rName = resp.roundName || '';
        if (rName.toUpperCase().startsWith('INS:')) rName = rName.substring(4).trim();
        else if (rName.toUpperCase().startsWith('INS/')) rName = rName.substring(4).trim();
        return { ...resp, roundName: rName };
      });

      return { success: true, responses: filtered };
    } catch (e: any) {
      return { success: false, message: e.message, responses: [] };
    }
  }

  private async getInstructorTasksFiltered(token: string, pendingOnly: boolean) {
    const sess = await this.validateAcadSession(token);
    if (!sess || sess.role !== 'instructor') return { success: false, tasks: [] };
    try {
      const instructor = (await this.instructorRepository.findOne({ where: { legacyId: sess.id } })) ||
        (sess.id.length === 36 ? await this.instructorRepository.findOne({ where: { id: sess.id } }) : null);
      if (!instructor) return { success: false, tasks: [] };

      const name = this.normalizeArabicName(instructor.name || '');

      const contents = await this.contentRepository.find();
      const myContentKeys = new Set(
        contents
          .filter((c) => this.normalizeArabicName(c.instructorTag || '') === name)
          .map((c) => this.contentKey(c))
      );

      const tasks = await this.academyTaskRepository.find({
        relations: { lecture: true, student: true },
        order: { submittedAt: 'DESC' },
        take: 300
      });

      const filteredTasks = tasks.filter((t) => {
        const lid = t.lectureLegacyId || (t.lecture?.legacyId || t.lecture?.id);
        if (!lid || !myContentKeys.has(lid)) return false;
        if (pendingOnly) {
          const status = (t.status || 'pending').toLowerCase();
          return status === 'pending';
        }
        return true;
      });

      return {
        success: true,
        tasks: filteredTasks.map((t) => ({
          id: t.legacyId || t.id,
          studentName: t.studentName || '',
          lectureName: t.lectureName || '',
          fileName: t.fileName || '',
          driveFileId: t.driveFileId || '',
          submittedAt: t.submittedAt ? new Date(t.submittedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
          status: t.status || 'pending',
          reviewedBy: t.reviewedBy || '',
          reviewNotes: t.reviewNotes || '',
          instructorStatus: t.status || 'pending',
          instructorNotes: t.reviewNotes || ''
        }))
      };
    } catch {
      return { success: false, tasks: [] };
    }
  }

  // ── LECTURE SURVEYS (الاستبيانات) ──

  async getSurveyQuestions() {
    try {
      const setting = await this.settingRepository.findOne({ where: { key: 'survey_questions' } });
      const headerSetting = await this.settingRepository.findOne({ where: { key: 'survey_header_message' } });
      const headerMessage = headerSetting ? headerSetting.value : 'شاركنا رأيك في المحاضرة دي';
      
      if (setting && setting.value) {
        return { success: true, questions: JSON.parse(setting.value), headerMessage };
      }
      
      // Default set of questions
      const defaults = [
        { id: 'q1', type: 'rating', text: 'ما مدى رضاك عن المحاضرة' },
        { id: 'q2', type: 'rating', text: 'ما مدى رضاك عن المحاضر' },
        { id: 'q3', type: 'rating', text: 'ما مدى فهمك من المحاضرة' },
        { id: 'q4', type: 'text', text: 'ملاحظة' },
        { id: 'q5', type: 'text', text: 'الإقتراحات' }
      ];
      return { success: true, questions: defaults, headerMessage };
    } catch (e) {
      return { success: false, questions: [], headerMessage: 'شاركنا رأيك في المحاضرة دي' };
    }
  }

  async checkSurveySubmitted(token: string, roundId: string, lectureId: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, submitted: false };
    try {
      const student = await this.studentRepository.findOne({ where: { id: sess.id } });
      if (!student) return { success: false, submitted: false };

      let resolvedRoundId = roundId;
      let round = await this.findRoundByAnyId(roundId);
      const content = await this.findContentByAnyId(lectureId);
      if (!round && content) {
        const insTagNormalized = this.normalizeArabicName(content.instructorTag || 'BSA Academy');
        const studentKey = student.legacyId || student.id;
        const enrollments = await this.enrollmentRepository.find({
          where: { studentLegacyId: studentKey },
          relations: { round: true }
        });
        const matched = enrollments.find(e => {
          if (!e.round) return false;
          const roundIns = this.normalizeArabicName(e.round.instructorName || '');
          return roundIns.includes(insTagNormalized) || insTagNormalized.includes(roundIns);
        });
        if (matched && matched.round) {
          round = matched.round;
          resolvedRoundId = round.legacyId || round.id;
        }
      }

      const existing = await this.surveyResponseRepository.findOne({
        where: [
          { studentId: student.id, roundId: resolvedRoundId, lectureId },
          { studentId: student.id, roundId, lectureId }
        ]
      });
      return { success: true, submitted: !!existing };
    } catch (e) {
      return { success: false, submitted: false };
    }
  }

  async saveSurveyQuestions(token: string, questionsJson: string, headerMessage?: string) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };
    const isManager = sess.user.role === 'Manager' || sess.user.role === 'Admin' || sess.user.role === 'admin';
    if (!isManager) return { success: false, message: 'ليس لديك صلاحية لتعديل الاستبيانات' };

    try {
      JSON.parse(questionsJson); // Validate JSON format
      let setting = await this.settingRepository.findOne({ where: { key: 'survey_questions' } });
      if (!setting) {
        setting = this.settingRepository.create({ key: 'survey_questions', value: questionsJson });
      } else {
        setting.value = questionsJson;
      }
      await this.settingRepository.save(setting);

      if (headerMessage !== undefined) {
        let hSetting = await this.settingRepository.findOne({ where: { key: 'survey_header_message' } });
        if (!hSetting) {
          hSetting = this.settingRepository.create({ key: 'survey_header_message', value: headerMessage });
        } else {
          hSetting.value = headerMessage;
        }
        await this.settingRepository.save(hSetting);
      }

      return { success: true, message: '✅ تم حفظ أسئلة وإعدادات الاستبيان بنجاح' };
    } catch (e: any) {
      return { success: false, message: 'خطأ في التنسيق: ' + e.message };
    }
  }

  async submitSurveyResponse(token: string, roundId: string, lectureId: string, answersJson: string) {
    const sess = await this.validateAcadSession(token);
    if (!sess) return { success: false, message: 'انتهت الجلسة' };
    try {
      const student = await this.studentRepository.findOne({ where: { id: sess.id } });
      if (!student) return { success: false, message: 'الطالب غير موجود في النظام' };

      let round = await this.findRoundByAnyId(roundId);
      const content = await this.findContentByAnyId(lectureId);

      if (!round && content) {
        const insTagNormalized = this.normalizeArabicName(content.instructorTag || 'BSA Academy');
        const studentKey = student.legacyId || student.id;
        const enrollments = await this.enrollmentRepository.find({
          where: { studentLegacyId: studentKey },
          relations: { round: true }
        });
        const matched = enrollments.find(e => {
          if (!e.round) return false;
          const roundIns = this.normalizeArabicName(e.round.instructorName || '');
          return roundIns.includes(insTagNormalized) || insTagNormalized.includes(roundIns);
        });
        if (matched && matched.round) {
          round = matched.round;
        }
      }

      const resolvedRoundId = round ? (round.legacyId || round.id) : roundId;

      // Prevent duplicate submissions
      const existing = await this.surveyResponseRepository.findOne({
        where: [
          { studentId: student.id, roundId: resolvedRoundId, lectureId },
          { studentId: student.id, roundId, lectureId }
        ]
      });
      if (existing) return { success: false, message: 'لقد قمت بتقديم الاستبيان لهذه المحاضرة بالفعل' };

      const response = this.surveyResponseRepository.create({
        studentId: student.id,
        studentName: student.name || '',
        roundId: resolvedRoundId,
        roundName: round ? round.name : (roundId.startsWith('INS:') ? roundId.substring(4) : roundId),
        lectureId,
        lectureNum: content ? content.lectureOrder : 0,
        lectureName: content ? content.lectureName : '',
        answers: answersJson,
      });

      await this.surveyResponseRepository.save(response);
      return { success: true, message: '✅ شكراً لك! تم إرسال استبيانك بنجاح.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getSurveyResponses(token: string) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };

    const isElevated = sess.user.role === 'Manager' || sess.user.role === 'Operation' || sess.user.role === 'Admin' || sess.user.role === 'admin';
    const hasPage = sess.user.pages && sess.user.pages.indexOf('surveys') !== -1;
    if (!isElevated && !hasPage) return { success: false, message: 'ليس لديك صلاحية لمشاهدة الاستبيانات' };

    try {
      const responses = await this.surveyResponseRepository.find({
        order: { createdAt: 'DESC' }
      });
      const cleaned = responses.map(r => {
        let rName = r.roundName || '';
        if (rName.toUpperCase().startsWith('INS:')) rName = rName.substring(4).trim();
        else if (rName.toUpperCase().startsWith('INS/')) rName = rName.substring(4).trim();
        return { ...r, roundName: rName };
      });
      return { success: true, responses: cleaned };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async publishSurveyResponse(token: string, responseId: number, isPublished: boolean) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };
    const isManager = sess.user.role === 'Manager' || sess.user.role === 'Admin' || sess.user.role === 'admin';
    if (!isManager) return { success: false, message: 'ليس لديك صلاحية لنشر الاستبيانات' };

    try {
      const resp = await this.surveyResponseRepository.findOne({ where: { id: responseId } });
      if (!resp) return { success: false, message: 'الاستبيان غير موجود' };
      resp.isPublished = isPublished;
      await this.surveyResponseRepository.save(resp);
      return { success: true, message: isPublished ? 'تم نشر الاستبيان للمحاضر بنجاح' : 'تم إلغاء نشر الاستبيان' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async editSurveyResponse(token: string, responseId: number, answersJson: string) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };
    const isManager = sess.user.role === 'Manager' || sess.user.role === 'Admin' || sess.user.role === 'admin';
    if (!isManager) return { success: false, message: 'ليس لديك صلاحية لتعديل الاستبيانات' };

    try {
      JSON.parse(answersJson);
      const resp = await this.surveyResponseRepository.findOne({ where: { id: responseId } });
      if (!resp) return { success: false, message: 'الاستبيان غير موجود' };
      resp.answers = answersJson;
      await this.surveyResponseRepository.save(resp);
      return { success: true, message: 'تم تعديل إجابات الاستبيان بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteSurveyResponse(token: string, responseId: number) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };
    const isManager = sess.user.role === 'Manager' || sess.user.role === 'Admin' || sess.user.role === 'admin';
    if (!isManager) return { success: false, message: 'ليس لديك صلاحية لحذف الاستبيانات' };

    try {
      const resp = await this.surveyResponseRepository.findOne({ where: { id: responseId } });
      if (!resp) return { success: false, message: 'الاستبيان غير موجود' };
      await this.surveyResponseRepository.remove(resp);
      return { success: true, message: 'تم حذف الاستبيان بنجاح' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateLedgerInvoice(token: string, ocCode: string, payload: any) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };
    const isElevated = sess.user.role === 'Manager' || sess.user.role === 'Admin' || sess.user.role === 'admin';
    if (!isElevated) return { success: false, message: '⚠️ غير مصرح لك بتعديل الفاتورة' };

    try {
      const ledger = await this.ledgerRepository.findOne({ where: { ocCode } });
      if (!ledger) return { success: false, message: 'الفاتورة غير موجودة' };

      const price = parseFloat(payload.totalPrice) || 0;
      const paid = parseFloat(payload.paidAmount) || 0;
      const remaining = price - paid;
      const status = remaining <= 0 ? 'خالص' : 'أقساط';

      // 1) Update Ledger
      ledger.clientName = payload.clientName || '';
      ledger.phone = this.normalizePhone(payload.phone || '');
      ledger.course = payload.course || '';
      ledger.groupName = payload.groupName || '';
      ledger.totalPrice = price;
      ledger.amountPaid = paid;
      ledger.amountRemaining = remaining;
      ledger.paymentMethod = payload.paymentMethod || 'Cash';
      ledger.status = status;
      if (payload.salesAgentEmail) ledger.salesAgentEmail = payload.salesAgentEmail;
      await this.ledgerRepository.save(ledger);

      // Find round by name to get its startDate
      let roundStartDate: Date | null = null;
      let targetRound: Round | null = null;
      if (payload.groupName) {
        targetRound = await this.roundRepository.findOne({ where: { name: payload.groupName } });
        if (targetRound && targetRound.startDate) {
          roundStartDate = targetRound.startDate;
        }
      }

      // 2) Update RoundMember if exists
      const member = await this.roundMemberRepository.findOne({ where: { ocCode } });
      if (member) {
        member.name = payload.clientName || '';
        member.phone = this.normalizePhone(payload.phone || '');
        member.price = price;
        member.paid = paid;
        member.method = payload.paymentMethod || 'Cash';
        if (targetRound) {
          member.round = targetRound;
          member.roundLegacyId = targetRound.legacyId || targetRound.id;
        }
        await this.roundMemberRepository.save(member);
      }

      // 3) Update ClientPayment if exists
      const payment = await this.clientPaymentRepository.findOne({ where: { clientLegacyId: ocCode } });
      if (payment) {
        payment.clientName = payload.clientName || '';
        payment.course = payload.course || '';
        payment.totalAmount = price;
        payment.amountPaid = paid;
        payment.amountUnpaid = remaining;
        payment.status = status;
        if (targetRound) {
          payment.round = targetRound;
          payment.roundLegacyId = targetRound.legacyId || targetRound.id;
          payment.roundName = targetRound.name;
        }
        await this.clientPaymentRepository.save(payment);
      }

      // Determine attendance date
      let attendanceTime: Date | null = null;
      if (payload.attendanceDate) {
        attendanceTime = new Date(payload.attendanceDate);
      } else if (roundStartDate) {
        attendanceTime = roundStartDate;
      }

      // 4) Update Financial Data attendance (Attendance time)
      if (attendanceTime) {
        const fdRows = await this.financialDataRepository.find({ where: { ocCode } });
        for (const fd of fdRows) {
          fd.attendance = attendanceTime;
          await this.financialDataRepository.save(fd);
        }
      }

      // 5) Regenerate invoice HTML for printing
      const html = this.buildInvoiceHtml({
        invoiceId: ocCode,
        today: ledger.bookingDate ? new Date(ledger.bookingDate).toISOString().slice(0, 10).replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
        clientName: payload.clientName || '',
        nameEn: payload.nameEn || payload.clientName || '',
        clientPhone: payload.phone || '',
        course: payload.course || '',
        offer: payload.offer || '',
        attendanceDate: attendanceTime ? attendanceTime.toISOString().slice(0, 10) : '',
        price,
        paid,
        remaining,
        method: payload.paymentMethod || 'Cash',
        agentName: ledger.salesAgentEmail || '',
      });

      return { success: true, message: '✅ تم تعديل الفاتورة بنجاح', html };
    } catch (e: any) {
      return { success: false, message: 'خطأ: ' + e.message };
    }
  }

  async getInvoicePrintHtml(token: string, ocCode: string, nameEn?: string, offer?: string, attendanceDate?: string) {
    const sess = await this.validateSession(token);
    if (!sess || !sess.success || !sess.user) return { success: false, message: 'انتهت الجلسة' };

    try {
      const ledger = await this.ledgerRepository.findOne({ where: { ocCode } });
      if (!ledger) return { success: false, message: 'الفاتورة غير موجودة' };

      const price = Number(ledger.totalPrice) || 0;
      const paid = Number(ledger.amountPaid) || 0;
      const remaining = Number(ledger.amountRemaining) || 0;

      let resolvedAttendanceDate = attendanceDate || '';
      if (!resolvedAttendanceDate) {
        const fd = await this.financialDataRepository.findOne({ where: { ocCode } });
        if (fd && fd.attendance) {
          resolvedAttendanceDate = new Date(fd.attendance).toISOString().slice(0, 10);
        }
      }

      const html = this.buildInvoiceHtml({
        invoiceId: ocCode,
        today: ledger.bookingDate ? new Date(ledger.bookingDate).toISOString().slice(0, 10).replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
        clientName: ledger.clientName || '',
        nameEn: nameEn || ledger.clientName || '',
        clientPhone: ledger.phone || '',
        course: ledger.course || '',
        offer: offer || '',
        attendanceDate: resolvedAttendanceDate,
        price,
        paid,
        remaining,
        method: ledger.paymentMethod || 'Cash',
        agentName: ledger.salesAgentEmail || '',
      });

      return { success: true, html };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async healAndSyncAllClients() {
    try {
      const ledgers = await this.ledgerRepository.find();
      let syncedCount = 0;
      let fixesCount = 0;

      for (const led of ledgers) {
        if (!led.ocCode) continue;
        syncedCount++;

        const oc = led.ocCode.trim();
        const phone = led.phone || '';
        const clientName = led.clientName || '';
        const course = led.course || '';
        const groupName = led.groupName || '';
        const price = led.totalPrice || 0;
        const paid = led.amountPaid || 0;
        const remaining = led.amountRemaining || 0;
        const method = led.paymentMethod || 'Cash';
        const agentEmail = led.salesAgentEmail || '';

        // Find agent by email or name
        let agent = null;
        if (agentEmail) {
          agent = await this.userRepository.findOne({
            where: [
              { email: agentEmail },
              { name: agentEmail }
            ]
          });
        }
        const agentId = agent ? agent.id : '';
        const agentName = agent ? agent.name : (agentEmail || 'Unknown');

        // 1. Check in financial_data
        const finExists = await this.financialDataRepository.findOne({
          where: { ocCode: oc, type: 'client' }
        });
        if (!finExists && led.bookingDate) {
          const bDate = new Date(led.bookingDate);
          const month = bDate.getMonth() + 1;
          const year = bDate.getFullYear();
          await this.addFinancialClient(agentId, agentName, month, year, {
            action: (groupName || '').toLowerCase().includes('wait') ? 'Wait' : 'Round',
            ocCode: oc,
            name: clientName,
            phone: phone,
            course,
            reservation: bDate.toISOString().slice(0, 10),
            attendance: bDate.toISOString().slice(0, 10),
            method,
            price,
            paid,
            offer: 'Cash',
            clientType: 'New'
          });
          fixesCount++;
        }

        // 2. Check in round_members / client_payments
        const isRound = groupName && !(groupName || '').toLowerCase().includes('wait') && !(groupName || '').toLowerCase().includes('refund');
        if (isRound) {
          // Find round by name
          const round = await this.roundRepository.findOne({
            where: { name: groupName }
          });
          
          if (round) {
            const rmExists = await this.roundMemberRepository.findOne({
              where: { ocCode: oc, round: { id: round.id } }
            });
            if (!rmExists) {
              await this.addRoundMember(round.id, {
                ocCode: oc,
                name: clientName,
                phone: phone,
                action: 'New',
                price,
                paid,
                method,
                attendance: '',
                agentId,
                agentName,
                nextDueDate: ''
              });
              fixesCount++;
            }
          }
        } else {
          const cpExists = await this.clientPaymentRepository.findOne({
            where: { clientLegacyId: oc }
          });
          if (!cpExists) {
            await this.addClientPayment(
              oc,
              clientName,
              phone,
              course,
              '',
              groupName || 'Wait',
              price,
              agentId,
              agentName,
              paid,
              '',
              groupName || 'Wait'
            );
            fixesCount++;
          }
        }
      }

      return { success: true, message: `✅ تم فحص ${syncedCount} عميل، وتم إصلاح ومزامنة ${fixesCount} سجلات مفقودة.` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}

