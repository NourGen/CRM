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
exports.Installment = void 0;
const typeorm_1 = require("typeorm");
const academy_ledger_entity_1 = require("./academy-ledger.entity");
let Installment = class Installment {
    id;
    ledger;
    amount;
    dueDate;
    paymentMethod;
    status;
    installmentOrder;
};
exports.Installment = Installment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Installment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_ledger_entity_1.AcademyLedger, (ledger) => ledger.installments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ledger_id' }),
    __metadata("design:type", academy_ledger_entity_1.AcademyLedger)
], Installment.prototype, "ledger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Installment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Installment.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Installment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'pending' }),
    __metadata("design:type", String)
], Installment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'installment_order', type: 'integer' }),
    __metadata("design:type", Number)
], Installment.prototype, "installmentOrder", void 0);
exports.Installment = Installment = __decorate([
    (0, typeorm_1.Entity)('installments')
], Installment);
//# sourceMappingURL=installment.entity.js.map