export declare class CreateUserDto {
    name: string;
    username: string;
    role: string;
    active?: boolean;
    permissions?: string[];
}
export declare class CreateRawLeadDto {
    name?: string;
    phone?: string;
    source?: string;
    course?: string;
    status?: string;
}
export declare class CreateMyLeadDto {
    name?: string;
    phone?: string;
    source?: string;
    course?: string;
    status?: string;
}
