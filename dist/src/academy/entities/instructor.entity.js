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
exports.Instructor = void 0;
const typeorm_1 = require("typeorm");
let Instructor = class Instructor {
    id;
    legacyId;
    name;
    username;
    password;
    active;
    profilePic;
    isBsa;
    createdAt;
};
exports.Instructor = Instructor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Instructor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], Instructor.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Instructor.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true, nullable: true }),
    __metadata("design:type", String)
], Instructor.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Instructor.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Instructor.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_pic', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Instructor.prototype, "profilePic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_bsa', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Instructor.prototype, "isBsa", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Instructor.prototype, "createdAt", void 0);
exports.Instructor = Instructor = __decorate([
    (0, typeorm_1.Entity)('academy_instructors')
], Instructor);
//# sourceMappingURL=instructor.entity.js.map