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
exports.WalletTransfer = void 0;
const typeorm_1 = require("typeorm");
let WalletTransfer = class WalletTransfer {
    id;
    legacyId;
    date;
    fromWallet;
    toWallet;
    amount;
    notes;
    createdBy;
    createdAt;
};
exports.WalletTransfer = WalletTransfer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WalletTransfer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legacy_id', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WalletTransfer.prototype, "legacyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WalletTransfer.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_wallet', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WalletTransfer.prototype, "fromWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_wallet', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WalletTransfer.prototype, "toWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WalletTransfer.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WalletTransfer.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WalletTransfer.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WalletTransfer.prototype, "createdAt", void 0);
exports.WalletTransfer = WalletTransfer = __decorate([
    (0, typeorm_1.Entity)('bsa_wallet_transfers')
], WalletTransfer);
//# sourceMappingURL=wallet-transfer.entity.js.map