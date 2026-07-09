import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('support_requests')
export class SupportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ name: 'client_name', type: 'varchar', nullable: true })
  clientName: string;

  @Column({ name: 'client_phone', type: 'varchar', nullable: true })
  clientPhone: string;

  @Column({ name: 'client_oc', type: 'varchar', nullable: true })
  clientOc: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ name: 'manager_result', type: 'text', nullable: true })
  managerResult: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
