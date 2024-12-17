const fs = require("fs");
const { graphql } = require('@octokit/graphql');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const xpath = require('xpath');

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GH_API_TOKEN}`
  }
});

async function fetchTotalContributions() {
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;

  const username = "pjmartorell";
  let totalContributions = 0;
  const currentYear = new Date().getFullYear();

  for (let year = 2010; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const variables = { username, from, to };
    const response = await graphqlWithAuth(query, variables);
    totalContributions += response.user.contributionsCollection.contributionCalendar.totalContributions;
  }

  return totalContributions;
}

function formatNumberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function updateSvg(totalContributions) {
  const svgPath = 'assets/contributions.svg';
  let svgContent = fs.readFileSync(svgPath, 'utf8');

  const doc = new DOMParser().parseFromString(svgContent, 'application/xml');
  const select = xpath.useNamespaces({ svg: 'http://www.w3.org/2000/svg' });
  const nodes = select("//*[@id='total-contributions']", doc);

  if (nodes.length > 0) {
    nodes[0].textContent = formatNumberWithCommas(totalContributions);
  }

  const updatedSvgContent = new XMLSerializer().serializeToString(doc);
  fs.writeFileSync(svgPath, updatedSvgContent);
}

async function main() {
  const totalContributions = await fetchTotalContributions();
  await updateSvg(totalContributions);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
