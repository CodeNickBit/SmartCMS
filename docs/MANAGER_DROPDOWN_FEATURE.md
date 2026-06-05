# Manager Dropdown with Department Filtering

## Feature Overview
Added manager dropdown selection in employee forms with automatic department-based filtering.

## Implementation

### Backend Changes

#### Manager Routes (`backend/routes/manager.js`)
- Added `GET /api/manager/active` endpoint with optional department filtering
- Query parameter: `?department=IT` to filter by department
- Returns only active managers sorted by name

### Frontend Changes

#### Manager Service (`smart-cms/src/app/services/manager.service.ts`)
- Added `getActiveManagers(department?: string)` method
- Supports optional department parameter for filtering
- Added interfaces: `ManagerRegistrationRequest`, `ManagerUpdateRequest`
- Full CRUD operations: register, update, delete managers

#### Manage Employee Component
- Added manager dropdown in edit form (Professional Details section)
- Automatically filters managers when department changes
- Clears manager selection if selected manager not in new department
- Method: `onDepartmentChange()` - triggers when department dropdown changes
- Method: `loadManagersByDepartment(department)` - loads filtered managers

#### Signup Component
- Added manager dropdown in registration form (Professional Details section)
- Watches department field changes via `valueChanges` subscription
- Automatically updates manager list when department selected
- Clears invalid manager selection on department change

## How It Works

1. **Initial Load**: All active managers loaded
2. **Department Selection**: When user selects a department
3. **Auto-Filter**: Manager dropdown updates to show only managers from that department
4. **Smart Reset**: If current manager not in new department, selection cleared

## Example Flow

### Admin Adding Employee
1. Admin selects "IT" department
2. Manager dropdown shows: Atik, deep s, manager
3. Admin selects "marketing" department
4. Manager dropdown updates to show: bhoothnath

### Admin Editing Employee
1. Employee currently reports to "Atik" (IT department)
2. Admin changes department to "marketing"
3. Manager dropdown updates, "Atik" cleared (not in marketing)
4. Admin can now select "bhoothnath"

## Database State
Current managers by department:
- **IT**: Atik, deep s, manager (3 managers)
- **marketing**: bhoothnath (1 manager)

## API Endpoints

### Get All Active Managers
```
GET /api/manager/active
Response: [{ _id, name, email, department, designation, isActive }]
```

### Get Managers by Department
```
GET /api/manager/active?department=IT
Response: [{ _id, name, email, department, designation, isActive }]
```

## Benefits
- Ensures employees assigned to managers in same department
- Prevents invalid manager assignments
- Improves data consistency
- Better user experience with filtered options
