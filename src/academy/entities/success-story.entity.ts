import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_success_stories')
export class SuccessStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'author_id', type: 'varchar', nullable: true })
  authorId: string;

  @Column({ name: 'author_name', type: 'varchar', nullable: true })
  authorName: string;

  @Column({ name: 'author_role', type: 'varchar', nullable: true })
  authorRole: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string; // Storing static file URL path

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'likes_count', type: 'integer', default: 0 })
  likesCount: number;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;
}
