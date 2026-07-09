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
exports.RoundMember = void 0;
const typeorm_1 = require("typeorm");
const round_entity_1 = require("./round.entity");
const user_entity_1 = require("../../sales/entities/user.entity");
let RoundMember = class RoundMember {
    id;
    roundLegacyId;
    round;
    ocCode;
    name;
    phone;
    action;
    price;
    paid;
    method;
    attendance;
    agentLegacyId;
    agent;
    agentName;
    createdAt;
};
exports.RoundMember = RoundMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RoundMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], RoundMember.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oc_code', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "ocCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RoundMember.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RoundMember.prototype, "paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "attendance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], RoundMember.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], RoundMember.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], RoundMember.prototype, "createdAt", void 0);
exports.RoundMember = RoundMember = __decorate([
    (0, typeorm_1.Entity)('round_members')
], RoundMember);
//# sourceMappingURL=round-member.entity.js.map