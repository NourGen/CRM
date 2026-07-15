import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AcademyContent } from './academy-content.entity';

@Entity('academy_support_files')
export class AcademySupportFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'lecture_legacy_id', type: 'varchar', nullable: true })
  lectureLegacyId: string;

  @ManyToOne(() => AcademyContent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: AcademyContent;

  @Column({ name: 'lecture_name', type: 'varchar', nullable: true })
  lectureName: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ name: 'drive_file_id', type: 'varchar', nullable: true })
  driveFileId: string;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName: string;

  @Column({ name: 'file_type', type: 'varchar', nullable: true })
  fileType: string;

  @Column({ type: 'varchar', nullable: true })
  url: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string;

  // Instructor grouping for CRM-managed support files (old CRM sheet stored files per instructor tag)
  @Column({ name: 'instructor_tag', type: 'varchar', nullable: true })
  instructorTag: string;
}
