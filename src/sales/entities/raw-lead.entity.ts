import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { User } from './user.entity';

@Entity('raw_leads')
export class RawLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Permanent, sequential, human-facing client number — DB-native AUTO_INCREMENT, never reused even after deletes.
  // Internal relations still use `id` (uuid); this is purely the display/reference identifier.
  @Column({ name: 'client_number', type: 'int', unique: true })
  @Generated('increment')
  clientNumber: number;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  source: string;

  @Column({ type: 'varchar', nullable: true })
  course: string;

  @Column({ name: 'agent_legacy_id', type: 'varchar', nullable: true })
  agentLegacyId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', nullable: true })
  action: string;

  @Column({ name: 'new_action', type: 'varchar', nullable: true })
  newAction: string;

  @Column({ name: 'follow_up_date', type: 'timestamp', nullable: true })
  followUpDate: Date;

  @Column({ name: 'campaign_type', type: 'varchar', nullable: true })
  campaignType: string;

  @Column({ name: 'last_modified', type: 'timestamp', nullable: true })
  lastModified: Date;

  @Column({ name: 'oc_code', type: 'varchar', nullable: true })
  ocCode: string;
}
