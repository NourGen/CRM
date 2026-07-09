"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const academy_ledger_entity_1 = require("./entities/academy-ledger.entity");
const installment_entity_1 = require("./entities/installment.entity");
const client_payment_entity_1 = require("./entities/client-payment.entity");
const payment_transaction_entity_1 = require("./entities/payment-transaction.entity");
const financial_data_entity_1 = require("./entities/financial-data.entity");
const lecturer_salary_entity_1 = require("./entities/lecturer-salary.entity");
const expense_entity_1 = require("./entities/expense.entity");
const wallet_income_entity_1 = require("./entities/wallet-income.entity");
const wallet_adjustment_entity_1 = require("./entities/wallet-adjustment.entity");
const wallet_transfer_entity_1 = require("./entities/wallet-transfer.entity");
const offer_entity_1 = require("./entities/offer.entity");
const course_entity_1 = require("./entities/course.entity");
const financial_service_1 = require("./financial.service");
const financial_controller_1 = require("./financial.controller");
let FinancialModule = class FinancialModule {
};
exports.FinancialModule = FinancialModule;
exports.FinancialModule = FinancialModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                academy_ledger_entity_1.AcademyLedger,
                installment_entity_1.Installment,
                client_payment_entity_1.ClientPayment,
                payment_transaction_entity_1.PaymentTransaction,
                financial_data_entity_1.FinancialData,
                lecturer_salary_entity_1.LecturerSalary,
                expense_entity_1.Expense,
                wallet_income_entity_1.WalletIncome,
                wallet_adjustment_entity_1.WalletAdjustment,
                wallet_transfer_entity_1.WalletTransfer,
                offer_entity_1.Offer,
                course_entity_1.Course,
            ]),
        ],
        providers: [financial_service_1.FinancialService],
        controllers: [financial_controller_1.FinancialController],
        exports: [typeorm_1.TypeOrmModule, financial_service_1.FinancialService],
    })
], FinancialModule);
//# sourceMappingURL=financial.module.js.map