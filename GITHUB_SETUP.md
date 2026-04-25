# GitHub Integration Setup Guide

This guide will help you set up GitHub OAuth authentication and the GitHub Builder feature.

## Overview

The GitHub Builder allows you to:
- Load existing GitHub repositories
- View and edit code files
- Use AI to generate code modifications
- Create commits and pull requests directly to GitHub
- Manage branches and handle complex workflows

## Prerequisites

- A GitHub account
- A GitHub OAuth App (we'll create this below)
- Access to environment variables in your project

## Step 1: Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click on "New OAuth App"
3. Fill in the following details:

   **Application Name:** `CodeBolt Builder` (or your preferred name)
   
   **Homepage URL:** 
   - For local development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
   
   **Authorization callback URL:**
   - For local development: `http://localhost:5173/auth/github/callback`
   - For production: `https://yourdomain.com/auth/github/callback`
   
   **Description (optional):** `AI-powered GitHub code editor`

4. Click "Register application"

5. You'll see your credentials:
   - **Client ID** - You'll need this
   - **Client Secret** - Click "Generate a new client secret" and copy it

## Step 2: Configure Environment Variables

### Frontend (.env in apps/frontend/)

Create or update `apps/frontend/.env` with:

```env
VITE_GITHUB_CLIENT_ID=your_client_id_here
VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
```

You can use `apps/frontend/.env.example` as a template:
```bash
cp apps/frontend/.env.example apps/frontend/.env
```

### Backend (.env in apps/backend/)

Create or update `apps/backend/.env` with:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
ANTHROPIC_API_KEY=your_anthropic_key_here
XAI_API_KEY=your_xai_key_here
```

## Step 3: Configure Scopes

The OAuth app requests the following scopes:
- `repo` - Full control of private repositories
- `user` - Access to user profile data
- `gist` - Access to create and modify gists

These scopes are necessary for:
- Reading repository files
- Creating commits
- Creating pull requests
- Pushing changes

## Step 4: Test the Setup

1. Start your development servers:
   ```bash
   npm run dev  # or pnpm dev
   ```

2. Navigate to the home page: `http://localhost:5173`

3. Click "Load & Code from GitHub"

4. Click "Login with GitHub"

5. You'll be redirected to GitHub to authorize the application

6. After authorization, you'll be redirected back to the app

7. Enter a GitHub repository URL (e.g., `https://github.com/username/repo`)

8. Select a branch and click "Load Repository & Open Builder"

## Troubleshooting

### "Invalid OAuth state" Error
- Clear your browser's local storage
- Check that the redirect URL in your GitHub app matches your current domain
- Make sure cookies are enabled

### "Failed to authenticate with GitHub"
- Verify your Client ID and Client Secret are correct
- Check that your GitHub app's callback URL is correctly configured
- Make sure the callback URL in the app code matches the URL in GitHub

### "Failed to load repository"
- Verify the repository URL is public or you have access to it
- Check that you have permission to read the repository
- Ensure the branch name is correct

### Missing scopes
- Some operations might fail if your OAuth app doesn't have the right scopes
- You may need to re-authorize the app with updated scopes
- Clear your stored token and re-authenticate

## Features

### File Management
- Browse repository file structure
- View file contents
- Edit files directly
- Auto-save detection

### Branch Management
- Switch between branches
- Create new branches
- Manage branch workflows

### AI Code Modifications
- Describe code changes you want
- AI generates code modifications
- Review changes before committing

### Commit & PR Workflow
- Commit changes directly to branches
- Create pull requests to main branch
- Option to create feature branches for PRs
- Add commit messages and PR descriptions

## Security Considerations

⚠️ **Important:** The GitHub Client Secret should only be used on your backend server, never expose it in frontend code. The frontend uses the Client ID only.

The backend handles:
- OAuth token exchange
- Secure token storage (on client side, in localStorage)
- GitHub API requests with proper authentication

Users should:
- Only connect to their own repositories
- Review code changes before committing
- Manage GitHub app permissions in their account settings
- Revoke app access if no longer needed

## Revoking Access

To revoke the app's access:
1. Go to https://github.com/settings/applications
2. Find the OAuth app
3. Click "Revoke"

This will remove the stored access tokens from GitHub's side. The app will prompt for re-authentication on next use.

## Advanced Configuration

### Custom Redirect URI
If you need to use a different callback URL:
1. Update the GitHub app settings
2. Update the redirect URI in `apps/frontend/src/services/github-auth.ts`
3. Update the backend endpoint accordingly

### Token Expiration
The current implementation stores tokens in localStorage. For production:
- Consider implementing token refresh
- Store tokens securely on the backend
- Add token expiration handling
- Implement secure session management

### Rate Limiting
GitHub API has rate limits:
- Authenticated requests: 5,000 per hour per user
- The app handles rate limit errors gracefully
- Large operations might hit rate limits

## Support

For issues or questions:
1. Check GitHub API documentation: https://docs.github.com/en/rest
2. Review OAuth app settings: https://github.com/settings/developers
3. Check browser console for error messages
4. Verify environment variables are loaded correctly

## API Endpoints Used

The app uses these GitHub API endpoints:
- `GET /user` - Get authenticated user info
- `GET /repos/{owner}/{repo}/git/trees` - Get file structure
- `GET /repos/{owner}/{repo}/contents/{path}` - Get file content
- `GET /repos/{owner}/{repo}/branches` - List branches
- `POST /repos/{owner}/{repo}/git/commits` - Create commits
- `POST /repos/{owner}/{repo}/pulls` - Create pull requests
- `POST /repos/{owner}/{repo}/git/refs` - Create branches
- `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}` - Update branch

For more details, see: https://docs.github.com/en/rest
