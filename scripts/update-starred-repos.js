const fs = require('fs');
const { Octokit } = require('@octokit/core');

const octokit = new Octokit({ auth: process.env.GH_API_TOKEN });

async function fetchStarredRepos() {
  const response = await octokit.request('GET /users/pjmartorell/starred');
  return response.data;
}

async function updateReadme(repos) {
  const tableHeader = '| Repository | Description |\n|------------|-------------|';
  const tableRows = repos.map(repo => `| [${repo.name}](${repo.html_url}) | ${repo.description || ''} |`).join('\n');
  const table = `${tableHeader}\n${tableRows}`;

  let readmeContent = fs.readFileSync('README.md', 'utf8');
  const newContent = `<!-- LATEST_STARRED_REPOS_START -->\n## ⭐ Latest Starred Repos\n\n${table}\n<!-- LATEST_STARRED_REPOS_END -->`;

  readmeContent = readmeContent.replace(
    /<!-- LATEST_STARRED_REPOS_START -->[\s\S]*?<!-- LATEST_STARRED_REPOS_END -->/,
    newContent
  );

  fs.writeFileSync('README.md', readmeContent);
}

async function main() {
  const repos = await fetchStarredRepos();
  await updateReadme(repos);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
