import { Round } from './round.entity';
export declare class LiveSession {
    id: string;
    legacySessionId: string;
    roundLegacyId: string;
    round: Round;
    roundName: string;
    title: string;
    meetLink: string;
    platform: string;
    startTime: Date;
    endTime: Date;
    createdBy: string;
    createdAt: Date;
}
