import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, currentVersion, newVersion, releaseNotes, githubRepo } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken && action !== 'bump-version') {
      return Response.json({ error: 'GitHub token not configured' }, { status: 400 });
    }

    let result = {};

    // Bump version (semantic versioning)
    if (action === 'bump-version') {
      const [major, minor, patch] = currentVersion.split('.').map(Number);
      let bumped;
      
      switch (action === 'bump-patch' ? 'patch' : action) {
        case 'patch':
          bumped = `${major}.${minor}.${patch + 1}`;
          break;
        case 'minor':
          bumped = `${major}.${minor + 1}.0`;
          break;
        case 'major':
          bumped = `${major + 1}.0.0`;
          break;
        default:
          bumped = newVersion;
      }
      
      result.nextVersion = bumped;
    }

    // Create GitHub release
    if (action === 'create-release' && githubRepo) {
      const [owner, repo] = githubRepo.split('/');
      const tagName = `v${newVersion}`;
      
      const releaseResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tag_name: tagName,
            name: `Release ${newVersion}`,
            body: releaseNotes || 'See changelog for details.',
            draft: false,
            prerelease: false,
          }),
        }
      );

      if (!releaseResponse.ok) {
        const error = await releaseResponse.json();
        return Response.json({ error: error.message || 'Failed to create release' }, { status: 400 });
      }

      const release = await releaseResponse.json();
      result.releaseUrl = release.html_url;
      result.releaseId = release.id;
    }

    // Update changelog
    if (action === 'update-changelog') {
      const changelogEntry = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n${releaseNotes}\n\n`;
      result.changelogEntry = changelogEntry;
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});