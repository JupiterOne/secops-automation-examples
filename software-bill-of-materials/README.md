# NPM Software Bill-of-Materials (SBOM) Script

This script may be used to query J1 for `npm_package` entities (produced for example via the `npm-inventory` script in this repo), and from these generate a [CycloneDX-format](https://cyclonedx.org) SBOM file.

## Building

Install dependencies and build with:

```
yarn install
yarn build
```

## Running the script

You must set the following ENV vars:

```
J1_API_TOKEN=<your token here>
J1_ACCOUNT=<your J1 account id here>
```

Invoke the script and it will query J1 for all CodeModules, generating a local 'sbom.json' file.

```
node ./dist/index.js
```

Alternately, you may override the J1QL query that is used to find the `CodeModules` by passing it as a quoted argument, like so:

```
node ./dist/index.js "Find npm_package with version!=undefined and ..."
```

^^ This example invocation uses J1QL that limits modules to the type `npm_package`...

The script will produce a `sbom.json` file with zero or more components, based on the found packages in J1.
