import { User } from './user.entity';
export declare class ActivityLog {
    id: string;
    date: Date;
    userLegacyId: string;
    user: User;
    name: string;
    status: string;
    notes: string;
}
