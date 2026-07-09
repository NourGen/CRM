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
exports.ClientPayment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../sales/entities/user.entity");
const round_entity_1 = require("../../academy/entities/round.entity");
let ClientPayment = class ClientPayment {
    id;
    legacyId;
    agentLegacyId;
    agent;
    clientLegacyId;
    clientName;
    course;
    roundLegacyId;
    round;
    roundName;
    totalAmount;
    agentUsername;
    amountPaid;
    amountUnpaid;
    paymentTime;
    status;
    notes;
    createdAt;
    amountDetail1;
    amountDetail2;
    amountDetail3;
    lastModified;
    isDeleted;
    deletedBy;
    deletedAt;
};
exports.ClientPayment = ClientPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClientPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], ClientPayment.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "clientLegacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], ClientPayment.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "roundName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ClientPayment.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_username', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "agentUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ClientPayment.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_unpaid', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ClientPayment.prototype, "amountUnpaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_time', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClientPayment.prototype, "paymentTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClientPayment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_detail1', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ClientPayment.prototype, "amountDetail1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_detail2', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ClientPayment.prototype, "amountDetail2", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_detail3', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ClientPayment.prototype, "amountDetail3", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_modified', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClientPayment.prototype, "lastModified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_deleted', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ClientPayment.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ClientPayment.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClientPayment.prototype, "deletedAt", void 0);
exports.ClientPayment = ClientPayment = __decorate([
    (0, typeorm_1.Entity)('client_payments')
], ClientPayment);
//# sourceMappingURL=client-payment.entity.js.map