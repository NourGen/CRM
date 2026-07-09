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
exports.AcademyQuiz = void 0;
const typeorm_1 = require("typeorm");
const academy_content_entity_1 = require("./academy-content.entity");
const round_entity_1 = require("./round.entity");
let AcademyQuiz = class AcademyQuiz {
    id;
    legacyId;
    lectureLegacyId;
    lecture;
    roundLegacyId;
    round;
    lectureName;
    questionsJson;
    passScore;
    createdAt;
};
exports.AcademyQuiz = AcademyQuiz;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyQuiz.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyQuiz.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyQuiz.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], AcademyQuiz.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyQuiz.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], AcademyQuiz.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyQuiz.prototype, "lectureName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'questions_json', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AcademyQuiz.prototype, "questionsJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pass_score', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AcademyQuiz.prototype, "passScore", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyQuiz.prototype, "createdAt", void 0);
exports.AcademyQuiz = AcademyQuiz = __decorate([
    (0, typeorm_1.Entity)('academy_quizzes')
], AcademyQuiz);
//# sourceMappingURL=academy-quiz.entity.js.map