import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../sales/entities/user.entity';

@Entity('financial_data')
export class FinancialData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'agent_name', type: 'varchar', nullable: true })
  agentName: string;

  @Column({ type: 'integer', nullable: true })
  month: number;

  @Column({ type: 'integer', nullable: true })
  year: number;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  action: string;

  @Column({ name: 'oc_code', type: 'varchar', nullable: true })
  ocCode: string;

  @Column({ name: 'client_name', type: 'varchar', nullable: true })
  clientName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  course: string;

  @Column({ type: 'timestamp', nullable: true })
  reservation: Date;

  @Column({ type: 'timestamp', nullable: true })
  attendance: Date;

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod: string;

  @Column({ type: 'varchar', nullable: true })
  offer: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paid: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'client_type', type: 'varchar', nullable: true })
  clientType: string;

  @Column({ name: 'campaign_type', type: 'varchar', nullable: true })
  campaignType: string;
}
