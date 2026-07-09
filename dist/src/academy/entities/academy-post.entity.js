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
exports.AcademyPost = void 0;
const typeorm_1 = require("typeorm");
const academy_content_entity_1 = require("./academy-content.entity");
let AcademyPost = class AcademyPost {
    id;
    legacyId;
    contextType;
    lectureLegacyId;
    lecture;
    authorId;
    authorType;
    authorName;
    content;
    parentId;
    parent;
    replies;
    legacyParentId;
    likeCount;
    createdAt;
    deleted;
};
exports.AcademyPost = AcademyPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'context_type', type: 'varchar' }),
    __metadata("design:type", String)
], AcademyPost.prototype, "contextType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lecture_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "lectureLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => academy_content_entity_1.AcademyContent, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lecture_id' }),
    __metadata("design:type", academy_content_entity_1.AcademyContent)
], AcademyPost.prototype, "lecture", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "authorType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "authorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AcademyPost, (post) => post.replies, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", AcademyPost)
], AcademyPost.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AcademyPost, (post) => post.parent),
    __metadata("design:type", Array)
], AcademyPost.prototype, "replies", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_parent_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyPost.prototype, "legacyParentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'like_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AcademyPost.prototype, "likeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyPost.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AcademyPost.prototype, "deleted", void 0);
exports.AcademyPost = AcademyPost = __decorate([
    (0, typeorm_1.Entity)('academy_posts')
], AcademyPost);
//# sourceMappingURL=academy-post.entity.js.map