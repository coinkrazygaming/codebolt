import { githubAuthService } from './github-auth';

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  url: string;
  branch: string;
}

export interface GitHubFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  url?: string;
  content?: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface CommitOptions {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface PROptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  try {
    // Handle https://github.com/owner/repo format
    const httpsMatch = url.match(/https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)/);
    if (httpsMatch) {
      return {
        owner: httpsMatch[1],
        repo: httpsMatch[2],
        url: url,
        branch: 'main',
      };
    }

    // Handle git@github.com:owner/repo format
    const sshMatch = url.match(/git@github\.com:([\w\-]+)\/([\w\-]+)/);
    if (sshMatch) {
      return {
        owner: sshMatch[1],
        repo: sshMatch[2],
        url: `https://github.com/${sshMatch[1]}/${sshMatch[2]}`,
        branch: 'main',
      };
    }
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
  }

  return null;
}

/**
 * Fetch repository tree structure from GitHub API
 */
export async function fetchRepositoryTree(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<GitHubFile[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform GitHub tree response to our format
    const files: GitHubFile[] = data.tree.map((item: any) => ({
      path: item.path,
      name: item.path.split('/').pop(),
      type: item.type === 'tree' ? 'dir' : 'file',
      size: item.size,
      url: item.url,
    }));

    return files;
  } catch (error) {
    console.error('Error fetching repository tree:', error);
    throw error;
  }
}

/**
 * Fetch a specific file content from GitHub
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
  branch: string = 'main'
): Promise<string> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
}

/**
 * Check if a GitHub token is valid
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating GitHub token:', error);
    return false;
  }
}

/**
 * Fetch branches for a repository (authenticated)
 */
export async function fetchBranches(
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  try {
    const response = await githubAuthService.request(
      `/repos/${owner}/${repo}/branches`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch branches: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
}

/**
 * Get file content from repository (authenticated)
 */
export async function getFileContentAuthenticated(
  owner: string,
  repo: string,
  filePath: string,
  branch: string = 'main'
): Promise<string> {
  try {
    const response = await githubAuthService.request(
      `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    throw new Error('Path is not a file');
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
}

/**
 * Commit changes to repository
 */
export async function commitChanges(
  options: CommitOptions
): Promise<{ sha: string; url: string }> {
  const { owner, repo, branch, message, files } = options;

  try {
    // Get current branch ref
    const refResponse = await githubAuthService.request(
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`
    );

    if (!refResponse.ok) {
      throw new Error('Failed to get branch reference');
    }

    const refData = await refResponse.json();
    const baseTreeSha = refData.object.sha;

    // Create tree with file changes
    const tree = files.map(file => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    }));

    const treeResponse = await githubAuthService.request(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree,
        }),
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to create tree');
    }

    const treeData = await treeResponse.json();

    // Create commit
    const user = await githubAuthService.getCurrentUser();
    const commitResponse = await githubAuthService.request(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: treeData.sha,
          parents: [baseTreeSha],
          author: {
            name: user?.name || 'AI Assistant',
            email: user?.login ? `${user.login}@users.noreply.github.com` : 'ai@builder.io',
          },
        }),
      }
    );

    if (!commitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const commitData = await commitResponse.json();

    // Update ref
    const updateResponse = await githubAuthService.request(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          sha: commitData.sha,
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update branch');
    }

    return {
      sha: commitData.sha,
      url: commitData.url,
    };
  } catch (error) {
    console.error('Error committing changes:', error);
    throw error;
  }
}

/**
 * Create a pull request on GitHub (authenticated)
 */
export async function createPullRequest(
  options: PROptions
): Promise<{ prUrl: string; prNumber: number }> {
  const { owner, repo, title, body, baseBranch, headBranch } = options;

  try {
    const response = await githubAuthService.request(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
          base: baseBranch,
          head: headBranch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create pull request');
    }

    const data = await response.json();
    return {
      prUrl: data.html_url,
      prNumber: data.number,
    };
  } catch (error) {
    console.error('Error creating pull request:', error);
    throw error;
  }
}

/**
 * Create a new branch from an existing branch
 */
export async function createBranch(
  owner: string,
  repo: string,
  newBranchName: string,
  baseBranch: string = 'main'
): Promise<{ name: string; sha: string }> {
  try {
    const refResponse = await githubAuthService.request(
      `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`
    );

    if (!refResponse.ok) {
      throw new Error('Failed to get base branch');
    }

    const refData = await refResponse.json();

    const createResponse = await githubAuthService.request(
      `/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranchName}`,
          sha: refData.object.sha,
        }),
      }
    );

    if (!createResponse.ok) {
      throw new Error('Failed to create branch');
    }

    const data = await createResponse.json();
    return {
      name: data.ref.replace('refs/heads/', ''),
      sha: data.object.sha,
    };
  } catch (error) {
    console.error('Error creating branch:', error);
    throw error;
  }
}
