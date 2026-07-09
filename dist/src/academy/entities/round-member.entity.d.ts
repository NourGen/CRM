import { Round } from './round.entity';
import { User } from '../../sales/entities/user.entity';
export declare class RoundMember {
    id: string;
    roundLegacyId: string;
    round: Round;
    ocCode: string;
    name: string;
    phone: string;
    action: string;
    price: number;
    paid: number;
    method: string;
    attendance: string;
    agentLegacyId: string;
    agent: User;
    agentName: string;
    createdAt: Date;
}
