# Repo Vulnerability Scores

This script will pull critical vulnerabilities from repos in Github, compare it to the vulnerability report produced by j1labs, and provide a csv formatted output. 

## Building

Install dependencies and build with:

```
yarn install
```

## Running the script

You must set the following ENV vars:

```
GITHUB_AUTH_TOKEN=<your github token here>
```

### Download a copy of the vulnerability report from J1 Labs
(Contact Chasen Bettinger for access)
```
https://j1labs.net/
```

Run the script for a single repo
```
node repo-vulnscore.js some_repo vulnerability-prioritization-1234.json
```

For loop to process multiple repos
```
for i in $(cat repo_list.txt); do node repo-vulnscore.js $i vulnerability-prioritization-1234.json >> repo_vulnscores.csv; sleep 3; done
```

