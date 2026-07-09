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
exports.ExceptionRequest = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let ExceptionRequest = class ExceptionRequest {
    id;
    legacyId;
    agentLegacyId;
    agent;
    agentName;
    clientName;
    clientPhone;
    clientOc;
    type;
    details;
    status;
    deadline;
    adminNote;
    createdAt;
    decidedAt;
    resolvedAt;
};
exports.ExceptionRequest = ExceptionRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "agentLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", user_entity_1.User)
], ExceptionRequest.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_phone', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "clientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_oc', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "clientOc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ExceptionRequest.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExceptionRequest.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ExceptionRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'decided_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ExceptionRequest.prototype, "decidedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ExceptionRequest.prototype, "resolvedAt", void 0);
exports.ExceptionRequest = ExceptionRequest = __decorate([
    (0, typeorm_1.Entity)('exception_requests')
], ExceptionRequest);
//# sourceMappingURL=exception-request.entity.js.map