# Example automation scripts using JupiterOne platform

This repo provides a few simple examples on how to maintain security/compliance
as code and to automate SecOps using the JupiterOne platform.

The examples are in either `bash` or `javascript`.

These scripts are provided as is. For questions, please post in the `#dev`
channel in `jupiterone-community` Slack workspace.

## Prerequisites and dependencies

You will need `jupiterone-client-nodejs`. It has been added as a dependency to
this project. You can also install it globally:

```bash
npm install @jupiterone/jupiterone-client-nodejs -g
```

## Documenting security assessment findings

`/security-assessment`

- Write your lightweight assessment report and findings in YAML
- Set up the following environment variables in your local `.env` file

  - `J1_ACCOUNT_ID`
  - `J1_API_TOKEN`

- Run `publish.sh` to upload the entities to your JupiterOne account
- See the results with a J1QL query like this:

  ```j1ql
  Find Assessment that identified (Risk|Finding) return tree
  ```

More information:

- https://support.jupiterone.io/hc/en-us/articles/360022721954-SecOps-Artifacts-as-Code

## Generating a PDF report from an assessment

`/security-assessment-report`
