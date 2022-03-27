# Automated CODEOWNERS Assignment

This script is intended to help with the consistent application of [GitHub
CODEOWNERS files][1] for an organization that may not already have these in
place across 100% of its code repositories.

It will examine each code repository in the org, and create a Pull Request
adding a CODEOWNERS file if one does not already exist, suggesting team
ownership based on commit authors from recent git history.

## Prerequisites

Create one or more GitHub Teams, if you haven't already, and add members to it.
Decide which team should own code repositories when no other teams can be
cleanly identified from git history (the "default" team).

## Configuration via Environment Variables

Copy the `.env.example` file to `.env` and edit it with your token, org, owner,
and default_team values.

| Environment Variable | Default Value | Description |
| -------------------- | ------------- | ----------- |
| `GITHUB_AUTH_TOKEN`  |               | Owner-level Personal Access Token (PAT) |
| `ORG`                | 'jupiterone'  | GitHub Org  |
| `OWNER`              | 'jupiterone'  | GitHub Owner |
| `DEFAULT_TEAM`       | 'engineering' | Team to assign by default |
| `RUNMODE`            | 'open_pulls'  | One of: 'open_pulls' or 'merge_pulls' |
| `ADOPTEDREPOS`       |               | Optional path to Adopted Repo JSON (see below) |
| `DEBUG`              | false         | Debug Mode |
| `SILENT`             | false         | Suppress all logs |
| `ERRLOG`             | 'error.log'   | Name of error output log |

## Installing Dependencies and Running the Script

```
cd codeowners-automation
npm install
node ./index.js
```

### Run Modes

#### `open_pulls` Mode

By default, the `RUNMODE` is set to 'open_pulls', and the script will create pull
requests for all repos without a CODEOWNERS file.

#### Optional Adopted Repos

Allow for manual assignment of code ownership (rather than automatic assignment
via repo history inspection) via the `ADOPTEDREPOS` variable.  This variable
should be set to a path to a JSON file in the following format:

```json
[
 {
   "repo": "db-service",
   "team": "engineering"
 },
 {
   "repo": "docs-publishing",
   "team": "support"
 },
 ...
]
```

One way to generate this file is to create a shared spreadsheet with the columns
(`repo, team`), and export this as CSV:

```csv
repo,team
db-service,engineering
docs-publishing, support
...
```

Then using an online utility like [convertcsv.com][2] or a CLI utility like
[csvtojson][3], save the converted file to, e.g. `./adoptedrepos.json`.

Invoke with a command like:

```
ADOPTEDREPOS=./adoptedrepos.json node ./index.js
```

#### `merge_pulls` Mode

If you'd like to automatically force-merge PRs previously opened with this automation,
you can override the RUNMODE at the command-line, or edit your `.env` file.

For example:
```
RUNMODE=merge_pulls node ./index.js
```

NOTE: This forced merging action is potentially sensitive, and will require
briefly disabling branch protection rules prior to merging, then enabling and
updating the branch-protection rules to include 'Require review from
CODEOWNERS'. You are advised to set `DEBUG=true` when using the 'merge_pulls'
`RUNMODE`, as this will write each repo's original branch protection rules to a
local file prior to modifying them.

[1]: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
[2]: https://www.convertcsv.com/csv-to-json.htm
[3]: https://www.npmjs.com/package/csvtojson#command-line-usage