import { User } from './user.entity';
export declare class BreakLog {
    id: string;
    agentLegacyId: string;
    agent: User;
    agentName: string;
    date: string;
    loginTime: Date;
    logoutTime: Date;
    lunchStart: Date;
    lunchEnd: Date;
    break1Start: Date;
    break1End: Date;
    break2Start: Date;
    break2End: Date;
    workDuration: string;
    totalBreak: string;
    overtime: string;
    earlyLogoutReason: string;
}
