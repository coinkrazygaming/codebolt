# Admin Dashboard Setup Guide

## Overview

A complete administrative dashboard has been implemented with full oversight and control over the platform. This includes user management, workspace management, project management, AI keys configuration, site settings, pricing management, billing, and comprehensive statistics.

## Features Implemented

### 1. **Admin Authentication & Authorization**
- Added `isAdmin` field to User model in Prisma
- Created admin middleware (`requireAdmin`) for route protection
- Admin users have full access to all administrative endpoints
- Non-admin users are denied access to admin routes

### 2. **User Management**
- View all registered users with email, name, and admin status
- Grant/revoke admin access to users
- Delete users from the platform
- Track user creation dates

**Endpoint:** `/admin/users`
**Routes:**
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get specific user with workspaces and projects
- `PATCH /api/admin/users/:userId/admin` - Toggle admin status
- `DELETE /api/admin/users/:userId` - Delete user

### 3. **Workspace Management**
- View all user workspaces
- See projects within each workspace
- Delete workspaces and cascade delete all associated projects
- Track workspace creation dates and ownership

**Endpoint:** `/admin/workspaces`
**Routes:**
- `GET /api/admin/spaces` - Get all workspaces
- `GET /api/admin/spaces/:spaceId` - Get specific workspace with projects
- `DELETE /api/admin/spaces/:spaceId` - Delete workspace

### 4. **Project Management**
- View all projects across the platform
- See project details including name, subdomain, owner, and workspace
- Delete projects
- Filter and sort projects

**Endpoint:** `/admin/projects`
**Routes:**
- `GET /api/admin/projects` - Get all projects
- `DELETE /api/admin/projects/:projectId` - Delete project

### 5. **Site Settings Management**
- Configure site name (e.g., "Website Builder AI")
- Set primary domain
- Manage support email
- Enable/disable maintenance mode with custom message
- Settings persist across restarts

**Endpoint:** `/admin/settings`
**Routes:**
- `GET /api/admin/settings` - Get current site settings
- `PATCH /api/admin/settings` - Update site settings

### 6. **Pricing Plans Management**
- Create, read, update, and delete pricing plans
- Set plan name, price, and currency
- Define max projects and storage limits per plan
- Add custom features list for each plan
- Enable/disable plans

**Endpoint:** `/admin/pricing`
**Routes:**
- `GET /api/admin/pricing` - Get all pricing plans
- `POST /api/admin/pricing` - Create new plan
- `PATCH /api/admin/pricing/:planId` - Update plan
- `DELETE /api/admin/pricing/:planId` - Delete plan

### 7. **AI Keys Management**
- Add and manage API keys for different AI providers (Anthropic, XAI, OpenAI)
- Enable/disable keys without deletion
- Track key creation and update dates
- Keys are stored securely

**Endpoint:** `/admin/ai-keys`
**Routes:**
- `GET /api/admin/ai-keys` - Get all AI keys (without exposing actual keys)
- `POST /api/admin/ai-keys` - Add new AI key
- `PATCH /api/admin/ai-keys/:keyId` - Toggle key active status
- `DELETE /api/admin/ai-keys/:keyId` - Delete AI key

### 8. **API Keys Management**
- Generate unique API keys and secrets for external integrations
- Set rate limits for each key
- Enable/disable keys
- Copy keys to clipboard for easy integration
- Secret is only shown once at creation

**Endpoint:** `/admin/api-keys`
**Routes:**
- `GET /api/admin/api-keys` - Get all API keys
- `POST /api/admin/api-keys` - Create new API key
- `PATCH /api/admin/api-keys/:keyId` - Update key (active status, rate limit)
- `DELETE /api/admin/api-keys/:keyId` - Delete API key

### 9. **Platform Statistics & Analytics**
- Total number of registered users
- Number of active users (logged in within 30 days)
- Total projects on the platform
- Total workspaces
- New users this month
- Total revenue (sum of completed billing records)
- Real-time statistics dashboard

**Endpoint:** `/admin` (Dashboard main page)
**Routes:**
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/billing` - Get billing records

## Database Schema Updates

The following models were added to `apps/backend/prisma/schema.prisma`:

```prisma
// Updated User model
model User {
  isAdmin Boolean @default(false)
  // ... existing fields
}

// New models
model AiKey {
  id: String @id
  provider: String
  key: String (encrypted)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

model SiteSettings {
  id: String @id
  siteName: String
  primaryDomain: String
  supportEmail: String
  maintenanceMode: Boolean
  maintenanceMessage: String
  createdAt: DateTime
  updatedAt: DateTime
}

model PricingPlan {
  id: String @id
  name: String
  price: Float
  currency: String
  projects: Int
  storage: Int
  features: Json (array)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

model BillingRecord {
  id: String @id
  userId: String
  amount: Float
  currency: String
  status: String
  description: String
  createdAt: DateTime
  updatedAt: DateTime
}

model ApiKey {
  id: String @id
  name: String
  key: String @unique
  secret: String (encrypted)
  isActive: Boolean
  rateLimit: Int
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Frontend Components

### Admin Layout (`AdminLayout.tsx`)
- Responsive sidebar navigation
- Collapsible menu for better UX
- Quick access to all admin sections
- User info and logout button

### Admin Pages
1. **AdminDashboard.tsx** - Main dashboard with statistics cards and quick actions
2. **AdminUsers.tsx** - User management with admin role toggle and deletion
3. **AdminWorkspaces.tsx** - Workspace management and details
4. **AdminProjects.tsx** - Project management and deletion
5. **AdminSettings.tsx** - Site configuration panel
6. **AdminPricing.tsx** - Pricing plan creation and management
7. **AdminAiKeys.tsx** - AI provider key management
8. **AdminApiKeys.tsx** - API key generation and management
9. **AdminSetup.tsx** - One-time admin initialization page

## Setup Instructions

### Step 1: Initialize Database

The Prisma schema has been updated. Run the migration:

```bash
cd apps/backend
npm install
npm run seed
```

Or use the initialization endpoint (see Step 2).

### Step 2: Create Admin User

There are two ways to create the admin user:

#### Method 1: Using the Setup Page (Recommended)
1. Navigate to `http://localhost:5173/admin-setup`
2. Enter email: `coinkrazy26@gmail.com`
3. Enter password: `admin123`
4. Click "Create Admin Account"
5. After creation, you'll be redirected to login

#### Method 2: Using the API Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/init-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coinkrazy26@gmail.com",
    "password": "admin123"
  }'
```

### Step 3: Login and Access Admin Dashboard

1. Go to `/login`
2. Enter credentials:
   - Email: `coinkrazy26@gmail.com`
   - Password: `admin123`
3. You'll be logged in as admin
4. Navigate to `/admin` to access the admin dashboard

## Admin Dashboard Navigation

Once logged in as admin, you can access:

- **Dashboard** (`/admin`) - Overview with statistics
- **Users** (`/admin/users`) - Manage all users
- **Workspaces** (`/admin/workspaces`) - Manage all workspaces
- **Projects** (`/admin/projects`) - View and manage all projects
- **Pricing** (`/admin/pricing`) - Create and manage pricing plans
- **AI Keys** (`/admin/ai-keys`) - Configure AI provider keys
- **API Keys** (`/admin/api-keys`) - Create and manage API keys
- **Settings** (`/admin/settings`) - Configure site settings

## Security Features

1. **Admin Middleware** - All admin endpoints require authentication and admin role
2. **API Key Generation** - Unique keys with secrets are generated
3. **Rate Limiting** - Configurable rate limits per API key
4. **One-Time Setup** - Admin initialization can only happen once
5. **Session Management** - JWT tokens with 7-day expiry
6. **Password Hashing** - bcrypt with salt rounds for security

## Default Data

When admin is initialized, the following defaults are created:

### Site Settings
- Site Name: "Website Builder AI"
- Primary Domain: "builder.local"
- Support Email: "support@example.com"

### Pricing Plans
1. **Free** - $0/month
   - 1 Project
   - 1 GB Storage

2. **Pro** - $29/month
   - 10 Projects
   - 100 GB Storage
   - Advanced Analytics
   - Priority Support

3. **Enterprise** - $99/month
   - 100 Projects
   - 1000 GB Storage
   - Advanced Analytics
   - 24/7 Support
   - Custom Integrations
   - Dedicated Account Manager

## API Routes

All admin routes require the `Authorization: Bearer <token>` header.

### Base URL: `/api/admin`

#### Users
- `GET /users` - List all users
- `GET /users/:userId` - Get user details
- `PATCH /users/:userId/admin` - Toggle admin status
- `DELETE /users/:userId` - Delete user

#### Spaces/Workspaces
- `GET /spaces` - List all workspaces
- `GET /spaces/:spaceId` - Get workspace details
- `DELETE /spaces/:spaceId` - Delete workspace

#### Projects
- `GET /projects` - List all projects
- `DELETE /projects/:projectId` - Delete project

#### Site Settings
- `GET /settings` - Get settings
- `PATCH /settings` - Update settings

#### Pricing Plans
- `GET /pricing` - List plans
- `POST /pricing` - Create plan
- `PATCH /pricing/:planId` - Update plan
- `DELETE /pricing/:planId` - Delete plan

#### AI Keys
- `GET /ai-keys` - List AI keys
- `POST /ai-keys` - Add AI key
- `PATCH /ai-keys/:keyId` - Toggle key
- `DELETE /ai-keys/:keyId` - Delete key

#### API Keys
- `GET /api-keys` - List API keys
- `POST /api-keys` - Create API key
- `PATCH /api-keys/:keyId` - Update API key
- `DELETE /api-keys/:keyId` - Delete API key

#### Statistics
- `GET /stats` - Platform statistics
- `GET /billing` - Billing records

#### Auth
- `POST /api/auth/init-admin` - Initialize admin (one-time only)

## Troubleshooting

### Admin page shows "Access Denied"
- Ensure you're logged in as an admin user
- Check that the user's `isAdmin` field is set to `true` in the database

### Database migrations failing
- Ensure PostgreSQL is running and accessible
- Check `DATABASE_URL` environment variable
- Run `npm install` in backend directory

### API endpoints returning 401
- Check that token is valid and not expired
- Verify Authorization header format: `Bearer <token>`
- Ensure session exists in database

## Files Created/Modified

### Backend Files
- `apps/backend/src/routes/admin.ts` - Admin API routes
- `apps/backend/src/middleware.ts` - Updated with admin middleware
- `apps/backend/src/routes/auth.ts` - Added init-admin endpoint
- `apps/backend/src/seed.ts` - Database seeding script
- `apps/backend/prisma/schema.prisma` - Updated schema

### Frontend Files
- `apps/frontend/src/pages/AdminDashboard.tsx` - Main admin dashboard
- `apps/frontend/src/pages/AdminUsers.tsx` - User management
- `apps/frontend/src/pages/AdminWorkspaces.tsx` - Workspace management
- `apps/frontend/src/pages/AdminProjects.tsx` - Project management
- `apps/frontend/src/pages/AdminSettings.tsx` - Site settings
- `apps/frontend/src/pages/AdminPricing.tsx` - Pricing management
- `apps/frontend/src/pages/AdminAiKeys.tsx` - AI keys management
- `apps/frontend/src/pages/AdminApiKeys.tsx` - API keys management
- `apps/frontend/src/pages/AdminSetup.tsx` - Admin setup page
- `apps/frontend/src/components/AdminLayout.tsx` - Admin layout component
- `apps/frontend/src/App.tsx` - Updated routes
- `apps/frontend/src/contexts/AuthContext.tsx` - Added isAdmin field

## Next Steps

1. Run database migrations: `npm run seed` or use the setup page
2. Create admin user with the provided credentials
3. Log in and explore the admin dashboard
4. Configure site settings, pricing plans, and API keys as needed
5. Manage users, workspaces, and projects from the admin panel

## Support

For issues or questions about the admin dashboard, refer to the code comments in the respective files or check the API route implementations.
