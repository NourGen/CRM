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
exports.LeadCallLog = void 0;
const typeorm_1 = require("typeorm");
const my_lead_entity_1 = require("./my-lead.entity");
let LeadCallLog = class LeadCallLog {
    id;
    lead;
    timestamp;
    agentName;
    status;
    note;
};
exports.LeadCallLog = LeadCallLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LeadCallLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => my_lead_entity_1.MyLead, (lead) => lead.callLogs, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", my_lead_entity_1.MyLead)
], LeadCallLog.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LeadCallLog.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LeadCallLog.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LeadCallLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LeadCallLog.prototype, "note", void 0);
exports.LeadCallLog = LeadCallLog = __decorate([
    (0, typeorm_1.Entity)('lead_call_logs')
], LeadCallLog);
//# sourceMappingURL=lead-call-log.entity.js.map