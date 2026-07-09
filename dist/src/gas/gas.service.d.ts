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
export declare class GasService {
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
    constructor(userRepository: Repository<User>, myLeadRepository: Repository<MyLead>, rawLeadRepository: Repository<RawLead>, callLogRepository: Repository<LeadCallLog>, supportRepository: Repository<SupportRequest>, exceptionRepository: Repository<ExceptionRequest>, taskRepository: Repository<Task>, roundRepository: Repository<Round>, ledgerRepository: Repository<AcademyLedger>, courseRepository: Repository<Course>, offerRepository: Repository<Offer>, clientPaymentRepository: Repository<ClientPayment>, instructorRepository: Repository<Instructor>, roundMemberRepository: Repository<RoundMember>, financialDataRepository: Repository<FinancialData>, transactionRepository: Repository<PaymentTransaction>);
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
    } | {
        kpis: {};
        fuData: {
            due: any[];
            upcoming: any[];
        };
        tasks: any[];
        team: any[];
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
    getExceptionRequests(agentId: string): Promise<{
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
            adminNote: string;
            createdAt: string;
        }[];
        elevated: boolean;
        quota: {
            monthlyLimit: number;
            monthlyUsed: number;
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
    verifyAccountingPin(userId: string, pin: string): {
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
    };
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
    }[]>;
    getUsers(): Promise<{
        id: string;
        name: string;
        username: string;
        role: string;
        active: boolean;
        pages: string[];
        agentKey: string;
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
        pymts: any[];
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
    getInstructorList(): Promise<{
        id: string;
        name: string;
        username: string;
        active: boolean;
    }[]>;
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
}
