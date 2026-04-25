import axios from 'axios';
import { BACKEND_URL } from '../config';

export interface GitHubTokenResponse {
  accessToken: string;
  tokenType: string;
  scope: string;
}

export class GitHubTokenService {
  static saveTokenForProject(
    projectId: string,
    token: GitHubTokenResponse,
    authToken: string
  ): Promise<void> {
    return axios.post(
      `${BACKEND_URL}/api/projects/git-config/${projectId}/github-token`,
      {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        scope: token.scope,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    ).then(() => undefined);
  }

  static getTokenForProject(
    projectId: string,
    authToken: string
  ): Promise<GitHubTokenResponse | null> {
    return axios
      .get(`${BACKEND_URL}/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then((response) => {
        const githubToken = response.data.githubToken;
        if (githubToken) {
          return {
            accessToken: githubToken.accessToken,
            tokenType: githubToken.tokenType,
            scope: githubToken.scope,
          };
        }
        return null;
      });
  }
}
