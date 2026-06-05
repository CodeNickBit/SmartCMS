# Attendance Escalation System

## Overview
Implemented an intelligent attendance approval escalation system that automatically transfers attendance approval requests to alternate managers when the reporting manager is unavailable (on leave or absent).

## Features Implemented

### 1. **New Database Collection: AttendanceEscalation**
Location: `backend/models/AttendanceEscalation.js`

Fields:
- `attendanceId`: Reference to the attendance record
- `employeeId`: Employee whose attendance was escalated
- `originalManagerId`: The unavailable reporting manager
- `originalManagerName`: Name of original manager
- `escalatedToManagerId`: The alternate manager assigned
- `escalatedToManagerName`: Name of alternate manager
- `escalatedToManagerEmail`: Email of alternate manager
- `escalatedToManagerDepartment`: Department of alternate manager
- `reason`: Why escalation occurred (manager_on_leave, manager_absent, etc.)
- `escalationDate`: When escalation happened
- `checkInDate`: Date of the attendance check-in
- `status`: active, resolved, cancelled
- `resolvedAt`: When the escalation was resolved
- `notes`: Additional notes

### 2. **Smart Check-In Logic**
Location: `backend/routes/attendance.js` - `POST /check-in`

Flow:
1. Employee clicks "Clock In"
2. System validates geofence and location
3. **NEW**: System checks if reporting manager is available:
   - Queries Attendance collection for manager's absence/leave status
   - Queries LeaveRequest collection for approved leaves
4. If manager unavailable:
   - Finds alternate manager from different department
   - Creates AttendanceEscalation record
   - Assigns attendance to alternate manager
   - Returns escalation info to employee
5. Employee sees notification with alternate manager details

### 3. **Manager Dashboard Updates**
Location: `smart-cms/src/app/dashboard/manager-approvals/`

Changes:
- **Pending Approvals Query**: Now includes requests where manager is `assignedManagerId` (escalated requests)
- **Escalation Badge**: Purple "Other Dept" badge shows on escalated requests
- **Escalation Info Section**: Shows original manager name, reason for escalation, and alternate manager details
- **Approval Actions**: When manager approves/declines/marks late, escalation status changes to "resolved"

### 4. **Employee Notification**
Location: `smart-cms/src/app/home/home.component.ts`

When employee checks in and manager is unavailable:
```
"Checked in successfully at [Office Name]! Your reporting manager is unavailable. 
Request assigned to [Manager Name] ([Department]) - [Email]"
```

### 5. **Escalation Log View**
Location: `smart-cms/src/app/dashboard/escalation-log/`

Features:
- Employees can view their escalation history
- Managers can view escalations they were involved in (original or assigned)
- Shows: employee name, date, original manager, escalated manager, reason, status
- Accessible via route: `/dashboard/escalation-log`

### 6. **New API Endpoints**

#### `GET /api/attendance/escalation-log`
Query parameters:
- `employeeId`: Filter by employee
- `managerId`: Filter by manager (original or escalated)
- `startDate`, `endDate`: Date range filter
- `limit`, `skip`: Pagination

Returns: List of escalation records with populated employee and attendance data

#### `GET /api/attendance/my-escalations`
Returns escalations for the logged-in user (employee or manager)

### 7. **Attendance Model Update**
Location: `backend/models/Attendance.js`

Added field:
- `assignedManagerId`: ObjectId reference to Manager who should approve (can be different from reporting manager)

### 8. **Helper Functions**
Location: `backend/routes/attendance.js`

#### `checkManagerAvailability(managerId, date)`
- Checks if manager is absent or on leave for given date
- Returns boolean

#### `findAlternateManager(employeeDepartment, excludeManagerId)`
- Finds a manager from a different department
- Excludes the unavailable manager
- Returns random manager if multiple available

### 9. **Escalation Resolution**
When manager approves/declines/marks late:
- Escalation status changes from "active" to "resolved"
- `resolvedAt` timestamp is set
- Audit log maintained in attendance record

## Database Schema

### AttendanceEscalation Collection
```javascript
{
  attendanceId: ObjectId (ref: Attendance),
  employeeId: String (ref: User),
  originalManagerId: ObjectId (ref: Manager),
  originalManagerName: String,
  escalatedToManagerId: ObjectId (ref: Manager),
  escalatedToManagerName: String,
  escalatedToManagerEmail: String,
  escalatedToManagerDepartment: String,
  reason: Enum ['manager_on_leave', 'manager_absent', 'backup_manager_absent', 'manual_escalation'],
  escalationDate: Date,
  checkInDate: Date,
  status: Enum ['active', 'resolved', 'cancelled'],
  resolvedAt: Date,
  notes: String,
  timestamps: true
}
```

### Attendance Model Addition
```javascript
{
  ...existing fields,
  assignedManagerId: ObjectId (ref: Manager)
}
```

## User Experience

### Employee Side:
1. Clicks "Clock In"
2. If reporting manager unavailable:
   - Sees extended notification with alternate manager details
   - Can view escalation log to see history
3. Attendance approval proceeds normally with alternate manager

### Manager Side:
1. Sees escalated requests in pending approvals
2. Purple "Other Dept" badge indicates escalation
3. Escalation info section shows why request was escalated
4. Can approve/decline normally
5. Can view escalation log to see all escalations

### Admin/HR Side:
- Can view all escalations via escalation log
- Can override any attendance record
- Full audit trail maintained

## Files Modified/Created

### Backend:
- ✅ `backend/models/AttendanceEscalation.js` (NEW)
- ✅ `backend/models/Attendance.js` (MODIFIED - added assignedManagerId)
- ✅ `backend/routes/attendance.js` (MODIFIED - added escalation logic)

### Frontend:
- ✅ `smart-cms/src/app/services/attendance.service.ts` (MODIFIED - added escalation endpoints)
- ✅ `smart-cms/src/app/home/home.component.ts` (MODIFIED - show escalation message)
- ✅ `smart-cms/src/app/dashboard/manager-approvals/manager-approvals.component.html` (MODIFIED - escalation badge)
- ✅ `smart-cms/src/app/dashboard/escalation-log/` (NEW - escalation log component)
- ✅ `smart-cms/src/app/app.routes.ts` (MODIFIED - added escalation log route)

## Testing Checklist

- [ ] Employee check-in when manager is on approved leave
- [ ] Employee check-in when manager is marked absent
- [ ] Escalation to alternate manager from different department
- [ ] Manager sees escalated request with badge
- [ ] Manager can approve escalated request
- [ ] Escalation status changes to resolved after approval
- [ ] Employee sees escalation notification
- [ ] Escalation log shows correct data for employee
- [ ] Escalation log shows correct data for manager
- [ ] Multiple escalations on same day
- [ ] No escalation when manager is available

## Future Enhancements

1. **Email Notifications**: Send email to alternate manager when request is escalated
2. **Priority Escalation**: Escalate to backup manager first, then other departments
3. **Department Preference**: Allow configuration of preferred escalation departments
4. **Escalation Analytics**: Dashboard showing escalation trends
5. **Manual Escalation**: Allow HR/Admin to manually escalate requests
6. **Escalation Timeout**: Auto-approve if no action taken within X hours
7. **Multi-level Escalation**: Escalate to higher management if alternate manager also unavailable

## Notes

- Escalation is automatic and transparent to the employee
- Original reporting manager relationship is preserved
- Full audit trail maintained for compliance
- System handles edge cases (no alternate managers available)
- Escalation log provides transparency for all parties
