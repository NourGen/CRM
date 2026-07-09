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
exports.AcademySupport = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let AcademySupport = class AcademySupport {
    id;
    legacyId;
    studentLegacyId;
    student;
    studentName;
    subject;
    message;
    status;
    createdAt;
};
exports.AcademySupport = AcademySupport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademySupport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupport.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupport.prototype, "studentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], AcademySupport.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupport.prototype, "studentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupport.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AcademySupport.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademySupport.prototype, "createdAt", void 0);
exports.AcademySupport = AcademySupport = __decorate([
    (0, typeorm_1.Entity)('academy_support')
], AcademySupport);
//# sourceMappingURL=academy-support.entity.js.map