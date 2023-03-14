const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

const ghToken = process.env.GITHUB_AUTH_TOKEN;
const octokit = github.getOctokit(ghToken);
const org = 'jupiterone';
const repo = process.argv.slice(2)[0];
const vulnReport = JSON.parse(fs.readFileSync(process.argv.slice(2)[1]));


const main = async () => {
  try {
    const codeAlerts = await octokit.request('GET /repos/{owner}/{repo}/dependabot/alerts{?severity,state}', {
      owner: org,
      repo:  repo,
      severity: 'CRITICAL',
      state: 'OPEN'
    })
    
    for (const alert of codeAlerts.data){
      for(var i = 0; i < vulnReport.length; i++)
        {
          if(vulnReport[i].cveName == alert.security_advisory.cve_id)
          {
            console.log(`${repo}, ${vulnReport[i].cveName}, ${vulnReport[i].epssScore}, ${vulnReport[i].cvssScore}, ${vulnReport[i].vulnerabilityScore}`);
          }
        }
    }
    
    return [];
  } 
  catch (err) {
    console.log(`error: ${err}`);
  }
}

main()