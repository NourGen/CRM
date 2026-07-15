import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../sales/entities/user.entity';
import { MyLead } from '../sales/entities/my-lead.entity';
import { RawLead } from '../sales/entities/raw-lead.entity';
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
import { WalletIncome } from '../financial/entities/wallet-income.entity';
import { WalletAdjustment } from '../financial/entities/wallet-adjustment.entity';
import { WalletTransfer } from '../financial/entities/wallet-transfer.entity';
export declare class GasService implements OnModuleInit {
    private readonly userRepository;
    private readonly myLeadRepository;
    private readonly rawLeadRepository;
    private readonly callLogRepository;
    private readonly supportRepository;
    private readonly exceptionRepository;
    private readonly taskRepository;
    private readonly roundRepository;
    private readonly ledgerRepository;
    private readonly courseRepository;
    private readonly offerRepository;
    private readonly clientPaymentRepository;
    private readonly instructorRepository;
    private readonly roundMemberRepository;
    private readonly financialDataRepository;
    private readonly transactionRepository;
    private readonly studentRepository;
    private readonly academySessionRepository;
    private readonly freshLeadRepository;
    private readonly activityLogRepository;
    private readonly lecturerSalaryRepository;
    private readonly enrollmentRepository;
    private readonly settingRepository;
    private readonly attendanceRepository;
    private readonly celebrationRepository;
    private readonly expenseRepository;
    private readonly breakLogRepository;
    private readonly supportFileRepository;
    private readonly contentRepository;
    private readonly quizRepository;
    private readonly quizBankRepository;
    private readonly academyTaskRepository;
    private readonly unlockRepository;
    private readonly progressRepository;
    private readonly quizResultRepository;
    private readonly academySupportRepository;
    private readonly notificationRepository;
    private readonly postRepository;
    private readonly dmRepository;
    private readonly friendRepository;
    private readonly reactionRepository;
    private readonly quizAttemptRepository;
    private readonly liveSessionRepository;
    private readonly finalProjectRepository;
    private readonly successStoryRepository;
    private readonly showcaseRepository;
    private readonly walletIncomeRepository;
    private readonly walletRepository;
    private readonly walletTransferRepository;
    private readonly surveyResponseRepository;
    private readonly bsaOrientationRepository;
    private enforceFollowUpDateLimit;
    syncAllOcCodeClients(): Promise<{
        success: boolean;
        message: any;
    }>;
    onModuleInit(): Promise<void>;
    constructor(userRepository: Repository<User>, myLeadRepository: Repository<MyLead>, rawLeadRepository: Repository<RawLead>, callLogRepository: Repository<LeadCallLog>, supportRepository: Repository<SupportRequest>, exceptionRepository: Repository<ExceptionRequest>, taskRepository: Repository<Task>, roundRepository: Repository<Round>, ledgerRepository: Repository<AcademyLedger>, courseRepository: Repository<Course>, offerRepository: Repository<Offer>, clientPaymentRepository: Repository<ClientPayment>, instructorRepository: Repository<Instructor>, roundMemberRepository: Repository<RoundMember>, financialDataRepository: Repository<FinancialData>, transactionRepository: Repository<PaymentTransaction>, studentRepository: Repository<Student>, academySessionRepository: Repository<AcademySession>, freshLeadRepository: Repository<FreshLead>, activityLogRepository: Repository<ActivityLog>, lecturerSalaryRepository: Repository<LecturerSalary>, enrollmentRepository: Repository<Enrollment>, settingRepository: Repository<SystemSetting>, attendanceRepository: Repository<AttendanceRecord>, celebrationRepository: Repository<Celebration>, expenseRepository: Repository<Expense>, breakLogRepository: Repository<BreakLog>, supportFileRepository: Repository<AcademySupportFile>, contentRepository: Repository<AcademyContent>, quizRepository: Repository<AcademyQuiz>, quizBankRepository: Repository<QuizBank>, academyTaskRepository: Repository<AcademyTask>, unlockRepository: Repository<AcademyUnlock>, progressRepository: Repository<AcademyProgress>, quizResultRepository: Repository<QuizResult>, academySupportRepository: Repository<AcademySupport>, notificationRepository: Repository<AcademyNotification>, postRepository: Repository<AcademyPost>, dmRepository: Repository<AcademyDM>, friendRepository: Repository<AcademyFriend>, reactionRepository: Repository<AcademyReaction>, quizAttemptRepository: Repository<QuizAttempt>, liveSessionRepository: Repository<LiveSession>, finalProjectRepository: Repository<AcademyFinalProject>, successStoryRepository: Repository<SuccessStory>, showcaseRepository: Repository<ShowcaseProject>, walletIncomeRepository: Repository<WalletIncome>, walletRepository: Repository<WalletAdjustment>, walletTransferRepository: Repository<WalletTransfer>, surveyResponseRepository: Repository<AcademySurveyResponse>, bsaOrientationRepository: Repository<BsaOrientation>);
    private normalizeAcadUsername;
    private matchAcadPassword;
    academyLogin(username: string, password: string): Promise<{
        success: boolean;
        message: string;
        token?: undefined;
        role?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
        role: string;
        user: {
            id: string;
            name: string;
            username: string;
            phone: string;
            pic: string;
            isBSA?: undefined;
        };
        message?: undefined;
    } | {
        success: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
        role: string;
        user: {
            id: string;
            name: string;
            username: string;
            pic: string;
            isBSA: boolean;
            phone?: undefined;
        };
        message?: undefined;
    }>;
    validateAcadSession(token: string): Promise<{
        id: string;
        role: 'student' | 'instructor';
        isBsa: boolean;
    } | null>;
    validateAcadSessionPublic(token: string): Promise<{
        id: any;
        role?: undefined;
    } | {
        id: string;
        role: "student" | "instructor";
    }>;
    academyLogout(token: string): Promise<{
        success: boolean;
    }>;
    saveProfilePic(token: string, base64Data: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    updateAcadPassword(token: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateStudentUsername(token: string, newUsername: string): Promise<{
        success: boolean;
        newUsername: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        newUsername?: undefined;
    }>;
    private isAdminOrManager;
    private fmtClientId;
    private mintClientNumber;
    private parseClientRef;
    private findRawByAnyId;
    private findMyLeadByAnyId;
    private normalizePhone;
    private transliterateArabicToEnglish;
    checkPhoneExists(phone: string): Promise<{
        success: boolean;
        found: boolean;
        client?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        found: boolean;
        client: {
            id: string;
            name: string;
            status: string;
            agent: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        found: any;
        error: any;
        client?: undefined;
    }>;
    addManualLead(name: string, phone: string, course: string, source: string, agentId: string, agentName: string): Promise<{
        success: boolean;
        id: string;
        name: string;
        phone: string;
        course: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
        name?: undefined;
        phone?: undefined;
        course?: undefined;
    }>;
    adminEditClientRecord(clientNumber: number, fields: any, adminId: string, adminName: string): Promise<any>;
    archiveClientRecord(clientNumber: number, adminId: string, adminName: string, reason?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    restoreClientRecord(clientNumber: number, adminId: string, adminName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getArchivedClients(adminId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        course: string;
        agentName: string;
        archivedAt: string;
    }[]>;
    updateClientOCCode(clientNumber: number, ocCode: string, agentId: string, agentName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteLeadFromMyLeads(clientNumber: number, agentId: string, isManager: boolean): Promise<{
        success: boolean;
        message: any;
    }>;
    adminDeleteLead(clientNumber: number, adminId?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateLeadDetailsDirectly(clientNumber: number, newName: string, newPhone: string, newCourse: string, newStatus: string, newNextDue: string, newNotesText: string, agentId: string, agentName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    searchClientHistoryCandidates(query: string): Promise<{
        found: boolean;
        results: {
            id: number;
            name: string;
            phone: string;
            ocCode: string;
            agent: string;
            status: string;
        }[];
        message?: undefined;
    } | {
        found: boolean;
        results: any[];
        message: string;
    }>;
    adminGetAllLeads(selectedMonth?: string): Promise<{
        id: string;
        name: string;
        phone: string;
        course: string;
        agent: string;
        status: string;
        lastAction: string;
        ocCode: string;
        createdAt: string;
    }[]>;
    private logActivity;
    private resolveForDate;
    getAgentKeysForFresh(): Promise<{
        keys: string[];
    }>;
    addFreshLeadToSheet(agentKey: string, name: string, phone: string, source: string, campaign: string, course: string, addedById: string, addedByName: string, targetDate?: string, phone2?: string): Promise<{
        success: boolean;
        message: string;
        alreadyExists?: undefined;
        name?: undefined;
        phone?: undefined;
        addedToFreshSheet?: undefined;
    } | {
        success: boolean;
        alreadyExists: boolean;
        message: string;
        name?: undefined;
        phone?: undefined;
        addedToFreshSheet?: undefined;
    } | {
        success: boolean;
        name: string;
        phone: string;
        addedToFreshSheet: boolean;
        message: string;
        alreadyExists?: undefined;
    }>;
    getAvailableFreshCount(agentId: string, agentName: string, agentKey?: string, selectedDay?: string): Promise<{
        success: boolean;
        count: number;
        message?: undefined;
    } | {
        success: boolean;
        count: number;
        message: string;
    }>;
    pullFreshLeadOnly(agentId: string, agentName: string, agentKey?: string, selectedDay?: string): Promise<{
        success: boolean;
        message: string;
        id?: undefined;
        name?: undefined;
        phone?: undefined;
        course?: undefined;
        type?: undefined;
        source?: undefined;
        campaign?: undefined;
    } | {
        success: boolean;
        id: string;
        name: string;
        phone: string;
        course: string;
        type: string;
        source: string;
        campaign: string;
        message?: undefined;
    }>;
    getTodayFreshLeads(): Promise<{
        leads: {
            addedBy: string;
            phone: string;
            agentKey: string;
            time: string;
            name: string;
            source: string;
            course: string;
            campaign: string;
            details: string;
        }[];
        todayDate: string;
        todayDay: number;
        error?: undefined;
    } | {
        leads: any[];
        error: any;
        todayDate?: undefined;
        todayDay?: undefined;
    }>;
    getTodayRangeLeadsForAgent(agentKey: string, agentName: string, selectedDay?: string): Promise<{
        success: boolean;
        leads: {
            phone: string;
            name: string;
            campaign: string;
            pulled: boolean;
            pulledText: string;
        }[];
        tabName: string;
        todayDay: number;
        message?: undefined;
    } | {
        success: boolean;
        leads: any[];
        message: string;
        tabName?: undefined;
        todayDay?: undefined;
    }>;
    getFreshLeadAgentStats(selectedDay?: string): Promise<{
        stats: {
            key: string;
            count: number;
            total: number;
        }[];
        tabName: string;
        source: string;
        error?: undefined;
    } | {
        error: any;
        stats: any[];
        tabName?: undefined;
        source?: undefined;
    }>;
    transferFreshLead(phone: string, fromAgentKey: string, toAgentKey: string, operatorId: string, operatorName: string, selectedDay?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateFreshLeadDetails(phone: string, newName: string, newSource: string, newCampaign: string, newCourse: string, operatorId: string, operatorName: string, selectedDay?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    migrateLeadDay(fromDay: string, toDay: string, operatorId: string, operatorName: string): Promise<{
        success: boolean;
        moved: number;
        skipped: number;
        message: string;
    } | {
        success: boolean;
        message: string;
        moved?: undefined;
        skipped?: undefined;
    }>;
    getRecyclePullCount(agentId: string): Promise<number>;
    pullRecycledLeadRandomly(agentId: string, agentName: string): Promise<{
        success: boolean;
        message: string;
        id?: undefined;
        name?: undefined;
        phone?: undefined;
        course?: undefined;
        lastNote?: undefined;
        remaining?: undefined;
        source?: undefined;
        campaign?: undefined;
    } | {
        success: boolean;
        id: string;
        name: string;
        phone: string;
        course: string;
        lastNote: string;
        remaining: number;
        source: string;
        campaign: string;
        message?: undefined;
    }>;
    claimSearchedLead(clientNumber: number, rowIndex: any, agentId: string, agentName: string): Promise<{
        success: boolean;
        message: string;
        id?: undefined;
        name?: undefined;
    } | {
        success: boolean;
        id: string;
        name: string;
        message?: undefined;
    }>;
    getTodayCalls(agentId: string): Promise<any[]>;
    getIdleLeads(agentId: string, daysLimit?: number): Promise<{
        id: string | number;
        name: string;
        phone: string;
        daysAgo: number;
    }[]>;
    getMyLeadsOrphans(): Promise<{
        success: boolean;
        orphans: {
            id: number;
            name: string;
            phone: string;
            status: string;
        }[];
        count: number;
        message?: undefined;
    } | {
        success: boolean;
        orphans: any[];
        message: any;
        count?: undefined;
    }>;
    getRoundMembersOrphans(): Promise<{
        success: boolean;
        orphans: {
            ocCode: string;
            name: string;
            phone: string;
        }[];
        count: number;
        message?: undefined;
    } | {
        success: boolean;
        orphans: any[];
        message: any;
        count?: undefined;
    }>;
    findClientForRoundPull(phone: string): Promise<{
        success: boolean;
        client: any;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        client?: undefined;
    }>;
    findClientForOldPayment(agentId: string, query: string): Promise<{
        success: boolean;
        client: {
            name: string;
            phone: string;
            ocCode: string;
            month: number;
            year: number;
            totalPrice: number;
            totalPaid: number;
            agentName: string;
            remaining: number;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        client?: undefined;
    }>;
    lookupStudentPhone(phone: string): Promise<{
        success: boolean;
        found: boolean;
        id?: undefined;
        name?: undefined;
        email?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        found: boolean;
        id: string;
        name: string;
        email: string;
        message?: undefined;
    } | {
        success: boolean;
        found: boolean;
        message: any;
        id?: undefined;
        name?: undefined;
        email?: undefined;
    }>;
    syncStudentByPhone(phone: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getClientDetailsByPhone(phone: string): Promise<{
        success: boolean;
        message: string;
        client: {
            name: string;
            phone: string;
            ocCode: string;
            course: string;
            roundName: string;
            roundId: string;
            suggestedUname: string;
            suggestedPass: string;
        };
    } | {
        success: boolean;
        message: any;
        client?: undefined;
    }>;
    syncStudentPhones(): Promise<{
        success: boolean;
        fixed: number;
        message: string;
    }>;
    migrateRawDataOcCodes(): Promise<{
        success: boolean;
        message: string;
    }>;
    repairMyLeadsAfterIdFix(): Promise<{
        success: boolean;
        message: string;
    }>;
    autoSyncMissingOcCodes(): Promise<{
        success: boolean;
        synced: number;
        message: string;
    }>;
    syncClientOcCodeFromExternal(): Promise<{
        success: boolean;
        message: string;
    }>;
    private genLegacyId;
    private ensureOcCodeForClient;
    private findPaymentByAnyId;
    addClientPayment(clientId: any, clientName: string, clientPhone: string, course: string, roundId: any, roundName: string, total: any, agentId: string, agentName: string, firstPay: any, nextDue: string, notes: string, inst1?: any, inst2?: any, inst3?: any): Promise<{
        success: boolean;
        message: string;
        payId: string;
        promoted: boolean;
    } | {
        success: boolean;
        message: string;
        payId: string;
        promoted?: undefined;
    } | {
        success: boolean;
        message: any;
        payId?: undefined;
        promoted?: undefined;
    }>;
    addInstallment(payId: any, amount: any, agentId: string, agentName: string, nextDue?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateClientPayment(payId: any, total: any, paid: any, inst1: any, inst2: any, inst3: any, nextDue: string, notes: string, roundId: any, roundName: string, expectedLastModified?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteClientPaymentRecord(payId: any, adminId: string, adminName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    restoreClientPaymentRecord(payId: any, adminId: string, adminName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getDeletedPayments(adminId: string): Promise<{
        id: string;
        clientName: string;
        course: string;
        roundName: string;
        total: number;
        paid: number;
        deletedBy: string;
        deletedAt: string;
    }[]>;
    getOverdueInstallments(userId?: string): Promise<{
        success: boolean;
        rows: {
            name: string;
            course: string;
            total: number;
            paid: number;
            remaining: number;
            nextDue: string;
            daysLate: number;
            agent: string;
            payId: string;
        }[];
        totalOverdue: number;
        message?: undefined;
    } | {
        success: boolean;
        rows: any[];
        message: any;
        totalOverdue?: undefined;
    }>;
    fixAllClientPaymentCalculations(adminId: string): Promise<{
        success: boolean;
        fixed: number;
        message: string;
    } | {
        success: boolean;
        message: any;
        fixed?: undefined;
    }>;
    fixDuplicatePayIds(): Promise<{
        success: boolean;
        message: string;
    }>;
    createDirectInvoice(): Promise<{
        success: boolean;
        message: string;
    }>;
    getClientInvoicePdf(): Promise<{
        success: boolean;
        message: string;
    }>;
    getInvoiceFormUrl(): Promise<{
        success: boolean;
        url: string;
        message: string;
    }>;
    sendPaymentLink(): Promise<{
        success: boolean;
        message: string;
    }>;
    getPaymentLinks(): Promise<{
        success: boolean;
        links: any[];
    }>;
    private isManagerOnly;
    private findRoundByAnyId;
    addRound(name: string, startDate: string, schedule: string, maxSeats: any, type: string, status: string, instructor: string): Promise<{
        success: boolean;
        message: string;
        roundId: string;
    } | {
        success: boolean;
        message: any;
        roundId?: undefined;
    }>;
    updateRound(roundId: any, name: string, startDate: string, schedule: string, maxSeats: any, status: string, type: string, instructor?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteRound(roundId: any, adminId: string, adminName: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    restoreRound(roundId: any, adminId: string, adminName: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getDeletedRounds(adminId: string): Promise<{
        id: string;
        name: string;
        startDate: string;
        type: string;
        instructor: string;
        deletedBy: string;
        deletedAt: string;
    }[]>;
    toggleRoundStatusDirectly(roundId: any, newStatus: string): Promise<{
        success: boolean;
        message: any;
    }>;
    setRoundOffer(roundId: any, offerPrice: any, offerExpiry: string, adminId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    addRoundMember(roundId: any, memberData: any): Promise<{
        success: boolean;
        message: any;
    }>;
    removeRoundMember(roundId: any, ocCode: string, clientName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateRoundMemberDetails(roundId: any, ocCode: string, clientName: string, price: any, paid: any, method: string, attendance: string): Promise<{
        success: boolean;
        message: any;
    }>;
    syncRoundToAcademy(roundId: any, instructorTag?: string, accessMode?: string, freeN?: any): Promise<{
        success: boolean;
        added: number;
        alreadyEnrolled: number;
        skipped: number;
        createdStudents: any[];
        message: string;
    } | {
        success: boolean;
        message: any;
        added?: undefined;
        alreadyEnrolled?: undefined;
        skipped?: undefined;
        createdStudents?: undefined;
    }>;
    getLecturerSalaries(): Promise<{
        id: string;
        roundId: string;
        roundName: string;
        roundType: string;
        instructor: string;
        pay1Amount: string;
        pay1Status: string;
        pay1Date: string;
        pay2Amount: string;
        pay2Status: string;
        pay2Date: string;
        alert1: boolean;
        alert2: boolean;
        notes: string;
        createdAt: string;
    }[]>;
    updateLecturerSalaryPayment(data: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    deleteLecturerSalary(id: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    addLecturerSalaryManual(data: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getAgentNames(): Promise<{
        success: boolean;
        names: string[];
    }>;
    getAgentRangesConfig(): Promise<{
        success: boolean;
        ranges: {
            key: string;
            startRow: number;
            endRow: number;
            startCol: number;
            note: string;
        }[];
    }>;
    setAgentRange(): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAgentRange(): Promise<{
        success: boolean;
        message: string;
    }>;
    repairAgentIds(adminId: string): Promise<{
        success: boolean;
        message: string;
        fixed?: undefined;
        unresolved?: undefined;
    } | {
        success: boolean;
        fixed: number;
        unresolved: number;
        message: string;
    }>;
    repairFreshDuplicateMarksRange(daysBack?: any): Promise<{
        success: boolean;
        fixed: number;
        keptAsReal: number;
        tabsChecked: number;
        keptDetails: any[];
        message: string;
    } | {
        success: boolean;
        message: any;
        fixed?: undefined;
        keptAsReal?: undefined;
        tabsChecked?: undefined;
        keptDetails?: undefined;
    }>;
    private getSettingValue;
    private setSettingValue;
    getSystemSetting(key: string, defaultValue?: any): Promise<any>;
    saveSystemSetting(key: string, value: any): Promise<{
        success: boolean;
        message: any;
    }>;
    getAttendanceData(roundId: any): Promise<any[]>;
    saveAttendanceData(roundId: any, phone: string, name: string, lectureNum: any, type: string, status: boolean): Promise<{
        success: boolean;
        salaryAlert: {
            roundId: string;
            roundName: string;
            instructor: string;
            paymentNum: number;
            currentLec: number;
            nextPayLec: number;
            pay1Amount: string;
            pay2Amount: string;
            salaryId: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        salaryAlert?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        salaryAlert?: undefined;
    }>;
    openAttendanceSession(userId: string, roundId: any, lectureNum: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    closeAttendanceSession(userId: string, roundId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getActiveSessions(userId: string): Promise<unknown[]>;
    getTasks(agentId: string): Promise<{
        id: string;
        task: string;
        priority: string;
    }[]>;
    addTask(text: string, priority: string, agentId: string): Promise<boolean>;
    getActivityLog(limit?: number): Promise<{
        date: string;
        agentName: string;
        action: string;
        details: string;
    }[]>;
    getLatestCelebration(): Promise<{
        agentName: string;
    }>;
    getPages(): {
        id: string;
        label: string;
    }[];
    addUser(name: string, username: string, password: string, role: string, pages: any, agentKey?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateUserPages(userId: string, pages: any): Promise<{
        success: boolean;
        message: any;
    }>;
    getBatchCredentials(roundId: any): Promise<{
        success: boolean;
        credentials: {
            name: string;
            username: string;
            phone: string;
            note: string;
        }[];
        roundName: string;
        message?: undefined;
    } | {
        success: boolean;
        credentials: any[];
        message: any;
        roundName?: undefined;
    }>;
    private validUser;
    private fmtDate;
    getWallets(userId: string): Promise<{
        success: boolean;
        wallets: {
            name: string;
            balance: number;
            adjDate: string;
            savedAt: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        wallets?: undefined;
    }>;
    setWalletBalance(userId: string, walletName: string, newBalance: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    transferWalletFunds(userId: string, fromWallet: string, toWallet: string, amount: any, notes?: string): Promise<{
        success: boolean;
        fromBalance: number;
        toBalance: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        fromBalance?: undefined;
        toBalance?: undefined;
    }>;
    addWalletIncome(userId: string, walletName: string, amount: any, description: string, category: string, date: string, method: string, notes: string): Promise<{
        success: boolean;
        id: string;
        newBalance: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
        newBalance?: undefined;
    }>;
    getWalletIncome(userId: string, month?: any, year?: any): Promise<{
        success: boolean;
        rows: {
            id: string;
            date: string;
            category: string;
            desc: string;
            amount: number;
            wallet: string;
            method: string;
            by: string;
            notes: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        rows: any[];
        message: any;
    }>;
    addAccountingExpense(userId: string, category: string, description: string, amount: any, date?: string, method?: string, notes?: string): Promise<{
        success: boolean;
        id: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
    }>;
    getAccountingExpenses(userId: string, month?: any, year?: any): Promise<{
        success: boolean;
        rows: {
            id: string;
            date: string;
            category: string;
            desc: string;
            amount: number;
            method: string;
            by: string;
            notes: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        rows: any[];
        message: any;
    }>;
    getAccountingTransactions(userId: string, month?: any, year?: any): Promise<{
        success: boolean;
        rows: {
            id: string;
            name: string;
            amount: number;
            date: string;
            type: string;
            agent: string;
            method: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        rows: any[];
        message: any;
    }>;
    private readonly DEFAULT_EXP_CATS;
    getAccExpenseCategories(userId: string): Promise<{
        success: boolean;
        categories: any;
    }>;
    addAccExpenseCategory(userId: string, name: string): Promise<{
        success: boolean;
        categories: string[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        categories?: undefined;
    }>;
    deleteAccExpenseCategory(userId: string, name: string): Promise<{
        success: boolean;
        categories: string[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        categories?: undefined;
    }>;
    payInstructorSalaryFromWallet(userId: string, salaryId: any, paymentKey: string, walletName: string, amount: any, payDate?: string): Promise<{
        success: boolean;
        newBalance: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        newBalance?: undefined;
    }>;
    getAccountingDashboard(userId: string, filterMonth?: any, filterYear?: any): Promise<{
        success: boolean;
        isAllMode: boolean;
        scopeMonth: number;
        scopeYear: number;
        curIncome: number;
        curExpense: number;
        curProfit: number;
        overdueCount: any;
        overdueTotal: any;
        trend: any[];
        topCourses: {
            name: string;
            amount: number;
        }[];
        topCampaigns: {
            name: string;
            amount: number;
        }[];
        expByCategory: {
            name: string;
            amount: number;
        }[];
        expenseTrend: any[];
        expenseTrendCats: string[];
        expenseAlerts: any[];
        recentTx: {
            name: string;
            amount: number;
            date: string;
            type: string;
            method: string;
        }[];
        wallets: {
            name: string;
            balance: number;
            adjDate: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        isAllMode?: undefined;
        scopeMonth?: undefined;
        scopeYear?: undefined;
        curIncome?: undefined;
        curExpense?: undefined;
        curProfit?: undefined;
        overdueCount?: undefined;
        overdueTotal?: undefined;
        trend?: undefined;
        topCourses?: undefined;
        topCampaigns?: undefined;
        expByCategory?: undefined;
        expenseTrend?: undefined;
        expenseTrendCats?: undefined;
        expenseAlerts?: undefined;
        recentTx?: undefined;
        wallets?: undefined;
    }>;
    getCampaignList(): Promise<{
        success: boolean;
        campaigns: any;
    }>;
    saveCampaignList(campaigns: any): Promise<{
        success: boolean;
        message: any;
    }>;
    getPlatformList(): Promise<{
        success: boolean;
        platforms: any;
    }>;
    savePlatformList(platforms: any): Promise<{
        success: boolean;
        message: any;
    }>;
    saveInstructorList(instructors: any): Promise<{
        success: boolean;
        message: any;
    }>;
    private parseDateSafe;
    addFinancialClient(agentId: string, agentName: string, month: any, year: any, clientData: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    addFinancialPayment(agentId: string, agentName: string, month: any, year: any, payData: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    updateFinancialRowDirect(rowIndex: any, fields: any): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteFinancialClient(agentId: string, month: any, year: any, idx: any, rowIndex: any): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteFinancialPayment(agentId: string, month: any, year: any, idx: any, rowIndex: any): Promise<{
        success: boolean;
        message: any;
    }>;
    getAcademyLedgerData(): Promise<{
        reservationDate: string;
        bookingDate: string;
        ocCode: string;
        clientName: string;
        phone: string;
        course: string;
        roundName: string;
        groupName: string;
        status: string;
        totalPrice: number;
        paymentMethod: any;
        paidAmount: number;
        remainingAmount: number;
        agentName: string;
        inst1Detail: string;
        inst2Detail: string;
        inst3Detail: string;
        attendanceDate: string;
    }[]>;
    syncFinancialCampaignTypes(): Promise<{
        success: boolean;
        fixed: number;
        message: string;
    } | {
        success: boolean;
        message: any;
        fixed?: undefined;
    }>;
    importAcademyFinancialData(): Promise<{
        success: boolean;
        message: string;
    }>;
    cleanupFinancialSnapshotDuplicates(): Promise<{
        success: boolean;
        cleaned: number;
        message: string;
    }>;
    toggleSupportClaim(id: any, supporterId: string, supporterName: string): Promise<{
        success: boolean;
        claimed: boolean;
        message: string;
    } | {
        success: boolean;
        message: any;
        claimed?: undefined;
    }>;
    deleteSupportRequest(id: any, agentId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    markExceptionDone(id: any, agentId: string): Promise<{
        success: boolean;
        expired: boolean;
        message: string;
    } | {
        success: boolean;
        message: any;
        expired?: undefined;
    }>;
    deleteExceptionRequest(id: any, agentId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getSupportFilesCRM(instructorTag: string): Promise<{
        success: boolean;
        files: {
            id: string;
            instructorTag: string;
            title: string;
            driveFileId: string;
            fileName: string;
            fileType: string;
            url: string;
            createdAt: string;
        }[];
    }>;
    addSupportFileByIdCRM(instructorTag: string, title: string, driveFileId: string, fileType: string, url: string, fileBase64?: string, fileName?: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
    }>;
    deleteSupportFileCRM(fileRecordId: any): Promise<{
        success: boolean;
        message: any;
    }>;
    private inDateRange;
    getTeamPerformance(range?: string, viewerId?: string, viewerName?: string): Promise<any[]>;
    getMyPerformance(agentId: string, range?: string): Promise<any>;
    getBreakStatus(): Promise<any[]>;
    logBreakAction(agentId: string, agentName: string, action: string, workDuration?: string, totalBreak?: string, overtime?: string, earlyReason?: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getFuAlertsNow(agentId: string): Promise<{
        success: boolean;
        alerts: {
            id: number;
            name: string;
            phone: string;
            time: string;
        }[];
    }>;
    getAdminAlerts(): Promise<{
        success: boolean;
        alerts: any[];
    }>;
    systemHealthCheck(): Promise<{
        success: boolean;
        checks: {
            name: string;
            ok: boolean;
            detail: string;
        }[];
        message: string;
    } | {
        success: boolean;
        message: string;
        checks?: undefined;
    }>;
    sendPerformanceReport(): Promise<{
        success: boolean;
        message: string;
    }>;
    setupDailyReportTrigger(): Promise<{
        success: boolean;
        message: string;
    }>;
    private findStudentByAnyId;
    private findContentByAnyId;
    addStudent(name: string, username: string, password: string, phone: string, instructorTag?: string, roundId?: any, roundName?: string, accessMode?: string, ocCode?: string): Promise<{
        success: boolean;
        message: string;
        id: string;
        username: string;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
        username?: undefined;
    }>;
    updateStudent(studentId: any, name: string, username: string, phone: string, instructorTag?: string, newPassword?: string, ocCode?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteStudent(studentId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    toggleStudentActive(studentId: any, active: boolean): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    setStudentAccessMode(studentId: any, mode: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    updateStudentPassword(studentId: any, newPassword: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateInstructorPassword(instructorId: any, newPassword: string): Promise<{
        success: boolean;
        message: any;
    }>;
    enrollStudent(studentId: any, roundId: any, roundName?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getAcademyStudents(): Promise<{
        students: {
            id: string;
            name: string;
            username: string;
            password: string;
            phone: string;
            active: boolean;
            instructorTag: string;
            accessMode: string;
            ocCode: string;
            createdAt: string;
            lecturesTotal: number;
            lecturesDone: number;
            roundIds: string[];
            finalProjectUnlocked: boolean;
        }[];
    }>;
    getAcademyStats(): Promise<{
        students: number;
        enrollments: number;
        pendingTasks: number;
        approvedTasks: number;
    }>;
    getAcademyTarget(): Promise<{
        totalPaid: number;
        totalTarget: number;
        pct: number;
        remaining: number;
    }>;
    getAcademyRoundsList(): Promise<{
        rounds: {
            id: string;
            name: string;
            type: string;
            status: string;
            instructor: string;
            startDate: string;
        }[];
    }>;
    addLectureContent(roundId: any, roundName: string, lectureOrder: any, lectureName: string, driveFileId: string, fileType: string, taskRequired: boolean, notes: string, instructorTag?: string, pdfFileId?: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
    }>;
    updateLectureContent(contentId: any, lectureName: string, driveFileId: string, fileType: string, taskRequired: boolean, isLocked: boolean, notes: string, pdfFileId?: string, instructorTag?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteLectureContent(contentId: any): Promise<{
        success: boolean;
        message: any;
    }>;
    getContentForUnlock(studentId: any): Promise<{
        items: {
            id: string;
            order: number;
            name: string;
            instructor: string;
        }[];
    }>;
    getAllContentGroupedByInstructor(): Promise<{
        success: boolean;
        groups: {
            instructor: string;
            lecs: any[];
        }[];
        grouped: Record<string, any[]>;
    }>;
    manualUnlockLecture(studentId: any, lectureId: any, adminName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    saveQuizForLecture(lectureId: any, roundId: any, lectureName: string, questionsArr: any, passScore: any, quizSize?: any): Promise<{
        success: boolean;
        message: any;
    }>;
    getQuizForLecture(lectureId: any): Promise<{
        success: boolean;
        quiz: {
            id: string;
            lectureName: string;
            questions: any;
            passScore: number;
            quizSize: number;
        };
        message?: undefined;
    } | {
        success: boolean;
        quiz: any;
        message: any;
    }>;
    deleteQuizForLecture(lectureId: any): Promise<{
        success: boolean;
        message: any;
    }>;
    importQuestionsFromBank(lectureId?: any): Promise<{
        success: boolean;
        questions: {
            q: string;
            options: string[];
            correct: number;
        }[];
        count: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        questions?: undefined;
        count?: undefined;
    }>;
    getAllAcadTasks(status?: string): Promise<{
        success: boolean;
        tasks: {
            id: string;
            studentName: string;
            lectureName: string;
            fileName: string;
            driveFileId: string;
            submittedAt: string;
            status: string;
            reviewedBy: string;
            reviewNotes: string;
            roundName: string;
            instructorName: string;
        }[];
    }>;
    reviewStudentTask(taskId: any, action: string, reviewerName: string, notes?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    private notifyAcad;
    private contentKey;
    private studentWatchedSet;
    getStudentDashboard(token: string): Promise<{
        success: boolean;
        rounds: any[];
        lastLecture: any;
        totalQuizPassed: number;
        totalTasksApproved: number;
        totalPoints: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        rounds?: undefined;
        lastLecture?: undefined;
        totalQuizPassed?: undefined;
        totalTasksApproved?: undefined;
        totalPoints?: undefined;
    }>;
    getStudentRounds(token: string): Promise<{
        success: boolean;
        message: any;
        rounds: any[];
        lecturesDone?: undefined;
        avgQuiz?: undefined;
        totalPoints?: undefined;
    } | {
        success: boolean;
        rounds: any;
        lecturesDone: any;
        avgQuiz: number;
        totalPoints: any;
        message?: undefined;
    }>;
    getRoundLectures(token: string, roundId: string): Promise<{
        success: boolean;
        roundName: string;
        lectures: any[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        roundName?: undefined;
        lectures?: undefined;
    }>;
    private markWatched;
    parseVideoUrlToEmbedUrl(val: string): string;
    getSecureFileUrl(token: string, lectureId: string): Promise<{
        success: boolean;
        urls: string[];
        pdfUrls: string[];
        url: string;
        pdfUrl: string;
        url2: string;
        fileType: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        urls?: undefined;
        pdfUrls?: undefined;
        url?: undefined;
        pdfUrl?: undefined;
        url2?: undefined;
        fileType?: undefined;
    }>;
    submitStudentTask(token: string, lectureId: string, roundId: string, lectureName: string, fileName: string, fileBase64: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getStudentTaskHistory(token: string): Promise<{
        success: boolean;
        tasks: {
            id: string;
            lectureId: string;
            lectureName: string;
            roundId: string;
            fileName: string;
            driveFileId: string;
            driveUrl: string;
            submittedAt: string;
            status: string;
            reviewedAt: string;
            reviewerName: string;
            feedback: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        tasks?: undefined;
    }>;
    getStudentQuizHistory(token: string): Promise<{
        success: boolean;
        quizzes: {
            id: string;
            lectureId: string;
            lectureName: string;
            score: number;
            passed: boolean;
            attemptAt: string;
            totalQ: number;
            correctQ: number;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        quizzes?: undefined;
    }>;
    submitSupportTicket(token: string, subject: string, message: string, imageBase64?: string, imageName?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getSupportTickets(token: string): Promise<{
        success: boolean;
        tickets: {
            id: string;
            studentId: string;
            studentName: string;
            studentPhone: string;
            studentEmail: string;
            subject: string;
            message: string;
            status: string;
            imageUrl: string;
            createdAt: string;
            adminReply: string;
            repliedAt: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        tickets?: undefined;
    }>;
    replyToSupportTicket(token: string, ticketId: any, reply: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getStudentSupportFiles(token: string): Promise<{
        success: boolean;
        grouped: {
            insName: string;
            files: {
                id: string;
                instructorTag: string;
                title: string;
                driveFileId: string;
                fileName: string;
                fileType: string;
                url: string;
                createdAt: string;
            }[];
        }[];
    }>;
    getInstructorSupportFiles(token: string): Promise<{
        success: boolean;
        files: {
            id: string;
            instructorTag: string;
            title: string;
            driveFileId: string;
            fileName: string;
            fileType: string;
            url: string;
            createdAt: string;
        }[];
    }>;
    getStudentCertificates(token: string): Promise<{
        success: boolean;
        message: string;
        certificates?: undefined;
    } | {
        success: boolean;
        certificates: any[];
        message?: undefined;
    }>;
    getStudentFinancials(token: string): Promise<{
        success: boolean;
        payments: any[];
        noOc: boolean;
        ocCode?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        payments: any[];
        ocCode: string;
        noOc?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        payments?: undefined;
        noOc?: undefined;
        ocCode?: undefined;
    }>;
    getMentionableUsers(token: string): Promise<{
        success: boolean;
        users: {
            name: string;
            type: string;
        }[];
    }>;
    private acadUserInfo;
    private acadPicMap;
    getMyNotifications(token: string): Promise<{
        success: boolean;
        notifications: any[];
        unread?: undefined;
    } | {
        success: boolean;
        notifications: {
            id: string;
            type: string;
            message: string;
            refId: string;
            isRead: boolean;
            createdAt: string;
        }[];
        unread: number;
    }>;
    markNotifRead(token: string, notifId: any): Promise<{
        success: boolean;
    }>;
    markAllNotifsRead(token: string): Promise<{
        success: boolean;
    }>;
    getNotifTarget(token: string, notifId: any): Promise<{
        success: boolean;
        type?: undefined;
        refId?: undefined;
    } | {
        success: boolean;
        type: string;
        refId: string;
    }>;
    isUserOnline(token: string, userId: string): Promise<{
        success: boolean;
        online: boolean;
    }>;
    sendFriendRequest(token: string, friendId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    acceptFriendRequest(token: string, requesterId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    removeFriend(token: string, friendId: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getFriends(token: string): Promise<{
        success: boolean;
        friends: any[];
    }>;
    getPendingRequests(token: string): Promise<{
        success: boolean;
        requests: any[];
    }>;
    searchAcadUsers(token: string, query: string): Promise<{
        success: boolean;
        users: {
            id: string;
            name: string;
            pic: string;
            type: string;
        }[];
    }>;
    sendDMMessage(token: string, toId: string, message: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getConversations(token: string): Promise<{
        success: boolean;
        conversations: any[];
    }>;
    getDMHistoryNorm(token: string, otherId: string): Promise<{
        success: boolean;
        messages: {
            id: string;
            fromId: string;
            fromName: string;
            message: string;
            timestamp: string;
            mine: boolean;
            read: boolean;
        }[];
    }>;
    getDMHistorySince(token: string, otherId: string, sinceIso?: string): Promise<any>;
    markDMsRead(token: string, otherId: string): Promise<{
        success: boolean;
    }>;
    private decoratePosts;
    postCommunityMessage(token: string, content: string, parentId?: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getCommunityFeed(token: string, limit?: any): Promise<{
        success: boolean;
        posts: {
            id: string;
            authorId: string;
            authorType: string;
            authorName: string;
            authorPic: string;
            content: string;
            parentId: string;
            likes: number;
            reactionCounts: Record<string, number>;
            myReaction: string;
            createdAt: string;
        }[];
    }>;
    checkCommunityNew(token: string, sinceIso?: string): Promise<{
        success: boolean;
        hasNew: boolean;
        newPosts: {
            id: string;
            authorId: string;
            authorType: string;
            authorName: string;
            authorPic: string;
            content: string;
            parentId: string;
            likes: number;
            reactionCounts: Record<string, number>;
            myReaction: string;
            createdAt: string;
        }[];
    }>;
    deleteCommunityPost(token: string, postId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    postComment(token: string, lectureId: string, content: string, parentId?: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    deleteComment(token: string, commentId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getLectureComments(token: string, lectureId: string): Promise<{
        success: boolean;
        comments: {
            id: string;
            authorId: string;
            authorType: string;
            authorName: string;
            authorPic: string;
            content: string;
            parentId: string;
            likes: number;
            reactionCounts: Record<string, number>;
            myReaction: string;
            createdAt: string;
        }[];
    }>;
    getInstructorLectureComments(token: string): Promise<{
        success: boolean;
        comments: {
            lectureId: string;
            lectureName: string;
            id: string;
            authorId: string;
            authorType: string;
            authorName: string;
            authorPic: string;
            content: string;
            parentId: string;
            likes: number;
            reactionCounts: Record<string, number>;
            myReaction: string;
            createdAt: string;
        }[];
    }>;
    reactToItem(token: string, itemType: string, itemId: string, reactionType?: string): Promise<{
        success: boolean;
        myReaction?: undefined;
        reactionCounts?: undefined;
    } | {
        success: boolean;
        myReaction: string;
        reactionCounts: Record<string, number>;
    }>;
    getClassLeaderboard(token: string): Promise<{
        success: boolean;
        leaderboard: {
            id: string;
            name: string;
            pic: string;
            points: number;
            lectures: number;
            quizzes: number;
            tasks: number;
        }[];
    }>;
    getClassActivity(token: string): Promise<{
        success: boolean;
        activity: any[];
    }>;
    private quizForLectureInternal;
    getStudentQuiz(token: string, lectureId: string): Promise<{
        success: boolean;
        questions: {
            idx: number;
            q: any;
            options: any;
        }[];
        passScore: number;
        totalQ: number;
        alreadyPassed: boolean;
        attemptId: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        questions?: undefined;
        passScore?: undefined;
        totalQ?: undefined;
        alreadyPassed?: undefined;
        attemptId?: undefined;
    }>;
    submitQuizAnswers(token: string, lectureId: string, answersArr: any[], attemptId: string): Promise<{
        success: boolean;
        score: number;
        passed: boolean;
        correct: number;
        total: number;
        review: {
            correct: number;
        }[];
        message: string;
    } | {
        success: boolean;
        message: any;
        score?: undefined;
        passed?: undefined;
        correct?: undefined;
        total?: undefined;
        review?: undefined;
    }>;
    private buildQuizReview;
    getStudentQuizReview(token: string, lectureId: string): Promise<{
        success: boolean;
        questions: {
            q: any;
            options: any;
            correct: number;
            chosen: number;
            isCorrect: boolean;
        }[];
    }>;
    getInstructorQuizReview(token: string, studentId: string, lectureId: string): Promise<{
        success: boolean;
        questions: {
            q: any;
            options: any;
            correct: number;
            chosen: number;
            isCorrect: boolean;
        }[];
    } | {
        success: boolean;
        questions: any[];
        message: string;
    }>;
    getInstructorStudentQuizResults(token: string, lectureId?: string): Promise<{
        success: boolean;
        results: {
            studentId: string;
            studentName: string;
            lectureId: string;
            lectureName: string;
            score: number;
            passed: boolean;
            attemptAt: string;
        }[];
    }>;
    addLiveSession(adminToken: string, payload: any): Promise<{
        success: boolean;
        message: string;
        id: string;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
    }>;
    deleteLiveSession(adminToken: string, sessionId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    private mapLiveSession;
    getAllLiveSessions(token: string): Promise<{
        success: boolean;
        sessions: {
            id: string;
            roundId: string;
            roundName: string;
            title: string;
            meetLink: string;
            platform: string;
            startTime: string;
            endTime: string;
            createdBy: string;
        }[];
    }>;
    getLiveSessionsByRounds(userToken: string): Promise<{
        success: boolean;
        sessions: {
            id: string;
            roundId: string;
            roundName: string;
            title: string;
            meetLink: string;
            platform: string;
            startTime: string;
            endTime: string;
            createdBy: string;
        }[];
    }>;
    getLastLiveSessionForRound(token: string, roundId: any): Promise<{
        success: boolean;
        session: {
            id: string;
            roundId: string;
            roundName: string;
            title: string;
            meetLink: string;
            platform: string;
            startTime: string;
            endTime: string;
            createdBy: string;
        };
    }>;
    joinLiveSession(userToken: string, sessionId: any): Promise<{
        success: boolean;
        meetLink: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        meetLink?: undefined;
    }>;
    getLiveSessionAttendees(token: string, sessionId: any): Promise<{
        success: boolean;
        attendees: any;
    }>;
    getAttendSessionPreview(token: string): Promise<{
        success: boolean;
        session: any;
    }>;
    qrCheckInAuto(userToken: string): Promise<any>;
    private chunkDir;
    submitFinalProjectChunk(token: string, chunkB64: string, chunkIndex: any, totalChunks: any, fileName: string, mimeType: string): Promise<{
        success: boolean;
        received: number;
        total: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        received?: undefined;
        total?: undefined;
    }>;
    private saveFinalProject;
    submitFinalProject(token: string, base64Data: string, fileName: string, mimeType?: string, driveFileId?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    uploadProjectOutline(token: string, base64Data: string, fileName: string, mimeType?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getStudentFinalProject(token: string): Promise<{
        success: boolean;
        project: any;
        unlocked?: undefined;
        watchedCount?: undefined;
        outlineFileId?: undefined;
        outlineFileName?: undefined;
    } | {
        success: boolean;
        unlocked: boolean;
        watchedCount: number;
        outlineFileId: string;
        outlineFileName: string;
        project: any;
    } | {
        success: boolean;
        unlocked: boolean;
        watchedCount: number;
        project: {
            id: string;
            fileId: string;
            fileName: string;
            submittedAt: string;
            status: string;
            reviewNotes: string;
            reviewedBy: string;
            outlineFileId: string;
            outlineFileName: string;
        };
        outlineFileId?: undefined;
        outlineFileName?: undefined;
    }>;
    toggleFinalProjectUnlock(studentId: string, unlock: boolean, adminName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getAllFinalProjects(token: string): Promise<{
        success: boolean;
        projects: {
            id: string;
            studentId: string;
            studentName: string;
            fileId: string;
            fileName: string;
            submittedAt: string;
            status: string;
            reviewNotes: string;
            reviewedBy: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        projects?: undefined;
    }>;
    deleteGlobalOutline(token: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getApprovedFinalProjects(token: string): Promise<{
        success: boolean;
        projects: any;
    }>;
    reviewFinalProject(token: string, studentId: string, action: string, notes?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    instructorReviewTask(token: string, taskId: any, action: string, notes?: string): Promise<any>;
    submitSuccessStory(token: string, title: string, content: string, imageBase64?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getSuccessStories(token: string): Promise<{
        success: boolean;
        stories: {
            id: string;
            authorId: string;
            authorName: string;
            authorRole: string;
            title: string;
            content: string;
            imageUrl: string;
            approved: boolean;
            likesCount: number;
            reactionCounts: Record<string, number>;
            myReaction: string;
            createdAt: string;
        }[];
    }>;
    approveSuccessStory(token: string, storyId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    editAndApproveStory(token: string, storyId: any, title: string, content: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    deleteSuccessStory(token: string, storyId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getInstructorsList(token: string): Promise<{
        success: boolean;
        list: {
            id: string;
            name: string;
            legacyId: string;
        }[];
    }>;
    getBsaOrientations(token: string): Promise<{
        success: boolean;
        orientations: BsaOrientation[];
        referenceProjects: BsaOrientation[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        orientations: any[];
        referenceProjects: any[];
    }>;
    addBsaOrientation(token: string, title: string, fileBase64: string, fileName: string, type: string, instructorTag: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteBsaOrientation(token: string, id: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getBSAShowcaseProjects(token: string): Promise<{
        success: boolean;
        projects: {
            id: string;
            title: string;
            description: string;
            imageUrl: string;
            projectUrl: string;
            tags: string;
            visible: boolean;
            addedBy: string;
        }[];
    }>;
    addBSAShowcaseProject(token: string, title: string, description: string, pdfBase64: string, pdfName: string, tags: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteBSAShowcaseProject(token: string, projectId: any): Promise<{
        success: boolean;
        message: any;
    }>;
    toggleBSAShowcaseProject(token: string, projectId: any, visible: boolean): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    saveShowcaseSettings(adminToken: string, enabled: boolean, minLectures: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getMyInstructorRounds(token: string): Promise<{
        success: boolean;
        rounds: {
            id: string;
            name: string;
            type: string;
            status: string;
            startDate: string;
            enrolled: number;
            totalLectures: number;
            deliveredLectures: number;
            pay1Lec: number;
            pay2Lec: number;
            expectedPay1: string;
            expectedPay2: string;
        }[];
    }>;
    getMyInstructorSalaryCards(token: string): Promise<{
        success: boolean;
        cards: any[];
        summary: {};
    } | {
        success: boolean;
        cards: {
            id: string;
            roundName: string;
            roundType: string;
            roundStartDate: string;
            createdAt: string;
            pay1Amount: string;
            pay1Status: string;
            pay1Date: string;
            pay2Amount: string;
            pay2Status: string;
            pay2Date: string;
            expectedPay1: string;
            expectedPay2: string;
            notes: string;
        }[];
        summary: {
            totalRounds: number;
            totalAmount: number;
            totalPaid: number;
            totalRemaining: number;
        };
    }>;
    addCourse(courseName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteCourse(courseName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    addOffer(offerName: string, expiresAt?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteOffer(offerName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getAcademyInstructors(): Promise<{
        instructors: {
            id: string;
            name: string;
            username: string;
            password: string;
            active: boolean;
            createdAt: string;
            isBSA: boolean;
            phone: string;
        }[];
    }>;
    private findInstructorByAnyId;
    addAcademyInstructor(name: string, username: string, password: string, isBSA?: boolean, phone?: string): Promise<{
        success: boolean;
        message: string;
        id: string;
        username: string;
    } | {
        success: boolean;
        message: any;
        id?: undefined;
        username?: undefined;
    }>;
    updateAcademyInstructor(id: any, name?: string, username?: string, phone?: string, newPassword?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteAcademyInstructor(instructorId: any): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    toggleAcademyInstructor(instructorId: any, active: boolean): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    adminTransferLead(clientNumber: any, newAgentName: string, adminId: string, adminName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    addClientHistoryComment(clientNumber: any, comment: string, agentId: string, agentName: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateClientBookingStatus(payId: string, newStatus: string, targetRoundId?: string, expectedLastModified?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    updateRoundEnrolledCount(roundId: string): Promise<void>;
    confirmInstallmentWithWallet(payId: any, amount: any, userId: string, agentName: string, walletName: string, newDueDate?: string): Promise<any>;
    rejectInstallmentReceipt(userId: string, payId: any, reason?: string): Promise<{
        success: boolean;
        message: any;
    }>;
    repairFinancialPaymentRowsCarryover(): Promise<{
        success: boolean;
        fixed: number;
        message: string;
    }>;
    private nextOcCode;
    private nextFreeOcCode;
    private assignOcEverywhere;
    private resolveOrMintOc;
    private triggerCelebrationSafe;
    private sendInvoiceEmail;
    emailInvoicePng(invoiceId: string, clientName: string, toEmail: string, pngBase64: string, pdfBase64?: string, pdfName?: string): Promise<{
        success: boolean;
        message: string;
        messageId: any;
    } | {
        success: boolean;
        message: any;
        messageId?: undefined;
    }>;
    private logInvoiceEmail;
    private buildInvoiceHtml;
    createDirectInvoiceFull(clientId: any, clientName: string, clientPhone: string, course: string, price: any, paid: any, remaining: any, method: string, offer: string, attendanceDate: string, nameEn: string, agentId: string, agentName: string, agentEmail: string, bookingType: string, roundId: any, roundName: string, nextDueDate: string, clientType: string, finAction: string, isFree?: boolean): Promise<any>;
    updateUserField(userId: string, field: string, value: any): Promise<{
        success: boolean;
        message: any;
    }>;
    login(username: string, password: string): Promise<{
        success: boolean;
        message: string;
        user?: undefined;
    } | {
        success: boolean;
        user: {
            id: string;
            name: string;
            username: string;
            role: string;
            pages: string[];
            agentKey: string;
            email: string;
        };
        message?: undefined;
    }>;
    validateSession(userId: string): Promise<{
        success: boolean;
        user: {
            id: string;
            name: string;
            username: string;
            role: string;
            pages: string[];
            agentKey: string;
            email: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        user?: undefined;
    }>;
    private findUser;
    getServerDate(): string;
    getDashboardData(agentId: string): Promise<{
        kpis: {
            calls: number;
            won: number;
            rate: number;
            fuCount: number;
            waitingCount: number;
            dist: {
                won: number;
                fu: number;
                na: number;
                lost: number;
                delayed: number;
                waiting: number;
                reservation: number;
                notInterested: number;
                wrongNumber: number;
                rec: number;
            };
        };
        fuData: {
            due: {
                id: string;
                name: string;
                course: string;
                agentName: string;
                overdue: boolean;
                daysText: string;
            }[];
            upcoming: any[];
        };
        tasks: {
            id: string;
            note: string;
            status: string;
            time: string;
        }[];
        team: any[];
        notifications: {
            id: string;
            type: string;
            message: string;
            refId: string;
            createdAt: string;
        }[];
    } | {
        kpis: {};
        fuData: {
            due: any[];
            upcoming: any[];
        };
        tasks: any[];
        team: any[];
        notifications: any[];
    }>;
    getClientByPhone(phone: string): Promise<{
        success: boolean;
        message: string;
        client?: undefined;
    } | {
        success: boolean;
        client: {
            id: string;
            name: string;
            phone: string;
            course: string;
            agent: string;
            agentId: string;
            status: string;
            lastAction: string;
            ocCode: string;
            campaignType: string;
            source: string;
            notes: string[];
        };
        message?: undefined;
    }>;
    getSupportRequests(agentId: string): Promise<{
        success: boolean;
        items: {
            id: string;
            agentId: string;
            agentName: string;
            clientName: string;
            clientPhone: string;
            clientOC: string;
            comment: string;
            status: string;
            managerResult: string;
            createdAt: string;
            resolvedAt: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        items: any[];
    }>;
    addSupportRequest(agentId: string, agentName: string, clientName: string, clientPhone: string, clientOC: string, comment: string): Promise<{
        success: boolean;
        message: any;
    }>;
    resolveSupportRequest(id: string, txt: string, adminId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    markNotificationRead(token: string, id: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getExceptionRequests(agentId: string, filters?: {
        employeeId?: string;
        month?: string;
        showAll?: boolean;
    }): Promise<{
        success: boolean;
        items: {
            id: string;
            agentId: string;
            agentName: string;
            clientName: string;
            clientPhone: string;
            clientOC: string;
            type: string;
            details: string;
            status: string;
            deadline: string;
            deadlineTs: number;
            adminNote: string;
            createdAt: string;
            seq: number;
            totalForClient: number;
            history: {
                course: string;
                status: string;
                action: string;
                agent: string;
                notes: string;
            };
        }[];
        elevated: boolean;
        quota: {
            monthlyLimit: number;
            monthlyUsed: number;
            monthlyRemaining: number;
            weeklyLimit: number;
            weeklyUsed: number;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        items: any[];
        elevated?: undefined;
        quota?: undefined;
    }>;
    addExceptionRequest(agentId: string, agentName: string, clientName: string, clientPhone: string, clientOC: string, type: string, details: string): Promise<{
        success: boolean;
        message: string;
        weekWarning: string;
        quota: {
            monthlyLimit: number;
            monthlyUsed: number;
            monthlyRemaining: number;
            weeklyLimit: number;
            weeklyUsed: number;
        };
    } | {
        success: boolean;
        message: any;
        weekWarning?: undefined;
        quota?: undefined;
    }>;
    decideExceptionRequest(id: string, decision: string, deadline: string, note: string, adminId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    cancelExceptionRequest(id: string, agentId: string): Promise<{
        success: boolean;
        message: any;
    }>;
    completeTask(id: string): Promise<boolean>;
    deleteTask(id: string): Promise<boolean>;
    toggleUserActive(id: string, active: boolean): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    resetPassword(id: string, p: string): Promise<{
        success: boolean;
        message: any;
    }>;
    verifyAccountingPin(userId: string, pin: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
    }>;
    changeAccountingPin(userId: string, currentPin: string, newPin: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    getWaitingClients(agentId?: string, agentName?: string, isManagerVal?: boolean | string): Promise<any[]>;
    getDueFollowUps(agentId: string): Promise<{
        due: any[];
        upcoming: any[];
    }>;
    getMyLeads(agentId: string, agentName: string, role: string): Promise<{
        id: string;
        name: string;
        phone: string;
        course: string;
        agent: string;
        status: string;
        lastAction: string;
        notes: string[];
        fuDate: string;
        createdAt: string;
        _sortTs: number;
    }[]>;
    getRounds(): Promise<{
        id: string;
        name: string;
        startDate: string;
        schedule: string;
        maxSeats: number;
        enrolled: number;
        status: string;
        type: string;
        instructor: string;
        offerPrice: number;
        offerExpiry: string;
    }[]>;
    getUsers(): Promise<{
        id: string;
        name: string;
        username: string;
        role: string;
        active: boolean;
        pages: string[];
        agentKey: string;
        email: string;
    }[]>;
    getClientPayments(agentId: string, isManager: boolean): Promise<{
        id: string;
        clientId: string;
        clientName: string;
        phone: string;
        ocCode: string;
        course: string;
        roundId: string;
        roundName: string;
        total: number;
        agentId: string;
        agentName: string;
        paid: number;
        remaining: number;
        nextDue: string;
        status: string;
        notes: string;
        createdAt: string;
        inst1: number;
        inst2: number;
        inst3: number;
        pymts: number[];
        installPaid: number;
        lastModified: string;
    }[]>;
    getCourses(): Promise<{
        id: string;
        name: string;
    }[]>;
    getOffers(): Promise<{
        id: string;
        name: string;
    }[]>;
    getInstructorList(): Promise<any[]>;
    getClientById(clientId: string): Promise<{
        success: boolean;
        message: string;
        client?: undefined;
    } | {
        success: boolean;
        client: {
            id: string;
            rowIndex: number;
            name: string;
            phone: string;
            course: string;
            agent: string;
            status: string;
            lastAction: string;
            ocCode: string;
            source: string;
            campaign: string;
            notes: string[];
            lastNote: string;
            isFree: boolean;
            lastModified: string;
        };
        message?: undefined;
    }>;
    updateLeadWithFollowUp(clientId: string, action: string, comment: string, fuDate: string, agentId: string, agentName: string, roundId: string, roundName: string, price: string, paid: string, method: string, phone1: string, phone2: string, inst1: number, inst2: number, inst3: number, offer: string, newClientName: string, inst1Date: string, inst2Date: string, inst3Date: string, clientType: string, finAction: string, expectedLastModified: string): Promise<{
        success: boolean;
        message: string;
    }>;
    searchHistoryFast(phoneNumber: string, agentId: string, agentName: string): Promise<{
        found: boolean;
        message: string;
        results?: undefined;
    } | {
        found: boolean;
        results: {
            id: string;
            rowIndex: number;
            name: string;
            phone: string;
            course: string;
            agent: string;
            status: string;
            lastAction: string;
            ocCode: string;
            source: string;
            campaign: string;
            notes: string[];
            lastNote: string;
            isFree: boolean;
        }[];
        message?: undefined;
    }>;
    getRoundDetail(roundId: string): Promise<any>;
    getFinancialData(agentId: string, agentName: string, monthVal: string | number, yearVal: string | number, isManagerVal: boolean | string): Promise<{
        clients: any[];
        payments: any[];
        salesTargets?: undefined;
        defaultTarget?: undefined;
    } | {
        clients: any[];
        payments: any[];
        salesTargets: string;
        defaultTarget: string;
    }>;
    private normalizeArabicName;
    getInstructorStats(token: string): Promise<{
        success: boolean;
        message: string;
        totalLectures?: undefined;
        totalStudents?: undefined;
        avgCompletion?: undefined;
        avgSurveyRating?: undefined;
        taskStats?: undefined;
        students?: undefined;
        allRounds?: undefined;
    } | {
        success: boolean;
        totalLectures: number;
        totalStudents: number;
        avgCompletion: number;
        avgSurveyRating: string;
        taskStats: {
            pending: number;
            approved: number;
        };
        students: any[];
        allRounds: {
            id: string;
            name: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        students: any[];
        allRounds: any[];
        totalLectures?: undefined;
        totalStudents?: undefined;
        avgCompletion?: undefined;
        avgSurveyRating?: undefined;
        taskStats?: undefined;
    }>;
    getBSAStudentStats(token: string): Promise<{
        success: boolean;
        message: string;
        totalLectures?: undefined;
        totalStudents?: undefined;
        avgCompletion?: undefined;
        avgSurveyRating?: undefined;
        taskStats?: undefined;
        students?: undefined;
        allRounds?: undefined;
    } | {
        success: boolean;
        totalLectures: number;
        totalStudents: number;
        avgCompletion: number;
        avgSurveyRating: string;
        taskStats: {
            pending: number;
            approved: number;
        };
        students: any[];
        allRounds: {
            id: string;
            name: string;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        students: any[];
        allRounds: any[];
        totalLectures?: undefined;
        totalStudents?: undefined;
        avgCompletion?: undefined;
        avgSurveyRating?: undefined;
        taskStats?: undefined;
    }>;
    getInstructorPendingTasks(token: string): Promise<{
        success: boolean;
        tasks: {
            id: string;
            studentName: string;
            lectureName: string;
            fileName: string;
            driveFileId: string;
            submittedAt: string;
            status: string;
            reviewedBy: string;
            reviewNotes: string;
            instructorStatus: string;
            instructorNotes: string;
        }[];
    }>;
    getInstructorAllTasks(token: string): Promise<{
        success: boolean;
        tasks: {
            id: string;
            studentName: string;
            lectureName: string;
            fileName: string;
            driveFileId: string;
            submittedAt: string;
            status: string;
            reviewedBy: string;
            reviewNotes: string;
            instructorStatus: string;
            instructorNotes: string;
        }[];
    }>;
    getInstructorSurveyResponses(token: string): Promise<{
        success: boolean;
        responses: {
            roundName: string;
            id: number;
            studentId: string;
            student: Student;
            studentName: string;
            roundId: string;
            lectureId: string;
            lectureNum: number;
            lectureName: string;
            answers: string;
            isPublished: boolean;
            createdAt: Date;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        responses: any[];
    }>;
    private getInstructorTasksFiltered;
    getSurveyQuestions(): Promise<{
        success: boolean;
        questions: any;
        headerMessage: string;
    }>;
    checkSurveySubmitted(token: string, roundId: string, lectureId: string): Promise<{
        success: boolean;
        submitted: boolean;
    }>;
    saveSurveyQuestions(token: string, questionsJson: string, headerMessage?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    submitSurveyResponse(token: string, roundId: string, lectureId: string, answersJson: string): Promise<{
        success: boolean;
        message: any;
    }>;
    getSurveyResponses(token: string): Promise<{
        success: boolean;
        responses: {
            roundName: string;
            id: number;
            studentId: string;
            student: Student;
            studentName: string;
            roundId: string;
            lectureId: string;
            lectureNum: number;
            lectureName: string;
            answers: string;
            isPublished: boolean;
            createdAt: Date;
        }[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        responses?: undefined;
    }>;
    publishSurveyResponse(token: string, responseId: number, isPublished: boolean): Promise<{
        success: boolean;
        message: any;
    }>;
    editSurveyResponse(token: string, responseId: number, answersJson: string): Promise<{
        success: boolean;
        message: any;
    }>;
    deleteSurveyResponse(token: string, responseId: number): Promise<{
        success: boolean;
        message: any;
    }>;
    updateLedgerInvoice(token: string, ocCode: string, payload: any): Promise<{
        success: boolean;
        message: string;
        html?: undefined;
    } | {
        success: boolean;
        message: string;
        html: string;
    }>;
    getInvoicePrintHtml(token: string, ocCode: string, nameEn?: string, offer?: string, attendanceDate?: string): Promise<{
        success: boolean;
        html: string;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        html?: undefined;
    }>;
    healAndSyncAllClients(): Promise<{
        success: boolean;
        message: any;
    }>;
}
