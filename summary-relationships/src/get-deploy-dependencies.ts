import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { RepoDependencyMapping, RepoDependencyOutput } from './types';
import { union } from 'lodash';
import chalk from 'chalk';

require("dotenv").config();

const GITHUB_OWNER = 'JupiterOne';
const DEPLOY_DEPS_PATH = 'deploy/dependencies.yaml';
const DEPLOY_DEPS_REGEX = /(?<=  - ).*/g;

/*
 * Generates mapping between repositories and its dependencies by parsing the deploy/dependencies.yaml file.
 * Also, returns all repository names that are depended on to avoid rate limiting issues with j1Client.
*/
export async function getDeployDependencies(): Promise<RepoDependencyOutput> {
  
  //setup the github client
  const MyOctokit = Octokit.plugin(restEndpointMethods, paginateRest);
  const octokit = new MyOctokit({ auth: process.env.GITHUB_ACCESS_TOKEN }); 

  const response = await octokit.paginate(octokit.rest.repos.listForOrg, {
    org: GITHUB_OWNER,
    per_page: 100
  });
  if (response.length > 0) {
    let associations: RepoDependencyMapping[] = [];
    let depRepos: string[] = [];
    for (const repo of response) {
      console.log(chalk.white.bold(`Getting deploy dependencies for ${repo.name}...`));
      try {
        const contents = await octokit.rest.repos.getContent({
          owner: GITHUB_OWNER,
          repo: repo.name,
          path: DEPLOY_DEPS_PATH
        });
        if (contents.data['content']) {
          let bufferObj = Buffer.from(contents.data['content'], 'base64');
          const decodedString = bufferObj.toString('utf8');
          const dependencies: string[] = decodedString.match(DEPLOY_DEPS_REGEX);
          if (dependencies) {
            associations.push({
              repo: repo.name,
              dependencies: dependencies,
            });
            depRepos = union(depRepos, dependencies);
          }
        }
      } catch(err) {
        if (err.status === 404) {
          console.log(chalk.gray(`No deployment dependencies found for ${repo.name}`));
        } else {
          console.error(chalk.red(`Failed to get ${DEPLOY_DEPS_PATH} contents`, err));
        }
      }
    }

    return {
      dependencyRepos: depRepos,
      repoDependencyMappings: associations,
    };
  } else {
    console.log('No repos found');
  }
};