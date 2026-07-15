import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_bsa_orientations')
export class BsaOrientation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName: string;

  @Column({ name: 'file_id', type: 'varchar', nullable: true })
  fileId: string;

  @Column({ type: 'varchar', nullable: true }) // 'orientation' or 'reference_project'
  type: string;

  @Column({ name: 'instructor_tag', type: 'varchar', nullable: true })
  instructorTag: string;

  @Column({ name: 'added_at', type: 'timestamp', nullable: true })
  addedAt: Date;
}
