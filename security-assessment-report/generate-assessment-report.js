'use strict';

const JupiterOneClient = require('@jupiterone/jupiterone-client-nodejs');
const program = require('commander');
const fs = require('fs');
const pdf = require("markdown-pdf");

const J1_USER_POOL_ID = process.env.J1_USER_POOL_ID;
const J1_CLIENT_ID = process.env.J1_CLIENT_ID;
const J1_ACCOUNT_ID = process.env.J1_ACCOUNT_ID;
const J1_API_TOKEN = process.env.J1_API_TOKEN;
const J1_USERNAME = process.env.J1_USERNAME;
const J1_PASSWORD = process.env.J1_PASSWORD;

async function main() {
  program
    .usage('[options]')
    .option('--assessment <name>', 'The name an assessment entity in J1.')
    .parse(process.argv);
  
  const j1Client =
    await (new JupiterOneClient({
      account: J1_ACCOUNT_ID,
      username: J1_USERNAME,
      password: J1_PASSWORD,
      poolId: J1_USER_POOL_ID,
      clientId: J1_CLIENT_ID,
      accessToken: J1_API_TOKEN
    })).init();
  
  const query = `Find Assessment with name='${program.assessment}'`;
  const assessments = await j1Client.queryV1(query);

  for (const a of assessments || []) {
    if (a.entity && a.properties) {
      const reportOverview = 
        `# ${a.entity.displayName}\n\n` + 
        `**Assessors**: ${a.properties.assessors}\n\n` +
        `**Completed On**: ${a.properties.completedOn}\n\n` +
        `## Overview\n\n` +
        `${a.properties.summary ? '### Summary\n\n' + a.properties.summary + '\n\n' : ''}` +
        `${a.properties.description ? '### Description\n\n' + a.properties.description + '\n\n' : ''}` +
        `${a.properties.details ? '### Details\n\n' + a.properties.details + '\n\n' : ''}`;
  
      const findingsQuery = `Find (Risk|Finding) that relates to Assessment with name='${program.assessment}'`;
      const findings = await j1Client.queryV1(findingsQuery);
      const reportFindings = [];

      if (findings && findings.length > 0) {
        reportFindings.push('## Findings\n\n');

        for (const f of findings) {
          if (f.entity && f.properties) {
            const findingDetails = [];
            Object.keys(f.properties).forEach(function(key, index) {
              findingDetails.push(
                `**${key}**:\n\n${f.properties[key]}\n\n`);
            });
            reportFindings.push(`### ${f.entity.displayName}\n\n`);
            reportFindings.push('`' + f.entity._type + '`\n\n');
            reportFindings.push(findingDetails.join(''));
          }
        }
      }
      
      const output = reportOverview + reportFindings.join('');

      const reportFilename = `report-${a.id}`;
      fs.writeFileSync(`./${reportFilename}.md`, output);
      pdf().from(`./${reportFilename}.md`).to(`./${reportFilename}.pdf`, function() {
        console.log(`Created Assessment Report: ${reportFilename}`);
      })
    }
  }
}

main();