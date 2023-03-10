# Yarn to NPM script

This script will convert a project from yarn to npm. 

## Building

Install dependencies and build with:

```
npm install
```

## Running the script

You must set the following ENV vars:

```
GITHUB_AUTH_TOKEN=<your token here>
```

Run the script from within a temp directory

```
cameron@laptop Code % git clone git@github.com:JupiterOne/secops-automation-examples.git
cameron@laptop Code % mkdir tmpDir
cameron@laptop Code % cd tmpDir
cgriffin@cgriffin-MBP tmpDir % node ../secops-automation-examples/yarn2npm/yarn2npm.js test-aut-web-juno
```

A new branch will be created in the repo specified. Log files will be stored in a yarn2npm folder. Please remove these before
pushing changes to main. If there was a problem running npm install, a failure.lock will be present in the yarn2npm folder.
