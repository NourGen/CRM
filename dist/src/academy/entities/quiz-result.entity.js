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
exports.QuizResult = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const academy_content_entity_1 = require("./academy-content.entity");
let QuizResult = class QuizResult {
    id;
    legacyId;
    studentLegacyId;
    student;
    lectureLegacyId;
    lecture;
    score;
    passed;
    attemptAt;
    totalQ;
    correctQ;
};
exports.QuizResult = QuizResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuizResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizResult.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizResult.prototype, "studentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], QuizResult.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizResult.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], QuizResult.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], QuizResult.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], QuizResult.prototype, "passed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], QuizResult.prototype, "attemptAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_q', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], QuizResult.prototype, "totalQ", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correct_q', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], QuizResult.prototype, "correctQ", void 0);
exports.QuizResult = QuizResult = __decorate([
    (0, typeorm_1.Entity)('academy_quiz_results')
], QuizResult);
//# sourceMappingURL=quiz-result.entity.js.map