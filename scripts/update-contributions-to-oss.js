const fs = require("fs");
const { Octokit } = require('@octokit/core');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function fetchContributions() {
  const query = `
    query($username: String!, $after: String) {
      user(login: $username) {
        contributionsCollection {
          commitContributionsByRepository(maxRepositories: 100) {
            repository {
              nameWithOwner
              url
            }
            contributions(first: 100, after: $after) {
              nodes {
                commitCount
                url
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    username: "pjmartorell",
    after: null
  };

  let contributions = [];
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await octokit.graphql(query, variables);
    const repos = response.user.contributionsCollection.commitContributionsByRepository
      .filter(repo => !repo.repository.nameWithOwner.startsWith("pjmartorell/"))
      .map(repo => ({
        repo: repo.repository.nameWithOwner,
        commits: repo.contributions.nodes.map(contribution => ({
          commitCount: contribution.commitCount,
          url: contribution.url
        })),
        url: repo.repository.url
      }));

    contributions = contributions.concat(repos);
    hasNextPage = response.user.contributionsCollection.commitContributionsByRepository.some(repo => repo.contributions.pageInfo.hasNextPage);
    variables.after = response.user.contributionsCollection.commitContributionsByRepository.find(repo => repo.contributions.pageInfo.hasNextPage)?.contributions.pageInfo.endCursor;
  }

  return contributions;
}

async function updateReadme(contributions) {
  let readmeContent = fs.readFileSync('README.md', 'utf8');

  const contributionsList = contributions.map(contribution =>
    `- [${contribution.repo}](${contribution.url}): ${contribution.commits.map(commit => `[${commit.commitCount} commits](${commit.url})`).join(", ")}`
  ).join("\n");

  const newContent = `<!-- LATEST_CONTRIBUTIONS_START -->\n## Latest Contributions to OSS\n\n${contributionsList}\n<!-- LATEST_CONTRIBUTIONS_END -->`;

  readmeContent = readmeContent.replace(
    /<!-- LATEST_CONTRIBUTIONS_START -->[\s\S]*?<!-- LATEST_CONTRIBUTIONS_END -->/,
    newContent
  );

  fs.writeFileSync('README.md', readmeContent);
}

async function main() {
  const contributions = await fetchContributions();
  await updateReadme(contributions);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
