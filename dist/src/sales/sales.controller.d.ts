import { SalesService } from './sales.service';
import { CreateUserDto, CreateRawLeadDto, CreateMyLeadDto } from './dto/sales.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    createUser(dto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    findAllUsers(): Promise<import("./entities/user.entity").User[]>;
    findUserById(id: string): Promise<import("./entities/user.entity").User>;
    createRawLead(dto: CreateRawLeadDto): Promise<import("./entities/raw-lead.entity").RawLead>;
    findAllRawLeads(): Promise<import("./entities/raw-lead.entity").RawLead[]>;
    findRawLeadById(id: string): Promise<import("./entities/raw-lead.entity").RawLead>;
    createMyLead(dto: CreateMyLeadDto): Promise<import("./entities/my-lead.entity").MyLead>;
    findAllMyLeads(): Promise<import("./entities/my-lead.entity").MyLead[]>;
    findMyLeadById(id: string): Promise<import("./entities/my-lead.entity").MyLead>;
}
