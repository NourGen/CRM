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
exports.QuizBank = void 0;
const typeorm_1 = require("typeorm");
const academy_content_entity_1 = require("./academy-content.entity");
let QuizBank = class QuizBank {
    id;
    lectureLegacyId;
    lecture;
    lectureName;
    instructor;
    question;
    optionA;
    optionB;
    optionC;
    optionD;
    correct;
    notes;
};
exports.QuizBank = QuizBank;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuizBank.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], QuizBank.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "lectureName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_a', type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "optionA", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_b', type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "optionB", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_c', type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "optionC", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_d', type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "optionD", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], QuizBank.prototype, "correct", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuizBank.prototype, "notes", void 0);
exports.QuizBank = QuizBank = __decorate([
    (0, typeorm_1.Entity)('quiz_bank')
], QuizBank);
//# sourceMappingURL=quiz-bank.entity.js.map