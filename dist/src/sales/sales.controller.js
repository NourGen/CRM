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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const sales_dto_1 = require("./dto/sales.dto");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    createUser(dto) {
        return this.salesService.createUser(dto);
    }
    findAllUsers() {
        return this.salesService.findAllUsers();
    }
    findUserById(id) {
        return this.salesService.findUserById(id);
    }
    createRawLead(dto) {
        return this.salesService.createRawLead(dto);
    }
    findAllRawLeads() {
        return this.salesService.findAllRawLeads();
    }
    findRawLeadById(id) {
        return this.salesService.findRawLeadById(id);
    }
    createMyLead(dto) {
        return this.salesService.createMyLead(dto);
    }
    findAllMyLeads() {
        return this.salesService.findAllMyLeads();
    }
    findMyLeadById(id) {
        return this.salesService.findMyLeadById(id);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findUserById", null);
__decorate([
    (0, common_1.Post)('raw-leads'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_dto_1.CreateRawLeadDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createRawLead", null);
__decorate([
    (0, common_1.Get)('raw-leads'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllRawLeads", null);
__decorate([
    (0, common_1.Get)('raw-leads/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findRawLeadById", null);
__decorate([
    (0, common_1.Post)('my-leads'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_dto_1.CreateMyLeadDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createMyLead", null);
__decorate([
    (0, common_1.Get)('my-leads'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllMyLeads", null);
__decorate([
    (0, common_1.Get)('my-leads/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findMyLeadById", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map