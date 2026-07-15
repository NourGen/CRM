import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Manual lecture unlocks granted by an admin (mirrors the new Academy_Unlocks sheet)
@Entity('academy_unlocks')
export class AcademyUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'varchar' })
  studentId: string;

  @Index()
  @Column({ name: 'lecture_id', type: 'varchar' })
  lectureId: string;

  @Column({ name: 'unlocked_by', type: 'varchar', nullable: true })
  unlockedBy: string;

  @CreateDateColumn({ name: 'unlocked_at', type: 'timestamp' })
  unlockedAt: Date;
}
