import { User } from './user.entity';
export declare class ExceptionRequest {
    id: string;
    legacyId: string;
    agentLegacyId: string;
    agent: User;
    agentName: string;
    clientName: string;
    clientPhone: string;
    clientOc: string;
    type: string;
    details: string;
    status: string;
    deadline: Date;
    adminNote: string;
    createdAt: Date;
    decidedAt: Date;
    resolvedAt: Date;
}
