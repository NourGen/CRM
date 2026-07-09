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
exports.AcademyProgress = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const academy_content_entity_1 = require("./academy-content.entity");
let AcademyProgress = class AcademyProgress {
    id;
    legacyId;
    studentLegacyId;
    student;
    lectureLegacyId;
    lecture;
    watchedAt;
    completed;
};
exports.AcademyProgress = AcademyProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyProgress.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyProgress.prototype, "studentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], AcademyProgress.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyProgress.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], AcademyProgress.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'watched_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyProgress.prototype, "watchedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AcademyProgress.prototype, "completed", void 0);
exports.AcademyProgress = AcademyProgress = __decorate([
    (0, typeorm_1.Entity)('academy_progress')
], AcademyProgress);
//# sourceMappingURL=academy-progress.entity.js.map