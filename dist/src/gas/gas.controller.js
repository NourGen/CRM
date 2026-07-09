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
exports.GasController = void 0;
const common_1 = require("@nestjs/common");
const gas_service_1 = require("./gas.service");
let GasController = class GasController {
    gasService;
    constructor(gasService) {
        this.gasService = gasService;
    }
    async execute(body) {
        const { functionName, args = [] } = body;
        try {
            let result = null;
            switch (functionName) {
                case 'login':
                    result = await this.gasService.login(args[0], args[1]);
                    break;
                case 'validateSession':
                    result = await this.gasService.validateSession(args[0]);
                    break;
                case 'getServerDate':
                    result = this.gasService.getServerDate();
                    break;
                case 'getDashboardData':
                    result = await this.gasService.getDashboardData(args[0]);
                    break;
                case 'getClientByPhone':
                    result = await this.gasService.getClientByPhone(args[0]);
                    break;
                case 'getSupportRequests':
                    result = await this.gasService.getSupportRequests(args[0]);
                    break;
                case 'addSupportRequest':
                    result = await this.gasService.addSupportRequest(args[0], args[1], args[2], args[3], args[4], args[5]);
                    break;
                case 'resolveSupportRequest':
                    result = await this.gasService.resolveSupportRequest(args[0], args[1], args[2]);
                    break;
                case 'getExceptionRequests':
                    result = await this.gasService.getExceptionRequests(args[0]);
                    break;
                case 'addExceptionRequest':
                    result = await this.gasService.addExceptionRequest(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
                    break;
                case 'decideExceptionRequest':
                    result = await this.gasService.decideExceptionRequest(args[0], args[1], args[2], args[3], args[4]);
                    break;
                case 'cancelExceptionRequest':
                    result = await this.gasService.cancelExceptionRequest(args[0], args[1]);
                    break;
                case 'completeTask':
                    result = await this.gasService.completeTask(args[0]);
                    break;
                case 'deleteTask':
                    result = await this.gasService.deleteTask(args[0]);
                    break;
                case 'toggleUserActive':
                    result = await this.gasService.toggleUserActive(args[0], args[1]);
                    break;
                case 'deleteUser':
                    result = await this.gasService.deleteUser(args[0]);
                    break;
                case 'resetPassword':
                    result = await this.gasService.resetPassword(args[0], args[1]);
                    break;
                case 'verifyAccountingPin':
                    result = this.gasService.verifyAccountingPin(args[0], args[1]);
                    break;
                case 'getWaitingClients':
                    result = await this.gasService.getWaitingClients(args[0], args[1], args[2]);
                    break;
                case 'getDueFollowUps':
                    result = await this.gasService.getDueFollowUps(args[0]);
                    break;
                case 'getMyLeads':
                    result = await this.gasService.getMyLeads(args[0], args[1], args[2]);
                    break;
                case 'getRounds':
                    result = await this.gasService.getRounds();
                    break;
                case 'getUsers':
                    result = await this.gasService.getUsers();
                    break;
                case 'getClientPayments':
                    result = await this.gasService.getClientPayments(args[0], args[1]);
                    break;
                case 'getCourses':
                    result = await this.gasService.getCourses();
                    break;
                case 'getOffers':
                    result = await this.gasService.getOffers();
                    break;
                case 'getInstructorList':
                    result = await this.gasService.getInstructorList();
                    break;
                case 'getClientById':
                    result = await this.gasService.getClientById(args[0]);
                    break;
                case 'updateLeadWithFollowUp':
                    result = await this.gasService.updateLeadWithFollowUp(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23]);
                    break;
                case 'searchHistoryFast':
                    result = await this.gasService.searchHistoryFast(args[0], args[1], args[2]);
                    break;
                case 'getFinancialData':
                    result = await this.gasService.getFinancialData(args[0], args[1], args[2], args[3], args[4]);
                    break;
                case 'getRoundDetail':
                    result = await this.gasService.getRoundDetail(args[0]);
                    break;
                default:
                    console.warn(`Unmapped GAS function called: ${functionName}`);
                    result = { success: false, message: `Function ${functionName} not supported yet.` };
            }
            return { result };
        }
        catch (e) {
            console.error(`Error executing GAS function ${functionName}:`, e);
            return { error: e.message };
        }
    }
};
exports.GasController = GasController;
__decorate([
    (0, common_1.Post)('execute'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GasController.prototype, "execute", null);
exports.GasController = GasController = __decorate([
    (0, common_1.Controller)('gas'),
    __metadata("design:paramtypes", [gas_service_1.GasService])
], GasController);
//# sourceMappingURL=gas.controller.js.map