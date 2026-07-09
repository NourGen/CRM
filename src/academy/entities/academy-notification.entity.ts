import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_notifications')
export class AcademyNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'recipient_id', type: 'varchar', nullable: true })
  recipientId: string;

  @Column({ name: 'recipient_type', type: 'varchar', nullable: true })
  recipientType: string;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'ref_id', type: 'varchar', nullable: true })
  refId: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
