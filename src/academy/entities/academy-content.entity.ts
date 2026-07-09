import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Round } from './round.entity';

@Entity('academy_content')
export class AcademyContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'round_name', type: 'varchar', nullable: true })
  roundName: string;

  @Column({ name: 'lecture_order', type: 'integer', nullable: true })
  lectureOrder: number;

  @Column({ name: 'lecture_name', type: 'varchar', nullable: true })
  lectureName: string;

  @Column({ name: 'drive_file_id', type: 'varchar', nullable: true })
  driveFileId: string;

  @Column({ name: 'file_type', type: 'varchar', nullable: true })
  fileType: string;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'task_required', type: 'boolean', default: false })
  taskRequired: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
