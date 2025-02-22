const fs = require("fs");
const path = require("path");
const https = require("https");

const query = `
query userInfo($login: String!) {
  user(login: $login) {
    repositories(first: 100, orderBy: {direction: DESC, field: STARGAZERS}) {
      totalCount
      nodes {
        name
        pullRequests(first: 1) {
          totalCount
        }
      }
    }
  }
}
`;

async function fetchStats() {
  const options = {
    hostname: "api.github.com",
    path: "/graphql",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "Node.js",
    },
  };

  const data = JSON.stringify({
    query,
    variables: { login: "zahraejaz77" }, // Replace with your username
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function updateReadme() {
  const stats = await fetchStats();
  const totalPRs = stats.data.user.repositories.nodes.reduce(
    (acc, repo) => acc + repo.pullRequests.totalCount,
    0
  );

  let readme = fs.readFileSync("README.md", "utf8");

  // Add PR stats to your GitHub stats section
  const newStats = `<img src="https://github-readme-stats.vercel.app/api?username=zahraejaz77&hide_title=false&hide_rank=false&show_icons=true&include_all_commits=true&count_private=true&disable_animations=false&theme=dracula&locale=en&hide_border=false&show_prs=true" height="150" alt="stats graph"  />
  <div align="center">
    <p>Total Pull Requests: ${totalPRs}</p>
  </div>`;

  // Replace the existing stats section
  readme = readme.replace(
    /<img src="https:\/\/github-readme-stats\.vercel\.app\/api\?username=zahraejaz77[^>]+>/,
    newStats
  );

  fs.writeFileSync("README.md", readme);
}

updateReadme().catch(console.error);
