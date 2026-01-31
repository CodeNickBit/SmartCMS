# Attendance System API Documentation

## Overview
This API provides endpoints for managing office locations and employee attendance with GPS-based geofencing.

---

## Database Models

### 1. OfficeLocation Model
```javascript
{
  name: String,              // e.g., "Head Office"
  address: String,           // e.g., "Connaught Place, New Delhi"
  latitude: Number,          // GPS coordinate
  longitude: Number,         // GPS coordinate
  radius: Number,            // Geofence radius in meters (50-1000)
  isActive: Boolean,         // Enable/disable location
  createdBy: ObjectId,       // Reference to Admin
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Attendance Model
```javascript
{
  employeeId: String,        // Reference to User
  date: Date,                // Attendance date (00:00:00)
  checkIn: {
    time: Date,
    location: { latitude, longitude },
    address: String,
    distance: Number,        // Distance from office in meters
    officeLocation: ObjectId, // Reference to OfficeLocation
    ipAddress: String,
    deviceFingerprint: String
  },
  checkOut: {
    time: Date,
    location: { latitude, longitude },
    address: String
  },
  status: String,            // 'present', 'absent', 'late', 'half-day'
  workingHours: Number,      // Auto-calculated
  isVerified: Boolean,
  verifiedBy: ObjectId,
  flags: [String],           // Anomaly flags
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Office Locations

#### 1. Create Office Location
```
POST /api/office-locations
Authorization: Bearer <token>
Role: Admin only
```

**Request Body:**
```json
{
  "name": "Head Office",
  "address": "Connaught Place, New Delhi",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "radius": 100,
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Office location created successfully",
  "location": { ... }
}
```

#### 2. Get All Office Locations
```
GET /api/office-locations
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Head Office",
    "address": "Connaught Place, New Delhi",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "radius": 100,
    "isActive": true,
    "createdAt": "2026-01-28T10:00:00.000Z"
  }
]
```

#### 3. Get Active Office Locations
```
GET /api/office-locations/active
Authorization: Bearer <token>
```

Returns only locations where `isActive: true`

#### 4. Get Single Office Location
```
GET /api/office-locations/:id
Authorization: Bearer <token>
```

#### 5. Update Office Location
```
PUT /api/office-locations/:id
Authorization: Bearer <token>
Role: Admin only
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "radius": 150,
  "isActive": false
}
```

#### 6. Delete Office Location
```
DELETE /api/office-locations/:id
Authorization: Bearer <token>
Role: Admin only
```

---

### Attendance

#### 1. Check-In
```
POST /api/attendance/check-in
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place, New Delhi",
  "distance": 45,
  "officeLocationId": "...",
  "ipAddress": "192.168.1.100",
  "deviceFingerprint": "abc123xyz"
}
```

**Response (Success):**
```json
{
  "message": "Check-in successful",
  "attendance": { ... },
  "officeName": "Head Office"
}
```

**Response (Error - Too Far):**
```json
{
  "message": "You are 250m away from Head Office. Please move closer.",
  "distance": 250,
  "requiredRadius": 100
}
```

**Response (Error - Already Checked In):**
```json
{
  "message": "Already checked in today"
}
```

#### 2. Check-Out
```
POST /api/attendance/check-out
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 28.6140,
  "longitude": 77.2091,
  "address": "Connaught Place, New Delhi"
}
```

**Response:**
```json
{
  "message": "Check-out successful",
  "attendance": { ... },
  "workingHours": 8.5
}
```

#### 3. Get Today's Attendance
```
GET /api/attendance/today
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "...",
  "employeeId": "EMP001",
  "date": "2026-01-28T00:00:00.000Z",
  "checkIn": {
    "time": "2026-01-28T09:15:00.000Z",
    "location": { "latitude": 28.6139, "longitude": 77.2090 },
    "address": "Connaught Place, New Delhi",
    "distance": 45,
    "officeLocation": { ... }
  },
  "checkOut": null,
  "status": "present",
  "workingHours": 0
}
```

#### 4. Get My Attendance History
```
GET /api/attendance/my-attendance?startDate=2026-01-01&endDate=2026-01-31&limit=30
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `limit` (optional): Number of records (default: 30)

#### 5. Get Attendance Report (HR/Admin)
```
GET /api/attendance/report?employeeId=EMP001&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `employeeId` (optional): Filter by employee
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

---

## Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Admin-only endpoints will return 403 if accessed by non-admin users.

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Admin only."
}
```

### 404 Not Found
```json
{
  "message": "Office location not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

---

## Database Indexes

### Attendance Collection
- Unique compound index on `{ employeeId, date }` to prevent duplicate check-ins

---

## Features

✅ GPS-based geofencing validation
✅ Automatic working hours calculation
✅ Prevent duplicate check-ins
✅ Store location proof with each attendance
✅ Support multiple office locations
✅ Admin-only location management
✅ Employee attendance history
✅ Attendance reports for HR/Admin

---

## Next Steps

1. Create Angular service to consume these APIs
2. Update frontend components to use real API
3. Add attendance calendar view
4. Add attendance reports/analytics
5. Add notifications for late arrivals
6. Add manual attendance approval workflow
