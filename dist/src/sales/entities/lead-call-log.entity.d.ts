import { MyLead } from './my-lead.entity';
export declare class LeadCallLog {
    id: string;
    lead: MyLead;
    timestamp: Date;
    agentName: string;
    status: string;
    note: string;
}
