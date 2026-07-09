import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AcademyContent } from './academy-content.entity';

@Entity('quiz_bank')
export class QuizBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lecture_legacy_id', type: 'varchar', nullable: true })
  lectureLegacyId: string;

  @ManyToOne(() => AcademyContent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: AcademyContent;

  @Column({ name: 'lecture_name', type: 'varchar', nullable: true })
  lectureName: string;

  @Column({ type: 'varchar', nullable: true })
  instructor: string;

  @Column({ type: 'text', nullable: true })
  question: string;

  @Column({ name: 'option_a', type: 'text', nullable: true })
  optionA: string;

  @Column({ name: 'option_b', type: 'text', nullable: true })
  optionB: string;

  @Column({ name: 'option_c', type: 'text', nullable: true })
  optionC: string;

  @Column({ name: 'option_d', type: 'text', nullable: true })
  optionD: string;

  @Column({ type: 'integer', nullable: true })
  correct: number; // 1-4

  @Column({ type: 'text', nullable: true })
  notes: string;
}
