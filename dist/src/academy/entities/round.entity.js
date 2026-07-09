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
exports.Round = void 0;
const typeorm_1 = require("typeorm");
let Round = class Round {
    id;
    legacyId;
    name;
    startDate;
    schedule;
    maxSeats;
    enrolled;
    status;
    type;
    instructorName;
    createdAt;
};
exports.Round = Round;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Round.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], Round.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Round.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Round.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Round.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_seats', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Round.prototype, "maxSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Round.prototype, "enrolled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Round.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Round.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'instructor_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Round.prototype, "instructorName", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Round.prototype, "createdAt", void 0);
exports.Round = Round = __decorate([
    (0, typeorm_1.Entity)('rounds')
], Round);
//# sourceMappingURL=round.entity.js.map