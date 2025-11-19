# Admin Dashboard Guide

## Overview

The admin dashboard provides complete management capabilities for all system data including users, companies, job postings, and applications.

## Access

**URL:** `http://localhost:3000/admin`

**Requirements:**
- User must be authenticated
- User must have `role = 'admin'` in the database

## Creating Your First Admin

After running the complete schema, create an admin user:

```bash
cd backend
tsx scripts/create-admin.ts admin@example.com yourpassword123
```

Or manually update a user in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Features

### 1. Dashboard Overview (`/admin`)
- System statistics (users, companies, jobs, applications)
- Quick access to all management sections
- Real-time metrics

### 2. Users Management (`/admin/users`)
- View all users with pagination
- Search users by email
- Promote users to admin
- Activate/deactivate users
- Delete users

### 3. Companies Management (`/admin/companies`)
- View all companies with pagination
- Search companies by name, domain, or email
- View company details and statistics
- Delete companies (cascades to jobs and applications)

### 4. Job Postings Management (`/admin/jobs`)
- View all job postings with pagination
- Search jobs by title or description
- Filter by status (ACTIVE, CLOSED, DRAFT)
- Delete job postings (cascades to applications)

### 5. Applications Management (`/admin/applications`)
- View all applications with pagination
- Search applications by candidate name or email
- Filter by AI status (SHORTLIST, FLAG, REJECT)
- Delete applications

## API Endpoints

All admin endpoints require authentication and admin role:

- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List users (with pagination and search)
- `PATCH /api/admin/users/:userId` - Update user (role, is_active)
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/companies` - List companies
- `GET /api/admin/companies/:companyId` - Company details
- `PATCH /api/admin/companies/:companyId` - Update company
- `DELETE /api/admin/companies/:companyId` - Delete company
- `GET /api/admin/job-postings` - List job postings
- `DELETE /api/admin/job-postings/:jobId` - Delete job posting
- `GET /api/admin/applications` - List applications
- `DELETE /api/admin/applications/:applicationId` - Delete application

## Security

- All admin routes are protected by `authenticate` middleware
- Admin routes require `requireAdmin` middleware (checks `role === 'admin'`)
- Inactive users cannot sign in
- JWT tokens include user role information

## Database Schema Updates

The complete schema now includes:
- `users.role` - 'user' or 'admin' (default: 'user')
- `users.is_active` - boolean (default: true)
- `users.updated_at` - timestamp trigger

## Usage

1. **Sign in** as an admin user
2. Navigate to `/admin`
3. Use the dashboard to manage all system data
4. All changes are immediately reflected in the database

