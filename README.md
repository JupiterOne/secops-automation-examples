# Example automation scripts using JupiterOne platform

This repo provides a few simple examples on how to maintain security/compliance
as code and to automate SecOps using the JupiterOne platform.

The examples are in either `bash` or `javascript`.

These scripts are provided as is. For questions, please post in the
[jupiterone-community #dev][1] Slack workspace.

[1]: https://jupiterone-community.slack.com/messages/CJMV4SFV5

## Prerequisites and dependencies

You will need `jupiterone-client-nodejs`. It has been added as a dependency to
this project. You can also install it globally:

```bash
npm install @jupiterone/jupiterone-client-nodejs -g
```

You will need the following environment variables in your local `.env` file

```text
J1_ACCOUNT_ID=yourAccountId
J1_API_TOKEN=yourToken
```

## Documenting security assessment findings

`/security-assessment`

- Write your lightweight assessment report and findings in YAML
- Run `publish.sh` to upload the entities to your JupiterOne account
- See the results with a J1QL query like this:

  ```j1ql
  Find Assessment that identified (Risk|Finding) return tree
  ```

More information:

- https://support.jupiterone.io/hc/en-us/articles/360022721954-SecOps-Artifacts-as-Code

## Generating a PDF report from an assessment

`/security-assessment-report`

Run the following command from the above directory to generate a Markdown and a
PDF report of a security assessment by name, including all findings/risks
identified by the assessment.

```bash
export $(grep -v '^#' ../.env | xargs)
node generate-assessment-report.js --assessment 'name-of-the-assessment'
```

The `name-of-the-assessment` should match the value of `name` property of an
existing `Assessment` entity in your J1 account.