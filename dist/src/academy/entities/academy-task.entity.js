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
exports.AcademyTask = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const round_entity_1 = require("./round.entity");
const academy_content_entity_1 = require("./academy-content.entity");
let AcademyTask = class AcademyTask {
    id;
    legacyId;
    studentLegacyId;
    student;
    studentName;
    roundLegacyId;
    round;
    lectureLegacyId;
    lecture;
    lectureName;
    driveFileId;
    fileName;
    submittedAt;
    status;
    reviewedAt;
    reviewedBy;
    reviewNotes;
};
exports.AcademyTask = AcademyTask;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "studentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], AcademyTask.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "studentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], AcademyTask.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], AcademyTask.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "lectureName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'drive_file_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "driveFileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submitted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyTask.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyTask.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_by', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'review_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AcademyTask.prototype, "reviewNotes", void 0);
exports.AcademyTask = AcademyTask = __decorate([
    (0, typeorm_1.Entity)('academy_tasks')
], AcademyTask);
//# sourceMappingURL=academy-task.entity.js.map