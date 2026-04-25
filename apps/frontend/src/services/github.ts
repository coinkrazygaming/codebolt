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
 * Create a pull request on GitHub
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  token: string,
  options: {
    title: string;
    body: string;
    baseBranch: string;
    headBranch: string;
  }
): Promise<{ prUrl: string; prNumber: number } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: options.title,
          body: options.body,
          base: options.baseBranch,
          head: options.headBranch,
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
