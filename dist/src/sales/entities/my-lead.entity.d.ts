import { User } from './user.entity';
import { LeadCallLog } from './lead-call-log.entity';
export declare class MyLead {
    id: string;
    legacyId: string;
    date: Date;
    name: string;
    phone: string;
    source: string;
    course: string;
    agentLegacyId: string;
    agent: User;
    status: string;
    legacyNotes: string;
    action: string;
    followUpDate: Date;
    campaignType: string;
    callLogs: LeadCallLog[];
}
