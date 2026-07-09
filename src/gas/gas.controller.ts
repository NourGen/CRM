import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { GasService } from './gas.service';

@Controller('gas')
export class GasController {
  constructor(private readonly gasService: GasService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async execute(@Body() body: { functionName: string; args: any[] }) {
    const { functionName, args = [] } = body;
    try {
      let result: any = null;

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
          result = await this.gasService.updateLeadWithFollowUp(
            args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7],
            args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15],
            args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23]
          );
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
    } catch (e: any) {
      console.error(`Error executing GAS function ${functionName}:`, e);
      return { error: e.message };
    }
  }
}
