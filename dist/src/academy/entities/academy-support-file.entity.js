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
exports.AcademySupportFile = void 0;
const typeorm_1 = require("typeorm");
const academy_content_entity_1 = require("./academy-content.entity");
let AcademySupportFile = class AcademySupportFile {
    id;
    legacyId;
    lectureLegacyId;
    lecture;
    lectureName;
    title;
    driveFileId;
    fileName;
    fileType;
    url;
    createdAt;
    createdBy;
};
exports.AcademySupportFile = AcademySupportFile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], AcademySupportFile.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "lectureName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'drive_file_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "driveFileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademySupportFile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademySupportFile.prototype, "createdBy", void 0);
exports.AcademySupportFile = AcademySupportFile = __decorate([
    (0, typeorm_1.Entity)('academy_support_files')
], AcademySupportFile);
//# sourceMappingURL=academy-support-file.entity.js.map