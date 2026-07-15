import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Replaces the old Google Sheets "Distribution Sheet" (daily tabs + per-agent ranges).
// An Operation user uploads fresh leads here; sales agents pull them atomically into
// Raw_Data/My_Leads via pullFreshLeadOnly. Rows are never handed to two agents at once —
// pulls run in a DB transaction with a pessimistic row lock.
@Entity('fresh_leads')
export class FreshLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Index()
  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  phone2: string;

  @Column({ type: 'varchar', nullable: true })
  source: string;

  @Column({ type: 'varchar', nullable: true })
  campaign: string;

  @Column({ type: 'varchar', nullable: true })
  course: string;

  // Which sales agent this lead is designated for (users.name). NULL = general pool, any agent may pull.
  @Index()
  @Column({ name: 'target_agent_name', type: 'varchar', nullable: true })
  targetAgentName: string;

  // Distribution day (replaces the old "M/d" daily tab)
  @Index()
  @Column({ name: 'for_date', type: 'date' })
  forDate: string;

  @Index()
  @Column({ type: 'varchar', default: 'available' })
  status: 'available' | 'pulled' | 'duplicate';

  @Column({ name: 'pulled_by_name', type: 'varchar', nullable: true })
  pulledByName: string;

  @Column({ name: 'pulled_at', type: 'timestamp', nullable: true })
  pulledAt: Date;

  @Column({ name: 'duplicate_note', type: 'varchar', nullable: true })
  duplicateNote: string;

  @Column({ name: 'added_by_id', type: 'varchar', nullable: true })
  addedById: string;

  @Column({ name: 'added_by_name', type: 'varchar', nullable: true })
  addedByName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
