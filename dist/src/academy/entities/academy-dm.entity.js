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
exports.AcademyDM = void 0;
const typeorm_1 = require("typeorm");
let AcademyDM = class AcademyDM {
    id;
    legacyMsgId;
    fromId;
    fromName;
    toId;
    toName;
    message;
    timestamp;
    readAt;
};
exports.AcademyDM = AcademyDM;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AcademyDM.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_msg_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], AcademyDM.prototype, "legacyMsgId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyDM.prototype, "fromId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyDM.prototype, "fromName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyDM.prototype, "toId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AcademyDM.prototype, "toName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AcademyDM.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyDM.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'read_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AcademyDM.prototype, "readAt", void 0);
exports.AcademyDM = AcademyDM = __decorate([
    (0, typeorm_1.Entity)('academy_dms')
], AcademyDM);
//# sourceMappingURL=academy-dm.entity.js.map