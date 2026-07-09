import { AcademyContent } from './academy-content.entity';
export declare class QuizBank {
    id: string;
    lectureLegacyId: string;
    lecture: AcademyContent;
    lectureName: string;
    instructor: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct: number;
    notes: string;
}
