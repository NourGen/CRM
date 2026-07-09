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
exports.AcademyNotification = void 0;
const typeorm_1 = require("typeorm");
let AcademyNotification = class AcademyNotification {
    id;
    legacyId;
    recipientId;
    recipientType;
    type;
    message;
    refId;
    isRead;
    createdAt;
};
exports.AcademyNotification = AcademyNotification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyNotification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyNotification.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyNotification.prototype, "recipientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_type', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyNotification.prototype, "recipientType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyNotification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AcademyNotification.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ref_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyNotification.prototype, "refId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_read', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AcademyNotification.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyNotification.prototype, "createdAt", void 0);
exports.AcademyNotification = AcademyNotification = __decorate([
    (0, typeorm_1.Entity)('academy_notifications')
], AcademyNotification);
//# sourceMappingURL=academy-notification.entity.js.map