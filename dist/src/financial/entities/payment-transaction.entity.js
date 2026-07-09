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
exports.PaymentTransaction = void 0;
const typeorm_1 = require("typeorm");
const client_payment_entity_1 = require("./client-payment.entity");
const user_entity_1 = require("../../sales/entities/user.entity");
let PaymentTransaction = class PaymentTransaction {
    id;
    legacyTransactionId;
    legacyPaymentId;
    payment;
    clientName;
    amount;
    date;
    type;
    agentLegacyId;
    agent;
    agentName;
};
exports.PaymentTransaction = PaymentTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_transaction_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "legacyTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_payment_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "legacyPaymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_payment_entity_1.ClientPayment, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", client_payment_entity_1.ClientPayment)
], PaymentTransaction.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PaymentTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PaymentTransaction.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], PaymentTransaction.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "agentName", void 0);
exports.PaymentTransaction = PaymentTransaction = __decorate([
    (0, typeorm_1.Entity)('payment_transactions')
], PaymentTransaction);
//# sourceMappingURL=payment-transaction.entity.js.map