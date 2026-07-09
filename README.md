# BSA CRM Database Migration & Backend Application

This project is a complete NestJS + TypeScript + TypeORM application designed to migrate the BSA Academy & CRM data from a Google Sheet Excel dump (`جوجل شيت الرئيسي.xlsx`) to a structured PostgreSQL database, and expose REST APIs for the sales, academy, and financial departments.

---

## 1. Database Schema & Relationships

The database is divided into three distinct modules:

### A. Sales & Leads Module
- **User (`users`)**: Represents salespeople and managers. Contains hashed passwords and permission lists.
- **RawLead (`raw_leads`)**: Extracted lead details from raw advertisements.
- **MyLead (`my_leads`)**: Leads assigned to specific users. Relates to `User`.
- **LeadCallLog (`lead_call_logs`)**: Chronological logs of calls made to leads. Relates to `MyLead`.
- **ExceptionRequest (`exception_requests`)**: Discount/exception requests submitted by agents. Relates to `User`.
- **SupportRequest (`support_requests`)**: Lead issues that require management attention. Relates to `User`.
- **BreakLog (`break_logs`)**: Login, logout, and break tracking logs for agents. Relates to `User`.
- **Celebration (`celebrations`)**: Internal notification alerts for sales achievements.
- **Task (`tasks`)**: To-do tasks assigned to users.
- **ActivityLog (`activity_logs`)**: System audit log of user actions. Relates to `User`.

### B. Academy Module
- **Student (`academy_students`)**: Hashed student accounts.
- **Instructor (`academy_instructors`)**: Hashed instructor accounts.
- **Round (`rounds`)**: Course rounds and cohorts.
- **RoundMember (`round_members`)**: Students registered in a cohort, including payment status. Relates to `Round` and `User` (as Sales agent).
- **AttendanceRecord (`rounds_attendance`)**: Attendance list and homework submissions per round session. Relates to `Round`.
- **Enrollment (`academy_enrollments`)**: Student enrollment records in rounds. Relates to `Student` and `Round`.
- **AcademyContent (`academy_content`)**: Lectures, locked state, and required assignments. Relates to `Round`.
- **AcademyProgress (`academy_progress`)**: Tracks student video watching progress. Relates to `Student` and `AcademyContent`.
- **AcademyTask (`academy_tasks`)**: Homework submissions by students. Relates to `Student`, `Round`, and `AcademyContent`.
- **AcademyFinalProject (`academy_final_projects`)**: Student final projects submissions. Relates to `Student` and `Round`.
- **AcademyQuiz (`academy_quizzes`)**: Quizzes associated with rounds. Relates to `Round` and `AcademyContent`.
- **QuizBank (`quiz_bank`)**: Question bank with options and correct answers. Relates to `AcademyContent`.
- **QuizAttempt (`academy_quiz_attempts`)**: Student quiz attempt records. Relates to `Student` and `AcademyContent`.
- **QuizResult (`academy_quiz_results`)**: Grades, passed status, and scores. Relates to `Student` and `AcademyContent`.
- **LiveSession (`academy_live_sessions`)**: Meet links and session schedules. Relates to `Round`.
- **AcademySupport (`academy_support`)**: Support tickets. Relates to `Student`.
- **AcademySupportFile (`academy_support_files`)**: Support files uploaded by instructors. Relates to `AcademyContent`.
- **AcademyPost (`academy_posts`)**: Merged table for `Academy_Comments` and `Academy_Community` with self-referential `parent_id` (threaded replies). Relates to `AcademyContent` (null for community context).
- **AcademyReaction (`academy_reactions`)**: Reaction tracker for posts/comments (polymorphic relationship).
- **AcademyDM (`academy_dms`)**: Direct messages between students/staff.
- **AcademyNotification (`academy_notifications`)**: In-app notifications.
- **AcademyFriend (`academy_friends`)**: Friendships between students.
- **SuccessStory (`academy_success_stories`)**: Approved success stories. Store images as local files (saved to `/uploads/success_stories/`) and links them by `image_url`.
- **ShowcaseProject (`academy_bsa_showcase`)**: Showcase student projects.

### C. Financial Module
- **AcademyLedger (`academy_ledger`)**: Main registry of billing and invoice logs.
- **Installment (`installments`)**: Normalized payments split from ledger columns. Relates to `AcademyLedger`.
- **ClientPayment (`client_payments`)**: Customer payments records. Relates to `User` (Agent) and `Round`.
- **PaymentTransaction (`payment_transactions`)**: Individual payment transaction details. Relates to `ClientPayment` and `User` (Agent).
- **FinancialData (`financial_data`)**: Financial report metrics. Relates to `User` (Agent).
- **LecturerSalary (`lecturer_salaries`)**: Lecturer salary billing records. Relates to `Round`.
- **Expense (`bsa_expenses`)**: Internal expenses list.
- **WalletIncome (`wallet_income`)**: Income tracking for wallets.
- **WalletAdjustment (`bsa_wallet_adjustments`)**: Adjustments.
- **WalletTransfer (`bsa_wallet_transfers`)**: Internal transfers.
- **Offer (`offers`)**: Active discounts and offers.
- **Course (`courses`)**: Master list of courses.

---

## 2. Running the Migration

The migration script reads data from `جوجل شيت الرئيسي.xlsx`, applies sanitization, splits complex cells, hashes passwords, processes base64 images into static files, and imports everything in topological order.

### Pre-requisites
Make sure you copy the Excel file `جوجل شيت الرئيسي.xlsx` into the root directory of the project.

### Step-by-Step
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your database details (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`).
3. Run the migration command:
   ```bash
   npm run migrate
   ```
This will output a summary report containing migrated count, failed count, and details of any errors encountered during the import.

---

## 3. Local Development

### Installation
```bash
npm install
```

### Running Server
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

---

## 4. Deploying to Railway

The project is pre-configured with `railway.json` and uses the Nixpacks builder.

1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Add a **PostgreSQL** service to your Railway project.
3. Configure the environment variables in your NestJS app service on Railway:
   - `DB_HOST`: `${{ Postgres.DATABASE_URL }}` (or map individually as `HOST`, `PORT`, `USER`, `PASSWORD`, `DB` using Railway template variables).
   - `DB_PORT`: `5432`
   - `DB_USERNAME`: `${{ Postgres.POSTGRES_USER }}`
   - `DB_PASSWORD`: `${{ Postgres.POSTGRES_PASSWORD }}`
   - `DB_NAME`: `${{ Postgres.POSTGRES_DB }}`
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
4. Deploy the service. NIXPACKS will compile the TypeScript code and start the server using `npm run start:prod`.
5. Run the migration against the live database from your local machine by setting the `.env` database details to your Railway production credentials and running `npm run migrate`.

---

## 5. REST API Endpoints

The app exposes standard CRUD operations. Major endpoints include:

### Sales
- `POST /sales/users` - Create user
- `GET /sales/users` - Retrieve all users
- `GET /sales/users/:id` - Retrieve user by ID
- `POST /sales/raw-leads` - Create raw lead
- `GET /sales/raw-leads` - Retrieve all raw leads
- `GET /sales/raw-leads/:id` - Retrieve raw lead by ID
- `POST /sales/my-leads` - Create my lead
- `GET /sales/my-leads` - Retrieve all leads
- `GET /sales/my-leads/:id` - Retrieve lead by ID

### Academy
- `POST /academy/students` - Create student
- `GET /academy/students` - Retrieve all students
- `GET /academy/students/:id` - Retrieve student by ID
- `POST /academy/instructors` - Create instructor
- `GET /academy/instructors` - Retrieve all instructors
- `GET /academy/instructors/:id` - Retrieve instructor by ID
- `POST /academy/rounds` - Create round
- `GET /academy/rounds` - Retrieve all rounds
- `GET /academy/rounds/:id` - Retrieve round by ID

### Financial
- `POST /financial/ledger` - Create ledger record
- `GET /financial/ledger` - Retrieve ledger records
- `GET /financial/ledger/:id` - Retrieve ledger record by ID
- `POST /financial/payments` - Create client payment record
- `GET /financial/payments` - Retrieve all client payments
- `GET /financial/payments/:id` - Retrieve payment record by ID
