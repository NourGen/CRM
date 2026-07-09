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
exports.Celebration = void 0;
const typeorm_1 = require("typeorm");
let Celebration = class Celebration {
    id;
    agentName;
    timestamp;
    seen;
};
exports.Celebration = Celebration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Celebration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Celebration.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Celebration.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Celebration.prototype, "seen", void 0);
exports.Celebration = Celebration = __decorate([
    (0, typeorm_1.Entity)('celebrations')
], Celebration);
//# sourceMappingURL=celebration.entity.js.map