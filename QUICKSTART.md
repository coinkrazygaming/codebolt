# Quick Start Guide - User Account System

Get your user account system running in 5 minutes!

## Prerequisites

- Node.js 16+ and npm/pnpm
- Supabase account (database already configured)
- Git

## Step 1: Install Dependencies

```bash
# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2: Initialize Database

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Create tables in database
npx prisma migrate deploy
```

**What happens:**
- Creates all required tables in your Supabase database
- Sets up relationships between users, projects, settings, etc.

## Step 3: Start Backend

```bash
cd apps/backend
npm run dev
```

You should see:
```
Backend server running on port 3000
```

## Step 4: Start Frontend (New Terminal)

```bash
cd apps/frontend
npm run dev
```

You should see:
```
VITE v6.0.1 ready in 123 ms
```

## Step 5: Test It Out!

Open your browser to **http://localhost:5173**

### Try This:

1. **Sign Up**
   - Click "Sign Up" button
   - Enter email: `test@example.com`
   - Password: `password123`
   - Full name: `Test User`
   - Click "Create Account"
   - ✅ You're logged in! Workspace created automatically

2. **Create a Project**
   - Click "New Project"
   - Name: `My First Project`
   - Description: `Testing the system`
   - Click "Create"
   - ✅ Project created with subdomain `my-first-project`

3. **Configure Project**
   - Click on your project card
   - Update name, description, etc.
   - Configure Git settings:
     - Push Repository: `https://github.com/you/your-repo.git`
     - Default Branch: `main`
   - Click "Save"
   - ✅ Settings saved!

4. **Connect GitHub (Optional)**
   - Click "Setup GitHub"
   - Click "Connect GitHub"
   - Authorize the app
   - ✅ GitHub token saved!

## API Testing

### Test Auth Endpoints

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Copy the returned token and use it:

```bash
TOKEN="your-jwt-token-here"

# Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get all projects
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

## View Database

```bash
cd apps/backend
npx prisma studio
```

Opens a web UI to view and edit your database directly.

## Useful Commands

```bash
# Build frontend for production
cd apps/frontend
npm run build

# Lint code
npm run lint

# View database migrations
cd apps/backend
npx prisma migrate status

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## Environment Variables

Database URL is already configured. Optional variables for GitHub integration:

```bash
# In apps/backend/.env
GITHUB_CLIENT_ID=your-app-id
GITHUB_CLIENT_SECRET=your-app-secret
```

## Architecture Overview

```
Frontend (React/Vite)
    ↓
    ↓ API Calls
    ↓
Backend (Express)
    ↓
    ↓ Prisma ORM
    ↓
Database (Supabase PostgreSQL)
```

## What Just Got Created

✅ **Database** - All tables and relationships
✅ **User Management** - Signup, login, sessions
✅ **Projects** - Create and manage multiple projects
✅ **Workspaces** - One automatic workspace per user
✅ **Settings** - Per-project customizable settings
✅ **Git Config** - Repository and workflow settings
✅ **GitHub Integration** - Per-project OAuth tokens

## Common Issues

**Issue: Database connection fails**
- Verify DATABASE_URL in environment
- Check Supabase is accessible from your network

**Issue: Port 3000 already in use**
- Kill process: `lsof -i :3000` then `kill -9 <PID>`
- Or use different port

**Issue: Frontend doesn't connect to backend**
- Check BACKEND_URL in `apps/frontend/src/config.ts`
- Ensure backend is running on port 3000

**Issue: Prisma migration fails**
- Delete `node_modules/.prisma` folder
- Run `npx prisma generate` again
- Run `npx prisma migrate deploy`

## Next Steps

1. **Integrate with Builder**: Connect existing builder to project context
2. **Add GitHub Workflows**: Use stored tokens for PR/commit automation
3. **Customize Settings**: Extend JSON settings with your own fields
4. **Deploy**: Move to production with proper environment variables

## Documentation

- **Full Setup Guide**: See `ACCOUNT_SYSTEM_SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com

## Support Commands

```bash
# Check backend is running
curl http://localhost:3000/template -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'

# Check frontend is running
curl http://localhost:5173

# Check database connection
cd apps/backend && npx prisma db execute --stdin <<< 'SELECT 1'
```

## You're All Set! 🎉

The account system is ready to use. Start building!
