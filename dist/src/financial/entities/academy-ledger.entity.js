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
exports.AcademyLedger = void 0;
const typeorm_1 = require("typeorm");
const installment_entity_1 = require("./installment.entity");
let AcademyLedger = class AcademyLedger {
    id;
    bookingDate;
    ocCode;
    clientName;
    phone;
    course;
    groupName;
    status;
    totalPrice;
    paymentMethod;
    amountPaid;
    amountRemaining;
    salesAgentEmail;
    installments;
};
exports.AcademyLedger = AcademyLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyLedger.prototype, "bookingDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oc_code', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "ocCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "groupName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AcademyLedger.prototype, "totalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AcademyLedger.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_remaining', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AcademyLedger.prototype, "amountRemaining", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sales_agent_email', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyLedger.prototype, "salesAgentEmail", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => installment_entity_1.Installment, (installment) => installment.ledger, { cascade: true }),
    __metadata("design:type", Array)
], AcademyLedger.prototype, "installments", void 0);
exports.AcademyLedger = AcademyLedger = __decorate([
    (0, typeorm_1.Entity)('academy_ledger')
], AcademyLedger);
//# sourceMappingURL=academy-ledger.entity.js.map