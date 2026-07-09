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
exports.ShowcaseProject = void 0;
const typeorm_1 = require("typeorm");
let ShowcaseProject = class ShowcaseProject {
    id;
    legacyProjectId;
    title;
    description;
    imageUrl;
    projectUrl;
    tags;
    visible;
    addedBy;
    addedAt;
};
exports.ShowcaseProject = ShowcaseProject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_project_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "legacyProjectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_url', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "projectUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ShowcaseProject.prototype, "visible", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'added_by', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ShowcaseProject.prototype, "addedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'added_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ShowcaseProject.prototype, "addedAt", void 0);
exports.ShowcaseProject = ShowcaseProject = __decorate([
    (0, typeorm_1.Entity)('academy_bsa_showcase')
], ShowcaseProject);
//# sourceMappingURL=showcase-project.entity.js.map