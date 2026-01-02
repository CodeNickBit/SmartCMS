# Broken Access Control (BAC) - Complete A-Z Guide

## Table of Contents
1. [What is Broken Access Control?](#what-is-broken-access-control)
2. [Why is it #1 in OWASP Top 10?](#why-is-it-1-in-owasp-top-10)
3. [Types of BAC Vulnerabilities](#types-of-bac-vulnerabilities)
4. [Tools for Testing BAC](#tools-for-testing-bac)
5. [Step-by-Step Exploitation Guide](#step-by-step-exploitation-guide)
6. [Testing on Your SmartCMS Project](#testing-on-your-smartcms-project)
7. [How to Fix BAC Vulnerabilities](#how-to-fix-bac-vulnerabilities)

---

## What is Broken Access Control?

**Broken Access Control** occurs when users can act outside of their intended permissions. This means:
- A regular user accessing admin pages
- User A viewing/editing User B's data
- Bypassing authentication checks
- Accessing APIs without proper authorization

### Real-World Impact
- Data breaches (accessing other users' personal data)
- Privilege escalation (becoming admin)
- Unauthorized actions (deleting others' content)
- Financial fraud (modifying transactions)

---

## Why is it #1 in OWASP Top 10?

- **94%** of applications tested had some form of broken access control
- Most common vulnerability found in web applications
- Easy to exploit, hard to detect with automated tools
- Developers often forget to check permissions on every endpoint

---

## Types of BAC Vulnerabilities

### 1. Vertical Privilege Escalation
**What:** Lower-privileged user gains higher-privileged access  
**Example:** Regular user accessing admin panel

```
Normal User Role: user
Target Role: admin

# User tries to access:
GET /admin/dashboard
GET /api/admin/users
```

### 2. Horizontal Privilege Escalation
**What:** User A accesses User B's resources (same privilege level)  
**Example:** Viewing another user's profile/data by changing ID

```
# Your profile:
GET /api/users/123/profile

# Attack - change ID to view others:
GET /api/users/456/profile
GET /api/users/789/profile
```

### 3. Insecure Direct Object Reference (IDOR)
**What:** Directly accessing objects by manipulating identifiers  
**Example:** Changing document ID in URL

```
# Your document:
GET /api/documents/1001

# Attack - access others' documents:
GET /api/documents/1002
GET /api/documents/1003
```

### 4. Missing Function Level Access Control
**What:** Backend doesn't verify permissions for sensitive functions  
**Example:** API endpoint has no auth check

```javascript
// VULNERABLE CODE - No permission check!
app.delete('/api/posts/:id', (req, res) => {
    Post.findByIdAndDelete(req.params.id);  // Anyone can delete!
});
```

### 5. Parameter Tampering
**What:** Modifying parameters to gain unauthorized access  
**Example:** Changing role in request body

```json
// Original request (user signup):
POST /api/signup
{
    "username": "attacker",
    "password": "pass123",
    "email": "attacker@test.com"
}

// Attack - add role parameter:
POST /api/signup
{
    "username": "attacker",
    "password": "pass123",
    "email": "attacker@test.com",
    "role": "admin"          // <-- INJECTED!
}
```

### 6. Path Traversal
**What:** Accessing files/directories outside intended scope  
**Example:** Using ../ to navigate directories

```
# Normal request:
GET /api/files?name=report.pdf

# Attack:
GET /api/files?name=../../../etc/passwd
GET /api/files?name=..\..\..\.env
```

### 7. JWT/Token Manipulation
**What:** Modifying authentication tokens  
**Example:** Changing user ID or role in JWT

```
# Original JWT payload:
{
    "userId": "123",
    "role": "user"
}

# Tampered JWT:
{
    "userId": "123",
    "role": "admin"
}
```

### 8. Forced Browsing
**What:** Accessing unlinked but unprotected pages  
**Example:** Guessing admin URLs

```
# Try common admin paths:
/admin
/admin/dashboard
/administrator
/manage
/api/admin/users
/api/internal/config
```

### 9. HTTP Method Tampering
**What:** Using different HTTP methods to bypass restrictions  
**Example:** POST blocked but PUT allowed

```
# Blocked:
POST /api/users/delete/123  -> 403 Forbidden

# Try other methods:
PUT /api/users/delete/123   -> 200 OK (Bypassed!)
DELETE /api/users/123       -> 200 OK (Bypassed!)
```

### 10. Metadata/Header Manipulation
**What:** Modifying headers to impersonate or escalate  
**Example:** Adding admin headers

```
# Try adding headers:
X-Original-URL: /admin/dashboard
X-Rewrite-URL: /admin/dashboard
X-User-Role: admin
X-Forwarded-For: 127.0.0.1 (bypass IP restrictions)
```

---

## Tools for Testing BAC

### 1. Burp Suite (MOST IMPORTANT)
**Purpose:** Intercept, modify, and replay HTTP requests  
**Download:** https://portswigger.net/burp/communitydownload

### 2. OWASP ZAP
**Purpose:** Free alternative to Burp Suite  
**Download:** https://www.zaproxy.org/download/

### 3. Postman
**Purpose:** API testing and request modification  
**Download:** https://www.postman.com/downloads/

### 4. Browser DevTools (F12)
**Purpose:** Quick request inspection and modification  
**Built into:** Chrome, Firefox, Edge

### 5. curl (Command Line)
**Purpose:** Send custom HTTP requests  
**Built into:** Windows PowerShell, Linux, Mac

### 6. Autorize (Burp Extension)
**Purpose:** Automated BAC testing  
**Install:** Burp Suite > Extender > BApp Store > Autorize

### 7. JWT.io
**Purpose:** Decode and analyze JWT tokens  
**URL:** https://jwt.io/

---

## Step-by-Step Exploitation Guide

### Setting Up Burp Suite (Primary Tool)

#### Step 1: Download and Install
1. Go to https://portswigger.net/burp/communitydownload
2. Download "Burp Suite Community Edition"
3. Install and launch

#### Step 2: Configure Browser Proxy
1. Open Burp Suite > Proxy > Options
2. Note the proxy listener (default: 127.0.0.1:8080)
3. Configure browser:
   - **Chrome:** Settings > System > Open proxy settings > LAN settings > Use proxy server > 127.0.0.1:8080
   - **Firefox:** Settings > Network Settings > Manual proxy > 127.0.0.1:8080
   - **Recommended:** Use FoxyProxy extension for easy switching

#### Step 3: Install Burp Certificate (for HTTPS)
1. With proxy on, visit http://burp
2. Click "CA Certificate" to download
3. Install certificate:
   - Chrome: Settings > Privacy > Security > Manage certificates > Import
   - Firefox: Settings > Privacy > View Certificates > Import

#### Step 4: Start Intercepting
1. Burp Suite > Proxy > Intercept > "Intercept is on"
2. Browse your application
3. Requests will appear in Burp

---

### Exploitation Techniques

### Technique 1: IDOR Testing (Most Common)

```
SCENARIO: Your SmartCMS has user profiles

Step 1: Login as User A (your test account)
Step 2: Navigate to your profile/content
Step 3: Capture the request in Burp:
        GET /api/users/64a1b2c3d4e5f6/profile

Step 4: Send to Repeater (Ctrl+R)
Step 5: Change the ID:
        GET /api/users/64a1b2c3d4e5f7/profile
        GET /api/users/64a1b2c3d4e5f8/profile

Step 6: If you see other users' data = VULNERABLE!
```

### Technique 2: Vertical Privilege Escalation

```
SCENARIO: Finding admin endpoints

Step 1: Create two accounts:
        - Regular user: testuser@test.com
        - Admin user: admin@test.com (if possible)

Step 2: Login as admin, browse admin features
Step 3: Note all admin endpoints in Burp:
        /api/admin/users
        /api/admin/settings
        /api/admin/dashboard

Step 4: Logout, login as regular user
Step 5: Try accessing admin endpoints directly
Step 6: If accessible = VULNERABLE!
```

### Technique 3: Parameter Tampering

```
SCENARIO: Modifying request parameters

Step 1: Intercept a normal request:
        POST /api/posts
        {
            "title": "My Post",
            "content": "Hello",
            "userId": "123"
        }

Step 2: Modify parameters:
        POST /api/posts
        {
            "title": "My Post",
            "content": "Hello",
            "userId": "456",        // <-- Changed!
            "role": "admin",        // <-- Added!
            "isAdmin": true         // <-- Added!
        }

Step 3: If accepted = VULNERABLE!
```

### Technique 4: Forced Browsing with Burp Intruder

```
Step 1: Capture any request
Step 2: Send to Intruder (Ctrl+I)
Step 3: Set payload position on path segment
        
Step 4: Load wordlist of common paths:
        admin
        administrator
        manage
        dashboard
        config
        settings
        internal
        private
        api/admin
        api/internal

Step 5: Start Attack
Step 6: Check responses - 200 OK = potential access!
```

### Technique 5: HTTP Method Testing

```
Step 1: Find a protected endpoint:
        DELETE /api/posts/123 -> 403 Forbidden

Step 2: Try different methods:
        GET /api/posts/123
        POST /api/posts/123
        PUT /api/posts/123
        PATCH /api/posts/123
        OPTIONS /api/posts/123
        HEAD /api/posts/123

Step 3: Different response = potential bypass!
```

### Technique 6: JWT Token Manipulation

```
Step 1: Capture JWT from login response or cookies
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Step 2: Decode at jwt.io:
        {
            "userId": "123",
            "role": "user"
        }

Step 3: Try modifications:
        - Change "role": "admin"
        - Change "userId": "1" (often admin)
        - Change algorithm to "none"
        - Use empty signature

Step 4: Send modified token in requests
Step 5: If accepted = VULNERABLE!
```

---

## Testing on Your SmartCMS Project

Based on your project structure, here are specific tests:

### Test 1: User Data IDOR
```bash
# Login and get your user ID
# Then try accessing other user IDs:

curl http://localhost:3000/api/users/OTHER_USER_ID -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Admin Endpoint Discovery
```bash
# Try these endpoints without admin rights:

curl http://localhost:3000/api/admin/users
curl http://localhost:3000/api/admin/settings
curl http://localhost:3000/api/admin/dashboard
curl http://localhost:3000/api/internal/config
```

### Test 3: Role Manipulation at Signup
```bash
# Try adding role during signup:

curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","password":"test123","email":"hacker@test.com","role":"admin","isAdmin":true}'
```

### Test 4: Check Your Backend Routes
Review these files in your project:
```
backend/routes/

Questions to ask:
- Does every route check authentication?
- Does every route verify the user owns the resource?
- Are admin routes protected?
```

### Test 5: MongoDB ObjectId Enumeration
```
MongoDB ObjectIds are somewhat predictable
If you have ID: 64a1b2c3d4e5f60000000001
Try:           64a1b2c3d4e5f60000000002
               64a1b2c3d4e5f60000000003
```

---

## Automated Testing with Autorize (Burp Extension)

### Setup:
1. Burp Suite > Extender > BApp Store
2. Search "Autorize" > Install
3. Go to Autorize tab

### How it works:
1. Login as LOW privilege user
2. Copy their cookies/token to Autorize
3. Browse as HIGH privilege user
4. Autorize automatically replays requests with low-priv cookies
5. Compares responses to find access control issues

### Interpreting Results:
- **Red:** Same response with low-priv = VULNERABLE
- **Yellow:** Different response = might be vulnerable
- **Green:** Properly blocked = SECURE

---

## Common BAC Vulnerabilities in MEAN Stack

### 1. Missing Auth Middleware
```javascript
// VULNERABLE - No auth check
router.get('/users/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
});

// SECURE - With auth middleware
router.get('/users/:id', authMiddleware, async (req, res) => {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await User.findById(req.params.id);
    res.json(user);
});
```

### 2. Client-Side Only Protection
```javascript
// VULNERABLE - Only checking on frontend
// Angular component:
if (this.user.role === 'admin') {
    this.showAdminPanel = true;
}
// Backend has NO check - anyone can call API!

// SECURE - Backend must ALWAYS verify
```

### 3. Trusting User Input for Authorization
```javascript
// VULNERABLE - Trusting userId from request body
router.post('/posts', async (req, res) => {
    const post = new Post({
        title: req.body.title,
        userId: req.body.userId  // User can set any ID!
    });
});

// SECURE - Get userId from authenticated session
router.post('/posts', authMiddleware, async (req, res) => {
    const post = new Post({
        title: req.body.title,
        userId: req.user.id  // From verified token
    });
});
```

---

## How to Fix BAC Vulnerabilities

### 1. Implement Proper Middleware
```javascript
// auth.middleware.js
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Role-based middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
```

### 2. Always Verify Resource Ownership
```javascript
router.get('/posts/:id', authMiddleware, async (req, res) => {
    const post = await Post.findById(req.params.id);
    
    // Check ownership!
    if (post.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not your post' });
    }
    
    res.json(post);
});
```

### 3. Use Allowlisting, Not Blocklisting
```javascript
// BAD - Blocklist approach (easy to bypass)
const blockedRoles = ['admin', 'superadmin'];
if (blockedRoles.includes(req.body.role)) {
    req.body.role = 'user';
}

// GOOD - Allowlist approach
const allowedRoles = ['user', 'editor'];
if (!allowedRoles.includes(req.body.role)) {
    req.body.role = 'user';
}
```

### 4. Deny by Default
```javascript
// Default deny - only allow specific actions
const permissions = {
    user: ['read:own', 'write:own'],
    editor: ['read:own', 'write:own', 'read:all'],
    admin: ['read:own', 'write:own', 'read:all', 'write:all', 'delete:all']
};

function hasPermission(userRole, requiredPermission) {
    return permissions[userRole]?.includes(requiredPermission) || false;
}
```

---

## Checklist for Testing BAC

- [ ] Can I access other users' data by changing IDs?
- [ ] Can I access admin pages as a regular user?
- [ ] Can I modify my role during registration/profile update?
- [ ] Are all API endpoints authenticated?
- [ ] Are all API endpoints checking authorization (not just authentication)?
- [ ] Can I use different HTTP methods to bypass restrictions?
- [ ] Can I manipulate JWT tokens?
- [ ] Are there hidden/unlinked endpoints I can access?
- [ ] Does the backend trust any client-side data for authorization?
- [ ] Can I access files outside the intended directory?

---

## Practice Labs (Legal & Safe)

1. **PortSwigger Web Security Academy** (FREE)
   - https://portswigger.net/web-security/access-control
   - Has dedicated BAC labs

2. **OWASP WebGoat**
   - https://owasp.org/www-project-webgoat/
   - Self-hosted vulnerable app

3. **HackTheBox**
   - https://www.hackthebox.com/
   - Real vulnerable machines

4. **TryHackMe**
   - https://tryhackme.com/
   - Guided learning paths

---

## Quick Reference Commands

### curl Commands for Testing
```bash
# GET with auth header
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users/123

# POST with JSON body
curl -X POST -H "Content-Type: application/json" -d '{"role":"admin"}' http://localhost:3000/api/signup

# Test different HTTP methods
curl -X PUT http://localhost:3000/api/resource
curl -X DELETE http://localhost:3000/api/resource
curl -X PATCH http://localhost:3000/api/resource

# Add custom headers
curl -H "X-User-Role: admin" http://localhost:3000/api/admin
```

---

## Summary Table

| Vulnerability Type | What to Test | Tool |
|-------------------|--------------|------|
| IDOR | Change IDs in URLs/params | Burp Repeater |
| Vertical Escalation | Access admin endpoints | Burp/curl |
| Horizontal Escalation | Access other users' data | Burp Repeater |
| Parameter Tampering | Add role/admin params | Burp Repeater |
| JWT Manipulation | Modify token payload | jwt.io + Burp |
| Forced Browsing | Find hidden endpoints | Burp Intruder |
| Method Tampering | Try different HTTP verbs | Burp Repeater |

**Remember:** Always test on your own applications or authorized targets only!

---

*Created for educational purposes - Testing on SmartCMS (Your Own Project)*  
*Date: January 2026*
