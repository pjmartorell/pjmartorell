const fs = require('fs');
const { graphql } = require('@octokit/graphql');

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GH_TOKEN}`
  }
});

async function fetchStarredRepos() {
  const query = `
    query($username: String!, $after: String) {
      user(login: $username) {
        starredRepositories(first: 30, after: $after, orderBy: { field: STARRED_AT, direction: DESC }) {
          nodes {
            name
            description
            url
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  const variables = {
    username: "pjmartorell",
    after: null
  };

  let repos = [];
  let hasNextPage = true;

  while (hasNextPage && repos.length < 50) {
    const response = await graphqlWithAuth(query, variables);
    repos = repos.concat(response.user.starredRepositories.nodes);
    hasNextPage = response.user.starredRepositories.pageInfo.hasNextPage;
    variables.after = response.user.starredRepositories.pageInfo.endCursor;
  }

  return repos.slice(0, 30);
}

async function updateReadme(repos) {
  const tableHeader = '| Repository | Description |\n|------------|-------------|';
  const tableRows = repos.map(repo => `| [${repo.name}](${repo.url}) | ${repo.description || ''} |`).join('\n');
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
