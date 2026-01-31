# 🚀 Quick Start Guide - Manager Approval Workflow

## ⚡ Get Started in 3 Steps

### Step 1: Start the Backend Server
```bash
cd backend
npm start
```
Backend should be running on `http://localhost:3000`

### Step 2: Start the Frontend
```bash
cd smart-cms
npm start
```
Frontend should be running on `http://localhost:4200`

### Step 3: Access the Dashboard

#### For Managers:
1. Login with manager credentials
2. Navigate to: `http://localhost:4200/dashboard/manager-approvals`
3. Or click **"Attendance Approvals"** in the sidebar

#### For Employees:
1. Login with employee credentials
2. Navigate to: `http://localhost:4200/dashboard/attendance`
3. Click **"Check In Now"**
4. See **"Pending Approval"** badge

---

## 🎯 Quick Test Scenario

### Test the Complete Workflow:

1. **Employee Check-In:**
   - Login as employee
   - Go to Attendance page
   - Click "Check In Now"
   - Allow location access
   - ✅ See "Pending Approval" yellow badge

2. **Manager Approval:**
   - Logout and login as manager
   - Go to "Attendance Approvals"
   - See the pending request card
   - Click "Approve" button
   - Add optional notes: "Good morning!"
   - Click "Confirm"
   - ✅ See success message

3. **Employee Verification:**
   - Logout and login as employee again
   - Go to Attendance page
   - ✅ See "Approved" green badge
   - ✅ See manager's notes: "Good morning!"

---

## 🎨 Visual Preview

### Manager Dashboard:
![Manager Approval Dashboard](../manager_approval_dashboard.png)

**Features:**
- 🔍 Search by name, ID, or department
- 📅 Filter by date
- 🏷️ Filter by status
- 🗺️ View location on Google Maps
- ✅ Approve / ⏰ Mark Late / ❌ Decline
- 📝 Add notes

### Employee View:
![Employee Attendance Status](../employee_attendance_status.png)

**Features:**
- 🟡 Pending Approval badge (pulsing)
- 🟢 Approved badge
- 🔴 Declined badge
- 🟠 Marked Late badge
- 📝 Manager notes display

---

## 📋 API Endpoints Reference

### Get Pending Approvals
```http
GET /api/attendance/pending-approvals?limit=50&skip=0
Authorization: Bearer <token>
```

### Approve Attendance
```http
POST /api/attendance/approve/:attendanceId
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Approved - on time"
}
```

### Decline Attendance
```http
POST /api/attendance/decline/:attendanceId
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Location not verified"
}
```

### Mark as Late
```http
POST /api/attendance/mark-late/:attendanceId
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Arrived 15 minutes late"
}
```

---

## 🎨 Status Colors Reference

| Status | Color | Badge |
|--------|-------|-------|
| Pending | Yellow (#facc15) | 🟡 Pulsing |
| Approved | Green (#10b981) | 🟢 Solid |
| Declined | Red (#ef4444) | 🔴 Solid |
| Marked Late | Orange (#f97316) | 🟠 Solid |

---

## 🔧 Troubleshooting

### Issue: Manager dashboard shows no pending requests
**Solution:** 
- Ensure an employee has checked in
- Check that attendance status is "pending"
- Verify backend is running
- Check browser console for errors

### Issue: Approval action not working
**Solution:**
- Verify JWT token is valid
- Check user has manager role
- Ensure attendance ID is correct
- Check backend logs for errors

### Issue: Status not updating in real-time
**Solution:**
- Refresh the page
- Check network tab for API calls
- Verify WebSocket connection (if implemented)
- Clear browser cache

### Issue: Location not showing on map
**Solution:**
- Check GPS coordinates are valid
- Ensure internet connection
- Verify Google Maps link format
- Check browser console for errors

---

## 📱 Mobile Testing

To test on mobile:
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update API URL in frontend to use IP instead of localhost
3. Access from mobile: `http://YOUR_IP:4200`
4. Test GPS location on actual device

---

## 🎯 Next Steps

After testing:
1. ✅ Add email notifications
2. ✅ Implement bulk actions
3. ✅ Add analytics dashboard
4. ✅ Create mobile app
5. ✅ Add auto-approval rules
6. ✅ Export reports feature

---

## 📞 Support

Need help? Check:
- 📖 Full documentation: `MANAGER_APPROVAL_WORKFLOW.md`
- 📋 Implementation summary: `IMPLEMENTATION_SUMMARY.md`
- 🐛 Browser console for errors
- 🔍 Network tab for API calls

---

## ✅ Checklist Before Production

- [ ] Test all approval actions (approve/decline/late)
- [ ] Test search and filters
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Verify GPS accuracy
- [ ] Test with multiple managers
- [ ] Test with multiple employees
- [ ] Check error handling
- [ ] Verify security (JWT, roles)
- [ ] Test database performance
- [ ] Check responsive design
- [ ] Verify all animations work
- [ ] Test notification messages

---

**Ready to go! 🚀**

Access the manager dashboard at: `/dashboard/manager-approvals`
