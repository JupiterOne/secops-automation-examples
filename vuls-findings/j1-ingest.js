#!/usr/bin/env node
require('dotenv').config()

const JupiterOneClient = require('@jupiterone/jupiterone-client-nodejs');
const { createEntities, formEntities } = require('./util/j1Helpers');


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
  var j1Client = new JupiterOneClient({ account: config.j1Account, accessToken: config.j1AccessToken, dev: (config.dev === 'true') });
  j1Client = await j1Client.init();


  var entities = await formEntities(data);

  console.log(entities);

  createEntities(j1Client, entities);

}


async function run () {
  var stdin = process.openStdin();
  var data = "";

  stdin.on('data', function(chunk) {
    data += chunk;
  });

  stdin.on('end', function() {
    ingestData(data);
  });

}



run().catch(console.error);