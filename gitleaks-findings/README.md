# Ingest Gitleaks findings into JupiterOne

## Building the Docker image

Execute: `docker build . -t gitleaks-ingest`

## Running the Docker container

Create a file with the following values:

`gitleaks.env`

```
BITBUCKET_OAUTH_KEY=<your secret here>
BITBUCKET_OAUTH_SECRET=<your secret here>
BITBUCKET_SSH_PRIVATE_KEY=<your secret here>
BITBUCKET_ORGS_CSV="comma,separated,org-names"
GITHUB_ORGS_CSV="comma,separated,org-names"
J1_ACCESS_TOKEN=<your secret here>
J1_ACCOUNT=<your J1 account name here>
```

NOTE: the SSH private key secret must be base64-encoded, and may be generated via a command like:
`cat ~/.ssh/id_rsa | base64 -w 0` (non-wrapping output)

This SSH key must have read access to all Bitbucket repos, and should not require a passphrase (gitleaks does not support SSH keys requiring passphrases).

With this file in place, run:

`docker run --rm --env-file ./gitleaks.env gitleaks-ingest`

## Optional Environment Vars

You may optionally specify the following in your `gitleaks.env`:

```
BITBUCKET_REPOS_TO_SKIP_CSV='comma,separated,repo-names'
```

## Query JupiterOne Findings

Once ingested, you may view the findings via a queries like:

```
Find gitleaks_finding

Find gitleaks_finding with coderepo_type="github_repo" and severity!="low"

Find gitleaks_finding with coderepo_type="bitbucket_repo" as f return f.rule, f.webLink, f.line, f.commit, f.file, f.author
```

Additionally, you may find it useful to construct an Insights Dashboard "chart" widget with a query like:

```
Find gitleaks_finding with severity != 'low' as leak
return leak.repo as x, count(leak) as y
order by y desc limit 10
```