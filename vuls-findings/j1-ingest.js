#!/usr/bin/env node
require('dotenv').config()

const JupiterOneClient = require('@jupiterone/jupiterone-client-nodejs');
const { createEntities, toFindingEntities } = require('./util/j1Helpers');


function gatherConfig () {
  const config = {
    j1AccessToken: process.env.J1_ACCESS_TOKEN,
    j1Account: process.env.J1_ACCOUNT,
    dev: process.env.DEV
  };

  if ((config.j1AccessToken === undefined) || (config.j1Account === undefined)) {
    throw new Error("Missing value in config. Make sure env values are set properly");
  } 

  return config;
}


async function ingestData(data) {
  const config = gatherConfig();
  const j1Client = 
    await new JupiterOneClient({
      account: config.j1Account, 
      accessToken: config.j1AccessToken, 
      dev: (config.dev === 'true') 
    }).init();

  const newEntities = await toFindingEntities(data);

  createEntities(j1Client, newEntities);
}


async function run () {
  const stdin = process.openStdin();
  let data = "";

  stdin.on('data', function(chunk) {
    data += chunk;
  });

  stdin.on('end', function() {
    ingestData(data);
  });

}

run().catch(console.error);