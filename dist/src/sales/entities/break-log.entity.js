"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let BreakLog = class BreakLog {
    id;
    agentLegacyId;
    agent;
    agentName;
    date;
    loginTime;
    logoutTime;
    lunchStart;
    lunchEnd;
    break1Start;
    break1End;
    break2Start;
    break2End;
    workDuration;
    totalBreak;
    overtime;
    earlyLogoutReason;
};
exports.BreakLog = BreakLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BreakLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], BreakLog.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'login_time', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "loginTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logout_time', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "logoutTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lunch_start', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "lunchStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lunch_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "lunchEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'break1_start', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "break1Start", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'break1_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "break1End", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'break2_start', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "break2Start", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'break2_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BreakLog.prototype, "break2End", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'work_duration', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "workDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_break', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "totalBreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "overtime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'early_logout_reason', type: 'text', nullable: true }),
    __metadata("design:type", String)
], BreakLog.prototype, "earlyLogoutReason", void 0);
exports.BreakLog = BreakLog = __decorate([
    (0, typeorm_1.Entity)('break_logs')
], BreakLog);
//# sourceMappingURL=break-log.entity.js.map