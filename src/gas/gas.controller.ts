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
          result = await this.gasService.getExceptionRequests(args[0], args[1]);
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
          result = await this.gasService.verifyAccountingPin(args[0], args[1]);
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
        case 'academyLogin':
          result = await this.gasService.academyLogin(args[0], args[1]);
          break;
        case 'academyLogout':
          result = await this.gasService.academyLogout(args[0]);
          break;
        case 'validateAcadSessionPublic':
          result = await this.gasService.validateAcadSessionPublic(args[0]);
          break;
        case 'saveProfilePic':
          result = await this.gasService.saveProfilePic(args[0], args[1]);
          break;
        case 'updateAcadPassword':
          result = await this.gasService.updateAcadPassword(args[0], args[1], args[2]);
          break;
        case 'updateStudentUsername':
          result = await this.gasService.updateStudentUsername(args[0], args[1]);
          break;
        case 'checkPhoneExists':
          result = await this.gasService.checkPhoneExists(args[0]);
          break;
        case 'addManualLead':
          result = await this.gasService.addManualLead(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'adminEditClientRecord':
          result = await this.gasService.adminEditClientRecord(args[0], args[1], args[2], args[3]);
          break;
        case 'archiveClientRecord':
          result = await this.gasService.archiveClientRecord(args[0], args[1], args[2], args[3]);
          break;
        case 'restoreClientRecord':
          result = await this.gasService.restoreClientRecord(args[0], args[1], args[2]);
          break;
        case 'getArchivedClients':
          result = await this.gasService.getArchivedClients(args[0]);
          break;
        case 'updateClientOCCode':
          result = await this.gasService.updateClientOCCode(args[0], args[1], args[2], args[3]);
          break;
        case 'deleteLeadFromMyLeads':
          result = await this.gasService.deleteLeadFromMyLeads(args[0], args[1], args[2]);
          break;
        case 'adminDeleteLead':
          result = await this.gasService.adminDeleteLead(args[0], args[1]);
          break;
        case 'updateLeadDetailsDirectly':
          result = await this.gasService.updateLeadDetailsDirectly(
            args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]
          );
          break;
        case 'searchClientHistoryCandidates':
          result = await this.gasService.searchClientHistoryCandidates(args[0]);
          break;
        case 'adminGetAllLeads':
          result = await this.gasService.adminGetAllLeads(args[0]);
          break;
        case 'getAgentKeysForFresh':
          result = await this.gasService.getAgentKeysForFresh();
          break;
        case 'addFreshLeadToSheet':
          result = await this.gasService.addFreshLeadToSheet(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
          break;
        case 'getAvailableFreshCount':
          result = await this.gasService.getAvailableFreshCount(args[0], args[1], args[2], args[3]);
          break;
        case 'pullFreshLeadOnly':
          result = await this.gasService.pullFreshLeadOnly(args[0], args[1], args[2], args[3]);
          break;
        case 'getTodayFreshLeads':
          result = await this.gasService.getTodayFreshLeads();
          break;
        case 'getTodayRangeLeadsForAgent':
          result = await this.gasService.getTodayRangeLeadsForAgent(args[0], args[1], args[2]);
          break;
        case 'getFreshLeadAgentStats':
          result = await this.gasService.getFreshLeadAgentStats(args[0]);
          break;
        case 'transferFreshLead':
          result = await this.gasService.transferFreshLead(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'updateFreshLeadDetails':
          result = await this.gasService.updateFreshLeadDetails(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          break;
        case 'migrateLeadDay':
          result = await this.gasService.migrateLeadDay(args[0], args[1], args[2], args[3]);
          break;
        case 'getRecyclePullCount':
          result = await this.gasService.getRecyclePullCount(args[0]);
          break;
        case 'pullRecycledLeadRandomly':
          result = await this.gasService.pullRecycledLeadRandomly(args[0], args[1]);
          break;
        case 'claimSearchedLead':
          result = await this.gasService.claimSearchedLead(args[0], args[1], args[2], args[3]);
          break;
        case 'getTodayCalls':
          result = await this.gasService.getTodayCalls(args[0]);
          break;
        case 'getIdleLeads':
          result = await this.gasService.getIdleLeads(args[0], args[1]);
          break;
        case 'getMyLeadsOrphans':
          result = await this.gasService.getMyLeadsOrphans();
          break;
        case 'getRoundMembersOrphans':
          result = await this.gasService.getRoundMembersOrphans();
          break;
        case 'findClientForRoundPull':
          result = await this.gasService.findClientForRoundPull(args[0]);
          break;
        case 'migrateRawDataOcCodes':
          result = await this.gasService.migrateRawDataOcCodes();
          break;
        case 'repairMyLeadsAfterIdFix':
          result = await this.gasService.repairMyLeadsAfterIdFix();
          break;
        case 'autoSyncMissingOcCodes':
          result = await this.gasService.autoSyncMissingOcCodes();
          break;
        case 'syncClientOcCodeFromExternal':
          result = await this.gasService.syncClientOcCodeFromExternal();
          break;
        case 'findClientForOldPayment':
          result = await this.gasService.findClientForOldPayment(args[0], args[1]);
          break;
        case 'lookupStudentPhone':
          result = await this.gasService.lookupStudentPhone(args[0]);
          break;
        case 'syncStudentByPhone':
          result = await this.gasService.syncStudentByPhone(args[0]);
          break;
        case 'getClientDetailsByPhone':
          result = await this.gasService.getClientDetailsByPhone(args[0]);
          break;
        case 'syncStudentPhones':
          result = await this.gasService.syncStudentPhones();
          break;
        case 'addClientPayment':
          result = await this.gasService.addClientPayment(
            args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7],
            args[8], args[9], args[10], args[11], args[12], args[13], args[14]
          );
          break;
        case 'addInstallment':
          result = await this.gasService.addInstallment(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'updateClientPayment':
          result = await this.gasService.updateClientPayment(
            args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]
          );
          break;
        case 'deleteClientPaymentRecord':
          result = await this.gasService.deleteClientPaymentRecord(args[0], args[1], args[2]);
          break;
        case 'restoreClientPaymentRecord':
          result = await this.gasService.restoreClientPaymentRecord(args[0], args[1], args[2]);
          break;
        case 'getDeletedPayments':
          result = await this.gasService.getDeletedPayments(args[0]);
          break;
        case 'getOverdueInstallments':
          result = await this.gasService.getOverdueInstallments(args[0]);
          break;
        case 'fixAllClientPaymentCalculations':
          result = await this.gasService.fixAllClientPaymentCalculations(args[0]);
          break;
        case 'fixDuplicatePayIds':
          result = await this.gasService.fixDuplicatePayIds();
          break;
        case 'createDirectInvoice':
          result = await this.gasService.createDirectInvoiceFull(
            args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9],
            args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19],
            args[20]
          );
          break;
        case 'updateUserField':
          result = await this.gasService.updateUserField(args[0], args[1], args[2]);
          break;
        case 'emailInvoicePng':
          result = await this.gasService.emailInvoicePng(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'getClientInvoicePdf':
          result = await this.gasService.getClientInvoicePdf();
          break;
        case 'getInvoiceFormUrl':
          result = await this.gasService.getInvoiceFormUrl();
          break;
        case 'sendPaymentLink':
          result = await this.gasService.sendPaymentLink();
          break;
        case 'getPaymentLinks':
          result = await this.gasService.getPaymentLinks();
          break;
        case 'addRound':
          result = await this.gasService.addRound(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 'updateRound':
          result = await this.gasService.updateRound(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          break;
        case 'deleteRound':
          result = await this.gasService.deleteRound(args[0], args[1], args[2]);
          break;
        case 'restoreRound':
          result = await this.gasService.restoreRound(args[0], args[1], args[2]);
          break;
        case 'getDeletedRounds':
          result = await this.gasService.getDeletedRounds(args[0]);
          break;
        case 'toggleRoundStatusDirectly':
          result = await this.gasService.toggleRoundStatusDirectly(args[0], args[1]);
          break;
        case 'setRoundOffer':
          result = await this.gasService.setRoundOffer(args[0], args[1], args[2], args[3]);
          break;
        case 'addRoundMember':
          result = await this.gasService.addRoundMember(args[0], args[1]);
          break;
        case 'removeRoundMember':
          result = await this.gasService.removeRoundMember(args[0], args[1], args[2]);
          break;
        case 'updateRoundMemberDetails':
          result = await this.gasService.updateRoundMemberDetails(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 'syncRoundToAcademy':
          result = await this.gasService.syncRoundToAcademy(args[0], args[1], args[2], args[3]);
          break;
        case 'getLecturerSalaries':
          result = await this.gasService.getLecturerSalaries();
          break;
        case 'updateLecturerSalaryPayment':
          result = await this.gasService.updateLecturerSalaryPayment(args[0]);
          break;
        case 'deleteLecturerSalary':
          result = await this.gasService.deleteLecturerSalary(args[0]);
          break;
        case 'addLecturerSalaryManual':
          result = await this.gasService.addLecturerSalaryManual(args[0]);
          break;
        case 'getAgentNames':
          result = await this.gasService.getAgentNames();
          break;
        case 'getAgentRangesConfig':
          result = await this.gasService.getAgentRangesConfig();
          break;
        case 'setAgentRange':
          result = await this.gasService.setAgentRange();
          break;
        case 'deleteAgentRange':
          result = await this.gasService.deleteAgentRange();
          break;
        case 'repairAgentIds':
          result = await this.gasService.repairAgentIds(args[0]);
          break;
        case 'repairFreshDuplicateMarksRange':
          result = await this.gasService.repairFreshDuplicateMarksRange(args[0]);
          break;
        case 'getSystemSetting':
          result = await this.gasService.getSystemSetting(args[0], args[1]);
          break;
        case 'saveSystemSetting':
          result = await this.gasService.saveSystemSetting(args[0], args[1]);
          break;
        case 'getAttendanceData':
          result = await this.gasService.getAttendanceData(args[0]);
          break;
        case 'saveAttendanceData':
          result = await this.gasService.saveAttendanceData(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'openAttendanceSession':
          result = await this.gasService.openAttendanceSession(args[0], args[1], args[2]);
          break;
        case 'closeAttendanceSession':
          result = await this.gasService.closeAttendanceSession(args[0], args[1]);
          break;
        case 'getActiveSessions':
          result = await this.gasService.getActiveSessions(args[0]);
          break;
        case 'getTasks':
          result = await this.gasService.getTasks(args[0]);
          break;
        case 'addTask':
          result = await this.gasService.addTask(args[0], args[1], args[2]);
          break;
        case 'getActivityLog':
          result = await this.gasService.getActivityLog(args[0]);
          break;
        case 'getLatestCelebration':
          result = await this.gasService.getLatestCelebration();
          break;
        case 'getPages':
          result = this.gasService.getPages();
          break;
        case 'addUser':
          result = await this.gasService.addUser(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'updateUserPages':
          result = await this.gasService.updateUserPages(args[0], args[1]);
          break;
        case 'getBatchCredentials':
          result = await this.gasService.getBatchCredentials(args[0]);
          break;
        case 'getWallets':
          result = await this.gasService.getWallets(args[0]);
          break;
        case 'setWalletBalance':
          result = await this.gasService.setWalletBalance(args[0], args[1], args[2]);
          break;
        case 'transferWalletFunds':
          result = await this.gasService.transferWalletFunds(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'addWalletIncome':
          result = await this.gasService.addWalletIncome(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          break;
        case 'getWalletIncome':
          result = await this.gasService.getWalletIncome(args[0], args[1], args[2]);
          break;
        case 'addAccountingExpense':
          result = await this.gasService.addAccountingExpense(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 'getAccountingExpenses':
          result = await this.gasService.getAccountingExpenses(args[0], args[1], args[2]);
          break;
        case 'getAccountingTransactions':
          result = await this.gasService.getAccountingTransactions(args[0], args[1], args[2]);
          break;
        case 'getAccExpenseCategories':
          result = await this.gasService.getAccExpenseCategories(args[0]);
          break;
        case 'addAccExpenseCategory':
          result = await this.gasService.addAccExpenseCategory(args[0], args[1]);
          break;
        case 'deleteAccExpenseCategory':
          result = await this.gasService.deleteAccExpenseCategory(args[0], args[1]);
          break;
        case 'changeAccountingPin':
          result = await this.gasService.changeAccountingPin(args[0], args[1], args[2]);
          break;
        case 'payInstructorSalaryFromWallet':
          result = await this.gasService.payInstructorSalaryFromWallet(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'getAccountingDashboard':
          result = await this.gasService.getAccountingDashboard(args[0], args[1], args[2]);
          break;
        case 'getCampaignList':
          result = await this.gasService.getCampaignList();
          break;
        case 'saveCampaignList':
          result = await this.gasService.saveCampaignList(args[0]);
          break;
        case 'getPlatformList':
          result = await this.gasService.getPlatformList();
          break;
        case 'savePlatformList':
          result = await this.gasService.savePlatformList(args[0]);
          break;
        case 'saveInstructorList':
          result = await this.gasService.saveInstructorList(args[0]);
          break;
        case 'addFinancialClient':
          result = await this.gasService.addFinancialClient(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'addFinancialPayment':
          result = await this.gasService.addFinancialPayment(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'updateFinancialRowDirect':
          result = await this.gasService.updateFinancialRowDirect(args[0], args[1]);
          break;
        case 'deleteFinancialClient':
          result = await this.gasService.deleteFinancialClient(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'deleteFinancialPayment':
          result = await this.gasService.deleteFinancialPayment(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'getAcademyLedgerData':
          result = await this.gasService.getAcademyLedgerData();
          break;
        case 'syncFinancialCampaignTypes':
          result = await this.gasService.syncFinancialCampaignTypes();
          break;
        case 'importAcademyFinancialData':
          result = await this.gasService.importAcademyFinancialData();
          break;
        case 'cleanupFinancialSnapshotDuplicates':
          result = await this.gasService.cleanupFinancialSnapshotDuplicates();
          break;
        case 'toggleSupportClaim':
          result = await this.gasService.toggleSupportClaim(args[0], args[1], args[2]);
          break;
        case 'deleteSupportRequest':
          result = await this.gasService.deleteSupportRequest(args[0], args[1]);
          break;
        case 'markExceptionDone':
          result = await this.gasService.markExceptionDone(args[0], args[1]);
          break;
        case 'deleteExceptionRequest':
          result = await this.gasService.deleteExceptionRequest(args[0], args[1]);
          break;
        case 'getSupportFilesCRM':
          result = await this.gasService.getSupportFilesCRM(args[0]);
          break;
        case 'addSupportFileByIdCRM':
          result = await this.gasService.addSupportFileByIdCRM(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 'deleteSupportFileCRM':
          result = await this.gasService.deleteSupportFileCRM(args[0]);
          break;
        case 'getTeamPerformance':
          result = await this.gasService.getTeamPerformance(args[0], args[1], args[2]);
          break;
        case 'getMyPerformance':
          result = await this.gasService.getMyPerformance(args[0], args[1]);
          break;
        case 'getBreakStatus':
          result = await this.gasService.getBreakStatus();
          break;
        case 'logBreakAction':
          result = await this.gasService.logBreakAction(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 'getFuAlertsNow':
          result = await this.gasService.getFuAlertsNow(args[0]);
          break;
        case 'getAdminAlerts':
          result = await this.gasService.getAdminAlerts();
          break;
        case 'systemHealthCheck':
          result = await this.gasService.systemHealthCheck();
          break;
        case 'sendPerformanceReport':
          result = await this.gasService.sendPerformanceReport();
          break;
        case 'setupDailyReportTrigger':
          result = await this.gasService.setupDailyReportTrigger();
          break;
        case 'addStudent':
          result = await this.gasService.addStudent(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
          break;
        case 'updateStudent':
          result = await this.gasService.updateStudent(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 'deleteStudent':
          result = await this.gasService.deleteStudent(args[0]);
          break;
        case 'toggleStudentActive':
          result = await this.gasService.toggleStudentActive(args[0], args[1]);
          break;
        case 'setStudentAccessMode':
          result = await this.gasService.setStudentAccessMode(args[0], args[1]);
          break;
        case 'updateStudentPassword':
          result = await this.gasService.updateStudentPassword(args[0], args[1]);
          break;
        case 'updateInstructorPassword':
          result = await this.gasService.updateInstructorPassword(args[0], args[1]);
          break;
        case 'enrollStudent':
          result = await this.gasService.enrollStudent(args[0], args[1], args[2]);
          break;
        case 'getAcademyStudents':
          result = await this.gasService.getAcademyStudents();
          break;
        case 'getAcademyStats':
          result = await this.gasService.getAcademyStats();
          break;
        case 'getAcademyTarget':
          result = await this.gasService.getAcademyTarget();
          break;
        case 'getAcademyRoundsList':
          result = await this.gasService.getAcademyRoundsList();
          break;
        case 'addLectureContent':
          result = await this.gasService.addLectureContent(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
          break;
        case 'updateLectureContent':
          result = await this.gasService.updateLectureContent(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
          break;
        case 'deleteLectureContent':
          result = await this.gasService.deleteLectureContent(args[0]);
          break;
        case 'getContentForUnlock':
          result = await this.gasService.getContentForUnlock(args[0]);
          break;
        case 'getAllContentGroupedByInstructor':
          result = await this.gasService.getAllContentGroupedByInstructor();
          break;
        case 'manualUnlockLecture':
          result = await this.gasService.manualUnlockLecture(args[0], args[1], args[2]);
          break;
        case 'saveQuizForLecture':
          result = await this.gasService.saveQuizForLecture(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'getQuizForLecture':
          result = await this.gasService.getQuizForLecture(args[0]);
          break;
        case 'deleteQuizForLecture':
          result = await this.gasService.deleteQuizForLecture(args[0]);
          break;
        case 'importQuestionsFromBank':
          result = await this.gasService.importQuestionsFromBank(args[0]);
          break;
        case 'initQuizBankSheet':
          result = { success: true, message: '✅ بنك الأسئلة جاهز في قاعدة البيانات' };
          break;
        case 'getAllAcadTasks':
          result = await this.gasService.getAllAcadTasks(args[0]);
          break;
        case 'reviewStudentTask':
          result = await this.gasService.reviewStudentTask(args[0], args[1], args[2], args[3]);
          break;
        case 'getStudentDashboard':
          result = await this.gasService.getStudentDashboard(args[0]);
          break;
        case 'getStudentRounds':
          result = await this.gasService.getStudentRounds(args[0]);
          break;
        case 'getInstructorStats':
          result = await this.gasService.getInstructorStats(args[0]);
          break;
        case 'getBSAStudentStats':
          result = await this.gasService.getBSAStudentStats(args[0]);
          break;
        case 'getInstructorPendingTasks':
          result = await this.gasService.getInstructorPendingTasks(args[0]);
          break;
        case 'getInstructorAllTasks':
          result = await this.gasService.getInstructorAllTasks(args[0]);
          break;
        case 'getInstructorSurveyResponses':
          result = await this.gasService.getInstructorSurveyResponses(args[0]);
          break;
        case 'getRoundLectures':
          result = await this.gasService.getRoundLectures(args[0], args[1]);
          break;
        case 'getSecureFileUrl':
          result = await this.gasService.getSecureFileUrl(args[0], args[1]);
          break;
        case 'submitStudentTask':
          result = await this.gasService.submitStudentTask(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'getStudentTaskHistory':
          result = await this.gasService.getStudentTaskHistory(args[0]);
          break;
        case 'getStudentQuizHistory':
          result = await this.gasService.getStudentQuizHistory(args[0]);
          break;
        case 'submitSupportTicket':
          result = await this.gasService.submitSupportTicket(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'getSupportTickets':
          result = await this.gasService.getSupportTickets(args[0]);
          break;
        case 'replyToSupportTicket':
          result = await this.gasService.replyToSupportTicket(args[0], args[1], args[2]);
          break;
        case 'getStudentSupportFiles':
          result = await this.gasService.getStudentSupportFiles(args[0]);
          break;
        case 'getInstructorSupportFiles':
          result = await this.gasService.getInstructorSupportFiles(args[0]);
          break;
        case 'getStudentCertificates':
          result = await this.gasService.getStudentCertificates(args[0]);
          break;
        case 'getStudentFinancials':
          result = await this.gasService.getStudentFinancials(args[0]);
          break;
        case 'getMentionableUsers':
          result = await this.gasService.getMentionableUsers(args[0]);
          break;
        case 'getMyNotifications':
          result = await this.gasService.getMyNotifications(args[0]);
          break;
        case 'markNotifRead':
          result = await this.gasService.markNotifRead(args[0], args[1]);
          break;
        case 'markAllNotifsRead':
          result = await this.gasService.markAllNotifsRead(args[0]);
          break;
        case 'getNotifTarget':
          result = await this.gasService.getNotifTarget(args[0], args[1]);
          break;
        case 'isUserOnline':
          result = await this.gasService.isUserOnline(args[0], args[1]);
          break;
        case 'sendFriendRequest':
          result = await this.gasService.sendFriendRequest(args[0], args[1]);
          break;
        case 'acceptFriendRequest':
          result = await this.gasService.acceptFriendRequest(args[0], args[1]);
          break;
        case 'removeFriend':
          result = await this.gasService.removeFriend(args[0], args[1]);
          break;
        case 'getFriends':
          result = await this.gasService.getFriends(args[0]);
          break;
        case 'getPendingRequests':
          result = await this.gasService.getPendingRequests(args[0]);
          break;
        case 'searchAcadUsers':
          result = await this.gasService.searchAcadUsers(args[0], args[1]);
          break;
        case 'sendDMMessage':
          result = await this.gasService.sendDMMessage(args[0], args[1], args[2]);
          break;
        case 'getConversations':
          result = await this.gasService.getConversations(args[0]);
          break;
        case 'getDMHistoryNorm':
          result = await this.gasService.getDMHistoryNorm(args[0], args[1]);
          break;
        case 'getDMHistorySince':
          result = await this.gasService.getDMHistorySince(args[0], args[1], args[2]);
          break;
        case 'markDMsRead':
          result = await this.gasService.markDMsRead(args[0], args[1]);
          break;
        case 'postCommunityMessage':
          result = await this.gasService.postCommunityMessage(args[0], args[1], args[2]);
          break;
        case 'getCommunityFeed':
          result = await this.gasService.getCommunityFeed(args[0], args[1]);
          break;
        case 'checkCommunityNew':
          result = await this.gasService.checkCommunityNew(args[0], args[1]);
          break;
        case 'deleteCommunityPost':
          result = await this.gasService.deleteCommunityPost(args[0], args[1]);
          break;
        case 'postComment':
          result = await this.gasService.postComment(args[0], args[1], args[2], args[3]);
          break;
        case 'deleteComment':
          result = await this.gasService.deleteComment(args[0], args[1]);
          break;
        case 'getLectureComments':
          result = await this.gasService.getLectureComments(args[0], args[1]);
          break;
        case 'getInstructorLectureComments':
          result = await this.gasService.getInstructorLectureComments(args[0]);
          break;
        case 'reactToItem':
          result = await this.gasService.reactToItem(args[0], args[1], args[2], args[3]);
          break;
        case 'getClassLeaderboard':
          result = await this.gasService.getClassLeaderboard(args[0]);
          break;
        case 'getClassActivity':
          result = await this.gasService.getClassActivity(args[0]);
          break;
        case 'getStudentQuiz':
          result = await this.gasService.getStudentQuiz(args[0], args[1]);
          break;
        case 'submitQuizAnswers':
          result = await this.gasService.submitQuizAnswers(args[0], args[1], args[2], args[3]);
          break;
        case 'getStudentQuizReview':
          result = await this.gasService.getStudentQuizReview(args[0], args[1]);
          break;
        case 'getInstructorQuizReview':
          result = await this.gasService.getInstructorQuizReview(args[0], args[1], args[2]);
          break;
        case 'getInstructorStudentQuizResults':
          result = await this.gasService.getInstructorStudentQuizResults(args[0], args[1]);
          break;
        case 'addLiveSession':
          result = await this.gasService.addLiveSession(args[0], args[1]);
          break;
        case 'deleteLiveSession':
          result = await this.gasService.deleteLiveSession(args[0], args[1]);
          break;
        case 'getAllLiveSessions':
          result = await this.gasService.getAllLiveSessions(args[0]);
          break;
        case 'getLiveSessionsByRounds':
          result = await this.gasService.getLiveSessionsByRounds(args[0]);
          break;
        case 'getLastLiveSessionForRound':
          result = await this.gasService.getLastLiveSessionForRound(args[0], args[1]);
          break;
        case 'joinLiveSession':
          result = await this.gasService.joinLiveSession(args[0], args[1]);
          break;
        case 'getLiveSessionAttendees':
          result = await this.gasService.getLiveSessionAttendees(args[0], args[1]);
          break;
        case 'getAttendSessionPreview':
          result = await this.gasService.getAttendSessionPreview(args[0]);
          break;
        case 'qrCheckInAuto':
          result = await this.gasService.qrCheckInAuto(args[0]);
          break;
        case 'submitFinalProject':
          result = await this.gasService.submitFinalProject(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'submitFinalProjectChunk':
          result = await this.gasService.submitFinalProjectChunk(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'uploadProjectOutline':
          result = await this.gasService.uploadProjectOutline(args[0], args[1], args[2], args[3]);
          break;
        case 'deleteGlobalOutline':
          result = await this.gasService.deleteGlobalOutline(args[0]);
          break;
        case 'getStudentFinalProject':
          result = await this.gasService.getStudentFinalProject(args[0]);
          break;
        case 'getAllFinalProjects':
          result = await this.gasService.getAllFinalProjects(args[0]);
          break;
        case 'getApprovedFinalProjects':
          result = await this.gasService.getApprovedFinalProjects(args[0]);
          break;
        case 'reviewFinalProject':
          result = await this.gasService.reviewFinalProject(args[0], args[1], args[2], args[3]);
          break;
        case 'toggleFinalProjectUnlock':
          result = await this.gasService.toggleFinalProjectUnlock(args[0], args[1], args[2]);
          break;
        case 'instructorReviewTask':
          result = await this.gasService.instructorReviewTask(args[0], args[1], args[2], args[3]);
          break;
        case 'submitSuccessStory':
          result = await this.gasService.submitSuccessStory(args[0], args[1], args[2], args[3]);
          break;
        case 'getSuccessStories':
          result = await this.gasService.getSuccessStories(args[0]);
          break;
        case 'approveSuccessStory':
          result = await this.gasService.approveSuccessStory(args[0], args[1]);
          break;
        case 'editAndApproveStory':
          result = await this.gasService.editAndApproveStory(args[0], args[1], args[2], args[3]);
          break;
        case 'deleteSuccessStory':
          result = await this.gasService.deleteSuccessStory(args[0], args[1]);
          break;
        case 'getInstructorsList':
          result = await this.gasService.getInstructorsList(args[0]);
          break;
        case 'getBsaOrientations':
          result = await this.gasService.getBsaOrientations(args[0]);
          break;
        case 'addBsaOrientation':
          result = await this.gasService.addBsaOrientation(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'deleteBsaOrientation':
          result = await this.gasService.deleteBsaOrientation(args[0], args[1]);
          break;
        case 'getBSAShowcaseProjects':
          result = await this.gasService.getBSAShowcaseProjects(args[0]);
          break;
        case 'addBSAShowcaseProject':
          result = await this.gasService.addBSAShowcaseProject(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'deleteBSAShowcaseProject':
          result = await this.gasService.deleteBSAShowcaseProject(args[0], args[1]);
          break;
        case 'toggleBSAShowcaseProject':
          result = await this.gasService.toggleBSAShowcaseProject(args[0], args[1], args[2]);
          break;
        case 'saveShowcaseSettings':
          result = await this.gasService.saveShowcaseSettings(args[0], args[1], args[2]);
          break;
        case 'getMyInstructorRounds':
          result = await this.gasService.getMyInstructorRounds(args[0]);
          break;
        case 'getMyInstructorSalaryCards':
          result = await this.gasService.getMyInstructorSalaryCards(args[0]);
          break;
        case 'addCourse':
          result = await this.gasService.addCourse(args[0]);
          break;
        case 'deleteCourse':
          result = await this.gasService.deleteCourse(args[0]);
          break;
        case 'addOffer':
          result = await this.gasService.addOffer(args[0], args[1]);
          break;
        case 'deleteOffer':
          result = await this.gasService.deleteOffer(args[0]);
          break;
        case 'getAcademyInstructors':
          result = await this.gasService.getAcademyInstructors();
          break;
        case 'addAcademyInstructor':
          result = await this.gasService.addAcademyInstructor(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'updateAcademyInstructor':
          result = await this.gasService.updateAcademyInstructor(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'deleteAcademyInstructor':
          result = await this.gasService.deleteAcademyInstructor(args[0]);
          break;
        case 'toggleAcademyInstructor':
          result = await this.gasService.toggleAcademyInstructor(args[0], args[1]);
          break;
        case 'adminTransferLead':
          result = await this.gasService.adminTransferLead(args[0], args[1], args[2], args[3]);
          break;
        case 'addClientHistoryComment':
          result = await this.gasService.addClientHistoryComment(args[0], args[1], args[2], args[3]);
          break;
        case 'updateClientBookingStatus':
          result = await this.gasService.updateClientBookingStatus(args[0], args[1], args[2], args[3]);
          break;
        case 'confirmInstallmentWithWallet':
          result = await this.gasService.confirmInstallmentWithWallet(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'rejectInstallmentReceipt':
          result = await this.gasService.rejectInstallmentReceipt(args[0], args[1], args[2]);
          break;
        case 'getSurveyQuestions':
          result = await this.gasService.getSurveyQuestions();
          break;
        case 'saveSurveyQuestions':
          result = await this.gasService.saveSurveyQuestions(args[0], args[1], args[2]);
          break;
        case 'submitSurveyResponse':
          result = await this.gasService.submitSurveyResponse(args[0], args[1], args[2], args[3]);
          break;
        case 'getSurveyResponses':
          result = await this.gasService.getSurveyResponses(args[0]);
          break;
        case 'publishSurveyResponse':
          result = await this.gasService.publishSurveyResponse(args[0], args[1], args[2]);
          break;
        case 'editSurveyResponse':
          result = await this.gasService.editSurveyResponse(args[0], args[1], args[2]);
          break;
        case 'deleteSurveyResponse':
          result = await this.gasService.deleteSurveyResponse(args[0], args[1]);
          break;
        case 'checkSurveySubmitted':
          result = await this.gasService.checkSurveySubmitted(args[0], args[1], args[2]);
          break;
        case 'updateLedgerInvoice':
          result = await this.gasService.updateLedgerInvoice(args[0], args[1], args[2]);
          break;
        case 'getInvoicePrintHtml':
          result = await this.gasService.getInvoicePrintHtml(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 'repairFinancialPaymentRowsCarryover':
          result = await this.gasService.repairFinancialPaymentRowsCarryover();
          break;
        case 'healAndSyncAllClients':
          result = await this.gasService.healAndSyncAllClients();
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
