# Example automation scripts using JupiterOne platform

This repo provides several examples on how to maintain security/compliance
as code and to automate SecOps using the JupiterOne platform.

The examples are in either `bash` or `javascript/typescript`.

These scripts are provided as-is. For questions, please post in the
[jupiterone-community #dev][1] Slack workspace.

## Playbooks

* [Risk Management][21]: An opinionated guide on Risk Management using the JupiterOne platform.

## Folder Contents

The following is a list of provided examples and their brief summary:

| Automation                         | Folder                        | Description                                                      |
| ---------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **GitHub CODEOWNERS Creation**    | [`/github-codeowners`][14]    | Consistent creation of **CODEOWNERS files for your GitHub Org**. |
| **Ingest CycloneDX SBOM File**     | [`/ingest-cyclonedx-sbom`][15] | Ingest **`CodeRepo -USES-> CodeModule`** graph data into JupiterOne. |
| **Ingest Log4J Vulns**             | [`/ingest-log4j-vulns`][16]   | Ingests the output of **`log4shell_sentinel`**. Intended for distribution/deployment to all hosts in your environment that you would like to scan and remediate for **log4j vulnerabilities**. |
| **NPM Inventory**                  | [`/npm-inventory`][17]        | High-fidelity ingestion of **`CodeRepo -USES-> CodeModule`** graph data into JupiterOne, for NPM-specific repos. |
| **Security Assessment Reporting**     | [`/security-assessment-report`][3] | Query for any assessment object from JupiterOne and its findings to **generate a PDF document** as output. |
| **Security Assessments and Findings** | [`/security-assessment`][2]   | **Document** manual security testing, assessments, and **findings in code** (YAML), and publish to JupiterOne graph for reporting and visualization. |
| **Security Privacy Design RFC Template** | [`/security-privacy-design`][6] | **RFC Template** documenting security considerations at design-time. |
| **Generate SBOM from graph data** | [`/software-bill-of-materials`][18] | Utilize **`CodeRepo -USES-> CodeModule`** graph data to **create a CycloneDX SBOM** file. |
| **Summary Relationships** | [`/summary-relationships`][19] | Create **relationship shortcuts** that summarize complex IAM traversals to simplify queries. |
| **Third Party Vendors**               | [`/vendor-management`][4] | Documenting **details about third party vendor in code** (YAML), including security review status, vendor managers, who has access, etc. See also `vendor-stack` below. |


## Other useful integrations and custom automation utilties outside this Repo

| Utility/Integration                | Location                      | Description                                                      |
| ---------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **Map Repo Dependencies** | [`map-repo-dependencies`][7] | Ingest data from **NPM package files** (e.g. `package.json`) in your local code repos to create entities and relationships in your JupiterOne graph, so that you can query and **visualize your code repo dependencies**.
| **Detect and Alert on Specific PRs** | [`bitbucket-pr-detector`][8] | **Detect particular kind of pull requests** (for example, a RFC document for a new product feature that includes security and privacy considerations) and **alert the security team** about it. |
| **Enforce Code Review and Security Policies in CI/CD** | [`change-management-client`][9] | A package to **enforce code review and security policies** for pull request approval, author and reviewer validation, and vulnerability checks by collecting and analyzing data from the JupiterOne graph. For an example of its usage, check out the [`change-management-example`][10] repo. |
| **Discover local/on-prem devices using Nmap** | [`graph-nmap`][12] | Use **`Nmap`** to scan local networks to **discover on-prem devices** and create entities to push to JupiterOne graph. |
| **Detect Leaked Secrets in Code** | [`graph-gitleaks-findings`][5] | Use **`gitleaks`** to automate **detection of leaked secrets** in your code repos and publish the findings to your JupiterOne graph for reporting and visualization. |
| **Ingest Vuls.io Findings** | [`graph-vuls-findings`][11] | Ingest **`vuls`** scan reports into JupiterOne graph for reporting and visualization. |
| **Map DNS records to their targets via Shodan data** | [`nslookup-shodan`][13] | Use **shodan** to enrich the domain records mapping in a JupiterOne graph. Identifies domain records that do not already point to a known internal asset, discovers the asset via Shodan, and maps the record to the target host. |
| **Vendor Stack** | [`vendor-stack`][20] | A **library of common technology vendors** used by modern companies, and useful properties for each vendor. |


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
[14]: ./github-codeowners/README.md
[15]: ./ingest-cyclonedx-sbom/README.md
[16]: ./ingest-log4j-vulns/README.md
[17]: ./npm-inventory/README.md
[18]: ./software-bill-of-materials/README.md
[19]: ./summary-relationships/README.md
[20]: https://github.com/JupiterOne/vendor-stack
[21]: ./playbooks/risk-management.md
