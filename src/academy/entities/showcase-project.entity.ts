import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_bsa_showcase')
export class ShowcaseProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_project_id', type: 'varchar', nullable: true, unique: true })
  legacyProjectId: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ name: 'project_url', type: 'varchar', nullable: true })
  projectUrl: string;

  @Column({ type: 'varchar', nullable: true })
  tags: string;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ name: 'added_by', type: 'varchar', nullable: true })
  addedBy: string;

  @Column({ name: 'added_at', type: 'timestamp', nullable: true })
  addedAt: Date;
}
