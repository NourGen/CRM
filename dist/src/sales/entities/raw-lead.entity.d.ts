import { User } from './user.entity';
export declare class RawLead {
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
    notes: string;
    action: string;
    newAction: string;
    followUpDate: Date;
    campaignType: string;
    lastModified: Date;
    ocCode: string;
}
