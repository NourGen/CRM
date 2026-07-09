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
exports.WalletAdjustment = void 0;
const typeorm_1 = require("typeorm");
let WalletAdjustment = class WalletAdjustment {
    id;
    walletName;
    balance;
    adjDate;
    savedAt;
};
exports.WalletAdjustment = WalletAdjustment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WalletAdjustment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_name', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WalletAdjustment.prototype, "walletName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WalletAdjustment.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adj_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WalletAdjustment.prototype, "adjDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'saved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WalletAdjustment.prototype, "savedAt", void 0);
exports.WalletAdjustment = WalletAdjustment = __decorate([
    (0, typeorm_1.Entity)('bsa_wallet_adjustments')
], WalletAdjustment);
//# sourceMappingURL=wallet-adjustment.entity.js.map