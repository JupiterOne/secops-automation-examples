# NPM Inventory Script

The intent of this script is to capture the NPM module dependency graph from the local `node_modules` folder of a code repository that is already represented in JupiterOne (say, via a GitHub or Bitbucket integration).

The script is intended to be used after `npm install` or `yarn install` has occurred locally, and will collect all of the direct dependencies for the coderepo, and insert them into the J1 graph like so:

```
CodeRepo --USES--> npm_package
```

Where the `USES` relationship will contain metadata about the dependency, like package version, and the `npm_package` entity will contain metadata including the license used by the dependency.

This script can be used to collect an inventory of NPM module dependencies seen and their licenses.

## Building

Install dependencies in the `npm-inventory` dir and build with:

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

Invoke the script with a fully-qualified path to the code repository directory you want to scan:

```
node ./dist/index.js /path/to/your/target/repo
```

### Running the script over a collection of repos

If you want to perform an exhaustive inventory, clone all of your target repos locally under `~/clone`, then consider using a simple script like:

```
#!/bin/bash
set -x
## NOTE: set this appropriately vv
NPMINV=/path/to/secops-automation-examples/npm-inventory

WORKDIR=~/clone
DONEDIR=~/clone-processed
REJECTDIR=~/clone-rejected

mkdir -p $DONEDIR $REJECTDIR

run() {
  while :; do
    cd $WORKDIR || exit 2
    REPOPATH="$(find $PWD -type d -maxdepth 1 -not -path $PWD | head -1)"
    if [ "$REPOPATH" = "" ]; then
      echo DONE
      exit 0
    fi
    cd $REPOPATH
    echo "Processing $REPOPATH..."
    yarn install
    if [ $? -ne 0 ]; then
      rejectrepo
      continue
    fi
    cd $NPMINV
    node ./dist/index.js $REPOPATH || exit 2
    rm -rf ${REPOPATH}/node_modules
    mv $REPOPATH $DONEDIR/$(basename $REPOPATH)
  done
}

rejectrepo() {
  cd $WORKDIR
  echo Rejecting failed repo: $REPOPATH
  mv $REPOPATH $REJECTDIR/$(basename $REPOPATH)
}

run
```
