import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RawLead } from './entities/raw-lead.entity';
import { MyLead } from './entities/my-lead.entity';
import { CreateUserDto, CreateRawLeadDto, CreateMyLeadDto } from './dto/sales.dto';
export declare class SalesService {
    private readonly userRepository;
    private readonly rawLeadRepository;
    private readonly myLeadRepository;
    constructor(userRepository: Repository<User>, rawLeadRepository: Repository<RawLead>, myLeadRepository: Repository<MyLead>);
    createUser(dto: CreateUserDto & {
        password?: string;
    }): Promise<User>;
    findAllUsers(): Promise<User[]>;
    findUserById(id: string): Promise<User>;
    createRawLead(dto: CreateRawLeadDto): Promise<RawLead>;
    findAllRawLeads(): Promise<RawLead[]>;
    findRawLeadById(id: string): Promise<RawLead>;
    createMyLead(dto: CreateMyLeadDto): Promise<MyLead>;
    findAllMyLeads(): Promise<MyLead[]>;
    findMyLeadById(id: string): Promise<MyLead>;
}
