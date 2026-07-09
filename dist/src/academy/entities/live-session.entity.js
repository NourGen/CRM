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
exports.LiveSession = void 0;
const typeorm_1 = require("typeorm");
const round_entity_1 = require("./round.entity");
let LiveSession = class LiveSession {
    id;
    legacySessionId;
    roundLegacyId;
    round;
    roundName;
    title;
    meetLink;
    platform;
    startTime;
    endTime;
    createdBy;
    createdAt;
};
exports.LiveSession = LiveSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LiveSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_session_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "legacySessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], LiveSession.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "roundName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meet_link', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "meetLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_time', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_time', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "createdAt", void 0);
exports.LiveSession = LiveSession = __decorate([
    (0, typeorm_1.Entity)('academy_live_sessions')
], LiveSession);
//# sourceMappingURL=live-session.entity.js.map