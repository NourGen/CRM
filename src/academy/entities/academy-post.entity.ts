import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AcademyContent } from './academy-content.entity';

@Entity('academy_posts')
export class AcademyPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true })
  legacyId: string;

  @Column({ name: 'context_type', type: 'varchar' }) // 'lecture' | 'community'
  contextType: string;

  @Column({ name: 'lecture_legacy_id', type: 'varchar', nullable: true })
  lectureLegacyId: string;

  @ManyToOne(() => AcademyContent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecture_id' })
  lecture: AcademyContent;

  @Column({ name: 'author_id', type: 'varchar', nullable: true })
  authorId: string; // Student, User, or Instructor legacy ID

  @Column({ name: 'author_type', type: 'varchar', nullable: true })
  authorType: string;

  @Column({ name: 'author_name', type: 'varchar', nullable: true })
  authorName: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'parent_id', type: 'varchar', length: 36, nullable: true })
  parentId: string;

  @ManyToOne(() => AcademyPost, (post) => post.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: AcademyPost;

  @OneToMany(() => AcademyPost, (post) => post.parent)
  replies: AcademyPost[];

  @Column({ name: 'legacy_parent_id', type: 'varchar', nullable: true })
  legacyParentId: string;

  @Column({ name: 'like_count', type: 'integer', default: 0 })
  likeCount: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;
}
