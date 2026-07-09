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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialController = void 0;
const common_1 = require("@nestjs/common");
const financial_service_1 = require("./financial.service");
const financial_dto_1 = require("./dto/financial.dto");
let FinancialController = class FinancialController {
    financialService;
    constructor(financialService) {
        this.financialService = financialService;
    }
    createAcademyLedger(dto) {
        return this.financialService.createAcademyLedger(dto);
    }
    findAllAcademyLedgers() {
        return this.financialService.findAllAcademyLedgers();
    }
    findAcademyLedgerById(id) {
        return this.financialService.findAcademyLedgerById(id);
    }
    createClientPayment(dto) {
        return this.financialService.createClientPayment(dto);
    }
    findAllClientPayments() {
        return this.financialService.findAllClientPayments();
    }
    findClientPaymentById(id) {
        return this.financialService.findClientPaymentById(id);
    }
};
exports.FinancialController = FinancialController;
__decorate([
    (0, common_1.Post)('ledger'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [financial_dto_1.CreateAcademyLedgerDto]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "createAcademyLedger", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "findAllAcademyLedgers", null);
__decorate([
    (0, common_1.Get)('ledger/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "findAcademyLedgerById", null);
__decorate([
    (0, common_1.Post)('payments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [financial_dto_1.CreateClientPaymentDto]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "createClientPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "findAllClientPayments", null);
__decorate([
    (0, common_1.Get)('payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "findClientPaymentById", null);
exports.FinancialController = FinancialController = __decorate([
    (0, common_1.Controller)('financial'),
    __metadata("design:paramtypes", [financial_service_1.FinancialService])
], FinancialController);
//# sourceMappingURL=financial.controller.js.map