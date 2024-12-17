const fs = require("fs");
const { Octokit } = require('@octokit/core');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function fetchContributions() {
  const { data: events } = await octokit.request('GET /users/pjmartorell/events/public')

  const contributions = events
    .filter(event => event.type === "PushEvent" && event.repo.name.split('/')[0] !== username)
    .map(event => ({
      repo: event.repo.name,
      message: event.payload.commits.map(commit => commit.message).join(", "),
      url: `https://github.com/${event.repo.name}`
    }));

  return contributions;
}

async function updateReadme(contributions) {
  let readmeContent = fs.readFileSync('README.md', 'utf8');

  const contributionsList = contributions.map(contribution =>
    `- [${contribution.repo}](${contribution.url}): ${contribution.message}`
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
