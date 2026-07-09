import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MyLead } from './my-lead.entity';

@Entity('lead_call_logs')
export class LeadCallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MyLead, (lead) => lead.callLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: MyLead;

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  note: string;
}
