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
exports.LecturerSalary = void 0;
const typeorm_1 = require("typeorm");
const round_entity_1 = require("../../academy/entities/round.entity");
let LecturerSalary = class LecturerSalary {
    id;
    legacyId;
    roundLegacyId;
    round;
    roundName;
    roundType;
    instructorName;
    pay1Amount;
    pay1Status;
    pay1PaidDate;
    pay2Amount;
    pay2Status;
    pay2PaidDate;
    alert1Triggered;
    alert2Triggered;
    notes;
    createdAt;
};
exports.LecturerSalary = LecturerSalary;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LecturerSalary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], LecturerSalary.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "roundName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "roundType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'instructor_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "instructorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay1_amount', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], LecturerSalary.prototype, "pay1Amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay1_status', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "pay1Status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay1_paid_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LecturerSalary.prototype, "pay1PaidDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay2_amount', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], LecturerSalary.prototype, "pay2Amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay2_status', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "pay2Status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay2_paid_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LecturerSalary.prototype, "pay2PaidDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alert1_triggered', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], LecturerSalary.prototype, "alert1Triggered", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alert2_triggered', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], LecturerSalary.prototype, "alert2Triggered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LecturerSalary.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LecturerSalary.prototype, "createdAt", void 0);
exports.LecturerSalary = LecturerSalary = __decorate([
    (0, typeorm_1.Entity)('lecturer_salaries')
], LecturerSalary);
//# sourceMappingURL=lecturer-salary.entity.js.map