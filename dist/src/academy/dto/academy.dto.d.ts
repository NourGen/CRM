export declare class CreateStudentDto {
    name: string;
    email?: string;
    phone?: string;
    active?: boolean;
}
export declare class CreateInstructorDto {
    name: string;
    username?: string;
    active?: boolean;
    isBsa?: boolean;
}
export declare class CreateRoundDto {
    name: string;
    schedule?: string;
    maxSeats?: number;
    status?: string;
    type?: string;
    instructorName?: string;
}
