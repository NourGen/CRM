import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RawLead } from './entities/raw-lead.entity';
import { MyLead } from './entities/my-lead.entity';
import { CreateUserDto, CreateRawLeadDto, CreateMyLeadDto } from './dto/sales.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RawLead)
    private readonly rawLeadRepository: Repository<RawLead>,
    @InjectRepository(MyLead)
    private readonly myLeadRepository: Repository<MyLead>,
  ) {}

  // USER CRUD
  async createUser(dto: CreateUserDto & { password?: string }): Promise<User> {
    const user = new User();
    Object.assign(user, dto);
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    } else {
      user.password = await bcrypt.hash('defaultPassword123', 10);
    }
    return this.userRepository.save(user);
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // RAW LEAD CRUD
  async createRawLead(dto: CreateRawLeadDto): Promise<RawLead> {
    const lead = this.rawLeadRepository.create(dto);
    return this.rawLeadRepository.save(lead);
  }

  async findAllRawLeads(): Promise<RawLead[]> {
    return this.rawLeadRepository.find({ relations: { agent: true } });
  }

  async findRawLeadById(id: string): Promise<RawLead> {
    const lead = await this.rawLeadRepository.findOne({ where: { id }, relations: { agent: true } });
    if (!lead) throw new NotFoundException('Raw lead not found');
    return lead;
  }

  // MY LEAD CRUD
  async createMyLead(dto: CreateMyLeadDto): Promise<MyLead> {
    const lead = this.myLeadRepository.create(dto);
    return this.myLeadRepository.save(lead);
  }

  async findAllMyLeads(): Promise<MyLead[]> {
    return this.myLeadRepository.find({ relations: { agent: true, callLogs: true } });
  }

  async findMyLeadById(id: string): Promise<MyLead> {
    const lead = await this.myLeadRepository.findOne({ where: { id }, relations: { agent: true, callLogs: true } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }
}
