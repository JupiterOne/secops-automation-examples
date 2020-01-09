# Jupiter-Vuls-Ingest

This project has the following goals:

- Ingest vulnerability reports from Vuls.io scans and insert them into JupiterOne


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* Node.js
* J1 Account
* J1 API Key
* Vuls installed and the ability to run `vuls scan`


### Installing

Export the following environment variables:

```
J1_ACCESS_TOKEN
J1_ACCOUNT

```

`J1_ACCOUNT` should be your JupiterOne `accountId`, which can be found by running the query `Find Account` in the JupiterOne console.

`J1_ACCESS_TOKEN` is a JupiterOne API key, which can be created in the JupiterOne console by going to the gear icon in the top-right,
then clicking `Users & Access`, then click the key icon and create an API key.

Then run:

1. `yarn install`

2. `vuls scan`

3. `vuls report -format-json`

4.  Find the artifact json file(s) created by Vuls. These are typically in a folder labeled `/results/current/`

5. Within the `/results/current/` directory, run `cat {filename}.json | node ~/{yourClonedDirectory}/j1-ingest.js`

5. The newly created entities are of class `Finding` and can be found through the query `Find vuls_finding`.

![](/images/example1.png)

The entity has the following properties:

 * cve (CVE identity)
 * serverName (distribution)
 * platform_name (cloud platform)
 * platform_instanceID (server id within cloud platform)
 * affectedPackages (packages on OS that are affected)
 * displayName (name of entity)
 * release (version of OS)
 * family (Linux family)
 * cvss (highest cvss3 score(or cvss2 if cvss3 isn't available) returned for the CVE from all vulnerability databases Vuls uses)
 * summary (summary of vulnerability)
 * severity (low, medium, high, or critical)


## Tests

We have included two sample Vuls json reports that were generated using the `vuls report -format-json` command. Feel free to use these to test the ingest process on a J1 test account by running `cat test/awslinux.json | node j1-ingest.js`

## Authors

* Jesse Kinser - Product Security
* Joe DiMarzio - Product Security

