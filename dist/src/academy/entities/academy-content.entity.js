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
exports.AcademyContent = void 0;
const typeorm_1 = require("typeorm");
const round_entity_1 = require("./round.entity");
let AcademyContent = class AcademyContent {
    id;
    legacyId;
    roundLegacyId;
    round;
    roundName;
    lectureOrder;
    lectureName;
    driveFileId;
    fileType;
    isLocked;
    taskRequired;
    notes;
    createdAt;
};
exports.AcademyContent = AcademyContent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyContent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], AcademyContent.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "roundName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_order', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AcademyContent.prototype, "lectureOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "lectureName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'drive_file_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "driveFileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_locked', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AcademyContent.prototype, "isLocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_required', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AcademyContent.prototype, "taskRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AcademyContent.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyContent.prototype, "createdAt", void 0);
exports.AcademyContent = AcademyContent = __decorate([
    (0, typeorm_1.Entity)('academy_content')
], AcademyContent);
//# sourceMappingURL=academy-content.entity.js.map