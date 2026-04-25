# Account System Setup Guide

This document describes how to set up and use the new user account system with workspaces, projects, and Git configuration.

## Overview

The system implements the following features:

- **User Authentication**: Email/password signup and login with JWT session management
- **Workspaces (Spaces)**: Each user gets one workspace per account
- **Projects**: Users can create multiple independent projects within their workspace
- **Project Settings**: Customizable settings for each project
- **Git Configuration**: Per-project GitHub integration, PR workflows, and push repository configuration
- **Subdomains**: Unique subdomains for each project (e.g., `projectname.yourapp.com`)
- **GitHub Integration**: Per-project GitHub token management for repository access

## Prerequisites

1. **Supabase Account**: Database connection string (already configured in environment variables)
2. **GitHub OAuth App** (Optional): For GitHub integration
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App with callback URL: `http://localhost:5173/auth/github/callback`
   - Note the Client ID and Client Secret

## Database Setup

### 1. Install Dependencies

```bash
cd apps/backend
npm install
# or
pnpm install
```

### 2. Initialize Prisma and Create Database

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Create and migrate database (runs all pending migrations)
npx prisma migrate deploy

# (Optional) Push schema to database without migrations
# npx prisma db push
```

### 3. View Database (Optional)

```bash
# Open Prisma Studio to view/edit database content
npx prisma studio
```

## Environment Configuration

### Backend Environment Variables

Create or update `.env` in `apps/backend`:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/postgres

# JWT Secret - Change this to a strong random string in production
JWT_SECRET=your-secure-jwt-secret-key-here

# LLM Provider
LLM_PROVIDER=anthropic

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# API Keys for LLM Providers
ANTHROPIC_API_KEY=your-anthropic-key
XAI_API_KEY=your-xai-key
```

### Frontend Environment Variables

Create or update `.env` in `apps/frontend`:

```bash
# Backend API URL
VITE_BACKEND_URL=http://localhost:3000

# GitHub OAuth (Optional)
REACT_APP_GITHUB_CLIENT_ID=your-github-client-id
```

## Running the Application

### 1. Start Backend

```bash
cd apps/backend
npm run dev
# Server runs on http://localhost:3000
```

### 2. Start Frontend

```bash
cd apps/frontend
npm run dev
# App runs on http://localhost:5173
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Projects

- `POST /api/projects` - Create new project (requires auth)
- `GET /api/projects` - Get all projects and workspace (requires auth)
- `GET /api/projects/:projectId` - Get specific project (requires auth)
- `PATCH /api/projects/:projectId` - Update project (requires auth)
- `DELETE /api/projects/:projectId` - Delete project (requires auth)

### Project Settings

- `GET /api/projects/settings/:projectId` - Get project settings (requires auth)
- `PATCH /api/projects/settings/:projectId` - Update project settings (requires auth)

### Git Configuration

- `GET /api/projects/git-config/:projectId` - Get Git config (requires auth)
- `PATCH /api/projects/git-config/:projectId` - Update Git config (requires auth)
- `POST /api/projects/git-config/:projectId/github-token` - Save GitHub token (requires auth)

## User Workflow

### 1. Account Creation

1. Go to `/signup`
2. Enter email, password, and optional name
3. Account is created with a default workspace
4. User is logged in automatically

### 2. Project Creation

1. Navigate to `/dashboard`
2. Click "New Project"
3. Enter project name and description
4. Project is created with:
   - Unique subdomain (auto-generated)
   - Default project settings
   - Default Git configuration

### 3. Project Configuration

1. From dashboard, click on a project
2. Configure:
   - **General Settings**: Project name and description
   - **Subdomain**: Unique URL for project (read-only)
   - **Git Configuration**: Push repo URL, default branch, PR workflow
   - **GitHub Integration**: Connect GitHub account for repo access

### 4. GitHub Integration

1. In project settings, click "Setup GitHub"
2. Click "Connect GitHub" button
3. Authorize the app on GitHub
4. Token is saved to the project
5. Project can now push to GitHub and create PRs

## Database Schema

### Users Table
- `id` (UUID): Primary key
- `email` (String): Unique email
- `password` (String): Hashed password
- `name` (String): Optional user name
- `createdAt`, `updatedAt`: Timestamps

### Spaces Table (Workspaces)
- `id` (UUID): Primary key
- `userId` (String): Foreign key to User
- `name` (String): Workspace name
- `createdAt`, `updatedAt`: Timestamps
- **Constraint**: One space per user (unique userId)

### Projects Table
- `id` (UUID): Primary key
- `spaceId` (String): Foreign key to Space
- `name` (String): Project name
- `description` (String): Optional description
- `subdomain` (String): Unique subdomain
- `createdAt`, `updatedAt`: Timestamps

### ProjectSettings Table
- `id` (UUID): Primary key
- `projectId` (String): Foreign key to Project (unique)
- `settings` (JSON): Custom settings object
- `createdAt`, `updatedAt`: Timestamps

### GitConfig Table
- `id` (UUID): Primary key
- `projectId` (String): Foreign key to Project (unique)
- `prWorkflow` (String): PR workflow configuration
- `pushRepoUrl` (String): GitHub repo URL for pushing
- `pushBranch` (String): Default branch for push (default: "main")
- `createdAt`, `updatedAt`: Timestamps

### GithubToken Table
- `id` (UUID): Primary key
- `projectId` (String): Foreign key to Project (unique)
- `accessToken` (String): GitHub OAuth token
- `tokenType` (String): Token type (default: "bearer")
- `scope` (String): OAuth scopes
- `createdAt`, `updatedAt`: Timestamps

### Sessions Table
- `id` (UUID): Primary key
- `userId` (String): Foreign key to User
- `token` (String): JWT token (unique)
- `expiresAt` (DateTime): Token expiration time
- `createdAt`: Creation timestamp

## Features Implemented

### User Management
- [x] Email/password authentication
- [x] JWT-based session management
- [x] Secure password hashing with bcrypt
- [x] Session persistence in database

### Workspace & Projects
- [x] One workspace per user
- [x] Multiple projects per workspace
- [x] Unique subdomain generation
- [x] Project CRUD operations

### Project Configuration
- [x] Editable project settings
- [x] Git workflow configuration
- [x] Push repository configuration
- [x] PR workflow customization

### GitHub Integration
- [x] Per-project GitHub OAuth
- [x] GitHub token storage
- [x] Token management UI
- [x] Safe token handling

### Frontend
- [x] Login/Signup pages
- [x] Protected routes with auth
- [x] Dashboard with project listing
- [x] Project settings management
- [x] GitHub setup wizard

## Security Considerations

1. **Password Security**: Passwords are hashed with bcrypt (10 salt rounds)
2. **JWT Tokens**: Signed with JWT_SECRET, expiring after 7 days
3. **Session Validation**: Sessions are verified against database on each request
4. **Protected Routes**: Frontend routes require active session
5. **GitHub Tokens**: Stored encrypted in database, not in browser
6. **CORS**: Configured for frontend origin

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL environment variable
- Check Supabase credentials
- Ensure database is accessible from your network

### Authentication Failing
- Check JWT_SECRET is consistent between restarts
- Verify token expiration in database
- Check browser localStorage for auth_token

### GitHub Integration Not Working
- Verify GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- Check GitHub OAuth redirect URL matches callback
- Ensure user grants correct permissions

### Projects Not Loading
- Verify user session is valid
- Check database for project records
- Ensure space exists for user

## Production Deployment

Before deploying to production:

1. **Environment Variables**:
   - Change JWT_SECRET to a strong random value
   - Use production database URL
   - Set correct GitHub OAuth credentials

2. **Database**:
   - Run `npx prisma migrate deploy` on production
   - Set up automated backups
   - Enable SSL for database connection

3. **Frontend**:
   - Update BACKEND_URL to production server
   - Build with `npm run build`
   - Deploy to CDN or hosting service

4. **Security**:
   - Enable HTTPS only
   - Set secure CORS headers
   - Implement rate limiting
   - Add logging and monitoring

## Next Steps

1. **Test the System**: Create accounts and projects to verify functionality
2. **Integrate with Builder**: Connect to existing project creation flows
3. **Add Features**: Billing, team management, advanced Git workflows
4. **Deploy**: Move to production with proper security measures

## Support

For issues or questions, refer to:
- Prisma Documentation: https://www.prisma.io/docs
- Express Documentation: https://expressjs.com
- React Router Documentation: https://reactrouter.com
