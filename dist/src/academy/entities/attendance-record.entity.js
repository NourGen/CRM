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
exports.AttendanceRecord = void 0;
const typeorm_1 = require("typeorm");
const round_entity_1 = require("./round.entity");
let AttendanceRecord = class AttendanceRecord {
    id;
    roundLegacyId;
    round;
    studentPhone;
    studentName;
    attendedList;
    tasksList;
    lastUpdated;
};
exports.AttendanceRecord = AttendanceRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "roundLegacyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], AttendanceRecord.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_phone', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "studentPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "studentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attended_list', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], AttendanceRecord.prototype, "attendedList", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tasks_list', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], AttendanceRecord.prototype, "tasksList", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_updated', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AttendanceRecord.prototype, "lastUpdated", void 0);
exports.AttendanceRecord = AttendanceRecord = __decorate([
    (0, typeorm_1.Entity)('rounds_attendance')
], AttendanceRecord);
//# sourceMappingURL=attendance-record.entity.js.map