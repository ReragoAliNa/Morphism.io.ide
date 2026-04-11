// GitHub REST API Integration Layer
// Handles multi-file tree commits dynamically

export class GitHubSyncEngine {
  constructor(pat, owner, repo, branch) {
    this.pat = pat;
    this.owner = owner;
    this.repo = repo;
    this.branch = branch || "main";
    this.baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  }

  getHeaders() {
    return {
      "Authorization": `Bearer ${this.pat}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };
  }

  async _fetch(endpoint, options = {}) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: this.getHeaders()
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub API Error (${res.status}): ${errorText}`);
    }
    return res.json();
  }

  // Deep tech multi-file commit sequence
  async commitModelAndCode(commitMsg, morphismAsciiStr, rustCodeStr, featureName = "crypto_model") {
    // 1. Get current commit reference
    const refData = await this._fetch(`/git/ref/heads/${this.branch}`);
    const latestCommitSha = refData.object.sha;

    // 2. Fetch the commit tree to use as base
    const commitData = await this._fetch(`/git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blob for .morphism file (Math Model)
    const blobMath = await this._fetch(`/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: morphismAsciiStr, encoding: 'utf-8' })
    });

    // 4. Create blob for .rs file (Compiler output)
    const blobRust = await this._fetch(`/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: rustCodeStr, encoding: 'utf-8' })
    });

    // 5. Create new abstract Tree with both blobs attached to the base tree
    const treePayload = {
      base_tree: baseTreeSha,
      tree: [
        {
          path: `models/${featureName}.morphism`,
          mode: '100644', // File mode
          type: 'blob',
          sha: blobMath.sha
        },
        {
          path: `src/math_${featureName}.rs`,
          mode: '100644',
          type: 'blob',
          sha: blobRust.sha
        }
      ]
    };

    const newTreeData = await this._fetch(`/git/trees`, {
      method: 'POST',
      body: JSON.stringify(treePayload)
    });

    // 6. Connect Tree to a new Commit node 
    const newCommit = await this._fetch(`/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: commitMsg,
        tree: newTreeData.sha,
        parents: [latestCommitSha]
      })
    });

    // 7. Advance the branch history reference pointer forward
    await this._fetch(`/git/refs/heads/${this.branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
        force: false
      })
    });

    return newCommit;
  }
}
