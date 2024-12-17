const fs = require('fs');
const { Octokit } = require('@octokit/core');

const octokit = new Octokit();

async function fetchStarredRepos() {
  const response = await octokit.request('GET /users/pjmartorell/starred');
  return response.data;
}

async function updateReadme(repos) {
  const tableHeader = '| Repository | Description |\n|------------|-------------|';
  const tableRows = repos.map(repo => `| [${repo.name}](${repo.html_url}) | ${repo.description || ''} |`).join('\n');
  const table = `${tableHeader}\n${tableRows}`;

  let readmeContent = fs.readFileSync('README.md', 'utf8');
  const newContent = readmeContent.replace(/## ⭐ Latest Starred Repos[\s\S]*/, `## ⭐ Latest Starred Repos\n\n${table}`);
  fs.writeFileSync('README.md', newContent);
}

async function main() {
  const repos = await fetchStarredRepos();
  await updateReadme(repos);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
