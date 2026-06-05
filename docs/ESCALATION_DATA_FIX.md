# Escalation System - Data Inconsistency Issue

## Problem Identified

The attendance escalation system is not working because:

1. **Manager Collection** has manager records (e.g., acpmanager)
2. **User Collection** does NOT have corresponding user records for all managers
3. **LeaveRequest** uses `userId` (from User collection) to store leaves
4. When checking if a manager is on leave, we can't find their User record

## Current Data State

### acpmanager (ID: 69de08f6a3d1908c344227bd)
- Exists in Manager collection: YES
- Exists in User collection: NO
- Has approved leave: Cannot be checked (no User ID)

### Atik (ID: 697a5e7828889a17c37920ca)
- Exists in Manager collection: YES  
- Exists in User collection: YES (User ID: 26012933389, role: manager)
- Can check leaves: YES

## Root Cause

The system has two separate authentication/user systems:
1. Manager collection (for manager-specific data)
2. User collection (for authentication and leaves)

When a manager is created, they might not get a corresponding User record, or the User record might have role='employee' instead of role='manager'.

## Solutions

### Option 1: Fix Data (Recommended)
Create User records for all managers who don't have them.

### Option 2: Change Leave System
Store manager leaves using Manager ObjectId instead of User string ID.

### Option 3: Sync on Manager Creation
When creating a manager, automatically create/update their User record.

### Option 4: Check by Email (Quick Fix)
Check leaves by email instead of User ID.

## Quick Fix Implemented

Changed `checkManagerAvailability` to:
1. Find manager by ObjectId in Manager collection
2. Find user by email (role='manager' OR role='employee')
3. If no user found, return available=true (assume available)
4. If user found, check their attendance and leaves

## Recommended Long-term Fix

1. Create a script to sync Manager and User collections
2. Ensure every Manager has a corresponding User record
3. Add validation when creating managers to ensure User record exists
4. Consider merging Manager and User collections or using a single source of truth
