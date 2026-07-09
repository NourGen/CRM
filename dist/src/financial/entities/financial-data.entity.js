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
exports.FinancialData = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../sales/entities/user.entity");
let FinancialData = class FinancialData {
    id;
    agentLegacyId;
    agent;
    agentName;
    month;
    year;
    type;
    action;
    ocCode;
    clientName;
    phone;
    course;
    reservation;
    attendance;
    paymentMethod;
    offer;
    price;
    paid;
    createdAt;
    clientType;
    campaignType;
};
exports.FinancialData = FinancialData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinancialData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], FinancialData.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], FinancialData.prototype, "month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], FinancialData.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oc_code', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "ocCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], FinancialData.prototype, "reservation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], FinancialData.prototype, "attendance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "offer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FinancialData.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FinancialData.prototype, "paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], FinancialData.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "clientType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FinancialData.prototype, "campaignType", void 0);
exports.FinancialData = FinancialData = __decorate([
    (0, typeorm_1.Entity)('financial_data')
], FinancialData);
//# sourceMappingURL=financial-data.entity.js.map