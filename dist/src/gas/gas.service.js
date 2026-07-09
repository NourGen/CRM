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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../sales/entities/user.entity");
const my_lead_entity_1 = require("../sales/entities/my-lead.entity");
const raw_lead_entity_1 = require("../sales/entities/raw-lead.entity");
const lead_call_log_entity_1 = require("../sales/entities/lead-call-log.entity");
const support_request_entity_1 = require("../sales/entities/support-request.entity");
const exception_request_entity_1 = require("../sales/entities/exception-request.entity");
const task_entity_1 = require("../sales/entities/task.entity");
const round_entity_1 = require("../academy/entities/round.entity");
const academy_ledger_entity_1 = require("../financial/entities/academy-ledger.entity");
const course_entity_1 = require("../financial/entities/course.entity");
const offer_entity_1 = require("../financial/entities/offer.entity");
const client_payment_entity_1 = require("../financial/entities/client-payment.entity");
const instructor_entity_1 = require("../academy/entities/instructor.entity");
const round_member_entity_1 = require("../academy/entities/round-member.entity");
const financial_data_entity_1 = require("../financial/entities/financial-data.entity");
const payment_transaction_entity_1 = require("../financial/entities/payment-transaction.entity");
const bcrypt = __importStar(require("bcrypt"));
let GasService = class GasService {
    userRepository;
    myLeadRepository;
    rawLeadRepository;
    callLogRepository;
    supportRepository;
    exceptionRepository;
    taskRepository;
    roundRepository;
    ledgerRepository;
    courseRepository;
    offerRepository;
    clientPaymentRepository;
    instructorRepository;
    roundMemberRepository;
    financialDataRepository;
    transactionRepository;
    constructor(userRepository, myLeadRepository, rawLeadRepository, callLogRepository, supportRepository, exceptionRepository, taskRepository, roundRepository, ledgerRepository, courseRepository, offerRepository, clientPaymentRepository, instructorRepository, roundMemberRepository, financialDataRepository, transactionRepository) {
        this.userRepository = userRepository;
        this.myLeadRepository = myLeadRepository;
        this.rawLeadRepository = rawLeadRepository;
        this.callLogRepository = callLogRepository;
        this.supportRepository = supportRepository;
        this.exceptionRepository = exceptionRepository;
        this.taskRepository = taskRepository;
        this.roundRepository = roundRepository;
        this.ledgerRepository = ledgerRepository;
        this.courseRepository = courseRepository;
        this.offerRepository = offerRepository;
        this.clientPaymentRepository = clientPaymentRepository;
        this.instructorRepository = instructorRepository;
        this.roundMemberRepository = roundMemberRepository;
        this.financialDataRepository = financialDataRepository;
        this.transactionRepository = transactionRepository;
    }
    async login(username, password) {
        try {
            const user = await this.userRepository.findOne({ where: { username: username.trim() } });
            if (!user) {
                return { success: false, message: "❌ اسم المستخدم أو كلمة المرور غلط" };
            }
            const passMatch = await bcrypt.compare(password.trim(), user.password);
            if (!passMatch && password.trim() !== user.password) {
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
                },
            };
        }
        catch (e) {
            return { success: false, message: 'خطأ في السيستم: ' + e.message };
        }
    }
    async validateSession(userId) {
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
                },
            };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async findUser(agentId) {
        if (!agentId)
            return null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);
        return this.userRepository.findOne({
            where: isUuid ? [{ id: agentId }, { legacyId: agentId }] : { legacyId: agentId },
        });
    }
    getServerDate() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    async getDashboardData(agentId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const user = await this.findUser(agentId);
            const isAdmin = user && (user.role === 'Manager' || user.role === 'Admin');
            const leads = await this.myLeadRepository.find({
                relations: { agent: true },
            });
            let calls = 0, won = 0, lost = 0, fu = 0, na = 0, delayed = 0, waiting = 0, reservation = 0, notInterested = 0, wrongNumber = 0, rec = 0;
            const filteredLeads = isAdmin ? leads : leads.filter(l => l.agent && (l.agent.id === agentId || l.agent.legacyId === agentId));
            filteredLeads.forEach(l => {
                const status = (l.status || '').toLowerCase().trim();
                if (status.includes('won recommendation') || status.includes('recommendation'))
                    rec++;
                else if (status === 'closed won')
                    won++;
                else if (status.includes('reservation'))
                    reservation++;
                else if (status.includes('need follow up') || status.includes('follow up'))
                    fu++;
                else if (status.includes('no answer'))
                    na++;
                else if (status.includes('waiting client') || status.includes('waiting'))
                    waiting++;
                else if (status.includes('delayed'))
                    delayed++;
                else if (status.includes('closed lost'))
                    lost++;
                else if (status.includes('not interested'))
                    notInterested++;
                else if (status.includes('wrong number'))
                    wrongNumber++;
            });
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
            const rate = (won + rec + reservation) > 0 ? Math.round(((won + rec + reservation) / (filteredLeads.length || 1)) * 100) : 0;
            const kpis = {
                calls,
                won: won + rec,
                rate,
                dist: {
                    won, fu, na, lost, delayed, waiting, reservation, notInterested, wrongNumber, rec
                }
            };
            const dueLeads = filteredLeads.filter(l => l.followUpDate && new Date(l.followUpDate).getTime() <= new Date().getTime());
            const fuData = {
                due: dueLeads.map(l => ({
                    id: l.id,
                    name: l.name,
                    course: l.course,
                    agentName: l.agent ? l.agent.name : '-',
                    overdue: l.followUpDate ? new Date(l.followUpDate).getTime() < today.getTime() : false,
                    daysText: 'مستحق اليوم',
                })),
                upcoming: [],
            };
            const tasks = await this.taskRepository.find({
                where: { status: 'Pending' }
            });
            const filteredTasks = tasks.map(t => ({
                id: t.id,
                note: t.note,
                status: t.status,
                time: t.time ? t.time.toISOString() : null,
            }));
            const team = [];
            if (isAdmin) {
                const users = await this.userRepository.find({ where: { role: 'Sales' } });
                for (const u of users) {
                    const uLeads = leads.filter(l => l.agent && l.agent.id === u.id);
                    const uWon = uLeads.filter(l => (l.status || '').toLowerCase() === 'closed won').length;
                    team.push({
                        name: u.name,
                        calls: 10,
                        won: uWon,
                        rate: uLeads.length > 0 ? Math.round((uWon / uLeads.length) * 100) : 0,
                    });
                }
            }
            return { kpis, fuData, tasks: filteredTasks, team };
        }
        catch (e) {
            return { kpis: {}, fuData: { due: [], upcoming: [] }, tasks: [], team: [] };
        }
    }
    async getClientByPhone(phone) {
        try {
            const cleanPhone = phone.trim();
            if (!cleanPhone)
                return { success: false, message: 'أدخل رقم هاتف صحيح' };
            const lead = await this.myLeadRepository.findOne({
                where: { phone: cleanPhone },
                relations: { agent: true, callLogs: true },
            });
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
                        id: lead.legacyId || lead.id,
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
                        id: rawLead.legacyId || rawLead.id,
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
        }
        catch (e) {
            return { success: false, message: 'خطأ: ' + e.message };
        }
    }
    async getSupportRequests(agentId) {
        try {
            const list = await this.supportRepository.find({ relations: { agent: true } });
            const items = list.map(req => ({
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
        }
        catch (e) {
            return { success: false, message: e.message, items: [] };
        }
    }
    async addSupportRequest(agentId, agentName, clientName, clientPhone, clientOC, comment) {
        try {
            if (!comment)
                return { success: false, message: 'اكتب الكومنت المطلوب من المدير' };
            if (!clientName && !clientPhone)
                return { success: false, message: 'حدّد العميل (اسم أو رقم موبايل)' };
            const user = await this.findUser(agentId);
            const req = new support_request_entity_1.SupportRequest();
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
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async resolveSupportRequest(id, txt, adminId) {
        try {
            const req = await this.supportRepository.findOne({ where: { id } });
            if (!req)
                return { success: false, message: 'الطلب غير موجود' };
            req.status = 'Resolved';
            req.managerResult = txt;
            req.resolvedAt = new Date();
            await this.supportRepository.save(req);
            return { success: true, message: 'تم حل الطلب بنجاح' };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async getExceptionRequests(agentId) {
        try {
            const list = await this.exceptionRepository.find({ relations: { agent: true } });
            const items = list.map(req => ({
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
                adminNote: req.adminNote,
                createdAt: req.createdAt ? req.createdAt.toISOString() : '',
            }));
            items.reverse();
            return { success: true, items, elevated: true, quota: { monthlyLimit: 10, monthlyUsed: 1, weeklyLimit: 3, weeklyUsed: 0 } };
        }
        catch (e) {
            return { success: false, message: e.message, items: [] };
        }
    }
    async addExceptionRequest(agentId, agentName, clientName, clientPhone, clientOC, type, details) {
        try {
            if (!type)
                return { success: false, message: 'حدّد نوع الاستثناء' };
            if (!clientName && !clientPhone)
                return { success: false, message: 'حدّد العميل (اسم أو رقم موبايل)' };
            const user = await this.findUser(agentId);
            const req = new exception_request_entity_1.ExceptionRequest();
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
            return { success: true, message: 'تم إرسال طلب الاستثناء ✅', weekWarning: '', quota: { monthlyLimit: 10, monthlyUsed: 2, weeklyLimit: 3, weeklyUsed: 1 } };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async decideExceptionRequest(id, decision, deadline, note, adminId) {
        try {
            const req = await this.exceptionRepository.findOne({ where: { id } });
            if (!req)
                return { success: false, message: 'الطلب غير موجود' };
            if (decision === 'approve') {
                req.status = 'Approved';
                req.deadline = deadline ? new Date(deadline) : null;
            }
            else {
                req.status = 'Rejected';
            }
            req.adminNote = note;
            req.decidedAt = new Date();
            await this.exceptionRepository.save(req);
            return { success: true, message: decision === 'approve' ? 'تمت الموافقة ✅' : 'تم الرفض' };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async cancelExceptionRequest(id, agentId) {
        try {
            const req = await this.exceptionRepository.findOne({ where: { id } });
            if (!req)
                return { success: false, message: 'الطلب غير موجود' };
            req.status = 'Cancelled';
            req.resolvedAt = new Date();
            await this.exceptionRepository.save(req);
            return { success: true, message: 'تم إلغاء الاستثناء' };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async completeTask(id) {
        try {
            const task = await this.taskRepository.findOne({ where: { id } });
            if (task) {
                task.status = 'Completed';
                await this.taskRepository.save(task);
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async deleteTask(id) {
        try {
            await this.taskRepository.delete(id);
            return true;
        }
        catch {
            return false;
        }
    }
    async toggleUserActive(id, active) {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (user) {
                user.active = active;
                await this.userRepository.save(user);
                return { success: true };
            }
            return { success: false, message: 'المستخدم غير موجود' };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async deleteUser(id) {
        try {
            await this.userRepository.delete(id);
            return { success: true };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    async resetPassword(id, p) {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (user) {
                user.password = await bcrypt.hash(p.trim(), 10);
                await this.userRepository.save(user);
                return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
            }
            return { success: false, message: 'المستخدم غير موجود' };
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }
    verifyAccountingPin(userId, pin) {
        const defaultPin = '142536';
        if (pin.trim() === defaultPin) {
            return { success: true };
        }
        return { success: false, message: 'الرقم السري غلط ❌' };
    }
    async getWaitingClients(agentId, agentName, isManagerVal) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let isMgr = false;
            if (typeof isManagerVal === 'boolean') {
                isMgr = isManagerVal;
            }
            else if (typeof isManagerVal === 'string') {
                const cleanRole = isManagerVal.toLowerCase().trim();
                isMgr = cleanRole === 'manager' || cleanRole === 'admin' || cleanRole === 'operation';
            }
            if (!isMgr && agentId) {
                const user = await this.findUser(agentId);
                isMgr = user && (user.role === 'Manager' || user.role === 'Admin');
            }
            const roundMembers = await this.roundMemberRepository.find();
            const payments = await this.clientPaymentRepository.find();
            const enrolledIds = new Set();
            roundMembers.forEach(rm => {
                if (rm.ocCode)
                    enrolledIds.add(rm.ocCode.trim().toLowerCase());
            });
            payments.forEach(p => {
                if (p.isDeleted)
                    return;
                const cpRoundId = p.roundLegacyId || '';
                const cpOc = p.legacyId || '';
                if (cpRoundId && cpRoundId.toLowerCase() !== 'wait' && cpOc) {
                    enrolledIds.add(cpOc.trim().toLowerCase());
                }
            });
            const leads = await this.myLeadRepository.find({
                relations: { agent: true },
            });
            const filteredLeads = isMgr
                ? leads
                : leads.filter(l => l.agent && (l.agent.id === agentId || l.agent.legacyId === agentId));
            const waiting = [];
            for (const l of filteredLeads) {
                const lastAction = l.status || '';
                if (!lastAction.toLowerCase().includes('waiting'))
                    continue;
                const clientId = l.legacyId || l.id;
                if (enrolledIds.has(clientId.trim().toLowerCase()))
                    continue;
                let diff = null;
                let overdue = false;
                let daysText = 'بدون تاريخ';
                let fuDateStr = '';
                if (l.followUpDate) {
                    const fuDay = new Date(l.followUpDate);
                    fuDay.setHours(0, 0, 0, 0);
                    diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);
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
                    lastAction: lastAction,
                    notes: l.action || '',
                    createdAt: l.date ? l.date.toISOString().split('T')[0] : '',
                    fuDate: fuDateStr,
                    diffDays: diff,
                    overdue: overdue,
                    daysText: daysText,
                });
            }
            return waiting;
        }
        catch (e) {
            console.error('Error in getWaitingClients:', e);
            return [];
        }
    }
    async getDueFollowUps(agentId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const user = await this.findUser(agentId);
            const isAdmin = user && (user.role === 'Manager' || user.role === 'Admin');
            const leads = await this.myLeadRepository.find({
                relations: { agent: true },
            });
            const filteredLeads = isAdmin
                ? leads
                : leads.filter(l => l.agent && (l.agent.id === agentId || l.agent.legacyId === agentId));
            const due = [];
            const upcoming = [];
            const fuActions = ["follow up", "need follow", "delayed"];
            filteredLeads.forEach(l => {
                const act = (l.status || "").toLowerCase().trim();
                const isFu = fuActions.some(x => act.includes(x));
                if (!isFu)
                    return;
                const fuRaw = l.followUpDate;
                if (!fuRaw)
                    return;
                const fuDay = new Date(fuRaw);
                fuDay.setHours(0, 0, 0, 0);
                const diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);
                const hours = fuRaw.getHours();
                const minutes = fuRaw.getMinutes();
                const fuTime = (hours !== 0 || minutes !== 0)
                    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    : '';
                const item = {
                    name: l.name || '',
                    phone: l.phone || '',
                    course: l.course || '',
                    id: l.legacyId || l.id,
                    diffDays: diff,
                    overdue: diff < 0,
                    fuTime: fuTime,
                    daysText: diff === 0 ? (fuTime ? "اليوم " + fuTime : "اليوم") : diff < 0 ? "متأخر " + Math.abs(diff) + " يوم" : "بعد " + diff + " يوم",
                    agentName: l.agent ? l.agent.name : '—',
                };
                if (diff <= 0)
                    due.push(item);
                else if (diff <= 3)
                    upcoming.push(item);
            });
            return { due, upcoming };
        }
        catch {
            return { due: [], upcoming: [] };
        }
    }
    async getMyLeads(agentId, agentName, role) {
        try {
            const isMgr = role && ['manager', 'admin', 'operation'].includes(role.toLowerCase().trim());
            const leads = await this.myLeadRepository.find({
                relations: { agent: true },
            });
            const filteredLeads = isMgr
                ? leads
                : leads.filter(l => l.agent && (l.agent.id === agentId || l.agent.legacyId === agentId));
            const result = filteredLeads.map(l => {
                const createdAtDate = l.date ? new Date(l.date) : null;
                const createdAtStr = createdAtDate ? `${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(createdAtDate.getDate()).padStart(2, '0')}` : '';
                const fuDateDate = l.followUpDate ? new Date(l.followUpDate) : null;
                const fuDateStr = fuDateDate ? `${fuDateDate.getFullYear()}-${String(fuDateDate.getMonth() + 1).padStart(2, '0')}-${String(fuDateDate.getDate()).padStart(2, '0')}` : '';
                return {
                    id: l.legacyId || l.id,
                    name: l.name || '',
                    phone: l.phone || '',
                    course: l.course || '',
                    agent: l.agent ? l.agent.name : '',
                    status: l.status || '',
                    lastAction: l.status || '',
                    notes: l.action ? l.action.split('\n').filter(line => line.trim()) : [],
                    fuDate: fuDateStr,
                    createdAt: createdAtStr,
                };
            });
            result.reverse();
            return result;
        }
        catch (e) {
            return [];
        }
    }
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
                };
            });
        }
        catch {
            return [];
        }
    }
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
            }));
        }
        catch {
            return [];
        }
    }
    async getClientPayments(agentId, isManager) {
        try {
            const list = await this.clientPaymentRepository.find({
                relations: { agent: true }
            });
            const filtered = isManager ? list : list.filter(p => p.agent && (p.agent.id === agentId || p.agent.legacyId === agentId));
            return filtered.map(p => {
                const createdAtStr = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '';
                return {
                    id: p.legacyId || p.id,
                    clientId: p.clientLegacyId || '',
                    clientName: p.clientName || '',
                    phone: '',
                    ocCode: p.legacyId || '',
                    course: p.course || '',
                    roundId: p.roundLegacyId || '',
                    roundName: p.roundName || '',
                    total: p.totalAmount || 0,
                    agentId: p.agent ? p.agent.id : '',
                    agentName: p.agent ? p.agent.name : '',
                    paid: p.amountPaid || 0,
                    remaining: p.amountUnpaid || 0,
                    nextDue: '',
                    status: p.status || 'Pending',
                    notes: p.notes || '',
                    createdAt: createdAtStr,
                    inst1: p.amountDetail1 || 0,
                    inst2: p.amountDetail2 || 0,
                    inst3: p.amountDetail3 || 0,
                    pymts: [],
                    installPaid: 0,
                    lastModified: p.lastModified ? p.lastModified.toISOString() : '',
                };
            });
        }
        catch {
            return [];
        }
    }
    async getCourses() {
        try {
            const list = await this.courseRepository.find();
            return list.map(c => ({
                id: c.id,
                name: c.courseName || '',
            }));
        }
        catch {
            return [];
        }
    }
    async getOffers() {
        try {
            const list = await this.offerRepository.find();
            return list.map(o => ({
                id: o.id,
                name: o.offerName || '',
            }));
        }
        catch {
            return [];
        }
    }
    async getInstructorList() {
        try {
            const list = await this.instructorRepository.find();
            return list.map(inst => ({
                id: inst.legacyId || inst.id,
                name: inst.name || '',
                username: inst.username || '',
                active: inst.active,
            }));
        }
        catch {
            return [];
        }
    }
    async getClientById(clientId) {
        try {
            if (!clientId)
                return { success: false, message: 'العميل غير موجود' };
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
            const lead = await this.myLeadRepository.findOne({
                where: isUuid ? [{ id: clientId }, { legacyId: clientId }] : { legacyId: clientId },
                relations: { agent: true, callLogs: true },
            });
            const rawLead = await this.rawLeadRepository.findOne({
                where: isUuid ? [{ id: clientId }, { legacyId: clientId }, { ocCode: clientId }] : [{ legacyId: clientId }, { ocCode: clientId }],
                relations: { agent: true },
            });
            if (lead) {
                const notes = lead.action ? lead.action.split('\n').filter(line => line.trim()) : [];
                const finalCourse = lead.course || (rawLead ? rawLead.course : '') || '';
                const finalSource = lead.source || (rawLead ? rawLead.source : '') || '';
                const finalCampaign = lead.campaignType || (rawLead ? rawLead.campaignType : '') || '';
                const finalOc = (lead.legacyId || '').toLowerCase().startsWith('oc-') ? lead.legacyId : '';
                return {
                    success: true,
                    client: {
                        id: lead.legacyId || lead.id,
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
                        id: rawLead.legacyId || rawLead.id,
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
        }
        catch (e) {
            return { success: false, message: 'خطأ: ' + e.message };
        }
    }
    async updateLeadWithFollowUp(clientId, action, comment, fuDate, agentId, agentName, roundId, roundName, price, paid, method, phone1, phone2, inst1, inst2, inst3, offer, newClientName, inst1Date, inst2Date, inst3Date, clientType, finAction, expectedLastModified) {
        try {
            if (!clientId) {
                return { success: false, message: 'لم يتم تحديد كود العميل!' };
            }
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
            let lead = await this.myLeadRepository.findOne({
                where: isUuid ? [{ id: clientId }, { legacyId: clientId }] : { legacyId: clientId },
                relations: { agent: true, callLogs: true },
            });
            let rawLead = await this.rawLeadRepository.findOne({
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
                if (phone2)
                    combinedPhone += ' - ' + phone2.trim();
            }
            const targetName = newClientName ? newClientName.trim() : '';
            if (lead) {
                if (targetName)
                    lead.name = targetName;
                if (combinedPhone)
                    lead.phone = combinedPhone;
                lead.status = actionBase;
                lead.action = actionBase;
                lead.followUpDate = fuDate ? new Date(fuDate) : null;
                lead.legacyNotes = lead.legacyNotes ? `${lead.legacyNotes}\n[${new Date().toISOString()}] ${comment}` : comment;
                await this.myLeadRepository.save(lead);
                const log = new lead_call_log_entity_1.LeadCallLog();
                log.lead = lead;
                log.agentName = agentName;
                log.status = actionBase;
                log.note = comment + (lostReasonLabel ? ` [سبب: ${lostReasonLabel}]` : '');
                log.timestamp = new Date();
                await this.callLogRepository.save(log);
            }
            if (rawLead) {
                if (targetName)
                    rawLead.name = targetName;
                if (combinedPhone)
                    rawLead.phone = combinedPhone;
                rawLead.status = 'Contacted';
                rawLead.action = actionBase;
                rawLead.followUpDate = fuDate ? new Date(fuDate) : null;
                await this.rawLeadRepository.save(rawLead);
            }
            const wonActions = ["Closed Won", "Closed Won Recommendation", "Reservation"];
            if (wonActions.includes(actionBase)) {
                const clientName = targetName || (lead ? lead.name : '') || (rawLead ? rawLead.name : '');
                const ocCode = (lead ? lead.legacyId : '') || (rawLead ? rawLead.ocCode : '') || clientId;
                let payment = await this.clientPaymentRepository.findOne({
                    where: [{ legacyId: ocCode }, { clientLegacyId: ocCode }]
                });
                if (!payment) {
                    payment = new client_payment_entity_1.ClientPayment();
                    payment.legacyId = ocCode;
                    payment.clientLegacyId = ocCode;
                }
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
            }
            return { success: true, message: 'تم حفظ المكالمة بنجاح ✅' };
        }
        catch (e) {
            return { success: false, message: 'خطأ: ' + e.message };
        }
    }
    async searchHistoryFast(phoneNumber, agentId, agentName) {
        try {
            if (!phoneNumber)
                return { found: false, message: 'أدخل رقم الهاتف' };
            const clean = phoneNumber.trim();
            const leads = await this.myLeadRepository.find({
                relations: { agent: true },
            });
            const rawLeads = await this.rawLeadRepository.find({
                relations: { agent: true },
            });
            const matchedLeads = leads.filter(l => l.phone && l.phone.includes(clean));
            const results = matchedLeads.map(l => {
                const notes = l.action ? l.action.split('\n').filter(line => line.trim()) : [];
                const rawL = rawLeads.find(rl => rl.phone === l.phone || rl.legacyId === l.legacyId);
                const finalCourse = l.course || (rawL ? rawL.course : '') || '';
                const finalSource = l.source || (rawL ? rawL.source : '') || '';
                const finalCampaign = l.campaignType || (rawL ? rawL.campaignType : '') || '';
                const finalOc = (l.legacyId || '').toLowerCase().startsWith('oc-') ? l.legacyId : '';
                return {
                    id: l.legacyId || l.id,
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
                if (results.some(r => r.phone === rl.phone || r.id === rl.legacyId))
                    return;
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
        }
        catch (e) {
            return { found: false, message: 'خطأ: ' + e.message };
        }
    }
    async getRoundDetail(roundId) {
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roundId);
            const round = await this.roundRepository.findOne({
                where: isUuid ? [{ id: roundId }, { legacyId: roundId }] : { legacyId: roundId },
            });
            if (!round)
                return null;
            const startDateStr = round.startDate ? new Date(round.startDate).toISOString().split('T')[0] : '';
            const detail = {
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
                where: [{ roundLegacyId: round.legacyId || round.id }],
            });
            detail.members = members.map(m => {
                let attendanceStr = '';
                if (m.attendance) {
                    try {
                        attendanceStr = new Date(m.attendance).toISOString().split('T')[0];
                    }
                    catch {
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
        }
        catch (e) {
            console.error('Error in getRoundDetail:', e);
            return null;
        }
    }
    async getFinancialData(agentId, agentName, monthVal, yearVal, isManagerVal) {
        try {
            const month = parseInt(monthVal.toString());
            const year = parseInt(yearVal.toString());
            if (isNaN(month) || isNaN(year))
                return { clients: [], payments: [] };
            let isMgr = false;
            if (typeof isManagerVal === 'boolean') {
                isMgr = isManagerVal;
            }
            else if (typeof isManagerVal === 'string') {
                const cleanRole = isManagerVal.toLowerCase().trim();
                isMgr = cleanRole === 'manager' || cleanRole === 'admin' || cleanRole === 'operation';
            }
            if (!isMgr && agentId) {
                const user = await this.findUser(agentId);
                isMgr = user && (user.role === 'Manager' || user.role === 'Admin');
            }
            const finDataList = await this.financialDataRepository.find({
                relations: { agent: true },
            });
            const filteredFin = finDataList.filter(row => {
                let matchesAgent = false;
                if (agentId && row.agent) {
                    matchesAgent = matchesAgent || row.agent.id === agentId || row.agent.legacyId === agentId;
                }
                if (agentName && row.agentName) {
                    matchesAgent = matchesAgent || row.agentName.toLowerCase().trim() === agentName.toLowerCase().trim();
                }
                if (!isMgr && !matchesAgent)
                    return false;
                return row.month === month && row.year === year;
            });
            const clientPayments = await this.clientPaymentRepository.find();
            const transactions = await this.transactionRepository.find({
                relations: { payment: true }
            });
            const payIdMap = new Map();
            const nameCourseToPayId = new Map();
            const roundIdMap = new Map();
            const roundNameMap = new Map();
            const payIdToFirstPay = new Map();
            transactions.forEach(tx => {
                if (tx.type === 'أول دفعة' && tx.payment) {
                    payIdToFirstPay.set(tx.payment.id, Number(tx.amount) || 0);
                }
            });
            clientPayments.forEach(cp => {
                if (cp.isDeleted)
                    return;
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
                if (rowType !== 'client' && rowType !== 'payment')
                    return;
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
                    }
                    else if (ocCodeVal && payIdMap.has(ocCodeVal.replace(/^oc-/i, ''))) {
                        payId = payIdMap.get(ocCodeVal.replace(/^oc-/i, ''));
                    }
                    else if (nameVal && courseVal && nameCourseToPayId.has(`${nameVal}_${courseVal}`)) {
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
                        rowIndex: idx + 2,
                    });
                }
                else if (rowType === 'payment') {
                    payments.push({
                        agentId: row.agentLegacyId || (row.agent ? row.agent.id : ''),
                        agentName: row.agentName || '',
                        ocCode: row.ocCode || '',
                        name: row.clientName || '',
                        phone: row.phone || '',
                        amount: Number(row.paid) || 0,
                        date: row.reservation ? row.reservation.toISOString().split('T')[0] : '',
                        rowIndex: idx + 2,
                    });
                }
            });
            return {
                clients,
                payments,
                salesTargets: '{}',
                defaultTarget: '50000',
            };
        }
        catch (e) {
            console.error('Error in getFinancialData:', e);
            return { clients: [], payments: [] };
        }
    }
};
exports.GasService = GasService;
exports.GasService = GasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(my_lead_entity_1.MyLead)),
    __param(2, (0, typeorm_1.InjectRepository)(raw_lead_entity_1.RawLead)),
    __param(3, (0, typeorm_1.InjectRepository)(lead_call_log_entity_1.LeadCallLog)),
    __param(4, (0, typeorm_1.InjectRepository)(support_request_entity_1.SupportRequest)),
    __param(5, (0, typeorm_1.InjectRepository)(exception_request_entity_1.ExceptionRequest)),
    __param(6, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(7, (0, typeorm_1.InjectRepository)(round_entity_1.Round)),
    __param(8, (0, typeorm_1.InjectRepository)(academy_ledger_entity_1.AcademyLedger)),
    __param(9, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(10, (0, typeorm_1.InjectRepository)(offer_entity_1.Offer)),
    __param(11, (0, typeorm_1.InjectRepository)(client_payment_entity_1.ClientPayment)),
    __param(12, (0, typeorm_1.InjectRepository)(instructor_entity_1.Instructor)),
    __param(13, (0, typeorm_1.InjectRepository)(round_member_entity_1.RoundMember)),
    __param(14, (0, typeorm_1.InjectRepository)(financial_data_entity_1.FinancialData)),
    __param(15, (0, typeorm_1.InjectRepository)(payment_transaction_entity_1.PaymentTransaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GasService);
//# sourceMappingURL=gas.service.js.map