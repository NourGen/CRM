import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_dms')
export class AcademyDM {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_msg_id', type: 'varchar', nullable: true, unique: true })
  legacyMsgId: string;

  @Column({ name: 'from_id', type: 'varchar', nullable: true })
  fromId: string;

  @Column({ name: 'from_name', type: 'varchar', nullable: true })
  fromName: string;

  @Column({ name: 'to_id', type: 'varchar', nullable: true })
  toId: string;

  @Column({ name: 'to_name', type: 'varchar', nullable: true })
  toName: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;
}
