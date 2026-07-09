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
exports.QuizAttempt = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const academy_content_entity_1 = require("./academy-content.entity");
let QuizAttempt = class QuizAttempt {
    attemptId;
    legacyAttemptId;
    studentLegacyId;
    student;
    lectureLegacyId;
    lecture;
    questionsJson;
    createdAt;
    status;
};
exports.QuizAttempt = QuizAttempt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuizAttempt.prototype, "attemptId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_attempt_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], QuizAttempt.prototype, "legacyAttemptId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizAttempt.prototype, "studentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], QuizAttempt.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizAttempt.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], QuizAttempt.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'questions_json', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], QuizAttempt.prototype, "questionsJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], QuizAttempt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizAttempt.prototype, "status", void 0);
exports.QuizAttempt = QuizAttempt = __decorate([
    (0, typeorm_1.Entity)('academy_quiz_attempts')
], QuizAttempt);
//# sourceMappingURL=quiz-attempt.entity.js.map