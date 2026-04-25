/**
 * GitHub OAuth authentication service
 * 
 * This service handles GitHub OAuth flow and token management.
 * You need to set up a GitHub App for OAuth authentication.
 * 
 * Steps:
 * 1. Go to https://github.com/settings/developers and create an OAuth App
 * 2. Set Authorization callback URL to: {your-app-url}/auth/github/callback
 * 3. Set VITE_GITHUB_CLIENT_ID and VITE_GITHUB_CLIENT_SECRET in your .env
 */

const STORAGE_KEY = 'github_token';
const STATE_STORAGE_KEY = 'github_oauth_state';

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_at?: number;
}

class GitHubAuthService {
  private clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  private redirectUri = `${window.location.origin}/auth/github/callback`;

  /**
   * Start GitHub OAuth flow
   */
  startOAuthFlow() {
    // Generate random state for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STATE_STORAGE_KEY, state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo,user,gist',
      state,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string, state: string): Promise<GitHubToken | null> {
    // Verify state for CSRF protection
    const savedState = localStorage.getItem(STATE_STORAGE_KEY);
    if (state !== savedState) {
      console.error('OAuth state mismatch');
      return null;
    }

    localStorage.removeItem(STATE_STORAGE_KEY);

    try {
      // Exchange code for access token via backend
      // Note: In production, this should be done server-side to keep the secret secure
      const response = await fetch('/api/auth/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange OAuth code');
      }

      const token: GitHubToken = await response.json();
      this.saveToken(token);
      return token;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return null;
    }
  }

  /**
   * Get stored token
   */
  getToken(): GitHubToken | null {
    const token = localStorage.getItem(STORAGE_KEY);
    return token ? JSON.parse(token) : null;
  }

  /**
   * Save token to storage
   */
  saveToken(token: GitHubToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
  }

  /**
   * Clear token
   */
  clearToken() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<GitHubUser | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Make authenticated GitHub API request
   */
  async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    return fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `token ${token.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
  }
}

export const githubAuthService = new GitHubAuthService();
