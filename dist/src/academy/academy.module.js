"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademyModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_entity_1 = require("./entities/student.entity");
const instructor_entity_1 = require("./entities/instructor.entity");
const round_entity_1 = require("./entities/round.entity");
const round_member_entity_1 = require("./entities/round-member.entity");
const attendance_record_entity_1 = require("./entities/attendance-record.entity");
const enrollment_entity_1 = require("./entities/enrollment.entity");
const academy_content_entity_1 = require("./entities/academy-content.entity");
const academy_progress_entity_1 = require("./entities/academy-progress.entity");
const academy_task_entity_1 = require("./entities/academy-task.entity");
const academy_final_project_entity_1 = require("./entities/academy-final-project.entity");
const academy_quiz_entity_1 = require("./entities/academy-quiz.entity");
const quiz_bank_entity_1 = require("./entities/quiz-bank.entity");
const quiz_attempt_entity_1 = require("./entities/quiz-attempt.entity");
const quiz_result_entity_1 = require("./entities/quiz-result.entity");
const live_session_entity_1 = require("./entities/live-session.entity");
const academy_support_entity_1 = require("./entities/academy-support.entity");
const academy_support_file_entity_1 = require("./entities/academy-support-file.entity");
const academy_post_entity_1 = require("./entities/academy-post.entity");
const academy_reaction_entity_1 = require("./entities/academy-reaction.entity");
const academy_dm_entity_1 = require("./entities/academy-dm.entity");
const academy_notification_entity_1 = require("./entities/academy-notification.entity");
const academy_friend_entity_1 = require("./entities/academy-friend.entity");
const success_story_entity_1 = require("./entities/success-story.entity");
const showcase_project_entity_1 = require("./entities/showcase-project.entity");
const academy_service_1 = require("./academy.service");
const academy_controller_1 = require("./academy.controller");
let AcademyModule = class AcademyModule {
};
exports.AcademyModule = AcademyModule;
exports.AcademyModule = AcademyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                instructor_entity_1.Instructor,
                round_entity_1.Round,
                round_member_entity_1.RoundMember,
                attendance_record_entity_1.AttendanceRecord,
                enrollment_entity_1.Enrollment,
                academy_content_entity_1.AcademyContent,
                academy_progress_entity_1.AcademyProgress,
                academy_task_entity_1.AcademyTask,
                academy_final_project_entity_1.AcademyFinalProject,
                academy_quiz_entity_1.AcademyQuiz,
                quiz_bank_entity_1.QuizBank,
                quiz_attempt_entity_1.QuizAttempt,
                quiz_result_entity_1.QuizResult,
                live_session_entity_1.LiveSession,
                academy_support_entity_1.AcademySupport,
                academy_support_file_entity_1.AcademySupportFile,
                academy_post_entity_1.AcademyPost,
                academy_reaction_entity_1.AcademyReaction,
                academy_dm_entity_1.AcademyDM,
                academy_notification_entity_1.AcademyNotification,
                academy_friend_entity_1.AcademyFriend,
                success_story_entity_1.SuccessStory,
                showcase_project_entity_1.ShowcaseProject,
            ]),
        ],
        providers: [academy_service_1.AcademyService],
        controllers: [academy_controller_1.AcademyController],
        exports: [typeorm_1.TypeOrmModule, academy_service_1.AcademyService],
    })
], AcademyModule);
//# sourceMappingURL=academy.module.js.map