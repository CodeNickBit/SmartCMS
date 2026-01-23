## Project Summary
SmartCMS is a Corporate Management System designed to handle employee onboarding, management, and administrative tasks. It features a robust backend for user and admin management, and a modern frontend built with Angular and Tailwind CSS.

## Tech Stack
- Frontend: Angular (v19+), Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Authentication: JWT, Email OTP Verification

## Architecture
- `backend/`: Node.js Express server with Mongoose models and API routes
- `smart-cms/`: Angular application following standard App Router patterns
- `smart-cms/src/app/admin/`: Admin-specific components and management views
- `smart-cms/src/app/signup/`: Employee onboarding flow

## User Preferences
- Meaningful Employee IDs: Use 11-digit numeric IDs (YYMMDD + random) instead of ObjectIds.
- Streamlined Login: Only Admins can register new employees; remove the registration link from the login page.
- Registration Form: Keep "Work & Pay Details" in the registration page even when registration is admin-initiated.
- Admin/Manager Models: No changes to be made to Admin and Manager models.

## Project Guidelines
- Keep Row Level Security (RLS) disabled for simplicity in Supabase (if used).
- Use modern, beautiful typography and cohesive color palettes.
- Follow App Router structure for Next.js projects (if applicable).
- No code comments unless explicitly requested.

## Common Patterns
- Employee IDs generated on the backend if not provided by the user.
- Use `_id` as a String primary key for the User model to ensure readability.
- Navigation to `/signup` from Admin panel for adding new employees.