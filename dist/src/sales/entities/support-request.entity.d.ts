import { User } from './user.entity';
export declare class SupportRequest {
    id: string;
    legacyId: string;
    agentLegacyId: string;
    agent: User;
    agentName: string;
    clientName: string;
    clientPhone: string;
    clientOc: string;
    comment: string;
    status: string;
    managerResult: string;
    createdAt: Date;
    resolvedAt: Date;
}
