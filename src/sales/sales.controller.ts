import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateUserDto, CreateRawLeadDto, CreateMyLeadDto } from './dto/sales.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.salesService.createUser(dto);
  }

  @Get('users')
  findAllUsers() {
    return this.salesService.findAllUsers();
  }

  @Get('users/:id')
  findUserById(@Param('id') id: string) {
    return this.salesService.findUserById(id);
  }

  @Post('raw-leads')
  createRawLead(@Body() dto: CreateRawLeadDto) {
    return this.salesService.createRawLead(dto);
  }

  @Get('raw-leads')
  findAllRawLeads() {
    return this.salesService.findAllRawLeads();
  }

  @Get('raw-leads/:id')
  findRawLeadById(@Param('id') id: string) {
    return this.salesService.findRawLeadById(id);
  }

  @Post('my-leads')
  createMyLead(@Body() dto: CreateMyLeadDto) {
    return this.salesService.createMyLead(dto);
  }

  @Get('my-leads')
  findAllMyLeads() {
    return this.salesService.findAllMyLeads();
  }

  @Get('my-leads/:id')
  findMyLeadById(@Param('id') id: string) {
    return this.salesService.findMyLeadById(id);
  }
}
