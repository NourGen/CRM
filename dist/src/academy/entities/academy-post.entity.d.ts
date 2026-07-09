import { AcademyContent } from './academy-content.entity';
export declare class AcademyPost {
    id: string;
    legacyId: string;
    contextType: string;
    lectureLegacyId: string;
    lecture: AcademyContent;
    authorId: string;
    authorType: string;
    authorName: string;
    content: string;
    parentId: string;
    parent: AcademyPost;
    replies: AcademyPost[];
    legacyParentId: string;
    likeCount: number;
    createdAt: Date;
    deleted: boolean;
}
