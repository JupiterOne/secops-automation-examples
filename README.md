# Example automation scripts using JupiterOne platform

This repo provides a few simple examples on how to maintain security/compliance
as code and to automate SecOps using the JupiterOne platform.

The examples are in either `bash` or `javascript`.

These scripts are provided as is. For questions, please post in the
[jupiterone-community #dev][1] Slack workspace.

## Contents

The following is a list of provided examples and their brief summary:

- **Security Assessments and Findings**

  WHERE: see [`/security-assessment`][2] in this repo

  WHAT: documenting manual security testing, assessments, and findings in code
  (YAML), and publish to JupiterOne graph for central reporting and
  visualization.

- **Security Assessment Reporting**

  WHERE: see [`/security-assessment-report`][3] in this repo

  WHAT: query for any assessment object from JupiterOne and its findings to
  generate a PDF document as output.

- **Third Party Vendors**

  WHERE: see [`/vendor-management`][4] in this repo

  WHAT: documenting details about each third party vendor in code (YAML),
  including security review status, vendor managers, who has access, etc.

- **Template for Security and Privacy Design**

  WHERE: see [`/security-privacy-design`][6] in this repo

  WHAT: a template that includes sections for security and privacy
  considerations for use with engineering team to integrate security early in
  the product/feature design phase.

- **Map Repo Dependencies**

  WHERE: see separate [`map-repo-dependencies`][7] repo

  WHAT: automation script that reads the package files (e.g. `package.json`) in
  your local code repos to create entities and relationships in your JupiterOne
  graph, so that you can query and visualize how your code depends on each other.

- **Detect and Alert on Specific PRs**

  WHERE: see separate [`bitbucket-pr-detector`][8] repo

  WHAT: detect particular kind of pull requests (for example, a RFC document for
  a new product feature that includes security and privacy considerations) and
  alert the security team about it.

- **Enforce Code Review and Security Policies in CI/CD**

  WHERE: see separate [`change-management-client`][9] repo

  WHAT: a package that can help you automate the enforcement of code review and
  security policies regarding pull request approval, author and reviewer
  validation, and vulnerability checks by collecting and analyzing data from the
  JupiterOne graph. For an example of its usage, check out the
  [`change-management-example`][10] repo.

## Example custom integrations for on-prem resources / internal operations

- **Discover local/on-prem devices using Nmap**

  WHERE: see [`graph-nmap`][12] repo

  WHAT: using `Nmap` to scan local networks to discover on-prem devices and
  create entities to push to JupiterOne graph.

- **Detect Leaked Secrets in Code**

  WHERE: see [`graph-gitleaks-findings`][5] repo

  WHAT: a tool using the `gitleaks` open source utility to automate detection of
  leaked secrets in your code repos and publish the findings to your JupiterOne
  graph for reporting and visualization.

- **Ingest Vuls.io Findings**

  WHERE: see [`graph-vuls-findings`][11] repo

  WHAT: a tool for ingesting the output of the `vuls` scan reports into JupiterOne
  graph for reporting and visualization.
  
- **Map DNS records to their targets via Shodan data**

  WHERE: see [`nslookup-shodan`][13] repo
  
  WHAT: An automation script to enrich the domain records mapping in a JupiterOne graph.
  Identifies domain records that do not already point to a known internal asset, discovers
  the asset via Shodan, and maps the record to the target host.

## Prerequisites and dependencies

For most of the examples and templates included in this repo, you will need
`jupiterone-client-nodejs`. It has been added as a dependency to this project.
You can also install it globally:

```bash
npm install @jupiterone/jupiterone-client-nodejs -g
```

You will need the following environment variables in your local `.env` file

```text
J1_ACCOUNT_ID=yourAccountId
J1_API_TOKEN=yourToken
```

[1]: https://jupiterone-community.slack.com/messages/CJMV4SFV5
[2]: ./security-assessment/README.md
[3]: ./security-assessment-report/README.md
[4]: ./vendor-management/README.md
[5]: https://github.com/JupiterOne/graph-gitleaks-findings
[6]: ./security-privacy-design/rfc-template.md
[7]: https://github.com/JupiterOne/map-repo-dependencies
[8]: https://github.com/JupiterOne/bitbucket-pr-detector
[9]: https://github.com/JupiterOne/change-management-client
[10]: https://github.com/JupiterOne/change-management-example
[11]: https://github.com/JupiterOne/graph-vuls-findings
[12]: https://github.com/JupiterOne/graph-nmap
[13]: https://github.com/JupiterOne/nslookup-shodan
