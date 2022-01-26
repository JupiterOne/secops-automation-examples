# CycloneDX Ingestion Script

The intent of this script is to ingest `CodeRepo -USES-> CodeModule` graph data into JupiterOne.

The script is intended to be used after a `cyclonedx-bom` tool has generated a [CycloneDX](https://cyclonedx.org/)-format SBOM file representing the package dependencies for a given code repository. This script should work with any of the following projects:

* [CycloneDX NodeJS](https://github.com/CycloneDX/cyclonedx-node-module)
* [CycloneDX Go](https://github.com/CycloneDX/cyclonedx-gomod)
* [CycloneDX Python](https://github.com/CycloneDX/cyclonedx-python)
* [CycloneDX Rust](https://github.com/CycloneDX/cyclonedx-rust-cargo)
* [CycloneDX Java](https://github.com/CycloneDX/cyclonedx-core-java)
* [CycloneDX Ruby](https://github.com/CycloneDX/cyclonedx-ruby-gem)
* [CycloneDX PHP](https://github.com/CycloneDX/cyclonedx-php-composer)
* [CycloneDX .NET](https://github.com/CycloneDX/cyclonedx-dotnet)

Where the `USES` relationship will contain metadata about the dependency, like package version, and the `CodeModule` entity will contain metadata including the license used by the dependency.

This script can be used to collect an inventory of module dependencies seen and their licenses.

## Building

Install dependencies in the `ingest-cyclonedx-sbom` dir and build with:

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

### Suggested shell alias

`alias ingest-cyclonedx-sbom='node /path/to/security-automation-examples/ingest-cyclonedx-sbom/dist/index.js'`

### Usage

```
ingest-cyclonedx-sbom --sbom <path> --repo <string> [--devDeps <path>] [--directDeps <path>] [--directOnly]
  --sbom  path to sbom file to ingest
  --repo  name of coderepo ingest 
  (optional) --devDeps  path to json file array of dev dependencies
  (optional) --directDeps  path to json file array of direct dependencies
  (optional) --directOnly  only ingest direct dependencies (requires --directDeps)
```

### Example Invocation for an NPM project

```
cd /my/cloned/project/repo
yarn install # install dependencies 
cyclonedx-bom -d -o bom.json # generate full sbom including dev dependencies
# create optional hint arrays for ingestion
jq '.dependencies | keys' package.json > directDeps.json
jq '.devDependencies | keys' package.json > devDeps.json
ingest-cyclonedx-sbom --sbom ./bom.json --repo my-project --devDeps ./devDeps.json --directDeps ./directDeps.json
```
