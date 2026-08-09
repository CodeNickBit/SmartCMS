# SmartCMS — Smart Corporate Management System

A production-grade, full-stack corporate HRMS built on the **MEAN** stack. SmartCMS covers the full employee lifecycle — from onboarding through offboarding — with attendance geo-fencing, multi-level leave approvals, configurable payroll, project & task management, asset tracking, expense reimbursement, and a clean role-based UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 19+, Tailwind CSS, TypeScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT, bcryptjs, Email OTP verification |
| **File Uploads** | Multer (local `uploads/` directory) |
| **Scheduled Jobs** | node-cron |
| **Email** | Nodemailer |
| **Testing** | Jest, fast-check |
| **Dev Tooling** | Nodemon |

---

## Project Structure

```
SmartCMS/
├── backend/                          # Node.js / Express API server (port 3000)
│   ├── controllers/                  # Business logic per domain
│   ├── middleware/                   # authMiddleware, error handlers
│   ├── models/                       # Mongoose schemas (24 models)
│   ├── routes/                       # API route definitions (18 route files)
│   ├── jobs/                         # node-cron scheduled tasks (markAbsent)
│   ├── services/                     # Shared service utilities
│   ├── utils/                        # Helpers (email, ID generation)
│   ├── uploads/                      # Multer upload destination
│   ├── scripts/                      # One-off data seeding scripts
│   └── server.js                     # App entry point
│
└── smart-cms/                        # Angular 19 SPA (port 4200)
    └── src/app/
        ├── admin/                    # Admin-only pages
        │   ├── dashboard/            # Admin overview dashboard
        │   ├── add-user/             # Register new employee
        │   ├── add-manager/          # Register new manager
        │   ├── manage-employee/      # Employee directory & management
        │   ├── manage-hr/            # HR account management
        │   ├── manage-department/    # Department CRUD
        │   ├── manage-designation/   # Designation CRUD
        │   ├── manage-assets/        # Company asset management
        │   ├── attendance-settings/  # Geo-fence & grace period config
        │   ├── leave-policy/         # Leave entitlement policies
        │   ├── payroll-settings/     # Salary component & template config
        │   ├── payroll-dashboard/    # Payslip generation & approval
        │   ├── year-end-processing/  # Year-end payroll operations
        │   ├── workflow-templates/   # Onboarding/offboarding templates
        │   ├── employee-workflow/    # Per-employee onboarding/offboarding tasks
        │   └── reports/              # HR & payroll reports
        │
        ├── dashboard/                # Shared dashboard (HR, Manager, Employee)
        │   ├── attendance/           # Attendance records view
        │   ├── employees/            # HR: employee directory
        │   ├── manage-managers/      # HR: manager management
        │   ├── leave-approvals/      # HR/Manager: leave approval queue
        │   ├── manager-approvals/    # Manager: pending approvals
        │   ├── my-team/              # Manager: team overview
        │   ├── team-calendar/        # Team leave calendar
        │   ├── my-leaves/            # Employee: leave history
        │   ├── my-payroll/           # Employee: payslip self-service
        │   ├── my-profile/           # Employee: profile management
        │   ├── my-assets/            # Employee: assigned assets view
        │   ├── my-expenses/          # Employee: expense submission
        │   ├── expense-approvals/    # HR/Manager: expense approval queue
        │   ├── escalation-log/       # Attendance escalation log
        │   └── components/           # Shared sidebar, header, modals
        │
        ├── home/                     # Employee home dashboard (/home)
        ├── projects/                 # Full project & task management module
        │   ├── project-list/         # All projects view
        │   ├── project-detail/       # Project detail & milestones
        │   ├── project-form/         # Create/edit project
        │   ├── project-analytics/    # Project analytics dashboard
        │   ├── my-tasks/             # Employee: assigned tasks
        │   ├── task-detail/          # Task details, comments, activity log
        │   ├── timesheet/            # Per-employee timesheet
        │   └── workload/             # Project workload view
        │
        ├── login/                    # Login page
        ├── signup/                   # Admin-initiated employee onboarding form
        ├── landing/                  # Public landing page
        ├── guards/                   # Route guards (adminGuard, authGuard, managerHrGuard)
        ├── interceptors/             # HTTP auth interceptor (JWT injection)
        ├── services/                 # 20 injectable Angular services
        └── shared/                   # Shared components & utilities
```

---

## User Roles (RBAC)

| Role | Access Level |
|---|---|
| **Admin** | Full system — users, departments, designations, assets, payroll settings, workflow templates, reports |
| **HR** | Employee management, leave & attendance approvals, payroll overview, expense approvals, workflow tasks |
| **Manager** | Team oversight, leave & attendance approvals, expense approvals, task assignment, employee workflow |
| **Employee** | Personal dashboard — clock-in/out, leaves, payslips, tasks, assets, expenses |

> **Enforced at every layer**: Angular route guards (`adminGuard`, `managerHrGuard`, `authGuard`) + JWT middleware on every API endpoint.

---

## Frontend Routes

| Route | Component | Guard |
|---|---|---|
| `/` | Landing page | — |
| `/login` | Login | — |
| `/signup` | Employee registration form | — |
| `/home` | Employee home dashboard | `authGuard` |
| `/admin/dashboard` | Admin overview | `adminGuard` |
| `/admin/add-users` | Register employee | `adminGuard` |
| `/admin/add-manager` | Register manager | `adminGuard` |
| `/admin/manage-employee` | Employee directory | `adminGuard` |
| `/admin/manage-hr` | HR management | `adminGuard` |
| `/admin/manage-department` | Departments | `adminGuard` |
| `/admin/manage-designation` | Designations | `adminGuard` |
| `/admin/manage-assets` | Asset management | `adminGuard` |
| `/admin/attendance-settings` | Geo-fence config | `adminGuard` |
| `/admin/leave-policy` | Leave policy | `adminGuard` |
| `/admin/payroll-settings` | Salary config | `adminGuard` |
| `/admin/payroll-dashboard` | Payslip management | `adminGuard` |
| `/admin/year-end` | Year-end processing | `adminGuard` |
| `/admin/reports` | Reports | `adminGuard` |
| `/admin/workflow-templates` | Workflow template builder | `adminGuard` |
| `/admin/employee-workflow/:id` | Per-employee workflow tasks | `adminGuard` |
| `/dashboard` | Shared dashboard (HR/Manager) | `managerHrGuard` |
| `/dashboard/employees` | HR employee directory | `managerHrGuard` |
| `/dashboard/manage-managers` | HR manager list | `managerHrGuard` |
| `/dashboard/leave-approvals` | Leave approval queue | `managerHrGuard` |
| `/dashboard/manager-approvals` | Manager approval queue | `managerHrGuard` |
| `/dashboard/my-team` | Manager team view | `managerHrGuard` |
| `/dashboard/team-calendar` | Team leave calendar | `managerHrGuard` |
| `/dashboard/attendance` | Attendance records | `managerHrGuard` |
| `/dashboard/expense-approvals` | Expense approval queue | `managerHrGuard` |
| `/dashboard/workflow-templates` | Workflow templates (HR/Mgr) | `managerHrGuard` |
| `/dashboard/employee-workflow/:id` | Employee workflow (HR/Mgr) | `managerHrGuard` |
| `/dashboard/my-leaves` | My leave history | `authGuard` |
| `/dashboard/my-payroll` | My payslips | `authGuard` |
| `/dashboard/my-assets` | My assigned assets | `authGuard` |
| `/dashboard/my-expenses` | My expense claims | `authGuard` |
| `/dashboard/escalation-log` | Attendance escalation log | `authGuard` |
| `/projects` | Project list | `authGuard` |
| `/projects/new` | Create project | `authGuard` |
| `/projects/analytics` | Project analytics | `authGuard` |
| `/projects/:id` | Project detail | `authGuard` |
| `/projects/:id/edit` | Edit project | `authGuard` |
| `/projects/:id/workload` | Workload view | `authGuard` |
| `/my-tasks` | My tasks | `authGuard` |
| `/tasks/:id` | Task detail | `authGuard` |
| `/timesheets/:employeeId` | Timesheet | `authGuard` |

---

## Modules — Detailed Breakdown

### 1. Authentication & Security
- JWT-based login with role auto-detection (Admin, HR, Manager, Employee use separate models)
- Email OTP verification for new accounts
- bcrypt password hashing (salt rounds 10)
- HTTP interceptor injects `Authorization: Bearer <token>` on every outbound API call
- Three route guards protecting frontend routes by role

---

### 2. Employee Management
- **Admin registers all employees** — no public self-registration
- Registration form captures:
  - Personal: name, DOB, gender, marital status, contact, emergency contact
  - Gender-conditional fields: guardian/spouse details for female employees
  - Professional: department, designation, reporting manager, joining date, employment type, work location, shift type
  - Work & Pay: working hours, wage type, salary template, bank details, PF/ESIC eligibility
- **11-digit numeric Employee IDs**: auto-generated as `YYMMDD + 5 random digits`, stored as the MongoDB `_id`
- Department & designation master data managed by Admin
- Employee can be activated/deactivated (`active_inactive` flag)
- Pregnancy tracking fields for maternity-eligible employees
- Last name edit rules (one-time change allowed)

---

### 3. Onboarding & Offboarding Workflows ✅
- **Admin** creates reusable **Workflow Templates** (`onboarding` or `offboarding` type)
- Each template contains a checklist of tasks, each specifying:
  - Task title & description
  - Role responsible: `Admin`, `Hr`, `Manager`, `Reporting_Manager`
  - Optional department filter (e.g., "IT department gets the laptop task")
  - Estimated hours
- When an employee joins or resigns, the Admin (or HR/Manager) triggers the workflow from the **Employee Workflow** page (`/admin/employee-workflow/:id` or `/dashboard/employee-workflow/:id`)
- Workflow tasks are stored as `Task` documents with `taskType: 'onboarding' | 'offboarding'` linked to the employee via `relatedUserId`
- Each role sees only the tasks assigned to them and can update task status
- Admin has full visibility and can update any task regardless of role

---

### 4. Attendance Management
- **Geo-fenced clock-in / clock-out**: employee's GPS coordinates are validated against registered office locations
- Distance from office is calculated and stored; flags are set for location mismatch, new device, unusual times, multiple check-ins
- Attendance statuses: `present`, `absent`, `late`, `half-day`, `on_leave`
- Approval workflow: attendance records go through `pending → approved / declined / auto_closed`
- **Correction requests**: employees can request attendance corrections with a reason; manager reviews and approves/declines
- **Audit log** embedded in every attendance record (who did what and when)
- **Auto mark-absent cron job**: runs daily at 19:30 IST via `node-cron`, marks employees who did not clock in
- **Escalation log**: late arrivals, geo-fence mismatches, and out-of-office events are logged separately
- Admin configures grace periods, geofence radius, and office location coordinates via Attendance Settings

---

### 5. Leave Management
- Policy-driven leave types (Annual, Sick, Casual, etc.) configured by Admin in Leave Policy
- Configurable per-type annual limits, minimum notice hours, and general rules
- Employee leave application supports:
  - Full-day and half-day (first/second half) leaves
  - File attachments (required for medical/sick leaves)
  - Edit & cancel within configurable modification window
- **Multi-level approval flow**: Employee → Manager → HR
- **Manager OOO escalation**: when the reporting manager is on leave, new leave requests auto-route to a configured proxy manager or HR
- Leave balance is tracked per employee and per leave type, deducted on approval
- Leave history table with status badges and rejection reasons
- Manager can request changes back to the employee (`Changes Requested` status)

---

### 6. Payroll
- **Salary Components** (`SalaryComponent`): Admin defines earnings and deductions (flat or percentage-based)
- **Salary Templates** (`SalaryTemplate`): reusable packages of salary components applied to employee groups
- **Per-employee overrides**: individual component amounts can be overridden on the employee profile
- **Payslip lifecycle**: `draft → pending_approval → approved → locked → rejected`
- Payslip stores full component breakdown, gross earnings, total deductions, net pay, and paid/LOP days
- **LOP rules**: configurable loss-of-pay based on absences; late marks can optionally count toward LOP after a threshold
- **Overtime rules**: configurable multiplier and working hours per day
- **Year-end processing**: dedicated admin module for annual payroll operations
- Employee self-service payslip view at `/dashboard/my-payroll`
- **Salary revisions** tracked in `SalaryRevision` model

---

### 7. Project & Task Management
- Full project lifecycle: create → assign team → track tasks → analytics
- **Projects** (`Project` model): milestones, team members, project manager
- **Tasks** (`Task` model):
  - Types: `project`, `onboarding`, `offboarding`
  - Statuses: `todo`, `in_progress`, `in_review`, `done`, `blocked`
  - Priorities: `low`, `medium`, `high`, `critical`
  - Assignable to any role model (`User`, `Manager`, `Hr`, `Admin`)
  - Rich task detail: description, due date, estimated hours, logged hours, parent task (sub-tasks)
  - Comments thread with author name, role, and timestamp
  - File attachments on tasks
  - Activity log embedded in every task
- **Timesheet**: per-employee hour logging against tasks (`TimeLog` model)
- **Workload view**: visual workload distribution across the team
- **Project analytics**: performance metrics and completion rates
- Compound indexes on `{ projectId, status }` and `{ assignedTo, status }` for fast queries

---

### 8. Asset Management ✅
- Admin manages the company asset inventory from `/admin/manage-assets`
- Assets track: name, serial number, category, status, purchase date, purchase cost, notes
- Asset statuses: `Available`, `Assigned`, `Maintenance`, `Retired`
- Admin assigns assets to employees; records assignment date and return date
- Employee views their assigned assets at `/dashboard/my-assets`
- Asset categories are configurable in **Company Settings** (default: Laptop, Monitor, Mobile, Keyboard/Mouse, Software License, Other)
- Handover and return workflows tracked via assignment/return date fields

---

### 9. Expense & Reimbursement ✅
- Employees submit expense claims at `/dashboard/my-expenses` with:
  - Amount, currency, category, expense date, description
  - Receipt file attachment (via Multer)
- Expense statuses: `Pending → Approved → Rejected → Reimbursed`
- HR and Managers review and action claims from `/dashboard/expense-approvals`
- Rejection reason stored on the record
- Approver identity stored on each approved/rejected claim
- Expense categories configurable in **Company Settings** (default: Travel, Food, Accommodation, Internet, Office Supplies, Other)

---

### 10. Notifications
- System-wide `Notification` model with category tagging
- Automated alerts triggered for: leave status changes, attendance flags, task assignments, payroll events
- Notification polling and management handled globally by `SharedHeaderComponent`
- Notifications support read/unread state and deletion

---

### 11. Company Settings
- Single `CompanySettings` document stores global configuration:
  - Asset categories
  - Expense categories
  - General leave rules
  - Payroll frequency, pay period start day, salary disbursal day
  - LOP rules
  - Overtime rules

---

### 12. Reports & Analytics
- Admin reports module covers: attendance summaries, payroll reports, employee data
- Project analytics dashboard: completion rates, overdue tasks, workload distribution
- Escalation log view accessible to all authenticated users

---

## Database Models (24 total)

| Model | Purpose |
|---|---|
| `User` | Employee record; `_id` = 11-digit string |
| `Admin` | Admin accounts |
| `Hr` | HR accounts |
| `Manager` | Manager accounts; includes proxy-manager support |
| `Department` | Department master |
| `Designation` | Designation master |
| `Attendance` | Daily records with geo data, flags, correction requests, audit log |
| `AttendanceEscalation` | Late/absent/mismatch escalation log |
| `LeaveRequest` | Leave applications with unit (full/half), attachments, escalation status |
| `LeaveBalance` | Per-employee balance per leave type |
| `LeavePolicy` | Company-wide entitlement rules per leave type |
| `WorkflowTemplate` | Onboarding/offboarding task checklists |
| `Task` | Tasks for projects, onboarding, and offboarding; includes comments, activity log, attachments |
| `TimeLog` | Per-task time tracking |
| `Project` | Project entities with milestones and team |
| `Payslip` | Generated payslips with full component breakdown |
| `SalaryComponent` | Individual salary earning/deduction components |
| `SalaryTemplate` | Reusable component packages |
| `SalaryRevision` | Salary change history per employee |
| `Asset` | Company assets with lifecycle tracking |
| `Expense` | Employee expense claims with receipt and approval |
| `Notification` | System notifications |
| `OfficeLocation` | Office coordinates for attendance geo-fencing |
| `CompanySettings` | Global configuration (categories, payroll rules) |

---

## API Reference (Backend — port `3000`)

| Prefix | Description |
|---|---|
| `POST /api/auth/*` | Login, register, OTP verification, refresh |
| `GET/POST/PUT/DELETE /api/hr/*` | HR management |
| `GET/POST/PUT/DELETE /api/manager/*` | Manager operations |
| `GET/POST/PUT/DELETE /api/department/*` | Departments CRUD |
| `GET/POST/PUT/DELETE /api/designation/*` | Designations CRUD |
| `GET/POST/PUT/DELETE /api/attendance/*` | Clock-in/out, records, corrections, escalations |
| `GET/POST/PUT/DELETE /api/leave/*` | Leave applications, approvals, cancellations |
| `GET/POST/PUT/DELETE /api/leave-policy/*` | Leave policy configuration |
| `GET/POST/PUT/DELETE /api/payroll/*` | Payslips, salary templates, year-end |
| `GET/POST/PUT/DELETE /api/projects/*` | Projects CRUD |
| `GET/POST/PUT/DELETE /api/tasks/*` | Tasks, comments, time logs |
| `GET/POST/PUT/DELETE /api/assets/*` | Asset inventory management |
| `GET/POST/PUT/DELETE /api/expenses/*` | Expense claims and approvals |
| `GET/POST/PUT/DELETE /api/notifications/*` | Notification CRUD and read-status |
| `GET/POST/PUT/DELETE /api/office-locations/*` | Geo-fence office locations |
| `GET/POST/PUT/DELETE /api/workflow-templates/*` | Workflow template builder |
| `GET /api/dashboard/*` | Dashboard stats aggregations |
| `GET /uploads/*` | Static file serving (receipts, attachments) |

---

## Angular Services (20)

| Service | Purpose |
|---|---|
| `AuthService` | Login, logout, token management, user profile |
| `AttendanceService` | Clock-in/out, records, corrections |
| `LeavePolicyService` | Leave applications, balances, policies |
| `PayrollService` | Payslips, salary templates, components |
| `TaskService` | Tasks, workflow tasks, status updates |
| `ProjectService` | Project CRUD, team, milestones |
| `TimesheetService` | Time log submission and retrieval |
| `WorkflowTemplateService` | Template CRUD |
| `AssetService` | Asset listing, assignment, return |
| `ExpenseService` | Expense submission, approval actions |
| `NotificationService` | Notification fetch, read, delete |
| `DepartmentService` | Department listing and CRUD |
| `DesignationService` | Designation listing and CRUD |
| `HrService` | HR account management |
| `ManagerService` | Manager account management |
| `OfficeLocationService` | Office location CRUD |
| `DashboardService` | Dashboard stats API |
| `AdminDashboardService` | Admin-specific stats |
| `CompanySettingsService` | Global settings fetch/update |
| `LoaderService` | Global loading spinner state |

---

## Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local instance or Atlas)
- **Angular CLI** v19+

### 1. Clone the Repository

```bash
git clone https://github.com/EduNick860/SmartCMS.git
cd SmartCMS
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/smartcms
JWT_SECRET=your_strong_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Frontend Setup

```bash
cd smart-cms
npm install
npm start
```

The Angular app will be available at `http://localhost:4200`.

### 4. Seed Sample Data (Optional)

```bash
cd backend
node seed-assets.js
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **11-digit Employee IDs** (`YYMMDD + 5 random`) | Human-readable, date-encoded IDs instead of opaque ObjectIds |
| **Admin-only registration** | No public self-signup; Admin initiates all employee accounts |
| **Shared layout components** | All dashboard pages use `SharedSidebarComponent` + `SharedHeaderComponent` for consistent UX |
| **RBAC at every layer** | Angular guards + JWT middleware ensure no route or API endpoint is accessible outside the permitted role |
| **Manager OOO escalation** | Leave requests auto-escalate to a proxy manager or HR when the direct manager is on leave |
| **Workflow tasks linked to Users** | Onboarding/offboarding tasks use the same `Task` model with `taskType` and `relatedUserId`, keeping the system unified |
| **Embedded audit logs** | Attendance records carry their full audit history inline to avoid separate join queries |
| **Compound DB indexes** | Strategic indexes on `{ employeeId, date }` (Attendance), `{ projectId, status }` and `{ assignedTo, status }` (Task) |
| **Theme persistence** | Dark/Light mode toggled globally by `SharedHeaderComponent` and persisted in `localStorage` |
| **Configurable categories** | Asset and expense categories live in `CompanySettings` so admins can customise without code changes |

---

## License

ISC
