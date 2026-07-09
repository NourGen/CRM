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
exports.AcademyReaction = void 0;
const typeorm_1 = require("typeorm");
let AcademyReaction = class AcademyReaction {
    id;
    legacyId;
    itemType;
    itemId;
    userId;
    reactionType;
    createdAt;
};
exports.AcademyReaction = AcademyReaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyReaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyReaction.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_type', type: 'varchar' }),
    __metadata("design:type", String)
], AcademyReaction.prototype, "itemType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', type: 'varchar' }),
    __metadata("design:type", String)
], AcademyReaction.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyReaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reaction_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyReaction.prototype, "reactionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyReaction.prototype, "createdAt", void 0);
exports.AcademyReaction = AcademyReaction = __decorate([
    (0, typeorm_1.Entity)('academy_reactions')
], AcademyReaction);
//# sourceMappingURL=academy-reaction.entity.js.map