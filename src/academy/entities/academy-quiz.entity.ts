import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AcademyContent } from './academy-content.entity';
import { Round } from './round.entity';

@Entity('academy_quizzes')
export class AcademyQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'lecture_legacy_id', type: 'varchar', nullable: true })
  lectureLegacyId: string;

  @ManyToOne(() => AcademyContent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: AcademyContent;

  @Column({ name: 'round_legacy_id', type: 'varchar', nullable: true })
  roundLegacyId: string;

  @ManyToOne(() => Round, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'lecture_name', type: 'varchar', nullable: true })
  lectureName: string;

  @Column({ name: 'questions_json', type: 'simple-json', nullable: true })
  questionsJson: any;

  @Column({ name: 'pass_score', type: 'integer', nullable: true })
  passScore: number;

  @Column({ name: 'quiz_size', type: 'integer', nullable: true })
  quizSize: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
