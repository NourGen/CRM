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
exports.SuccessStory = void 0;
const typeorm_1 = require("typeorm");
let SuccessStory = class SuccessStory {
    id;
    legacyId;
    authorId;
    authorName;
    authorRole;
    title;
    content;
    imageUrl;
    approved;
    createdAt;
    likesCount;
    deleted;
};
exports.SuccessStory = SuccessStory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SuccessStory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "authorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_role', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "authorRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SuccessStory.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SuccessStory.prototype, "approved", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SuccessStory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], SuccessStory.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SuccessStory.prototype, "deleted", void 0);
exports.SuccessStory = SuccessStory = __decorate([
    (0, typeorm_1.Entity)('academy_success_stories')
], SuccessStory);
//# sourceMappingURL=success-story.entity.js.map