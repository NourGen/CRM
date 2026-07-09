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
exports.RawLead = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let RawLead = class RawLead {
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
    notes;
    action;
    newAction;
    followUpDate;
    campaignType;
    lastModified;
    ocCode;
};
exports.RawLead = RawLead;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RawLead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], RawLead.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], RawLead.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_action', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "newAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follow_up_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], RawLead.prototype, "followUpDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "campaignType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_modified', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], RawLead.prototype, "lastModified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oc_code', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RawLead.prototype, "ocCode", void 0);
exports.RawLead = RawLead = __decorate([
    (0, typeorm_1.Entity)('raw_leads')
], RawLead);
//# sourceMappingURL=raw-lead.entity.js.map