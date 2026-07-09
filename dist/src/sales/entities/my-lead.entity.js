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
exports.MyLead = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const lead_call_log_entity_1 = require("./lead-call-log.entity");
let MyLead = class MyLead {
    id;
    legacyId;
    date;
    name;
    phone;
    source;
    course;
    agentLegacyId;
    agent;
    status;
    legacyNotes;
    action;
    followUpDate;
    campaignType;
    callLogs;
};
exports.MyLead = MyLead;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MyLead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], MyLead.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MyLead.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], MyLead.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "legacyNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follow_up_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MyLead.prototype, "followUpDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], MyLead.prototype, "campaignType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lead_call_log_entity_1.LeadCallLog, (log) => log.lead, { cascade: true }),
    __metadata("design:type", Array)
], MyLead.prototype, "callLogs", void 0);
exports.MyLead = MyLead = __decorate([
    (0, typeorm_1.Entity)('my_leads')
], MyLead);
//# sourceMappingURL=my-lead.entity.js.map