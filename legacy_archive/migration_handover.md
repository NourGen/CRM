# CRM Migration Handover Guide

This document provides a comprehensive technical overview of the modifications, architecture, and bug fixes applied to the NestJS + PostgreSQL CRM system. This serves as a direct reference for porting the work to another project.

---

## 1. GAS Compatibility Layer Architecture

The legacy frontend (`public/portal/index.html`) relies heavily on `google.script.run` for asynchronous Google Apps Script execution. Instead of modifying the thousands of client-side calls in the HTML file, we built a **Compatibility Layer** in the NestJS backend to intercept and execute these requests on PostgreSQL.

### API Endpoint Mapping
* **Route**: `POST /api/gas/execute`
* **Controller**: `GasController` (`src/gas/gas.controller.ts`)
* **Service**: `GasService` (`src/gas/gas.service.ts`)

Every client-side call of form `google.script.run.withSuccessHandler(cb).functionName(arg1, arg2)` is captured by a frontend fetch proxy and mapped to this endpoint. The controller routes `functionName` to the equivalent database-backed service method.

---

## 2. Core Implemented Functions

The following Google Apps Script functions have been fully rewritten to read/write using TypeORM entities instead of Google Sheets:

| Function Name | Description | Related Entities |
| :--- | :--- | :--- |
| `login` | Validates username/password hashes. | `User` |
| `validateSession` | Validates session storage and page rights. | `User` |
| `getClientById` | Fetches a single client with chronologically split call logs, correct campaigns, and formatted badges. | `MyLead`, `RawLead`, `LeadCallLog` |
| `getClientByPhone` | Fast client details lookup by phone number. | `MyLead`, `RawLead` |
| `searchHistoryFast` | Full text phone search returned in array format for search page. | `MyLead`, `RawLead` |
| `getDueFollowUps` | Aggregates upcoming follow-ups grouped by due/upcoming. | `MyLead` |
| `getWaitingClients` | Lists pre-booking waiting leads, excluding round-enrolled/paid clients. | `MyLead`, `RoundMember`, `ClientPayment` |
| `getFinancialData` | Real-time calculation of commissions, total collected, unpaid amounts, and agent targets. | `FinancialData`, `ClientPayment`, `PaymentTransaction` |
| `getRounds` | Returns all active and online study rounds. | `Round` |
| `getRoundDetail` | Returns round information, scheduling, and lists enrolled members. | `Round`, `RoundMember` |
| `updateLeadWithFollowUp` | Saves call notes, schedules follow-up dates, updates lead status, and logs payments safely. | `MyLead`, `RawLead`, `LeadCallLog`, `ClientPayment` |

---

## 3. Critical Bug Fixes & Adjustments

### 3.1 Database Cast Type Exception (UUID Crash Guard)
* **Problem**: The system primary key type for `User`, `MyLead`, and `RawLead` is `UUID`. Whenever a legacy search parameter (such as a 32-character Hex ID `946f07a3...` or a numeric ID `449715`) was queried against the `id` column, PostgreSQL threw an `invalid input syntax for type uuid` exception, crashing the query.
* **Fix**: Implemented a format check in all search queries:
  ```typescript
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
  ```
  If it fails the UUID test, the database **only** searches the `legacyId` / `ocCode` varchar columns, guaranteeing a safe, crash-free query.

### 3.2 Chronological Call Log Separation
* **Problem**: Call notes were merged into a single multi-line string block, showing only one box in the UI.
* **Fix**: Rewrote `getClientById` to split the text logs by newline (`\n`), allowing the frontend success callback to render individual history entries on separate cards.

### 3.3 Status Badges & Marketing Sources
* **Problem**: Badges like the red `Need Follow Up` pill were missing, and the marketing source fell back to showing `Campaign` twice.
* **Fix**: Mapped `lastAction` strictly to `lead.status` instead of the full notes string, allowing `badge(r.lastAction)` to render properly. Disentangled `source` and `campaign` mapping to pull from separate database columns.

### 3.4 User Permissions Sync & Sidebar Filters
* **Problem**: Legacies pages list permissions were stored in column 7 (index 6) of the `Users` sheet, but the migration script read it from index 4, causing all sales agents to have empty permissions `[]` and access forbidden pages (like claiming fresh leads or viewing finance portals).
* **Fix**: Created an Excel synchronization script to correctly map permissions to the JSON array in the database. Updated the agent `nour@bsa` permissions to exactly match the 15 active pages of their live account.

---

## 4. Production Deployment Checklist (Domain & Cloudflare)

When deploying this project to an external VPS behind Cloudflare, verify the following settings:

1. **Proxy Trust**: Enable proxy headers in `src/main.ts` so NestJS correctly resolves IP addresses forwarded by Cloudflare:
   ```typescript
   app.getHttpAdapter().getInstance().set('trust proxy', true);
   ```
2. **Cloudflare SSL settings**: Set SSL/TLS encryption to **Full** or **Full (strict)**.
3. **Environment `.env`**: Make sure connection variables (`DB_HOST`, `DB_PORT`, `DB_PASSWORD`, `DB_NAME`) reflect the target production database instance.
