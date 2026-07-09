export declare class CreateAcademyLedgerDto {
    bookingDate?: string;
    ocCode: string;
    clientName?: string;
    phone?: string;
    course?: string;
    status?: string;
    totalPrice?: number;
}
export declare class CreateClientPaymentDto {
    legacyId: string;
    clientName?: string;
    course?: string;
    totalAmount?: number;
    status?: string;
}
